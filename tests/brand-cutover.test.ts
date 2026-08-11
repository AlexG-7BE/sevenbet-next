import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { profileEditorialDocument } from "../lib/casino-profile/presentation";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import { absoluteUrl, siteUrl } from "../lib/site";
import { enforceTemporaryDemoReviewOnly } from "../lib/services/public-casino.service";

const OLD_PUBLIC_BRAND = /SevenBet|SEVENBET/;

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("public source surfaces expose B4GAMBLE and no current SevenBet consumer copy", () => {
  const publicSources = [
    ...filesBelow("app/(public)"),
    ...filesBelow("app/program"),
    ...filesBelow("app/responsible-gambling"),
    ...filesBelow("components/public-shell"),
    ...filesBelow("components/home"),
    ...filesBelow("components/programme"),
    ...filesBelow("components/protected-help"),
    ...filesBelow("components/casino-discovery"),
    ...filesBelow("components/casino-profile"),
    ...filesBelow("components/comparison"),
    ...filesBelow("components/commercial-handoff"),
    "app/global-error.tsx",
    "app/layout.tsx",
    "app/llms.txt/route.ts",
    "lib/knowledge-center.ts",
    "lib/learning-center.ts",
    "lib/programme/contract.ts",
    "lib/responsible-gambling.ts",
    "lib/services/public-casino-discovery.service.ts",
    "lib/services/public-comparison.service.ts",
    "lib/services/public-offer.service.ts",
  ].filter((path) => /\.(?:ts|tsx)$/.test(path));
  const renderedSources = publicSources.map(source).join("\n");

  assert.match(renderedSources, /B4GAMBLE/);
  assert.doesNotMatch(renderedSources, OLD_PUBLIC_BRAND);

  const header = source("components/public-shell/PublicHeader.tsx");
  const navigation = source("components/public-shell/PublicNavigation.tsx");
  const footer = source("components/public-shell/PublicFooter.tsx");
  assert.match(header, /aria-label="B4GAMBLE home"/);
  assert.match(header, />\s*B4GAMBLE\s*</);
  assert.match(navigation, />B4GAMBLE<\/Link>/);
  assert.match(footer, />B4GAMBLE<\/Link>/);
  assert.match(footer, /Know your limits before you play\./);
  assert.match(source("lib/services/public-casino-discovery.service.ts"), /currentPublicCasinoBrand\(mapped\)/);
  assert.match(source("lib/services/public-comparison.service.ts"), /currentPublicCasinoBrand\(mapped\)/);
  assert.match(source("lib/services/public-offer.service.ts"), /currentPublicBrandText/);
});

test("root identity, legal trading name and approved contacts are exact", () => {
  const layout = source("app/layout.tsx");
  const home = source("app/(public)/page.tsx");
  assert.match(layout, /default: "B4GAMBLE \| Know your limits before you play"/);
  assert.match(layout, /siteName: "B4GAMBLE"/);
  assert.match(layout, /name: "B4GAMBLE"/);
  assert.match(layout, /Educational tools, private self-checks and transparent casino comparison/);
  assert.match(home, /Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play\./);

  for (const path of ["app/(public)/privacy/page.tsx", "app/(public)/terms/page.tsx"]) {
    const legal = source(path);
    assert.match(legal, /7BE Inc\., trading as B4GAMBLE/);
    assert.match(legal, /447 Broadway, 2nd Floor, 1663/);
    assert.match(legal, /New York, NY 10013/);
    assert.doesNotMatch(legal, /Suite 1663/);
  }
  assert.match(source("app/(public)/privacy/page.tsx"), /privacy@7be\.io/);
  const terms = source("app/(public)/terms/page.tsx");
  assert.match(terms, /info@7be\.io/);
  assert.match(terms, /effective="7 August 2026" updated="9 August 2026"/);
  assert.match(terms, /id: "about-b4gamble"/);
  assert.doesNotMatch(terms, /id: "about-sevenbet"/);
});

test("Production-style canonical, robots and sitemap output use b4gamble.com", async () => {
  assert.equal(siteUrl, "https://b4gamble.com");
  assert.equal(absoluteUrl("/privacy"), "https://b4gamble.com/privacy");
  assert.deepEqual(robots(), {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"],
        allow: "/",
      },
    ],
    sitemap: "https://b4gamble.com/sitemap.xml",
    host: "https://b4gamble.com",
  });

  const entries = await sitemap();
  assert.ok(entries.length > 10);
  for (const entry of entries) {
    assert.match(entry.url, /^https:\/\/b4gamble\.com(?:\/|$)/);
    assert.doesNotMatch(entry.url, /sevenbet-next\.vercel\.app/);
  }
});

test("Better Auth and disabled communication templates expose only B4GAMBLE", () => {
  const auth = source("lib/auth/config.ts");
  const templates = source("lib/communications/templates.ts");
  assert.match(auth, /appName: "B4GAMBLE"/);
  assert.doesNotMatch(auth.slice(auth.indexOf("return betterAuth")), OLD_PUBLIC_BRAND);
  assert.match(templates, /B4GAMBLE account security notice/);
  assert.match(templates, /requested B4GAMBLE Programme reminder/);
  assert.match(templates, /quiet reminder from your B4GAMBLE Programme/);
  assert.doesNotMatch(templates, OLD_PUBLIC_BRAND);
  assert.match(source("lib/communications/purpose-policy.ts"), /COMMERCIAL_MARKETING/);
  assert.match(source("lib/communications/transports.ts"), /DisabledEmailTransport/);
});

test("exact demo presentation reconciles legacy stored brand text without changing fixture identity", () => {
  const casinoId = temporaryDemoCasinoIds[0];
  const mapped = mapPublishedCasino({
    casinoId,
    version: 1,
    status: "PUBLISHED",
    publishedAt: new Date("2026-08-09T00:00:00.000Z"),
    archivedAt: null,
    snapshot: {
      id: casinoId,
      slug: "demo-brand-cutover",
      title: "Demo Brand Cutover",
      domain: "demo.invalid",
      status: "PUBLISHED",
      summary: "A fictional SevenBet demonstration.",
      description: "SevenBet editorial presentation only.",
      operator: "Fictional SevenBet Demo Studio",
      pros: ["SevenBet presentation strength"],
      cons: ["SevenBet presentation limitation"],
      responsibleGamblingTools: ["Protected SevenBet Help remains available"],
      seo: {
        title: "Demo | SevenBet",
        description: "SevenBet demonstration metadata.",
        socialTitle: "SEVENBET DEMO",
        socialDescription: "A SevenBet social description.",
      },
      casinoBonuses: [{
        id: "demo-bonus",
        slug: "demo-bonus",
        title: "SevenBet demo terms",
        summary: "SevenBet demonstration only",
        status: "PUBLISHED",
        offerStatus: "ACTIVE",
        importantConditions: ["SevenBet fixture condition"],
      }],
    },
  }, [], { redirectEnabled: false, now: new Date("2026-08-09T00:00:00.000Z") });
  assert.ok(mapped);
  const presented = enforceTemporaryDemoReviewOnly(mapped);
  assert.equal(presented.id, casinoId);
  assert.equal(presented.slug, "demo-brand-cutover");
  assert.equal(presented.affiliate.available, false);
  assert.doesNotMatch(JSON.stringify(presented), OLD_PUBLIC_BRAND);
  assert.match(JSON.stringify(presented), /B4GAMBLE/);

  const editorial: CasinoEditorialDocument = {
    version: 1,
    title: "SevenBet demo editorial",
    summary: "SevenBet demo summary",
    author: "SevenBet Demo Editorial Team",
    sections: [{ id: "overview", kind: "overview", title: "SevenBet overview", order: 1, blocks: [{ id: "copy", type: "paragraph", text: "SevenBet demonstration copy" }] }],
    relatedCasinoIds: [],
    seo: { title: "SevenBet demo SEO", description: "SevenBet demo description" },
  };
  const normalized = profileEditorialDocument({
    review: { publishedRevisionId: "revision", revisions: [{ id: "revision", content: editorial }] },
  } as never, casinoId);
  assert.ok(normalized);
  assert.doesNotMatch(JSON.stringify(normalized), OLD_PUBLIC_BRAND);
});

test("legacy compatibility identifiers and data architecture remain intact", () => {
  const environment = source(".env.example");
  assert.match(environment, /SEVENBET_ACCOUNT_EMAIL_FROM/);
  assert.match(environment, /SEVENBET_PROGRAMME_EMAIL_FROM/);
  assert.match(environment, /SEVENBET_EMAIL_REPLY_TO/);
  assert.match(source("lib/programme/access-contract.ts"), /x-sevenbet-age-attestation/);
  assert.match(source("lib/programme/local-subject-storage.ts"), /sevenbet\.programme\./);
  assert.equal(JSON.parse(source("package.json")).name, "sevenbet-next");

  const changed = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const schemaChanges = changed
    .filter((path) => path === "prisma/schema.prisma" || /^prisma\/(?:migrations|preflight)\//.test(path))
    .sort();
  if (schemaChanges.length > 0) {
    assert.deepEqual(schemaChanges, [
      "prisma/migrations/0019_programme_runtime_hardening/migration.sql",
      "prisma/preflight/0019_programme_runtime_hardening.sql",
      "prisma/schema.prisma",
    ]);
  }
  if (changed.includes("package-lock.json")) {
    assert.equal(JSON.parse(source("package.json")).dependencies["@vercel/analytics"], "2.0.1");
  }
});

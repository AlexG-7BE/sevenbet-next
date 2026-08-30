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
import { absoluteUrl, resolveSiteUrl, siteUrl } from "../lib/site";
import { enforceTemporaryDemoReviewOnly } from "../lib/services/public-casino.service";
import { publicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { publicComparisonService } from "../lib/services/public-comparison.service";
import { publicOfferService } from "../lib/services/public-offer.service";

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
    ...filesBelow("app/help"),
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
  const shellCatalog = source("lib/i18n/public-shell-catalog.ts");
  assert.match(header, /aria-label=\{messages\.homeLabel\}/);
  assert.match(shellCatalog, /homeLabel: "B4GAMBLE home"/);
  assert.match(header, />\s*B4GAMBLE\s*</);
  assert.match(navigation, />B4GAMBLE<\/Link>/);
  assert.match(footer, />B4GAMBLE<\/Link>/);
  assert.match(footer, /\{footer\.description\}[\s\S]*\{footer\.operatorDisclaimer\}/);
  assert.match(footer, /\{footer\.financialRisk\}/);
  assert.match(footer, /\{footer\.commissionDisclosure\}/);
  assert.match(shellCatalog, /description: "Information, comparison and education\."/);
  assert.match(shellCatalog, /operatorDisclaimer: "Not a gambling operator\."/);
  assert.match(shellCatalog, /financialRisk: "Gambling involves financial risk\."/);
  assert.match(shellCatalog, /clearly labelled affiliate links/);
  assert.match(source("lib/services/public-casino-discovery.service.ts"), /currentPublicCasinoBrand\(mapped\)/);
  assert.match(source("lib/services/public-comparison.service.ts"), /currentPublicCasinoBrand\(mapped\)/);
  assert.match(source("lib/services/public-offer.service.ts"), /currentPublicBrandText/);
});

test("staff UI and generated demonstration assets expose only B4GAMBLE branding", () => {
  const staffAndDemoSources = [
    ...filesBelow("app/admin"),
    ...filesBelow("components/admin"),
    ...filesBelow("public/demo-casinos"),
    "lib/cms/seed.ts",
    "lib/auth/staff.ts",
    "scripts/generate-temporary-demo-assets.mjs",
    "scripts/temporary-production-demo-casino.manifest.ts",
    "scripts/temporary-production-demo-casinos.ts",
    "app/editorial-preview/[token]/page.tsx",
  ].filter((path) => /\.(?:ts|tsx|mjs|svg)$/.test(path));
  const renderedSources = staffAndDemoSources.map(source).join("\n");

  assert.match(renderedSources, /B4GAMBLE/);
  assert.doesNotMatch(renderedSources, OLD_PUBLIC_BRAND);
  assert.match(source("components/admin/AdminShell.tsx"), /\/admin\/program-settings/);
  assert.match(source("app/admin/layout.tsx"), /index: false, follow: false/);
  assert.doesNotMatch(source("components/ProgramExperience.tsx"), /The SevenBet 10-Step Control Program/);
});

test("root identity, legal trading name and approved contacts are exact", () => {
  const layout = source("app/layout.tsx");
  const home = source("app/(public)/page.tsx");
  const homeCatalog = source("lib/i18n/home-catalog.ts");
  const icon = source("app/icon.svg");
  assert.match(layout, /default: "B4GAMBLE \| Know your limits before you play"/);
  assert.match(layout, /siteName: "B4GAMBLE"/);
  assert.match(layout, /name: "B4GAMBLE"/);
  assert.match(layout, /Educational tools, private self-checks and transparent casino comparison/);
  assert.match(home, /homeMetadata\(presentation\.locale\)/);
  assert.match(homeCatalog, /Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play\./);
  assert.match(icon, /<svg/);
  assert.match(icon, /fill="#ccff00"/);
  assert.match(icon, /fill="#100f0f"/);

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
  assert.match(terms, /effective="19 August 2026"/);
  assert.match(terms, /updated="19 August 2026"/);
  assert.match(terms, /id: "about-b4gamble"/);
  assert.doesNotMatch(terms, /id: "about-sevenbet"/);
});

test("Production-style canonical, robots and sitemap output use b4gamble.com", async () => {
  assert.equal(siteUrl, "https://b4gamble.com");
  assert.equal(resolveSiteUrl({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://sevenbet-next.vercel.app" }), "https://b4gamble.com");
  assert.equal(resolveSiteUrl({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://attacker.invalid" }), "https://b4gamble.com");
  assert.equal(resolveSiteUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "audit.example.vercel.app", NEXT_PUBLIC_SITE_URL: "https://sevenbet-next.vercel.app" }), "https://b4gamble.com");
  assert.equal(resolveSiteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "attacker.invalid", NEXT_PUBLIC_SITE_URL: "https://attacker.invalid" }), "https://b4gamble.com");
  assert.equal(absoluteUrl("/privacy"), "https://b4gamble.com/privacy");
  const publicAuthority = source("lib/site.ts");
  assert.doesNotMatch(publicAuthority, /VERCEL_BRANCH_URL|VERCEL_URL/);
  assert.match(source("lib/auth/runtime-config.ts"), /VERCEL_BRANCH_URL/);
  const contact = source("app/(public)/contact/page.tsx");
  assert.match(contact, /absoluteUrl\(productCanonicalPath\(presentation, "\/contact"\)\)/);
  assert.doesNotMatch(contact, /https:\/\/b4gamble\.com\/contact/);
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

  const originalDiscover = publicCasinoDiscoveryService.discover;
  const originalBestOffers = publicOfferService.getBestOffersPageData;
  const originalBonusSearch = publicOfferService.searchOffers;
  const originalCompare = publicComparisonService.compare;
  publicCasinoDiscoveryService.discover = async () => ({
    items: [], total: 0, page: 1, pageSize: 48, pageCount: 0,
    inventoryMode: "DEMO_ONLY",
  }) as unknown as Awaited<ReturnType<typeof originalDiscover>>;
  publicOfferService.getBestOffersPageData = async () => ({
    status: "unavailable", inventoryMode: "UNAVAILABLE",
  }) as Awaited<ReturnType<typeof originalBestOffers>>;
  publicOfferService.searchOffers = async () => ({
    records: [], total: 0, page: 1, pageSize: 1, pageCount: 0,
    query: {} as never, facets: {} as never, inventoryMode: "UNAVAILABLE",
  }) as Awaited<ReturnType<typeof originalBonusSearch>>;
  publicComparisonService.compare = async () => ({
    status: "unavailable", inventoryMode: "UNAVAILABLE",
  }) as unknown as Awaited<ReturnType<typeof originalCompare>>;
  let entries: Awaited<ReturnType<typeof sitemap>>;
  try {
    entries = await sitemap();
  } finally {
    publicCasinoDiscoveryService.discover = originalDiscover;
    publicOfferService.getBestOffersPageData = originalBestOffers;
    publicOfferService.searchOffers = originalBonusSearch;
    publicComparisonService.compare = originalCompare;
  }
  assert.ok(entries.length > 10);
  assert.ok(entries.some((entry) => entry.url === "https://b4gamble.com/10-steps"));
  assert.ok(entries.every((entry) => !temporaryDemoCasinoIds.some((id) => entry.url.includes(id))));
  assert.ok(entries.every((entry) => !/\/casino\/demo-/.test(entry.url)));
  assert.ok(entries.every((entry) => !["https://b4gamble.com/casinos", "https://b4gamble.com/bonuses"].includes(entry.url)));
  for (const entry of entries) {
    assert.match(entry.url, /^https:\/\/b4gamble\.com(?:\/|$)/);
    assert.doesNotMatch(entry.url, /sevenbet-next\.vercel\.app/);
  }
});

test("sitemap keeps final static and learning routes when casino discovery throws", async () => {
  const originalDiscover = publicCasinoDiscoveryService.discover;
  const originalBestOffers = publicOfferService.getBestOffersPageData;
  const originalBonusSearch = publicOfferService.searchOffers;
  publicCasinoDiscoveryService.discover = async () => { throw new Error("discovery unavailable"); };
  publicOfferService.getBestOffersPageData = async () => ({
    status: "available", records: [], inventoryMode: "PUBLISHED_ONLY",
  }) as Awaited<ReturnType<typeof originalBestOffers>>;
  publicOfferService.searchOffers = async () => ({
    records: [], total: 0, page: 1, pageSize: 1, pageCount: 0,
    query: {} as never, facets: {} as never, inventoryMode: "UNAVAILABLE",
  }) as Awaited<ReturnType<typeof originalBonusSearch>>;

  let entries: Awaited<ReturnType<typeof sitemap>>;
  try {
    entries = await sitemap();
  } finally {
    publicCasinoDiscoveryService.discover = originalDiscover;
    publicOfferService.getBestOffersPageData = originalBestOffers;
    publicOfferService.searchOffers = originalBonusSearch;
  }

  const urls = entries.map((entry) => entry.url);
  assert.ok(urls.includes("https://b4gamble.com/10-steps"));
  assert.ok(urls.includes("https://b4gamble.com/learn"));
  assert.ok(urls.some((url) => url.startsWith("https://b4gamble.com/learn/") && url !== "https://b4gamble.com/learn/"));
  assert.ok(urls.includes("https://b4gamble.com/responsible-gambling"));
  assert.ok(urls.includes("https://b4gamble.com/help"));
  assert.ok(!urls.some((url) => url.startsWith("https://b4gamble.com/help/")));
  for (const educationalHelpPath of ["budgeting", "time-management", "bonus-terms", "casino-licenses", "payment-safety", "faq"]) {
    assert.ok(!urls.includes(`https://b4gamble.com/help/${educationalHelpPath}`));
  }
  assert.ok(urls.includes("https://b4gamble.com/learn/responsible-gambling/responsible-gambling-tools"));
  assert.ok(urls.includes("https://b4gamble.com/learn/casino-bonuses/welcome-bonus-terms"));
  assert.ok(urls.includes("https://b4gamble.com/learn/licensing/casino-licenses-explained"));
  assert.ok(urls.includes("https://b4gamble.com/learn/payments/casino-payment-methods"));
  assert.ok(urls.includes("https://b4gamble.com/best-offers"));
  assert.ok(!urls.includes("https://b4gamble.com/compare"));
  assert.ok(urls.every((url) => !url.startsWith("https://b4gamble.com/casino/")));
  assert.ok(urls.every((url) => !["https://b4gamble.com/casinos", "https://b4gamble.com/bonuses"].includes(url)));
});

test("home-only canonical and social metadata do not leak into auth, outbound or admin routes", () => {
  const root = source("app/layout.tsx");
  const home = source("app/(public)/page.tsx");
  assert.doesNotMatch(root, /alternates:\s*\{\s*canonical/);
  assert.match(root, /"@type": "Organization"[\s\S]*url: absoluteUrl\("\/"\)/);
  assert.match(home, /const canonicalPath = presentation\.source === "EXPLICIT_ROUTE"/);
  assert.match(home, /const canonical = absoluteUrl\(canonicalPath\)/);
  assert.match(home, /alternates: \{ canonical \}/);
  assert.match(home, /url: canonical/);
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
    const approvedExactSchemaChangeSets = [
      ["prisma/migrations/0020_commercial_ops_01/migration.sql", "prisma/schema.prisma"],
      ["prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql", "prisma/schema.prisma"],
      ["prisma/migrations/0022_better_auth_17_schema_upgrade/migration.sql", "prisma/schema.prisma"],
      ["prisma/migrations/0023_mcp_dcr_runtime_compat_fix/migration.sql"],
    ];
    assert.ok(approvedExactSchemaChangeSets.some(
      (approved) => JSON.stringify(schemaChanges) === JSON.stringify(approved),
    ));
  }
  if (changed.includes("package-lock.json")) {
    assert.equal(JSON.parse(source("package.json")).dependencies["@vercel/analytics"], undefined);
    assert.doesNotMatch(source("package-lock.json"), /node_modules\/@vercel\/analytics/);
  }
});

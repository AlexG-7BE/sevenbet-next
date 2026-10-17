import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { helpSitemap, mainSitemap } from "../app/sitemap";
import { PRODUCTION_AUTH_HOSTS, PRODUCTION_AUTH_ORIGINS, resolveBetterAuthRuntimeConfig } from "../lib/auth/runtime-config";
import { PRODUCTION_CANONICAL_ORIGIN } from "../lib/auth/runtime-canonical-host";
import { articleLanguageAlternates, storedCanonicalUrl } from "../lib/articles/article-seo";
import { productLanguageAlternates, productMetadata } from "../lib/market/product-context";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { HELP_INDEXNOW_KEY, indexNowKeyPath, indexNowPayload, indexNowPayloadsByHost, INDEXNOW_KEY } from "../lib/seo/indexnow";
import { programmeSearchMetadata } from "../lib/seo/programme-metadata";
import { openGraphImagesForSite } from "../lib/seo/social-image";
import {
  editorialAuthor,
  organizationReference,
  organizationSchema,
  websiteSchema,
} from "../lib/seo/structured-data";
import { absoluteUrl, coreRoutes, helpUrl, originForSite, resolveHelpSiteUrl, siteUrl } from "../lib/site";
import {
  coreRoutesForSite,
  HELP_LEARN_CATEGORY,
  learnArticleOrigin,
  learnArticleSite,
  learnCategoryBelongsToSite,
  publicLearnOrigins,
} from "../lib/site/core-routes";
import { HELP_CANONICAL_ORIGIN, HELP_SITE_NAME } from "../lib/site/host-gate";
import { classifyRoutePath } from "../lib/site/host-routes";

const read = (path: string) => readFileSync(path, "utf8");

/**
 * RFC-057 §8–§16.2, the per-host origins pull request of phase 1. Everything here is dark:
 * with `HELP_SITE_SERVING` and `HELP_SITE_REDIRECTS` unset, every function below answers for
 * the main site exactly as it did before, which is what most of these assertions check.
 */

test("one origin per site: the help origin is a source constant and the default is unchanged", () => {
  assert.equal(siteUrl, "https://b4gamble.com");
  assert.equal(helpUrl, HELP_CANONICAL_ORIGIN);
  assert.equal(helpUrl, "https://pauseplan.help");
  assert.equal(originForSite(), siteUrl);
  assert.equal(originForSite("main"), siteUrl);
  assert.equal(originForSite("help"), helpUrl);

  // The one-argument form is the main site, so every call site that has not been converted
  // keeps today's behaviour.
  assert.equal(absoluteUrl("/privacy"), "https://b4gamble.com/privacy");
  assert.equal(absoluteUrl("/privacy", "main"), "https://b4gamble.com/privacy");
  assert.equal(absoluteUrl("/privacy", "help"), "https://pauseplan.help/privacy");
  assert.equal(absoluteUrl("privacy", "help"), "https://pauseplan.help/privacy");

  // No environment value names an origin in Production or Preview (§3).
  for (const environment of [
    { VERCEL_ENV: "production", HELP_SITE_DEV_HOST: "attacker.invalid" },
    { VERCEL_ENV: "preview", HELP_SITE_DEV_HOST: "attacker.invalid" },
    { VERCEL_ENV: "production" },
  ]) {
    assert.equal(resolveHelpSiteUrl(environment), HELP_CANONICAL_ORIGIN);
  }
  // A local two-host run builds help URLs on the host middleware serves them from.
  assert.equal(resolveHelpSiteUrl({ HELP_SITE_DEV_HOST: "help.localhost:4173" }), "http://help.localhost:4173");
  assert.equal(resolveHelpSiteUrl({ HELP_SITE_DEV_HOST: "https://help.localhost" }), HELP_CANONICAL_ORIGIN, "a value that is not a bare host is ignored");
  assert.equal(resolveHelpSiteUrl({}), HELP_CANONICAL_ORIGIN);
});

test("the sitemap's core routes are split by route class, and nothing is listed by two hosts", () => {
  const helpRoutes = coreRoutesForSite("help", true);
  for (const route of helpRoutes) {
    const siteClass = classifyRoutePath(route || "/");
    assert.ok(siteClass === "HELP" || siteClass === "SHARED", `${route || "/"} is ${siteClass}`);
  }
  for (const route of ["/10-steps", "/program", "/pause-plan", "/beside", "/responsible-gambling", "/help", ""]) {
    assert.ok(helpRoutes.includes(route), `the help sitemap lists ${route || "/"}`);
  }
  for (const route of ["/casinos", "/about", "/faq", "/methodology", "/for-creators", "/can-you-trust-b4gamble", "/bonus-guide"]) {
    assert.ok(!helpRoutes.includes(route), `the help sitemap never lists ${route}`);
  }

  // Before the move the main sitemap is exactly today's list.
  assert.deepEqual(coreRoutesForSite("main", false), [...coreRoutes]);
  // From the deployment that starts the 301s it loses every HELP route, in the same breath.
  const movedAway = coreRoutesForSite("main", true);
  for (const route of helpRoutes) {
    if (classifyRoutePath(route || "/") !== "HELP") continue;
    assert.ok(!movedAway.includes(route), `${route} leaves the main sitemap when the 301s start`);
  }
  assert.ok(movedAway.includes("/casinos") === coreRoutes.includes("/casinos"));
  assert.ok(movedAway.includes("/about"));
});

test("the help sitemap holds only help-origin URLs, and the main one is unchanged while the switches are off", async () => {
  const help = await helpSitemap();
  assert.ok(help.length > 0);
  for (const entry of help) {
    assert.ok(entry.url.startsWith(`${HELP_CANONICAL_ORIGIN}/`), entry.url);
    assert.doesNotMatch(entry.url, /b4gamble\.com/);
    assert.doesNotMatch(entry.url, /\/casinos|\/bonuses|\/best-offers|\/casino\/|\/compare|\/about|\/faq|\/methodology/);
  }
  assert.ok(help.some((entry) => entry.url === `${HELP_CANONICAL_ORIGIN}/en/pause-plan`), "the pause plan is listed");

  const main = await mainSitemap();
  for (const entry of main) {
    assert.ok(entry.url.startsWith(`${PRODUCTION_CANONICAL_ORIGIN}/`), entry.url);
    assert.doesNotMatch(entry.url, /pauseplan\.help/);
  }
  // With HELP_SITE_REDIRECTS off the main sitemap still carries its help routes (phase 1 is dark).
  assert.ok(main.some((entry) => entry.url === `${PRODUCTION_CANONICAL_ORIGIN}/en/pause-plan`));
});

test("hreflang, canonicals and the share image follow the host that answered", () => {
  const alternates = productLanguageAlternates("/pause-plan", "help");
  assert.ok(Object.keys(alternates).length >= 2);
  for (const url of Object.values(alternates)) assert.match(url, /^https:\/\/pauseplan\.help\//);
  for (const url of Object.values(productLanguageAlternates("/pause-plan"))) assert.match(url, /^https:\/\/b4gamble\.com\//);

  const presentation = resolvePresentationContext({ routeLanguage: "en" });
  const main = productMetadata({ presentation, pathname: "/pause-plan", title: "t", description: "d" });
  const help = productMetadata({ presentation, pathname: "/pause-plan", title: "t", description: "d", site: "help" });
  assert.equal(main.alternates?.canonical, absoluteUrl("/en/pause-plan"));
  assert.equal(help.alternates?.canonical, absoluteUrl("/en/pause-plan", "help"));
  assert.equal(main.openGraph?.siteName, "B4GAMBLE");
  assert.equal(help.openGraph?.siteName, HELP_SITE_NAME);
  // The default share image is COMMERCIAL and 404s on the help host, so a help page names no
  // image at all until the help share image of §8 lands with the shell.
  assert.equal(openGraphImagesForSite("help"), undefined);
  assert.ok((openGraphImagesForSite("main") ?? []).length === 1);
  assert.equal(help.openGraph?.images, undefined);
  assert.doesNotMatch(JSON.stringify(help), /b4gamble\.com/);

  const programme = programmeSearchMetadata("sv-SE", { title: "t", description: "d" }, { site: "help" });
  assert.equal(programme.alternates?.canonical, absoluteUrl("/sv/program", "help"));
  assert.doesNotMatch(JSON.stringify(programme), /b4gamble\.com/);

  const guide = { category: "responsible-gambling", slug: "spelpaus", locale: "sv-SE" } as const;
  for (const url of Object.values(articleLanguageAlternates(guide, "help"))) assert.match(url, /^https:\/\/pauseplan\.help\//);
  for (const url of Object.values(articleLanguageAlternates(guide))) assert.match(url, /^https:\/\/b4gamble\.com\//);
});

test("structured data prints one identity per site, with no B4GAMBLE mark on the help host", () => {
  const main = organizationSchema();
  assert.equal(main.name, "B4GAMBLE");
  assert.equal(main.url, siteUrl);
  assert.equal(main["@id"], `${siteUrl}/#organization`);
  assert.ok(main.logo);

  const help = organizationSchema("help");
  assert.equal(help.name, HELP_SITE_NAME);
  assert.equal(help.url, HELP_CANONICAL_ORIGIN);
  assert.equal(help["@id"], `${HELP_CANONICAL_ORIGIN}/#organization`);
  // Q2: no wordmark, no alias, no brand profile and no B4GAMBLE logo on the help site. The
  // legal name stays, because /who-runs-this names the owner honestly either way.
  assert.equal(help.legalName, "7BE Inc.");
  assert.equal(help.logo, undefined);
  assert.equal(help.alternateName, undefined);
  assert.equal(help.sameAs, undefined);
  for (const node of [help, websiteSchema("help"), organizationReference("help"), editorialAuthor("help")]) {
    assert.doesNotMatch(JSON.stringify(node), /b4gamble|B4GAMBLE/i, JSON.stringify(node));
  }
  assert.equal(websiteSchema("help").publisher["@id"], `${HELP_CANONICAL_ORIGIN}/#organization`);
  // The main site's nodes are untouched.
  assert.equal(organizationReference().url, siteUrl);
  assert.equal(editorialAuthor().name, "B4GAMBLE Editorial");
});

test("IndexNow: each host announces its own URLs with its own key file", () => {
  assert.notEqual(HELP_INDEXNOW_KEY, INDEXNOW_KEY);
  assert.match(HELP_INDEXNOW_KEY, /^[0-9a-f]{32}$/);
  assert.equal(indexNowKeyPath(), `/${INDEXNOW_KEY}.txt`);
  assert.equal(indexNowKeyPath("help"), `/${HELP_INDEXNOW_KEY}.txt`);
  // Each key file is served on its own host only, so neither domain can be joined to the
  // other by a shared key (§12).
  assert.equal(classifyRoutePath(`/${INDEXNOW_KEY}.txt`), "COMMERCIAL");
  assert.equal(classifyRoutePath(`/${HELP_INDEXNOW_KEY}.txt`), "HELP");

  // A `HELP` route is served on the main host until phase 3 and answers a 301 after it, and
  // either would join the two domains for anyone who fetched the key file there, so the help
  // key route refuses every host but its own and is kept out of the phase-3 301 list.
  const helpKeyRoute = read(`app/${HELP_INDEXNOW_KEY}.txt/route.ts`);
  assert.match(helpKeyRoute, /if \(await resolveServerSite\(\) !== "help"\) \{\n\s+return new Response\(null, \{ status: 404/);
  assert.match(helpKeyRoute, /export const dynamic = "force-dynamic";/);

  const payload = indexNowPayload(["https://pauseplan.help/sv/pause-plan", "https://b4gamble.com/en/casinos"], "help");
  assert.deepEqual(payload, {
    host: "pauseplan.help",
    key: HELP_INDEXNOW_KEY,
    keyLocation: `https://pauseplan.help/${HELP_INDEXNOW_KEY}.txt`,
    urlList: ["https://pauseplan.help/sv/pause-plan"],
  });
  const grouped = indexNowPayloadsByHost(["https://b4gamble.com/en/casinos", "https://pauseplan.help/sv/pause-plan"]);
  assert.deepEqual(grouped.map((entry) => [entry.host, entry.key]), [
    ["b4gamble.com", INDEXNOW_KEY],
    ["pauseplan.help", HELP_INDEXNOW_KEY],
  ]);
});

test("a guide's public origin follows its category, and nothing else moves", () => {
  assert.equal(HELP_LEARN_CATEGORY, "responsible-gambling");
  // Before the move every category is on the main site, the help guides included.
  assert.equal(learnArticleSite("responsible-gambling", false), "main");
  assert.equal(learnArticleSite("casino-bonuses", false), "main");
  // From the deployment that starts the 301s the help category, and only it, moves.
  assert.equal(learnArticleSite("responsible-gambling", true), "help");
  assert.equal(learnArticleSite("casino-bonuses", true), "main");
  assert.equal(learnArticleSite("payments", true), "main");
  assert.equal(learnArticleOrigin("responsible-gambling", true), HELP_CANONICAL_ORIGIN);
  assert.equal(learnArticleOrigin("responsible-gambling", false), siteUrl);
  assert.deepEqual([...publicLearnOrigins()], [siteUrl, HELP_CANONICAL_ORIGIN]);

  assert.equal(learnCategoryBelongsToSite("responsible-gambling", "help", true), true);
  assert.equal(learnCategoryBelongsToSite("casino-bonuses", "help", true), false);
  assert.equal(learnCategoryBelongsToSite("responsible-gambling", "main", true), false);
  assert.equal(learnCategoryBelongsToSite("responsible-gambling", "main", false), true);

  // One function decides it, and the verifier, the result URL, IndexNow, the sitemap,
  // learn_source and learn_context all read it (§14).
  for (const path of [
    "lib/learn-apply/public-verification.ts",
    "lib/learn-apply/service.ts",
    "lib/learn-content-orchestrator/learn-source.server.ts",
    "lib/learn-content-orchestrator/safe-context.server.ts",
    "lib/learn-content-orchestrator/service.server.ts",
    "lib/seo/indexnow.ts",
  ]) {
    assert.match(read(path), /learnArticleSite|learnArticleOrigin/, path);
  }
  for (const path of ["lib/learn-content-orchestrator/learn-context.server.ts", "lib/learn-content-orchestrator/publication-validation.ts"]) {
    assert.match(read(path), /publicLearnOrigins/, path);
  }
  // The stored canonical contributes its path only, never its origin (§14).
  assert.equal(storedCanonicalUrl("https://b4gamble.com/sv/learn/responsible-gambling/spelpaus", "help"), "https://pauseplan.help/sv/learn/responsible-gambling/spelpaus");
  assert.equal(storedCanonicalUrl("/sv/learn/responsible-gambling/spelpaus", "help"), "https://pauseplan.help/sv/learn/responsible-gambling/spelpaus");
  assert.equal(storedCanonicalUrl("https://attacker.invalid/sv/x?a=1#b", "help"), "https://pauseplan.help/sv/x?a=1#b");
  assert.equal(storedCanonicalUrl("https://pauseplan.help/sv/x", "main"), "https://b4gamble.com/sv/x");
  assert.match(read("app/(public)/learn/[category]/[slug]/page.tsx"), /const canonical = storedCanonicalUrl\(article\.canonicalUrl, site\);/);
});

test("Better Auth takes two Production hosts and refuses a third", () => {
  assert.deepEqual([...PRODUCTION_AUTH_ORIGINS], [PRODUCTION_CANONICAL_ORIGIN, HELP_CANONICAL_ORIGIN]);
  assert.deepEqual([...PRODUCTION_AUTH_HOSTS], ["b4gamble.com", "pauseplan.help"]);

  // Dark: with HELP_SITE_SERVING unset Production is exactly what it is today.
  assert.deepEqual(resolveBetterAuthRuntimeConfig({
    VERCEL_ENV: "production",
    BETTER_AUTH_URL: "https://b4gamble.com",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://b4gamble.com",
  }), { baseURL: "https://b4gamble.com", trustedOrigins: ["https://b4gamble.com"] });

  // Served: the dynamic form with exactly the two hosts, so a fixed base URL cannot tie
  // every sign-in, callback and letter link to one of them (§9.2).
  const served = resolveBetterAuthRuntimeConfig({
    VERCEL_ENV: "production",
    HELP_SITE_SERVING: "true",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://b4gamble.com,https://pauseplan.help",
  });
  assert.deepEqual(served, {
    baseURL: { allowedHosts: ["b4gamble.com", "pauseplan.help"], protocol: "https" },
    trustedOrigins: ["https://b4gamble.com", "https://pauseplan.help"],
  });
  assert.deepEqual(resolveBetterAuthRuntimeConfig({
    VERCEL_ENV: "production",
    HELP_SITE_SERVING: "true",
    BETTER_AUTH_URL: "https://pauseplan.help",
  }).baseURL, { allowedHosts: ["b4gamble.com", "pauseplan.help"], protocol: "https" });

  for (const environment of [
    { VERCEL_ENV: "production", HELP_SITE_SERVING: "true", BETTER_AUTH_URL: "https://attacker.invalid" },
    { VERCEL_ENV: "production", HELP_SITE_SERVING: "true", BETTER_AUTH_TRUSTED_ORIGINS: "https://b4gamble.com,https://attacker.invalid" },
  ]) {
    assert.throws(() => resolveBetterAuthRuntimeConfig(environment));
  }

  // Preview is untouched: one exact branch host (RFC-021).
  assert.deepEqual(resolveBetterAuthRuntimeConfig({
    VERCEL_ENV: "preview",
    HELP_SITE_SERVING: "true",
    VERCEL_BRANCH_URL: "sevenbet-next-git-help-alexg-7bes-projects.vercel.app",
  }), {
    baseURL: { allowedHosts: ["sevenbet-next-git-help-alexg-7bes-projects.vercel.app"], protocol: "https" },
    trustedOrigins: ["https://sevenbet-next-git-help-alexg-7bes-projects.vercel.app"],
  });

  // The readiness runbook says what release governance sets, and it says it for two hosts.
  const runbook = read("docs/06_Operations/Google-Authentication-and-Email-Readiness.md");
  assert.match(runbook, /pauseplan\.help/);
  assert.match(runbook, /BETTER_AUTH_TRUSTED_ORIGINS/);
});

test("auth letters accept either allowed origin and a letter's links follow its action URL", () => {
  const service = read("lib/email/service.server.ts");
  // The allowlist is the two source constants and nothing a request or a template can widen.
  assert.match(service, /function allowedAuthActionOrigins\(siteUrl: string \| null\) \{\n\s+return siteUrl \? \[siteUrl, HELP_CANONICAL_ORIGIN\] : \[\];/);
  assert.match(service, /allowedAuthActionOrigins\(siteUrl\)\.includes\(candidate\.origin\) && !candidate\.username && !candidate\.password/);
  // An auth letter's own links are built on the origin its action URL came from, so a person
  // who signed up on the help host is never sent across the split (§11).
  assert.match(service, /const linkOrigin = letterLinkOrigin\(actionUrl, siteUrl\);/);
  assert.match(service, /programme_url: `\$\{linkOrigin\}\/program`/);
  assert.match(service, /plan_url: pauseLetterPlanUrl\(linkOrigin, message\.template\.locale\)/);
  assert.match(service, /unsubscribe_url: token \? `\$\{linkOrigin\}\/unsubscribe\?token=/);
  // A template may link either site and nothing else; the casino and partner refusal of
  // PR #530 is untouched and applies to both.
  const templates = read("lib/email/templates.server.ts");
  assert.match(templates, /const APPROVED_EMAIL_ORIGINS = \["https:\/\/b4gamble\.com", HELP_CANONICAL_ORIGIN\];/);
  assert.match(templates, /return APPROVED_EMAIL_ORIGINS\.includes\(url\.origin\)/);
  assert.match(templates, /!leadsToCasinoPages\(decodedPath\)/);
});

test("Q7: a new partner press stores no account, and the funnel has no partner stage", () => {
  const attribution = read("lib/analytics/outbound-attribution.server.ts");
  // The click row and its two events are the same press; neither carries the account now.
  assert.equal((attribution.match(/^\s+userId: null,$/gm) ?? []).length, 2);
  assert.doesNotMatch(attribution, /^\s+userId,$/m);
  // The sign-in back-fill would re-create the tie for presses made before the change.
  const observer = read("lib/customers/auth-observer.server.ts");
  assert.doesNotMatch(observer, /outboundClick\.updateMany/);
  assert.match(observer, /analyticsSession\.updateMany\(\{ where: \{ anonymousId, userId: null \}/);
  assert.match(observer, /consentEvent\.updateMany\(\{ where: \{ anonymousId, userId: null \}/);

  // No schema change: the column stays and simply receives nothing new, and older rows keep
  // their link until the separate data job clears them.
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model OutboundClick \{[\s\S]*?userId\s+String\?/);

  const funnel = read("lib/analytics/programme-funnel.server.ts");
  assert.doesNotMatch(funnel, /outboundClick|partnerButtonPresses|partnerClicks|outboundClicks/);
  assert.match(funnel, /PROGRAMME_FUNNEL_METRICS = \["accountsCreated", "programmeStarts", "stepThreeCompletions"\]/);
  assert.doesNotMatch(read("lib/mcp/learn/server.ts").slice(0, 20_000), /\(outboundClicks\)|\(partnerClicks\)/);
});

test("every new test file of this pull request runs in CI", () => {
  const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;
  assert.match(scripts["help-site:test"] ?? "", /tests\/help-site-origins\.test\.ts/);
  assert.match(scripts["ci:quality"] ?? "", /npm run help-site:test/);
});

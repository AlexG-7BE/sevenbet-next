import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { protectedHelpArticles } from "../lib/responsible-gambling";

const read = (path: string) => readFileSync(path, "utf8");
const slugs = ["self-exclusion", "deposit-limits", "cooling-off", "reality-checks"];

test("all four action/control Help routes consolidate into the protected Help hub", () => {
  const route = read("app/help/[slug]/page.tsx");
  const article = read("components/protected-help/ProtectedHelpArticle.tsx");
  const recovery = read("app/help/not-found.tsx");
  assert.deepEqual(protectedHelpArticles.map((item) => item.slug), slugs);
  for (const slug of slugs) assert.match(article, new RegExp(`(?:"${slug}"|${slug}:)`));
  assert.match(route, /permanentRedirect\(article \? `\/help#\$\{encodeURIComponent\(article\.slug\)\}` : "\/help"\)/);
  assert.doesNotMatch(route, /ArticleLayout|PageHero|ResourceCard/);
  assert.doesNotMatch(article, /["']use client["']/);
  assert.match(article, /data-figma-desktop="599:3972"/);
  assert.match(article, /data-figma-mobile="600:1792"/);
  assert.match(article, /<h1>\{presentation\.title\}<\/h1>/);
  assert.match(recovery, /ProtectedHelpArticleUnavailable/);
  assert.doesNotMatch(article, /href=["'{]\/(?:casinos|bonuses|best-offers|compare|go)(?:\/|["'}])/);
});

test("Cooling-off uses the approved Pause and Support fail-closed content states", () => {
  const article = read("components/protected-help/ProtectedHelpArticle.tsx");
  for (const state of ["Content review required", "Terms unavailable", "Content blocked"]) assert.match(article, new RegExp(state, "i"));
  assert.match(article, /Local availability claims and tool instructions remain blocked/);
  assert.match(article, /No verified local duration or cancellation rule is shown/);
  assert.match(article, /href="\/help">Return to Help home/);
  assert.doesNotMatch(article, /24-hour|48-hour|7-day|cancel early|available everywhere/i);
});

test("FAQ is the server-rendered product and trust surface with native disclosures", () => {
  const faq = read("app/(public)/faq/page.tsx");
  assert.doesNotMatch(faq, /["']use client["']/);
  assert.equal((faq.match(/<h1\b/g) ?? []).length, 1);
  for (const group of ["About B4GAMBLE", "Programme", "Casinos & Offers", "Commercial model", "Help & Privacy"]) assert.match(faq, new RegExp(group, "i"));
  assert.match(faq, /<details key=\{q\} open=/);
  assert.match(faq, /<summary>/);
  assert.match(faq, /canonical: absoluteUrl\("\/faq"\)/);
  assert.doesNotMatch(faq, /Help center|FAQ schema|Internal guide links|["']@type["']:\s*["']FAQPage["']/iu);
  assert.ok(faq.lastIndexOf("Open Protected Help") > faq.lastIndexOf("How do I delete my data?"));
});

test("Best Offers and Bonuses close their heading and landmark defects without data changes", () => {
  const best = read("app/(public)/best-offers/page.tsx");
  const bestLoading = read("app/(public)/best-offers/loading.tsx");
  const bestError = read("app/(public)/best-offers/error.tsx");
  assert.equal((best.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((bestLoading.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((bestError.match(/<h1\b/g) ?? []).length, 1);
  assert.match(best, /result\.status === "available"/);
  assert.match(best, /<h2>\{result\.status === "unavailable"/);
  for (const path of ["app/(public)/bonuses/page.tsx", "app/(public)/bonuses/error.tsx"]) assert.doesNotMatch(read(path), /<main\b/);
});

test("commercial actions use confirmation first and neutral managed recovery", () => {
  const handoff = read("components/casino-profile/CasinoOutboundAction.tsx");
  const confirmation = read("components/commercial-handoff/CommercialHandoffPage.tsx");
  const redirect = read("app/r/[slug]/route.ts");
  const legacy = read("app/go/[slug]/route.ts");
  for (const surface of ["components/casino-discovery/CasinoDiscoveryCard.tsx", "components/bonus-directory/BonusDirectory.tsx", "components/public-offers/PublicOffers.tsx", "components/comparison/ComparisonExperience.tsx", "components/casino-profile/CasinoProfile.tsx"]) assert.match(read(surface), /CasinoOutboundAction/);
  assert.match(handoff, /href=\{confirmationHref\}/);
  assert.match(handoff, /showModal\(\)/);
  assert.match(handoff, /href=\{action\.href\}/);
  assert.match(confirmation, /href=\{`\/r\/\$\{slug\}`\}/);
  assert.match(confirmation, /No raw destination URL/);
  assert.match(confirmation, /No destination · No redirect · No substitute offer/);
  assert.match(redirect, /recoveryUrl\.pathname = "\/outbound\/unavailable"/);
  assert.match(redirect, /NextResponse\.redirect\(recoveryUrl, 303\)/);
  assert.doesNotMatch(redirect, /destinationUrl|trackingUrl|\/casinos|\/bonuses|\/best-offers/);
  assert.match(legacy, /\/outbound\/unavailable/);
});

test("runtime text and sitemap policy match current product truth", () => {
  const llms = read("app/llms.txt/route.ts");
  const site = read("lib/site.ts");
  const sitemap = read("app/sitemap.ts");
  const footer = read("components/public-shell/PublicFooter.tsx");
  assert.match(llms, /practical control/);
  assert.match(llms, /Casino Data Boundary/);
  assert.match(llms, /Demonstration records are fictional/);
  assert.doesNotMatch(llms, /getTopCasinos|Top Casino Profiles|wagering x\$\{|license \$\{/);
  assert.doesNotMatch(llms, /session limit and stop-loss calculator|Recommended stop-loss|safe gambling budget/i);
  assert.match(site, /["']\/privacy["']/);
  assert.match(site, /["']\/terms["']/);
  assert.match(footer, /<Link href="\/privacy">Privacy<\/Link>/);
  assert.match(footer, /<Link href="\/terms">Terms<\/Link>/);
  assert.match(sitemap, /bestOffers\.status !== "unavailable" && bestOffers\.inventoryMode === "PUBLISHED_ONLY"/);
  assert.match(sitemap, /"\/best-offers"/);
  assert.doesNotMatch(sitemap, /"\/compare"/);
  assert.doesNotMatch(sitemap, /helpGuideRoutes|learningCategoryRoutes/);
});

test("FE-GAP-02 introduces no forbidden frontend architecture", () => {
  const frontend = [
    "components/protected-help/ProtectedHelpArticle.tsx",
    "app/(public)/faq/page.tsx",
    "components/casino-profile/CasinoOutboundAction.tsx",
    "components/commercial-handoff/CommercialHandoffPage.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(frontend, /@prisma\/client|\bprisma\.|destinationUrl|trackingUrl|localStorage|sessionStorage|dataLayer/);
});

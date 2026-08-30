import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("the final design handoff is governed by an approved bounded RFC and implementation manifest", () => {
  assert.match(read("docs/06_RFC/RFC-034-Final-Design-Handoff-Public-Site.md"), /Approved for bounded Draft-PR and Preview implementation/i);
  const manifest = read("docs/product/FINAL-DESIGN-HANDOFF-IMPLEMENTATION-MANIFEST.md");
  assert.match(manifest, /created from current `origin\/main`/);
  assert.match(manifest, /\/bonus-guide/);
  assert.match(manifest, /Contextual comparison/i);
  assert.match(read("docs/product/FINAL-DESIGN-COPY-CLAIMS-AUDIT.md"), /Draft Preview/i);
});

test("final public navigation and route consolidation match the locked handoff", () => {
  const shell = read("lib/public-shell.ts");
  for (const item of ["Best Offers", "Casinos", "Bonuses", "Learn"]) assert.match(shell, new RegExp(`label: "${item}"`));
  assert.doesNotMatch(shell, /label: "(?:Compare|Help)"/);
  assert.match(read("app/(public)/compare/page.tsx"), /permanentRedirect\(productHref\(presentation, `\/casinos/);
  assert.match(read("app/(public)/self-check/page.tsx"), /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(read("app/(public)/tools/budget-calculator/page.tsx"), /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(read("app/(public)/learn/[category]/page.tsx"), /permanentRedirect\(productHref\(presentation, `\/learn\?category=/);
  assert.match(read("app/help/[slug]/page.tsx"), /permanentRedirect\(article \? `\/help#/);
  assert.match(read("lib/site.ts"), /"\/bonus-guide"/);
  assert.doesNotMatch(read("app/sitemap.ts"), /"\/compare"|protectedHelpArticles|getCategoryPath/);
});

test("casino comparison is contextual, capped and backed by the existing public projection", () => {
  const controller = read("components/comparison-context/ContextualComparison.tsx");
  assert.match(controller, /slice\(0, 3\)/);
  assert.match(controller, /sessionStorage\.setItem\(STORAGE_KEY/);
  assert.match(controller, /next\.length === 2 && previousCount\.current < 2/);
  assert.match(controller, /fetch\(`\/api\/public\/comparison\?/);
  assert.match(controller, /dialog\.showModal\(\)/);
  assert.doesNotMatch(controller, /localStorage|programme|email|userId/i);
  const route = read("app/api/public/comparison/route.ts");
  assert.match(route, /publicComparisonService\.compare\(query, authority\)/);
  assert.match(route, /private, no-store/);
  assert.match(route, /noindex, nofollow/);
  assert.match(route, /COMPARISON_UNAVAILABLE/);
});

test("handoff visual fixtures are data-only and dynamic routes cannot switch presentation renderers", () => {
  const guard = read("lib/final-handoff/visual-data-fixture.ts");
  assert.match(guard, /B4GAMBLE_HANDOFF_VISUAL_FIXTURE/);
  assert.match(guard, /process\.env\.VERCEL !== "1"/);
  assert.match(guard, /process\.env\.VERCEL_ENV !== "production"/);
  assert.doesNotMatch(guard, /HandoffPage|generated-pages\.json|dangerouslySetInnerHTML/);
  const runtimeRoutes = [
    ["app/(public)/best-offers/page.tsx", /BestOffersExperience/],
    ["app/(public)/casinos/page.tsx", /CuratedCasinoShortlist/],
    ["app/(public)/bonuses/page.tsx", /BonusComparisonList/],
    ["app/(public)/casino/[slug]/page.tsx", /CasinoProfile/],
    ["app/(public)/learn/[category]/[slug]/page.tsx", /LearningArticleView/],
  ] as const;
  for (const [page, runtimeComponent] of runtimeRoutes) {
    const source = read(page);
    assert.match(source, runtimeComponent, page);
    assert.doesNotMatch(source, /import \{ HandoffPage \}|<HandoffPage|isLocalHandoffVisualFixture/, page);
  }
  for (const page of runtimeRoutes.slice(0, 4).map(([path]) => path)) {
    assert.match(read(page), /isLocalHandoffVisualDataFixture/, page);
  }
  assert.doesNotMatch(read("components/comparison-context/ContextualComparison.tsx"), /HandoffPage|dangerouslySetInnerHTML/);
  assert.match(read("components/programme/ProgramAiExperience.tsx"), /data-runtime-renderer="programme"/);
});

test("locked hero copy is present on every final public surface", () => {
  const generated = JSON.parse(read("lib/final-handoff/generated-pages.json")) as Record<string, { html: string }>;
  const generatedText = (name: string) => generated[name].html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const productCatalog = read("lib/i18n/product-pages-catalog.ts");
  const contactCatalog = read("lib/i18n/static-pages/contact.ts");
  const expectations: Array<[string, RegExp]> = [
    ["app/(public)/best-offers/page.tsx", /messages\.bestOffers\.heroLead[\s\S]*messages\.bestOffers\.heroEmphasis/],
    ["app/(public)/casinos/page.tsx", /messages\.casinos\.heroLead[\s\S]*messages\.casinos\.heroEmphasis/],
    ["app/(public)/bonuses/page.tsx", /messages\.bonuses\.heroLead[\s\S]*messages\.bonuses\.heroEmphasis/],
    ["app/(public)/contact/page.tsx", /messages\.titleLead[\s\S]*messages\.titleEmphasis/],
    ["app/(public)/privacy/page.tsx", /kind="privacy"/],
    ["app/(public)/terms/page.tsx", /kind="terms"/],
  ];
  for (const [path, expected] of expectations) assert.match(read(path), expected, path);
  assert.match(productCatalog, /heroLead: "Three picks\."[\s\S]*heroEmphasis: "Not thirty\."/);
  assert.match(productCatalog, /heroLead: "Picked for"[\s\S]*heroEmphasis: "how you play\."/);
  assert.match(productCatalog, /heroLead: "Value, measured"[\s\S]*heroEmphasis: "by terms\."/i);
  assert.match(contactCatalog, /titleLead: "Talk"[\s\S]*titleEmphasis: "to us\."/i);
  for (const [name, expected] of [
    ["home", /Control starts here\./],
    ["tenSteps", /Ten steps\. One plan\./],
    ["learn", /Learn\. Play smarter\./],
    ["responsibleGambling", /Take back control,[\s\S]*at your pace\./],
    ["help", /We(?:'|’)re here\. No strings\./i],
    ["methodology", /Evidence before[\s\S]*opinion\./i],
    ["about", /Built to be[\s\S]*on your side\./],
  ] as Array<[string, RegExp]>) assert.match(generatedText(name), expected, name);
});

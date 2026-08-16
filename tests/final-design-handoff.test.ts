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
  assert.match(read("app/(public)/compare/page.tsx"), /permanentRedirect\(`\/casinos/);
  assert.match(read("app/(public)/self-check/page.tsx"), /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(read("app/(public)/tools/budget-calculator/page.tsx"), /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(read("app/(public)/learn/[category]/page.tsx"), /permanentRedirect\(`\/learn\?category=/);
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

test("handoff sample data is isolated to an explicit local visual fixture", () => {
  const guard = read("lib/final-handoff/visual-fixture.ts");
  assert.match(guard, /B4GAMBLE_HANDOFF_VISUAL_FIXTURE/);
  assert.match(guard, /process\.env\.VERCEL !== "1"/);
  assert.match(guard, /process\.env\.VERCEL_ENV !== "production"/);
  for (const page of [
    "app/(public)/best-offers/page.tsx",
    "app/(public)/casinos/page.tsx",
    "app/(public)/bonuses/page.tsx",
    "app/(public)/casino/[slug]/page.tsx",
    "app/(public)/learn/[category]/[slug]/page.tsx",
  ]) assert.match(read(page), /isLocalHandoffVisualFixture/, page);
});

test("locked hero copy is present on every final public surface", () => {
  const generated = JSON.parse(read("lib/final-handoff/generated-pages.json")) as Record<string, { html: string }>;
  const generatedText = (name: string) => generated[name].html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const expectations: Array<[string, RegExp]> = [
    ["app/(public)/best-offers/page.tsx", /Three picks\.[\s\S]*Not thirty\./],
    ["app/(public)/casinos/page.tsx", /Picked for[\s\S]*how you play\./],
    ["app/(public)/bonuses/page.tsx", /Value, measured[\s\S]*by terms\./i],
    ["app/(public)/contact/page.tsx", /Talk[\s\S]*to us\./i],
    ["app/(public)/privacy/page.tsx", /kind="privacy"/],
    ["app/(public)/terms/page.tsx", /kind="terms"/],
  ];
  for (const [path, expected] of expectations) assert.match(read(path), expected, path);
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

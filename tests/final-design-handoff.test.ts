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

test("locked hero copy is present on every final public surface", () => {
  const expectations: Array<[string, RegExp]> = [
    ["components/home/TiltHome.tsx", /CONTROL[\s\S]*starts here\./],
    ["app/(public)/10-steps/TenStepsLanding.tsx", /TEN STEPS\.[\s\S]*One plan\./],
    ["app/(public)/best-offers/page.tsx", /Three picks\.[\s\S]*Not thirty\./],
    ["app/(public)/casinos/page.tsx", /Picked for[\s\S]*how you play\./],
    ["app/(public)/bonuses/page.tsx", /Value, measured[\s\S]*by terms\./i],
    ["app/(public)/learn/LearningCenterPage.tsx", /LEARN\.[\s\S]*PLAY SMARTER\./],
    ["app/(public)/responsible-gambling/page.tsx", /Take back control,[\s\S]*at your pace\./],
    ["components/protected-help/ProtectedHelpHub.tsx", /We&apos;re here\.[\s\S]*No strings\./],
    ["app/(public)/methodology/MethodologyDocument.tsx", /EVIDENCE[\s\S]*BEFORE OPINION\./],
    ["app/(public)/about/AboutDocument.tsx", /Built to be[\s\S]*on your side\./],
    ["app/(public)/contact/page.tsx", /Talk to us\./],
    ["app/(public)/privacy/page.tsx", /PRIVACY[\s\S]*BY DEFAULT\./],
    ["app/(public)/terms/page.tsx", /TERMS[\s\S]*OF USE\./],
  ];
  for (const [path, expected] of expectations) assert.match(read(path), expected, path);
});

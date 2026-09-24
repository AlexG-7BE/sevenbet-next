import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("commercial error boundaries use the locale-aware retry message", () => {
  const errorContext = source("lib/i18n/use-public-error-context.ts");
  assert.match(errorContext, /messages: publicErrorMessages\(presentation\?\.locale \?\? "en-GB"\)/);
  for (const path of [
    "app/(public)/best-offers/error.tsx",
    "app/(public)/bonuses/error.tsx",
    "app/(public)/casinos/error.tsx",
    "app/(public)/casino/[slug]/error.tsx",
  ]) {
    const errorBoundary = source(path);
    assert.match(errorBoundary, /usePublicErrorContext/);
    assert.match(errorBoundary, /messages\.retry/);
    assert.doesNotMatch(errorBoundary, /<button[^>]*>\{messages\.common\.current\}<\/button>/);
  }
});

test("zero-inventory commercial directories use bounded states without retired filters", () => {
  const bonuses = source("app/(public)/bonuses/page.tsx");
  const casinos = source("app/(public)/casinos/page.tsx");

  assert.match(bonuses, /result\.inventoryMode === "UNAVAILABLE" \? <section[^>]+role="status"/);
  assert.match(bonuses, /<BonusOfferDirectory messages=\{messages\} offers=\{result\.records\}/);
  assert.match(casinos, /result\.items\.length \? <CasinoCollection casinos=\{result\.items\}/);
  assert.doesNotMatch(`${bonuses}\n${casinos}`, /BonusFilters|DiscoveryControls|More Filters/);
});

test("bonus directory ignores retired filter recovery and keeps localized research routes", () => {
  const page = source("app/(public)/bonuses/page.tsx");

  assert.match(page, /<Link href=\{productHref\(presentation, "\/methodology"\)\}>\{messages\.common\.reviewMethodology\}<\/Link>/);
  assert.match(source("components/public-shell/PublicFooter.tsx"), /"\/affiliate-disclosure"/);
  assert.doesNotMatch(page, /activeCount|data-empty-reset|clearAll|BonusFilters/);
});


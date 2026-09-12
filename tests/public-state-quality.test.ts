import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("commercial error boundaries use the locale-aware retry message", () => {
  for (const path of [
    "app/(public)/best-offers/error.tsx",
    "app/(public)/bonuses/error.tsx",
    "app/(public)/casinos/error.tsx",
    "app/(public)/casino/[slug]/error.tsx",
  ]) {
    const errorBoundary = source(path);
    assert.match(errorBoundary, /usePublicErrorContext/);
    assert.match(errorBoundary, /errorMessages\.retry/);
    assert.doesNotMatch(errorBoundary, /<button[^>]*>\{messages\.common\.current\}<\/button>/);
  }
});

test("curated shortlists expose only result-backed selectors and collapse when none are available", () => {
  const bonuses = source("components/bonus-directory/CuratedBonusShortlist.tsx");
  const casinos = source("components/casino-discovery/CuratedCasinoShortlist.tsx");

  assert.match(bonuses, /selectAvailableCuratedBonusResults\(offers\)/);
  assert.match(bonuses, /if \(!activeSelector\) return null/);
  assert.match(casinos, /casinos\.filter\(\(casino\) => casino\.disposition !== "HIDDEN"\)/);
  assert.match(casinos, /selectAvailableCuratedCasinoResults\(editorialCasinos, \{ bestBonusCasinoIds \}\)/);
  assert.match(casinos, /if \(!activeSelector\) return null/);
  for (const shortlist of [bonuses, casinos]) {
    assert.match(shortlist, /aria-pressed=\{activeSelector === label\}/);
    assert.doesNotMatch(shortlist, /role="tab"|aria-selected/);
    assert.doesNotMatch(shortlist, /className=\{styles\.empty\} role="status"/);
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

test("comparison controls disable unselected choices at capacity and restore dialog focus", () => {
  const comparison = source("components/comparison-context/ContextualComparison.tsx");
  const toggle = source("components/comparison-context/ContextualCompareToggle.tsx");

  assert.match(toggle, /setAtCapacity\(values\.length >= 3\)/);
  assert.match(toggle, /disabled=\{atCapacity && !selected\}/);
  assert.match(comparison, /dialogInvokerRef/);
  assert.match(comparison, /restoreDialogFocus/);
});

test("bonus directory ignores retired filter recovery and keeps localized research routes", () => {
  const page = source("app/(public)/bonuses/page.tsx");

  assert.match(page, /<Link href=\{productHref\(presentation, "\/methodology"\)\}>\{messages\.common\.reviewMethodology\}<\/Link>/);
  assert.match(page, /productHref\(presentation, "\/affiliate-disclosure"\)/);
  assert.doesNotMatch(page, /activeCount|data-empty-reset|clearAll|BonusFilters/);
});

test("directory filter landmarks use the supplied localized controls label", () => {
  const surface = source("components/directory-filters/DirectoryFilterSurface.tsx");
  assert.match(surface, /aria-label=\{labels\?\.directoryControls \?\? title\}/);
  assert.doesNotMatch(surface, /aria-label=\{`\$\{title\} controls`\}/);
});

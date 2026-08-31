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

test("empty curated shortlists omit selector controls but preserve their truthful empty states", () => {
  const bonuses = source("components/bonus-directory/CuratedBonusShortlist.tsx");
  const casinos = source("components/casino-discovery/CuratedCasinoShortlist.tsx");

  assert.match(bonuses, /\{offers\.length \? <div[^>]+data-selector-group="curated-bonuses"[^>]+role="group"/);
  assert.match(bonuses, /!top\.length \? <div[^>]+role="status"/);
  assert.match(casinos, /\{casinos\.length \? <div[^>]+data-selector-group="curated-casinos"[^>]+role="group"/);
  assert.match(casinos, /!top\.length \? <div[^>]+role="status"/);
  for (const shortlist of [bonuses, casinos]) {
    assert.match(shortlist, /aria-pressed=\{selector === label\}/);
    assert.doesNotMatch(shortlist, /role="tab"|aria-selected/);
  }
});

test("zero-inventory directories expose filters only when they have records or active recovery state", () => {
  const bonuses = source("app/(public)/bonuses/page.tsx");
  const casinos = source("app/(public)/casinos/page.tsx");

  assert.match(bonuses, /result\.total > 0 \|\| activeCount > 0 \? <BonusFilters/);
  assert.match(casinos, /const showDiscoveryControls = result\.total > 0 \|\| hasDiscoveryFilters\(result\.appliedFilters\)/);
  assert.match(casinos, /\{showDiscoveryControls \? <DiscoveryControls/);
});

test("comparison controls disable unselected choices at capacity and restore dialog focus", () => {
  const comparison = source("components/comparison-context/ContextualComparison.tsx");
  const toggle = source("components/comparison-context/ContextualCompareToggle.tsx");

  assert.match(toggle, /setAtCapacity\(values\.length >= 3\)/);
  assert.match(toggle, /disabled=\{atCapacity && !selected\}/);
  assert.match(comparison, /dialogInvokerRef/);
  assert.match(comparison, /restoreDialogFocus/);
});

test("filtered bonus absence offers localized recovery without localizing protected routes", () => {
  const page = source("app/(public)/bonuses/page.tsx");

  assert.match(page, /activeCount > 0 \? <Link data-empty-reset href=\{productHref\(presentation, "\/bonuses"\)\}>\{messages\.common\.clearAll\}<\/Link>/);
  assert.match(page, /<Link href=\{productHref\(presentation, "\/methodology"\)\}>\{messages\.common\.reviewMethodology\}<\/Link>/);
  assert.match(page, /<Link className=\{finalStyles\.guideAction\} href="\/bonus-guide">/);
  assert.match(page, /<Link href="\/affiliate-disclosure">/);
  assert.doesNotMatch(page, /productHref\(presentation, "\/(?:bonus-guide|affiliate-disclosure)"\)/);
});

test("directory filter landmarks use the supplied localized controls label", () => {
  const surface = source("components/directory-filters/DirectoryFilterSurface.tsx");
  assert.match(surface, /aria-label=\{labels\?\.directoryControls \?\? title\}/);
  assert.doesNotMatch(surface, /aria-label=\{`\$\{title\} controls`\}/);
});

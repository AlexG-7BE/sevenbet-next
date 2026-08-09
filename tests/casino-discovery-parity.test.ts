import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const components = readFileSync("components/casino-discovery/CasinoDiscovery.tsx", "utf8");
const card = readFileSync("components/casino-discovery/CasinoDiscoveryCard.tsx", "utf8");
const mobile = readFileSync("components/casino-discovery/MobileCasinoFilters.tsx", "utf8");
const instantForm = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");

test("FE-MIG-06 keeps SSR discovery and published DTO boundaries", () => {
  assert.match(page, /publicCasinoDiscoveryService\.discover/);
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page + components + card + mobile, /@prisma\/client|prisma\./);
  assert.doesNotMatch(page + components + card, /trackingUrl|destinationUrl|providerType|externalId/);
  assert.match(card, /\/casino-directory\/editorial-media\.jpg/);
  assert.doesNotMatch(card, /casino\.hero/);
  assert.match(card, /\/r\/\$\{casino\.visitAction\.redirectSlug\}/);
  assert.match(card, /casino\.visitAction\.available/);
});

test("public copy has no unsupported verification, featured, ranking-independence, or local-offer claims", () => {
  assert.doesNotMatch(page, /Search verified published profiles/i);
  assert.match(page, /Search published review snapshots/);
  assert.doesNotMatch(page + components + card, /Featured published review|FeaturedCasinoReview/);
  assert.match(card, /Published casino review/);
  assert.doesNotMatch(card, /Rankings and editorial reviews remain independently governed/);
  assert.match(card, /Review access is editorial\. A visit action is conditional and may compensate B4GAMBLE/);
  assert.doesNotMatch(page, /eligible local offer/);
  assert.match(card, /Directory result position/);
});

test("FE-MIG-06 exposes the approved responsive and state contract", () => {
  assert.match(mobile, /showModal\(\)/);
  assert.match(mobile, /onCancel/);
  assert.match(mobile, /triggerRef\.current\?\.focus/);
  assert.match(components, /<noscript>/);
  assert.match(components, /Market preference, not location/);
  assert.match(components, /Reviews remain available/);
  assert.match(components, /No published reviews match these controls/);
  assert.match(instantForm, /aria-busy=\{pending\}/);
  assert.match(instantForm, /aria-live="polite"/);
  assert.match(instantForm, /method="get"/);
  assert.match(readFileSync("app/(public)/casinos/error.tsx", "utf8"), /could not load the catalogue/);
});

test("forms preserve sort and page size without carrying stale page numbers", () => {
  assert.match(components, /query\.pageSize/);
  assert.match(components, /name="pageSize"/);
  assert.match(components, /except=\{\["sort", "pageSize"\]\}/);
  assert.doesNotMatch(components, /name="page" type="hidden"/);
  assert.doesNotMatch(components, /aria-disabled=\{result\.page/);
});

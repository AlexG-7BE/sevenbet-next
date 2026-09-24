import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const collection = readFileSync("components/casino-discovery/CasinoCollection.tsx", "utf8");
const errorBoundary = readFileSync("app/(public)/casinos/error.tsx", "utf8");
const bonuses = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
const sharedMobile = readFileSync("components/directory-filters/MobileDirectoryFilters.tsx", "utf8");
const instantForm = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");

test("FE-MIG-06 keeps SSR discovery and published DTO boundaries", () => {
  assert.match(page, /publicCasinoDiscoveryService\.discover/);
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page + collection, /@prisma\/client|prisma\./);
  assert.doesNotMatch(page + collection, /trackingUrl|destinationUrl|providerType|externalId/);
  assert.match(collection, /casino\.dataClassification === "PUBLISHED_RECORD"/);
  assert.match(collection, /card\.action \? <CasinoOutboundAction/);
});

test("public copy has no unsupported verification, featured, ranking-independence, or local-offer claims", () => {
  assert.doesNotMatch(page, /Search verified published profiles/i);
  assert.match(page, /messages\.casinos\.heroCopy/);
  assert.doesNotMatch(page + collection, /Featured published review|FeaturedCasinoReview/);
  assert.doesNotMatch(page + collection, /Rankings and editorial reviews remain independently governed/);
  assert.doesNotMatch(page, /eligible local offer/);
  // The ranking-independence claim is stated once, by the FAQ, and asserted in legal-public-claims.
  assert.match(page, /messages\.casinos\.faqCommissionAnswer/);
});

test("FE-MIG-06 exposes the approved responsive and state contract", () => {
  assert.match(sharedMobile, /showModal\(\)/);
  assert.match(sharedMobile, /onCancel/);
  assert.match(sharedMobile, /triggerRef\.current\?\.focus/);
  assert.match(bonuses, /<noscript>/);
  assert.match(bonuses, /messages\.common\.marketPresentationNotice/);
  assert.match(instantForm, /aria-busy=\{pending\}/);
  assert.match(instantForm, /aria-live="polite"/);
  assert.match(instantForm, /method="get"/);
  // The boundary moved to the shared localized error catalog; it must still announce itself and
  // offer recovery rather than falling back to stale or invented inventory.
  assert.match(errorBoundary, /usePublicErrorContext\(\)/);
  assert.match(errorBoundary, /role="alert"/);
  assert.match(errorBoundary, /retryPublicCommercialError\(reset\)/);
  assert.match(errorBoundary, /hrefFor\("\/help"\)/);
  assert.doesNotMatch(errorBoundary, /publicCasinoDiscoveryService|casinos\.items|fallback/i);
});

test("the casino directory states each empty outcome without substituting inventory", () => {
  // Nothing published for this market: the page names the market and keeps reviews separate from actions.
  assert.match(page, /messages\.casinos\.noPublishedTitle/);
  assert.match(page, /messages\.casinos\.reviewOnlyNotice/);
  assert.match(page, /formatProductMessage\(messages\.casinos\.noPublishedTitle, \{ market \}\)/);
  assert.match(page, /messages\.common\.marketPresentationNotice/);
  // Published records that no search matches: an in-place message, never a padded or borrowed list.
  assert.match(collection, /copy\.noSearchResults/);
  assert.doesNotMatch(collection, /fallbackCasinos|substitute|borrowed/i);
});

test("forms preserve sort without carrying stale page numbers", () => {
  assert.match(bonuses, /name="sort"/);
  assert.match(bonuses, /if \(key === omitted \|\| key === "page"\) continue;/);
  assert.match(bonuses, /if \(key !== "page"\) params\.append\(key, item\)/);
  assert.match(instantForm, /params\.delete\("page"\)/);
  // The casino directory holds one fixed server query, so it must not grow a page control of its own.
  assert.doesNotMatch(page, /name="page"|name="pageSize"|name="sort"/);
  assert.doesNotMatch(collection, /DirectoryPagination|name="page"/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const collection = readFileSync("components/casino-discovery/CasinoCollection.tsx", "utf8");
const errorBoundary = readFileSync("app/(public)/casinos/error.tsx", "utf8");
const bonuses = readFileSync("components/bonus-directory/BonusOfferDirectory.tsx", "utf8");
// The faceted BonusDirectory, the shared mobile filter drawer and the GET-form
// enhancer were imported by no route and have been deleted. Their responsive and
// pagination checks went with them; what the live directories owe is below.

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

test("the casino error boundary announces itself and offers recovery without inventing inventory", () => {
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

test("the directories hold one server query and grow no page or sort controls", () => {
  // Each directory renders one fixed server query and orders it in place, so a
  // page or sort control would describe results the reader cannot reach.
  assert.doesNotMatch(page, /name="page"|name="pageSize"|name="sort"/);
  for (const directory of [collection, bonuses]) {
    assert.doesNotMatch(directory, /DirectoryPagination|name="page"|name="sort"|<form/);
  }
});

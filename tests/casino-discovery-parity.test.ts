import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const components = readFileSync("components/casino-discovery/CasinoDiscovery.tsx", "utf8");
const mobile = readFileSync("components/casino-discovery/MobileCasinoFilters.tsx", "utf8");

test("FE-MIG-04 keeps SSR discovery and published DTO boundaries", () => {
  assert.match(page, /publicCasinoDiscoveryService\.discover/);
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page + components + mobile, /@prisma\/client|prisma\./);
  assert.doesNotMatch(page + components, /trackingUrl|destinationUrl|providerType|externalId/);
  assert.match(components, /\/r\/\$\{casino\.visitAction\.redirectSlug\}/);
  assert.match(components, /casino\.visitAction\.available/);
});

test("FE-MIG-04 exposes the approved responsive and state contract", () => {
  assert.match(mobile, /showModal\(\)/);
  assert.match(mobile, /onCancel/);
  assert.match(mobile, /triggerRef\.current\?\.focus/);
  assert.match(components, /<noscript>/);
  assert.match(components, /Market preference, not location/);
  assert.match(components, /Review-only results/);
  assert.match(components, /No published reviews match these controls/);
  assert.match(readFileSync("app/(public)/casinos/loading.tsx", "utf8"), /aria-busy="true"/);
  assert.match(readFileSync("app/(public)/casinos/error.tsx", "utf8"), /could not load the published reviews/);
});

test("forms preserve sort and page size without carrying stale page numbers", () => {
  assert.match(components, /query\.pageSize/);
  assert.match(components, /name="pageSize"/);
  assert.match(components, /except=\{\["sort", "pageSize"\]\}/);
  assert.doesNotMatch(components, /name="page" type="hidden"/);
  assert.doesNotMatch(components, /aria-disabled=\{result\.page/);
});

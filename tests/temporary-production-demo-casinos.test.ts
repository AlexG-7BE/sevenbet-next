import assert from "node:assert/strict";
import test from "node:test";

import {
  PRODUCTION_SITE_ORIGIN,
  temporaryDemoAffiliate,
  temporaryDemoCasinos,
  temporaryDemoOwnedIds,
} from "../scripts/temporary-production-demo-casino.manifest";

test("temporary production demo manifest is bounded and explicitly fictional", () => {
  assert.equal(temporaryDemoCasinos.length, 5);
  assert.equal(new Set(temporaryDemoCasinos.map((item) => item.id)).size, 5);
  assert.equal(new Set(temporaryDemoCasinos.map((item) => item.slug)).size, 5);
  for (const casino of temporaryDemoCasinos) {
    assert.match(casino.slug, /^demo-/);
    assert.match(casino.title, /^Demo /);
    assert.match(casino.domain, /^demo-[a-z]+\.example$/);
    assert.match(casino.draft.summary || "", /fictional/i);
    assert.match(casino.draft.description || "", /synthetic/i);
    assert.equal(casino.draft.licenses.length, 1);
    assert.match(casino.draft.licenses[0].authority, /not a real regulator/i);
    assert.equal(casino.draft.licenses[0].licenseNumber, null);
    assert.equal(casino.draft.licenses[0].verificationUrl, null);
    assert.equal(casino.images.filter((item) => item.kind === "LOGO").length, 1);
    assert.equal(casino.images.filter((item) => item.kind === "HERO").length, 1);
    assert.equal(casino.images.filter((item) => item.kind === "SCREENSHOT").length, 1);
    for (const offer of casino.draft.casinoBonuses) {
      assert.match(offer.title, /not a live offer/i);
      assert.equal(offer.termsUrl, null);
      assert.equal(offer.promoCode, null);
    }
  }
});

test("all manifest-owned IDs are unique deterministic UUIDs", () => {
  const listed = temporaryDemoCasinos.flatMap((casino) => [
    casino.id,
    ...casino.draft.licenses.map((item) => item.id),
    ...casino.draft.countries.map((item) => item.id),
    ...casino.draft.paymentMethods.map((item) => item.id),
    ...casino.draft.gameProviders.map((item) => item.id),
    ...casino.draft.gameCategories.map((item) => item.id),
    ...casino.draft.casinoBonuses.map((item) => item.id),
    ...casino.images.map((item) => item.id),
  ]);
  const affiliateIds = Object.entries(temporaryDemoAffiliate).flatMap(([key, value]) => key.endsWith("Id") && key !== "casinoId" ? [value] : []);
  const all = [...listed, ...affiliateIds];
  assert.equal(temporaryDemoOwnedIds.size, all.length);
  for (const id of all) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("the only available demo action stays on the SevenBet production origin", () => {
  const destination = new URL(temporaryDemoAffiliate.internalDestination);
  assert.equal(destination.origin, PRODUCTION_SITE_ORIGIN);
  assert.equal(destination.pathname, "/casino/demo-northstar");
  assert.equal(temporaryDemoAffiliate.redirectSlug, "demo-northstar");
  assert.equal(temporaryDemoCasinos.filter((item) => item.id === temporaryDemoAffiliate.casinoId).length, 1);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { casinoOfficialUrl } from "../lib/site";
import {
  PRODUCTION_SITE_ORIGIN,
  TEMPORARY_DEMO_DATASET_ID,
  temporaryDemoAffiliateNetwork,
  temporaryDemoAffiliates,
  temporaryDemoCasinos,
  temporaryDemoOwnedIds,
} from "../scripts/temporary-production-demo-casino.manifest";
import { bestFitWinners, selectOverallShortlist } from "../lib/public-offer/best-offer-ranking";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "../lib/public-offer/public-offer.mapper";

test("temporary production manifest contains exactly 25 explicitly fictional published scenarios", () => {
  assert.equal(TEMPORARY_DEMO_DATASET_ID, "temporary-production-demo-casinos-v2");
  assert.equal(PRODUCTION_SITE_ORIGIN, "https://b4gamble.com");
  assert.equal(temporaryDemoCasinos.length, 25);
  assert.equal(new Set(temporaryDemoCasinos.map((item) => item.id)).size, 25);
  assert.equal(new Set(temporaryDemoCasinos.map((item) => item.slug)).size, 25);
  assert.ok(temporaryDemoCasinos.filter((item) => item.publicExperience === "STRUCTURED_EDITORIAL").length >= 5);
  assert.ok(temporaryDemoCasinos.filter((item) => item.draft.generalMetadata.featured).length >= 12);
  assert.ok(temporaryDemoCasinos.filter((item) => item.draft.countries.some((country) => country.countryCode === "GB" && country.availability === "AVAILABLE")).length >= 18);
  assert.equal(temporaryDemoCasinos.reduce((total, item) => total + item.draft.casinoBonuses.length, 0), 25);
  assert.ok(new Set(temporaryDemoCasinos.map((item) => item.draft.casinoBonuses[0].type)).size >= 6);
  assert.ok(new Set(temporaryDemoCasinos.map((item) => item.draft.casinoBonuses[0].wageringMultiplier)).size >= 10);
  assert.ok(temporaryDemoCasinos.filter((item) => item.draft.paymentMethods.some((payment) => payment.crypto)).length >= 5);

  for (const casino of temporaryDemoCasinos) {
    assert.match(casino.slug, /^demo-/);
    assert.match(casino.title, /^Demo /);
    assert.match(casino.domain, /^demo-[a-z]+\.example$/);
    assert.match(casino.draft.internalName || "", new RegExp(TEMPORARY_DEMO_DATASET_ID));
    assert.match(casino.draft.summary || "", /fictional/i);
    assert.match(casino.draft.description || "", /synthetic/i);
    assert.equal(casino.draft.licenses.length, 1);
    assert.match(casino.draft.licenses[0].authority, /not a real regulator/i);
    assert.equal(casino.draft.licenses[0].licenseNumber, null);
    assert.equal(casino.draft.licenses[0].verificationUrl, null);
    assert.equal(casino.draft.licenses[0].verified, false);
    assert.equal(casino.draft.websiteUrl, null);
    assert.equal(casinoOfficialUrl(casino.domain), null);
    assert.equal(casino.images.filter((item) => item.kind === "LOGO").length, 1);
    assert.equal(casino.images.filter((item) => item.kind === "HERO").length, 1);
    assert.equal(casino.images.filter((item) => item.kind === "SCREENSHOT").length, 1);
    assert.equal(casino.draft.casinoBonuses.length, 1);
    for (const offer of casino.draft.casinoBonuses) {
      assert.match(offer.title, /not a live offer/i);
      assert.equal(offer.termsUrl, null);
      assert.equal(offer.promoCode, null);
      assert.equal(offer.offerStatus, "ACTIVE");
    }
  }
});

test("reserved demo domains cannot become official-site actions", () => {
  assert.equal(casinoOfficialUrl("demo.example"), null);
  assert.equal(casinoOfficialUrl("demo.invalid"), null);
  assert.equal(casinoOfficialUrl("demo.test"), null);
  assert.equal(casinoOfficialUrl("localhost"), null);
  assert.equal(casinoOfficialUrl("operator.example.com"), "https://operator.example.com");
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
  const affiliateIds = [temporaryDemoAffiliateNetwork.networkId, ...temporaryDemoAffiliates.flatMap((item) => [item.programId, item.offerId, item.trackingLinkId, item.redirectId, item.offerRevisionId, item.trackingRevisionId, item.redirectRevisionId])];
  const all = [...listed, ...affiliateIds];
  assert.equal(temporaryDemoOwnedIds.size, all.length);
  for (const item of all) assert.match(item, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("five available demo actions stay on their own SevenBet production profiles", () => {
  assert.equal(temporaryDemoAffiliates.length, 5);
  assert.equal(new Set(temporaryDemoAffiliates.map((item) => item.casinoId)).size, 5);
  for (const item of temporaryDemoAffiliates) {
    const casino = temporaryDemoCasinos.find((record) => record.id === item.casinoId);
    assert.ok(casino);
    assert.equal(item.redirectSlug, casino.slug);
    assert.equal(item.casinoBonusId, null);
    const destination = new URL(item.internalDestination);
    assert.equal(destination.origin, PRODUCTION_SITE_ORIGIN);
    assert.equal(destination.pathname, `/casino/${casino.slug}`);
  }
});

test("manifest publication data naturally selects the Founder Office Best Offers winners", () => {
  const offers = temporaryDemoCasinos.flatMap((definition) => {
    const mapped = mapPublishedCasino({
      casinoId: definition.id,
      version: 1,
      status: "PUBLISHED",
      archivedAt: null,
      publishedAt: new Date("2026-08-06T00:00:00.000Z"),
      snapshot: {
        ...definition.draft,
        id: definition.id,
        status: "PUBLISHED",
        publishedAt: "2026-08-06T00:00:00.000Z",
        casinoBonuses: definition.draft.casinoBonuses.map((item) => ({ ...item, status: "PUBLISHED" })),
      },
    }, [], { now: new Date("2026-08-06T12:00:00.000Z"), redirectEnabled: false });
    return mapped ? publicCasinoToOffers(mapped) : [];
  });
  const shortlist = selectOverallShortlist(offers);
  const winners = bestFitWinners(shortlist);
  assert.equal(shortlist.length, 12);
  assert.equal(winners.overall?.casino.slug, "demo-northstar");
  assert.equal(winners.wagering?.casino.slug, "demo-harbour");
  assert.equal(winners.payout?.casino.slug, "demo-atlas");
});

test("only intended Best Offers demo records carry a publication revision marker", () => {
  const revised = temporaryDemoCasinos.filter((item) => item.draft.internalName?.includes("best-offers-r1"));
  assert.deepEqual(revised.map((item) => item.slug), ["demo-northstar", "demo-harbour", "demo-atlas", "demo-juniper"]);
});

test("seed converges unchanged records and cleanup is exact-ID only", () => {
  const source = readFileSync("scripts/temporary-production-demo-casinos.ts", "utf8");
  assert.match(source, /currentSnapshot\?\.internalName === definition\.draft\.internalName/);
  assert.match(source, /Unchanged \$\{definition\.slug\}/);
  assert.match(source, /deleteMany\(\{ where: \{ id: item\.redirectId/);
  assert.match(source, /deleteMany\(\{ where: \{ id: definition\.id, slug: definition\.slug, domain: definition\.domain/);
  assert.doesNotMatch(source, /startsWith|contains:\s*["']demo-|slug:\s*\{\s*startsWith/);
});

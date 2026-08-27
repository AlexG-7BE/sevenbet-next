import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyMediaRatio,
  isCasinoHeroMediaCompatible,
  isFeaturedCardMediaCompatible,
  mayPresentPromotionalMedia,
} from "../lib/media/media-presentation";
import {
  withHandoffBonusDirectoryData,
  withHandoffCasinoDiscoveryData,
  withHandoffOfferData,
} from "../lib/final-handoff/visual-data-fixture";
import { temporaryDemoBestOffers } from "../lib/demo-data/temporary-demo-best-offers";
import { parsePublicOfferQuery } from "../lib/public-offer/query";
import type { CasinoDiscoveryResult, PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

test("media dimensions map to the supported presentation classes", () => {
  assert.equal(classifyMediaRatio({ width: 1000, height: 1000 }), "square");
  assert.equal(classifyMediaRatio({ width: 1200, height: 900 }), "landscape");
  assert.equal(classifyMediaRatio({ width: 1600, height: 900 }), "wide-landscape");
  assert.equal(classifyMediaRatio({ width: 900, height: 1200 }), "portrait");
  assert.equal(classifyMediaRatio({ width: 300, height: 600 }), "tall");
  assert.equal(classifyMediaRatio({ width: 970, height: 250 }), "ultra-wide");
  assert.equal(classifyMediaRatio({ width: null, height: 900 }), "unknown");
  assert.equal(classifyMediaRatio({ width: 0, height: 0 }), "unknown");
});

test("surface compatibility rejects destructive aspect-ratio mismatches", () => {
  for (const ratio of ["square", "landscape", "wide-landscape", "unknown"] as const) {
    assert.equal(isFeaturedCardMediaCompatible(ratio), true, ratio);
  }
  for (const ratio of ["portrait", "tall", "ultra-wide"] as const) {
    assert.equal(isFeaturedCardMediaCompatible(ratio), false, ratio);
  }
  for (const ratio of ["square", "landscape", "wide-landscape", "portrait", "tall", "unknown"] as const) {
    assert.equal(isCasinoHeroMediaCompatible(ratio), true, ratio);
  }
  assert.equal(isCasinoHeroMediaCompatible("ultra-wide"), false);
});

test("real promotional media fails closed without a governed action", () => {
  assert.equal(mayPresentPromotionalMedia({ demonstration: false, governedActionAvailable: false }), false);
  assert.equal(mayPresentPromotionalMedia({ demonstration: false, governedActionAvailable: true }), true);
  assert.equal(mayPresentPromotionalMedia({ demonstration: true, governedActionAvailable: false }), true);
});

test("casino discovery fixtures include the required wide, landscape, square and fallback states", () => {
  const seed: PublicCasinoCardDto = {
    id: "seed",
    dataClassification: "DEMO_FIXTURE",
    slug: "seed",
    name: "Seed Casino",
    logo: null,
    hero: null,
    shortDescription: null,
    rating: 8,
    reviewCount: null,
    licenses: [],
    countries: [],
    paymentMethods: [],
    gameProviders: [],
    categories: [],
    highlights: [],
    featuredBonus: null,
    visitAction: { available: false, redirectSlug: null, label: "Unavailable", reasonCode: "NO_GOVERNED_ROUTE" },
    responsibleGamblingLabel: null,
    publishedAt: null,
    editorialUpdatedAt: null,
  };
  const result: CasinoDiscoveryResult = {
    items: [seed],
    inventoryMode: "DEMO_ONLY",
    total: 1,
    page: 1,
    pageSize: 1,
    pageCount: 1,
    facets: { countries: [], licenses: [], payments: [], gameProviders: [], categories: [], bonusTypes: [] },
    appliedFilters: {},
  };

  const fixture = withHandoffCasinoDiscoveryData(result, true);
  assert.deepEqual(fixture.items.slice(0, 4).map((casino) => casino.hero ? [casino.hero.width, casino.hero.height] : null), [
    [1600, 900],
    [1200, 900],
    [1000, 1000],
    null,
  ]);
});

test("Phase 2 offer fixtures expose only fictional logo and governed media-ratio states", () => {
  const seed = temporaryDemoBestOffers()[0];
  const bestOffers = withHandoffOfferData({ records: [seed], inventoryMode: "DEMO_ONLY" }, true);
  assert.deepEqual(bestOffers.records.slice(0, 4).map((offer) => offer.casino.hero ? [offer.casino.hero.width, offer.casino.hero.height] : null), [
    [1600, 900],
    [1200, 900],
    [1000, 1000],
    null,
  ]);
  assert.ok(bestOffers.records.every((offer) => offer.casino.logo?.url.startsWith("/demo-casinos/demo-")));
  assert.ok(bestOffers.records.every((offer) => offer.dataClassification === "DEMO_FIXTURE" && !offer.action.available && offer.action.href === null));

  const query = parsePublicOfferQuery({});
  const bonuses = withHandoffBonusDirectoryData({
    records: [seed],
    total: 1,
    page: 1,
    pageSize: 24,
    pageCount: 1,
    query,
    facets: { countries: [], types: [], payments: [], crypto: [], availability: [] },
    inventoryMode: "DEMO_ONLY",
  }, true);
  assert.equal(bonuses.inventoryMode, "DEMO_ONLY");
  assert.deepEqual(bonuses.records.slice(0, 3).map((offer) => offer.casino.hero ? [offer.casino.hero.width, offer.casino.hero.height] : null), [
    [1600, 900],
    [1000, 1000],
    null,
  ]);
  assert.ok(bonuses.records.every((offer) => !offer.action.available && offer.action.href === null));
});

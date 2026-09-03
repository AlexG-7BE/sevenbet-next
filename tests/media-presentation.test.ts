import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
  withHandoffCasinoProfileData,
} from "../lib/final-handoff/visual-data-fixture";
import { temporaryDemoBestOffers, temporaryDemoCasinoProfiles } from "../lib/demo-data/temporary-demo-best-offers";
import { demoProfileCopy } from "../lib/i18n/demo-profile-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { visualFixtureCopy } from "../lib/i18n/visual-fixture-catalog";
import type { SupportedLocale } from "../lib/market/registry";
import { parsePublicOfferQuery } from "../lib/public-offer/query";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
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

test("surface compatibility accepts contain-fit campaign formats and rejects vertical mismatches", () => {
  for (const ratio of ["square", "landscape", "wide-landscape", "ultra-wide", "unknown"] as const) {
    assert.equal(isFeaturedCardMediaCompatible(ratio), true, ratio);
  }
  for (const ratio of ["portrait", "tall"] as const) {
    assert.equal(isFeaturedCardMediaCompatible(ratio), false, ratio);
  }
  for (const ratio of ["square", "landscape", "wide-landscape", "ultra-wide", "unknown"] as const) {
    assert.equal(isCasinoHeroMediaCompatible(ratio), true, ratio);
  }
  for (const ratio of ["portrait", "tall"] as const) {
    assert.equal(isCasinoHeroMediaCompatible(ratio), false, ratio);
  }
});

test("controlled promotional media stays editorially visible independently of its governed action", () => {
  assert.equal(mayPresentPromotionalMedia({ demonstration: false, governedActionAvailable: false }), true);
  assert.equal(mayPresentPromotionalMedia({ demonstration: false, governedActionAvailable: true }), true);
  assert.equal(mayPresentPromotionalMedia({ demonstration: true, governedActionAvailable: false }), true);
});

test("missing or incompatible artwork never contradicts an available commercial action", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CommercialOfferMedia } = await import("../components/commercial-media/CommercialOfferMedia");
  const messages = productPageMessages("en-GB");
  const seed = temporaryDemoBestOffers()[0];
  const available: PublicOfferDTO = {
    ...seed,
    action: { available: true, href: "/r/media-test" },
    commercialAvailability: "AVAILABLE",
    dataClassification: "PUBLISHED_RECORD",
  };
  for (const hero of [null, { id: "portrait", type: "hero" as const, url: "/portrait.jpg", alt: "Portrait", width: 300, height: 600, caption: null }]) {
    const offer = { ...available, casino: { ...available.casino, hero } };
    const html = renderToStaticMarkup(React.createElement(CommercialOfferMedia, { messages, offer, variant: "featured" }));
    assert.equal(offer.action.available, true);
    assert.match(html, new RegExp(messages.common.mediaUnavailableTitle));
    assert.match(html, new RegExp(messages.common.mediaUnavailableCopy));
    assert.doesNotMatch(html, new RegExp(messages.common.commercialUnavailable));
  }
});

test("identity logos next to the same visible casino name are decorative", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { OperatorLogo } = await import("../components/commercial-media/CommercialOfferMedia");
  const offer = temporaryDemoBestOffers()[0];
  const html = renderToStaticMarkup(React.createElement(OperatorLogo, { offer }));
  assert.match(html, /<img alt=""/);
  assert.doesNotMatch(html, new RegExp(`alt="[^"]*${offer.casino.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

test("casino discovery fixtures include the required wide, landscape, square and fallback states", () => {
  const seed: PublicCasinoCardDto = {
    id: "seed",
    dataClassification: "DEMO_FIXTURE",
    disposition: "INFORMATIONAL_ONLY",
    dispositionReason: "NON_PUBLIC_SYNTHETIC_IDENTITY",
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
    facets: { countries: [], currencies: [], licenses: [], payments: [], gameProviders: [], categories: [], bonusTypes: [] },
    appliedFilters: {},
  };

  const fixture = withHandoffCasinoDiscoveryData(result, true);
  assert.deepEqual(fixture.items.slice(0, 4).map((casino) => casino.hero ? [casino.hero.width, casino.hero.height] : null), [
    [1600, 900],
    [1200, 900],
    [1000, 1000],
    null,
  ]);
  assert.equal(fixture.total, 10);
  assert.equal(fixture.page, 1);
  assert.equal(fixture.pageSize, 5);
  assert.equal(fixture.pageCount, 2);

  const secondPage = withHandoffCasinoDiscoveryData({ ...result, items: [], page: 2 }, true);
  assert.equal(secondPage.items.length, 5);
  assert.equal(secondPage.page, 2);
  assert.equal(secondPage.pageCount, 2);
  assert.deepEqual(new Set([...fixture.items, ...secondPage.items].map((casino) => casino.id)).size, 10);
  assert.ok(secondPage.items.every((casino) => casino.dataClassification === "DEMO_FIXTURE"));
  assert.ok(secondPage.items.every((casino) => !casino.visitAction.available && casino.visitAction.redirectSlug === null));

  const gbFixture = withHandoffCasinoDiscoveryData(result, true, true);
  assert.equal(gbFixture.items.filter((casino) => casino.visitAction.available).length, 1);
  assert.equal(gbFixture.items[0].dataClassification, "LOCAL_PREVIEW_FIXTURE");
  assert.equal(gbFixture.items[0].visitAction.redirectSlug, "local-preview-no-destination");
  assert.ok(fixture.items.every((casino) => casino.dataClassification === "DEMO_FIXTURE"));
  assert.ok(fixture.items.every((casino) => !casino.visitAction.available && casino.visitAction.redirectSlug === null));
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
  assert.equal(bonuses.total, 8);
  assert.equal(bonuses.page, 1);
  assert.equal(bonuses.pageSize, 4);
  assert.equal(bonuses.pageCount, 2);
  assert.equal(bonuses.records.length, 4);
  assert.deepEqual(bonuses.records.slice(0, 3).map((offer) => offer.casino.hero ? [offer.casino.hero.width, offer.casino.hero.height] : null), [
    [1600, 900],
    [1000, 1000],
    null,
  ]);
  assert.ok(bonuses.records.every((offer) => !offer.action.available && offer.action.href === null));

  const secondPageQuery = { ...query, page: 2 };
  const secondBonusPage = withHandoffBonusDirectoryData({
    records: [],
    total: 0,
    page: 1,
    pageSize: 24,
    pageCount: 0,
    query,
    facets: { countries: [], types: [], payments: [], crypto: [], availability: [] },
    inventoryMode: "DEMO_ONLY",
  }, true, "en-GB", secondPageQuery);
  assert.equal(secondBonusPage.total, 8);
  assert.equal(secondBonusPage.page, 2);
  assert.equal(secondBonusPage.pageSize, 4);
  assert.equal(secondBonusPage.pageCount, 2);
  assert.equal(secondBonusPage.records.length, 4);
  assert.deepEqual(secondBonusPage.query, secondPageQuery);
  assert.equal(new Set([...bonuses.records, ...secondBonusPage.records].map((offer) => offer.bonus.id)).size, 8);
  assert.ok(secondBonusPage.records.every((offer) => offer.dataClassification === "DEMO_FIXTURE"));
  assert.ok(secondBonusPage.records.every((offer) => !offer.action.available && offer.action.href === null));
});

test("all European visual fixtures localize reader-facing copy and expose only the matching Solvane review", () => {
  const locales = [
    "en-GB", "de-DE", "it-IT", "es-ES", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO",
  ] as const satisfies readonly SupportedLocale[];
  const offerSeed = temporaryDemoBestOffers()[0];
  const query = parsePublicOfferQuery({});
  const discoverySeed: CasinoDiscoveryResult = {
    items: [],
    inventoryMode: "DEMO_ONLY",
    total: 0,
    page: 1,
    pageSize: 1,
    pageCount: 0,
    facets: { countries: [], currencies: [], licenses: [], payments: [], gameProviders: [], categories: [], bonusTypes: [] },
    appliedFilters: {},
  };
  const bonusSeed = {
    records: [offerSeed],
    total: 1,
    page: 1,
    pageSize: 24,
    pageCount: 1,
    query,
    facets: { countries: [], types: [], payments: [], crypto: [], availability: [] },
    inventoryMode: "DEMO_ONLY" as const,
  };
  const recurringEnglishFixtureCopy = /(?:fictional (?:payout|wagering|deposit|support|review)|interface testing|not evidence of operator performance|free spins|minimum deposit|terms shown before action|new customers|welcome bonus|fictional preview logo|media-ratio preview|live casino|fast verification|vip programme|24\/7 support|mobile-first|low deposit|crypto accepted|control tools listed|visit (?:solvane|marlowe|kestrel|aldwyn|verano|nordhem|orlan|vespera|halcyon|bruma|novara|perla))/iu;

  for (const locale of locales) {
    const messages = productPageMessages(locale);
    const copy = demoProfileCopy(locale);
    const fixtureCopy = visualFixtureCopy(locale);
    const bestOffers = withHandoffOfferData({ records: [offerSeed], inventoryMode: "DEMO_ONLY" }, true, locale);
    const bonusPageOne = withHandoffBonusDirectoryData(bonusSeed, true, locale);
    const bonusPageTwo = withHandoffBonusDirectoryData({ ...bonusSeed, records: [], query: { ...query, page: 2 } }, true, locale);
    const casinoPageOne = withHandoffCasinoDiscoveryData(discoverySeed, true, false, locale);
    const casinoPageTwo = withHandoffCasinoDiscoveryData({ ...discoverySeed, page: 2 }, true, false, locale);
    const offers = [...bestOffers.records, ...bonusPageOne.records, ...bonusPageTwo.records];
    const casinos = [...casinoPageOne.items, ...casinoPageTwo.items];

    assert.deepEqual(bestOffers.records.map((offer) => offer.casino.slug), ["solvane-casino", "marlowe-casino", "kestrel-casino", "aldwyn-casino", "verano-casino", "nordhem-casino"]);
    assert.deepEqual(bestOffers.records.map((offer) => offer.casino.reviewHref), ["/casino/demo-plume?visualFixture=true", null, null, null, null, null]);
    assert.deepEqual(casinos.map((casino) => casino.reviewHref), ["/casino/demo-plume?visualFixture=true", null, null, null, null, null, null, null, null, null]);
    assert.equal(new Set([...bonusPageOne.records, ...bonusPageTwo.records].map((offer) => offer.bonus.id)).size, 8);
    assert.deepEqual([...bonusPageOne.records, ...bonusPageTwo.records].map((offer) => offer.casino.reviewHref), ["/casino/demo-plume?visualFixture=true", null, null, null, null, null, null, null]);
    assert.ok(offers.every((offer) => !offer.action.available && offer.action.href === null));
    assert.ok(casinos.every((casino) => !casino.visitAction.available && casino.visitAction.redirectSlug === null));
    assert.ok(offers.every((offer) => offer.casino.summary === copy.summary));
    assert.ok(offers.every((offer) => offer.bonus.type === "WELCOME"));
    assert.ok(offers.every((offer) => offer.bonus.eligibility === copy.bonus.eligibility));
    assert.ok(offers.every((offer) => offer.bonus.importantConditions.join("\n") === copy.bonus.conditions.join("\n")));
    assert.ok(offers.every((offer) => offer.casino.payments.every((payment) => payment.fees === null && payment.minimumWithdrawal === null && payment.maximumWithdrawal === null)));
    assert.ok(casinos.every((casino) => casino.responsibleGamblingLabel === messages.profile.controlTools));
    assert.equal(bonusPageOne.facets.types[0]?.value, "WELCOME");
    assert.equal(bonusPageOne.facets.types[0]?.label, fixtureCopy.welcomeBonusType);
    assert.equal(casinoPageOne.facets.bonusTypes[0]?.key, "WELCOME");
    assert.equal(casinoPageOne.facets.bonusTypes[0]?.label, fixtureCopy.welcomeBonusType);

    const visibleCorpus = [
      ...offers.flatMap((offer) => [
        offer.casino.summary,
        offer.casino.logo?.alt,
        offer.casino.hero?.alt,
        ...offer.casino.responsibleGamblingTools,
        ...offer.casino.payments.map((payment) => payment.withdrawalTime),
        offer.bonus.title,
        offer.bonus.summary,
        offer.bonus.wageringText,
        offer.bonus.eligibility,
        ...offer.bonus.importantConditions,
      ]),
      ...casinos.flatMap((casino) => [
        casino.logo?.alt,
        casino.hero?.alt,
        casino.shortDescription,
        ...casino.highlights,
        casino.featuredBonus?.title,
        casino.featuredBonus?.summary,
        ...(casino.featuredBonus?.keyTerms ?? []),
        casino.visitAction.label,
        casino.responsibleGamblingLabel,
      ]),
      ...bonusPageOne.facets.types.map((facet) => facet.label),
      ...bonusPageOne.facets.countries.map((facet) => facet.label),
      ...casinoPageOne.facets.bonusTypes.map((facet) => facet.label),
      ...casinoPageOne.facets.countries.map((facet) => facet.label),
    ].filter((value): value is string => Boolean(value)).join("\n");

    assert.match(visibleCorpus, new RegExp(copy.summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (locale !== "en-GB") assert.doesNotMatch(visibleCorpus, recurringEnglishFixtureCopy, locale);
  }
});

test("fixture copy preserves machine values while rendering natural DE, EL and FI labels", () => {
  const offerSeed = temporaryDemoBestOffers()[0];
  const profileSeed = temporaryDemoCasinoProfiles()[0];
  const query = parsePublicOfferQuery({});
  const bonusSeed = {
    records: [offerSeed],
    total: 1,
    page: 1,
    pageSize: 24,
    pageCount: 1,
    query,
    facets: {
      countries: [{ value: "GB", label: "Great Britain", count: 1 }],
      types: [{ value: "WELCOME", label: "WELCOME", count: 1 }],
      payments: [{ value: "bank-transfer", label: "Bank transfer", count: 1 }],
      crypto: [{ value: "true", label: "Crypto supported", count: 1 }],
      availability: [{ value: "UNAVAILABLE", label: "Review only", count: 1 }],
    },
    inventoryMode: "DEMO_ONLY" as const,
  };
  const expected = {
    "de-DE": {
      cashback: "Wöchentlich 10 % Cashback, bis zu 200 €",
      closedPayout: "0–24 Stunden",
      cryptoPayout: "0–2 Stunden · Krypto unterstützt",
      market: "Deutschland",
      openPayout: "mindestens 48 Stunden",
      type: "Willkommensbonus",
    },
    "el-GR": {
      cashback: "Επιστροφή χρημάτων 10% κάθε εβδομάδα, έως 200 €",
      closedPayout: "0–24 ώρες",
      cryptoPayout: "0–2 ώρες · υποστηρίζει κρυπτονομίσματα",
      market: "Ελλάδα",
      openPayout: "τουλάχιστον 48 ώρες",
      type: "μπόνους καλωσορίσματος",
    },
    "fi-FI": {
      cashback: "Viikoittainen 10 %:n palautus, enintään 200 €",
      closedPayout: "0–24 tuntia",
      cryptoPayout: "0–2 tuntia · kryptovaluuttoja tuetaan",
      market: "Suomi",
      openPayout: "vähintään 48 tuntia",
      type: "tervetuliaisbonus",
    },
  } as const satisfies Partial<Record<SupportedLocale, Readonly<{
    cashback: string;
    closedPayout: string;
    cryptoPayout: string;
    market: string;
    openPayout: string;
    type: string;
  }>>>;

  for (const [locale, copy] of Object.entries(expected) as Array<[keyof typeof expected, (typeof expected)[keyof typeof expected]]>) {
    const pageOne = withHandoffBonusDirectoryData(bonusSeed, true, locale, query);
    const pageTwo = withHandoffBonusDirectoryData({ ...bonusSeed, records: [] }, true, locale, { ...query, page: 2 });
    const offers = [...pageOne.records, ...pageTwo.records];

    assert.equal(offers[0]?.casino.payments[0]?.withdrawalTime, copy.closedPayout, locale);
    assert.equal(offers[3]?.casino.payments[0]?.withdrawalTime, copy.cryptoPayout, locale);
    assert.equal(offers[5]?.casino.payments[0]?.withdrawalTime, copy.openPayout, locale);
    assert.equal(offers[7]?.bonus.title, copy.cashback, locale);
    assert.equal(pageOne.facets.types[0]?.value, "WELCOME", locale);
    assert.equal(pageOne.facets.types[0]?.label, copy.type, locale);
    assert.equal(pageOne.facets.countries[0]?.value, locale.slice(-2), locale);
    assert.equal(pageOne.facets.countries[0]?.label, copy.market, locale);
    assert.equal(pageOne.facets.payments.some((facet) => facet.label === "Bank transfer"), false, locale);
  }

  const finnishProfile = withHandoffCasinoProfileData(profileSeed, true, "fi-FI");
  assert.equal(finnishProfile.bonuses[0]?.summary, "Selkeästi esitetty tervetulotarjous, jonka olennaiset ehdot näytetään ennen kuin jatkat.");
  assert.deepEqual(finnishProfile.bonuses[0]?.importantConditions, [
    "Ehdot näytetään ennen kuin jatkat",
    "Enimmäispanosraja on voimassa.",
  ]);
});

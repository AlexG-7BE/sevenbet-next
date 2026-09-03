import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CasinoDiscoveryCardMarkup,
  DirectoryFeaturedTheatreMarkup,
  type CasinoCardClassNames,
} from "../components/casino-discovery/CasinoDiscoveryCard";
import { temporaryDemoBestOffers } from "../lib/demo-data/temporary-demo-best-offers";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

const messages = productPageMessages("en-GB");
const presentation = resolvePresentationContext({});
const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const classNames = Object.fromEntries([
  "casinoCard", "cardHeader", "position", "logo", "identity", "score", "description", "signals", "signal", "offerBlock", "commission", "unavailable", "cardActions", "featurePlaceholder", "featureTheatre", "featureMedia", "featureOverlay", "featureCopy", "featureMetrics", "featureCard", "featureEyebrow",
].map((name) => [name, name])) as CasinoCardClassNames;

function offer(published = true): PublicOfferDTO {
  const seed = temporaryDemoBestOffers()[0];
  assert.ok(seed);
  return {
    ...seed,
    action: published ? { available: true, href: "/r/truth-test" } : { available: false, href: null },
    commercialAvailability: published ? "AVAILABLE" : "UNAVAILABLE",
    dataClassification: published ? "PUBLISHED_RECORD" : "DEMO_FIXTURE",
  };
}

function casino(patch: Partial<PublicCasinoCardDto> = {}): PublicCasinoCardDto {
  return {
    id: "truth-casino",
    dataClassification: "PUBLISHED_RECORD",
    disposition: "PROMOTABLE",
    dispositionReason: "EXACT_MARKET_AND_ROUTE_ELIGIBLE",
    slug: "truth-casino",
    name: "Truth Casino",
    logo: null,
    hero: null,
    shortDescription: "Published editorial review.",
    rating: 8.2,
    reviewCount: null,
    licenses: [],
    countries: [],
    paymentMethods: [],
    gameProviders: [],
    categories: [],
    highlights: [],
    featuredBonus: null,
    visitAction: { available: true, redirectSlug: "truth-casino-visit", label: "Visit casino", reasonCode: null },
    responsibleGamblingLabel: null,
    publishedAt: "2030-01-01T00:00:00.000Z",
    editorialUpdatedAt: "2030-01-02T00:00:00.000Z",
    ...patch,
  };
}

test("Best Offers derives its page-level partner-link count and label from governed actions", () => {
  const source = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  assert.match(source, /const governedActionCount = result\.records\.filter/);
  assert.match(source, /const actionAvailabilityLabel = governedActionCount > 0/);
  assert.match(source, /String\(governedActionCount\), messages\.bestOffers\.inferredActions/);
  assert.doesNotMatch(source, /\["0", messages\.bestOffers\.inferredActions\]/);
});

test("casino directory disclosure does not deny a governed action in mixed inventory", () => {
  const source = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(source, /const hasGovernedAction = result\.items\.some/);
  assert.match(source, /result\.inventoryMode === "MIXED" && hasGovernedAction/);
  assert.doesNotMatch(source, /messages\.common\.demoDisclosure\} \{hasLocalPreviewAction/);
});

test("Best Offers labels published and demonstration records without contradicting an available action", async () => {
  const { BestOffersExperience } = await import("../components/best-offers/BestOffersExperience");
  const publishedHtml = renderToStaticMarkup(<BestOffersExperience
    inventoryMode="PUBLISHED_ONLY"
    messages={messages}
    presentation={presentation}
    shortlist={[offer()]}
  />);
  assert.ok(publishedHtml.includes(messages.common.actionAvailable));
  assert.ok(!publishedHtml.includes(messages.common.commercialUnavailable));
  assert.match(publishedHtml, />Published</);
  assert.doesNotMatch(publishedHtml, />Current</);

  const demoHtml = renderToStaticMarkup(<BestOffersExperience
    inventoryMode="DEMO_ONLY"
    messages={messages}
    presentation={presentation}
    shortlist={[offer(false)]}
  />);
  assert.ok(demoHtml.includes(messages.common.demoData));
  assert.ok(!demoHtml.includes(`<small>${messages.common.current}</small>`));
  assert.doesNotMatch(demoHtml, />Current</);
});

test("casino cards keep missing bonus data separate from governed visit availability", () => {
  const record = casino();
  const cardHtml = renderToStaticMarkup(<CasinoDiscoveryCardMarkup casino={record} classNames={classNames} position={1} />);
  assert.ok(cardHtml.includes(messages.common.bonusAvailability));
  assert.ok(cardHtml.includes(messages.common.notListed));
  assert.match(cardHtml, /href="\/r\/truth-casino-visit"/);
  assert.ok(!cardHtml.includes(messages.common.reviewAvailableNoAction));
  assert.ok(!cardHtml.includes(messages.common.commercialUnavailable));

  const theatreHtml = renderToStaticMarkup(<DirectoryFeaturedTheatreMarkup casino={record} classNames={classNames} />);
  assert.ok(theatreHtml.includes(`<b>${messages.common.actionAvailable}</b>`));
  assert.ok(!theatreHtml.includes(`<b>${messages.common.reviewOnly}</b>`));
});

test("curated casino cards preserve visit actions when bonus data is absent and never mark demos Current", async () => {
  const { CuratedCasinoShortlist } = await import("../components/casino-discovery/CuratedCasinoShortlist");
  const publishedHtml = renderToStaticMarkup(<CuratedCasinoShortlist casinos={[casino()]} messages={messages} presentation={presentation} />);
  assert.match(publishedHtml, /href="\/r\/truth-casino-visit"/);
  assert.ok(publishedHtml.includes(messages.common.notListed));
  assert.ok(!publishedHtml.includes(messages.common.reviewAvailableNoAction));
  assert.ok(!publishedHtml.includes(messages.common.commercialUnavailable));

  const previewHtml = renderToStaticMarkup(<CuratedCasinoShortlist
    casinos={[casino({ dataClassification: "LOCAL_PREVIEW_FIXTURE" })]}
    messages={messages}
    presentation={presentation}
  />);
  assert.match(previewHtml, /href="\/r\/truth-casino-visit"/);
  assert.ok(previewHtml.includes(messages.common.marketPresentationNotice));
  assert.ok(!previewHtml.includes(messages.common.demoDisclosure));

  const demoHtml = renderToStaticMarkup(<CuratedCasinoShortlist
    casinos={[casino({
      dataClassification: "DEMO_FIXTURE",
      featuredBonus: { title: "Fictional terms", summary: "Demonstration only", type: "WELCOME", keyTerms: [], wageringRequirement: null, minimumDeposit: null, currency: null, validUntil: null, termsApply: true },
      visitAction: { available: false, redirectSlug: null, label: "Unavailable", reasonCode: "DEMO_FIXTURE" },
    })]}
    messages={messages}
    presentation={presentation}
  />);
  assert.ok(demoHtml.includes(messages.common.demoData));
  assert.doesNotMatch(demoHtml, />Current</);
});

test("bonus result summaries stay neutral while record labels reflect their classification", async () => {
  const { BonusComparisonList, FeaturedBonusCard } = await import("../components/bonus-directory/BonusDirectory");
  const published = offer();
  const publishedHtml = renderToStaticMarkup(<BonusComparisonList messages={messages} offers={[published]} presentation={presentation} startPosition={1} />);
  assert.ok(publishedHtml.includes(`<strong>1 ${messages.common.result}</strong>`));
  assert.ok(!publishedHtml.includes(`<strong>${messages.common.reviewOnly}`));
  assert.ok(publishedHtml.includes(messages.common.actionAvailable));
  assert.match(publishedHtml, />Published</);
  assert.doesNotMatch(publishedHtml, />Current</);

  const demo = offer(false);
  const demoHtml = renderToStaticMarkup(<FeaturedBonusCard offer={demo} position={1} />)
    + renderToStaticMarkup(<BonusComparisonList messages={messages} offers={[demo]} presentation={presentation} startPosition={1} />);
  assert.ok(demoHtml.includes(messages.common.demoData));
  assert.doesNotMatch(demoHtml, /Demo fixture|>Current</);
});

test("curated bonus cards never label demonstration records as current", async () => {
  const { CuratedBonusShortlist } = await import("../components/bonus-directory/CuratedBonusShortlist");
  const demoHtml = renderToStaticMarkup(<CuratedBonusShortlist offers={[offer(false)]} messages={messages} presentation={presentation} />);
  assert.ok(demoHtml.includes(`<small>${messages.common.demoData}</small>`));
  assert.ok(!demoHtml.includes(`<small>${messages.common.current}</small>`));
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { publicOffersFixture } from "./fixtures/public-presentation-fixtures";
import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

const messages = productPageMessages("en-GB");
const copy = commercialUxMessages("en-GB");
const presentation = resolvePresentationContext({});
const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;
function offer(published = true): PublicOfferDTO {
  const seed = publicOffersFixture()[0];
  assert.ok(seed);
  return {
    ...seed,
    action: published ? { href: "/r/truth-test" } : null,
    dataClassification: published ? "PUBLISHED_RECORD" : "DEMO_FIXTURE",
  };
}

function casino(patch: Partial<PublicCasinoCardDto> = {}): PublicCasinoCardDto {
  return {
    id: "truth-casino",
    dataClassification: "PUBLISHED_RECORD",
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
    action: { href: "/r/truth-casino-visit" },
    responsibleGamblingLabel: null,
    publishedAt: "2030-01-01T00:00:00.000Z",
    editorialUpdatedAt: "2030-01-02T00:00:00.000Z",
    ...patch,
  };
}

test("Best Offers delegates action visibility to the governed normalized shortlist", () => {
  const source = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  assert.match(source, /rankBestOffersForCategory\(result\.records, "best_overall"/);
  assert.match(source, /<BestOffersExperience[^>]+shortlist=\{result\.records\}/);
  assert.doesNotMatch(source, /governedActionCount|inferredActions/);
});

test("casino directory keeps disclosure separate from per-card governed actions", () => {
  const source = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(source, /result\.inventoryMode !== "PUBLISHED_ONLY"/);
  assert.match(source, /<CasinoCollection casinos=\{result\.items\}/);
  assert.doesNotMatch(source, /visitAction:\s*\{\s*available:\s*false/);
});

test("Best Offers labels published and demonstration records without contradicting an available action", async () => {
  const { BestOffersExperience } = await import("../components/best-offers/BestOffersExperience");
  const publishedHtml = renderToStaticMarkup(<BestOffersExperience
    inventoryMode="PUBLISHED_ONLY"
    messages={messages}
    presentation={presentation}
    shortlist={[offer()]}
  />);
  assert.match(publishedHtml, /href="\/r\/truth-test\?placement=CTA_BEST_OFFERS_CARD"/);
  assert.ok(!publishedHtml.includes(messages.common.commercialUnavailable));
  assert.doesNotMatch(publishedHtml, />Current</);

  const demoHtml = renderToStaticMarkup(<BestOffersExperience
    inventoryMode="DEMO_ONLY"
    messages={messages}
    presentation={presentation}
    shortlist={[offer(false)]}
  />);
  assert.ok(demoHtml.includes(messages.common.reviewOnly));
  assert.doesNotMatch(demoHtml, /href="\/r\//);
  assert.ok(!demoHtml.includes(`<small>${messages.common.current}</small>`));
  assert.doesNotMatch(demoHtml, />Current</);
});

test("casino cards keep missing bonus data separate from governed visit availability", async () => {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  // This record has a governed visit action but no published bonus, so the two states must not merge.
  const cardHtml = renderToStaticMarkup(<CasinoCollection
    casinos={[casino()]}
    initialSearch=""
    messages={messages}
    presentation={presentation}
  />);
  assert.ok(cardHtml.includes(copy.currentOffer));
  assert.ok(cardHtml.includes(copy.notVerified));
  assert.match(cardHtml, /href="\/r\/truth-casino-visit\?placement=CTA_CASINO_COLLECTION_CARD"/);
  assert.ok(!cardHtml.includes(messages.common.reviewOnly));
  assert.ok(!cardHtml.includes(messages.common.commercialUnavailable));
});

test("an unrelated page-level commercial state cannot suppress a canonical card action", async () => {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  const html = renderToStaticMarkup(<CasinoCollection
    casinos={[casino()]}
    initialSearch=""
    messages={messages}
    presentation={presentation}
  />);
  assert.match(html, /Truth Casino/);
  assert.match(html, /href="\/casino\/truth-casino"/);
  assert.match(html, /href="\/r\/truth-casino-visit/);
  assert.match(html, /data-commercial-action-source="CTA"/);
  assert.doesNotMatch(readFileSync("components/casino-discovery/CasinoCollection.tsx", "utf8"), /commercialProductsAvailable/);
});

// The curated shortlists and the faceted bonus directory these checks used to
// render are imported by no route. Each rule below is asserted on the component
// a reader actually reaches: CasinoCollection on /casinos and
// BonusOfferDirectory on /bonuses.

test("casino directory keeps editorial inventory fail-closed where a record has no canonical action", async () => {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  const informational = casino({ id: "information-only", slug: "information-only", name: "Information Only", action: null });
  const promotable = casino({ id: "promotable", slug: "promotable", name: "Promotable" });
  const html = renderToStaticMarkup(<CasinoCollection
    casinos={[informational, promotable]}
    initialSearch=""
    messages={messages}
    presentation={presentation}
  />);

  // Editorial inclusion does not depend on a route: both records are listed.
  assert.ok(html.includes("Information Only"));
  assert.ok(html.includes("Promotable"));
  // Only the record with a canonical action receives one, through the governed redirect.
  assert.equal((html.match(/href="\/r\/[^"]+"/g) ?? []).length, 1);
  assert.match(html, /href="\/r\/truth-casino-visit\?placement=CTA_CASINO_COLLECTION_CARD"/);
  // The other offers its review as the card's live action instead of a dead box.
  assert.ok(!html.includes(messages.common.reviewOnly));
  assert.match(html, /<a[^>]*data-review-primary=""[^>]*href="\/casino\/information-only"/);
  assert.equal((html.match(/data-review-primary=""/g) ?? []).length, 1);
  assert.doesNotMatch(html, /data-commercial-action-source="CREATIVE"/);
});

test("casino directory never presents a demonstration or preview record as current or actionable", async () => {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  for (const dataClassification of ["DEMO_FIXTURE", "LOCAL_PREVIEW_FIXTURE"] as const) {
    const html = renderToStaticMarkup(<CasinoCollection
      casinos={[casino({ dataClassification, action: null, reviewHref: "/casino/truth-casino" })]}
      initialSearch=""
      messages={messages}
      presentation={presentation}
    />);
    assert.doesNotMatch(html, /href="\/r\//, dataClassification);
    assert.doesNotMatch(html, />Current</, dataClassification);
    assert.ok(html.includes(messages.common.viewDemonstration), dataClassification);
    assert.ok(!html.includes(messages.common.readReview), `${dataClassification} must not read as a published review`);
    // Only published records are measured.
    assert.doesNotMatch(html, /data-analytics-casino-id=/, dataClassification);
  }
});

test("casino directory renders no operator artwork, whatever the record carries", async () => {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  const promotional = casino({
    featuredBonus: { title: "Verified welcome offer", summary: "Current published terms", type: "WELCOME", keyTerms: ["Terms apply"], wageringRequirement: 30, minimumDeposit: 10, currency: "GBP", validUntil: null, termsApply: true },
    hero: { url: "/controlled/truth-casino-300x250.jpg", alt: "Truth Casino verified offer creative", width: 300, height: 250, renderingMode: "CONTAIN", source: "EXPLICIT", focalPoint: null },
  });
  const render = (record: PublicCasinoCardDto) => renderToStaticMarkup(<CasinoCollection
    casinos={[record]}
    initialSearch=""
    messages={messages}
    presentation={presentation}
  />);

  // The directory is logo-only: a record's promotional creative never reaches
  // the card, so the only commercial entry point is the governed CTA.
  const authorized = render(promotional);
  assert.equal((authorized.match(/href="\/r\/truth-casino-visit\?placement=CTA_CASINO_COLLECTION_CARD"/g) ?? []).length, 1);
  assert.match(authorized, /data-commercial-action-source="CTA"/);
  assert.doesNotMatch(authorized, /truth-casino-300x250|data-commercial-action-source="CREATIVE"/);
  assert.doesNotMatch(authorized, /href="\/outbound\/|aria-haspopup="dialog"|You are leaving B4GAMBLE|<dialog/);
  assert.doesNotMatch(authorized, /href="https?:\/\//);

  const blocked = render(casino({ ...promotional, action: null }));
  assert.doesNotMatch(blocked, /truth-casino-300x250|data-commercial-action-source="CREATIVE"|href="\/outbound\/|href="\/r\//);
});

test("bonus directory routes an available offer only through the governed action", async () => {
  const { BonusOfferDirectory } = await import("../components/bonus-directory/BonusOfferDirectory");
  const html = renderToStaticMarkup(<BonusOfferDirectory messages={messages} offers={[offer()]} presentation={presentation} />);

  assert.equal((html.match(/href="\/r\/[^"]+"/g) ?? []).length, 1);
  assert.match(html, /href="\/r\/truth-test\?placement=CTA_BONUS_CARD"/);
  assert.match(html, /data-commercial-action-source="CTA"/);
  assert.ok(html.includes(`1 ${copy.offersShown}`));
  assert.ok(!html.includes(messages.common.reviewOnly));
  assert.ok(!html.includes(messages.common.commercialUnavailable));
  assert.doesNotMatch(html, />Current</);
  // No raw operator destination; a terms link, when present, is https only.
  assert.doesNotMatch(html, /destinationUrl|trackingUrl|https:\/\/tracking/);
  for (const [, href] of html.matchAll(/<a[^>]+href="(https?:[^"]+)"/g)) assert.match(href, /^https:\/\//);
  assert.match(html, /data-analytics-casino-id=/);
});

test("bonus directory never presents a demonstration offer as current or actionable", async () => {
  const { BonusOfferDirectory } = await import("../components/bonus-directory/BonusOfferDirectory");
  const bare = renderToStaticMarkup(<BonusOfferDirectory messages={messages} offers={[offer(false)]} presentation={presentation} />);
  assert.ok(bare.includes(messages.common.reviewOnly));
  assert.doesNotMatch(bare, /href="\/r\//);
  assert.doesNotMatch(bare, />Current</);
  assert.doesNotMatch(bare, /data-analytics-casino-id=/);
  // A demonstration record with no review page links to none rather than to a
  // published review it does not have.
  assert.ok(!bare.includes(copy.casinoReview));

  const linked = offer(false);
  linked.casino = { ...linked.casino, reviewHref: "/casino/demo-plume?visualFixture=true" };
  const withReview = renderToStaticMarkup(<BonusOfferDirectory messages={messages} offers={[linked]} presentation={presentation} />);
  assert.ok(withReview.includes(messages.common.viewDemonstration));
  assert.ok(!withReview.includes(copy.casinoReview), "a demonstration must not read as a published review");
  assert.doesNotMatch(withReview, /href="\/r\//);
});

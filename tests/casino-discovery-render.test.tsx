import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const defaultMessages = productPageMessages("en-GB");
const defaultCopy = commercialUxMessages("en-GB");
const defaultPresentation = resolvePresentationContext({});

function card(patch: Partial<PublicCasinoCardDto> = {}): PublicCasinoCardDto {
  return {
    id: "casino-full",
    dataClassification: "PUBLISHED_RECORD",
    slug: "full-casino",
    name: "Full Casino",
    logo: { url: "https://media.example/full.png", alt: "Full Casino logo", width: 320, height: 160 },
    shortDescription: "A published editorial summary.",
    rating: 8.4,
    reviewCount: null,
    licenses: [{ key: "ukgc", label: "UKGC" }],
    countries: [{ key: "GB", label: "United Kingdom" }],
    paymentMethods: [{ key: "visa", label: "Visa" }],
    gameProviders: [{ key: "evolution", label: "Evolution" }],
    categories: [{ key: "slots", label: "Slots" }],
    highlights: ["Published terms"],
    featuredBonus: { title: "Welcome terms", summary: "Published summary", type: "WELCOME", keyTerms: ["x30 wagering"], wageringRequirement: 30, minimumDeposit: 10, currency: "GBP", validUntil: "2031-01-01T00:00:00.000Z", termsApply: true },
    action: { href: "/r/full-casino-visit" },
    responsibleGamblingLabel: "Control tools published",
    publishedAt: "2030-05-01T00:00:00.000Z",
    editorialUpdatedAt: "2030-05-15T00:00:00.000Z",
    ...patch,
  };
}

// The stylesheet stub above only applies to requires made after it, so the live collection is
// imported lazily rather than hoisted to the top of the module.
async function render(casinos: PublicCasinoCardDto[], locale: "en-GB" | "de-DE" = "en-GB") {
  const { CasinoCollection } = await import("../components/casino-discovery/CasinoCollection");
  const presentation = locale === "de-DE"
    ? resolvePresentationContext({ routeLanguage: "de", trustedCountryCode: "DE" })
    : defaultPresentation;
  return renderToStaticMarkup(<CasinoCollection
    casinos={casinos}
    initialSearch=""
    messages={productPageMessages(locale)}
    presentation={presentation}
  />);
}

test("full canonical card renders published evidence and only the governed internal visit route", async () => {
  const html = await render([card()]);
  assert.match(html, /href="\/casino\/full-casino"/);
  assert.match(html, /aria-label="Editor Score 8\.4 \/ 10"/);
  assert.match(html, /<img alt=""/);
  assert.match(html, /href="\/r\/full-casino-visit\?placement=CTA_CASINO_COLLECTION_CARD"/);
  assert.match(html, /rel="nofollow sponsored noopener"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /data-commercial-action-source="CTA"/);
  assert.doesNotMatch(html, /aria-haspopup="dialog"|\/outbound\/full-casino-visit|You are leaving B4GAMBLE|<dialog/);
  assert.doesNotMatch(html, /destinationUrl|trackingUrl|operator\.example/);
  assert.doesNotMatch(html, /featured published review|recommended|best placement|available where you are|eligible in your location/i);
});

test("casino card formats its visible and accessible score for the presentation locale", async () => {
  const html = await render([card()], "de-DE");
  assert.match(html, /aria-label="Editor Score 8,4 \/ 10"/);
  assert.match(html, /<strong>8,4<\/strong><small>\/10<\/small>/);
});

test("sparse review-only card omits unexplained fact rows and invented values", async () => {
  const sparse = card({
    id: "casino-sparse", slug: "sparse-casino", name: "Sparse Casino", logo: null, shortDescription: null, rating: null,
    licenses: [], countries: [], paymentMethods: [], gameProviders: [], categories: [], highlights: [], featuredBonus: null,
    action: null,
    publishedAt: null, editorialUpdatedAt: null,
  });
  const html = await render([sparse]);
  assert.match(html, /href="\/casino\/sparse-casino"/);
  // No governed action means the review becomes the card's live action: no dead
  // "Review only" box and no invented CTA.
  assert.match(html, /<a[^>]*data-review-primary=""[^>]*href="\/casino\/sparse-casino"/);
  assert.ok(!html.includes(defaultMessages.common.reviewOnly));
  assert.doesNotMatch(html, /href="\/r\//);
  assert.doesNotMatch(html, /<img|Editorial score|Reviewed/);
  assert.doesNotMatch(html, /No licence|Unlicensed|Unsupported|destinationUrl|trackingUrl/i);
  // Unknown facts stay labelled as unverified instead of being filled in.
  assert.ok(html.includes(defaultCopy.notVerified));
  assert.doesNotMatch(html, /aria-label="Editor Score/);
});

test("demo cards disclose fictional status and never render a commercial action", async () => {
  const html = await render([card({
    dataClassification: "DEMO_FIXTURE",
    reviewHref: "/casino/demo-plume?visualFixture=true",
    action: null,
  })]);
  assert.ok(html.includes(defaultMessages.common.viewDemonstration));
  assert.doesNotMatch(html, /href="\/r\//);
  assert.ok(!html.includes(defaultMessages.common.readReview));
  // Demonstration rows stay out of the published analytics stream.
  assert.doesNotMatch(html, /data-analytics-casino-id|data-analytics-placement/);
});

test("explicit fixture review targets suppress dead links and preserve the one matching profile", async () => {
  const layoutOnly = await render([card({
    dataClassification: "DEMO_FIXTURE",
    reviewHref: null,
    action: null,
  })]);
  assert.match(layoutOnly, /<h2>Full Casino<\/h2>/);
  assert.doesNotMatch(layoutOnly, /href="\/casino\/full-casino"|View demonstration/);

  const matching = await render([card({
    dataClassification: "DEMO_FIXTURE",
    name: "Solvane Casino",
    reviewHref: "/casino/demo-plume?visualFixture=true",
    slug: "solvane-casino",
    action: null,
  })]);
  assert.match(matching, /href="\/casino\/demo-plume\?visualFixture=true"/);
  assert.match(matching, /View demonstration/);
  assert.doesNotMatch(matching, /href="\/casino\/solvane-casino"/);
});

test("the directory announces its own result count and keeps view selection in one tablist", async () => {
  const html = await render([card(), card({ id: "second", slug: "second-casino", name: "Second Casino" })]);
  assert.match(html, /role="status"/);
  assert.match(html, new RegExp(`2 ${defaultCopy.casinosShown}`));
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
  assert.match(html, /role="tabpanel"/);
});

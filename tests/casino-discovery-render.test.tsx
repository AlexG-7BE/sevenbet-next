import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CasinoDiscoveryCardMarkup, DirectoryFeaturedTheatreMarkup, type CasinoCardClassNames } from "../components/casino-discovery/CasinoDiscoveryCard";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

const classNames = Object.fromEntries([
  "casinoCard", "cardHeader", "position", "logo", "identity", "score", "description", "signals", "signal", "offerBlock", "commission", "unavailable", "cardActions", "featurePlaceholder", "featureTheatre", "featureMedia", "featureOverlay", "featureCopy", "featureMetrics", "featureCard", "featureEyebrow",
].map((name) => [name, name])) as CasinoCardClassNames;

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
    visitAction: { available: true, redirectSlug: "full-casino-visit", label: "Visit casino", reasonCode: null },
    responsibleGamblingLabel: "Control tools published",
    publishedAt: "2030-05-01T00:00:00.000Z",
    editorialUpdatedAt: "2030-05-15T00:00:00.000Z",
    ...patch,
  };
}

test("full canonical card renders published evidence and only the governed internal visit route", () => {
  const html = renderToStaticMarkup(<CasinoDiscoveryCardMarkup casino={card()} classNames={classNames} position={7} />);
  assert.match(html, /href="\/casino\/full-casino"/);
  assert.match(html, /aria-label="Editorial score 8\.4 out of 10"/);
  assert.match(html, /aria-label="Directory result position 7"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /href="\/outbound\/full-casino-visit"/);
  assert.match(html, /href="\/r\/full-casino-visit"/);
  assert.match(html, /rel="nofollow sponsored noopener"/);
  assert.match(html, /Review access is editorial\. A visit action is conditional and may compensate SevenBet\./);
  assert.doesNotMatch(html, /destinationUrl|trackingUrl|operator\.example/);
  assert.doesNotMatch(html, /featured published review|recommended|best placement|available where you are|eligible in your location/i);
});

test("sparse review-only card omits unexplained fact rows and invented values", () => {
  const sparse = card({
    id: "casino-sparse", slug: "sparse-casino", name: "Sparse Casino", logo: null, shortDescription: null, rating: null,
    licenses: [], countries: [], paymentMethods: [], gameProviders: [], categories: [], highlights: [], featuredBonus: null,
    visitAction: { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_TRACKING_LINK" },
    publishedAt: null, editorialUpdatedAt: null,
  });
  const html = renderToStaticMarkup(<CasinoDiscoveryCardMarkup casino={sparse} classNames={classNames} position={2} />);
  assert.match(html, /href="\/casino\/sparse-casino"/);
  assert.match(html, /A governed visit link is not currently available\. The published review remains available\./);
  assert.match(html, /No active public bonus/);
  assert.match(html, /The review remains available without a commercial bonus\./);
  assert.doesNotMatch(html, /href="\/r\//);
  assert.doesNotMatch(html, /<img|Editorial score|Reviewed/);
  assert.doesNotMatch(html, /No licence|Unlicensed|Unsupported|destinationUrl|trackingUrl/i);
});

test("first-result theatre stays neutral for default, search, sort and later-page contexts", () => {
  for (const context of ["default", "search", "NAME_ASC", "page-2"]) {
    const html = renderToStaticMarkup(<DirectoryFeaturedTheatreMarkup casino={card({ name: `Preview ${context}` })} classNames={classNames} />);
    assert.match(html, /Published casino review/);
    assert.match(html, /casino-directory(?:%2F|\/)editorial-media\.jpg/);
    assert.match(html, /alt="" aria-hidden="true"/);
    assert.doesNotMatch(html, /Featured published review|recommended review|best review|top review/i);
  }
  const empty = renderToStaticMarkup(<DirectoryFeaturedTheatreMarkup casino={undefined} classNames={classNames} />);
  assert.match(empty, /Reviews appear only after editorial publication/);
  assert.doesNotMatch(empty, /Featured published review|recommended review|best review|top review/i);
});

test("demo cards disclose fictional status and never render a commercial action", () => {
  const html = renderToStaticMarkup(<CasinoDiscoveryCardMarkup casino={card({
    dataClassification: "DEMO_FIXTURE",
    visitAction: { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "DEMO_FIXTURE" },
  })} classNames={classNames} position={1} />);
  assert.match(html, /DEMONSTRATION DATA · FICTIONAL OPERATOR/);
  assert.match(html, /not a current operator, licence claim, partner offer or live promotion/i);
  assert.match(html, /Not claimable/);
  assert.doesNotMatch(html, /href="\/r\//);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  casinoEvidenceDepth,
  casinoOfferTermCompleteness,
  casinoPayoutBucket,
  rankCasinosByEditorialAuthority,
} from "../lib/public-casino-discovery/casino-ranking";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

function card(overrides: Partial<PublicCasinoCardDto> & { id: string; name: string }): PublicCasinoCardDto {
  return {
    dataClassification: "PUBLISHED_RECORD",
    slug: overrides.id,
    logo: null,
    shortDescription: null,
    rating: null,
    reviewCount: null,
    licenses: [],
    countries: [],
    paymentMethods: [],
    gameProviders: [],
    categories: [],
    highlights: [],
    featuredBonus: null,
    action: null,
    responsibleGamblingLabel: null,
    publishedAt: null,
    editorialUpdatedAt: null,
    ...overrides,
  };
}

function bonus(overrides: Partial<NonNullable<PublicCasinoCardDto["featuredBonus"]>> = {}) {
  return {
    title: "Welcome offer",
    summary: "",
    type: "WELCOME",
    keyTerms: [] as string[],
    wageringRequirement: null,
    minimumDeposit: null,
    currency: null,
    validUntil: null,
    termsApply: true as const,
    ...overrides,
  };
}

const label = [{ key: "k", label: "L" }];

test("Editor Score remains the primary ranking authority", () => {
  const ranked = rankCasinosByEditorialAuthority([
    card({ id: "b", name: "Lower", rating: 7.4, licenses: label, paymentMethods: label, gameProviders: label, categories: label }),
    card({ id: "a", name: "Higher", rating: 8.8 }),
  ]);
  assert.deepEqual(ranked.map((entry) => entry.id), ["a", "b"]);
});

test("at equal score the record a reader can check ranks first", () => {
  // Previously both sorted alphabetically, so "Alpha" won on its name alone
  // despite publishing no checkable terms.
  const ranked = rankCasinosByEditorialAuthority([
    card({ id: "alpha", name: "Alpha", rating: 8 }),
    card({
      id: "zeta",
      name: "Zeta",
      rating: 8,
      featuredBonus: bonus({ wageringRequirement: 35, minimumDeposit: 10, keyTerms: ["Max bet 5"] }),
    }),
  ]);
  assert.deepEqual(ranked.map((entry) => entry.id), ["zeta", "alpha"]);
});

test("verified payout timing outranks an unknown one at equal score and terms", () => {
  const ranked = rankCasinosByEditorialAuthority([
    card({ id: "slow", name: "Slow", rating: 8, withdrawalTimes: ["3-5 days"] }),
    card({ id: "fast", name: "Fast", rating: 8, withdrawalTimes: ["1-2 hours"] }),
    card({ id: "unknown", name: "Unknown", rating: 8 }),
  ]);
  assert.deepEqual(ranked.map((entry) => entry.id), ["fast", "slow", "unknown"]);
});

test("evidence depth separates casinos that are otherwise identical", () => {
  const ranked = rankCasinosByEditorialAuthority([
    card({ id: "thin", name: "Thin", rating: 8, licenses: label }),
    card({ id: "full", name: "Full", rating: 8, licenses: label, paymentMethods: label, gameProviders: label, categories: label }),
  ]);
  assert.deepEqual(ranked.map((entry) => entry.id), ["full", "thin"]);
});

test("a casino without an Editor Score never outranks a scored one", () => {
  const ranked = rankCasinosByEditorialAuthority([
    card({ id: "unscored", name: "Aaa", rating: null, licenses: label, paymentMethods: label, gameProviders: label, categories: label }),
    card({ id: "scored", name: "Zzz", rating: 7 }),
  ]);
  assert.deepEqual(ranked.map((entry) => entry.id), ["scored", "unscored"]);
});

test("ordering is stable and independent of input order", () => {
  const casinos = [
    card({ id: "c", name: "Cee", rating: 8 }),
    card({ id: "a", name: "Aay", rating: 8 }),
    card({ id: "b", name: "Bee", rating: 8 }),
  ];
  const forward = rankCasinosByEditorialAuthority(casinos).map((entry) => entry.id);
  const reversed = rankCasinosByEditorialAuthority([...casinos].reverse()).map((entry) => entry.id);
  assert.deepEqual(forward, ["a", "b", "c"]);
  assert.deepEqual(reversed, forward);
});

test("ranking never reads commercial route state", () => {
  const withRoute = card({
    id: "routed",
    name: "Routed",
    rating: 8,
    action: { href: "https://example.test/go", kind: "OUTBOUND" } as unknown as PublicCasinoCardDto["action"],
  });
  const withoutRoute = card({ id: "review", name: "Aaa Review", rating: 8 });
  assert.deepEqual(
    rankCasinosByEditorialAuthority([withRoute, withoutRoute]).map((entry) => entry.id),
    ["review", "routed"],
    "a partner route must not lift a casino above an equal editorial record",
  );
});

test("signal helpers report the published record truthfully", () => {
  assert.equal(casinoPayoutBucket({ withdrawalTimes: ["instant"] }), "instant");
  assert.equal(casinoPayoutBucket({ withdrawalTimes: [] }), "unknown");
  assert.equal(casinoOfferTermCompleteness({ featuredBonus: null }), 0);
  assert.equal(casinoOfferTermCompleteness({ featuredBonus: bonus({ wageringRequirement: 35, minimumDeposit: 10, keyTerms: ["x"] }) }), 3);
  assert.equal(casinoEvidenceDepth({ licenses: label, paymentMethods: [], gameProviders: [], categories: [] }), 1);
});

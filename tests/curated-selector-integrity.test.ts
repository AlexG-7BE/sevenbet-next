import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveActiveCuratedCasinoSelector,
  selectAvailableCuratedCasinoResults,
  selectCuratedCasinos,
} from "../lib/public-casino-discovery/curated-selector";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { rankBestBonusCasinoIds } from "../lib/public-offer/best-offer-ranking";
import {
  curatedBonusSelectors,
  resolveActiveCuratedBonusSelector,
  selectAvailableCuratedBonusResults,
  selectCuratedBonuses,
} from "../lib/public-offer/curated-selector";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";

function casino(slug: string, patch: Partial<PublicCasinoCardDto> = {}): PublicCasinoCardDto {
  return {
    id: slug,
    dataClassification: "PUBLISHED_RECORD",
    slug,
    name: slug,
    logo: null,
    shortDescription: "Published evidence",
    rating: 8,
    reviewCount: null,
    licenses: [],
    countries: [],
    paymentMethods: [],
    gameProviders: [],
    categories: [],
    highlights: [],
    supportsCrypto: false,
    supportsMobile: false,
    featuredBonus: null,
    action: null,
    responsibleGamblingLabel: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    editorialUpdatedAt: null,
    ...patch,
  };
}

function offer(slug: string, patch: { crypto?: boolean; deposit?: number | null; publishedAt?: string | null; score?: number; wagering?: number | null } = {}): PublicOfferDTO {
  return {
    casino: {
      id: slug,
      slug,
      name: slug,
      summary: "Published evidence",
      logo: null,
      hero: null,
      editorScore: patch.score ?? 8,
      featured: false,
      recommended: false,
      publishedAt: patch.publishedAt === undefined ? "2026-01-01T00:00:00.000Z" : patch.publishedAt,
      lastReviewedAt: null,
      countries: [{ countryCode: "GB", availability: "AVAILABLE" }],
      licenses: [],
      payments: [{ key: "payment", name: patch.crypto ? "Verified crypto rail" : "Bitcoin-branded card", minimumDeposit: null, supportsWithdrawals: true, withdrawalTime: "one day", minimumWithdrawal: null, maximumWithdrawal: null, fees: null, crypto: patch.crypto ?? false }],
      responsibleGamblingTools: [],
    },
    bonus: {
      id: `${slug}-bonus`,
      slug: `${slug}-bonus`,
      title: "Published offer",
      summary: "Published terms",
      type: "WELCOME",
      percentage: null,
      maximumBonus: 100,
      currency: "GBP",
      freeSpins: null,
      minimumDeposit: patch.deposit === undefined ? 10 : patch.deposit,
      wageringMultiplier: patch.wagering === undefined ? 30 : patch.wagering,
      wageringText: null,
      eligibility: "New customers only",
      importantConditions: ["Terms apply"],
      startsAt: null,
      expiresAt: null,
    },
    action: { href: `/r/${slug}` },
    dataClassification: "PUBLISHED_RECORD",
  };
}

test("casino Crypto and Mobile selectors use authoritative booleans and never label inference", () => {
  const misleading = casino("misleading", {
    paymentMethods: [{ key: "bitcoin-card", label: "Bitcoin rewards card" }],
    categories: [{ key: "mobile", label: "Mobile favourite" }],
    highlights: ["Crypto-style speed", "Great mobile layout"],
  });
  const crypto = casino("crypto", { supportsCrypto: true });
  const mobile = casino("mobile", { supportsMobile: true });

  assert.deepEqual(selectCuratedCasinos([misleading, crypto, mobile], "Crypto").map((item) => item.slug), ["crypto"]);
  assert.deepEqual(selectCuratedCasinos([misleading, crypto, mobile], "Mobile").map((item) => item.slug), ["mobile"]);
  assert.deepEqual(selectCuratedCasinos([misleading], "Crypto"), []);
  assert.deepEqual(selectCuratedCasinos([misleading], "Mobile"), []);
});

test("casino Best Bonuses follows canonical offer ranking IDs and never infers rank from the card summary", () => {
  const alpha = casino("alpha", { featuredBonus: { title: "Large headline", summary: "Terms", type: "WELCOME", keyTerms: [], wageringRequirement: 50, minimumDeposit: 100, currency: "GBP", validUntil: null, termsApply: true } });
  const beta = casino("beta", { featuredBonus: null });
  assert.deepEqual(selectCuratedCasinos([alpha, beta], "Best Bonuses"), []);
  assert.deepEqual(
    selectCuratedCasinos([alpha, beta], "Best Bonuses", { bestBonusCasinoIds: ["beta", "alpha"] }).map((item) => item.id),
    ["beta", "alpha"],
  );
});

test("canonical Best Bonuses ranking deduplicates casinos and continues to three unique published records", () => {
  const alphaBest = offer("alpha", { deposit: 5 });
  const alphaSecond = { ...alphaBest, bonus: { ...alphaBest.bonus, id: "alpha-second", slug: "alpha-second", minimumDeposit: 25 } };
  const beta = offer("beta", { deposit: 10 });
  const gamma = offer("gamma", { deposit: 15 });
  assert.deepEqual(rankBestBonusCasinoIds([alphaSecond, gamma, alphaBest, beta]), ["alpha", "beta", "gamma"]);
  assert.deepEqual(rankBestBonusCasinoIds([alphaBest, beta, gamma], { candidateCasinoIds: ["beta", "gamma"] }), ["beta", "gamma"]);
});

test("casino selectors rank supplied editorial records without taking commercial authority", () => {
  const informational = casino("informational", { supportsMobile: true, publishedAt: "2026-03-01T00:00:00.000Z" });
  const actionable = casino("actionable", { action: { href: "/r/actionable" }, publishedAt: "2026-02-01T00:00:00.000Z" });
  const crypto = casino("crypto", { supportsCrypto: true, publishedAt: "2026-04-01T00:00:00.000Z" });
  const records = [actionable, crypto, informational];

  assert.deepEqual(selectCuratedCasinos(records, "Best Overall").map((item) => item.id), ["actionable", "crypto", "informational"]);
  assert.deepEqual(selectCuratedCasinos(records, "Crypto").map((item) => item.id), ["crypto"]);
  assert.deepEqual(selectCuratedCasinos(records, "Mobile").map((item) => item.id), ["informational"]);
  assert.deepEqual(selectCuratedCasinos(records, "New Casinos").map((item) => item.id), ["crypto", "informational", "actionable"]);
  assert.deepEqual(
    selectAvailableCuratedCasinoResults(records).map((result) => result.selector),
    ["Best Overall", "Crypto", "Mobile", "New Casinos"],
  );
  assert.equal(resolveActiveCuratedCasinoSelector("Crypto", ["Best Overall", "Mobile"]), "Best Overall");
  assert.equal(resolveActiveCuratedCasinoSelector("Crypto", ["Mobile"]), "Mobile");
});

test("casino Best Overall and New Casinos remain capped at three informational editorial records", () => {
  const records = [
    casino("one", { publishedAt: "2026-01-01T00:00:00.000Z" }),
    casino("two", { publishedAt: "2026-02-01T00:00:00.000Z" }),
    casino("three", { publishedAt: "2026-03-01T00:00:00.000Z" }),
    casino("four", { publishedAt: "2026-04-01T00:00:00.000Z" }),
  ];
  assert.deepEqual(selectCuratedCasinos(records, "Best Overall").map((item) => item.id), ["one", "two", "three"]);
  assert.deepEqual(selectCuratedCasinos(records, "New Casinos").map((item) => item.id), ["four", "three", "two"]);
});

test("bonus Crypto selector never falls back to a non-crypto record", () => {
  const nonCrypto = offer("non-crypto", { crypto: false });
  const crypto = offer("crypto", { crypto: true });
  assert.deepEqual(selectCuratedBonuses([nonCrypto, crypto], "Crypto").map((item) => item.casino.slug), ["crypto"]);
  assert.deepEqual(selectCuratedBonuses([nonCrypto], "Crypto"), []);
});

test("bonus selector availability removes known-empty categories and resolves stale selection", () => {
  const sparse = offer("sparse", { crypto: false, deposit: null, wagering: null });
  assert.deepEqual(
    selectAvailableCuratedBonusResults([sparse]).map((result) => result.selector),
    ["Best Overall", "Newest"],
  );
  assert.equal(resolveActiveCuratedBonusSelector("Crypto", ["Best Overall", "Newest"]), "Best Overall");
  assert.equal(resolveActiveCuratedBonusSelector("Crypto", ["Newest"]), "Newest");
  assert.equal(resolveActiveCuratedBonusSelector("Crypto", []), null);
});

test("bonus Best Overall uses the existing multi-signal ranking instead of lowest wagering alone", () => {
  const lowWagering = offer("low-wagering", { score: 6, wagering: 5 });
  const strongerEditorialRecord = offer("stronger-editorial", { score: 9.5, wagering: 35 });
  assert.equal(selectCuratedBonuses([lowWagering, strongerEditorialRecord], "Best Overall")[0]?.casino.slug, "stronger-editorial");
});

test("every curated Bonus selector caps six eligible records at three without changing its ordering", () => {
  const sixEligible = [
    offer("alpha", { crypto: true, deposit: 60, publishedAt: "2026-01-01T00:00:00.000Z", score: 6, wagering: 10 }),
    offer("bravo", { crypto: true, deposit: 50, publishedAt: "2026-02-01T00:00:00.000Z", score: 7, wagering: 20 }),
    offer("charlie", { crypto: true, deposit: 40, publishedAt: "2026-03-01T00:00:00.000Z", score: 8, wagering: 30 }),
    offer("delta", { crypto: true, deposit: 30, publishedAt: "2026-04-01T00:00:00.000Z", score: 8.5, wagering: 40 }),
    offer("echo", { crypto: true, deposit: 20, publishedAt: "2026-05-01T00:00:00.000Z", score: 9, wagering: 50 }),
    offer("foxtrot", { crypto: true, deposit: 10, publishedAt: "2026-06-01T00:00:00.000Z", score: 9.5, wagering: 60 }),
  ];

  for (const selector of curatedBonusSelectors) {
    assert.ok(selectCuratedBonuses(sixEligible, selector).length <= 3, selector);
  }

  assert.deepEqual(selectCuratedBonuses(sixEligible, "Best Overall").map((item) => item.casino.slug), ["foxtrot", "echo", "delta"]);
  assert.deepEqual(selectCuratedBonuses(sixEligible, "Low Wagering").map((item) => item.casino.slug), ["alpha", "bravo", "charlie"]);
  assert.deepEqual(selectCuratedBonuses(sixEligible, "Low Deposit").map((item) => item.casino.slug), ["foxtrot", "echo", "delta"]);
  assert.deepEqual(selectCuratedBonuses(sixEligible, "Crypto").map((item) => item.casino.slug), ["alpha", "bravo", "charlie"]);
  assert.deepEqual(selectCuratedBonuses(sixEligible, "Newest").map((item) => item.casino.slug), ["foxtrot", "echo", "delta"]);
});

test("curated Bonus selectors never add ineligible records to fill three slots", () => {
  const sparse = [
    offer("eligible-one", { crypto: true, deposit: 5, wagering: 10 }),
    offer("eligible-two", { crypto: true, deposit: 10, wagering: 20 }),
    offer("ineligible-one", { crypto: false, deposit: null, wagering: null }),
    offer("ineligible-two", { crypto: false, deposit: null, wagering: null }),
    offer("ineligible-three", { crypto: false, deposit: null, wagering: null }),
    offer("ineligible-four", { crypto: false, deposit: null, wagering: null }),
  ];

  for (const selector of ["Low Wagering", "Low Deposit", "Crypto"] as const) {
    assert.deepEqual(selectCuratedBonuses(sparse, selector).map((item) => item.casino.slug), ["eligible-one", "eligible-two"], selector);
  }
});

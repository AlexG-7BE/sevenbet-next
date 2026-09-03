import assert from "node:assert/strict";
import test from "node:test";

import { selectCuratedCasinos } from "../lib/public-casino-discovery/curated-selector";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { selectCuratedBonuses } from "../lib/public-offer/curated-selector";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";

function casino(slug: string, patch: Partial<PublicCasinoCardDto> = {}): PublicCasinoCardDto {
  return {
    id: slug,
    dataClassification: "PUBLISHED_RECORD",
    disposition: "INFORMATIONAL_ONLY",
    dispositionReason: "EXACT_MARKET_INFORMATION_ONLY",
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
    visitAction: { available: false, redirectSlug: null, label: "Review", reasonCode: null },
    responsibleGamblingLabel: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    editorialUpdatedAt: null,
    ...patch,
  };
}

function offer(slug: string, patch: { crypto?: boolean; score?: number; wagering?: number } = {}): PublicOfferDTO {
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
      publishedAt: "2026-01-01T00:00:00.000Z",
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
      minimumDeposit: 10,
      wageringMultiplier: patch.wagering ?? 30,
      wageringText: null,
      eligibility: "New customers only",
      importantConditions: ["Terms apply"],
      startsAt: null,
      expiresAt: null,
    },
    action: { href: null, available: false },
    commercialAvailability: "UNAVAILABLE",
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

test("casino Best Bonuses fails closed without complete offer-ranking authority", () => {
  assert.deepEqual(selectCuratedCasinos([casino("low-wagering", { featuredBonus: { title: "Offer", summary: "Terms", type: "WELCOME", keyTerms: [], wageringRequirement: 1, minimumDeposit: 1, currency: "GBP", validUntil: null, termsApply: true } })], "Best Bonuses"), []);
});

test("bonus Crypto selector never falls back to a non-crypto record", () => {
  const nonCrypto = offer("non-crypto", { crypto: false });
  const crypto = offer("crypto", { crypto: true });
  assert.deepEqual(selectCuratedBonuses([nonCrypto, crypto], "Crypto").map((item) => item.casino.slug), ["crypto"]);
  assert.deepEqual(selectCuratedBonuses([nonCrypto], "Crypto"), []);
});

test("bonus Best Overall uses the existing multi-signal ranking instead of lowest wagering alone", () => {
  const lowWagering = offer("low-wagering", { score: 6, wagering: 5 });
  const strongerEditorialRecord = offer("stronger-editorial", { score: 9.5, wagering: 35 });
  assert.equal(selectCuratedBonuses([lowWagering, strongerEditorialRecord], "Best Overall")[0]?.casino.slug, "stronger-editorial");
});

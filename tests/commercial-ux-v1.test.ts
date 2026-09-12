import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CASINO_COLLECTION_VIEWS,
  CORE_BONUS_DIRECTORY_VIEWS,
  availableBonusViews,
  casinoCardPresentation,
  casinosForCollectionView,
  filterCasinosByName,
  offerCardPresentation,
  offersForBonusView,
  structuredOfferHeadline,
} from "../lib/commercial/commercial-presentation";
import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import {
  BEST_OFFER_CATEGORIES,
  LOW_DEPOSIT_EDITOR_SCORE_FLOOR,
  normalizeWithdrawalTime,
  rankBestOffersForCategory,
} from "../lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";

const controlledHref = "/r/governed-offer";

function offer(index: number, patch: {
  score?: number;
  action?: boolean;
  payout?: string | null;
  deposit?: number | null;
  wagering?: number | null;
  maximumBet?: number | null;
  freeSpins?: number | null;
  type?: string;
  conditions?: string[];
} = {}): PublicOfferDTO {
  const action = patch.action ?? true;
  return {
    casino: {
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      slug: `casino-${index}`,
      name: `Casino ${index}`,
      summary: "Players comparing broad slots and live-casino catalogues · regulatory evidence and broad product depth.",
      logo: null,
      hero: null,
      editorScore: patch.score ?? 8.5,
      featured: index === 1,
      recommended: index < 4,
      publishedAt: "2026-09-01T00:00:00.000Z",
      lastReviewedAt: "2026-09-02T00:00:00.000Z",
      countries: [{ countryCode: "GB", availability: "AVAILABLE" }],
      licenses: [{ authority: "UKGC", jurisdiction: "GB", status: "ACTIVE" }],
      payments: [{
        key: "visa", name: "Visa", minimumDeposit: patch.deposit ?? 10, supportsWithdrawals: true,
        withdrawalTime: patch.payout === undefined ? "within 24 hours" : patch.payout,
        minimumWithdrawal: 20, maximumWithdrawal: null, fees: null, crypto: false,
      }],
      responsibleGamblingTools: [],
    },
    bonus: {
      id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      slug: `bonus-${index}`,
      title: `100% up to £${index * 100}`,
      summary: "Material offer mechanics are not established by the source evidence.",
      type: patch.type ?? "WELCOME",
      percentage: 100,
      maximumBonus: index * 100,
      currency: "GBP",
      freeSpins: patch.freeSpins === undefined ? 50 : patch.freeSpins,
      minimumDeposit: patch.deposit === undefined ? 10 : patch.deposit,
      maximumBet: patch.maximumBet === undefined ? 5 : patch.maximumBet,
      wageringMultiplier: patch.wagering === undefined ? 20 : patch.wagering,
      wageringText: "source prose is deliberately ignored",
      eligibility: "18+ new customers with a long source-owned eligibility sentence",
      importantConditions: patch.conditions ?? ["Long source-controlled restriction"],
      termsUrl: null,
      startsAt: null,
      expiresAt: "2026-12-01T00:00:00.000Z",
    },
    action: action ? { available: true, href: controlledHref } : { available: false, href: null },
    commercialAvailability: action ? "AVAILABLE" : "UNAVAILABLE",
    dataClassification: "PUBLISHED_RECORD",
  };
}

function casino(index: number, patch: { score?: number; payout?: string; deposit?: number | null; action?: boolean } = {}): PublicCasinoCardDto {
  const action = patch.action ?? true;
  return {
    id: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    dataClassification: "PUBLISHED_RECORD",
    disposition: action ? "PROMOTABLE" : "INFORMATIONAL_ONLY",
    dispositionReason: action ? "EXACT_MARKET_AND_ROUTE_ELIGIBLE" : "EXACT_MARKET_INFORMATION_ONLY",
    slug: `collection-${index}`,
    name: `Collection ${index}`,
    logo: null,
    hero: null,
    shortDescription: "Raw editorial verdict that must never render on the card.",
    rating: patch.score ?? 8,
    reviewCount: null,
    licenses: [], countries: [], paymentMethods: [], gameProviders: [], categories: [], highlights: [],
    withdrawalTimes: [patch.payout ?? "24 hours"],
    featuredBonus: { title: "100% up to £100", summary: "raw offer prose", type: "WELCOME", keyTerms: ["raw evidence"], wageringRequirement: 20, minimumDeposit: patch.deposit === undefined ? 10 : patch.deposit, currency: "GBP", validUntil: null, termsApply: true },
    visitAction: action ? { available: true, redirectSlug: "governed-offer", label: "Visit", reasonCode: null } : { available: false, redirectSlug: null, label: "Visit", reasonCode: "NO_GOVERNED_ROUTE" },
    responsibleGamblingLabel: null,
    publishedAt: "2026-09-01T00:00:00.000Z",
    editorialUpdatedAt: "2026-09-02T00:00:00.000Z",
  };
}

test("Commercial UX exposes exactly the Founder-approved view sets", () => {
  assert.deepEqual(BEST_OFFER_CATEGORIES, ["best_overall", "fast_payouts", "best_bonus_terms", "low_deposit"]);
  assert.deepEqual(CASINO_COLLECTION_VIEWS, ["top_rated", "fast_payouts", "low_deposit"]);
  assert.deepEqual(CORE_BONUS_DIRECTORY_VIEWS, ["all", "welcome", "low_wagering", "low_deposit", "free_spins"]);
});

test("Best Offers gates Review Only records and ranks each category deterministically", () => {
  const reviewOnly = offer(9, { score: 10, action: false, payout: "instant", deposit: 1 });
  const overall = offer(1, { score: 9.4, payout: "48 hours", deposit: 20 });
  const fastest = offer(2, { score: 8.8, payout: "instant", deposit: 20 });
  const lowDeposit = offer(3, { score: 8.2, payout: "24 hours", deposit: 5 });
  const weakCheap = offer(4, { score: LOW_DEPOSIT_EDITOR_SCORE_FLOOR - .1, deposit: 1 });
  const records = [reviewOnly, lowDeposit, fastest, weakCheap, overall];
  assert.equal(rankBestOffersForCategory(records, "best_overall")[0]?.casino.id, overall.casino.id);
  assert.equal(rankBestOffersForCategory(records, "fast_payouts")[0]?.casino.id, fastest.casino.id);
  assert.equal(rankBestOffersForCategory(records, "low_deposit")[0]?.casino.id, lowDeposit.casino.id);
  assert.equal(rankBestOffersForCategory(records, "best_bonus_terms").length, 3);
  assert.equal(rankBestOffersForCategory([overall], "best_overall").length, 1);
  assert.equal(rankBestOffersForCategory([overall, fastest], "best_overall").length, 2);
  assert.equal(rankBestOffersForCategory([], "best_overall").length, 0);
  for (const category of BEST_OFFER_CATEGORIES) assert.equal(rankBestOffersForCategory(records, category).some((item) => item === reviewOnly), false);
});

test("Best Bonus Terms and Fast Payouts require category evidence", () => {
  const incomplete = offer(1, { wagering: 5, maximumBet: null, deposit: null, conditions: [] });
  incomplete.bonus.eligibility = null;
  incomplete.bonus.expiresAt = null;
  const unknownPayout = offer(2, { payout: "Pending review and bank/card processing" });
  assert.deepEqual(rankBestOffersForCategory([incomplete], "best_bonus_terms"), []);
  assert.deepEqual(rankBestOffersForCategory([unknownPayout], "fast_payouts"), []);
});

test("Casino views reorder the same collection and name search is the only narrowing control", () => {
  const records = [casino(1, { score: 9.1, payout: "48 hours", deposit: 20 }), casino(2, { score: 8.7, payout: "instant", deposit: 30 }), casino(3, { score: 8.2, payout: "24 hours", deposit: 5 })];
  const ids = records.map((item) => item.id).sort();
  for (const view of CASINO_COLLECTION_VIEWS) assert.deepEqual(casinosForCollectionView(records, view).map((item) => item.id).sort(), ids);
  assert.equal(casinosForCollectionView(records, "top_rated")[0]?.id, records[0]?.id);
  assert.equal(casinosForCollectionView(records, "fast_payouts")[0]?.id, records[1]?.id);
  assert.equal(casinosForCollectionView(records, "low_deposit")[0]?.id, records[2]?.id);
  assert.deepEqual(filterCasinosByName(records, "collection 2", "en-GB").map((item) => item.id), [records[1]?.id]);
});

test("Bonus views use verified mechanics and optional intent requires real depth", () => {
  const welcome = offer(1);
  const unknownWagering = offer(2, { wagering: null });
  const noSpins = offer(3, { freeSpins: 0 });
  assert.equal(offersForBonusView([welcome, unknownWagering, noSpins], "all").length, 3);
  assert.equal(offersForBonusView([welcome, unknownWagering, noSpins], "welcome").length, 3);
  assert.equal(offersForBonusView([welcome, unknownWagering, noSpins], "low_wagering").some((item) => item === unknownWagering), false);
  assert.equal(offersForBonusView([welcome, unknownWagering, noSpins], "free_spins").some((item) => item === noSpins), false);
  assert.deepEqual(availableBonusViews([welcome, unknownWagering]), [...CORE_BONUS_DIRECTORY_VIEWS]);
  const cashback = [offer(4, { type: "CASHBACK" }), offer(5, { type: "CASHBACK" }), offer(6, { type: "CASHBACK" })];
  assert.deepEqual(availableBonusViews(cashback), [...CORE_BONUS_DIRECTORY_VIEWS, "cashback"]);
});

test("presentation adapters never expose raw evidence prose and preserve governed CTA state", () => {
  const messages = productPageMessages("en-GB");
  const copy = commercialUxMessages("en-GB");
  const actionable = offerCardPresentation(offer(1), "en-GB", messages, copy, "bonus_directory");
  const reviewOnly = offerCardPresentation(offer(2, { action: false, wagering: null }), "en-GB", messages, copy, "bonus_directory");
  assert.equal(actionable.action?.href, controlledHref);
  assert.equal(actionable.action?.label, "VIEW OFFER");
  assert.equal(reviewOnly.action, null);
  assert.equal(reviewOnly.facts[0]?.value, "Not verified");
  assert.doesNotMatch(JSON.stringify(actionable), /Players comparing|regulatory evidence and broad product depth|Material offer mechanics are not established/i);
  const casinoCard = casinoCardPresentation(casino(1, { action: false }), "en-GB", messages, copy);
  assert.equal(casinoCard.action, null);
  assert.doesNotMatch(JSON.stringify(casinoCard), /Raw editorial verdict|raw offer prose|raw evidence/i);
  const missingCurrency = offer(3);
  missingCurrency.bonus.currency = null;
  assert.doesNotMatch(structuredOfferHeadline(missingCurrency.bonus, "en-GB", copy), /up to Not verified/i);

  const demonstration = offer(4);
  demonstration.dataClassification = "DEMO_FIXTURE";
  assert.equal(offerCardPresentation(demonstration, "en-GB", messages, copy, "bonus_directory").action, null);
  assert.deepEqual(rankBestOffersForCategory([demonstration], "best_overall"), []);
  assert.equal(rankBestOffersForCategory([demonstration], "best_overall", { includeDemonstration: true }).length, 1);
});

test("localized payout ranges normalize without exposing source phrasing", () => {
  assert.equal(normalizeWithdrawalTime("0–2 Stunden"), "under-2-hours");
  assert.equal(normalizeWithdrawalTime("0–24 horas"), "same-day");
  assert.equal(normalizeWithdrawalTime("24–48 heures"), "one-to-two-days");
  assert.equal(normalizeWithdrawalTime("3–5 giorni"), "three-or-more-days");
});

test("commercial routes remove the obsolete interaction systems from rendered page composition", () => {
  const best = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  const casinos = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  const bonuses = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  assert.doesNotMatch(best, /Worth a look|ContextualComparison|advanced filter/i);
  assert.doesNotMatch(casinos, /CuratedCasinoShortlist|DiscoveryControls|ActiveDiscoveryFilters|ContextualComparison/);
  assert.doesNotMatch(bonuses, /CuratedBonusShortlist|BonusFilters|ActiveBonusFilters|BonusPagination|BonusCalculator/);
  assert.doesNotMatch(bonuses, /What a bonus really costs|More Filters|Sort control/i);
});

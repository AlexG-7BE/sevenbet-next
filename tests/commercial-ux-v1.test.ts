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
  knownCommercialFacts,
  offerCardPresentation,
  offersForBonusView,
  selectCasinoMarketProfile,
  structuredOfferHeadline,
} from "../lib/commercial/commercial-presentation";
import { commercialUxMessages, countNoun } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import {
  commercialUxFixtureMarket,
  isCommercialUxVisualDataFixture,
  withCommercialUxFixturePresentation,
} from "../lib/final-handoff/visual-data-fixture";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import {
  commercialProductsAvailable,
  resolveCommercialProductState,
} from "../lib/market/commercial-product-state";
import {
  BEST_OFFER_CATEGORIES,
  LOW_DEPOSIT_EDITOR_SCORE_FLOOR,
  normalizeWithdrawalTime,
  payoutEvidenceStrength,
  rankBestOffersForCategory,
  severeBonusRestrictionCount,
} from "../lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoDTO, PublicOfferPresentationRelation } from "../lib/public-casino/public-casino.types";
import type { SupportedLocale } from "../lib/market/registry";

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
  relation?: PublicOfferPresentationRelation;
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
    action: action ? { href: controlledHref } : null,
    dataClassification: "PUBLISHED_RECORD",
    ...(patch.relation ? { offerPresentation: { relation: patch.relation, sourceCountryCode: null, presentationCountryCode: "IE", currentMarketVerified: patch.relation === "EXACT" } } : {}),
  };
}

function casino(index: number, patch: { score?: number; payout?: string; deposit?: number | null; action?: boolean } = {}): PublicCasinoCardDto {
  const action = patch.action ?? true;
  return {
    id: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    dataClassification: "PUBLISHED_RECORD",
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
    action: action ? { href: controlledHref } : null,
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

test("commercial product state summarizes canonical action availability", () => {
  assert.equal(resolveCommercialProductState({ canonicalActionAvailable: true }), "SUPPORTED_COMMERCIAL");
  assert.equal(resolveCommercialProductState({ canonicalActionAvailable: false }), "EDITORIAL_ONLY");
  assert.equal(commercialProductsAvailable("SUPPORTED_COMMERCIAL"), true);
  assert.equal(commercialProductsAvailable("EDITORIAL_ONLY"), false);
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
  assert.equal(rankBestOffersForCategory([incomplete], "best_bonus_terms").length, 1, "known wagering is usable without pretending unknown terms are favourable");
  assert.deepEqual(rankBestOffersForCategory([unknownPayout], "fast_payouts"), []);
});

test("Best Bonus Terms ranks favourability, penalises severe restrictions, and sends unknowns to tie-break loss", () => {
  const severeLowWagering = offer(1, { wagering: 5, conditions: ["Maximum cashout is capped at £100."] });
  const clearHigherWagering = offer(2, { wagering: 20, conditions: ["Standard bonus terms apply."] });
  const sparse = offer(3, { wagering: 20, maximumBet: null, deposit: null, conditions: [] });
  sparse.bonus.eligibility = null;
  sparse.bonus.expiresAt = null;
  assert.equal(severeBonusRestrictionCount(severeLowWagering), 1);
  assert.deepEqual(
    rankBestOffersForCategory([severeLowWagering, sparse, clearHigherWagering], "best_bonus_terms").map((item) => item.bonus.id),
    [clearHigherWagering.bonus.id, sparse.bonus.id, severeLowWagering.bonus.id],
  );
});

test("Fast Payouts prefers stronger timing evidence, then editor score, never method count", () => {
  const explicit = offer(1, { score: 8.1, payout: "0–24 hours" });
  const vagueMany = offer(2, { score: 9.5, payout: "same day" });
  vagueMany.casino.payments.push(
    { ...vagueMany.casino.payments[0]!, key: "mastercard", name: "Mastercard" },
    { ...vagueMany.casino.payments[0]!, key: "bank", name: "Bank" },
  );
  assert.equal(payoutEvidenceStrength(explicit), 3);
  assert.equal(payoutEvidenceStrength(vagueMany), 2);
  assert.equal(rankBestOffersForCategory([vagueMany, explicit], "fast_payouts")[0]?.bonus.id, explicit.bonus.id);
  const explicitHighScore = offer(3, { score: 9.2, payout: "0–24 hours" });
  assert.equal(rankBestOffersForCategory([explicit, explicitHighScore], "fast_payouts")[0]?.bonus.id, explicitHighScore.bonus.id);
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

test("Bonus views put what this visitor can take first and keep each view's own order within a tier", () => {
  const otherMarket = offer(1, { score: 9.5, action: false, relation: "OTHER_MARKET", wagering: 5 });
  const worldwide = offer(2, { score: 9.0, action: false, relation: "ROW" });
  const ownMarket = offer(3, { score: 8.0, action: false, relation: "EXACT" });
  const clickableLow = offer(4, { score: 7.0, relation: "OTHER_MARKET", wagering: 10 });
  const clickableHigh = offer(5, { score: 8.8, relation: "ROW", wagering: 30 });
  const records = [otherMarket, worldwide, ownMarket, clickableLow, clickableHigh];
  assert.deepEqual(offersForBonusView(records, "all"), [clickableHigh, clickableLow, ownMarket, worldwide, otherMarket]);
  // Low wagering still sorts by wagering, but inside each tier: the 5x offer from another market stays below both buttons.
  assert.deepEqual(offersForBonusView(records, "low_wagering"), [clickableLow, clickableHigh, ownMarket, worldwide, otherMarket]);
  // A demonstration record carries its seed's market, which means nothing for it.
  const demo = { ...offer(6, { score: 9.9, action: false, relation: "OTHER_MARKET" }), dataClassification: "DEMO_FIXTURE" as const };
  assert.deepEqual(offersForBonusView([worldwide, demo], "all"), [demo, worldwide]);
});

test("presentation adapters never expose raw evidence prose and preserve governed CTA state", () => {
  const messages = productPageMessages("en-GB");
  const copy = commercialUxMessages("en-GB");
  const actionable = offerCardPresentation(offer(1), "en-GB", messages, copy, "bonus_directory");
  const reviewOnly = offerCardPresentation(offer(2, { action: false, wagering: null }), "en-GB", messages, copy, "bonus_directory");
  assert.equal(actionable.action?.href, controlledHref);
  assert.equal(actionable.action?.label, "VIEW OFFER");
  assert.equal(reviewOnly.action, null);
  assert.equal(reviewOnly.facts.some((fact) => fact.value === "Not verified"), false, "known useful facts replace a redundant unknown");
  assert.doesNotMatch(JSON.stringify(actionable), /Players comparing|regulatory evidence and broad product depth|Material offer mechanics are not established/i);
  const casinoCard = casinoCardPresentation(casino(1, { action: false }), "en-GB", messages, copy);
  assert.equal(casinoCard.action, null);
  assert.deepEqual(casinoCard.facts.map((fact) => fact.label), ["Payout", "Minimum deposit", "Current offer"]);
  assert.doesNotMatch(JSON.stringify(casinoCard), /Raw editorial verdict|raw offer prose|raw evidence/i);
  const missingCurrency = offer(3);
  missingCurrency.bonus.currency = null;
  assert.doesNotMatch(structuredOfferHeadline(missingCurrency.bonus, "en-GB", copy), /up to Not verified/i);

  const safeTerms = offer(5);
  safeTerms.bonus.termsUrl = "https://casino.example/terms";
  assert.equal(offerCardPresentation(safeTerms, "en-GB", messages, copy, "bonus_directory").termsUrl, "https://casino.example/terms");
  safeTerms.bonus.termsUrl = "javascript:alert(1)";
  assert.equal(offerCardPresentation(safeTerms, "en-GB", messages, copy, "bonus_directory").termsUrl, null);

  const demonstration = offer(4);
  demonstration.dataClassification = "DEMO_FIXTURE";
  demonstration.action = null;
  assert.equal(offerCardPresentation(demonstration, "en-GB", messages, copy, "bonus_directory").action, null);
  assert.deepEqual(rankBestOffersForCategory([demonstration], "best_overall"), []);
  assert.equal(rankBestOffersForCategory([demonstration], "best_overall", { includeDemonstration: true }).length, 1);
});

const catalogueLocales = ["en-GB", "en-CA", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "fr-CA"] as const satisfies readonly SupportedLocale[];

test("catalogue cards render only known facts and never a Not verified row", () => {
  assert.deepEqual(knownCommercialFacts([{ label: "A", value: "1" }, { label: "B", value: null }, { label: "C", value: " " }, { label: "D", value: undefined }]), [{ label: "A", value: "1" }]);
  for (const locale of catalogueLocales) {
    const messages = productPageMessages(locale);
    const copy = commercialUxMessages(locale);
    // Nothing known: no facts at all, and no padding up to three.
    const bare = offer(1, { payout: "ask support", wagering: null, deposit: null, maximumBet: null });
    bare.bonus.expiresAt = null;
    assert.deepEqual(offerCardPresentation(bare, locale, messages, copy, "bonus_directory").facts, [], `${locale} bonus card pads nothing`);
    for (const category of BEST_OFFER_CATEGORIES) {
      const card = offerCardPresentation(bare, locale, messages, copy, category);
      assert.deepEqual(card.facts, [], `${locale} ${category} card shows no unknown rows`);
      assert.ok(card.reason && !card.reason.includes(copy.notVerified), `${locale} ${category} reason names only what is known`);
      assert.match(card.reason ?? "", new RegExp(`^${messages.common.editorScore}: `), `${locale} ${category} reason falls back to the editor score`);
    }
    const noOfferCasino = { ...casino(1, { payout: "ask support" }), featuredBonus: null };
    assert.deepEqual(casinoCardPresentation(noOfferCasino, locale, messages, copy).facts, [], `${locale} casino card without known facts`);

    // Partly known: the unknown row is dropped, the known rows keep their order.
    const partial = offer(2, { payout: "ask support", maximumBet: null });
    partial.bonus.expiresAt = null;
    assert.deepEqual(offerCardPresentation(partial, locale, messages, copy, "best_overall").facts.map((fact) => fact.label), [messages.common.wagering, messages.common.minimumDeposit]);
    assert.deepEqual(offerCardPresentation(partial, locale, messages, copy, "bonus_directory").facts.map((fact) => fact.label), [messages.common.wagering, messages.common.minimumDeposit]);
    assert.deepEqual(casinoCardPresentation(casino(2, { payout: "ask support" }), locale, messages, copy).facts.map((fact) => fact.label), [messages.common.minimumDeposit, copy.currentOffer]);
    assert.deepEqual(casinoCardPresentation(casino(3, { deposit: null }), locale, messages, copy).facts.map((fact) => fact.label), [messages.common.payout, copy.currentOffer]);
    for (const presented of [offerCardPresentation(partial, locale, messages, copy, "fast_payouts"), casinoCardPresentation(casino(2, { payout: "ask support" }), locale, messages, copy)]) {
      assert.doesNotMatch(JSON.stringify(presented), new RegExp(copy.notVerified), `${locale} renders no "${copy.notVerified}"`);
    }
  }
});

test("catalogue counts and headings use plain words in every locale", () => {
  assert.equal(`1 ${countNoun("en-GB", 1, "offer", "offers")}`, "1 offer");
  assert.equal(`8 ${countNoun("en-GB", 8, "offer", "offers")}`, "8 offers");
  const fi = commercialUxMessages("fi-FI");
  assert.equal(countNoun("fi-FI", 8, fi.offerOne, fi.offerOther), "tarjousta");
  assert.equal(countNoun("fi-FI", 1, fi.casinoOne, fi.casinoOther), "kasino");
  assert.equal(commercialUxMessages("de-DE").casinoOther, "Anbieter", "German copy names operators Anbieter");
  for (const locale of catalogueLocales) {
    const copy = commercialUxMessages(locale);
    const messages = productPageMessages(locale);
    for (const noun of [copy.offerOne, copy.offerOther, copy.casinoOne, copy.casinoOther]) assert.ok(noun.trim(), locale);
    assert.doesNotMatch(`${copy.offerOther} ${copy.casinoOther}`, /record|Einträg|registr|poster|εγγραφ|voci|vermelding|kohte|oppføring/i, locale);
    assert.match(messages.bestOffers.heroCopy, /\{market\}/, `${locale} hero names the market`);
    assert.doesNotMatch(messages.bestOffers.heroCopyWorldwide, /\{market\}/, `${locale} worldwide hero never prints "the global catalog"`);
    assert.doesNotMatch(`${messages.bestOffers.heroCopy} ${messages.bestOffers.heroCopyWorldwide}`, /records|Einträge|registros|poster|εγγραφές|voci|registos|vermeldingen|kohteet|oppføringer|filtered|gefiltert|filtr/i, locale);
    assert.ok(messages.bestOffers.methodTitle.trim() && messages.bestOffers.methodTitle !== messages.common.materialTerms, locale);
  }
  assert.equal(productPageMessages("en-GB").bestOffers.heroCopy, "Offers for {market}. Partner links appear only when they are available for this visit.");
  assert.equal(productPageMessages("en-GB").bestOffers.methodTitle, "How we pick");

  const best = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  const bonuses = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  const casinos = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(best, /presentation\.marketCountryCode \? messages\.bestOffers\.heroCopy : messages\.bestOffers\.heroCopyWorldwide/);
  assert.match(best, /<h2><EmphasisTail text=\{messages\.bestOffers\.methodTitle\} \/><\/h2>/);
  assert.doesNotMatch(best, /eligibleRecords|<h2>\{messages\.common\.materialTerms\} ·|"How we choose"/);
  assert.match(best, /href=\{productHref\(presentation, "\/methodology"\)\}>\{messages\.common\.reviewMethodology\}/, "the methodology link stays");
  assert.match(best, /countNoun\(presentation\.locale, result\.records\.length, copy\.offerOne, copy\.offerOther\)/);
  assert.match(bonuses, /\{result\.total\} \{countNoun\(presentation\.locale, result\.total, copy\.offerOne, copy\.offerOther\)\}/);
  assert.match(casinos, /\{result\.total\} \{countNoun\(presentation\.locale, result\.total, copy\.casinoOne, copy\.casinoOther\)\}/);
  for (const source of [bonuses, casinos]) assert.doesNotMatch(source, /messages\.common\.records/);
});

test("catalogue term labels read at 13px with contrast above 4.5:1", () => {
  const rules = [
    ["components/best-offers/BestOffers.module.css", /\.page dl\.rankFacts dt \{([^}]*)\}/],
    ["components/bonus-directory/BonusOfferDirectory.module.css", /\.card dl\.facts dt \{([^}]*)\}/],
    ["components/casino-discovery/CasinoCollection.module.css", /\.card dl\.facts dt \{([^}]*)\}/],
  ] as const;
  const luminance = (rgb: readonly number[]) => {
    const [r, g, b] = rgb.map((channel) => { const c = channel / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  for (const [file, pattern] of rules) {
    const declarations = readFileSync(file, "utf8").match(pattern)?.[1] ?? "";
    assert.match(declarations, /font-size: ?13px/, file);
    assert.match(declarations, /letter-spacing: ?\.06em/, file);
    const alpha = Number(declarations.match(/color: ?rgba\(250, ?250, ?247, ?(\.\d+)\)/)?.[1]);
    // The lightest card surface these labels sit on is the raised card, #1d1c1c.
    for (const surface of [[0x10, 0x0f, 0x0f], [0x17, 0x16, 0x16], [0x1d, 0x1c, 0x1c]]) {
      const text = [250, 250, 247].map((channel, index) => Math.round(channel * alpha + surface[index]! * (1 - alpha)));
      const ratio = (luminance(text) + 0.05) / (luminance(surface) + 0.05);
      assert.ok(ratio >= 4.5, `${file} label contrast ${ratio.toFixed(2)}:1`);
    }
  }
});

test("casino profiles select the exact current market deterministically", () => {
  const profiles = [
    { id: "lv", countryCode: "LV" },
    { id: "ee", countryCode: "EE" },
    { id: "dk", countryCode: "DK" },
  ] as PublicCasinoDTO["marketProfiles"];
  const record = { marketProfiles: profiles } as PublicCasinoDTO;
  assert.equal(selectCasinoMarketProfile(record, "ee")?.id, "ee");
  assert.equal(selectCasinoMarketProfile(record, "LV")?.id, "lv");
  assert.equal(selectCasinoMarketProfile(record, "KZ"), null);
  assert.equal(selectCasinoMarketProfile(record, null), null);
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
  const profileRoute = readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  assert.doesNotMatch(best, /Worth a look|ContextualComparison|advanced filter/i);
  assert.doesNotMatch(casinos, /CuratedCasinoShortlist|DiscoveryControls|ActiveDiscoveryFilters|ContextualComparison/);
  assert.doesNotMatch(bonuses, /CuratedBonusShortlist|BonusFilters|ActiveBonusFilters|BonusPagination|BonusCalculator/);
  assert.doesNotMatch(bonuses, /What a bonus really costs|More Filters|Sort control/i);
  assert.doesNotMatch(profile, /marketProfiles\[0\]/);
  for (const route of [best, casinos, bonuses, profileRoute]) {
    assert.ok((route.match(/withCommercialUxFixturePresentation/g) ?? []).length >= 3, "metadata and page body must share the Preview fixture presentation");
  }
});

test("commercial routes keep the approved task first and restore only bounded premium framing", () => {
  const best = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  const casinos = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  const bonuses = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");

  assert.ok(best.indexOf("<BestOffersExperience") < best.indexOf('data-premium-section="best-offers-method"'));
  assert.ok(best.indexOf('data-premium-section="best-offers-method"') < best.indexOf('data-premium-section="best-offers-faq"'));
  assert.equal((best.match(/<details[\s>]/g) ?? []).length, 3);
  assert.doesNotMatch(best, /finalOffer|Worth a look/);

  assert.ok(casinos.indexOf("<CasinoCollection") < casinos.indexOf('data-premium-section="casinos-before-you-choose"'));
  assert.equal((casinos.match(/<details[\s>]/g) ?? []).length, 3);

  assert.ok(bonuses.indexOf("<BonusOfferDirectory") < bonuses.indexOf('data-premium-section="bonus-terms-method"'));
  assert.equal((bonuses.match(/<li>/g) ?? []).length, 3);
  assert.match(bonuses, /href="\/bonus-guide"/);
  assert.doesNotMatch(bonuses, /BonusCalculator|What a bonus really costs/);

  assert.match(profile, /data-casino-section-nav/);
  assert.match(profile, /href="#overview"/);
  assert.match(profile, /href="#current-offer"/);
  assert.match(profile, /href="#our-verdict"/);
  assert.match(profile, /href="#casino-faq"/);
  assert.match(profile, /data-premium-section="casino-verdict"/);
  assert.equal((profile.match(/slice\(0, 3\)/g) ?? []).length, 1);
  assert.ok(profile.indexOf('href="#casino-faq"') < profile.indexOf('href="#our-verdict"'));
  assert.ok(profile.indexOf('id="casino-faq"') < profile.indexOf('id="our-verdict"'));
  assert.doesNotMatch(profile, /CompactProtection|styles\.protectionSection|styles\.relatedLinks|styles\.sourceAccess/);
  assert.doesNotMatch(profile, /<p>07<\/p>/);
  assert.doesNotMatch(profile, /payoutScore|bonusScore|gamesScore|supportScore|verificationScore/);
});

test("market summary frames only actionless commercial routes and cannot veto a canonical action", () => {
  const best = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  const bonuses = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  for (const source of [best, bonuses]) {
    assert.match(source, /data-commercial-market-state="editorial-only"/);
    assert.match(source, /result\.records\.some\(\(offer\) => offer\.action !== null\)/);
    assert.match(source, /!hasCanonicalAction && !commercialProductsAvailable\(loaded\.commercialProductState\)/);
  }
  assert.ok(best.indexOf('data-commercial-market-state="editorial-only"') < best.indexOf("<section className={styles.hero}"));
  assert.ok(bonuses.indexOf('data-commercial-market-state="editorial-only"') < bonuses.indexOf("<BonusOfferDirectory"));
  assert.doesNotMatch(readFileSync("lib/market/commercial-product-state.ts", "utf8"), /\b(?:result|total|count|KZ)\b/);
});

test("Commercial UX market fixtures are Preview-only, allowlisted, and presentation-only", () => {
  const previousVercel = process.env.VERCEL;
  const previousEnvironment = process.env.VERCEL_ENV;
  const previousLocalFlag = process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE;
  try {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    delete process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE;
    assert.equal(isCommercialUxVisualDataFixture("true"), false);
    assert.equal(commercialUxFixtureMarket("EE", false), null);

    process.env.VERCEL_ENV = "preview";
    assert.equal(isCommercialUxVisualDataFixture("true"), true);
    assert.equal(commercialUxFixtureMarket("EE", true), "EE");
    assert.equal(commercialUxFixtureMarket("KZ", true), null);
    const base = { ...resolvePresentationContext({ trustedCountryCode: "KZ" }), marketCode: "KZ" };
    const fixture = withCommercialUxFixturePresentation(base, "LV");
    assert.equal(fixture.marketCountryCode, "LV");
    assert.equal(fixture.marketCode, "LV");
    assert.equal(fixture.market, null, "an inspection context never creates a durable market profile");
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previousVercel;
    if (previousEnvironment === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previousEnvironment;
    if (previousLocalFlag === undefined) delete process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE; else process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE = previousLocalFlag;
  }
});

test("an unrouted country is named in the page language and no country reads as readers worldwide", () => {
  // Founder, 25 Sep 2026: a KZ visitor saw "Curated for KZ"; without GEO the copy said "the global catalog".
  assert.equal(resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "KZ" }).marketDisplayName, "Kazakhstan");
  assert.equal(resolvePresentationContext({ routeLanguage: "de", trustedCountryCode: "KZ" }).marketDisplayName, "Kasachstan");
  assert.equal(resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" }).marketDisplayName, "United Kingdom");
  assert.equal(resolvePresentationContext({ routeLanguage: "en" }).marketDisplayName, "readers worldwide");
  for (const language of ["en", "de", "es", "el", "sv", "da", "it", "pt", "nl", "fi", "nb", "fr"]) {
    const name = resolvePresentationContext({ routeLanguage: language }).marketDisplayName;
    assert.doesNotMatch(name, /catalog|katalog|catálogo|κατάλογο|luettelo|catalogue/i, language);
  }
  const casinos = productPageMessages("en-GB").casinos;
  const bonuses = productPageMessages("en-GB").bonuses;
  assert.doesNotMatch(`${casinos.description} ${bonuses.description}`, /the \{market\}/, "descriptions read naturally with any market name");
});

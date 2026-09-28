import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { profileFaqItems, profileFaqLocalization, selectProfileBonus } from "../lib/casino-profile/presentation";
import { casinoProfileSchemas, projectCasinoProfileSchemas } from "../lib/casino-profile/seo";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
import {
  CASINO_EDITORIAL_LANGUAGES,
  CASINO_EDITORIAL_NATIVE_TEXT,
  GERMAN_HIDDEN_CATEGORY_LABELS,
  casinoEditorialEntries,
  casinoEditorialLanguage,
  casinoEditorialSourceTexts,
  casinoEditorialTranslation,
  isCasinoEditorialTextInLanguage,
  normalizeCasinoEditorialSource,
  translateCasinoEditorialText,
  type CasinoEditorialLanguage,
} from "../lib/i18n/casino-editorial-translations";
import { localizeCasinoCard, localizePublicCasino, localizePublicOffer } from "../lib/i18n/casino-editorial-translations/localize";
import { PROFILE_FAQ_COPY } from "../lib/i18n/casino-editorial-translations/profile-faq-copy";
import { GERMAN_PROPER_NAME_ALLOWLIST, germanProhibitedTerms } from "../lib/i18n/german-terminology";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoDTO, PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import { BEST_OFFER_CATEGORIES, normalizeWithdrawalTime, rankBestOffersForCategory, severeBonusRestrictionCount } from "../lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoService } from "../lib/services/public-casino.service";
import { PublicOfferService } from "../lib/services/public-offer.service";
import { absoluteUrl } from "../lib/site";
import { allowJurisdictionAuthority } from "./market-authority.fixtures";
import { noCommercialActions } from "./commercial-action.fixtures";

// Published English source text as it stood in Production on 27 September 2026.
const SOURCE = {
  summary: "A mature, broad casino product with unusually strong local evidence in Peru and Sweden, balanced against a serious Swedish anti-money-laundering enforcement record and incomplete current offer mechanics.",
  review: "Betsson leads this release on product breadth, local payment coverage and evidence depth. The review does not treat licence status as a clean bill of health: Sweden's regulator warned Betsson Nordic Ltd and imposed a SEK 6.5 million sanction for serious anti-money-laundering and customer-due-diligence failings. The appeal was dismissed on 2 July 2026. Peru and Sweden have useful exact-market profiles, while commercial eligibility remains a separate decision.",
  pro: "Players who want one of the oldest operators in the industry — Betsson dates to 1963.",
  con: "Sweden's regulator warned Betsson Nordic Ltd and fined it SEK 6.5 million for serious anti-money-laundering failings. A licence is not a clean bill of health, and this is the clearest example in our catalogue.",
  bonusTitle: "100% up to SEK 1,000 in casino plus 50 free spins",
  bonusSummary: "First deposit only. 100% match to SEK 1,000 at 30x deposit and bonus, plus 50 free spins on Pirots 4.",
  wagering: "30x deposit and bonus; free-spin winnings 35x",
  eligibility: "New customers registered after 20 October 2025, first deposit only.",
  condition: "Deposit and bonus must be wagered 30 times in the casino before withdrawing.",
  severeWagering: "10x bonus and free-spin winnings, slots only",
  withdrawalTime: "3-5 business days",
  tool: "Spelpaus (Sweden)",
  paymentName: "Bank transfer",
  faqQuestion: "Does Betsson's 8.8 score mean a visit link is available?",
  faqAnswer: "No. Editorial scoring and commercial route authority are separate. This review can remain public while the action is unavailable.",
} as const;
const UNKNOWN = "A sentence written after the catalog was made, which it therefore does not know.";
const languages: readonly CasinoEditorialLanguage[] = CASINO_EDITORIAL_LANGUAGES;

function numbers(value: string) {
  return (value.match(/\d+(?:[.,]\d+)*/g) ?? []).sort();
}

function translated(source: string, language: CasinoEditorialLanguage) {
  const value = casinoEditorialTranslation(source, language);
  assert.ok(value, `${language} has no translation for: ${source}`);
  return value;
}

test("every catalogued English source has Swedish, Danish and German text that keeps its numbers", () => {
  const entries = casinoEditorialEntries();
  assert.ok(entries.length >= 400, `catalog unexpectedly small: ${entries.length}`);
  const sources = entries.map((entry) => normalizeCasinoEditorialSource(entry.en));
  assert.equal(new Set(sources).size, sources.length, "an English source is catalogued twice");
  const hidden = new Set<string>(GERMAN_HIDDEN_CATEGORY_LABELS);
  for (const entry of entries) {
    for (const language of languages) {
      const value = entry[language];
      if (language === "de" && hidden.has(entry.en)) {
        assert.equal(value, null, `German must leave the hidden category label untranslated: ${entry.en}`);
        continue;
      }
      assert.ok(typeof value === "string" && value.trim(), `${language} translation missing for: ${entry.en}`);
      assert.equal(value, value.trim(), `${language} translation has stray whitespace: ${entry.en}`);
      assert.doesNotMatch(value, /<\/?[a-z]|\{\{?|\[(?:todo|tbd|translate)\]|\b(?:undefined|null|lorem ipsum)\b|�/i, `${language}: ${value}`);
      assert.deepEqual(numbers(value), numbers(entry.en), `${language} changed a number in: ${entry.en}`);
    }
  }
  for (const label of GERMAN_HIDDEN_CATEGORY_LABELS) {
    assert.ok(entries.some((entry) => entry.en === label && entry.de === null), `hidden label not catalogued: ${label}`);
  }
});

test("German catalog text, including offer terms, and profile FAQ copy pass the German terminology guard and name no hidden category", () => {
  const german = [
    ...casinoEditorialEntries().flatMap((entry) => entry.de === null ? [] : [entry.de]),
    ...Object.values(PROFILE_FAQ_COPY.de).flatMap((value) => typeof value === "function"
      ? [value("Anbieter", "22. Sept. 2026")]
      : [value]),
  ];
  const offending = german.filter((value) => germanProhibitedTerms(value).length > 0);
  assert.deepEqual(offending, []);
  // Germany hides live games and game shows too; the guard's word list does not name them.
  const hiddenCategoryWording = /\blive\b|\blive-|game ?shows?|spielshows?/i;
  const withoutBrands = (value: string) => GERMAN_PROPER_NAME_ALLOWLIST.reduce((text, name) => text.split(name).join(" "), value);
  assert.deepEqual(german.filter((value) => hiddenCategoryWording.test(withoutBrands(value))), []);
});

test("the profile FAQ copy is complete in every catalog language and English keeps its source wording", () => {
  for (const language of ["en", ...languages] as const) {
    for (const [key, value] of Object.entries(PROFILE_FAQ_COPY[language])) {
      const text = typeof value === "function" ? value("X", "Y") : value;
      assert.ok(text.trim(), `${language}.${key}`);
    }
  }
  assert.equal(PROFILE_FAQ_COPY.en.licenceChecked("MGA", "1 Jan 2030"), "MGA is listed in the published profile, with evidence checked 1 Jan 2030. Licensing is a threshold, not a guarantee of suitability or outcomes.");
});

test("lookups match the exact English source only and fall back to it otherwise", () => {
  assert.equal(casinoEditorialLanguage("sv"), "sv");
  assert.equal(casinoEditorialLanguage("da-DK"), "da");
  assert.equal(casinoEditorialLanguage("de-DE"), "de");
  assert.equal(casinoEditorialLanguage("en"), null);
  assert.equal(casinoEditorialLanguage("es-ES"), null);
  assert.equal(casinoEditorialLanguage(null), null);
  for (const language of languages) {
    const swedishOrOther = translated(SOURCE.pro, language);
    assert.notEqual(swedishOrOther, SOURCE.pro);
    assert.equal(translateCasinoEditorialText(`  ${SOURCE.pro.replace(" — ", "   —\n")}  `, language), swedishOrOther, "whitespace is normalized");
    assert.equal(translateCasinoEditorialText(SOURCE.pro.toLowerCase(), language), SOURCE.pro.toLowerCase(), "no loose matching");
    assert.equal(translateCasinoEditorialText(UNKNOWN, language), UNKNOWN);
    assert.equal(isCasinoEditorialTextInLanguage(swedishOrOther, language), true);
    assert.equal(isCasinoEditorialTextInLanguage(SOURCE.pro, language), false);
    assert.deepEqual(casinoEditorialSourceTexts(swedishOrOther), [SOURCE.pro]);
  }
  for (const offerTerm of [SOURCE.bonusTitle, SOURCE.bonusSummary, SOURCE.wagering, SOURCE.eligibility, SOURCE.condition, SOURCE.severeWagering]) {
    for (const language of languages) assert.notEqual(translated(offerTerm, language), offerTerm, `${language} offer term: ${offerTerm}`);
  }
  // Offer text already published in a market language is never re-translated.
  for (const native of [...CASINO_EDITORIAL_NATIVE_TEXT.da, ...CASINO_EDITORIAL_NATIVE_TEXT.de]) {
    for (const language of languages) assert.equal(translateCasinoEditorialText(native, language), native);
  }
  assert.equal(translateCasinoEditorialText(SOURCE.pro, "en"), SOURCE.pro);
  assert.equal(translateCasinoEditorialText(SOURCE.pro, "es"), SOURCE.pro);
  assert.equal(isCasinoEditorialTextInLanguage(CASINO_EDITORIAL_NATIVE_TEXT.da[0]!, "da"), true);
  assert.equal(isCasinoEditorialTextInLanguage(CASINO_EDITORIAL_NATIVE_TEXT.da[0]!, "sv"), false);
});

const betssonBonus: PublicCasinoDTO["bonuses"][number] = {
  id: "bonus-betsson-se", slug: "betsson-se-welcome", title: SOURCE.bonusTitle, summary: SOURCE.bonusSummary, type: "WELCOME",
  percentage: 100, minimumDeposit: 100, maximumBonus: 1000, maximumBet: null, currency: "SEK", freeSpins: 50,
  wageringMultiplier: 30, wageringText: SOURCE.wagering, eligibility: SOURCE.eligibility, importantConditions: [SOURCE.condition],
  termsUrl: null, startsAt: null, expiresAt: null,
};

function casinoDto(patch: Partial<PublicCasinoDTO> = {}): PublicCasinoDTO {
  const bonus = patch.bonuses?.[0] ?? betssonBonus;
  return {
    source: "cms", id: "casino-betsson", slug: "betsson", name: "Betsson", title: "Betsson", domain: "betsson.example",
    summary: SOURCE.summary, reviewContent: SOURCE.review, operator: "Betsson Nordic Ltd", foundedYear: 1963,
    editorScore: 8.8, trustScore: 8, featured: false, recommended: false,
    publishedAt: "2030-01-01T00:00:00.000Z", lastReviewedAt: "2030-01-02T00:00:00.000Z", version: 1,
    languages: ["sv"], currencies: ["SEK"], pros: [SOURCE.pro, UNKNOWN], cons: [SOURCE.con],
    responsibleGamblingTools: ["Deposit limits", SOURCE.tool, "GAMSTOP"],
    seo: { title: "Betsson", description: SOURCE.summary, canonical: "https://b4gamble.com/casino/betsson", robots: "index,follow", socialTitle: "Betsson", socialDescription: SOURCE.summary, socialImage: null, structuredData: null },
    licenses: [{ authority: "Spelinspektionen", licenseNumber: null, jurisdiction: "SE", status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: "2030-01-15T00:00:00.000Z" }],
    regulatoryFootprint: [{ authority: "Spelinspektionen", jurisdiction: "SE" }],
    countries: [{ countryCode: "SE", availability: "AVAILABLE", minimumAge: 18, currency: "SEK", language: "sv" }],
    payments: [
      { key: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["SEK"], minimumDeposit: 100, minimumWithdrawal: null, maximumWithdrawal: null, depositProcessingTime: null, withdrawalTime: SOURCE.withdrawalTime, fees: null, crypto: false },
      { key: "bank-transfer", name: SOURCE.paymentName, supportsDeposits: true, supportsWithdrawals: true, currencies: ["SEK"], minimumDeposit: 100, minimumWithdrawal: null, maximumWithdrawal: null, depositProcessingTime: null, withdrawalTime: "Instant or next business day", fees: null, crypto: false },
    ],
    providers: [{ key: "netent", name: "NetEnt", gameCount: null, liveCasino: null }],
    categories: [{ key: "slots", name: "Slots", gameCount: null, featured: true }, { key: "live-casino", name: "Live casino", gameCount: null, featured: true }],
    bonuses: [bonus],
    offerPresentation: { selectedOffer: bonus, relation: "EXACT", sourceCountryCode: "SE", presentationCountryCode: "SE", currentMarketVerified: true },
    marketProfiles: [],
    media: { logo: null, hero: null, screenshots: [], gallery: [], socialImage: null },
    action: null,
    ...patch,
  };
}

const editorial: CasinoEditorialDocument = {
  version: 1, title: "Betsson: the B4GAMBLE review", summary: SOURCE.summary, author: "B4GAMBLE Editorial", factCheckedAt: "2030-01-01T00:00:00.000Z",
  trustScore: { overall: 8, confidence: "medium", evidence: [], categories: [] }, relatedCasinoIds: [],
  sections: [{ id: "faq", kind: "faq", title: "Questions", order: 0, blocks: [{ id: "faq-1", type: "faq", question: SOURCE.faqQuestion, answer: SOURCE.faqAnswer }] }],
  seo: { title: "Betsson review", description: "Betsson review", canonicalPath: "/casino/betsson", robots: "index,follow" },
};

test("a published casino and its offers read in the page language, keep numbers, parsed and identity fields, and stay English for English pages", () => {
  const english = casinoDto();
  assert.equal(localizePublicCasino(english, "en"), english, "English pages receive the record untouched");
  assert.equal(localizePublicCasino(english, null), english);
  assert.equal(localizePublicCasino(english, "es"), english);
  for (const language of languages) {
    const casino = localizePublicCasino(english, language);
    assert.equal(casino.editorialLanguage, language);
    assert.equal(casino.summary, translated(SOURCE.summary, language));
    assert.equal(casino.reviewContent, translated(SOURCE.review, language));
    assert.deepEqual(casino.pros, [translated(SOURCE.pro, language), UNKNOWN], "an unknown source stays English");
    assert.deepEqual(casino.cons, [translated(SOURCE.con, language)]);
    assert.deepEqual(casino.responsibleGamblingTools, [translated("Deposit limits", language), translated(SOURCE.tool, language), "GAMSTOP"]);
    const bonus = casino.bonuses[0]!;
    assert.equal(bonus.title, translated(SOURCE.bonusTitle, language));
    assert.equal(bonus.summary, translated(SOURCE.bonusSummary, language));
    assert.equal(bonus.wageringText, translated(SOURCE.wagering, language));
    assert.equal(bonus.eligibility, translated(SOURCE.eligibility, language));
    assert.deepEqual(bonus.importantConditions, [translated(SOURCE.condition, language)]);
    const numericFields = ({ percentage, minimumDeposit, maximumBonus, maximumBet, currency, freeSpins, wageringMultiplier, termsUrl, id, slug }: typeof bonus) => ({ percentage, minimumDeposit, maximumBonus, maximumBet, currency, freeSpins, wageringMultiplier, termsUrl, id, slug });
    assert.deepEqual(numericFields(bonus), numericFields(english.bonuses[0]!), "amounts, currency and terms link are kept as published");
    assert.deepEqual(casino.offerPresentation?.selectedOffer, bonus, "the selected offer reads the same as the listed one");
    assert.equal(casino.offerPresentation?.relation, english.offerPresentation?.relation);
    assert.equal(casino.categories[0]!.name, translated("Slots", language));
    assert.equal(casino.categories[1]!.name, language === "de" ? "Live casino" : translated("Live casino", language), "German leaves a hidden category label as written");
    assert.equal(casino.payments[1]!.name, translated(SOURCE.paymentName, language));
    assert.equal(casino.payments[1]!.key, "bank-transfer");
    // Parsed and identity fields are never translated.
    assert.deepEqual(casino.payments.map((payment) => payment.withdrawalTime), english.payments.map((payment) => payment.withdrawalTime));
    assert.equal(normalizeWithdrawalTime(casino.payments[1]!.withdrawalTime), normalizeWithdrawalTime(english.payments[1]!.withdrawalTime));
    assert.deepEqual([casino.name, casino.operator, casino.licenses, casino.providers, casino.payments[0]!.name], [english.name, english.operator, english.licenses, english.providers, "Visa"]);
  }
  const demo = casinoDto({ dataClassification: "DEMO_FIXTURE" });
  assert.equal(localizePublicCasino(demo, "sv"), demo, "fictional demonstration records are never translated");
});

function offerRecord(slug: string, score: number, patch: Partial<PublicOfferDTO["bonus"]> = {}): PublicOfferDTO {
  return {
    casino: {
      id: `casino-${slug}`, slug, name: slug, summary: SOURCE.summary, logo: null, hero: null,
      editorScore: score, featured: false, recommended: false, publishedAt: null, lastReviewedAt: null, countries: [], licenses: [],
      payments: [{ key: "bank-transfer", name: SOURCE.paymentName, minimumDeposit: 10, supportsWithdrawals: true, withdrawalTime: SOURCE.withdrawalTime, minimumWithdrawal: null, maximumWithdrawal: null, fees: null, crypto: false }],
      responsibleGamblingTools: [SOURCE.tool],
    },
    bonus: {
      id: `bonus-${slug}`, slug: `${slug}-welcome`, title: SOURCE.bonusTitle, summary: SOURCE.bonusSummary, type: "WELCOME", percentage: 100, maximumBonus: 25,
      currency: "GBP", freeSpins: 50, minimumDeposit: 10, wageringMultiplier: 10, wageringText: SOURCE.severeWagering, eligibility: SOURCE.eligibility,
      importantConditions: [SOURCE.condition], startsAt: null, expiresAt: null,
      ...patch,
    },
    action: { href: `/r/${slug}` },
    dataClassification: "PUBLISHED_RECORD",
  };
}

test("offer records and directory cards read in the page language, keep amounts, and rank exactly like English in every Best Offers category", () => {
  const offers = [
    offerRecord("regencycasino", 8),
    offerRecord("eucasino", 8, { wageringText: SOURCE.wagering, wageringMultiplier: 30 }),
    offerRecord("slotsmagic", 7.5, { minimumDeposit: 5, wageringText: null, wageringMultiplier: 5 }),
  ];
  const offer = offers[0]!;
  assert.equal(severeBonusRestrictionCount(offer), 1);
  assert.equal(localizePublicOffer(offer, "en"), offer);
  for (const language of languages) {
    const localized = localizePublicOffer(offer, language);
    assert.equal(localized.bonus.title, translated(SOURCE.bonusTitle, language));
    assert.equal(localized.bonus.summary, translated(SOURCE.bonusSummary, language));
    assert.equal(localized.bonus.wageringText, translated(SOURCE.severeWagering, language));
    assert.equal(localized.bonus.eligibility, translated(SOURCE.eligibility, language));
    assert.deepEqual(localized.bonus.importantConditions, [translated(SOURCE.condition, language)]);
    assert.deepEqual(
      [localized.bonus.percentage, localized.bonus.maximumBonus, localized.bonus.currency, localized.bonus.freeSpins, localized.bonus.minimumDeposit, localized.bonus.wageringMultiplier],
      [offer.bonus.percentage, offer.bonus.maximumBonus, offer.bonus.currency, offer.bonus.freeSpins, offer.bonus.minimumDeposit, offer.bonus.wageringMultiplier],
    );
    assert.equal(localized.bonus.sourceSevereRestrictionCount, 1, "the restriction signal is read from the English terms");
    assert.equal(localized.casino.summary, translated(SOURCE.summary, language));
    assert.equal(localized.casino.payments[0]!.name, translated(SOURCE.paymentName, language));
    assert.equal(localized.casino.payments[0]!.withdrawalTime, SOURCE.withdrawalTime);
    assert.equal(severeBonusRestrictionCount(localized), 1);
    const localizedOffers = offers.map((entry) => localizePublicOffer(entry, language));
    for (const category of BEST_OFFER_CATEGORIES) {
      const order = (records: readonly PublicOfferDTO[]) => rankBestOffersForCategory(records, category, { includeWithoutRoute: true }).map((entry) => entry.bonus.id);
      assert.ok(order(offers).length > 0, `${category} ranks the fixture`);
      assert.deepEqual(order(localizedOffers), order(offers), `${language} ${category} order matches English`);
    }
  }

  const card: PublicCasinoCardDto = {
    id: "casino-betsson", dataClassification: "PUBLISHED_RECORD", slug: "betsson", name: "Betsson", logo: null, shortDescription: SOURCE.summary,
    rating: 8.8, reviewCount: null, licenses: [{ key: "spelinspektionen", label: "Spelinspektionen" }], countries: [],
    paymentMethods: [{ key: "bank-transfer", label: SOURCE.paymentName }], withdrawalTimes: [SOURCE.withdrawalTime], gameProviders: [],
    categories: [{ key: "slots", label: "Slots" }], highlights: [SOURCE.pro, UNKNOWN],
    featuredBonus: { title: SOURCE.bonusTitle, summary: SOURCE.bonusSummary, type: "WELCOME", keyTerms: [SOURCE.condition], wageringRequirement: 30, minimumDeposit: 100, currency: "SEK", validUntil: null, termsApply: true },
    action: null, responsibleGamblingLabel: null, publishedAt: null, editorialUpdatedAt: null,
  };
  assert.equal(localizeCasinoCard(card, "en"), card);
  for (const language of languages) {
    const localized = localizeCasinoCard(card, language);
    assert.deepEqual(localized.highlights, [translated(SOURCE.pro, language), UNKNOWN]);
    assert.equal(localized.shortDescription, translated(SOURCE.summary, language));
    assert.equal(localized.featuredBonus?.title, translated(SOURCE.bonusTitle, language));
    assert.equal(localized.featuredBonus?.summary, translated(SOURCE.bonusSummary, language));
    assert.deepEqual(localized.featuredBonus?.keyTerms, [translated(SOURCE.condition, language)]);
    assert.equal(localized.featuredBonus?.minimumDeposit, 100);
    assert.equal(localized.paymentMethods[0]!.label, translated(SOURCE.paymentName, language));
    assert.deepEqual(localized.withdrawalTimes, [SOURCE.withdrawalTime]);
    assert.deepEqual(localized.licenses, card.licenses);
  }
});

const now = new Date("2030-06-01T00:00:00.000Z");

function publishedRecord(): PublishedCasinoSnapshotRecord {
  // TurboNino holds a GB licence, so the market-access register admits it in GB.
  const bonus = {
    id: "bonus-turbonino", slug: "turbonino-offer", title: SOURCE.bonusTitle, summary: SOURCE.bonusSummary,
    wageringText: SOURCE.wagering, eligibility: SOURCE.eligibility, importantConditions: [SOURCE.condition],
    status: "PUBLISHED", offerStatus: "ACTIVE", expiresAt: "2031-01-01T00:00:00.000Z",
  };
  return {
    casinoId: "cms-turbonino", version: 2, status: "PUBLISHED", publishedAt: new Date("2030-05-01T00:00:00.000Z"), archivedAt: null,
    snapshot: {
      id: "cms-turbonino", slug: "turbonino", title: "TurboNino", domain: "turbonino.example", status: "PUBLISHED", editorScore: 8.5,
      publishedAt: "2030-05-01T00:00:00.000Z", summary: SOURCE.summary, description: SOURCE.review,
      pros: [SOURCE.pro, UNKNOWN], cons: [SOURCE.con], responsibleGamblingTools: [SOURCE.tool],
      casinoBonuses: [bonus],
      countries: [{
        id: "cms-turbonino-gb", countryCode: "GB", availability: "AVAILABLE", primaryLanguage: "en-GB", supportedLanguages: ["en-GB"],
        primaryCurrency: "GBP", supportedCurrencies: ["GBP"], licenses: [], paymentMethods: [], gameProviders: [], gameCategories: [],
        bonuses: [bonus], evidence: [], mediaAssets: [],
      }],
    },
  };
}

function casinoStore(record = publishedRecord()): PublicCasinoStore {
  return {
    listPublished: async () => [record],
    listManagedSlugs: async () => ["turbonino"],
    findPublishedBySlug: async (slug) => slug === "turbonino" ? record : null,
    hasManagedSlug: async (slug) => slug === "turbonino",
  };
}

test("the public casino and offer services translate casino text and offer terms for sv, da and de and leave English untouched", async () => {
  const service = new PublicCasinoService(casinoStore(), { cmsEnabled: true, now }, noCommercialActions);
  const english = await service.getCasino("turbonino", allowJurisdictionAuthority, "GB", "en", "GB");
  assert.ok(english);
  assert.equal(english.summary, SOURCE.summary);
  assert.equal(english.editorialLanguage, undefined);
  assert.deepEqual(english.pros, [SOURCE.pro, UNKNOWN]);
  for (const language of languages) {
    const casino = await service.getCasino("turbonino", allowJurisdictionAuthority, "GB", language, "GB");
    assert.ok(casino);
    assert.equal(casino.editorialLanguage, language);
    assert.equal(casino.summary, translated(SOURCE.summary, language), "the meta description and verdict read the translated summary");
    assert.equal(casino.reviewContent, translated(SOURCE.review, language));
    assert.deepEqual(casino.pros, [translated(SOURCE.pro, language), UNKNOWN]);
    assert.equal(casino.bonuses[0]?.eligibility, translated(SOURCE.eligibility, language));
    assert.equal(casino.bonuses[0]?.minimumDeposit, english.bonuses[0]?.minimumDeposit);
    const listed = await service.listCasinos(allowJurisdictionAuthority, "GB", language, "GB");
    assert.equal(listed[0]?.summary, translated(SOURCE.summary, language));
    const bonuses = await service.listBonuses(allowJurisdictionAuthority, "GB", language, "GB");
    assert.ok(bonuses.length > 0);
    assert.equal(bonuses[0]?.bonus.title, translated(SOURCE.bonusTitle, language));
    assert.equal(bonuses[0]?.casino.summary, translated(SOURCE.summary, language));
  }

  const offers = new PublicOfferService({ listOffers: async () => [{
    casino: { id: "c", slug: "hello-casino", name: "Hello Casino", summary: SOURCE.summary, logo: null, hero: null, editorScore: 8, featured: false, recommended: false, publishedAt: null, lastReviewedAt: null, countries: [], licenses: [], payments: [], responsibleGamblingTools: [] },
    bonus: { id: "b", slug: "hello-offer", title: SOURCE.bonusTitle, summary: SOURCE.bonusSummary, type: "WELCOME", percentage: 100, maximumBonus: 300, currency: "EUR", freeSpins: 100, minimumDeposit: 20, wageringMultiplier: 35, wageringText: SOURCE.severeWagering, eligibility: SOURCE.eligibility, importantConditions: [], startsAt: null, expiresAt: null },
    action: null,
    dataClassification: "PUBLISHED_RECORD",
  }] }, { cmsEnabled: true }, noCommercialActions);
  const englishOffers = await offers.searchOffers({ page: 1, pageSize: 24, sort: "editorial" }, null, { defaultEditorialCountry: "KZ", presentationLanguage: "en" });
  assert.equal(englishOffers.records[0]?.bonus.title, SOURCE.bonusTitle);
  const danishOffers = await offers.searchOffers({ page: 1, pageSize: 24, sort: "editorial" }, null, { defaultEditorialCountry: "KZ", presentationLanguage: "da" });
  assert.equal(danishOffers.records[0]?.bonus.title, translated(SOURCE.bonusTitle, "da"));
  assert.equal(danishOffers.records[0]?.bonus.wageringText, translated(SOURCE.severeWagering, "da"));
  assert.equal(danishOffers.records[0]?.casino.summary, translated(SOURCE.summary, "da"));
  assert.equal(severeBonusRestrictionCount(danishOffers.records[0]!), severeBonusRestrictionCount(englishOffers.records[0]!));
});

function schemasFor(casino: PublicCasinoDTO, locale: "en-GB" | "sv-SE" | "da-DK" | "de-DE") {
  return projectCasinoProfileSchemas(casinoProfileSchemas(casino, editorial), {
    casino,
    casinoDirectoryUrl: absoluteUrl("/casinos"),
    locale,
    messages: productPageMessages(locale),
    profileUrl: absoluteUrl("/casino/betsson"),
  });
}

test("a translated profile emits FAQPage in its own language only when every question and answer reads in it", () => {
  const english = casinoDto();
  const englishSchemas = schemasFor(english, "en-GB");
  const englishFaq = englishSchemas.find((schema) => schema["@type"] === "FAQPage");
  assert.ok(englishFaq, "English keeps its FAQPage");
  assert.equal(englishFaq.inLanguage, undefined);
  assert.equal(schemasFor(english, "sv-SE").some((schema) => schema["@type"] === "FAQPage"), false, "an English FAQ never describes a Swedish page");

  const locales = { sv: "sv-SE", da: "da-DK", de: "de-DE" } as const;
  // An offer with no written terms: the wagering answer is B4GAMBLE's own sentence around the number.
  const termsFree = casinoDto({ bonuses: [{ ...betssonBonus, wageringText: null, eligibility: null }] });
  for (const language of languages) {
    const casino = localizePublicCasino(termsFree, language);
    const faq = profileFaqLocalization(casino, selectProfileBonus(casino), editorial);
    assert.equal(faq.complete, true, `${language} FAQ should read fully in the page language`);
    const visible = profileFaqItems(casino, selectProfileBonus(casino), editorial);
    assert.deepEqual(visible, faq.items);
    assert.equal(visible[0]?.question, translated(SOURCE.faqQuestion, language));
    assert.equal(visible[0]?.answer, translated(SOURCE.faqAnswer, language));
    assert.ok(visible.some((item) => item.question === PROFILE_FAQ_COPY[language].wageringQuestion && item.answer === PROFILE_FAQ_COPY[language].wageringListed("30")));
    assert.ok(visible.some((item) => item.answer.includes(`${translated(SOURCE.paymentName, language)}: `) && item.answer.includes(translated(SOURCE.withdrawalTime, language))));
    assert.doesNotMatch(JSON.stringify(visible), /listed in the published profile|What wagering information|business days/);

    const schemas = schemasFor(casino, locales[language]);
    const schema = schemas.find((entry) => entry["@type"] === "FAQPage");
    assert.ok(schema, `${language} page describes its translated FAQ`);
    assert.equal(schema.inLanguage, language);
    assert.deepEqual(
      (schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map((entry) => ({ question: entry.name, answer: entry.acceptedAnswer.text })),
      visible,
      "structured data carries exactly the visible FAQ text",
    );
    const page = schemas.find((entry) => entry["@type"] === "WebPage");
    assert.equal(page?.description, translated(SOURCE.summary, language));
    assert.equal(page?.name, `Betsson ${productPageMessages(locales[language]).profile.review}`);
    const review = schemas.find((entry) => entry["@type"] === "Review");
    assert.equal(review?.reviewBody, translated(SOURCE.review, language));
    // The same record on a page in another language keeps no FAQPage.
    const other = languages.find((candidate) => candidate !== language)!;
    assert.equal(schemasFor(casino, locales[other]).some((entry) => entry["@type"] === "FAQPage"), false);

    // Catalogued English offer terms are translated in the FAQ answers too.
    const withTerms = localizePublicCasino(english, language);
    const withTermsFaq = profileFaqLocalization(withTerms, selectProfileBonus(withTerms), editorial);
    assert.equal(withTermsFaq.complete, true);
    assert.ok(withTermsFaq.items.some((item) => item.question === PROFILE_FAQ_COPY[language].wageringQuestion && item.answer === translated(SOURCE.wagering, language)));
    assert.ok(withTermsFaq.items.some((item) => item.question === PROFILE_FAQ_COPY[language].eligibilityQuestion && item.answer === translated(SOURCE.eligibility, language)));
    assert.equal(schemasFor(withTerms, locales[language]).find((entry) => entry["@type"] === "FAQPage")?.inLanguage, language);

    // An offer term the catalog does not know stays English, so the FAQ is shown but not described.
    const partial = localizePublicCasino(casinoDto({ bonuses: [{ ...betssonBonus, eligibility: UNKNOWN }] }), language);
    assert.equal(profileFaqLocalization(partial, selectProfileBonus(partial), editorial).complete, false);
    assert.ok(profileFaqItems(partial, selectProfileBonus(partial), editorial).some((item) => item.answer === UNKNOWN), "the visible FAQ still shows the untranslated answer");
    assert.equal(schemasFor(partial, locales[language]).some((entry) => entry["@type"] === "FAQPage"), false, "no FAQPage while any answer is English");

    const unknownEditorial = localizePublicCasino(termsFree, language);
    const unknownFaq: CasinoEditorialDocument = { ...editorial, sections: [{ ...editorial.sections[0]!, blocks: [{ id: "faq-1", type: "faq", question: SOURCE.faqQuestion, answer: UNKNOWN }] }] };
    assert.equal(profileFaqLocalization(unknownEditorial, selectProfileBonus(unknownEditorial), unknownFaq).complete, false);
    assert.ok(profileFaqItems(unknownEditorial, selectProfileBonus(unknownEditorial), unknownFaq).some((item) => item.answer === UNKNOWN), "the visible FAQ still shows the untranslated answer");
  }

  // Terms published in Danish read as Danish on a Danish page only.
  const danishTerms = casinoDto({ bonuses: [{ ...betssonBonus, wageringText: CASINO_EDITORIAL_NATIVE_TEXT.da[2]!, eligibility: CASINO_EDITORIAL_NATIVE_TEXT.da[3]! }] });
  const danish = localizePublicCasino(danishTerms, "da");
  assert.equal(profileFaqLocalization(danish, selectProfileBonus(danish), editorial).complete, true);
  assert.equal(schemasFor(danish, "da-DK").find((entry) => entry["@type"] === "FAQPage")?.inLanguage, "da");
  const swedish = localizePublicCasino(danishTerms, "sv");
  assert.equal(profileFaqLocalization(swedish, selectProfileBonus(swedish), editorial).complete, false);
});

function html(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
}

test("the rendered Swedish, Danish and German review shows no catalogued English editorial text or offer terms", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const englishFragments = [
    "A mature, broad casino product", "Players who want one of the oldest operators", "Sweden&#x27;s regulator warned",
    "Does Betsson&#x27;s 8.8 score", "What wagering information", "listed in the published profile", "business days",
  ];
  const englishPresentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "SE" });
  const englishHtml = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: true, casino: casinoDto(), editorial, messages: productPageMessages(englishPresentation.locale), presentation: englishPresentation,
  }));
  for (const fragment of englishFragments.slice(0, 5)) assert.ok(englishHtml.includes(fragment), `English page lost: ${fragment}`);
  assert.ok(englishHtml.includes(SOURCE.condition));

  for (const language of languages) {
    const presentation = resolvePresentationContext({ routeLanguage: language, trustedCountryCode: "SE" });
    const casino = localizePublicCasino(casinoDto(), presentation.language);
    const rendered = renderToStaticMarkup(React.createElement(CasinoProfile, {
      availableForPresentation: true, casino, editorial, messages: productPageMessages(presentation.locale), presentation,
    }));
    for (const fragment of englishFragments) assert.equal(rendered.includes(fragment), false, `${language} page still shows: ${fragment}`);
    assert.ok(rendered.includes(html(translated(SOURCE.faqQuestion, language))), `${language} FAQ question`);
    assert.ok(rendered.includes(html(translated(SOURCE.faqAnswer, language))), `${language} FAQ answer`);
    assert.equal(rendered.includes(html(SOURCE.condition)), false, `${language} page still shows the English offer condition`);
    assert.ok(rendered.includes(html(translated(SOURCE.condition, language))), `${language} page shows the translated offer condition`);
    assert.equal(rendered.includes(html(SOURCE.wagering)), false, `${language} page still shows the English wagering term`);
  }
});

test("the catalog is wired into ci:quality and reaches the page only through the services", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts["internationalisation:test"]!, /tests\/casino-editorial-translations\.test\.ts/);
  assert.match(packageJson.scripts["ci:quality"]!, /npm run internationalisation:test/);
  for (const file of ["lib/services/public-casino.service.ts", "lib/services/public-casino-discovery.service.ts", "lib/services/public-offer.service.ts"]) {
    assert.match(readFileSync(file, "utf8"), /casino-editorial-translations\/localize/, file);
  }
  // The ranking runs in the browser; the catalog must not be bundled there.
  assert.doesNotMatch(readFileSync("lib/public-offer/best-offer-ranking.ts", "utf8"), /casino-editorial-translations/);
  assert.doesNotMatch(readFileSync("lib/commercial/commercial-presentation.ts", "utf8"), /casino-editorial-translations/);
});

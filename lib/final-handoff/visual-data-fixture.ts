import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import type {
  CasinoDiscoveryQuery,
  CasinoDiscoveryResult,
  PublicCasinoCardDto,
} from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type {
  PublicOfferDTO,
  PublicOfferQuery,
  PublicOfferSearchResult,
} from "@/lib/public-offer/public-offer.types";
import type { PublicComparisonResult } from "@/lib/public-comparison/public-comparison.types";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import type { LearningArticle } from "@/lib/learning-center";
import { temporaryDemoBestOffers } from "@/lib/demo-data/temporary-demo-best-offers";
import { temporaryDemoCasinoIds } from "@/lib/demo-data/temporary-demo-authority";
import { demoProfileCopy } from "@/lib/i18n/demo-profile-catalog";
import { productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { visualFixtureCopy } from "@/lib/i18n/visual-fixture-catalog";
import { MARKET_PROFILES, type SupportedLocale } from "@/lib/market/registry";

/**
 * Enables deterministic data for local reference comparison. This flag may only
 * replace DTO values: routes always render the same runtime components, markup,
 * CSS and interactions used by Preview and Production.
 */
export function isLocalHandoffVisualDataFixture(value: string | string[] | undefined) {
  return value === "true"
    && process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE === "true"
    && process.env.VERCEL !== "1"
    && process.env.VERCEL_ENV !== "production";
}

export function withHandoffLearningArticleData(article: LearningArticle, enabled: boolean): LearningArticle {
  if (!enabled) return article;
  return {
    ...article,
    title: "Wagering requirements,",
    summary: "What 35x actually costs you, when a smaller bonus is the better deal, and the three terms that quietly decide everything.",
    readingTime: "9 min read",
    lastUpdated: "2026-08-12",
    takeaways: [],
    sections: [
      {
        title: "What 35x really means",
        body: "«35x» applies to the bonus amount — sometimes to bonus plus deposit, which doubles the real cost. Take the €200 bonus at 35x on bonus only:",
        blocks: [
          { type: "conversion", rows: [["Bonus received", "€200"], ["Required turnover — 200 × 35", "€7 000"], ["Expected loss at 96% RTP slots", "≈ €280"], ["Expected value of the «free» €200", "−€80"]] },
          { type: "quote", text: "«A bonus is a loan you repay in turnover. Read the interest rate first.»" },
        ],
        after: "Statistically, clearing this bonus on standard slots costs more than the bonus is worth. That is not an accident of one operator — it is how 35x is designed to work at typical RTP.",
      },
      {
        title: "The maths on an illustrative offer",
        body: "Three fictional offer examples, converted to the same currency — expected cost of clearing:",
        blocks: [{ type: "comparison-table", columns: ["Offer", "Wagering", "Turnover", "Exp. cost"], rows: [["«€200 + 100 spins»", "35x B", "€7 000", "−€80"], ["«€50 low-wager»", "10x B", "€500", "+€30"], ["«€500 mega match»", "40x D+B", "€40 000", "−€1 100"]] }],
        after: "The €50 offer beats the €500 one by four figures. Headline size and player value are close to uncorrelated — which is why our rankings ignore the headline entirely.",
      },
      {
        title: "Game weighting — the quiet tax",
        body: "Slots usually count 100% towards wagering. Blackjack often counts 10%, roulette 20%, some games 0%. Clear a 35x requirement on blackjack at 10% weighting and your effective requirement is 350x.",
        blocks: [{ type: "trap", title: "Trap term", text: "«Max bet while wagering: €5.» Exceed it once — even accidentally — and most operators may void the bonus and winnings. Check this line before your first spin, not after." }],
      },
      {
        title: "When smaller wins",
        body: "A useful comparison method is to divide the bonus by the turnover it demands. Lower wagering can reduce the expected cost, but no bonus guarantees value or a positive return.",
      },
      {
        title: "The checklist",
        body: "If an offer fails two or more of these, skip it. The deposit you keep is worth more than the bonus you clear.",
        blocks: [{ type: "checklist", title: "Before you accept any bonus", items: ["Wagering applies to bonus only — not deposit + bonus", "Turnover ÷ bonus ratio is 12.5x or better", "Your games count at 100% weighting", "Max bet rule found and noted", "Expiry gives you at least 14 days"] }],
      },
    ],
    examples: [],
    faq: [],
    relatedArticles: ["online-casino-basics", "responsible-gambling-tools", "how-casino-reviews-work"],
    visualPresentation: {
      accentTitle: "explained with real numbers.",
      heroLabel: "Bonuses",
      heroStatus: "Educational example · not a live offer",
      intro: [
        "A casino advertises «100% up to €200». The number everyone reads is 200. The number that decides what you keep is printed two clicks deeper: 35x wagering.",
        "Wagering requirements are the total amount you must bet before bonus money becomes withdrawable. They are not a scam — they are the price of the bonus. The problem is that the price is quoted in a currency most players never convert.",
      ],
      supportTitle: "Control & support",
      supportText: "Reading this because bonuses stopped feeling optional?",
      supportLink: "Open Help — no offers there →",
      bridgeKicker: "Beyond reading",
      bridgeTitle: "Knowledge is half of it.",
      bridgeAccent: "The plan is the other half.",
      bridgeText: "Ten missions that turn what you've read into boundaries that hold. Free and private.",
      relatedCards: [
        { label: "Bonuses", title: "Free spins: value, weighting and the fine print", meta: "6 min read", href: "/learn/casino-bonuses/free-spins" },
        { label: "Banking", title: "How casino payouts really work — and why they stall", meta: "7 min read", href: "/learn/payments/casino-payouts" },
        { label: "Responsible play", title: "Session limits that actually hold", meta: "6 min read", href: "/learn/responsible-gambling/session-limits" },
      ],
    },
  };
}

type FixtureOfferTitleStyle = "percentage" | "amount" | "cashback";
type FixturePayout = Readonly<{ minimumHours: number; maximumHours: number | null; crypto?: true }>;
type FixtureOfferSample = Readonly<{
  name: string;
  score: number;
  wagering: number;
  deposit: number;
  percentage: number;
  maximumBonus: number;
  freeSpins: number;
  titleStyle: FixtureOfferTitleStyle;
  payout: FixturePayout;
}>;

const offerSamples = [
  { name: "Solvane Casino", score: 9.6, wagering: 35, deposit: 20, percentage: 100, maximumBonus: 500, freeSpins: 200, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 24 } },
  { name: "Marlowe Casino", score: 9.2, wagering: 30, deposit: 20, percentage: 100, maximumBonus: 400, freeSpins: 150, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 48 } },
  { name: "Kestrel Casino", score: 8.8, wagering: 35, deposit: 10, percentage: 100, maximumBonus: 300, freeSpins: 100, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 24 } },
  { name: "Aldwyn Casino", score: 8.5, wagering: 35, deposit: 20, percentage: 100, maximumBonus: 250, freeSpins: 100, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 48 } },
  { name: "Verano Casino", score: 8.3, wagering: 30, deposit: 10, percentage: 50, maximumBonus: 200, freeSpins: 50, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 72 } },
  { name: "Nordhem Casino", score: 8.1, wagering: 40, deposit: 25, percentage: 100, maximumBonus: 150, freeSpins: 0, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 24 } },
] as const satisfies readonly FixtureOfferSample[];

const bonusDirectorySamples = [
  offerSamples[0],
  offerSamples[1],
  offerSamples[2],
  { name: "Orlan Casino", score: 8.6, wagering: 40, deposit: 20, percentage: 125, maximumBonus: 400, freeSpins: 125, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 2, crypto: true } },
  { name: "Vespera Casino", score: 8.4, wagering: 35, deposit: 10, percentage: 100, maximumBonus: 250, freeSpins: 75, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 48 } },
  { name: "Halcyon Casino", score: 8.3, wagering: 30, deposit: 25, percentage: 100, maximumBonus: 200, freeSpins: 50, titleStyle: "amount", payout: { minimumHours: 48, maximumHours: null } },
  { name: "Bruma Casino", score: 8.1, wagering: 45, deposit: 20, percentage: 150, maximumBonus: 150, freeSpins: 0, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 48 } },
  { name: "Novara Casino", score: 7.7, wagering: 1, deposit: 20, percentage: 10, maximumBonus: 200, freeSpins: 0, titleStyle: "cashback", payout: { minimumHours: 24, maximumHours: 48 } },
] as const satisfies readonly FixtureOfferSample[];

const casinoDirectorySamples = [
  offerSamples[0],
  { ...offerSamples[1], payout: { minimumHours: 24, maximumHours: 48 } },
  offerSamples[2],
  { name: "Orlan Casino", score: 8.6, wagering: 40, deposit: 20, percentage: 125, maximumBonus: 400, freeSpins: 125, titleStyle: "percentage", payout: { minimumHours: 0, maximumHours: 24 } },
  { name: "Vespera Casino", score: 8.4, wagering: 35, deposit: 10, percentage: 100, maximumBonus: 250, freeSpins: 75, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 48 } },
  { name: "Halcyon Casino", score: 8.3, wagering: 30, deposit: 25, percentage: 100, maximumBonus: 200, freeSpins: 50, titleStyle: "amount", payout: { minimumHours: 48, maximumHours: null } },
  { name: "Bruma Casino", score: 8.1, wagering: 45, deposit: 20, percentage: 150, maximumBonus: 150, freeSpins: 0, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 48 } },
  { name: "Aldwyn Casino", score: 7.9, wagering: 35, deposit: 10, percentage: 100, maximumBonus: 100, freeSpins: 50, titleStyle: "amount", payout: { minimumHours: 48, maximumHours: null } },
  { name: "Novara Casino", score: 7.7, wagering: 40, deposit: 20, percentage: 100, maximumBonus: 200, freeSpins: 0, titleStyle: "percentage", payout: { minimumHours: 24, maximumHours: 48 } },
  { name: "Perla Casino", score: 7.5, wagering: 45, deposit: 25, percentage: 100, maximumBonus: 150, freeSpins: 30, titleStyle: "amount", payout: { minimumHours: 48, maximumHours: null } },
] as const satisfies readonly FixtureOfferSample[];

function fixtureMarket(locale: SupportedLocale) {
  return MARKET_PROFILES.find((profile) => profile.supportedLocales.includes(locale)) ?? MARKET_PROFILES[0];
}

function casinoFixtureFacets(locale: SupportedLocale): CasinoDiscoveryResult["facets"] {
  const market = fixtureMarket(locale);
  return {
    countries: [{ key: market.countryCode, label: market.seoDisplayName, count: casinoDirectorySamples.length }],
    currencies: market.currencyHints.map((currency) => ({ key: currency, label: currency, count: casinoDirectorySamples.length })),
    licenses: [],
    payments: [
      { key: "visa", label: "Visa", count: casinoDirectorySamples.length },
      { key: "mastercard", label: "Mastercard", count: casinoDirectorySamples.length },
    ],
    gameProviders: [],
    categories: [],
    bonusTypes: [{ key: "WELCOME", label: visualFixtureCopy(locale).welcomeBonusType, count: casinoDirectorySamples.length }],
  };
}

function offerFixtureFacets(locale: SupportedLocale): PublicOfferSearchResult["facets"] {
  const market = fixtureMarket(locale);
  const messages = productPageMessages(locale);
  return {
    countries: [{ value: market.countryCode, label: market.seoDisplayName, count: bonusDirectorySamples.length }],
    types: [{ value: "WELCOME", label: visualFixtureCopy(locale).welcomeBonusType, count: bonusDirectorySamples.length }],
    payments: [
      { value: "visa", label: "Visa", count: 4 },
      { value: "mastercard", label: "Mastercard", count: 4 },
    ],
    crypto: [
      { value: "false", label: messages.common.cryptoUnsupported, count: 7 },
      { value: "true", label: messages.common.cryptoSupported, count: 1 },
    ],
    availability: [{ value: "UNAVAILABLE", label: messages.common.reviewOnly, count: bonusDirectorySamples.length }],
  };
}

function formatFixtureMoney(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatFixturePayout(payout: FixturePayout, locale: SupportedLocale) {
  const fixtureCopy = visualFixtureCopy(locale);
  const hours = new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "long", maximumFractionDigits: 0 });
  const range = payout.maximumHours === null
    ? fixtureCopy.atLeastHours.replace("{hours}", hours.format(payout.minimumHours))
    : (hours as Intl.NumberFormat & { formatRange(start: number, end: number): string })
        .formatRange(payout.minimumHours, payout.maximumHours);
  return payout.crypto ? `${range} · ${fixtureCopy.cryptoPayout}` : range;
}

function localizedOfferTitle(sample: FixtureOfferSample, locale: SupportedLocale) {
  const copy = demoProfileCopy(locale);
  const [leadTemplate, spinsTemplate] = copy.bonus.title.split(" + ");
  const lead = localizedNumericFixtureCopy(leadTemplate, `${sample.percentage} ${sample.maximumBonus}`);
  const spins = spinsTemplate ? localizedNumericFixtureCopy(spinsTemplate, String(sample.freeSpins)) : "";
  if (sample.titleStyle === "cashback") {
    const percentage = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(sample.percentage / 100);
    return visualFixtureCopy(locale).cashbackTitle
      .replace("{percent}", percentage)
      .replace("{amount}", formatFixtureMoney(sample.maximumBonus, locale));
  }
  if (sample.titleStyle === "amount") return spins ? `${formatFixtureMoney(sample.maximumBonus, locale)} + ${spins}` : formatFixtureMoney(sample.maximumBonus, locale);
  return sample.freeSpins > 0 && spins ? `${lead} + ${spins}` : lead;
}

function localizedOfferSummary(sample: FixtureOfferSample, locale: SupportedLocale) {
  const messages = productPageMessages(locale);
  return `${messages.common.wagering}: ${sample.wagering}× · ${messages.common.minimumDeposit}: ${formatFixtureMoney(sample.deposit, locale)}.`;
}

function localizedHighlights(index: number, locale: SupportedLocale) {
  const messages = productPageMessages(locale);
  const copy = demoProfileCopy(locale);
  const cryptoPayout = visualFixtureCopy(locale).cryptoPayout;
  const sets = [
    [copy.liveDealer, messages.common.sourceStatus],
    [messages.profile.controlTools, messages.common.supported],
    [messages.common.mobileSupport, messages.common.minimumDeposit],
    [cryptoPayout],
    [messages.common.sourceStatus, cryptoPayout],
    [copy.liveDealer, messages.common.payout],
    [messages.common.maximumBonus, messages.common.wagering],
    [messages.common.paymentMethods, messages.common.minimumDeposit],
    [messages.common.mobileSupport, cryptoPayout],
    [copy.liveDealer, messages.common.eligibility],
  ];
  return sets[index % sets.length];
}

type OfferMediaFixtureMode = "best-offers" | "bonuses";

const phaseTwoMediaFixtures = {
  wide: { url: "/demo-casinos/phase-11-wide-16x9.svg", width: 1600, height: 900, label: "16:9" },
  landscape: { url: "/demo-casinos/phase-11-landscape-4x3.svg", width: 1200, height: 900, label: "4:3" },
  square: { url: "/demo-casinos/phase-11-square.svg", width: 1000, height: 1000, label: "1:1" },
} as const;

function handoffOffer(
  seed: PublicOfferDTO,
  index: number,
  samples: readonly FixtureOfferSample[] = offerSamples,
  mediaMode: OfferMediaFixtureMode = "best-offers",
  locale: SupportedLocale = "en-GB",
): PublicOfferDTO {
  const sample = samples[index];
  const copy = demoProfileCopy(locale);
  const market = fixtureMarket(locale);
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  const paymentName = index % 2 === 0 ? "Visa" : "Mastercard";
  const asset = ["northstar", "aurora", "beacon", "canopy", "cedar"][index % 5];
  const hero = mediaMode === "best-offers"
    ? [phaseTwoMediaFixtures.wide, phaseTwoMediaFixtures.landscape, phaseTwoMediaFixtures.square, null][index % 4]
    : [phaseTwoMediaFixtures.wide, phaseTwoMediaFixtures.square, null][index % 3];
  return {
    ...seed,
    casino: {
      ...seed.casino,
      id: temporaryDemoCasinoIds[index % temporaryDemoCasinoIds.length],
      slug: key,
      reviewHref: index === 0 ? "/casino/demo-plume?visualFixture=true" : null,
      name: sample.name,
      summary: copy.summary,
      logo: { id: `visual-offer-${index}-logo`, type: "logo", url: `/demo-casinos/demo-${asset}-logo.svg`, alt: `${sample.name} ${copy.media.logo}`, width: 320, height: 160, caption: null },
      hero: hero ? { id: `visual-offer-${index}-hero`, type: "hero", url: hero.url, alt: `${sample.name} ${copy.media.hero.replace("{ratio}", hero.label)}`, width: hero.width, height: hero.height, caption: null } : null,
      editorScore: sample.score,
      featured: index === 0,
      recommended: index < 3,
      countries: [{ countryCode: market.countryCode, availability: "AVAILABLE" }],
      licenses: [],
      responsibleGamblingTools: [...copy.responsibleGamblingTools],
      payments: [{
        key: paymentName.toLowerCase(),
        name: paymentName,
        minimumDeposit: sample.deposit,
        supportsWithdrawals: true,
        withdrawalTime: formatFixturePayout(sample.payout, locale),
        minimumWithdrawal: null,
        maximumWithdrawal: null,
        fees: null,
        crypto: Boolean(sample.payout.crypto),
      }],
    },
    bonus: {
      ...seed.bonus,
      id: `visual-bonus-${index}`,
      slug: `visual-bonus-${index}`,
      type: "WELCOME",
      title: localizedOfferTitle(sample, locale),
      summary: localizedOfferSummary(sample, locale),
      percentage: sample.percentage,
      maximumBonus: sample.maximumBonus,
      currency: "EUR",
      freeSpins: sample.freeSpins,
      minimumDeposit: sample.deposit,
      wageringMultiplier: sample.wagering,
      wageringText: localizedNumericFixtureCopy(copy.bonus.wagering, String(sample.wagering)),
      eligibility: copy.bonus.eligibility,
      importantConditions: [...copy.bonus.conditions],
      startsAt: null,
      expiresAt: null,
    },
    action: { available: false, href: null },
    commercialAvailability: "UNAVAILABLE",
    dataClassification: "DEMO_FIXTURE",
  };
}

export function withHandoffOfferData<T extends { readonly records: readonly PublicOfferDTO[]; readonly inventoryMode: unknown }>(result: T, enabled: boolean, locale: SupportedLocale = "en-GB"): T {
  if (!enabled || !result.records.length) return result;
  const records = offerSamples.map((_, index) => handoffOffer(result.records[index % result.records.length], index, offerSamples, "best-offers", locale));
  return { ...result, records, inventoryMode: "DEMO_ONLY" } as unknown as T;
}

function handoffCasino(seed: PublicCasinoCardDto, index: number, allowLocalPreviewAction: boolean, locale: SupportedLocale): PublicCasinoCardDto {
  const sample = casinoDirectorySamples[index];
  const copy = demoProfileCopy(locale);
  const messages = productPageMessages(locale);
  const market = fixtureMarket(locale);
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  const asset = ["northstar", "aurora", "beacon", "canopy", "cedar"][index % 5];
  const hasLogo = index % 5 !== 3;
  const ratioFixture = [
    { url: "/demo-casinos/phase-11-wide-16x9.svg", width: 1600, height: 900, label: "16:9" },
    { url: "/demo-casinos/phase-11-landscape-4x3.svg", width: 1200, height: 900, label: "4:3" },
    { url: "/demo-casinos/phase-11-square.svg", width: 1000, height: 1000, label: "1:1" },
    null,
  ][index % 4];
  const previewAction = allowLocalPreviewAction && index === 0;
  return {
    ...seed,
    id: previewAction ? "local-commercial-phase-preview" : temporaryDemoCasinoIds[index % temporaryDemoCasinoIds.length],
    dataClassification: previewAction ? "LOCAL_PREVIEW_FIXTURE" : "DEMO_FIXTURE",
    slug: key,
    reviewHref: index === 0 ? "/casino/demo-plume?visualFixture=true" : null,
    name: sample.name,
    logo: hasLogo ? { url: `/demo-casinos/demo-${asset}-logo.svg`, alt: `${sample.name} ${copy.media.logo}`, width: 320, height: 160 } : null,
    hero: ratioFixture ? { url: ratioFixture.url, alt: `${sample.name} ${copy.media.hero.replace("{ratio}", ratioFixture.label)}`, width: ratioFixture.width, height: ratioFixture.height } : null,
    shortDescription: copy.summary,
    rating: sample.score,
    licenses: [],
    countries: [{ key: market.countryCode, label: market.seoDisplayName }],
    paymentMethods: [{ key: "visa", label: "Visa" }, { key: "mastercard", label: "Mastercard" }],
    highlights: localizedHighlights(index, locale),
    featuredBonus: {
      title: localizedOfferTitle(sample, locale),
      summary: localizedOfferSummary(sample, locale),
      type: "WELCOME",
      keyTerms: [
        formatFixturePayout(sample.payout, locale),
        `${messages.common.wagering}: ${sample.wagering}×`,
        `${messages.common.minimumDeposit}: ${formatFixtureMoney(sample.deposit, locale)}`,
      ],
      wageringRequirement: sample.wagering,
      minimumDeposit: sample.deposit,
      currency: "EUR",
      validUntil: null,
      termsApply: true,
    },
    visitAction: previewAction
      ? { available: true, redirectSlug: "local-preview-no-destination", label: `${messages.common.actionAvailable}: ${sample.name}`, reasonCode: null }
      : { available: false, redirectSlug: null, label: messages.common.commercialUnavailable, reasonCode: "NO_GOVERNED_ROUTE" },
    responsibleGamblingLabel: messages.profile.controlTools,
  };
}

const casinoFixtureSeed: PublicCasinoCardDto = {
  id: temporaryDemoCasinoIds[0],
  dataClassification: "DEMO_FIXTURE",
  slug: "local-visual-fixture",
  name: "B4GAMBLE visual fixture",
  logo: null,
  hero: null,
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
  visitAction: { available: false, redirectSlug: null, label: "Unavailable", reasonCode: "DEMO_FIXTURE" },
  responsibleGamblingLabel: null,
  publishedAt: null,
  editorialUpdatedAt: null,
};

export function withHandoffCasinoDiscoveryData(
  result: CasinoDiscoveryResult,
  enabled: boolean,
  allowLocalPreviewAction = false,
  locale: SupportedLocale = "en-GB",
  requestedQuery: CasinoDiscoveryQuery = { ...result.appliedFilters, page: result.page },
): CasinoDiscoveryResult {
  if (!enabled) return result;
  const seeds = result.items.length ? result.items : [casinoFixtureSeed];
  const allItems = casinoDirectorySamples.map((_, index) => handoffCasino(seeds[index % seeds.length], index, allowLocalPreviewAction, locale));
  const pageCount = 2;
  const pageSize = Math.ceil(allItems.length / pageCount);
  const page = Math.min(pageCount, Math.max(1, requestedQuery.page ?? result.page));
  const items = allItems.slice((page - 1) * pageSize, page * pageSize);
  return {
    ...result,
    items,
    inventoryMode: "DEMO_ONLY",
    total: allItems.length,
    page,
    pageSize,
    pageCount,
    facets: casinoFixtureFacets(locale),
    appliedFilters: { ...requestedQuery, page },
  };
}

export function withHandoffCasinoProfileData(casino: PublicCasinoDTO, enabled: boolean, locale: SupportedLocale = "en-GB"): PublicCasinoDTO {
  if (!enabled) return casino;
  const sample = offerSamples[0];
  const copy = demoProfileCopy(locale);
  const market = fixtureMarket(locale);
  const currency = market.currencyHints[0] ?? "EUR";
  const bonus = casino.bonuses[0];
  const mediaKey = casino.slug.includes("aurora") ? "aurora" : casino.slug.includes("beacon") ? "beacon" : casino.slug.includes("canopy") ? "canopy" : casino.slug.includes("cedar") ? "cedar" : "northstar";
  const profileHasLogo = mediaKey !== "canopy";
  const profileRatioFixtures = {
    northstar: { url: "/demo-casinos/phase-11-portrait-3x4.svg", width: 900, height: 1200, label: "3:4" },
    beacon: { url: "/demo-casinos/phase-11-square.svg", width: 1000, height: 1000, label: "1:1" },
    aurora: { url: "/demo-casinos/phase-11-wide-16x9.svg", width: 1600, height: 900, label: "16:9" },
  } as const;
  const profileRatioFixture = mediaKey in profileRatioFixtures ? profileRatioFixtures[mediaKey as keyof typeof profileRatioFixtures] : null;
  return {
    ...casino,
    id: temporaryDemoCasinoIds[0],
    domain: "example.invalid",
    name: sample.name,
    title: copy.title,
    summary: copy.summary,
    reviewContent: copy.reviewContent,
    operator: null,
    foundedYear: 2021,
    editorScore: sample.score,
    languages: [locale],
    currencies: [currency],
    pros: [...copy.pros],
    cons: [...copy.cons],
    responsibleGamblingTools: [...copy.responsibleGamblingTools],
    seo: {
      title: copy.editorial.seoTitle,
      description: copy.editorial.seoDescription,
      canonical: casino.seo.canonical,
      robots: "noindex,follow",
      socialTitle: copy.editorial.seoTitle,
      socialDescription: copy.editorial.seoDescription,
      socialImage: null,
      structuredData: null,
    },
    licenses: [{ authority: "MGA", licenseNumber: "REFERENCE", jurisdiction: "MT", status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: "2026-08-12T00:00:00.000Z" }],
    countries: [{ countryCode: market.countryCode, availability: "AVAILABLE", minimumAge: 18, currency, language: locale }],
    payments: ["Visa", "Skrill", copy.bankTransfer].map((name, index) => ({
      key: `visual-profile-payment-${index}`,
      name,
      supportsDeposits: true,
      supportsWithdrawals: true,
      currencies: [currency],
      withdrawalTime: formatFixturePayout(sample.payout, locale),
      minimumDeposit: sample.deposit,
      minimumWithdrawal: null,
      maximumWithdrawal: null,
      depositProcessingTime: copy.instant,
      fees: null,
      crypto: false,
    })),
    providers: [{ key: "visual-slots", name: "Orbit Studios", gameCount: 2400, liveCasino: false }],
    categories: [{ key: "visual-live", name: copy.liveDealer, gameCount: 40, featured: true }],
    bonuses: bonus ? [{
      ...bonus,
      id: "visual-solvane-bonus",
      slug: "visual-solvane-bonus",
      title: copy.bonus.title,
      summary: copy.bonus.summary,
      type: "WELCOME",
      percentage: 100,
      minimumDeposit: sample.deposit,
      maximumBonus: 500,
      maximumBet: 5,
      currency,
      freeSpins: 200,
      wageringMultiplier: sample.wagering,
      wageringText: copy.bonus.wagering,
      eligibility: copy.bonus.eligibility,
      importantConditions: [...copy.bonus.conditions],
      termsUrl: null,
      startsAt: null,
      expiresAt: null,
      affiliate: { available: false, href: null },
    }] : [],
    media: {
      logo: profileHasLogo ? { id: `visual-${mediaKey}-logo`, type: "logo", url: `/demo-casinos/demo-${mediaKey}-logo.svg`, alt: `${sample.name} ${copy.media.logo}`, width: 320, height: 160, caption: null } : null,
      hero: profileRatioFixture ? { id: `visual-${mediaKey}-hero`, type: "hero", url: profileRatioFixture.url, alt: `${sample.name} ${copy.media.hero.replace("{ratio}", profileRatioFixture.label)}`, width: profileRatioFixture.width, height: profileRatioFixture.height, caption: null } : null,
      screenshots: [],
      gallery: [],
      socialImage: null,
    },
    affiliate: { available: false, href: null },
  };
}

export function withHandoffCasinoEditorialData(document: CasinoEditorialDocument | null, enabled: boolean, locale: SupportedLocale = "en-GB"): CasinoEditorialDocument | null {
  if (!enabled) return document;
  const copy = demoProfileCopy(locale);
  return {
    version: 1,
    title: copy.editorial.title,
    summary: copy.editorial.summary,
    author: copy.editorial.author,
    factCheckedAt: "2026-08-12T00:00:00.000Z",
    trustScore: {
      overall: 9.6,
      confidence: "high",
      evidence: [...copy.editorial.evidence],
      categories: [
        { key: copy.editorial.categories[0], score: 9.8 },
        { key: copy.editorial.categories[1], score: 9.4 },
        { key: copy.editorial.categories[2], score: 9.5 },
        { key: copy.editorial.categories[3], score: 9.2 },
      ],
    },
    sections: copy.editorial.sections.map(([kind, title, text], index) => ({
      id: `visual-section-${index}`,
      kind,
      title,
      order: index,
      blocks: [
        { id: `visual-block-${index}`, type: "paragraph" as const, text },
        ...(index === 0 ? [
          { id: "visual-faq-availability", type: "faq" as const, question: copy.editorial.faq[0][0], answer: copy.editorial.faq[0][1] },
          { id: "visual-faq-freshness", type: "faq" as const, question: copy.editorial.faq[1][0], answer: copy.editorial.faq[1][1] },
          { id: "visual-faq-score", type: "faq" as const, question: copy.editorial.faq[2][0], answer: copy.editorial.faq[2][1] },
        ] : []),
      ],
    })),
    relatedCasinoIds: [],
    seo: { title: copy.editorial.seoTitle, description: copy.editorial.seoDescription },
  };
}

export function withHandoffBonusDirectoryData(
  result: PublicOfferSearchResult,
  enabled: boolean,
  locale: SupportedLocale = "en-GB",
  requestedQuery: PublicOfferQuery = result.query,
): PublicOfferSearchResult {
  if (!enabled) return result;
  const seeds = result.records.length ? result.records : temporaryDemoBestOffers();
  if (!seeds.length) return result;
  const allRecords = bonusDirectorySamples.map((_, index) => handoffOffer(seeds[index % seeds.length], index, bonusDirectorySamples, "bonuses", locale));
  const pageCount = 2;
  const pageSize = Math.ceil(allRecords.length / pageCount);
  const page = Math.min(pageCount, Math.max(1, requestedQuery.page));
  const records = allRecords.slice((page - 1) * pageSize, page * pageSize);
  return {
    ...result,
    records,
    total: allRecords.length,
    page,
    pageSize,
    pageCount,
    query: { ...requestedQuery, page },
    facets: offerFixtureFacets(locale),
    inventoryMode: "DEMO_ONLY",
  };
}

function localizedNumericFixtureCopy(template: string, source: string) {
  const sourceNumbers = source.match(/\d+(?:[.,]\d+)?/g) ?? [];
  let index = 0;
  return template.replace(/\d+(?:[.,]\d+)?/g, (value) => sourceNumbers[index++] ?? value);
}

export function withHandoffComparisonData(result: PublicComparisonResult, enabled: boolean, locale: SupportedLocale = "en-GB"): PublicComparisonResult {
  if (!enabled) return result;
  const messages = productPageMessages(locale);
  const copy = demoProfileCopy(locale);
  const unavailableAction = () => ({
    available: false,
    href: null,
    label: messages.common.commercialUnavailable,
    reason: messages.profile.demoDisclosure,
  });
  const casinos = (result.casinos.length ? result.casinos : result.selectedSlugs.map((slug, index) => {
    const candidate = result.candidates[index % Math.max(1, result.candidates.length)];
    return {
      id: `visual-comparison-${index}`,
      dataClassification: "DEMO_FIXTURE" as const,
      slug,
      name: offerSamples[index % offerSamples.length].name,
      summary: copy.summary,
      logo: null,
      editorScore: offerSamples[index % offerSamples.length].score,
      publishedAt: null,
      lastReviewedAt: null,
      reviewHref: candidate ? `/casino/${candidate.slug}` : "/casinos",
      marketState: "AVAILABLE" as const,
      action: unavailableAction(),
    };
  })).map((casino, index) => {
    const sample = offerSamples[index % offerSamples.length];
    return {
      ...casino,
      id: `visual-comparison-${index}`,
      dataClassification: "DEMO_FIXTURE" as const,
      reviewHref: "/casino/demo-plume?visualFixture=true",
      name: sample.name,
      summary: copy.summary,
      logo: null,
      editorScore: sample.score,
      action: unavailableAction(),
    };
  });
  const visualComparisonValues: Record<string, (index: number) => string> = {
    "offer-title": (index) => localizedOfferTitle(offerSamples[index % offerSamples.length], locale),
    wagering: (index) => localizedNumericFixtureCopy(copy.bonus.wagering, String(offerSamples[index % offerSamples.length].wagering)),
    "minimum-deposit": (index) => formatFixtureMoney(offerSamples[index % offerSamples.length].deposit, locale),
    "withdrawal-time": (index) => formatFixturePayout(offerSamples[index % offerSamples.length].payout, locale),
    methods: (index) => ["Visa / Mastercard", ...(index === 0 ? ["Skrill"] : []), copy.bankTransfer].join(" · "),
    "control-tools": () => copy.responsibleGamblingTools.join(" · "),
  };
  const value = (rowId: string, index: number) => ({
    text: visualComparisonValues[rowId](index),
    status: "Demonstration" as const,
    statusLabel: messages.common.demoData,
  });
  const fallbackGroups = [
    {
      id: "offer",
      label: messages.profile.offerTerms,
      rows: [
        { id: "offer-title", label: messages.profile.offerEvidence, description: copy.editorial.summary },
        { id: "wagering", label: messages.common.wagering, description: copy.editorial.summary },
        { id: "minimum-deposit", label: messages.common.minimumDeposit, description: copy.editorial.summary },
      ].map((row) => ({ ...row, values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, value(row.id, index)])) })),
    },
    {
      id: "payments",
      label: messages.common.paymentMethods,
      rows: [
        { id: "withdrawal-time", label: messages.common.payout, description: copy.editorial.summary },
        { id: "methods", label: messages.common.paymentMethods, description: copy.editorial.summary },
      ].map((row) => ({ ...row, values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, value(row.id, index)])) })),
    },
    {
      id: "safety-commercial",
      label: messages.profile.controlTools,
      rows: [{ id: "control-tools", label: messages.profile.controlTools, description: copy.editorial.summary, values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, value("control-tools", index)])) }],
    },
  ];
  return {
    ...result,
    status: "available",
    casinos,
    candidates: result.candidates.map((candidate, index) => ({
      ...candidate,
      dataClassification: "DEMO_FIXTURE",
      name: offerSamples[index % offerSamples.length].name,
      logo: null,
      editorScore: offerSamples[index % offerSamples.length].score,
      marketLabel: messages.common.demoData,
    })),
    groups: fallbackGroups,
    reasons: [],
    hiddenEqualRows: 0,
    inventoryMode: "DEMO_ONLY",
  };
}

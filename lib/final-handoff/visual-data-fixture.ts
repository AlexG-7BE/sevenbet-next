import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import type {
  CasinoDiscoveryResult,
  PublicCasinoCardDto,
} from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type {
  PublicOfferDTO,
  PublicOfferSearchResult,
} from "@/lib/public-offer/public-offer.types";
import type { PublicComparisonResult } from "@/lib/public-comparison/public-comparison.types";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import type { LearningArticle } from "@/lib/learning-center";
import { temporaryDemoCasinoIds } from "@/lib/demo-data/temporary-demo-authority";

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

const offerSamples = [
  { name: "Solvane Casino", score: 9.6, title: "100% up to €500 + 200 free spins", wagering: 35, deposit: 20, payout: "0–24h", summary: "Fictional payout and bonus fields for interface testing; not evidence of operator performance or a current offer." },
  { name: "Marlowe Casino", score: 9.2, title: "100% up to €400 + 150 free spins", wagering: 30, deposit: 20, payout: "0–48h", summary: "Fictional wagering, games and support fields for interface testing." },
  { name: "Kestrel Casino", score: 8.8, title: "100% up to €300 + 100 free spins", wagering: 35, deposit: 10, payout: "0–24h", summary: "Fictional deposit, withdrawal and game-library fields for interface testing." },
  { name: "Aldwyn Casino", score: 8.5, title: "100% up to €250 + 100 free spins", wagering: 35, deposit: 20, payout: "0–48h", summary: "Fictional support and game-library fields for interface testing." },
  { name: "Verano Casino", score: 8.3, title: "50% up to €200 + 50 free spins", wagering: 30, deposit: 10, payout: "24–72h", summary: "Fictional wagering and deposit fields for interface testing." },
  { name: "Nordhem Casino", score: 8.1, title: "100% up to €150", wagering: 40, deposit: 25, payout: "0–24h", summary: "Fictional payout and wagering fields for interface testing." },
] as const;

const bonusDirectorySamples = [
  offerSamples[0],
  offerSamples[1],
  offerSamples[2],
  { name: "Orlan Casino", score: 8.6, title: "125% up to €400 + 125 free spins", wagering: 40, deposit: 20, payout: "0–2h crypto", summary: "Crypto payout speed with the higher wagering requirement shown clearly.", percentage: 125, maximumBonus: 400, freeSpins: 125 },
  { name: "Vespera Casino", score: 8.4, title: "100% up to €250 + 75 free spins", wagering: 35, deposit: 10, payout: "24–48h", summary: "A lower entry offer with mid-range payout timing.", percentage: 100, maximumBonus: 250, freeSpins: 75 },
  { name: "Halcyon Casino", score: 8.3, title: "€200 + 50 free spins", wagering: 30, deposit: 25, payout: "48h+", summary: "Lower wagering offset by a higher deposit floor and slower payout range.", percentage: 100, maximumBonus: 200, freeSpins: 50 },
  { name: "Bruma Casino", score: 8.1, title: "150% up to €150", wagering: 45, deposit: 20, payout: "24–48h", summary: "A larger percentage headline with the highest wagering in this comparison.", percentage: 150, maximumBonus: 150, freeSpins: 0 },
  { name: "Novara Casino", score: 7.7, title: "10% weekly cashback up to €200", wagering: 1, deposit: 20, payout: "24–48h", summary: "A cashback format shown separately from welcome packages.", percentage: 10, maximumBonus: 200, freeSpins: 0 },
] as const;

const casinoDirectorySamples = [
  { ...offerSamples[0], signals: "Live casino · Fast verification" },
  { ...offerSamples[1], payout: "24–48h", signals: "VIP programme · 24/7 support" },
  { ...offerSamples[2], signals: "Mobile-first · Low deposit" },
  { name: "Orlan Casino", score: 8.6, title: "125% up to €400 + 125 free spins", wagering: 40, deposit: 20, payout: "0–24h", summary: "Crypto payout speed with the higher wagering requirement shown clearly.", signals: "Crypto accepted" },
  { name: "Vespera Casino", score: 8.4, title: "100% up to €250 + 75 free spins", wagering: 35, deposit: 10, payout: "24–48h", summary: "A lower entry offer with mid-range payout timing.", signals: "New 2026 · Crypto" },
  { name: "Halcyon Casino", score: 8.3, title: "€200 + 50 free spins", wagering: 30, deposit: 25, payout: "48h+", summary: "Lower wagering offset by a higher deposit floor and slower payout range.", signals: "Live-dealer focus" },
  { name: "Bruma Casino", score: 8.1, title: "150% up to €150", wagering: 45, deposit: 20, payout: "24–48h", summary: "A larger percentage headline with the highest wagering in this comparison.", signals: "High-roller tables" },
  { name: "Aldwyn Casino", score: 7.9, title: "€100 + 50 free spins", wagering: 35, deposit: 10, payout: "48h+", summary: "A classic slots catalogue with a lower deposit floor.", signals: "Classic slots · Est. 2019" },
  { name: "Novara Casino", score: 7.7, title: "100% up to €200", wagering: 40, deposit: 20, payout: "24–48h", summary: "A newer mobile-first option with crypto payments.", signals: "New 2026 · Crypto" },
  { name: "Perla Casino", score: 7.5, title: "€150 + 30 free spins", wagering: 45, deposit: 25, payout: "48h+", summary: "Boutique live rooms with a higher deposit floor.", signals: "Boutique live rooms" },
] as const;

function handoffOffer(seed: PublicOfferDTO, index: number, samples: readonly { name: string; score: number; title: string; wagering: number; deposit: number; payout: string; summary: string; percentage?: number; maximumBonus?: number; freeSpins?: number }[] = offerSamples): PublicOfferDTO {
  const sample = samples[index];
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  const payment = seed.casino.payments[0];
  return {
    ...seed,
    casino: {
      ...seed.casino,
      id: temporaryDemoCasinoIds[index % temporaryDemoCasinoIds.length],
      slug: key,
      name: sample.name,
      summary: sample.summary,
      logo: null,
      editorScore: sample.score,
      featured: index === 0,
      recommended: index < 3,
      countries: [{ countryCode: "GB", availability: "AVAILABLE" }],
      licenses: [],
      payments: [{
        ...(payment ?? {
          key: "visa",
          name: "Visa",
          minimumDeposit: sample.deposit,
          supportsWithdrawals: true,
          withdrawalTime: sample.payout,
          minimumWithdrawal: null,
          maximumWithdrawal: null,
          fees: null,
          crypto: false,
        }),
        key: `visual-payment-${index}`,
        name: payment?.name ?? "Visa",
        minimumDeposit: sample.deposit,
        supportsWithdrawals: true,
        withdrawalTime: sample.payout,
      }],
    },
    bonus: {
      ...seed.bonus,
      id: `visual-bonus-${index}`,
      slug: `visual-bonus-${index}`,
      title: sample.title,
      summary: `${sample.wagering}x wagering · minimum deposit €${sample.deposit}.`,
      percentage: sample.percentage ?? (index === 4 ? 50 : 100),
      maximumBonus: sample.maximumBonus ?? [500, 400, 300, 250, 200, 150][index] ?? seed.bonus.maximumBonus,
      currency: "EUR",
      freeSpins: sample.freeSpins ?? [200, 150, 100, 100, 50, 0][index] ?? seed.bonus.freeSpins,
      minimumDeposit: sample.deposit,
      wageringMultiplier: sample.wagering,
      wageringText: `${sample.wagering}x`,
      eligibility: "18+ · New customers · Terms apply",
      importantConditions: ["Terms shown before action"],
    },
    action: { available: false, href: null },
    commercialAvailability: "UNAVAILABLE",
    dataClassification: "DEMO_FIXTURE",
  };
}

export function withHandoffOfferData<T extends { readonly records: readonly PublicOfferDTO[]; readonly inventoryMode: unknown }>(result: T, enabled: boolean): T {
  if (!enabled || !result.records.length) return result;
  const records = offerSamples.map((_, index) => handoffOffer(result.records[index % result.records.length], index));
  return { ...result, records, inventoryMode: "DEMO_ONLY" } as unknown as T;
}

function handoffCasino(seed: PublicCasinoCardDto, index: number): PublicCasinoCardDto {
  const sample = casinoDirectorySamples[index];
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  const asset = ["northstar", "aurora", "beacon", "canopy", "cedar"][index % 5];
  const hasLogo = index % 5 !== 3;
  const ratioFixture = [
    { url: "/demo-casinos/phase-11-wide-16x9.svg", width: 1600, height: 900, label: "16:9" },
    { url: "/demo-casinos/phase-11-landscape-4x3.svg", width: 1200, height: 900, label: "4:3" },
    { url: "/demo-casinos/phase-11-square.svg", width: 1000, height: 1000, label: "1:1" },
    null,
  ][index % 4];
  const previewAction = index === 0;
  return {
    ...seed,
    id: previewAction ? "local-commercial-phase-preview" : temporaryDemoCasinoIds[index % temporaryDemoCasinoIds.length],
    dataClassification: previewAction ? "LOCAL_PREVIEW_FIXTURE" : "DEMO_FIXTURE",
    slug: key,
    name: sample.name,
    logo: hasLogo ? { url: `/demo-casinos/demo-${asset}-logo.svg`, alt: `${sample.name} fictional preview logo`, width: 320, height: 160 } : null,
    hero: ratioFixture ? { url: ratioFixture.url, alt: `${sample.name} fictional ${ratioFixture.label} media-ratio preview`, width: ratioFixture.width, height: ratioFixture.height } : null,
    shortDescription: sample.summary,
    rating: sample.score,
    licenses: [],
    countries: [{ key: "gb", label: "Great Britain" }],
    paymentMethods: [{ key: "visa", label: "Visa" }, { key: "mastercard", label: "Mastercard" }],
    highlights: sample.signals.split(" · "),
    featuredBonus: {
      title: sample.title,
      summary: `${sample.wagering}x wagering · minimum deposit €${sample.deposit}.`,
      type: "WELCOME",
      keyTerms: [sample.payout, `${sample.wagering}x wagering`, `Min €${sample.deposit}`],
      wageringRequirement: sample.wagering,
      minimumDeposit: sample.deposit,
      currency: "EUR",
      validUntil: null,
      termsApply: true,
    },
    visitAction: previewAction
      ? { available: true, redirectSlug: "local-preview-no-destination", label: `Visit ${sample.name}`, reasonCode: null }
      : { available: false, redirectSlug: null, label: `Visit ${sample.name}`, reasonCode: "NO_GOVERNED_ROUTE" },
    responsibleGamblingLabel: "Control tools listed",
  };
}

export function withHandoffCasinoDiscoveryData(result: CasinoDiscoveryResult, enabled: boolean): CasinoDiscoveryResult {
  if (!enabled || !result.items.length) return result;
  const items = casinoDirectorySamples.map((_, index) => handoffCasino(result.items[index % result.items.length], index));
  return {
    ...result,
    items,
    inventoryMode: "DEMO_ONLY",
    total: items.length,
    page: 1,
    pageSize: Math.max(result.pageSize, items.length),
    pageCount: 1,
  };
}

export function withHandoffCasinoProfileData(casino: PublicCasinoDTO, enabled: boolean): PublicCasinoDTO {
  if (!enabled) return casino;
  const sample = offerSamples[0];
  const bonus = casino.bonuses[0];
  const payment = casino.payments[0];
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
    name: sample.name,
    title: `${sample.name} review`,
    summary: "Fictional review fields for interface testing; not evidence of operator performance or a current offer.",
    reviewContent: "This fictional review demonstrates the interface only. It is not based on a real operator, licence, offer or performance test.",
    foundedYear: 2021,
    editorScore: sample.score,
    pros: ["Players who cash out often", "Live-dealer regulars", "Anyone tired of payout excuses"],
    cons: ["Wagering excludes some live games", "Not available in all countries", "VIP perks start after real play"],
    responsibleGamblingTools: ["Deposit limits", "Time-outs", "Self-exclusion"],
    licenses: [{ authority: "MGA", licenseNumber: "REFERENCE", jurisdiction: "MT", status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: "2026-08-12T00:00:00.000Z" }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: 18, currency: "GBP", language: "en" }],
    payments: ["Visa", "Skrill", "Bank transfer"].map((name, index) => ({
      ...(payment ?? {
        key: "visa",
        name: "Visa",
        supportsDeposits: true,
        supportsWithdrawals: true,
        currencies: ["EUR"],
        minimumDeposit: sample.deposit,
        minimumWithdrawal: null,
        maximumWithdrawal: null,
        depositProcessingTime: "Instant",
        withdrawalTime: sample.payout,
        fees: null,
        crypto: false,
      }),
      key: `visual-profile-payment-${index}`,
      name,
      withdrawalTime: sample.payout,
      minimumDeposit: sample.deposit,
    })),
    providers: [{ key: "visual-slots", name: "Orbit Studios", gameCount: 2400, liveCasino: false }],
    categories: [{ key: "visual-live", name: "Live dealer", gameCount: 40, featured: true }],
    bonuses: bonus ? [{
      ...bonus,
      id: "visual-solvane-bonus",
      slug: "visual-solvane-bonus",
      title: sample.title,
      summary: "A clearly presented welcome offer with the material conditions visible before action.",
      percentage: 100,
      minimumDeposit: sample.deposit,
      maximumBonus: 500,
      currency: "EUR",
      freeSpins: 200,
      wageringMultiplier: sample.wagering,
      wageringText: `${sample.wagering}x wagering`,
      eligibility: "18+ · New customers · Terms apply",
      importantConditions: ["Terms shown before action", "Maximum bet applies"],
      affiliate: { available: false, href: null },
    }] : [],
    media: {
      ...casino.media,
      logo: profileHasLogo ? { id: `visual-${mediaKey}-logo`, type: "logo", url: `/demo-casinos/demo-${mediaKey}-logo.svg`, alt: `${sample.name} fictional preview logo`, width: 320, height: 160, caption: null } : null,
      hero: profileRatioFixture ? { id: `visual-${mediaKey}-hero`, type: "hero", url: profileRatioFixture.url, alt: `${sample.name} fictional ${profileRatioFixture.label} media-ratio preview`, width: profileRatioFixture.width, height: profileRatioFixture.height, caption: null } : null,
    },
    affiliate: { available: false, href: null },
  };
}

export function withHandoffCasinoEditorialData(document: CasinoEditorialDocument | null, enabled: boolean): CasinoEditorialDocument | null {
  if (!enabled) return document;
  const sections = [
    ["payments", "Payouts", "Illustrative withdrawal-method and timing fields for a fictional operator. No payout test was performed."],
    ["games", "Games", "Illustrative game-count, live-table and RTP fields for a fictional operator. No provider catalogue was checked."],
    ["bonuses", "Bonuses", "Illustrative wagering, maximum-win and game-weighting fields. This is not a current or claimable bonus."],
    ["trust", "Support", "Illustrative response-time and support-quality fields for a fictional operator. No support interaction was tested."],
    ["payments", "Banking", "Illustrative payment-method, fee and withdrawal fields for a fictional operator."],
  ] as const;
  return {
    version: 1,
    title: "Full review",
    summary: "Fictional editorial fields for interface testing; not evidence of operator performance.",
    author: "B4GAMBLE Editorial",
    factCheckedAt: "2026-08-12T00:00:00.000Z",
    trustScore: {
      overall: 9.6,
      confidence: "high",
      evidence: ["Fictional payout evidence field", "Fictional RTP evidence field", "Fictional support evidence field"],
      categories: [
        { key: "Payouts", score: 9.8 },
        { key: "Bonus terms", score: 9.4 },
        { key: "Games & live floor", score: 9.5 },
        { key: "Support", score: 9.2 },
      ],
    },
    sections: sections.map(([kind, title, text], index) => ({
      id: `visual-section-${index}`,
      kind,
      title,
      order: index,
      blocks: [
        { id: `visual-block-${index}`, type: "paragraph" as const, text },
        ...(index === 0 ? [
          { id: "visual-faq-availability", type: "faq" as const, question: "Is Solvane available in my country?", answer: "No. Solvane is a fictional interface example and has no commercial availability." },
          { id: "visual-faq-freshness", type: "faq" as const, question: "How fresh is this review?", answer: "This is a deterministic interface fixture, not a current operator review." },
          { id: "visual-faq-score", type: "faq" as const, question: "Did Solvane pay for this score?", answer: "No. Solvane is fictional, the score is illustrative and no commercial relationship exists." },
        ] : []),
      ],
    })),
    relatedCasinoIds: [],
    seo: { title: "Solvane Casino review", description: offerSamples[0].summary },
  };
}

export function withHandoffBonusDirectoryData(result: PublicOfferSearchResult, enabled: boolean): PublicOfferSearchResult {
  if (!enabled || !result.records.length) return result;
  const records = bonusDirectorySamples.map((_, index) => handoffOffer(result.records[index % result.records.length], index, bonusDirectorySamples));
  return {
    ...result,
    records,
    total: records.length,
    page: 1,
    pageSize: Math.max(result.pageSize, records.length),
    pageCount: 1,
    inventoryMode: "PUBLISHED_ONLY",
  };
}

export function withHandoffComparisonData(result: PublicComparisonResult, enabled: boolean): PublicComparisonResult {
  if (!enabled) return result;
  const casinos = (result.casinos.length ? result.casinos : result.selectedSlugs.map((slug, index) => {
    const candidate = result.candidates[index % Math.max(1, result.candidates.length)];
    return {
      id: `visual-comparison-${index}`,
      dataClassification: "DEMO_FIXTURE" as const,
      slug,
      name: offerSamples[index % offerSamples.length].name,
      summary: offerSamples[index % offerSamples.length].summary,
      logo: null,
      editorScore: offerSamples[index % offerSamples.length].score,
      publishedAt: null,
      lastReviewedAt: null,
      reviewHref: candidate ? `/casino/${candidate.slug}` : "/casinos",
      marketState: "AVAILABLE" as const,
      action: { available: false, href: null, label: `Visit ${offerSamples[index % offerSamples.length].name}`, reason: "Fictional demonstration records never expose a commercial action." },
    };
  })).map((casino, index) => {
    const sample = offerSamples[index % offerSamples.length];
    return {
      ...casino,
      id: `visual-comparison-${index}`,
      dataClassification: "DEMO_FIXTURE" as const,
      name: sample.name,
      summary: index === 0 ? "Live casino · Fast verification" : index === 1 ? "VIP programme · 24/7 support" : sample.summary,
      logo: null,
      editorScore: sample.score,
      action: { available: false, href: null, label: `Visit ${sample.name}`, reason: "Fictional demonstration records never expose a commercial action." },
    };
  });
  const visualComparisonValues: Record<string, (index: number) => string> = {
    "offer-title": (index) => offerSamples[index % offerSamples.length].title,
    wagering: (index) => `${offerSamples[index % offerSamples.length].wagering}x`,
    "minimum-deposit": (index) => `€${offerSamples[index % offerSamples.length].deposit}`,
    "withdrawal-time": (index) => offerSamples[index % offerSamples.length].payout,
    methods: (index) => index === 0 ? "Visa / Mastercard · Skrill · Bank transfer" : "Visa / Mastercard · Bank transfer",
    "control-tools": () => "Live casino · VIP programme",
  };
  const fallbackGroups = [
    {
      id: "offer",
      label: "Offer terms",
      rows: [
        { id: "offer-title", label: "Offer", description: "Deterministic local visual data." },
        { id: "wagering", label: "Wagering", description: "Deterministic local visual data." },
        { id: "minimum-deposit", label: "Minimum deposit", description: "Deterministic local visual data." },
      ].map((row) => ({ ...row, values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, { text: visualComparisonValues[row.id](index), status: "Published" as const }])) })),
    },
    {
      id: "payments",
      label: "Payments",
      rows: [
        { id: "withdrawal-time", label: "Payout", description: "Deterministic local visual data." },
        { id: "methods", label: "Payments", description: "Deterministic local visual data." },
      ].map((row) => ({ ...row, values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, { text: visualComparisonValues[row.id](index), status: "Published" as const }])) })),
    },
    {
      id: "safety-commercial",
      label: "Control tools",
      rows: [{ id: "control-tools", label: "Features", description: "Deterministic local visual data.", values: Object.fromEntries(casinos.map((casino, index) => [casino.slug, { text: visualComparisonValues["control-tools"](index), status: "Published" as const }])) }],
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
    })),
    groups: (result.groups.length ? result.groups : fallbackGroups).map((group) => ({
      ...group,
      rows: group.rows.map((row) => ({
        ...row,
        values: visualComparisonValues[row.id]
          ? Object.fromEntries(casinos.map((casino, index) => [casino.slug, { text: visualComparisonValues[row.id](index), status: "Published" as const }]))
          : row.values,
      })),
    })),
    reasons: [],
    inventoryMode: "DEMO_ONLY",
  };
}

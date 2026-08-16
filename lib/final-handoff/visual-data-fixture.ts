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

const offerSamples = [
  { name: "Solvane Casino", score: 9.6, title: "100% up to €500 + 200 free spins", wagering: 35, deposit: 20, payout: "0–24h", summary: "Fastest verified payouts we’ve tested this year, with bonus terms that hold up to the fine print." },
  { name: "Marlowe Casino", score: 9.2, title: "100% up to €400 + 150 free spins", wagering: 30, deposit: 20, payout: "0–48h", summary: "Lowest wagering of the three, strong live games and reliable support." },
  { name: "Kestrel Casino", score: 8.8, title: "100% up to €300 + 100 free spins", wagering: 35, deposit: 10, payout: "0–24h", summary: "Low entry, quick withdrawals and a broad game library." },
  { name: "Aldwyn Casino", score: 8.5, title: "100% up to €250 + 100 free spins", wagering: 35, deposit: 20, payout: "0–48h", summary: "Solid all-rounder with dependable support and a broad library." },
  { name: "Verano Casino", score: 8.3, title: "50% up to €200 + 50 free spins", wagering: 30, deposit: 10, payout: "24–72h", summary: "Low wagering outside the top three and a €10 entry." },
  { name: "Nordhem Casino", score: 8.1, title: "100% up to €150", wagering: 40, deposit: 25, payout: "0–24h", summary: "Top-three payout speed, with the wagering trade-off shown clearly." },
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

function handoffOffer(seed: PublicOfferDTO, index: number, samples: readonly { name: string; score: number; title: string; wagering: number; deposit: number; payout: string; summary: string; percentage?: number; maximumBonus?: number; freeSpins?: number }[] = offerSamples): PublicOfferDTO {
  const sample = samples[index];
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  const payment = seed.casino.payments[0];
  return {
    ...seed,
    casino: {
      ...seed.casino,
      id: `visual-${key}`,
      slug: key,
      name: sample.name,
      summary: sample.summary,
      logo: null,
      editorScore: sample.score,
      featured: index === 0,
      recommended: index < 3,
      countries: [{ countryCode: "GB", availability: "AVAILABLE" }],
      licenses: [{ authority: "UK Gambling Commission", jurisdiction: "GB", status: "ACTIVE" }],
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
    action: { available: true, href: "/r/visual-fixture" },
    commercialAvailability: "AVAILABLE",
    dataClassification: "PUBLISHED_RECORD",
  };
}

export function withHandoffOfferData<T extends { readonly records: readonly PublicOfferDTO[]; readonly inventoryMode: unknown }>(result: T, enabled: boolean): T {
  if (!enabled || !result.records.length) return result;
  const records = offerSamples.map((_, index) => handoffOffer(result.records[index % result.records.length], index));
  return { ...result, records, inventoryMode: "PUBLISHED_ONLY" } as unknown as T;
}

function handoffCasino(seed: PublicCasinoCardDto, index: number): PublicCasinoCardDto {
  const sample = offerSamples[index];
  const key = sample.name.toLowerCase().replaceAll(" ", "-");
  return {
    ...seed,
    id: `visual-${key}`,
    dataClassification: "PUBLISHED_RECORD",
    slug: key,
    name: sample.name,
    logo: null,
    shortDescription: sample.summary,
    rating: sample.score,
    licenses: [{ key: "ukgc", label: "UKGC" }],
    countries: [{ key: "gb", label: "Great Britain" }],
    paymentMethods: [{ key: "visa", label: "Visa" }, { key: "mastercard", label: "Mastercard" }],
    highlights: ["Terms checked", "Payout tested"],
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
    visitAction: { available: true, redirectSlug: "visual-fixture", label: `Visit ${sample.name}`, reasonCode: null },
    responsibleGamblingLabel: "Control tools listed",
  };
}

export function withHandoffCasinoDiscoveryData(result: CasinoDiscoveryResult, enabled: boolean): CasinoDiscoveryResult {
  if (!enabled || !result.items.length) return result;
  const items = offerSamples.map((_, index) => handoffCasino(result.items[index % result.items.length], index));
  return {
    ...result,
    items,
    inventoryMode: "PUBLISHED_ONLY",
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
  return {
    ...casino,
    id: "visual-solvane-casino",
    name: sample.name,
    title: `${sample.name} review`,
    summary: "Solvane delivers on every promise that matters — payouts landed in under 24 hours across all three methods, and the bonus terms read the same on day 30 as on day 1.",
    reviewContent: "Solvane delivers on every promise that matters — payouts landed in under 24 hours across all three methods, and the bonus terms read the same on day 30 as on day 1.",
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
      affiliate: { available: true, href: "/r/visual-fixture" },
    }] : [],
    media: { ...casino.media, logo: null, hero: null },
    affiliate: { available: true, href: "/r/visual-fixture" },
  };
}

export function withHandoffCasinoEditorialData(document: CasinoEditorialDocument | null, enabled: boolean): CasinoEditorialDocument | null {
  if (!enabled) return document;
  const sections = [
    ["payments", "Payouts", "We ran three withdrawal cycles — Visa, Skrill and bank transfer — across four weeks. The slowest verified at 22 hours; Skrill cleared twice in under 4. No documents were re-requested after initial verification, which is rarer than it should be."],
    ["games", "Games", "2,400+ titles with an unusually deep live floor: 40+ live tables at peak, including three exclusive rooms. Slots skew toward high-RTP configurations — we spot-checked twelve titles against provider defaults and found no reduced-RTP variants."],
    ["bonuses", "Bonuses", "The welcome package is the headline, but the terms are the story: 35x on bonus only (not deposit + bonus), no max-win cap, and live-game weighting disclosed upfront. Reload offers follow the same pattern."],
    ["trust", "Support", "Live chat answered in under two minutes at all hours we tested, including 3 a.m. on a Sunday. Agents answered term questions accurately — we cross-checked their wagering explanations against the written T&Cs."],
    ["payments", "Banking", "Visa, Mastercard, Skrill, Neteller and SEPA transfers. Deposits are instant and fee-free; withdrawals carry no operator fee. No crypto — if that matters, see our crypto shortlist."],
  ] as const;
  return {
    version: 1,
    title: "Full review",
    summary: "Solvane delivers on every promise that matters — payouts landed in under 24 hours across all three methods, and the bonus terms read the same on day 30 as on day 1.",
    author: "B4GAMBLE Editorial",
    factCheckedAt: "2026-08-12T00:00:00.000Z",
    sections: sections.map(([kind, title, text], index) => ({ id: `visual-section-${index}`, kind, title, order: index, blocks: [{ id: `visual-block-${index}`, type: "paragraph" as const, text }] })),
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
  if (!enabled || !result.casinos.length) return result;
  const casinos = result.casinos.map((casino, index) => {
    const sample = offerSamples[index % offerSamples.length];
    return {
      ...casino,
      id: `visual-comparison-${index}`,
      dataClassification: "PUBLISHED_RECORD" as const,
      name: sample.name,
      summary: index === 0 ? "Live casino · Fast verification" : index === 1 ? "VIP programme · 24/7 support" : sample.summary,
      logo: null,
      editorScore: sample.score,
      action: { available: true, href: "/r/visual-fixture", label: `Visit ${sample.name}`, reason: "Local deterministic visual data" },
    };
  });
  return {
    ...result,
    status: "available",
    casinos,
    candidates: result.candidates.map((candidate, index) => ({
      ...candidate,
      dataClassification: "PUBLISHED_RECORD",
      name: offerSamples[index % offerSamples.length].name,
      logo: null,
      editorScore: offerSamples[index % offerSamples.length].score,
    })),
    inventoryMode: "PUBLISHED_ONLY",
  };
}

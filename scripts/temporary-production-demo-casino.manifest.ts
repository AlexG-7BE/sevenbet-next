import type { CasinoCoreDraft } from "@/lib/casino-builder/types";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import {
  PRODUCTION_SITE_ORIGIN,
  TEMPORARY_DEMO_ACTOR_LABEL,
  TEMPORARY_DEMO_DATASET_ID,
  temporaryDemoCasinoIds as authoritativeTemporaryDemoCasinoIds,
} from "../lib/demo-data/temporary-demo-authority";

export { PRODUCTION_SITE_ORIGIN, TEMPORARY_DEMO_ACTOR_LABEL, TEMPORARY_DEMO_DATASET_ID };

function id(scope: number, slot: number) {
  return `${String(scope).padStart(8, "0")}-0000-4000-8000-${String(slot).padStart(12, "0")}`;
}

function recordScope(position: number) {
  return position < 9 ? position : 100 + position;
}

function payment(scope: number, slot: number, methodKey: string, name: string, type: string, currencies: string[], minimumDeposit: number, crypto = false, withdrawalTime = "Illustrative 1–3 days") {
  return {
    id: id(scope, slot), methodKey, name, supportsDeposits: true, supportsWithdrawals: true,
    currencies, minimumDeposit: minimumDeposit.toFixed(2), minimumWithdrawal: "20.00", maximumWithdrawal: "2500.00",
    maximumDeposit: "5000.00", depositProcessingTime: "Illustrative instant state", withdrawalTime,
    fees: "Synthetic display data — not operator terms", depositFee: null, withdrawalFee: null, type,
    countries: [], verified: false, notes: "Synthetic payment presentation only", archived: false, crypto, sortOrder: slot,
  };
}

function bonus(scope: number, scenario: Scenario) {
  return {
    id: id(scope, 60), slug: `${scenario.slug}-demo-presentation`, internalName: `${scenario.slug} synthetic presentation`,
    title: `Demo ${scenario.bonusType.toLowerCase().replaceAll("_", " ")} presentation — not a live offer`,
    summary: "Illustrative bonus layout for a fictional casino. This is not an operator promotion and cannot be claimed.",
    shortTerms: "Synthetic presentation only. No real account, deposit, eligibility or redemption exists.",
    amount: scenario.maximumBonus.toFixed(2), type: scenario.bonusType, percentage: scenario.percentage === null ? null : scenario.percentage.toFixed(2),
    minimumDeposit: scenario.minimumDeposit.toFixed(2), maximumBonus: scenario.maximumBonus.toFixed(2), currency: scenario.currency,
    freeSpins: scenario.freeSpins, wageringMultiplier: scenario.wagering.toFixed(2), wageringBase: "BONUS", minimumOdds: null, maximumBet: "5.00",
    wageringText: `Synthetic ${scenario.wagering}× display term. No real wagering requirement applies.`,
    eligibility: "Demonstration content only; nobody is eligible to claim it.", eligibleGames: ["Demo slots"], excludedGames: [],
    eligiblePaymentMethods: [], excludedPaymentMethods: [], newPlayersOnly: true, existingPlayersAllowed: false,
    promoCode: null, importantConditions: ["Not a live offer", "Fictional operator", "No deposit or claim is possible"],
    termsUrl: null, startsAt: null, expiresAt: null, evergreen: true, featured: scenario.featured, exclusive: false,
    notes: "Founder Office approved synthetic production presentation", geoMode: "GLOBAL" as const,
    allowedCountries: [], blockedCountries: [], status: "DRAFT" as const, offerStatus: "ACTIVE", sortOrder: 100,
  };
}

type DemoStyle = { accent: string; dark: string; score: number; trust: number };
type Scenario = {
  n: number; slug: string; label: string; accent: string; dark: string; score: number; trust: number;
  country: string; currency: string; bonusType: string; percentage: number | null; freeSpins: number | null;
  maximumBonus: number; minimumDeposit: number; wagering: number; featured: boolean; recommended: boolean;
  crypto?: boolean; paymentVariant?: "CARD" | "WALLET" | "BANK"; withdrawalTime?: string; revision?: string; publicExperience?: "FULL_PROFILE" | "STRUCTURED_EDITORIAL";
};

export interface TemporaryDemoCasino {
  id: string;
  slug: string;
  domain: string;
  title: string;
  style: DemoStyle;
  draft: CasinoCoreDraft;
  pros: string[];
  cons: string[];
  responsibleGamblingTools: string[];
  images: Array<{ id: string; kind: "LOGO" | "HERO" | "SCREENSHOT"; url: string; alt: string; width: number; height: number; sortOrder: number; isPrimary: boolean }>;
  editorial: CasinoEditorialDocument;
  publicExperience: "FULL_PROFILE" | "STRUCTURED_EDITORIAL";
}

const scenario = (n: number, slug: string, label: string, patch: Partial<Omit<Scenario, "n" | "slug" | "label">> = {}): Scenario => ({
  n, slug: `demo-${slug}`, label, accent: "#d8ff3e", dark: "#17211b", score: 8.1, trust: 7.8,
  country: n <= 18 ? "GB" : "IE", currency: n <= 18 ? "GBP" : "EUR", bonusType: "WELCOME", percentage: 100,
  freeSpins: 25, maximumBonus: 400, minimumDeposit: 10, wagering: 30, featured: n <= 12, recommended: n % 3 === 0,
  publicExperience: n % 5 === 0 ? "STRUCTURED_EDITORIAL" : "FULL_PROFILE", ...patch,
});

const scenarios: Scenario[] = [
  scenario(1, "northstar", "Northstar", { accent: "#d8ff3e", dark: "#17211b", score: 9.5, trust: 9.0, maximumBonus: 500, wagering: 24, featured: true, recommended: true, withdrawalTime: "Typically within one day", revision: "best-offers-r1" }),
  scenario(2, "harbour", "Harbour", { accent: "#78d7ff", dark: "#102332", score: 9.0, trust: 8.6, bonusType: "FREE_SPINS", percentage: null, freeSpins: 100, maximumBonus: 250, minimumDeposit: 5, wagering: 20, paymentVariant: "BANK", withdrawalTime: "Typically within one to two days", revision: "best-offers-r1" }),
  scenario(3, "atlas", "Atlas", { accent: "#ffb15a", dark: "#2c1c15", score: 8.8, trust: 8.4, bonusType: "CASHBACK", percentage: 15, freeSpins: null, maximumBonus: 300, wagering: 26, recommended: true, withdrawalTime: "Typically within 2 hours", revision: "best-offers-r1" }),
  scenario(4, "meadow", "Meadow", { accent: "#a9e5b2", dark: "#183022", score: 8.5, trust: 8.1, bonusType: "RELOAD", percentage: 50, maximumBonus: 350, minimumDeposit: 15, wagering: 32 }),
  scenario(5, "lantern", "Lantern", { accent: "#ff8e9d", dark: "#311a22", score: 9.1, trust: 8.7, bonusType: "NO_DEPOSIT", percentage: null, freeSpins: 40, maximumBonus: 80, minimumDeposit: 0, wagering: 35, crypto: true, publicExperience: "STRUCTURED_EDITORIAL" }),
  scenario(6, "summit", "Summit", { accent: "#ffd45c", dark: "#302812", score: 8.9, trust: 8.5, bonusType: "VIP", percentage: 75, freeSpins: 50, maximumBonus: 750, minimumDeposit: 20, wagering: 30, recommended: true }),
  scenario(7, "ember", "Ember", { accent: "#ff775c", dark: "#321713", score: 8.7, trust: 8.2, bonusType: "WELCOME", percentage: 125, maximumBonus: 600, wagering: 34, paymentVariant: "WALLET" }),
  scenario(8, "tide", "Tide", { accent: "#60e4d1", dark: "#12312e", score: 8.6, trust: 8.0, bonusType: "FREE_SPINS", percentage: 50, freeSpins: 150, maximumBonus: 450, minimumDeposit: 10, wagering: 29, crypto: true }),
  scenario(9, "juniper", "Juniper", { accent: "#b8ef7f", dark: "#20301a", score: 8.4, trust: 8.0, bonusType: "CASHBACK", percentage: 12, freeSpins: null, maximumBonus: 220, minimumDeposit: 5, wagering: 22, recommended: true, revision: "best-offers-r1" }),
  scenario(10, "orbit", "Orbit", { accent: "#a9a3ff", dark: "#211f3a", score: 8.3, trust: 7.9, bonusType: "RELOAD", percentage: 60, freeSpins: 30, maximumBonus: 500, minimumDeposit: 20, wagering: 36, publicExperience: "STRUCTURED_EDITORIAL" }),
  scenario(11, "quartz", "Quartz", { accent: "#f0bfff", dark: "#2f1d34", score: 8.2, trust: 7.8, bonusType: "OTHER", percentage: 80, freeSpins: 20, maximumBonus: 420, minimumDeposit: 10, wagering: 27, crypto: true }),
  scenario(12, "willow", "Willow", { accent: "#9ed0a8", dark: "#1b2b20", score: 8.0, trust: 7.7, bonusType: "WELCOME", percentage: 100, freeSpins: 75, maximumBonus: 550, minimumDeposit: 15, wagering: 31, recommended: true }),
  scenario(13, "beacon", "Beacon", { accent: "#ffe36e", dark: "#312b13", score: 8.7, trust: 8.3, bonusType: "NO_DEPOSIT", percentage: null, freeSpins: 25, maximumBonus: 50, minimumDeposit: 0, wagering: 38, featured: false }),
  scenario(14, "forge", "Forge", { accent: "#ff9569", dark: "#351d15", score: 8.1, trust: 7.6, bonusType: "CASHBACK", percentage: 20, freeSpins: null, maximumBonus: 260, minimumDeposit: 10, wagering: 22, featured: false, crypto: true }),
  scenario(15, "aurora", "Aurora", { accent: "#8cd9ff", dark: "#162a35", score: 8.5, trust: 8.1, bonusType: "WELCOME", percentage: 150, freeSpins: 60, maximumBonus: 800, minimumDeposit: 25, wagering: 40, featured: false, recommended: true, publicExperience: "STRUCTURED_EDITORIAL" }),
  scenario(16, "cedar", "Cedar", { accent: "#d6b27b", dark: "#2e2419", score: 7.9, trust: 7.5, bonusType: "RELOAD", percentage: 40, freeSpins: 20, maximumBonus: 300, minimumDeposit: 10, wagering: 26, featured: false, paymentVariant: "BANK" }),
  scenario(17, "vale", "Vale", { accent: "#c2ef98", dark: "#22351b", score: 8.2, trust: 7.9, bonusType: "FREE_SPINS", percentage: null, freeSpins: 120, maximumBonus: 180, minimumDeposit: 5, wagering: 33, featured: false }),
  scenario(18, "cobalt", "Cobalt", { accent: "#7ea4ff", dark: "#17233c", score: 8.4, trust: 8.0, bonusType: "VIP", percentage: 90, freeSpins: 90, maximumBonus: 900, minimumDeposit: 25, wagering: 42, featured: false, recommended: true, crypto: true }),
  scenario(19, "drift", "Drift", { accent: "#8fe5e0", dark: "#16302e", score: 7.8, trust: 7.4, country: "IE", currency: "EUR", bonusType: "WELCOME", maximumBonus: 450, minimumDeposit: 10, wagering: 30, featured: false }),
  scenario(20, "solstice", "Solstice", { accent: "#ffcf70", dark: "#332710", score: 8.3, trust: 7.9, country: "CA", currency: "CAD", bonusType: "CASHBACK", percentage: 10, freeSpins: null, maximumBonus: 350, minimumDeposit: 15, wagering: 21, featured: false, publicExperience: "STRUCTURED_EDITORIAL" }),
  scenario(21, "meridian", "Meridian", { accent: "#e59cff", dark: "#301b36", score: 8.0, trust: 7.6, country: "AU", currency: "AUD", bonusType: "RELOAD", percentage: 70, maximumBonus: 500, minimumDeposit: 20, wagering: 37, featured: false, recommended: true }),
  scenario(22, "mosaic", "Mosaic", { accent: "#ff9ab5", dark: "#351a24", score: 7.7, trust: 7.3, country: "NZ", currency: "NZD", bonusType: "FREE_SPINS", percentage: null, freeSpins: 80, maximumBonus: 200, minimumDeposit: 10, wagering: 29, featured: false, crypto: true }),
  scenario(23, "plume", "Plume", { accent: "#b9a9ff", dark: "#251f3a", score: 8.1, trust: 7.7, country: "DE", currency: "EUR", bonusType: "WELCOME", percentage: 110, maximumBonus: 650, minimumDeposit: 15, wagering: 34, featured: false }),
  scenario(24, "prism", "Prism", { accent: "#74ddff", dark: "#142d36", score: 7.9, trust: 7.5, country: "SE", currency: "EUR", bonusType: "OTHER", percentage: 65, freeSpins: 35, maximumBonus: 380, minimumDeposit: 10, wagering: 25, featured: false, recommended: true }),
  scenario(25, "canopy", "Canopy", { accent: "#93e89f", dark: "#17321d", score: 7.6, trust: 7.2, country: "FI", currency: "EUR", bonusType: "NO_DEPOSIT", percentage: null, freeSpins: 30, maximumBonus: 60, minimumDeposit: 0, wagering: 39, featured: false, publicExperience: "STRUCTURED_EDITORIAL" }),
];

function paymentSet(item: Scenario, scope: number) {
  const variants = {
    CARD: [["visa", "Visa", "CARD"], ["mastercard", "Mastercard", "CARD"]],
    WALLET: [["visa", "Visa", "CARD"], ["apple-pay", "Apple Pay", "E_WALLET"]],
    BANK: [["visa", "Visa", "CARD"], ["bank-transfer", "Bank transfer", "BANK_TRANSFER"]],
  } as const;
  const selected = variants[item.paymentVariant ?? (item.n % 2 ? "CARD" : "WALLET")];
  const records = selected.map(([key, name, type], index) => payment(scope, 20 + index, key, name, type, [item.currency], item.minimumDeposit, false, item.withdrawalTime));
  if (item.crypto) records.push(payment(scope, 29, "demo-coin", "Demo Coin", "CRYPTO", [item.currency], item.minimumDeposit, true, item.withdrawalTime));
  return records;
}

export const temporaryDemoCasinos: TemporaryDemoCasino[] = scenarios.map((item) => {
  const scope = recordScope(item.n);
  const title = `Demo ${item.label} Casino`;
  const asset = (suffix: string) => `/demo-casinos/${item.slug}-${suffix}.svg`;
  const summary = `${title} is a fictional B4GAMBLE product demonstration. It is not a real operator and its commercial details are synthetic.`;
  const pros = ["Clear fictional demo disclosure", "Complete responsive profile presentation", "Illustrative payment and game information"];
  const cons = ["Not a real casino operator", "No live registration, deposit or bonus", "Licence and availability blocks are synthetic UI examples"];
  const draft: CasinoCoreDraft = {
    slug: item.slug, internalName: `${title} — ${TEMPORARY_DEMO_DATASET_ID}${item.revision ? ` — ${item.revision}` : ""}`, title, domain: `${item.slug}.example`, websiteUrl: null,
    operator: "Fictional B4GAMBLE Demo Studio", tagline: "Fictional profile for product demonstration only", summary,
    description: `${summary} The review, score, countries, payments, games, licence block and bonus presentation exist only to demonstrate B4GAMBLE's product experience to potential partners. No statement describes an existing gambling business.`,
    foundedYear: 2026, language: "en", languages: ["en"], currencies: [item.currency], editorScore: item.score,
    generalMetadata: { trustScore: item.trust, userExperienceScore: item.score - .2, paymentsScore: item.score - .4, gamesScore: item.score - .1, supportScore: item.score - .6, responsibleGamblingScore: item.score - .3, featured: item.featured, recommended: item.recommended, internalNotes: "Synthetic production demonstration approved by Founder Office on 2026-08-06." },
    licenses: [{ id: id(scope, 10), authority: "Demo Regulatory Sandbox — not a real regulator", licenseNumber: null, jurisdiction: "Synthetic product demonstration only", status: "ACTIVE", verificationUrl: null, issuedAt: null, expiresAt: null, lastVerifiedAt: null, notes: "Fictional UI fixture. No licence has been issued and no regulatory claim is made.", verified: false, archived: false }],
    countries: [{ id: id(scope, 11), countryCode: item.country, availability: "AVAILABLE", minimumAge: null, notes: "Synthetic display coverage only; this is not a market availability decision.", currency: item.currency, language: "en", priority: 100, archived: false }],
    paymentMethods: paymentSet(item, scope),
    gameProviders: [
      { id: id(scope, 30), providerKey: "demo-orbit-studios", name: "Demo Orbit Studios", websiteUrl: null, gameCount: 420 + item.n * 15, liveCasino: false, featured: true, verified: false, archived: false, verifiedAt: null, sortOrder: 100 },
      { id: id(scope, 31), providerKey: "demo-table-lab", name: "Demo Table Lab", websiteUrl: null, gameCount: 65 + item.n * 4, liveCasino: true, featured: false, verified: false, archived: false, verifiedAt: null, sortOrder: 200 },
    ],
    gameCategories: [
      { id: id(scope, 40), categoryKey: "demo-slots", name: "Demo Slots", gameCount: 320 + item.n * 12, featured: true, icon: null, archived: false, sortOrder: 100 },
      { id: id(scope, 41), categoryKey: "demo-live-tables", name: "Demo Live Tables", gameCount: 48 + item.n * 3, featured: true, icon: null, archived: false, sortOrder: 200 },
    ],
    casinoBonuses: [bonus(scope, item)],
    seo: { id: id(scope, 70), title: `${title} — Fictional B4GAMBLE Demo`, description: `Synthetic ${title} profile for demonstrating B4GAMBLE catalogue and editorial presentation. Not a real operator or offer.`, canonicalUrl: `${PRODUCTION_SITE_ORIGIN}/casino/${item.slug}`, robots: "noindex,follow", socialTitle: `${title} — Demo Profile`, socialDescription: summary, socialImage: `${PRODUCTION_SITE_ORIGIN}${asset("hero")}`, structuredData: "", robotsIndex: false, robotsFollow: true },
  };
  const editorial: CasinoEditorialDocument = {
    version: 1, title: `${title}: synthetic editorial demonstration`, summary, author: "B4GAMBLE Demo Editorial Team", factCheckedAt: "2026-08-06T00:00:00.000Z",
    trustScore: { overall: item.trust, confidence: "low", evidence: ["Founder Office approved synthetic dataset manifest"], categories: [{ key: "disclosure", score: 10, comment: "The profile is explicitly fictional." }, { key: "operator-evidence", score: 0, comment: "No real operator evidence exists or is claimed." }] },
    sections: [
      { id: `${item.slug}-overview`, kind: "overview", title: "What this profile demonstrates", order: 0, blocks: [{ id: `${item.slug}-overview-copy`, type: "paragraph", text: `${summary} This page demonstrates catalogue, review and responsive presentation states.` }, { id: `${item.slug}-warning`, type: "warning", title: "Demo data", text: "Do not treat this profile, score, licence block, country or bonus as operator evidence." }] },
      { id: `${item.slug}-pros`, kind: "pros", title: "Presentation strengths", order: 1, blocks: [{ id: `${item.slug}-pros-list`, type: "pros", items: pros }] },
      { id: `${item.slug}-cons`, kind: "cons", title: "Material limitations", order: 2, blocks: [{ id: `${item.slug}-cons-list`, type: "cons", items: cons }] },
      { id: `${item.slug}-licensing`, kind: "licensing", title: "Licence disclosure", order: 3, blocks: [{ id: `${item.slug}-licence-copy`, type: "paragraph", text: "Demo Regulatory Sandbox is fictional. No licence number, regulator verification or real operator claim exists." }] },
      { id: `${item.slug}-faq`, kind: "faq", title: "Demo FAQ", order: 4, blocks: [{ id: `${item.slug}-faq-item`, type: "faq", question: "Can I register or claim this demo offer?", answer: "No. This is a fictional B4GAMBLE product demonstration with no real operator account, deposit or promotion." }] },
    ], relatedCasinoIds: [], seo: { title: `${title} synthetic review`, description: summary, canonicalPath: `/casino/${item.slug}`, robots: "noindex,follow", keywords: ["B4GAMBLE demo", "fictional casino profile"] },
  };
  return {
    id: id(scope, 1), slug: item.slug, domain: `${item.slug}.example`, title, style: { accent: item.accent, dark: item.dark, score: item.score, trust: item.trust }, draft, pros, cons,
    responsibleGamblingTools: ["Synthetic self-exclusion presentation", "Synthetic deposit-limit presentation", "Protected B4GAMBLE Help remains available"],
    images: [
      { id: id(scope, 80), kind: "LOGO", url: asset("logo"), alt: `${title} fictional demo logo`, width: 560, height: 240, sortOrder: 100, isPrimary: true },
      { id: id(scope, 81), kind: "HERO", url: asset("hero"), alt: `${title} synthetic editorial hero artwork`, width: 1600, height: 900, sortOrder: 100, isPrimary: true },
      { id: id(scope, 82), kind: "SCREENSHOT", url: asset("screen"), alt: `${title} fictional mobile product presentation`, width: 900, height: 1200, sortOrder: 100, isPrimary: false },
    ], editorial, publicExperience: item.publicExperience ?? "FULL_PROFILE",
  };
});

export const temporaryDemoAffiliateNetwork = { networkId: id(9, 1), networkSlug: "demo-sevenbet-internal-network" } as const;

function affiliate(casino: TemporaryDemoCasino, scope: number, legacyNorthstar = false) {
  const base = legacyNorthstar ? 9 : scope;
  const offset = legacyNorthstar ? 0 : 88;
  return {
    programId: id(base, 2 + offset), offerId: id(base, 3 + offset), trackingLinkId: id(base, 4 + offset), redirectId: id(base, 5 + offset),
    offerRevisionId: id(base, 6 + offset), trackingRevisionId: id(base, 7 + offset), redirectRevisionId: id(base, 8 + offset),
    redirectSlug: casino.slug, casinoId: casino.id, casinoBonusId: null,
    internalDestination: `${PRODUCTION_SITE_ORIGIN}/casino/${casino.slug}`,
  } as const;
}

export const temporaryDemoAffiliates = [
  affiliate(temporaryDemoCasinos[0], 201, true),
  affiliate(temporaryDemoCasinos[1], 202),
  affiliate(temporaryDemoCasinos[2], 203),
  affiliate(temporaryDemoCasinos[4], 204),
  affiliate(temporaryDemoCasinos[5], 205),
] as const;

export const temporaryDemoCasinoIds = [...authoritativeTemporaryDemoCasinoIds];
export const temporaryDemoCasinoSlugs = temporaryDemoCasinos.map((casino) => casino.slug);
export const temporaryDemoOwnedIds = new Set([
  ...temporaryDemoCasinos.flatMap((casino) => [casino.id, ...casino.draft.licenses.map((item) => item.id), ...casino.draft.countries.map((item) => item.id), ...casino.draft.paymentMethods.map((item) => item.id), ...casino.draft.gameProviders.map((item) => item.id), ...casino.draft.gameCategories.map((item) => item.id), ...casino.draft.casinoBonuses.map((item) => item.id), ...casino.images.map((item) => item.id)]),
  temporaryDemoAffiliateNetwork.networkId,
  ...temporaryDemoAffiliates.flatMap((item) => [item.programId, item.offerId, item.trackingLinkId, item.redirectId, item.offerRevisionId, item.trackingRevisionId, item.redirectRevisionId]),
]);

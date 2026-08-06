import type { CasinoCoreDraft } from "@/lib/casino-builder/types";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";

export const TEMPORARY_DEMO_DATASET_ID = "temporary-production-demo-casinos-v1";
export const TEMPORARY_DEMO_ACTOR_LABEL = "Founder Office approved synthetic dataset";
export const PRODUCTION_SITE_ORIGIN = "https://sevenbet-next.vercel.app";

function id(casino: number, slot: number) {
  return `0000000${casino}-0000-4000-8000-${String(slot).padStart(12, "0")}`;
}

function payment(casino: number, slot: number, methodKey: string, name: string, type: string, currencies: string[], crypto = false) {
  return {
    id: id(casino, slot), methodKey, name, supportsDeposits: true, supportsWithdrawals: true,
    currencies, minimumDeposit: "10.00", minimumWithdrawal: "20.00", maximumWithdrawal: "2500.00",
    maximumDeposit: "5000.00", depositProcessingTime: "Illustrative instant state", withdrawalTime: "Illustrative 1–3 days",
    fees: "Synthetic display data — not operator terms", depositFee: null, withdrawalFee: null, type,
    countries: [], verified: false, notes: "Synthetic payment presentation only", archived: false, crypto, sortOrder: slot,
  };
}

function bonus(casino: number, slug: string, type: string, percentage: string | null, freeSpins: number | null, maximumBonus: string) {
  return {
    id: id(casino, 60), slug: `${slug}-demo-presentation`, internalName: `${slug} synthetic presentation`,
    title: "Demo welcome presentation — not a live offer",
    summary: "Illustrative bonus layout for a fictional casino. This is not an operator promotion and cannot be claimed.",
    shortTerms: "Synthetic presentation only. No real account, deposit, eligibility or redemption exists.",
    amount: maximumBonus, type, percentage, minimumDeposit: "10.00", maximumBonus, currency: "EUR", freeSpins,
    wageringMultiplier: "30.00", wageringBase: "BONUS", minimumOdds: null, maximumBet: "5.00",
    wageringText: "Synthetic presentation only. No real wagering terms apply.",
    eligibility: "Demonstration content only; nobody is eligible to claim it.", eligibleGames: ["Demo slots"], excludedGames: [],
    eligiblePaymentMethods: [], excludedPaymentMethods: [], newPlayersOnly: true, existingPlayersAllowed: false,
    promoCode: null, importantConditions: ["Not a live offer", "Fictional operator", "No deposit or claim is possible"],
    termsUrl: null, startsAt: null, expiresAt: null, evergreen: true, featured: true, exclusive: false,
    notes: "Founder Office approved synthetic production presentation", geoMode: "GLOBAL" as const,
    allowedCountries: [], blockedCountries: [], status: "DRAFT" as const, offerStatus: "ACTIVE", sortOrder: 100,
  };
}

type DemoStyle = { accent: string; dark: string; score: number; trust: number };

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

const definitions = [
  { n: 1, slug: "demo-northstar", title: "Demo Northstar Casino", accent: "#d8ff3e", dark: "#17211b", score: 9.1, trust: 8.8, country: "GB", currency: "GBP", payments: [["visa", "Visa", "CARD"], ["mastercard", "Mastercard", "CARD"], ["paypal", "PayPal", "E_WALLET"]], bonus: ["WELCOME", "100.00", 50, "500.00"], featured: true, publicExperience: "FULL_PROFILE" },
  { n: 2, slug: "demo-harbour", title: "Demo Harbour Casino", accent: "#78d7ff", dark: "#102332", score: 8.6, trust: 8.3, country: "IE", currency: "EUR", payments: [["visa", "Visa", "CARD"], ["bank-transfer", "Bank transfer", "BANK_TRANSFER"]], bonus: ["FREE_SPINS", null, 80, "250.00"], featured: true, publicExperience: "FULL_PROFILE" },
  { n: 3, slug: "demo-atlas", title: "Demo Atlas Casino", accent: "#ffb15a", dark: "#2c1c15", score: 8.2, trust: 7.9, country: "CA", currency: "CAD", payments: [["mastercard", "Mastercard", "CARD"], ["interac", "Interac", "BANK_TRANSFER"]], bonus: ["CASHBACK", "10.00", null, "300.00"], featured: false, publicExperience: "FULL_PROFILE" },
  { n: 4, slug: "demo-meadow", title: "Demo Meadow Casino", accent: "#a9e5b2", dark: "#183022", score: 7.6, trust: 7.2, country: "NZ", currency: "NZD", payments: [["visa", "Visa", "CARD"]], bonus: null, featured: false, publicExperience: "FULL_PROFILE" },
  { n: 5, slug: "demo-lantern", title: "Demo Lantern Casino", accent: "#ff8e9d", dark: "#311a22", score: 8.8, trust: 8.5, country: "AU", currency: "AUD", payments: [["visa", "Visa", "CARD"], ["apple-pay", "Apple Pay", "E_WALLET"], ["demo-coin", "Demo Coin", "CRYPTO"]], bonus: ["RELOAD", "50.00", 25, "400.00"], featured: true, publicExperience: "STRUCTURED_EDITORIAL" },
] as const;

export const temporaryDemoCasinos: TemporaryDemoCasino[] = definitions.map((definition) => {
  const websiteUrl = `https://${definition.slug}.example`;
  const asset = (suffix: string) => `/demo-casinos/${definition.slug}-${suffix}.svg`;
  const paymentMethods = definition.payments.map(([key, name, type], index) => payment(definition.n, 20 + index, key, name, type, [definition.currency], type === "CRYPTO"));
  const casinoBonuses = definition.bonus
    ? [bonus(definition.n, definition.slug, definition.bonus[0], definition.bonus[1], definition.bonus[2], definition.bonus[3])]
    : [];
  const summary = `${definition.title} is a fictional SevenBet product demonstration. It is not a real operator and its commercial details are synthetic.`;
  const pros = ["Clear fictional demo disclosure", "Complete responsive profile presentation", "Illustrative payment and game information"];
  const cons = ["Not a real casino operator", "No live registration, deposit or bonus", "Licence and availability blocks are synthetic UI examples"];
  const draft: CasinoCoreDraft = {
    slug: definition.slug,
    internalName: `${definition.title} — synthetic production demo`,
    title: definition.title,
    domain: `${definition.slug}.example`,
    websiteUrl: null,
    operator: "Fictional SevenBet Demo Studio",
    tagline: "Fictional profile for product demonstration only",
    summary,
    description: `${summary} The review, score, countries, payments, games, licence block and bonus presentation exist only to demonstrate SevenBet's product experience to potential partners. No statement describes an existing gambling business.`,
    foundedYear: 2026,
    language: "en",
    languages: ["en"],
    currencies: [definition.currency],
    editorScore: definition.score,
    generalMetadata: {
      trustScore: definition.trust, userExperienceScore: definition.score - 0.2, paymentsScore: definition.score - 0.4,
      gamesScore: definition.score - 0.1, supportScore: definition.score - 0.6, responsibleGamblingScore: definition.score - 0.3,
      featured: definition.featured, recommended: false,
      internalNotes: "Synthetic production demonstration approved by Founder Office on 2026-08-06.",
    },
    licenses: [{
      id: id(definition.n, 10), authority: "Demo Regulatory Sandbox — not a real regulator", licenseNumber: null,
      jurisdiction: "Synthetic product demonstration only", status: "ACTIVE", verificationUrl: null, issuedAt: null, expiresAt: null,
      lastVerifiedAt: null, notes: "Fictional UI fixture. No licence has been issued and no regulatory claim is made.",
      verified: false, archived: false,
    }],
    countries: [{
      id: id(definition.n, 11), countryCode: definition.country, availability: "AVAILABLE", minimumAge: null,
      notes: "Synthetic display coverage only; this is not a market availability decision.", currency: definition.currency,
      language: "en", priority: 100, archived: false,
    }],
    paymentMethods,
    gameProviders: [
      { id: id(definition.n, 30), providerKey: "demo-orbit-studios", name: "Demo Orbit Studios", websiteUrl: null, gameCount: 420 + definition.n * 15, liveCasino: false, featured: true, verified: false, archived: false, verifiedAt: null, sortOrder: 100 },
      { id: id(definition.n, 31), providerKey: "demo-table-lab", name: "Demo Table Lab", websiteUrl: null, gameCount: 65 + definition.n * 4, liveCasino: true, featured: false, verified: false, archived: false, verifiedAt: null, sortOrder: 200 },
    ],
    gameCategories: [
      { id: id(definition.n, 40), categoryKey: "demo-slots", name: "Demo Slots", gameCount: 320 + definition.n * 12, featured: true, icon: null, archived: false, sortOrder: 100 },
      { id: id(definition.n, 41), categoryKey: "demo-live-tables", name: "Demo Live Tables", gameCount: 48 + definition.n * 3, featured: true, icon: null, archived: false, sortOrder: 200 },
    ],
    casinoBonuses,
    seo: {
      id: id(definition.n, 70), title: `${definition.title} — Fictional SevenBet Demo`,
      description: `Synthetic ${definition.title} profile for demonstrating SevenBet catalogue and editorial presentation. Not a real operator or offer.`,
      canonicalUrl: `${PRODUCTION_SITE_ORIGIN}/casino/${definition.slug}`, robots: "index,follow",
      socialTitle: `${definition.title} — Demo Profile`, socialDescription: summary, socialImage: `${PRODUCTION_SITE_ORIGIN}${asset("hero")}`,
      structuredData: "", robotsIndex: false, robotsFollow: true,
    },
  };
  const editorial: CasinoEditorialDocument = {
    version: 1,
    title: `${definition.title}: synthetic editorial demonstration`,
    summary,
    author: "SevenBet Demo Editorial Team",
    factCheckedAt: "2026-08-06T00:00:00.000Z",
    trustScore: { overall: definition.trust, confidence: "low", evidence: ["Founder Office approved synthetic dataset manifest"], categories: [
      { key: "disclosure", score: 10, comment: "The profile is explicitly fictional." },
      { key: "operator-evidence", score: 0, comment: "No real operator evidence exists or is claimed." },
    ] },
    sections: [
      { id: `${definition.slug}-overview`, kind: "overview", title: "What this profile demonstrates", order: 0, blocks: [
        { id: `${definition.slug}-overview-copy`, type: "paragraph", text: `${summary} This page demonstrates catalogue, review and responsive presentation states.` },
        { id: `${definition.slug}-warning`, type: "warning", title: "Demo data", text: "Do not treat this profile, score, licence block, country or bonus as operator evidence." },
      ] },
      { id: `${definition.slug}-pros`, kind: "pros", title: "Presentation strengths", order: 1, blocks: [{ id: `${definition.slug}-pros-list`, type: "pros", items: pros }] },
      { id: `${definition.slug}-cons`, kind: "cons", title: "Material limitations", order: 2, blocks: [{ id: `${definition.slug}-cons-list`, type: "cons", items: cons }] },
      { id: `${definition.slug}-licensing`, kind: "licensing", title: "Licence disclosure", order: 3, blocks: [{ id: `${definition.slug}-licence-copy`, type: "paragraph", text: "Demo Regulatory Sandbox is fictional. No licence number, regulator verification or real operator claim exists." }] },
      { id: `${definition.slug}-faq`, kind: "faq", title: "Demo FAQ", order: 4, blocks: [{ id: `${definition.slug}-faq-item`, type: "faq", question: "Can I register or claim this demo offer?", answer: "No. This is a fictional SevenBet product demonstration with no real operator account, deposit or promotion." }] },
    ],
    relatedCasinoIds: [],
    seo: { title: `${definition.title} synthetic review`, description: summary, canonicalPath: `/casino/${definition.slug}`, robots: "noindex,follow", keywords: ["SevenBet demo", "fictional casino profile"] },
  };
  return {
    id: id(definition.n, 1), slug: definition.slug, domain: `${definition.slug}.example`, title: definition.title,
    style: { accent: definition.accent, dark: definition.dark, score: definition.score, trust: definition.trust },
    draft, pros, cons,
    responsibleGamblingTools: ["Synthetic self-exclusion presentation", "Synthetic deposit-limit presentation", "Protected SevenBet Help remains available"],
    images: [
      { id: id(definition.n, 80), kind: "LOGO", url: asset("logo"), alt: `${definition.title} fictional demo logo`, width: 560, height: 240, sortOrder: 100, isPrimary: true },
      { id: id(definition.n, 81), kind: "HERO", url: asset("hero"), alt: `${definition.title} synthetic editorial hero artwork`, width: 1600, height: 900, sortOrder: 100, isPrimary: true },
      { id: id(definition.n, 82), kind: "SCREENSHOT", url: asset("screen"), alt: `${definition.title} fictional mobile product presentation`, width: 900, height: 1200, sortOrder: 100, isPrimary: false },
    ],
    editorial,
    publicExperience: definition.publicExperience,
  };
});

export const temporaryDemoAffiliate = {
  networkId: id(9, 1),
  programId: id(9, 2),
  offerId: id(9, 3),
  trackingLinkId: id(9, 4),
  redirectId: id(9, 5),
  offerRevisionId: id(9, 6),
  trackingRevisionId: id(9, 7),
  redirectRevisionId: id(9, 8),
  networkSlug: "demo-sevenbet-internal-network",
  redirectSlug: "demo-northstar",
  casinoId: id(1, 1),
  internalDestination: `${PRODUCTION_SITE_ORIGIN}/casino/demo-northstar`,
} as const;

export const temporaryDemoCasinoIds = temporaryDemoCasinos.map((casino) => casino.id);
export const temporaryDemoCasinoSlugs = temporaryDemoCasinos.map((casino) => casino.slug);
export const temporaryDemoOwnedIds = new Set([
  ...temporaryDemoCasinos.flatMap((casino) => [casino.id, ...casino.draft.licenses.map((item) => item.id), ...casino.draft.countries.map((item) => item.id), ...casino.draft.paymentMethods.map((item) => item.id), ...casino.draft.gameProviders.map((item) => item.id), ...casino.draft.gameCategories.map((item) => item.id), ...casino.draft.casinoBonuses.map((item) => item.id), ...casino.images.map((item) => item.id)]),
  ...Object.entries(temporaryDemoAffiliate).flatMap(([key, value]) => key.endsWith("Id") && key !== "casinoId" ? [value] : []),
]);

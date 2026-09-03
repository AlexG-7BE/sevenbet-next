import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";

export const CASINO_REAL_CATALOG_RELEASE = "CASINO-REAL-CATALOG-02";
export const CASINO_REAL_CATALOG_OBSERVED_AT = "2026-09-03T00:00:00.000Z";

export interface CasinoCatalogBrandMark {
  path: string;
  sourceDomain: string;
  retrievalUrl: string;
  width: number;
  height: number;
  mimeType: "image/png" | "image/jpeg";
  checksum: string;
}

export interface CasinoCatalogPreviewOffer {
  label: string;
  scope: string;
  amount: string;
  minimumDeposit: string | null;
  wagering: string | null;
  bonusExpiry: string | null;
  freeSpinExpiry: string | null;
  maximumBet: string | null;
  evidenceStatus: "DETECTED" | "INFERRED" | "UNKNOWN";
  availabilityNote: string;
}

export interface CasinoCatalogDefinition {
  slug: "betsson" | "skol-casino" | "hello-casino" | "gday-casino" | "diamond7" | "dragonbet" | "21-prive" | "slotnite";
  title: string;
  score: number;
  foundedYear: number | null;
  summary: string;
  description: string;
  bestFor: string[];
  whyWeLikeIt: string[];
  thingsToKnow: string[];
  facts: Array<{ label: string; value: string; classification: "DETECTED" | "INFERRED" | "UNKNOWN" | "CONTRADICTION" }>;
  responsibleGamblingTools: string[];
  scoreCategories: Array<{ key: string; score: number; comment: string }>;
  brandMark: CasinoCatalogBrandMark;
  previewOffers: CasinoCatalogPreviewOffer[];
  previewCreative: null | {
    path: string;
    source: string;
    width: number;
    height: number;
    checksum: string;
    usage: "PARTNER_PREVIEW_ONLY";
  };
}

const noRoute = "Published offer information is independent of the governed CTA. A real route may be available outside the explicitly detected blocked GEOs.";

export const casinoRealCatalog = [
  {
    slug: "betsson",
    title: "Betsson",
    score: 8.8,
    foundedYear: 1963,
    summary: "A mature, broad casino product with unusually strong local evidence in Peru and Sweden, balanced against a serious Swedish anti-money-laundering enforcement record and incomplete current offer mechanics.",
    description: "Betsson leads this release on product breadth, local payment coverage and evidence depth. The review does not treat licence status as a clean bill of health: Sweden's regulator warned Betsson Nordic Ltd and imposed a SEK 6.5 million sanction for serious anti-money-laundering and customer-due-diligence failings. The appeal was dismissed on 2 July 2026. Peru and Sweden have useful exact-market profiles; the CTA may use only real destinations already captured for the relevant market.",
    bestFor: ["Players comparing a deep slots, table and live-casino catalogue", "Readers who value exact Peru or Sweden payment and licence evidence", "Mobile users who want established iOS and Android support"],
    whyWeLikeIt: ["Exact local regulator records are available for Peru and Sweden", "The published product evidence covers payments, game types, apps and control tools", "Material enforcement history is disclosed instead of being softened by the score"],
    thingsToKnow: ["Swedish AML warning and SEK 6.5m sanction; appeal dismissed 2 July 2026", "Peru and Sweden welcome-offer headlines have unresolved material mechanics", "Only existing captured Betsson routes may activate; no generic global destination is inferred"],
    facts: [
      { label: "Peru operator", value: "SFTG Limited; MINCETUR records 11002586010000 and 21002586010000", classification: "DETECTED" },
      { label: "Sweden operator", value: "Betsson Nordic Ltd; Spelinspektionen licence 23Si2176", classification: "DETECTED" },
      { label: "Casino catalogue", value: "3,000+ games stated for Sweden; slots, jackpots, live and table games", classification: "DETECTED" },
      { label: "Commercial route scope", value: "Only existing captured relevant-market routes; no generic global route", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Self-exclusion", "Reality checks", "Session limits", "Spelpaus (Sweden)"],
    scoreCategories: [
      { key: "evidence-depth", score: 9.3, comment: "Two detailed exact-market profiles and regulator evidence." },
      { key: "product-breadth", score: 9.4, comment: "Broad casino catalogue and mature mobile product." },
      { key: "payments", score: 9.0, comment: "Useful local payment and withdrawal evidence." },
      { key: "terms-clarity", score: 8.1, comment: "Current headline offers still have material unknowns." },
      { key: "regulatory-record", score: 7.3, comment: "Serious Swedish AML enforcement materially constrains the score." },
    ],
    brandMark: { path: "/casino-brands/betsson/logo.png", sourceDomain: "betsson.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=betsson.com&sz=256", width: 180, height: 180, mimeType: "image/png", checksum: "0c83930c9cfa42a46ce836aed8af46dd754275f7279f0c60730901e92a770c4b" },
    previewOffers: [
      { label: "Peru observed welcome headline", scope: "PE", amount: "300 free spins + app gift", minimumDeposit: null, wagering: null, bonusExpiry: null, freeSpinExpiry: null, maximumBet: null, evidenceStatus: "DETECTED", availabilityNote: "Headline detected; material mechanics remain unknown. Preview only." },
      { label: "Sweden observed welcome headline", scope: "SE", amount: "100% up to SEK 1,000 + 50 free spins", minimumDeposit: null, wagering: null, bonusExpiry: null, freeSpinExpiry: null, maximumBet: null, evidenceStatus: "DETECTED", availabilityNote: "Headline detected; minimum deposit, wagering and expiry remain unknown. Preview only." },
      { label: "LATAM generic partner scope", scope: "BO / EC / PY / UY", amount: "Generic welcome-offer evidence", minimumDeposit: null, wagering: null, bonusExpiry: null, freeSpinExpiry: null, maximumBet: null, evidenceStatus: "DETECTED", availabilityNote: "Country scope does not itself establish a public route or complete offer terms." },
    ],
    previewCreative: null,
  },
  {
    slug: "skol-casino",
    title: "Skol Casino",
    score: 8.4,
    foundedYear: 2021,
    summary: "A well-presented White Hat Gaming casino with a broad, mobile-ready catalogue, populated payment evidence and a current €300 plus 100-spin offer.",
    description: "Skol Casino combines UK Gambling Commission and MGA licence evidence with an observed 2,500+ game catalogue, provider coverage, payment and withdrawal-method evidence, and a current partner offer. Global evidence remains useful when an exact local profile is absent; local facts and the governed CTA are qualified separately.",
    bestFor: ["Players who prefer a broad modern slot catalogue", "Mobile-browser play", "Readers comparing a lower minimum-deposit partner offer"],
    whyWeLikeIt: ["Active exact-domain regulator evidence", "Current partner offer has amount and minimum deposit captured", "Operator-level responsible-gambling framework is documented"],
    thingsToKnow: ["Exact local payment availability can differ from the global observed set", "Withdrawal timing is reported evidence, not a payout guarantee", "MGA and EUR labels do not grant country targeting permission"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Regulator evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Commercial scope", value: "Governed CTA available by default with a real route except in detected blocked GEOs", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    scoreCategories: [
      { key: "evidence-depth", score: 8.2, comment: "Strong identity and licence evidence; partial product facts." },
      { key: "product-breadth", score: 8.8, comment: "Broad platform-backed casino catalogue." },
      { key: "payments", score: 7.8, comment: "Exact payment details are not yet complete." },
      { key: "terms-clarity", score: 8.7, comment: "The current partner offer captures key headline mechanics." },
      { key: "regulatory-record", score: 8.5, comment: "Active operator and exact-domain records." },
    ],
    brandMark: { path: "/casino-brands/skol-casino/logo.png", sourceDomain: "skolcasino.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=skolcasino.com&sz=256", width: 48, height: 48, mimeType: "image/png", checksum: "ca5f337b5b02ebdef1a7a46cba902c430a53c2f7b42eb3cea7d476fee7b08d63" },
    previewOffers: [{ label: "Current partner welcome offer", scope: "MGA / ROW evidence", amount: "100% up to €300 + 100 free spins", minimumDeposit: "€10", wagering: "35× bonus + deposit (operator-level evidence)", bonusExpiry: "30 days (operator-level evidence)", freeSpinExpiry: "10 days (operator-level evidence)", maximumBet: "€5 (operator-level evidence)", evidenceStatus: "DETECTED", availabilityNote: noRoute }],
    previewCreative: null,
  },
  {
    slug: "hello-casino",
    title: "Hello Casino",
    score: 8.3,
    foundedYear: 2014,
    summary: "A long-running White Hat Gaming brand with broad global product evidence and the current €300 plus 100-spin MGA offer, presented without stale promotional artwork.",
    description: "Hello Casino has UK Gambling Commission and MGA licence evidence, a broad provider and payment set, detailed control tools, and the current August MGA offer. Stale prior-offer material is excluded. Withdrawal guidance reports a 48–96 hour pending range before method processing; this remains a signal, not a guarantee.",
    bestFor: ["Players comparing established White Hat Gaming brands", "Readers who want the newer offer mechanics stated clearly", "Mobile-browser casino use"],
    whyWeLikeIt: ["Active exact-domain regulator evidence", "Newer offer amount, wagering base, expiry and maximum bet are recorded", "Stale creative is explicitly excluded instead of silently reused"],
    thingsToKnow: ["Stale offer artwork is not paired with the current offer", "Third-party evidence reports a 48–96 hour pending range before method processing", "Exact local facts and CTA restrictions remain separate from global content"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Withdrawal guidance", value: "Third-party evidence reports a 48–96 hour pending range before method processing", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limit", "Wager limit", "Loss limit", "Session limit", "Self-exclusion", "Time-out", "Reality check", "Self-assessment", "GAMSTOP"],
    scoreCategories: [
      { key: "evidence-depth", score: 8.4, comment: "Strong identity, licence and support evidence." },
      { key: "product-breadth", score: 8.5, comment: "Established platform-backed casino catalogue." },
      { key: "payments", score: 8.0, comment: "Useful withdrawal guidance, incomplete exact payment inventory." },
      { key: "terms-clarity", score: 8.8, comment: "Newer offer mechanics are materially complete." },
      { key: "regulatory-record", score: 8.3, comment: "Active exact-domain/operator records." },
    ],
    brandMark: { path: "/casino-brands/hello-casino/logo.png", sourceDomain: "hellocasino.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=hellocasino.com&sz=256", width: 16, height: 16, mimeType: "image/png", checksum: "41d108713281967e0a270972832d56b16240ef0f8d29254afcc3d9020b58878b" },
    previewOffers: [{ label: "7 August current partner offer", scope: "MGA / ROW evidence", amount: "100% up to €300 + 100 free spins", minimumDeposit: "€20", wagering: "35× bonus + deposit", bonusExpiry: "30 days", freeSpinExpiry: "10 days", maximumBet: "€5", evidenceStatus: "DETECTED", availabilityNote: `${noRoute} Older Hello offer creative must not be displayed with this offer.` }],
    previewCreative: null,
  },
  {
    slug: "gday-casino",
    title: "G'day Casino",
    score: 8.1,
    foundedYear: 2013,
    summary: "A distinctive White Hat Gaming casino with broad payment and provider evidence plus a current €100 and 25-spin partner offer.",
    description: "G'day Casino is tied to White Hat Gaming Limited through regulator evidence and current catalog research. Its global profile covers observed languages, currencies, deposits, withdrawals, processing ranges, providers and game categories. Exact local facts and the governed CTA remain separate.",
    bestFor: ["Players looking for a distinctive themed casino brand", "Mobile-browser play", "Readers comparing a simple €100 match headline"],
    whyWeLikeIt: ["Exact-domain and operator evidence align", "Current partner offer amount and minimum deposit are captured", "Responsible-gambling support is visible at operator level"],
    thingsToKnow: ["Exact local payment availability can differ from the global observed set", "The partner offer is not a country-approval claim", "Reported processing windows are not payout guarantees"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Commercial scope", value: "CTA is governed separately and blocked only by detected restrictions or a missing real route", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    scoreCategories: [
      { key: "evidence-depth", score: 8.1, comment: "Good identity evidence; thinner product evidence." },
      { key: "product-breadth", score: 8.4, comment: "Platform-backed casino catalogue." },
      { key: "payments", score: 7.6, comment: "Exact payment and withdrawal details remain partial." },
      { key: "terms-clarity", score: 8.5, comment: "Partner headline and minimum deposit are captured." },
      { key: "regulatory-record", score: 8.3, comment: "Active operator and exact-domain records." },
    ],
    brandMark: { path: "/casino-brands/gday-casino/logo.png", sourceDomain: "gdaycasino.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=gdaycasino.com&sz=256", width: 72, height: 72, mimeType: "image/png", checksum: "b6983467b8f9273814eaee8640d935f1a0c6cc57fc39249aefc16b359060b5ad" },
    previewOffers: [{ label: "Current partner welcome offer", scope: "MGA / ROW evidence", amount: "100% up to €100 + 25 free spins", minimumDeposit: "€20", wagering: "35× bonus + deposit (operator-level evidence)", bonusExpiry: "30 days (operator-level evidence)", freeSpinExpiry: "10 days (operator-level evidence)", maximumBet: "€5 (operator-level evidence)", evidenceStatus: "DETECTED", availabilityNote: noRoute }],
    previewCreative: null,
  },
  {
    slug: "diamond7",
    title: "Diamond7",
    score: 7.9,
    foundedYear: 2015,
    summary: "A recognizable White Hat Gaming casino with current regulator evidence, a populated global product profile and an authenticated €100 plus 25-spin partner offer.",
    description: "Diamond7 has UK Gambling Commission and MGA evidence plus a populated observed catalog of languages, currencies, payment methods, withdrawal timings, providers and game categories. Current partner media and the real governed route are published independently of exact-local fact coverage.",
    bestFor: ["Players who prefer a familiar slots-led casino format", "Mobile-browser play", "Partners reviewing real authenticated creative treatment"],
    whyWeLikeIt: ["Exact-domain regulator evidence is current", "Authenticated partner assets have checksums and controlled storage", "The click-id issue is recorded as resolved without turning it into public eligibility"],
    thingsToKnow: ["Creative labels do not establish country approval", "Exact local payment availability can differ from global observations", "Reported withdrawal timings and limits are not guarantees"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Partner creative", value: "Authenticated generic Diamond7 creative stored with checksum", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    scoreCategories: [
      { key: "evidence-depth", score: 8.0, comment: "Strong identity and creative provenance; partial market facts." },
      { key: "product-breadth", score: 8.2, comment: "Recognizable platform-backed casino catalogue." },
      { key: "payments", score: 7.3, comment: "Exact payment and withdrawal detail is incomplete." },
      { key: "terms-clarity", score: 8.1, comment: "Current partner headline is captured; GEO scope is unresolved." },
      { key: "regulatory-record", score: 8.2, comment: "Active operator and exact-domain records." },
    ],
    brandMark: { path: "/casino-brands/diamond7/logo.jpg", sourceDomain: "diamond7casino.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=diamond7casino.com&sz=256", width: 72, height: 72, mimeType: "image/jpeg", checksum: "680f205993255dfb09b655895f1eb8d04c3b20a741b8a509bbba2467c758b975" },
    previewOffers: [{ label: "Current partner welcome offer", scope: "MGA / ROW evidence", amount: "100% up to €100 + 25 free spins", minimumDeposit: "€20", wagering: "35× bonus + deposit (operator-level evidence)", bonusExpiry: "30 days (operator-level evidence)", freeSpinExpiry: "10 days (operator-level evidence)", maximumBet: "€5 (operator-level evidence)", evidenceStatus: "DETECTED", availabilityNote: noRoute }],
    previewCreative: { path: "/partner-preview/diamond7-generic.jpg", source: "Authenticated Superfly Partners asset ‘Diamond7 Join’", width: 250, height: 250, checksum: "ed7231256fab2a7a50171f817c41d0f47f7e496fd20f3a07818d7af5349540bc", usage: "PARTNER_PREVIEW_ONLY" },
  },
  {
    slug: "dragonbet",
    title: "DragonBet",
    score: 7.7,
    foundedYear: 2014,
    summary: "A real UK-focused casino with useful exact game-category and provider evidence, but sparse payment, withdrawal and current offer coverage compared with the rest of the release.",
    description: "DragonBet is operated by DragonBet Ltd and has an active exact-domain Gambling Commission record. The governed profile contains a useful catalogue of slots, live casino, tables, jackpots and virtual sports, including named provider evidence. Payment facts and a current partner offer remain absent, so the profile stays editorial only.",
    bestFor: ["UK readers comparing a sports-and-casino operator", "Players interested in slots, live casino and virtual sports", "Readers who prefer a profile without an offer-led pitch"],
    whyWeLikeIt: ["Exact operator and Gambling Commission evidence", "More concrete game-category detail than most records in this release", "No offer or route is invented to fill the commercial gap"],
    thingsToKnow: ["No current publication-safe partner offer is recorded", "Payment and withdrawal information is incomplete", "No publication-safe hero creative is available"],
    facts: [
      { label: "Operator", value: "DragonBet Ltd", classification: "DETECTED" },
      { label: "Licence evidence", value: "Gambling Commission 064908-R-339041-003", classification: "DETECTED" },
      { label: "Games", value: "Casino, live casino, slots, roulette, blackjack, baccarat, jackpots and virtual sports", classification: "DETECTED" },
      { label: "Named providers", value: "Inspired, Hacksaw Gaming and Trigger Studios", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "GAMSTOP"],
    scoreCategories: [
      { key: "evidence-depth", score: 7.8, comment: "Good identity and game evidence; sparse payments and terms." },
      { key: "product-breadth", score: 8.2, comment: "Useful category breadth including virtual sports." },
      { key: "payments", score: 6.8, comment: "Payment and withdrawal evidence is incomplete." },
      { key: "terms-clarity", score: 7.1, comment: "No current offer is claimed." },
      { key: "regulatory-record", score: 8.4, comment: "Active exact operator and domain record." },
    ],
    brandMark: { path: "/casino-brands/dragonbet/logo.png", sourceDomain: "celfcreative.com", retrievalUrl: "https://celfcreative.com/app/uploads/2023/12/dragon-bet-2.png", width: 933, height: 1027, mimeType: "image/png", checksum: "1f5527179970f1343be6b7eead3067429726dffe2ec631ea0b4fa9d0b5e98ccf" },
    previewOffers: [],
    previewCreative: null,
  },
  {
    slug: "21-prive",
    title: "21 Privé",
    score: 7.4,
    foundedYear: 2014,
    summary: "A licensed White Hat Gaming brand with a broad observed catalog and a high-value partner headline, marked down for a historical withdrawal-complaint signal that requires prominent context.",
    description: "21 Privé has UK Gambling Commission and MGA evidence, a broad observed provider and payment set, and the current €300 plus 200-spin partner offer. Historical withdrawal complaints are treated as a signal to investigate, not as proof that every withdrawal will be delayed or refused. Offer size does not influence the editorial score.",
    bestFor: ["Readers comparing a higher maximum-bonus headline", "Mobile-browser casino use", "Players who will scrutinize withdrawal terms before depositing"],
    whyWeLikeIt: ["Exact-domain and operator licence evidence", "The partner headline and minimum deposit are clearly recorded", "Complaint evidence is disclosed rather than hidden behind promotional language"],
    thingsToKnow: ["Historical withdrawal-complaint signal; verify current handling independently", "Exact local payment availability can differ from the global observed set", "The large headline does not affect the Editor Score or route eligibility"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Complaint context", value: "Historical withdrawal complaint signal; not a universal outcome claim", classification: "DETECTED" },
      { label: "Exact local payment availability", value: "Not separately verified for every current region", classification: "UNKNOWN" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    scoreCategories: [
      { key: "evidence-depth", score: 7.5, comment: "Strong identity evidence; partial product detail." },
      { key: "product-breadth", score: 7.9, comment: "Platform-backed casino catalogue." },
      { key: "payments", score: 6.8, comment: "Withdrawal evidence is not complete and complaints require caution." },
      { key: "terms-clarity", score: 8.0, comment: "Partner headline and minimum deposit are captured." },
      { key: "regulatory-record", score: 7.7, comment: "Active records, balanced against complaint signals." },
    ],
    brandMark: { path: "/casino-brands/21-prive/logo.png", sourceDomain: "21prive.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=21prive.com&sz=256", width: 64, height: 64, mimeType: "image/png", checksum: "9f546184e05e1d25c819e62d0acfe16363c3c5461b53bff1662377a194f9a1cd" },
    previewOffers: [{ label: "Current partner welcome offer", scope: "MGA / ROW evidence", amount: "100% up to €300 + 200 free spins", minimumDeposit: "€20", wagering: "35× bonus + deposit (operator-level evidence)", bonusExpiry: "30 days (operator-level evidence)", freeSpinExpiry: "10 days (operator-level evidence)", maximumBet: "€5 (operator-level evidence)", evidenceStatus: "DETECTED", availabilityNote: noRoute }],
    previewCreative: null,
  },
  {
    slug: "slotnite",
    title: "Slotnite",
    score: 7.2,
    foundedYear: 2019,
    summary: "A current White Hat Gaming casino with populated global product facts and a materially useful partner headline, ranked last because recent payout-delay complaints add unresolved risk.",
    description: "Slotnite has UK Gambling Commission and MGA evidence, a populated global catalog and the current €250 plus 100-spin offer. Recent payout-delay complaints are an editorial signal rather than proof of a general failure, but they materially lower confidence until current handling can be independently tested.",
    bestFor: ["Slot-focused players comparing a mid-sized welcome headline", "Mobile-browser use", "Readers prepared to verify withdrawal timing before depositing"],
    whyWeLikeIt: ["Exact-domain and operator licence evidence", "Current partner headline, deposit and operator-level term mechanics are recorded", "The score visibly reflects payout-risk evidence"],
    thingsToKnow: ["Recent payout-delay complaint signal; independently verify current handling", "Exact payment and withdrawal facts remain incomplete", "Regional offer variants must remain separate"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Complaint context", value: "Recent payout-delay complaint signal; not a universal outcome claim", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    scoreCategories: [
      { key: "evidence-depth", score: 7.2, comment: "Good identity evidence; thin exact product facts." },
      { key: "product-breadth", score: 7.8, comment: "Platform-backed slot catalogue." },
      { key: "payments", score: 6.2, comment: "Recent payout-delay complaints and incomplete exact evidence." },
      { key: "terms-clarity", score: 7.9, comment: "Partner offer mechanics are captured with scope caveats." },
      { key: "regulatory-record", score: 7.4, comment: "Active records, constrained by unresolved complaint signals." },
    ],
    brandMark: { path: "/casino-brands/slotnite/logo.png", sourceDomain: "slotnite.com", retrievalUrl: "https://www.google.com/s2/favicons?domain=slotnite.com&sz=256", width: 32, height: 32, mimeType: "image/png", checksum: "daddd2d8fd3cec5c45d2b389b6282062094d55fa2c67b0ae6d7abf8ff98d48e3" },
    previewOffers: [{ label: "Current partner welcome offer", scope: "MGA / ROW evidence", amount: "100% up to €250 + 100 free spins", minimumDeposit: "€10", wagering: "35× bonus + deposit (operator-level evidence)", bonusExpiry: "30 days (operator-level evidence)", freeSpinExpiry: "10 days (operator-level evidence)", maximumBet: "€5 (operator-level evidence)", evidenceStatus: "DETECTED", availabilityNote: `${noRoute} Regional variants remain separate and must not be blended into this card.` }],
    previewCreative: null,
  },
] satisfies readonly CasinoCatalogDefinition[];

export const casinoRealCatalogBySlug = new Map(casinoRealCatalog.map((casino) => [casino.slug, casino]));

function paragraph(id: string, text: string) {
  return { id, type: "paragraph" as const, text };
}

export function casinoCatalogEditorialDocument(casino: CasinoCatalogDefinition): CasinoEditorialDocument {
  return {
    version: 1,
    title: `${casino.title}: the B4GAMBLE review`,
    summary: casino.summary,
    author: "B4GAMBLE Editorial",
    factCheckedAt: CASINO_REAL_CATALOG_OBSERVED_AT,
    trustScore: {
      overall: casino.score,
      categories: casino.scoreCategories,
      confidence: casino.slug === "betsson" ? "high" : "medium",
      evidence: casino.whyWeLikeIt,
    },
    sections: [
      { id: "editorial-overview", kind: "overview", title: "Editorial view", order: 0, blocks: [paragraph("editorial-overview-copy", casino.description)] },
      { id: "best-for", kind: "pros", title: "Best for", order: 1, blocks: [{ id: "best-for-items", type: "bullet-list", items: casino.bestFor }] },
      { id: "things-to-know", kind: "cons", title: "Things to know", order: 2, blocks: [{ id: "things-to-know-items", type: "warning", title: "Keep these limits in view", text: casino.thingsToKnow.join(" ") }] },
      { id: "evidence-led-facts", kind: "key-facts", title: "Useful facts and evidence status", order: 3, blocks: casino.facts.map((fact, index) => ({ id: `fact-${index + 1}`, type: "information" as const, title: `${fact.label} · ${fact.classification}`, text: fact.value })) },
      { id: "commercial-separation", kind: "notes", title: "Editorial content, offer visibility and the CTA stay separate", order: 4, blocks: [paragraph("commercial-separation-copy", "The Editor Score is an editorial judgement and partner compensation never increases it. UNKNOWN is not a prohibition. Global casino content and researched offer information remain visible; a real governed route is available by default unless a detected legal, regulatory, contractual or account restriction applies.")] },
      { id: "safer-gambling", kind: "responsible-gambling", title: "Control tools and support", order: 5, blocks: [{ id: "safer-gambling-tools", type: "responsible-gambling", title: "Check tools before play", text: `${casino.responsibleGamblingTools.join(", ")}. Tool availability can vary by exact market and account. Protected Help remains independent and commercial-free.` }] },
      { id: "review-faq", kind: "faq", title: "Review questions", order: 6, blocks: [
        { id: "faq-score-route", type: "faq", question: `Does ${casino.title}'s ${casino.score.toFixed(1)} score mean a visit link is available?`, answer: "No. Editorial scoring and commercial route authority are separate. This review can remain public while the action is unavailable." },
        { id: "faq-market-scope", type: "faq", question: "Does a visible CTA prove formal approval in my country?", answer: "No. CTA availability means a real governed route exists and no detected block applies. It is not a claim of regulator or partner approval; exact local facts remain separately qualified." },
      ] },
    ],
    relatedCasinoIds: [],
    seo: {
      title: `${casino.title} Review & Editor Score | B4GAMBLE`,
      description: `${casino.title} review, ${casino.score.toFixed(1)} Editor Score, evidence limits and market-safe availability context.`,
      canonicalPath: `/casino/${casino.slug}`,
      robots: "index,follow",
      socialTitle: `${casino.title} Review | B4GAMBLE`,
      socialDescription: casino.summary,
      keywords: [casino.title, `${casino.title} review`, `${casino.title} Editor Score`],
    },
  };
}

export function assertCasinoRealCatalog() {
  if (casinoRealCatalog.length !== 8) throw new Error("The real casino catalog must contain exactly eight approved casinos.");
  const slugs = new Set<string>();
  let previous = Number.POSITIVE_INFINITY;
  for (const casino of casinoRealCatalog) {
    if (slugs.has(casino.slug)) throw new Error(`Duplicate casino slug: ${casino.slug}`);
    if (casino.score > previous) throw new Error("Casino catalog must remain ordered by independent Editor Score.");
    if (casino.bestFor.length < 3 || casino.whyWeLikeIt.length < 3 || casino.thingsToKnow.length < 3) throw new Error(`${casino.slug} is editorially incomplete.`);
    if (!casino.brandMark.path.startsWith("/casino-brands/")) throw new Error(`${casino.slug} has no controlled brand mark.`);
    slugs.add(casino.slug);
    previous = casino.score;
  }
}

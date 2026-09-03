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

const noRoute = "Partner Preview only. No exact-country commercial activation or public redirect is established by this evidence.";

export const casinoRealCatalog = [
  {
    slug: "betsson",
    title: "Betsson",
    score: 8.8,
    foundedYear: 1963,
    summary: "A mature, broad casino product with unusually strong local evidence in Peru and Sweden, balanced against a serious Swedish anti-money-laundering enforcement record and incomplete current offer mechanics.",
    description: "Betsson leads this release on product breadth, local payment coverage and evidence depth. The review does not treat licence status as a clean bill of health: Sweden's regulator warned Betsson Nordic Ltd and imposed a SEK 6.5 million sanction for serious anti-money-laundering and customer-due-diligence failings. The appeal was dismissed on 2 July 2026. Peru and Sweden have useful exact-market profiles, while commercial eligibility remains a separate decision.",
    bestFor: ["Players comparing a deep slots, table and live-casino catalogue", "Readers who value exact Peru or Sweden payment and licence evidence", "Mobile users who want established iOS and Android support"],
    whyWeLikeIt: ["Exact local regulator records are available for Peru and Sweden", "The published product evidence covers payments, game types, apps and control tools", "Material enforcement history is disclosed instead of being softened by the score"],
    thingsToKnow: ["Swedish AML warning and SEK 6.5m sanction; appeal dismissed 2 July 2026", "Peru and Sweden welcome-offer headlines have unresolved material mechanics", "No affiliate route is activated merely because partner evidence exists"],
    facts: [
      { label: "Peru operator", value: "SFTG Limited; MINCETUR records 11002586010000 and 21002586010000", classification: "DETECTED" },
      { label: "Sweden operator", value: "Betsson Nordic Ltd; Spelinspektionen licence 23Si2176", classification: "DETECTED" },
      { label: "Casino catalogue", value: "3,000+ games stated for Sweden; slots, jackpots, live and table games", classification: "DETECTED" },
      { label: "Current commercial permission", value: "No exact-country B4GAMBLE route approved by this release", classification: "UNKNOWN" },
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
    summary: "A well-presented White Hat Gaming casino with a broad platform-backed catalogue and a current partner offer, but only partial exact-market product evidence and no approved public commercial route.",
    description: "Skol Casino combines an active exact-domain UK Gambling Commission record with White Hat Gaming's MGA licence evidence. The product appears broad and mobile-ready, while exact payment, withdrawal and support details remain incomplete in the governed corpus. The partner offer is useful for a controlled preview, not proof of country availability.",
    bestFor: ["Players who prefer a broad modern slot catalogue", "Mobile-browser play", "Readers comparing a lower minimum-deposit partner offer"],
    whyWeLikeIt: ["Active exact-domain regulator evidence", "Current partner offer has amount and minimum deposit captured", "Operator-level responsible-gambling framework is documented"],
    thingsToKnow: ["Exact country availability outside the stored GB profile is unresolved", "Payment and withdrawal facts remain incomplete", "MGA and EUR labels do not grant country targeting permission"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Regulator evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Current public action", value: "None without exact-country activation", classification: "DETECTED" },
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
    summary: "A long-running White Hat Gaming brand with solid regulator evidence and a newer, well-specified partner offer; exact-country activation and current matching creative remain deliberately unresolved.",
    description: "Hello Casino has an active exact-domain UK Gambling Commission record and is included in White Hat Gaming's MGA licence evidence. Partner material observed on 7 August records a newer ROW offer. Older captured offer creative is not paired with it. Withdrawal guidance indicates a pending review period before payment-method processing, which users should factor into expectations.",
    bestFor: ["Players comparing established White Hat Gaming brands", "Readers who want the newer offer mechanics stated clearly", "Mobile-browser casino use"],
    whyWeLikeIt: ["Active exact-domain regulator evidence", "Newer offer amount, wagering base, expiry and maximum bet are recorded", "Stale creative is explicitly excluded instead of silently reused"],
    thingsToKnow: ["No current offer-matching Hello creative is approved for publication", "Withdrawals may remain pending before method processing", "Exact-country commercial permission remains separate"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Withdrawal guidance", value: "MGA requests may remain pending 24–48 hours before method processing", classification: "DETECTED" },
    ],
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
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
    foundedYear: null,
    summary: "A distinctive White Hat Gaming casino with active operator and domain evidence plus a current partner offer, held back by incomplete exact-market payment and withdrawal facts.",
    description: "G'day Casino is tied to White Hat Gaming Limited through exact-domain UK regulator evidence and operator-managed support material. The captured partner offer is complete enough for a disabled Preview card. It does not resolve whether any specific visitor country may be targeted or referred.",
    bestFor: ["Players looking for a distinctive themed casino brand", "Mobile-browser play", "Readers comparing a simple €100 match headline"],
    whyWeLikeIt: ["Exact-domain and operator evidence align", "Current partner offer amount and minimum deposit are captured", "Responsible-gambling support is visible at operator level"],
    thingsToKnow: ["Exact market payment and withdrawal records are incomplete", "The partner offer is not a country-availability decision", "No Production CTA is enabled by this release"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Exact-country targeting", value: "Unresolved", classification: "UNKNOWN" },
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
    summary: "A recognizable White Hat Gaming casino with active domain evidence and an authenticated partner creative library, constrained by unresolved GEO scope and only partial exact-market product facts.",
    description: "Diamond7 has active exact-domain UK regulator evidence and White Hat Gaming operator records. The authenticated partner portal contains a generic current brand creative as well as offer-specific banners. Because creative geography is unresolved, only the generic brand creative is used in Partner Preview; Production uses the neutral brand mark and no action.",
    bestFor: ["Players who prefer a familiar slots-led casino format", "Mobile-browser play", "Partners reviewing real authenticated creative treatment"],
    whyWeLikeIt: ["Exact-domain regulator evidence is current", "Authenticated partner assets have checksums and controlled storage", "The click-id issue is recorded as resolved without turning it into public eligibility"],
    thingsToKnow: ["Creative labels do not establish country targeting permission", "Exact market payment and withdrawal facts are partial", "Offer-specific banners remain Preview-only unless their scope is verified"],
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
    foundedYear: null,
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
    foundedYear: null,
    summary: "A licensed White Hat Gaming brand with a high-value partner headline, marked down for partial market facts and a historical withdrawal-complaint signal that requires prominent context.",
    description: "21 Privé has active exact-domain UK regulator evidence and White Hat Gaming operator records. Its current partner offer is the largest headline in the Superfly set, but that does not improve the editorial score or activate a route. Historical withdrawal complaints are treated as a signal to investigate, not as proof that every withdrawal will be delayed or refused.",
    bestFor: ["Readers comparing a higher maximum-bonus headline", "Mobile-browser casino use", "Players who will scrutinize withdrawal terms before depositing"],
    whyWeLikeIt: ["Exact-domain and operator licence evidence", "The partner headline and minimum deposit are clearly recorded", "Complaint evidence is disclosed rather than hidden behind promotional language"],
    thingsToKnow: ["Historical withdrawal-complaint signal; verify current handling independently", "Exact payment and withdrawal facts remain partial", "The large headline does not affect the Editor Score or route eligibility"],
    facts: [
      { label: "Operator", value: "White Hat Gaming Limited (Malta C73232)", classification: "DETECTED" },
      { label: "Licence evidence", value: "UKGC account 52894 and MGA/B2C/370/2017", classification: "DETECTED" },
      { label: "Complaint context", value: "Historical withdrawal complaint signal; not a universal outcome claim", classification: "DETECTED" },
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
    foundedYear: null,
    summary: "A current White Hat Gaming casino with a materially complete partner headline, ranked last because exact product facts are thin and recent payout-delay complaints add unresolved risk.",
    description: "Slotnite has active exact-domain UK regulator evidence and is covered by White Hat Gaming operator records. The current partner offer is sufficiently detailed for the disabled Preview. Recent payout-delay complaints are an editorial signal rather than proof of a general failure, but they materially lower confidence until current handling can be independently tested.",
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
      { id: "commercial-separation", kind: "notes", title: "Editorial and commercial authority stay separate", order: 4, blocks: [paragraph("commercial-separation-copy", "The Editor Score is an editorial judgement. Partner compensation, account status, creative availability and offer size do not increase it and do not activate a public route. B4GAMBLE only presents an outbound action after exact-country legal, operator, offer, tracking and targeting evidence all pass independently.")] },
      { id: "safer-gambling", kind: "responsible-gambling", title: "Control tools and support", order: 5, blocks: [{ id: "safer-gambling-tools", type: "responsible-gambling", title: "Check tools before play", text: `${casino.responsibleGamblingTools.join(", ")}. Tool availability can vary by exact market and account. Protected Help remains independent and commercial-free.` }] },
      { id: "review-faq", kind: "faq", title: "Review questions", order: 6, blocks: [
        { id: "faq-score-route", type: "faq", question: `Does ${casino.title}'s ${casino.score.toFixed(1)} score mean a visit link is available?`, answer: "No. Editorial scoring and commercial route authority are separate. This review can remain public while the action is unavailable." },
        { id: "faq-market-scope", type: "faq", question: "Do operator or partner records prove availability in my country?", answer: "No. A licence, currency, creative label or partner account is not a substitute for exact-country availability and targeting evidence." },
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

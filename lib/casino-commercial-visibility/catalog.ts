import { CASINO_COMMERCIAL_VISIBILITY_AUTHORITY, SUPERFLY_DETECTED_BLOCKED_COUNTRIES } from "@/lib/affiliate-routing/partner-route-projection";

export const CASINO_COMMERCIAL_VISIBILITY_RELEASE = CASINO_COMMERCIAL_VISIBILITY_AUTHORITY;
export const CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT = "2026-09-03T10:48:03.928Z";

export type CommercialCatalogSlug = "diamond7" | "gday-casino" | "21-prive" | "skol-casino" | "slotnite" | "hello-casino";

export interface CommercialCatalogPayment {
  key: string;
  name: string;
  supportsDeposits: boolean;
  supportsWithdrawals: boolean;
  currencies: string[];
  withdrawalTime: string | null;
  maximumWithdrawal: number | null;
  notes: string;
}

export interface CommercialCatalogDefinition {
  slug: CommercialCatalogSlug;
  title: string;
  foundedYear: number;
  languages: string[];
  currencies: string[];
  supportsMobile: true;
  responsibleGamblingTools: string[];
  payments: CommercialCatalogPayment[];
  providers: Array<{ key: string; name: string; liveCasino: boolean | null }>;
  categories: Array<{ key: string; name: string; gameCount: number | null }>;
  bonus: {
    slug: string;
    title: string;
    summary: string;
    percentage: 100;
    maximumBonus: number;
    currency: "EUR";
    freeSpins: number;
    minimumDeposit: number;
    wageringMultiplier: number | null;
    wageringText: string;
    maximumBet: number | null;
    eligibility: string;
    importantConditions: string[];
  };
  evidence: { catalogId: string; offerId: string; routeId: string; canonicalUrlSha256: string };
  media: null | { path: string; mimeType: "image/jpeg" | "image/gif"; width: number; height: number; checksum: string; evidenceId: string; role: "CURRENT_OFFER_CREATIVE" | "GENERIC_PARTNER_CREATIVE" };
}

const wallets = /neteller|skrill|paypal|paysafecard|muchbetter/i;
const cards = /visa|mastercard|maestro|cards/i;

function paymentKey(name: string) {
  return name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
}

function paymentRows(input: {
  deposits: string[];
  withdrawals: string[];
  currencies: string[];
  pending: string;
  ewallet: string;
  card: string;
  bank: string;
  weeklyLimit?: number;
}): CommercialCatalogPayment[] {
  const depositSet = new Set(input.deposits.map((name) => name.toLowerCase()));
  const withdrawalSet = new Set(input.withdrawals.map((name) => name.toLowerCase()));
  const names = [...new Set([...input.deposits, ...input.withdrawals])].filter((name) => name.toLowerCase() !== "cards");
  let weeklyLimitAssigned = false;
  return names.map((name) => {
    const supportsWithdrawals = withdrawalSet.has(name.toLowerCase())
      || (name === "Visa" && withdrawalSet.has("cards"))
      || (name === "Mastercard" && withdrawalSet.has("cards"));
    const processing = wallets.test(name) ? input.ewallet : cards.test(name) ? input.card : input.bank;
    const maximumWithdrawal = supportsWithdrawals && input.weeklyLimit && !weeklyLimitAssigned ? input.weeklyLimit : null;
    if (maximumWithdrawal) weeklyLimitAssigned = true;
    return {
      key: paymentKey(name),
      name,
      supportsDeposits: depositSet.has(name.toLowerCase()),
      supportsWithdrawals,
      currencies: input.currencies,
      withdrawalTime: supportsWithdrawals ? `${input.pending}; ${processing}` : null,
      maximumWithdrawal,
      notes: maximumWithdrawal ? `Reported weekly withdrawal limit: EUR ${input.weeklyLimit!.toLocaleString("en-GB")}.` : "Global observed method; exact availability can vary by market and account.",
    };
  });
}

function providers(names: string[]) {
  return names.map((name) => ({ key: paymentKey(name), name, liveCasino: name === "Evolution" ? true : null }));
}

const generalEligibility = "New eligible players; exact local eligibility and current operator terms apply.";
const unknownWagering = "Wagering requirement not separately stated in the current offer evidence.";

export const superflyCommercialCatalog: readonly CommercialCatalogDefinition[] = [
  {
    slug: "diamond7", title: "Diamond7", foundedYear: 2015,
    languages: ["EN", "DE", "FI", "NO"], currencies: ["GBP", "CAD", "EUR", "USD", "NZD", "NOK"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    payments: paymentRows({
      deposits: ["Mastercard", "Neteller", "Paysafecard", "Skrill", "Sofort", "Visa", "EPS", "Klarna", "Rapid Transfer", "Bank Wire"],
      withdrawals: ["Bank Wire", "Neteller", "Skrill", "Rapid Transfer"], currencies: ["EUR"], weeklyLimit: 5000,
      pending: "Pending review 24–48 hours", ewallet: "e-wallet processing 24–72 hours", card: "card processing 3–5 days", bank: "bank processing 3–5 days",
    }),
    providers: providers(["NetEnt", "Evolution", "Play'n GO", "Red Tiger", "Quickspin", "Push", "Relax", "Hacksaw", "IGT", "Stakelogic"]),
    categories: [{ key: "slots", name: "Slots", gameCount: null }, { key: "live-casino", name: "Live casino", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }],
    bonus: { slug: "diamond7-row-welcome", title: "100% up to €100 + 25 free spins", summary: "Current researched ROW first-deposit offer.", percentage: 100, maximumBonus: 100, currency: "EUR", freeSpins: 25, minimumDeposit: 20, wageringMultiplier: null, wageringText: unknownWagering, maximumBet: null, eligibility: generalEligibility, importantConditions: ["Minimum deposit €20.", unknownWagering, "Offer visibility does not claim local regulatory or partner approval."] },
    evidence: { catalogId: "7381a728-f834-4a5c-946e-3c852972f9b4", offerId: "c02eaa93-1ba0-4272-a7c5-f9badcbe629b", routeId: "afee713e-0d73-4276-8fce-fe79bf6d7b30", canonicalUrlSha256: "df2aaa6d61ecb0e6f62de629313fa0e1940417ea30f835feadb8f4bbe75c085b" },
    media: { path: "/casino-brands/diamond7/partner-offer.jpg", mimeType: "image/jpeg", width: 300, height: 250, checksum: "fa02113bb6f4df0cfe9d626663a99f0df0d56499651149304d91570465b61e61", evidenceId: "8eb3e843-9aa4-4c62-8b8b-ed00ef570843", role: "CURRENT_OFFER_CREATIVE" },
  },
  {
    slug: "gday-casino", title: "G'day Casino", foundedYear: 2013,
    languages: ["EN", "FI", "DE", "NO"], currencies: ["AUD", "CAD", "EUR", "GBP", "NOK", "USD", "ZAR"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    payments: paymentRows({
      deposits: ["Mastercard", "Neteller", "Paysafecard", "Visa", "Sofort", "POLi", "Giropay", "Skrill", "dotpay", "TrustPay", "Local bank transfer"],
      withdrawals: ["Mastercard", "Neteller", "Paysafecard", "Visa", "POLi", "Skrill", "Bank Wire"], currencies: ["EUR"],
      pending: "Pending review 24–48 hours", ewallet: "e-wallet processing 0–24 hours", card: "card processing 2–5 days", bank: "bank processing 5–10 days",
    }),
    providers: providers(["Games Global", "NetEnt", "Evolution", "Betsoft", "NYX", "NextGen", "Aristocrat", "Quickspin", "Ezugi", "Thunderkick", "ELK"]),
    categories: [{ key: "slots", name: "Slots", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }, { key: "blackjack", name: "Blackjack", gameCount: null }, { key: "roulette", name: "Roulette", gameCount: null }, { key: "live-games", name: "Live games", gameCount: null }],
    bonus: { slug: "gday-casino-row-welcome", title: "100% up to €100 + 25 free spins", summary: "Current researched ROW first-deposit offer.", percentage: 100, maximumBonus: 100, currency: "EUR", freeSpins: 25, minimumDeposit: 20, wageringMultiplier: null, wageringText: unknownWagering, maximumBet: null, eligibility: generalEligibility, importantConditions: ["Minimum deposit €20.", unknownWagering, "Offer visibility does not claim local regulatory or partner approval."] },
    evidence: { catalogId: "70591321-fee8-4be9-a75c-276b50c60576", offerId: "2de7ac4d-e348-41a6-a12a-fa088e641f29", routeId: "0f5e6c60-8db9-46d3-a2e5-237ded899ca4", canonicalUrlSha256: "cfb4358a622cfc2ef3a8669112ea57e0fd94b78334708c9b2dbca3b375b4670e" },
    media: { path: "/casino-brands/gday-casino/partner-offer.jpg", mimeType: "image/jpeg", width: 300, height: 250, checksum: "9d47439a24e46ffb8b7a98822d4a7568e57da5b4b5b12d47ca3f460014888671", evidenceId: "85ba58d3-67fc-46d3-87c8-f6ab3cd95a06", role: "CURRENT_OFFER_CREATIVE" },
  },
  {
    slug: "21-prive", title: "21 Privé", foundedYear: 2014,
    languages: ["EN", "DE", "FI"], currencies: ["GBP", "CAD", "EUR", "NZD", "USD"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    payments: paymentRows({
      deposits: ["Mastercard", "Neteller", "Paysafecard", "Visa", "Sofort", "EPS", "Skrill", "Trustly", "Rapid Transfer", "PayPal", "Interac", "Bank Wire", "Klarna"],
      withdrawals: ["Visa", "Mastercard", "Trustly", "Skrill", "Neteller", "Bank Wire", "Rapid Transfer", "PayPal", "Paysafecard", "Maestro"], currencies: ["EUR"], weeklyLimit: 5000,
      pending: "Pending review 24–48 hours", ewallet: "e-wallet processing about 24 hours", card: "bank/card processing 3–5 days", bank: "bank/card processing 3–5 days",
    }),
    providers: providers(["Games Global", "NetEnt", "Evolution", "Play'n GO", "Red Tiger", "Big Time Gaming", "ELK", "Light & Wonder", "Nolimit City", "Push", "Relax", "Quickspin", "Blueprint", "Stakelogic", "Greentube", "Hacksaw"]),
    categories: [{ key: "slots", name: "Slots", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }, { key: "live-casino", name: "Live casino", gameCount: null }],
    bonus: { slug: "21-prive-row-welcome", title: "100% up to €300 + 200 free spins", summary: "Current researched ROW first-deposit offer.", percentage: 100, maximumBonus: 300, currency: "EUR", freeSpins: 200, minimumDeposit: 20, wageringMultiplier: null, wageringText: unknownWagering, maximumBet: null, eligibility: generalEligibility, importantConditions: ["Minimum deposit €20.", unknownWagering, "Historical withdrawal complaints remain an editorial limitation."] },
    evidence: { catalogId: "6f952894-2b74-4a06-8fba-405696d0a13c", offerId: "f92cbaf2-2608-4c31-a0ee-d19ce7138ac5", routeId: "9fa35fb8-c6b2-452c-9776-146777001502", canonicalUrlSha256: "34d4f3a8319d811e3a647aedb02bad4c3fe7ca840d9ce76a256db4383eaee275" },
    media: { path: "/casino-brands/21-prive/partner-offer.jpg", mimeType: "image/jpeg", width: 300, height: 250, checksum: "11b098d6893a460f9bc79cfd3fba4b8644471d442ae5bdbdff5eb718694c1cef", evidenceId: "34670c6b-68ad-487e-b863-83f26f7a2383", role: "CURRENT_OFFER_CREATIVE" },
  },
  {
    slug: "skol-casino", title: "Skol Casino", foundedYear: 2021,
    languages: ["EN", "FR", "DE", "ES", "NO", "FI"], currencies: ["CAD", "EUR", "GBP", "NOK", "NZD"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    payments: paymentRows({
      deposits: ["Visa", "Mastercard", "Neteller", "Skrill", "Interac", "Paysafecard", "PayPal", "Maestro", "Trustly", "Bank Wire"],
      withdrawals: ["Visa", "Mastercard", "Skrill", "Neteller", "Bank Wire", "Interac", "Trustly", "PayPal"], currencies: ["EUR"],
      pending: "Pending review 24–48 hours", ewallet: "e-wallet processing 0–1 hour", card: "bank/card processing up to 3–7 days", bank: "bank/card processing up to 3–7 days",
    }),
    providers: providers(["Play'n GO", "NetEnt", "Games Global", "Red Tiger", "Blueprint", "Push", "Evolution", "Pragmatic Play"]),
    categories: [{ key: "all-games", name: "2,500+ reported games", gameCount: 2500 }, { key: "slots", name: "Slots", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }, { key: "live-casino", name: "Live casino", gameCount: null }],
    bonus: { slug: "skol-casino-row-welcome", title: "100% up to €300 + 100 free spins", summary: "Current researched ROW first-deposit offer.", percentage: 100, maximumBonus: 300, currency: "EUR", freeSpins: 100, minimumDeposit: 10, wageringMultiplier: null, wageringText: unknownWagering, maximumBet: null, eligibility: generalEligibility, importantConditions: ["Minimum deposit €10.", unknownWagering, "Offer visibility does not claim local regulatory or partner approval."] },
    evidence: { catalogId: "f59aff7c-e830-4fc8-aeda-1755b745ccf7", offerId: "47327f39-d0fb-4b20-87bb-bf8a5ffb914d", routeId: "09c6424d-2d3e-4cff-a78f-36a56d97954a", canonicalUrlSha256: "0291cbf9628461454f5c794533cf2af223f71b2dbafca408f15bee76344f9b7c" },
    media: { path: "/casino-brands/skol-casino/partner-offer.jpg", mimeType: "image/jpeg", width: 300, height: 250, checksum: "a1961759af4bf5dcef74c6145ab6df3a510c2926f781cea5655c2ed1610e3d48", evidenceId: "c550ed39-19e0-4c4f-8e29-6278f8240a7e", role: "GENERIC_PARTNER_CREATIVE" },
  },
  {
    slug: "slotnite", title: "Slotnite", foundedYear: 2019,
    languages: ["EN", "FI", "DE", "FR", "NO", "ES"], currencies: ["GBP", "ARS", "CAD", "CLP", "EUR", "NOK", "PEN", "USD", "NZD"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limits", "Time-out", "Self-exclusion", "Reality checks"],
    payments: paymentRows({
      deposits: ["Visa", "Mastercard", "PayPal", "Paysafecard", "Skrill", "Trustly", "Neteller", "Maestro", "Bank Wire", "Interac", "Rapid Transfer", "Sofort", "MuchBetter"],
      withdrawals: ["cards", "PayPal", "Paysafecard", "Trustly", "Skrill", "Neteller", "Bank Wire", "Rapid Transfer", "Sofort", "EPS", "MuchBetter"], currencies: ["EUR"],
      pending: "Pending review 24–48 hours", ewallet: "e-wallet processing 0–1 hour", card: "bank/card processing 3–5 days", bank: "bank/card processing 3–5 days",
    }),
    providers: providers(["Evolution", "Blueprint", "Games Global", "Play'n GO", "Push", "Quickspin", "Red Tiger", "Relax", "Light & Wonder", "NetEnt", "Nolimit City", "Hacksaw", "Stakelogic"]),
    categories: [{ key: "slots", name: "Slots", gameCount: null }, { key: "live-casino", name: "Live casino", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }],
    bonus: { slug: "slotnite-row-welcome", title: "100% up to €250 + 100 free spins", summary: "Current researched ROW first-deposit offer.", percentage: 100, maximumBonus: 250, currency: "EUR", freeSpins: 100, minimumDeposit: 10, wageringMultiplier: null, wageringText: unknownWagering, maximumBet: null, eligibility: generalEligibility, importantConditions: ["Minimum deposit €10.", unknownWagering, "Recent payout-delay complaints remain an editorial limitation."] },
    evidence: { catalogId: "98a97b0a-5f68-40fe-ba21-f52fae8da192", offerId: "53f4a9cb-8c8d-457f-8f5c-33554fc15189", routeId: "5774fd82-1ebc-4a6e-9252-8c0add384a91", canonicalUrlSha256: "d3e597395afa17ffcc95133560cce21ffb1f625717b69505ea4400829a8051f3" },
    media: { path: "/casino-brands/slotnite/partner-brand.gif", mimeType: "image/gif", width: 320, height: 50, checksum: "fa47b6a8655b37749d6658ac51ff67e58bcc6cfd812e36f19f9eccbc6eb4e3a3", evidenceId: "aa9fe01e-e395-4288-882d-552b9aadd19d", role: "GENERIC_PARTNER_CREATIVE" },
  },
  {
    slug: "hello-casino", title: "Hello Casino", foundedYear: 2014,
    languages: ["EN", "NO", "FI", "DE", "ES", "FR", "PT"], currencies: ["GBP", "EUR", "USD", "AUD", "CAD", "ZAR", "ARS", "CLP", "NOK", "NZD", "PEN"], supportsMobile: true,
    responsibleGamblingTools: ["Deposit limit", "Wager limit", "Loss limit", "Session limit", "Self-exclusion", "Time-out", "Reality check", "Self-assessment", "GAMSTOP"],
    payments: paymentRows({
      deposits: ["Bank Wire", "Neteller", "Paysafecard", "Skrill", "Visa", "Mastercard", "Trustly", "Sofort", "EPS", "Klarna", "Rapid Transfer", "Interac"],
      withdrawals: ["Bank Wire", "Neteller", "Skrill", "Visa", "Rapid Transfer"], currencies: ["EUR"], weeklyLimit: 12500,
      pending: "Pending review reported as 48–96 hours", ewallet: "e-wallet processing 0–24 hours", card: "bank/card processing 3–5 days", bank: "bank/card processing 3–5 days",
    }),
    providers: providers(["Games Global", "NetEnt", "Evolution", "Betsoft", "Big Time Gaming", "Blueprint", "ELK", "Hacksaw", "IGT", "Nolimit City", "Play'n GO", "Push", "Quickspin", "Red Tiger", "Relax", "Light & Wonder", "Stakelogic"]),
    categories: [{ key: "slots", name: "Slots", gameCount: null }, { key: "live-casino", name: "Live casino", gameCount: null }, { key: "table-games", name: "Table games", gameCount: null }],
    bonus: { slug: "hello-casino-current-mga-welcome", title: "100% up to €300 + 100 free spins", summary: "Current August MGA first-deposit offer.", percentage: 100, maximumBonus: 300, currency: "EUR", freeSpins: 100, minimumDeposit: 20, wageringMultiplier: 35, wageringText: "35× bonus plus deposit unless otherwise specified.", maximumBet: 5, eligibility: generalEligibility, importantConditions: ["Minimum deposit €20.", "35× bonus plus deposit unless otherwise specified.", "Bonus expires after 30 days; spins expire after 10 days.", "Maximum bonus bet €5."] },
    evidence: { catalogId: "7221c80f-07ff-47f3-99ee-d26f98ee2aaa", offerId: "f1281703-218a-43fd-a850-58fee12e2d88", routeId: "bd47f0ea-9e44-40d9-8b36-e487fd96d4de", canonicalUrlSha256: "af40b20544662bb848f1ade77f708dab7f6f449d9c95059b43b4e63681a0cd6a" },
    // Current captured Hello offer artwork is stale. The controlled logo and
    // code-rendered current offer are intentionally used instead.
    media: null,
  },
] as const;

export const superflyBlockedCountries = [...SUPERFLY_DETECTED_BLOCKED_COUNTRIES];

export const superflyBlockEvidence = {
  DK: ["df86e696-0f10-49a4-9ce8-ac20ae366e18"],
  ES: ["df86e696-0f10-49a4-9ce8-ac20ae366e18"],
  FI: ["3a46f59e-65e5-4a3c-bd7e-9b9760be4265", "c748cc0e-6cc3-4805-a760-d02ec7c0f703"],
  NO: ["da0492de-4531-48f7-be69-0af889e4f1b9"],
  CL: ["acfdc0db-0994-487c-a502-d01c00fb21f9"],
  SE: ["c748cc0e-6cc3-4805-a760-d02ec7c0f703"],
  GB: ["f6f489df-9799-4a24-b8e9-22e554225dc4", "c416fa5d-65b9-490e-9f7f-75fbdbba7eb9"],
} as const;

export function assertCommercialVisibilityCatalog() {
  if (superflyCommercialCatalog.length !== 6) throw new Error("The Superfly release must contain exactly six brands.");
  for (const definition of superflyCommercialCatalog) {
    if (!definition.payments.length || !definition.providers.length || !definition.categories.length) throw new Error(`${definition.slug} has an incomplete global catalog.`);
    if (definition.slug === "hello-casino" && (
      definition.bonus.maximumBonus !== 300
      || definition.bonus.freeSpins !== 100
      || /(?:€|EUR\s*)100.*25|25.*(?:€|EUR\s*)100/i.test(JSON.stringify(definition.bonus))
    )) throw new Error("Obsolete Hello offer data is forbidden.");
    if (!/^[a-f0-9]{64}$/.test(definition.evidence.canonicalUrlSha256)) throw new Error(`${definition.slug} canonical route hash is invalid.`);
  }
}

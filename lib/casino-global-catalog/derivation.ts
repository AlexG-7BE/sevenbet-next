/**
 * Global catalog derivation.
 *
 * RFC-039 defines a public casino read as "globally publishable editorial,
 * catalog and offer content" plus "only the exact current-market CasinoCountry
 * profile, when present". Most published casinos currently carry no global
 * layer at all: every payment, provider, category and licence hangs off a
 * market profile, so a visitor whose country has no exact profile receives an
 * empty record and the profile page renders "Not verified" throughout.
 *
 * This module rebuilds the missing global layer from facts the database
 * already holds. It never invents a fact and never borrows one country's fact
 * for another: a catalog fact is promoted only when it is evidenced in *every*
 * market profile that carries evidence of that kind, which keeps the derived
 * global set a subset of each market's own set. Merging the global layer back
 * into an exact-market projection can therefore never add a claim that market
 * does not already make.
 *
 * Fields that cannot be derived safely are reported in `unresolved` rather
 * than guessed, so they stay visibly missing until research supplies them.
 */

export type GlobalCatalogFieldKey =
  | "operator"
  | "languages"
  | "currencies"
  | "payments"
  | "providers"
  | "categories"
  | "corporateLicences";

export interface DerivationPayment {
  key: string;
  name: string;
  supportsDeposits: boolean | null;
  supportsWithdrawals: boolean | null;
  currencies: string[];
  minimumDeposit: number | null;
  minimumWithdrawal: number | null;
  maximumWithdrawal: number | null;
  depositProcessingTime: string | null;
  withdrawalTime: string | null;
  fees: string | null;
  crypto: boolean | null;
}

export interface DerivationProvider {
  key: string;
  name: string;
  gameCount: number | null;
  liveCasino: boolean | null;
}

export interface DerivationCategory {
  key: string;
  name: string;
  gameCount: number | null;
  featured: boolean;
}

export interface DerivationLicence {
  id: string;
  authority: string;
  licenseNumber: string | null;
  jurisdiction: string | null;
  /** Country codes of the market profiles this licence is linked to. */
  marketCountryCodes: string[];
}

export interface DerivationMarket {
  countryCode: string;
  availability: string;
  operatingLegalEntity: string | null;
  primaryLanguage: string | null;
  supportLanguages: string[];
  supportedLanguages: string[];
  primaryCurrency: string | null;
  supportedCurrencies: string[];
  payments: DerivationPayment[];
  providers: DerivationProvider[];
  categories: DerivationCategory[];
}

export interface DerivationInput {
  slug: string;
  markets: DerivationMarket[];
  licences: DerivationLicence[];
}

export interface GlobalCatalogDerivation {
  slug: string;
  operator: string | null;
  languages: string[];
  currencies: string[];
  payments: DerivationPayment[];
  providers: DerivationProvider[];
  categories: DerivationCategory[];
  /**
   * Licences evidenced across more than one market profile. A corporate or
   * B2C licence repeated per market is a brand-level fact, not a market fact,
   * and belongs in the global layer once rather than duplicated per country.
   */
  corporateLicences: DerivationLicence[];
  /** Field keys this derivation could not establish. */
  unresolved: GlobalCatalogFieldKey[];
}

/** Placeholder entities the bundles use where a name was not primary-verified. */
const UNVERIFIED_ENTITY = /\b(?:not verified|to confirm|assumed)\b/i;

function normalizeEntityName(value: string) {
  // Bundle entities carry a trailing qualifier: registration numbers, licence
  // references or a white-label note. The legal name precedes it.
  const head = value.split(/\s+[—–-]\s+|\s*\(/)[0]?.trim() ?? "";
  return head
    .replace(/\bLtd\.?$/i, "Limited")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The operator is the corporate entity behind the brand, so it must hold
 * across markets. A name is accepted only when it is primary-verified in at
 * least one market and normalizes to a strict majority of the markets that
 * name an entity at all.
 */
export function deriveOperator(markets: readonly DerivationMarket[]): string | null {
  const named = markets.flatMap((market) => {
    const raw = market.operatingLegalEntity?.trim();
    if (!raw) return [];
    const normalized = normalizeEntityName(raw);
    return normalized ? [{ normalized, verified: !UNVERIFIED_ENTITY.test(raw) }] : [];
  });
  if (!named.length) return null;

  const counts = new Map<string, { total: number; verified: number }>();
  for (const entry of named) {
    const current = counts.get(entry.normalized) ?? { total: 0, verified: 0 };
    counts.set(entry.normalized, {
      total: current.total + 1,
      verified: current.verified + (entry.verified ? 1 : 0),
    });
  }

  const ranked = [...counts.entries()].sort((left, right) =>
    right[1].total - left[1].total
    || right[1].verified - left[1].verified
    || left[0].localeCompare(right[0]));
  const [name, tally] = ranked[0] as [string, { total: number; verified: number }];
  if (!tally.verified) return null;
  if (tally.total * 2 <= named.length) return null;
  return name;
}

function unique(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.flatMap((value) => {
    const trimmed = value?.trim();
    return trimmed ? [trimmed] : [];
  }))].sort((left, right) => left.localeCompare(right));
}

/**
 * A language or currency the brand operates in anywhere is a true statement
 * about the brand, so these are unioned. Exact-market projection keeps using
 * the market profile's own values wherever it has them.
 */
export function deriveLanguages(markets: readonly DerivationMarket[]) {
  return unique(markets.flatMap((market) => [
    market.primaryLanguage,
    ...market.supportLanguages,
    ...market.supportedLanguages,
  ]));
}

export function deriveCurrencies(markets: readonly DerivationMarket[]) {
  return unique(markets.flatMap((market) => [market.primaryCurrency, ...market.supportedCurrencies]));
}

/**
 * Catalog intersection. Only rows present in every market profile that carries
 * evidence of this kind are promoted, so the global set stays a subset of each
 * contributing market and cannot introduce a claim into an exact-market view.
 */
function intersectBy<T>(
  markets: readonly DerivationMarket[],
  select: (market: DerivationMarket) => readonly T[],
  key: (value: T) => string,
) {
  const contributing = markets.map(select).filter((rows) => rows.length > 0);
  if (!contributing.length) return [];
  const [first, ...rest] = contributing as [readonly T[], ...(readonly T[])[]];
  const shared = rest.reduce<Set<string>>(
    (carry, rows) => new Set(rows.map(key).filter((value) => carry.has(value))),
    new Set(first.map(key)),
  );
  const seen = new Set<string>();
  return first.filter((value) => {
    const identity = key(value);
    if (!shared.has(identity) || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function derivePayments(markets: readonly DerivationMarket[]) {
  return intersectBy(markets, (market) => market.payments, (payment) => payment.key);
}

export function deriveProviders(markets: readonly DerivationMarket[]) {
  return intersectBy(markets, (market) => market.providers, (provider) => provider.key);
}

export function deriveCategories(markets: readonly DerivationMarket[]) {
  return intersectBy(markets, (market) => market.categories, (category) => category.key);
}

export function licenceIdentity(licence: Pick<DerivationLicence, "authority" | "licenseNumber" | "jurisdiction">) {
  return JSON.stringify([licence.authority, licence.licenseNumber ?? "", licence.jurisdiction ?? ""]);
}

/**
 * A corporate or B2C licence is recorded once per market, which in this data
 * set means several duplicate rows that each link to a single country. The
 * reach of the licence is therefore the union of markets across every row
 * sharing its identity, not the links of any one row.
 */
export function deriveCorporateLicences(licences: readonly DerivationLicence[]) {
  const reach = new Map<string, Set<string>>();
  for (const licence of licences) {
    const markets = reach.get(licenceIdentity(licence)) ?? new Set<string>();
    for (const countryCode of licence.marketCountryCodes) markets.add(countryCode);
    reach.set(licenceIdentity(licence), markets);
  }
  const seen = new Set<string>();
  return licences.filter((licence) => {
    const identity = licenceIdentity(licence);
    if (seen.has(identity) || (reach.get(identity)?.size ?? 0) <= 1) return false;
    seen.add(identity);
    return true;
  });
}

export function deriveGlobalCatalog(input: DerivationInput): GlobalCatalogDerivation {
  const operator = deriveOperator(input.markets);
  const languages = deriveLanguages(input.markets);
  const currencies = deriveCurrencies(input.markets);
  const payments = derivePayments(input.markets);
  const providers = deriveProviders(input.markets);
  const categories = deriveCategories(input.markets);
  const corporateLicences = deriveCorporateLicences(input.licences);

  const unresolved: GlobalCatalogFieldKey[] = [];
  if (!operator) unresolved.push("operator");
  if (!languages.length) unresolved.push("languages");
  if (!currencies.length) unresolved.push("currencies");
  if (!payments.length) unresolved.push("payments");
  if (!providers.length) unresolved.push("providers");
  if (!categories.length) unresolved.push("categories");
  if (!corporateLicences.length) unresolved.push("corporateLicences");

  return {
    slug: input.slug,
    operator,
    languages,
    currencies,
    payments,
    providers,
    categories,
    corporateLicences,
    unresolved,
  };
}

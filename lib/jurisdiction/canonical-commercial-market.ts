import {
  ARGENTINA_SUBDIVISIONS,
  CANADA_SUBDIVISIONS,
  ISO_3166_1_ALPHA_2,
} from "@/lib/current-partner-worldwide-authority/inventory";

export const COMMERCIAL_EXACT_SUBDIVISION_COUNTRIES = ["AR", "CA"] as const;

declare const canonicalCommercialMarketKeyBrand: unique symbol;

/** A market identifier that has passed the one canonical commercial GEO policy. */
export type CanonicalCommercialMarketKey = string & {
  readonly [canonicalCommercialMarketKeyBrand]: true;
};

export type CommercialGeoInput = Readonly<{
  countryCode: string | null | undefined;
  marketCode?: string | null;
  trust: "TRUSTED" | "UNTRUSTED";
}>;

const assignedCountries = new Set<string>(ISO_3166_1_ALPHA_2);
const exactSubdivisions = new Map<string, ReadonlySet<string>>([
  ["AR", new Set<string>(ARGENTINA_SUBDIVISIONS)],
  ["CA", new Set<string>(CANADA_SUBDIVISIONS)],
]);
const usSubdivisions = new Set([
  "US-AL", "US-AK", "US-AZ", "US-AR", "US-CA", "US-CO", "US-CT", "US-DE", "US-FL", "US-GA",
  "US-HI", "US-ID", "US-IL", "US-IN", "US-IA", "US-KS", "US-KY", "US-LA", "US-ME", "US-MD",
  "US-MA", "US-MI", "US-MN", "US-MS", "US-MO", "US-MT", "US-NE", "US-NV", "US-NH", "US-NJ",
  "US-NM", "US-NY", "US-NC", "US-ND", "US-OH", "US-OK", "US-OR", "US-PA", "US-RI", "US-SC",
  "US-SD", "US-TN", "US-TX", "US-UT", "US-VT", "US-VA", "US-WA", "US-WV", "US-WI", "US-WY",
  "US-DC", "US-AS", "US-GU", "US-MP", "US-PR", "US-UM", "US-VI",
]);

function normalizedCountry(value: string | null | undefined) {
  const country = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(country) && assignedCountries.has(country) ? country : null;
}

function normalizedMarket(value: string | null | undefined) {
  const market = value?.trim().toUpperCase().replace(/_/g, "-") ?? "";
  return /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(market) ? market : null;
}

/**
 * Normalizes one trusted GEO to one commercial lookup key.
 *
 * Country-scoped subdivisions collapse here, before persistence or lookup.
 * Argentina and Canada require a recognized exact subdivision. Invalid or
 * untrusted data returns null and is never broadened to a country prefix.
 */
export function canonicalCommercialMarketKey(
  input: CommercialGeoInput | null | undefined,
): CanonicalCommercialMarketKey | null {
  if (!input || input.trust !== "TRUSTED") return null;
  const country = normalizedCountry(input.countryCode);
  const market = normalizedMarket(input.marketCode ?? input.countryCode);
  if (!country || !market || market.slice(0, 2) !== country || market === "ZZ") return null;

  const subdivisions = exactSubdivisions.get(country);
  if (subdivisions) {
    return subdivisions.has(market) ? market as CanonicalCommercialMarketKey : null;
  }
  if (country === "US" && market !== country && !usSubdivisions.has(market)) return null;

  return country as CanonicalCommercialMarketKey;
}

export function canonicalCommercialCountryCode(key: CanonicalCommercialMarketKey) {
  return key.slice(0, 2);
}

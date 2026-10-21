import { marketAccess } from "@/lib/market-access/access";
import { countryDisplayName } from "@/lib/market/presentation-resolver";
import type { SupportedLanguage } from "@/lib/market/registry";
import type { PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";

/**
 * A country filter above the offer lists (Founder decision 21 Oct 2026,
 * OFFER-COUNTRY-FILTER-2026-10-21): the visitor may show another country's offers.
 *
 * The choice moves only the view, the way the language fallback in
 * `editorialPresentation` does. Partner buttons still come from the trusted
 * request country: the action resolver grants a route only when the trusted
 * jurisdiction matches the country it is asked about, so a list shown for
 * another country simply has no buttons.
 */

/** One casino's own offer for one country; the country list is counted from these. */
export type OfferMarketPair = Readonly<{ casinoSlug: string; countryCode: string }>;

export type OfferCountryOption = Readonly<{ countryCode: string; label: string }>;

export type OfferCountryView = Readonly<{
  /** The country the lists show. */
  countryCode: string;
  /** Its name in the page language. */
  label: string;
  /** The country the lists show without a choice; picking it clears the choice. */
  defaultCountryCode: string;
  chosen: boolean;
  /** The lists show a country other than the visitor's own, so no partner button can appear. */
  actionsElsewhere: boolean;
  options: readonly OfferCountryOption[];
}>;

type OfferViewPresentation = {
  language: SupportedLanguage;
  marketCountryCode: string | null;
  marketCode?: string | null;
  marketDisplayName: string;
  editorialFallback: boolean;
};

function normalizedCountry(value: string | null | undefined) {
  const country = value?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

/** Countries an offer names; an offer shown everywhere (rest of world) names none. */
export function candidateOfferCountries(candidate: Pick<PublishedOfferCandidate, "sourceScope" | "sourceCountryCode" | "geoMode" | "allowedCountries">) {
  const named = candidate.sourceScope === "MARKET"
    ? [candidate.sourceCountryCode]
    : candidate.geoMode === "ALLOW" ? candidate.allowedCountries : [];
  return named.map(normalizedCountry).filter((country): country is string => Boolean(country));
}

/**
 * Countries with at least one casino offer of their own that the register lets the
 * lists show right now. A country whose offers are all closed — no local licence,
 * outside an advertising window, advertising prohibited — is left out.
 */
export function openOfferCountries(pairs: readonly OfferMarketPair[], now: Date) {
  const open = new Set<string>();
  for (const pair of pairs) {
    const country = normalizedCountry(pair.countryCode);
    if (!country || open.has(country)) continue;
    if (marketAccess(pair.casinoSlug, country, now).open) open.add(country);
  }
  return [...open].sort();
}

export function withOfferCountryChoice<T extends OfferViewPresentation>(
  presentation: T,
  input: { visitorCountryCode: string | null; choice: string | null; countries: readonly string[] },
): T & { offerCountry: OfferCountryView | null } {
  const visitor = normalizedCountry(input.visitorCountryCode);
  const shown = normalizedCountry(presentation.marketCountryCode);
  // A country that prohibits offers keeps its withheld pages; its visitors get no other country's list.
  // With no country at all there is nothing to switch back to.
  if (!shown || !offersMayBePresented(shown) || (visitor && !offersMayBePresented(visitor))) {
    return { ...presentation, offerCountry: null };
  }
  const countries = new Set(input.countries.map(normalizedCountry).filter((country): country is string => Boolean(country)));
  const name = (country: string) => countryDisplayName(country, presentation.language);
  const options = [...new Set([shown, ...countries])]
    .map((countryCode) => ({ countryCode, label: name(countryCode) }))
    .sort((left, right) => left.label.localeCompare(right.label, presentation.language));
  if (options.length < 2) return { ...presentation, offerCountry: null };

  const choice = normalizedCountry(input.choice);
  if (!choice || choice === shown || !countries.has(choice)) {
    return {
      ...presentation,
      offerCountry: { countryCode: shown, label: name(shown), defaultCountryCode: shown, chosen: false, actionsElsewhere: false, options },
    };
  }
  const label = name(choice);
  return {
    ...presentation,
    marketCountryCode: choice,
    ...("marketCode" in presentation ? { marketCode: choice } : {}),
    marketDisplayName: label,
    editorialFallback: false,
    offerCountry: { countryCode: choice, label, defaultCountryCode: shown, chosen: true, actionsElsewhere: choice !== visitor, options },
  };
}

import { MARKET_RULES } from "../market-access/register";
import { offersMayBePresented } from "../public-offer/offer-visibility";

import { marketProfileByCountry, type SupportedLanguage } from "./registry";

/**
 * The market whose offers and reviews a language's product pages show to a visitor from a
 * country where B4GAMBLE has no market of its own (Founder decision 27 Sep 2026,
 * NON-MARKET-EDITORIAL-FALLBACK-2026-09-27).
 *
 * Search and AI crawlers fetch from the United States. Before this, they read the "rest of
 * the world" mix (Peruvian soles, Swedish kronor, an Italian welcome bonus, "Filtered for
 * United States"), never the UK, Swedish or Danish offers the pages exist for.
 *
 * German is not mapped: German offers exist only inside the Berlin advertising window, so a
 * German editorial view would empty /de/bonuses by day and make its indexing flap.
 */
export const LANGUAGE_EDITORIAL_MARKET: Readonly<Partial<Record<SupportedLanguage, "GB" | "SE" | "DK">>> = Object.freeze({
  en: "GB",
  sv: "SE",
  da: "DK",
});

type EditorialPresentationInput = {
  language: SupportedLanguage;
  marketCountryCode: string | null;
  marketCode?: string | null;
  marketDisplayName: string;
};

/** A country the register or the market registry knows keeps its own view (GB, IE, PE, CA-ON…). */
export function countryHasOwnEditorialMarket(countryCode: string | null | undefined) {
  const country = countryCode?.trim().toUpperCase().slice(0, 2);
  return Boolean(country && (marketProfileByCountry(country) || MARKET_RULES[country]));
}

/**
 * The presentation used to pick and describe offers and reviews. Only the editorial view moves:
 * partner buttons still come from the visitor's real country, because the action resolver
 * grants a route only when the trusted jurisdiction matches the country it is asked about.
 * A country that prohibits offers keeps its own view, so its pages stay withheld.
 */
export function editorialPresentation<T extends EditorialPresentationInput>(presentation: T): T & { editorialFallback: boolean } {
  const country = presentation.marketCountryCode;
  const fallback = LANGUAGE_EDITORIAL_MARKET[presentation.language];
  if (!fallback || countryHasOwnEditorialMarket(country) || (country && !offersMayBePresented(country))) {
    return { ...presentation, editorialFallback: false };
  }
  return {
    ...presentation,
    marketCountryCode: fallback,
    ...("marketCode" in presentation ? { marketCode: fallback } : {}),
    marketDisplayName: marketProfileByCountry(fallback)?.seoDisplayName ?? fallback,
    editorialFallback: true,
  };
}

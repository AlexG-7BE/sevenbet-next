import {
  localeForLanguageSegment,
  marketProfileByCountry,
  marketProfileByRouteMarket,
  type MarketProfile,
  type SupportedLocale,
} from "./registry";

export type PresentationPreference = Readonly<{
  countryCode: string;
  locale?: SupportedLocale | null;
}>;

export type PresentationResolution = Readonly<{
  market: MarketProfile;
  locale: SupportedLocale;
  source: "EXPLICIT_ROUTE" | "USER_PREFERENCE" | "TRUSTED_GEO" | "DEFAULT";
  explicitRouteValid: boolean;
}>;

function preferredLocale(profile: MarketProfile, requested: SupportedLocale | null | undefined) {
  return requested && profile.supportedLocales.includes(requested)
    ? requested
    : profile.defaultLocale;
}

export function resolvePresentationContext(input: {
  routeMarket?: string | null;
  routeLanguage?: string | null;
  preference?: PresentationPreference | null;
  trustedCountryCode?: string | null;
}): PresentationResolution {
  if (input.routeMarket) {
    const market = marketProfileByRouteMarket(input.routeMarket);
    const locale = market ? localeForLanguageSegment(market, input.routeLanguage) : null;
    if (market && locale) {
      return { market, locale, source: "EXPLICIT_ROUTE", explicitRouteValid: true };
    }
  }

  if (input.preference) {
    const market = marketProfileByCountry(input.preference.countryCode);
    if (market) {
      return {
        market,
        locale: preferredLocale(market, input.preference.locale),
        source: "USER_PREFERENCE",
        explicitRouteValid: !input.routeMarket,
      };
    }
  }

  const geoMarket = marketProfileByCountry(input.trustedCountryCode);
  if (geoMarket) {
    return {
      market: geoMarket,
      locale: geoMarket.defaultLocale,
      source: "TRUSTED_GEO",
      explicitRouteValid: !input.routeMarket,
    };
  }

  const fallback = marketProfileByCountry("GB");
  if (!fallback) throw new Error("GB fallback market profile is missing");
  return {
    market: fallback,
    locale: fallback.defaultLocale,
    source: "DEFAULT",
    explicitRouteValid: !input.routeMarket,
  };
}

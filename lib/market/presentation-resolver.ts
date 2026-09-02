import {
  localeMarketRoute,
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
  return requested && localeMarketRoute(profile, requested)?.enabled ? requested : null;
}

function localeFromAcceptLanguage(profile: MarketProfile, value: string | null | undefined) {
  if (!value) return null;
  const requestedLanguages = value
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="))?.split("=")[1];
      return { tag: tag?.toLowerCase() ?? "", quality: quality === undefined ? 1 : Number(quality) };
    })
    .filter(({ quality, tag }) => tag && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality);
  for (const { tag } of requestedLanguages) {
    const exact = profile.localeRoutes.find((route) => route.enabled && route.locale.toLowerCase() === tag);
    if (exact) return exact.locale;
    const language = tag.split("-")[0];
    const sameLanguage = profile.localeRoutes.find((route) => route.enabled && route.locale.toLowerCase().split("-")[0] === language);
    if (sameLanguage) return sameLanguage.locale;
  }
  return null;
}

export function resolvePresentationContext(input: {
  routeMarket?: string | null;
  routeLanguage?: string | null;
  preference?: PresentationPreference | null;
  trustedCountryCode?: string | null;
  acceptLanguage?: string | null;
}): PresentationResolution {
  if (input.routeMarket) {
    const market = marketProfileByRouteMarket(input.routeMarket);
    const locale = market ? localeForLanguageSegment(market, input.routeLanguage) : null;
    if (market && locale && localeMarketRoute(market, locale)?.enabled) {
      return { market, locale, source: "EXPLICIT_ROUTE", explicitRouteValid: true };
    }
  }

  if (input.preference) {
    const market = marketProfileByCountry(input.preference.countryCode);
    if (market && market.localeRoutes.some((route) => route.enabled)) {
      return {
        market,
        locale: preferredLocale(market, input.preference.locale)
          ?? localeFromAcceptLanguage(market, input.acceptLanguage)
          ?? market.defaultLocale,
        source: "USER_PREFERENCE",
        explicitRouteValid: !input.routeMarket,
      };
    }
  }

  const geoMarket = marketProfileByCountry(input.trustedCountryCode);
  if (geoMarket && geoMarket.localeRoutes.some((route) => route.enabled)) {
    return {
      market: geoMarket,
      locale: localeFromAcceptLanguage(geoMarket, input.acceptLanguage) ?? geoMarket.defaultLocale,
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

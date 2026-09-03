import {
  languageForLocale,
  languageRouteByPublicSlug,
  localeForLanguageAndMarket,
  marketProfileByCountry,
  marketProfileByRouteMarket,
  type MarketProfile,
  type SupportedLanguage,
  type SupportedLocale,
} from "./registry";

export type PresentationPreference = Readonly<{
  language: SupportedLanguage;
}>;

export type PresentationResolution = Readonly<{
  /** Exact known market profile derived from trusted GEO, or null. */
  market: MarketProfile | null;
  /** Raw trusted ISO country, including countries without a configured profile. */
  marketCountryCode: string | null;
  marketDisplayName: string;
  language: SupportedLanguage;
  /** Internal BCP-47 content variant; never public market authority. */
  locale: SupportedLocale;
  source: "EXPLICIT_ROUTE" | "USER_PREFERENCE" | "TRUSTED_GEO" | "ACCEPT_LANGUAGE" | "DEFAULT";
  marketSource: "PROGRAMME_ROUTE" | "TRUSTED_GEO" | "UNKNOWN";
  explicitRouteValid: boolean;
}>;

function normalizedCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function acceptedLanguages(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry, position) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="))?.split("=")[1];
      return { tag: tag?.toLowerCase() ?? "", quality: quality === undefined ? 1 : Number(quality), position };
    })
    .filter(({ quality, tag }) => tag && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.position - b.position)
    .flatMap(({ tag }) => {
      const language = tag.split("-")[0];
      const profile = languageRouteByPublicSlug(language);
      return profile ? [profile.language] : [];
    });
}

const globalCatalogLabel: Readonly<Record<SupportedLanguage, string>> = {
  en: "the global catalog",
  de: "den globalen Katalog",
  es: "el catálogo global",
  el: "τον παγκόσμιο κατάλογο",
  sv: "den globala katalogen",
  da: "det globale katalog",
  it: "il catalogo globale",
  pt: "o catálogo global",
  nl: "de wereldwijde catalogus",
  fi: "maailmanlaajuinen luettelo",
  nb: "den globale katalogen",
  fr: "le catalogue mondial",
};

function knownMarketDisplayName(market: MarketProfile | null, countryCode: string | null, language: SupportedLanguage) {
  return market?.seoDisplayName ?? countryCode ?? globalCatalogLabel[language];
}

/**
 * Resolve the two independent dimensions of presentation. Public language can
 * come from the path, a language-only cookie or Accept-Language. Public market
 * can come only from trusted request GEO. Programme routes opt into their
 * existing route-owned market semantics through `routeControlsMarket`.
 */
export function resolvePresentationContext(input: {
  routeMarket?: string | null;
  routeLanguage?: string | null;
  routeControlsMarket?: boolean;
  preference?: PresentationPreference | null;
  trustedCountryCode?: string | null;
  acceptLanguage?: string | null;
}): PresentationResolution {
  const programmeMarket = input.routeControlsMarket
    ? marketProfileByRouteMarket(input.routeMarket)
    : null;
  const trustedCountryCode = input.routeControlsMarket
    ? programmeMarket?.countryCode ?? null
    : normalizedCountryCode(input.trustedCountryCode);
  const market = programmeMarket ?? marketProfileByCountry(trustedCountryCode);
  const marketSource = programmeMarket
    ? "PROGRAMME_ROUTE" as const
    : trustedCountryCode
      ? "TRUSTED_GEO" as const
      : "UNKNOWN" as const;

  const explicitLanguage = languageRouteByPublicSlug(input.routeLanguage);
  const preferredLanguage = input.preference
    ? languageRouteByPublicSlug(input.preference.language)?.language ?? null
    : null;
  const acceptedLanguage = acceptedLanguages(input.acceptLanguage)[0] ?? null;
  const geoLanguage = market ? languageForLocale(market.defaultLocale) : null;
  const language = explicitLanguage?.language
    ?? preferredLanguage
    ?? acceptedLanguage
    ?? geoLanguage
    ?? "en";
  const source = explicitLanguage
    ? "EXPLICIT_ROUTE" as const
    : preferredLanguage
      ? "USER_PREFERENCE" as const
      : acceptedLanguage
        ? "ACCEPT_LANGUAGE" as const
        : geoLanguage
          ? "TRUSTED_GEO" as const
          : "DEFAULT" as const;

  return {
    market,
    marketCountryCode: trustedCountryCode,
    marketDisplayName: knownMarketDisplayName(market, trustedCountryCode, language),
    language,
    locale: localeForLanguageAndMarket(language, market),
    source,
    marketSource,
    explicitRouteValid: input.routeLanguage ? Boolean(explicitLanguage) : true,
  };
}

export type MarketCode = "GB" | "DE" | "IT" | "ES" | "PT" | "GR" | "NL" | "SE" | "DK" | "FI" | "NO" | "CA";

export type SupportedLocale =
  | "en-GB"
  | "de-DE"
  | "it-IT"
  | "es-ES"
  | "pt-PT"
  | "el-GR"
  | "nl-NL"
  | "sv-SE"
  | "da-DK"
  | "fi-FI"
  | "nb-NO"
  | "en-CA"
  | "fr-CA";

export type MarketEditorialState = "LIVE_BASELINE" | "LOCALIZATION_REQUIRED";
export type MarketLegalContentState = "GB_REVIEWED" | "LOCAL_REVIEW_REQUIRED";
export type MarketCommercialPresentationState = "AUTHORITY_REQUIRED";

export type MarketProfile = Readonly<{
  countryCode: MarketCode;
  routeMarket: Lowercase<MarketCode>;
  seoDisplayName: string;
  defaultLocale: SupportedLocale;
  supportedLocales: readonly SupportedLocale[];
  currencyHints: readonly string[];
  editorialState: MarketEditorialState;
  legalContentState: MarketLegalContentState;
  commercialPresentationState: MarketCommercialPresentationState;
  helpResourceProfile: string;
  partnerReadinessNotes: string | null;
}>;

const profiles = [
  {
    countryCode: "GB",
    routeMarket: "gb",
    seoDisplayName: "United Kingdom",
    defaultLocale: "en-GB",
    supportedLocales: ["en-GB"],
    currencyHints: ["GBP"],
    editorialState: "LIVE_BASELINE",
    legalContentState: "GB_REVIEWED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "gb",
    partnerReadinessNotes: "Existing public baseline and compatibility reference.",
  },
  {
    countryCode: "DE",
    routeMarket: "de",
    seoDisplayName: "Deutschland",
    defaultLocale: "de-DE",
    supportedLocales: ["de-DE"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "de",
    partnerReadinessNotes: "First European partner-readiness tranche.",
  },
  {
    countryCode: "IT",
    routeMarket: "it",
    seoDisplayName: "Italia",
    defaultLocale: "it-IT",
    supportedLocales: ["it-IT"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "it",
    partnerReadinessNotes: "First European partner-readiness tranche; localized readiness is independent of commercial authority.",
  },
  {
    countryCode: "ES",
    routeMarket: "es",
    seoDisplayName: "España",
    defaultLocale: "es-ES",
    supportedLocales: ["es-ES"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "es",
    partnerReadinessNotes: "First European partner-readiness tranche; Spain is a market profile while Spanish-language expansion to other countries remains separate.",
  },
  {
    countryCode: "PT",
    routeMarket: "pt",
    seoDisplayName: "Portugal",
    defaultLocale: "pt-PT",
    supportedLocales: ["pt-PT"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "pt",
    partnerReadinessNotes: "Partner-readiness target supported by current SkillOnNet and NetoPartners portfolio evidence; commercial authority remains separate.",
  },
  {
    countryCode: "GR",
    routeMarket: "gr",
    seoDisplayName: "Ελλάδα",
    defaultLocale: "el-GR",
    supportedLocales: ["el-GR"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "gr",
    partnerReadinessNotes: "SkillOnNet/EGO relevance; Greek affiliate promotion requires separate HGC suitability and approved-URL authority before commercial activation.",
  },
  {
    countryCode: "NL",
    routeMarket: "nl",
    seoDisplayName: "Nederland",
    defaultLocale: "nl-NL",
    supportedLocales: ["nl-NL"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "nl",
    partnerReadinessNotes: "Partner-readiness target; Dutch affiliate advertising is permitted only within applicable Ksa rules and licensed-operator authority.",
  },
  {
    countryCode: "SE",
    routeMarket: "se",
    seoDisplayName: "Sverige",
    defaultLocale: "sv-SE",
    supportedLocales: ["sv-SE"],
    currencyHints: ["SEK"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "se",
    partnerReadinessNotes: "First European partner-readiness tranche.",
  },
  {
    countryCode: "DK",
    routeMarket: "dk",
    seoDisplayName: "Danmark",
    defaultLocale: "da-DK",
    supportedLocales: ["da-DK"],
    currencyHints: ["DKK"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "dk",
    partnerReadinessNotes: "First European partner-readiness tranche.",
  },
  {
    countryCode: "FI",
    routeMarket: "fi",
    seoDisplayName: "Suomi",
    defaultLocale: "fi-FI",
    supportedLocales: ["fi-FI"],
    currencyHints: ["EUR"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "fi",
    partnerReadinessNotes: "First European partner-readiness tranche.",
  },
  {
    countryCode: "NO",
    routeMarket: "no",
    seoDisplayName: "Norge",
    defaultLocale: "nb-NO",
    supportedLocales: ["nb-NO"],
    currencyHints: ["NOK"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "no",
    partnerReadinessNotes: "Localized editorial readiness does not imply commercial legality or referral authority.",
  },
  {
    countryCode: "CA",
    routeMarket: "ca",
    seoDisplayName: "Canada",
    defaultLocale: "en-CA",
    supportedLocales: ["en-CA", "fr-CA"],
    currencyHints: ["CAD"],
    editorialState: "LOCALIZATION_REQUIRED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "ca",
    partnerReadinessNotes: "Architecture-ready; not a blocker for the first European tranche.",
  },
] as const satisfies readonly MarketProfile[];

export const MARKET_PROFILES: readonly MarketProfile[] = profiles;

export const INITIAL_EUROPEAN_MARKET_CODES = [
  "GB",
  "DE",
  "IT",
  "ES",
  "PT",
  "GR",
  "NL",
  "SE",
  "DK",
  "FI",
  "NO",
] as const satisfies readonly MarketCode[];

export const FIRST_WAVE_EVIDENCE_MARKET_CODES = ["DE", "ES", "SE", "DK", "GR"] as const satisfies readonly MarketCode[];
export type FirstWaveEvidenceMarketCode = typeof FIRST_WAVE_EVIDENCE_MARKET_CODES[number];

const initialEuropeanMarketCodes = new Set<MarketCode>(INITIAL_EUROPEAN_MARKET_CODES);

export const INITIAL_EUROPEAN_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => initialEuropeanMarketCodes.has(profile.countryCode),
);

export const DEFAULT_MARKET_PROFILE = profiles[0];

export function isInitialEuropeanMarket(profile: MarketProfile) {
  return initialEuropeanMarketCodes.has(profile.countryCode);
}

const byCountry = new Map<MarketCode, MarketProfile>(profiles.map((profile) => [profile.countryCode, profile]));
const byRouteMarket = new Map<string, MarketProfile>(profiles.map((profile) => [profile.routeMarket, profile]));

export function marketProfileByCountry(countryCode: string | null | undefined): MarketProfile | null {
  if (!countryCode) return null;
  return byCountry.get(countryCode.trim().toUpperCase() as MarketCode) ?? null;
}

export function marketProfileByRouteMarket(routeMarket: string | null | undefined): MarketProfile | null {
  if (!routeMarket) return null;
  return byRouteMarket.get(routeMarket.trim().toLowerCase()) ?? null;
}

export function languageSegmentForLocale(locale: SupportedLocale) {
  return locale.split("-")[0].toLowerCase();
}

export function localeForLanguageSegment(profile: MarketProfile, languageSegment: string | null | undefined): SupportedLocale | null {
  if (!languageSegment) return null;
  const normalized = languageSegment.trim().toLowerCase();
  return profile.supportedLocales.find((locale) => languageSegmentForLocale(locale) === normalized) ?? null;
}

/**
 * Build the one canonical public path for a market, locale and equivalent
 * pathname. The default market/default locale remains unprefixed, other market
 * defaults use one segment, and only secondary locales add a language segment.
 */
export function publicMarketPath(profile: MarketProfile, locale: SupportedLocale, pathname = "/") {
  if (!profile.supportedLocales.includes(locale)) throw new Error(`Locale ${locale} is not supported by market ${profile.countryCode}`);
  const suffixIndex = pathname.search(/[?#]/);
  const rawPathname = suffixIndex >= 0 ? pathname.slice(0, suffixIndex) : pathname;
  const queryOrHash = suffixIndex >= 0 ? pathname.slice(suffixIndex) : "";
  const normalizedPathname = rawPathname === "/"
    ? "/"
    : `/${rawPathname.split("/").filter(Boolean).join("/")}`;
  const isDefaultMarket = profile.countryCode === DEFAULT_MARKET_PROFILE.countryCode;
  const localePrefix = locale === profile.defaultLocale ? "" : `/${languageSegmentForLocale(locale)}`;
  const marketPrefix = isDefaultMarket ? "" : `/${profile.routeMarket}`;
  const prefix = `${marketPrefix}${localePrefix}`;
  const canonicalPathname = normalizedPathname === "/" ? `${prefix}/` : `${prefix}${normalizedPathname}`;
  return `${canonicalPathname || "/"}${queryOrHash}`;
}

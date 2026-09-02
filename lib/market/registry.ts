export type MarketCode = "GB" | "DE" | "IT" | "ES" | "PE" | "PT" | "GR" | "NL" | "SE" | "DK" | "FI" | "NO" | "CA";

export type SupportedLocale =
  | "en-GB"
  | "de-DE"
  | "it-IT"
  | "es-ES"
  | "es-PE"
  | "pt-PT"
  | "el-GR"
  | "nl-NL"
  | "sv-SE"
  | "da-DK"
  | "fi-FI"
  | "nb-NO"
  | "en-CA"
  | "fr-CA";

export type MarketEditorialState = "LIVE_BASELINE" | "LIVE_LOCALIZED" | "PREVIEW_LOCALIZED" | "LOCALIZATION_REQUIRED";
export type MarketLegalContentState = "GB_REVIEWED" | "LOCAL_REVIEW_REQUIRED";
export type MarketCommercialPresentationState = "AUTHORITY_REQUIRED";

export type LocaleMarketRouteProfile = Readonly<{
  locale: SupportedLocale;
  publicSlug: Lowercase<SupportedLocale>;
  enabled: boolean;
  defaultForMarket: boolean;
}>;

export type MarketProfile = Readonly<{
  countryCode: MarketCode;
  routeMarket: Lowercase<MarketCode>;
  seoDisplayName: string;
  defaultLocale: SupportedLocale;
  supportedLocales: readonly SupportedLocale[];
  localeRoutes: readonly LocaleMarketRouteProfile[];
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
    localeRoutes: [{ locale: "en-GB", publicSlug: "en-gb", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [{ locale: "de-DE", publicSlug: "de-de", enabled: true, defaultForMarket: true }],
    currencyHints: ["EUR"],
    editorialState: "LIVE_LOCALIZED",
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
    localeRoutes: [{ locale: "it-IT", publicSlug: "it-it", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [{ locale: "es-ES", publicSlug: "es-es", enabled: true, defaultForMarket: true }],
    currencyHints: ["EUR"],
    editorialState: "LIVE_LOCALIZED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "es",
    partnerReadinessNotes: "First European partner-readiness tranche; Spain is a market profile while Spanish-language expansion to other countries remains separate.",
  },
  {
    countryCode: "PE",
    routeMarket: "pe",
    seoDisplayName: "Perú",
    defaultLocale: "es-PE",
    supportedLocales: ["es-PE"],
    localeRoutes: [{ locale: "es-PE", publicSlug: "es-pe", enabled: true, defaultForMarket: true }],
    currencyHints: ["PEN"],
    editorialState: "LIVE_LOCALIZED",
    legalContentState: "LOCAL_REVIEW_REQUIRED",
    commercialPresentationState: "AUTHORITY_REQUIRED",
    helpResourceProfile: "pe",
    partnerReadinessNotes: "GEO-LOCALIZATION-01 Production presentation; indexing, factual publication and commercial authority remain independent.",
  },
  {
    countryCode: "PT",
    routeMarket: "pt",
    seoDisplayName: "Portugal",
    defaultLocale: "pt-PT",
    supportedLocales: ["pt-PT"],
    localeRoutes: [{ locale: "pt-PT", publicSlug: "pt-pt", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [{ locale: "el-GR", publicSlug: "el-gr", enabled: true, defaultForMarket: true }],
    currencyHints: ["EUR"],
    editorialState: "LIVE_LOCALIZED",
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
    localeRoutes: [{ locale: "nl-NL", publicSlug: "nl-nl", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [{ locale: "sv-SE", publicSlug: "sv-se", enabled: true, defaultForMarket: true }],
    currencyHints: ["SEK"],
    editorialState: "LIVE_LOCALIZED",
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
    localeRoutes: [{ locale: "da-DK", publicSlug: "da-dk", enabled: true, defaultForMarket: true }],
    currencyHints: ["DKK"],
    editorialState: "LIVE_LOCALIZED",
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
    localeRoutes: [{ locale: "fi-FI", publicSlug: "fi-fi", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [{ locale: "nb-NO", publicSlug: "nb-no", enabled: true, defaultForMarket: true }],
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
    localeRoutes: [
      { locale: "en-CA", publicSlug: "en-ca", enabled: false, defaultForMarket: true },
      { locale: "fr-CA", publicSlug: "fr-ca", enabled: false, defaultForMarket: false },
    ],
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

export const FIRST_WAVE_EVIDENCE_MARKET_CODES = ["DE", "ES", "SE", "DK", "GR", "PE"] as const satisfies readonly MarketCode[];
export type FirstWaveEvidenceMarketCode = typeof FIRST_WAVE_EVIDENCE_MARKET_CODES[number];

export const FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES = ["DE", "ES", "PE", "SE", "DK", "GR"] as const satisfies readonly MarketCode[];
export type FounderPublicationAcceptedMarketCode = typeof FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES[number];

const initialEuropeanMarketCodes = new Set<MarketCode>(INITIAL_EUROPEAN_MARKET_CODES);

export const INITIAL_EUROPEAN_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => initialEuropeanMarketCodes.has(profile.countryCode),
);

export const PUBLICATION_APPROVED_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => profile.editorialState === "LIVE_BASELINE" || profile.editorialState === "LIVE_LOCALIZED",
);

export const ENABLED_PRESENTATION_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => profile.localeRoutes.some((route) => route.enabled),
);

export const GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS = ["en-gb", "sv-se", "es-pe"] as const;

export const DEFAULT_MARKET_PROFILE = profiles[0];

export function isInitialEuropeanMarket(profile: MarketProfile) {
  return initialEuropeanMarketCodes.has(profile.countryCode);
}

export function marketEditorialPublicationApproved(profile: MarketProfile) {
  return profile.editorialState === "LIVE_BASELINE" || profile.editorialState === "LIVE_LOCALIZED";
}

const byCountry = new Map<MarketCode, MarketProfile>(profiles.map((profile) => [profile.countryCode, profile]));
const byRouteMarket = new Map<string, MarketProfile>(profiles.map((profile) => [profile.routeMarket, profile]));
const byPublicSlug = new Map<string, { market: MarketProfile; route: LocaleMarketRouteProfile }>(
  profiles.flatMap((market) => market.localeRoutes.map((route) => [route.publicSlug, { market, route }] as const)),
);

export function marketProfileByCountry(countryCode: string | null | undefined): MarketProfile | null {
  if (!countryCode) return null;
  return byCountry.get(countryCode.trim().toUpperCase() as MarketCode) ?? null;
}

export function marketProfileByRouteMarket(routeMarket: string | null | undefined): MarketProfile | null {
  if (!routeMarket) return null;
  return byRouteMarket.get(routeMarket.trim().toLowerCase()) ?? null;
}

export function localeMarketRouteByPublicSlug(publicSlug: string | null | undefined) {
  if (!publicSlug) return null;
  return byPublicSlug.get(publicSlug.trim().toLowerCase()) ?? null;
}

export function localeMarketRoute(profile: MarketProfile, locale: SupportedLocale) {
  return profile.localeRoutes.find((route) => route.locale === locale) ?? null;
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
 * pathname. Every presentation route exposes the BCP-47 locale and market in
 * one lowercase public slug, so the URL always determines both dimensions.
 */
export function publicMarketPath(profile: MarketProfile, locale: SupportedLocale, pathname = "/") {
  const route = localeMarketRoute(profile, locale);
  if (!route) throw new Error(`Locale ${locale} is not supported by market ${profile.countryCode}`);
  const suffixIndex = pathname.search(/[?#]/);
  const rawPathname = suffixIndex >= 0 ? pathname.slice(0, suffixIndex) : pathname;
  const queryOrHash = suffixIndex >= 0 ? pathname.slice(suffixIndex) : "";
  const normalizedPathname = rawPathname === "/"
    ? "/"
    : `/${rawPathname.split("/").filter(Boolean).join("/")}`;
  const prefix = `/${route.publicSlug}`;
  const canonicalPathname = normalizedPathname === "/" ? prefix : `${prefix}${normalizedPathname}`;
  return `${canonicalPathname}${queryOrHash}`;
}

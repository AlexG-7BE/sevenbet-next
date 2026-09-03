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

export type SupportedLanguage = "en" | "de" | "es" | "el" | "sv" | "da" | "it" | "pt" | "nl" | "fi" | "nb" | "fr";

export type LanguageRouteProfile = Readonly<{
  language: SupportedLanguage;
  publicSlug: SupportedLanguage;
  defaultLocale: SupportedLocale;
  localeVariants: readonly SupportedLocale[];
  label: string;
  published: boolean;
  indexable: boolean;
  publicationBlocker: string | null;
}>;

export type MarketEditorialState = "LIVE_BASELINE" | "LIVE_LOCALIZED" | "PREVIEW_LOCALIZED" | "LOCALIZATION_REQUIRED";
export type MarketLegalContentState = "GB_REVIEWED" | "LOCAL_REVIEW_REQUIRED";
export type MarketCommercialPresentationState = "AUTHORITY_REQUIRED";

export type MarketPublicationPolicy = Readonly<{
  routable: boolean;
  published: boolean;
  indexable: boolean;
  indexabilityBlocker: string | null;
  reviewedAt: string;
}>;

export const MARKET_PUBLICATION_POLICY = {
  GB: { routable: true, published: true, indexable: true, indexabilityBlocker: null, reviewedAt: "2026-09-03" },
  DE: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED", reviewedAt: "2026-09-03" },
  IT: { routable: true, published: false, indexable: false, indexabilityBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED", reviewedAt: "2026-09-03" },
  ES: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED", reviewedAt: "2026-09-03" },
  PE: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_PRIVACY_REVIEW_AND_REAL_INVENTORY_REQUIRED", reviewedAt: "2026-09-03" },
  PT: { routable: true, published: false, indexable: false, indexabilityBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED", reviewedAt: "2026-09-03" },
  GR: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED", reviewedAt: "2026-09-03" },
  NL: { routable: true, published: false, indexable: false, indexabilityBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED", reviewedAt: "2026-09-03" },
  SE: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_PRIVACY_REVIEW_AND_PLACEHOLDER_INVENTORY_REMOVAL_REQUIRED", reviewedAt: "2026-09-03" },
  DK: { routable: true, published: true, indexable: false, indexabilityBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED", reviewedAt: "2026-09-03" },
  FI: { routable: true, published: false, indexable: false, indexabilityBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED", reviewedAt: "2026-09-03" },
  NO: { routable: true, published: false, indexable: false, indexabilityBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED", reviewedAt: "2026-09-03" },
  CA: { routable: false, published: false, indexable: false, indexabilityBlocker: "ROUTE_AND_PUBLICATION_NOT_ENABLED", reviewedAt: "2026-09-03" },
} as const satisfies Record<MarketCode, MarketPublicationPolicy>;

export type LocaleMarketRouteProfile = Readonly<{
  locale: SupportedLocale;
  publicSlug: Lowercase<SupportedLocale>;
  enabled: boolean;
  defaultForMarket: boolean;
}>;

export type MarketProfile = Readonly<{
  countryCode: MarketCode;
  publication: MarketPublicationPolicy;
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
    publication: MARKET_PUBLICATION_POLICY.GB,
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
    publication: MARKET_PUBLICATION_POLICY.DE,
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
    publication: MARKET_PUBLICATION_POLICY.IT,
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
    publication: MARKET_PUBLICATION_POLICY.ES,
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
    publication: MARKET_PUBLICATION_POLICY.PE,
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
    publication: MARKET_PUBLICATION_POLICY.PT,
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
    publication: MARKET_PUBLICATION_POLICY.GR,
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
    publication: MARKET_PUBLICATION_POLICY.NL,
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
    publication: MARKET_PUBLICATION_POLICY.SE,
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
    publication: MARKET_PUBLICATION_POLICY.DK,
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
    publication: MARKET_PUBLICATION_POLICY.FI,
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
    publication: MARKET_PUBLICATION_POLICY.NO,
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
    publication: MARKET_PUBLICATION_POLICY.CA,
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

/**
 * Public identity is language-only. Market-specific BCP-47 locales remain
 * internal content variants and are selected after trusted request GEO is
 * resolved; they are never public market authority.
 */
export const LANGUAGE_ROUTE_PROFILES = [
  { language: "en", publicSlug: "en", defaultLocale: "en-GB", localeVariants: ["en-GB", "en-CA"], label: "English", published: true, indexable: true, publicationBlocker: null },
  { language: "de", publicSlug: "de", defaultLocale: "de-DE", localeVariants: ["de-DE"], label: "Deutsch", published: true, indexable: false, publicationBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED" },
  { language: "es", publicSlug: "es", defaultLocale: "es-ES", localeVariants: ["es-ES", "es-PE"], label: "Español", published: true, indexable: false, publicationBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED" },
  { language: "el", publicSlug: "el", defaultLocale: "el-GR", localeVariants: ["el-GR"], label: "Ελληνικά", published: true, indexable: false, publicationBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED" },
  { language: "sv", publicSlug: "sv", defaultLocale: "sv-SE", localeVariants: ["sv-SE"], label: "Svenska", published: true, indexable: false, publicationBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED" },
  { language: "da", publicSlug: "da", defaultLocale: "da-DK", localeVariants: ["da-DK"], label: "Dansk", published: true, indexable: false, publicationBlocker: "LOCAL_LEGAL_REVIEW_REQUIRED" },
  { language: "it", publicSlug: "it", defaultLocale: "it-IT", localeVariants: ["it-IT"], label: "Italiano", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
  { language: "pt", publicSlug: "pt", defaultLocale: "pt-PT", localeVariants: ["pt-PT"], label: "Português", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
  { language: "nl", publicSlug: "nl", defaultLocale: "nl-NL", localeVariants: ["nl-NL"], label: "Nederlands", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
  { language: "fi", publicSlug: "fi", defaultLocale: "fi-FI", localeVariants: ["fi-FI"], label: "Suomi", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
  { language: "nb", publicSlug: "nb", defaultLocale: "nb-NO", localeVariants: ["nb-NO"], label: "Norsk bokmål", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
  { language: "fr", publicSlug: "fr", defaultLocale: "fr-CA", localeVariants: ["fr-CA"], label: "Français", published: false, indexable: false, publicationBlocker: "LOCALIZATION_AND_PUBLICATION_REQUIRED" },
] as const satisfies readonly LanguageRouteProfile[];

export const PUBLISHED_LANGUAGE_ROUTE_PROFILES = LANGUAGE_ROUTE_PROFILES.filter((profile) => profile.published);
export const INDEXABLE_LANGUAGE_ROUTE_PROFILES = LANGUAGE_ROUTE_PROFILES.filter((profile) => profile.published && profile.indexable);

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
  (profile) => profile.publication.published,
);

export const ENABLED_PRESENTATION_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => profile.publication.routable && profile.localeRoutes.some((route) => route.enabled),
);

export const INDEXABLE_MARKET_PROFILES: readonly MarketProfile[] = profiles.filter(
  (profile) => profile.publication.routable && profile.publication.published && profile.publication.indexable,
);

export const GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS = ["en", "sv", "es"] as const;

export const DEFAULT_MARKET_PROFILE = profiles[0];

export function isInitialEuropeanMarket(profile: MarketProfile) {
  return initialEuropeanMarketCodes.has(profile.countryCode);
}

export function marketEditorialPublicationApproved(profile: MarketProfile) {
  return profile.publication.published;
}

export function marketIndexingApproved(profile: MarketProfile) {
  return profile.publication.routable && profile.publication.published && profile.publication.indexable;
}

const byCountry = new Map<MarketCode, MarketProfile>(profiles.map((profile) => [profile.countryCode, profile]));
const byRouteMarket = new Map<string, MarketProfile>(profiles.map((profile) => [profile.routeMarket, profile]));
const byPublicSlug = new Map<string, { market: MarketProfile; route: LocaleMarketRouteProfile }>(
  profiles.flatMap((market) => market.localeRoutes.map((route) => [route.publicSlug, { market, route }] as const)),
);
const byLocale = new Map<SupportedLocale, MarketProfile>(profiles.flatMap((profile) => profile.supportedLocales.map((locale) => [locale, profile] as const)));
const languageBySlug = new Map<string, LanguageRouteProfile>(LANGUAGE_ROUTE_PROFILES.map((profile) => [profile.publicSlug, profile]));
const languageByLocale = new Map<SupportedLocale, LanguageRouteProfile>(LANGUAGE_ROUTE_PROFILES.flatMap((profile) => profile.localeVariants.map((locale) => [locale, profile] as const)));

export function marketProfileByCountry(countryCode: string | null | undefined): MarketProfile | null {
  if (!countryCode) return null;
  return byCountry.get(countryCode.trim().toUpperCase() as MarketCode) ?? null;
}

export function marketProfileByRouteMarket(routeMarket: string | null | undefined): MarketProfile | null {
  if (!routeMarket) return null;
  return byRouteMarket.get(routeMarket.trim().toLowerCase()) ?? null;
}

export function marketProfileByLocale(locale: SupportedLocale): MarketProfile | null {
  return byLocale.get(locale) ?? null;
}

export function languageRouteByPublicSlug(publicSlug: string | null | undefined): LanguageRouteProfile | null {
  if (!publicSlug) return null;
  return languageBySlug.get(publicSlug.trim().toLowerCase()) ?? null;
}

export function languageRouteByLocale(locale: SupportedLocale): LanguageRouteProfile {
  const profile = languageByLocale.get(locale);
  if (!profile) throw new Error(`Language route for ${locale} is missing`);
  return profile;
}

export function languageForLocale(locale: SupportedLocale): SupportedLanguage {
  return languageRouteByLocale(locale).language;
}

export function localeForLanguageAndMarket(language: SupportedLanguage, market: MarketProfile | null | undefined): SupportedLocale {
  const languageProfile = languageRouteByPublicSlug(language);
  if (!languageProfile) throw new Error(`Language route ${language} is missing`);
  const exactMarketVariant = market?.localeRoutes.find((route) => (
    route.enabled
    && languageProfile.localeVariants.includes(route.locale)
  ));
  return exactMarketVariant?.locale ?? languageProfile.defaultLocale;
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

/** Build the language-only public path for an internal locale variant. */
export function publicMarketPath(profile: MarketProfile, locale: SupportedLocale, pathname = "/") {
  // `profile` remains in this compatibility signature for Programme and older
  // callers. It does not contribute to the public URL.
  void profile;
  const route = languageRouteByLocale(locale);
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

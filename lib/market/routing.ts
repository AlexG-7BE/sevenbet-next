import {
  DEFAULT_MARKET_PROFILE,
  localeForLanguageSegment,
  marketProfileByRouteMarket,
  publicMarketPath,
  type MarketProfile,
  type SupportedLocale,
} from "./registry";

export const PRESENTATION_MARKET_HEADER = "x-b4gamble-presentation-market";
export const PRESENTATION_LANGUAGE_HEADER = "x-b4gamble-presentation-language";
export const PRESENTATION_CONTEXT_HEADER = "x-b4gamble-presentation-context";

export type PublicRoutePolicy =
  | "LOCALIZABLE_PUBLIC"
  | "LOCALIZABLE_DYNAMIC"
  | "UNPREFIXED_ONLY"
  | "PROTECTED"
  | "INTERNAL"
  | "LEGAL_REVIEW_GATED";

export type PublicRouteManifestEntry = Readonly<{
  root: string;
  match: "EXACT" | "SUBTREE";
  policy: PublicRoutePolicy;
}>;

/**
 * The single public-prefix allowlist. A route is localizable only when this
 * manifest says so; unknown, legal, protected and internal paths fail closed.
 */
export const PUBLIC_LOCALIZATION_ROUTE_MANIFEST = [
  { root: "", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "best-offers", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "bonuses", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "casinos", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "compare", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "casino", match: "SUBTREE", policy: "LOCALIZABLE_DYNAMIC" },

  { root: "10-steps", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "about", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "bonus-guide", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "catalog", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "contact", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "faq", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "launch-polish-error-harness", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "learn", match: "SUBTREE", policy: "LOCALIZABLE_PUBLIC" },
  { root: "login", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "methodology", match: "EXACT", policy: "LOCALIZABLE_PUBLIC" },
  { root: "responsible-gambling", match: "SUBTREE", policy: "UNPREFIXED_ONLY" },
  { root: "responsible-gaming", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "self-check", match: "EXACT", policy: "UNPREFIXED_ONLY" },
  { root: "tools", match: "SUBTREE", policy: "UNPREFIXED_ONLY" },

  { root: "affiliate-disclosure", match: "EXACT", policy: "LEGAL_REVIEW_GATED" },
  { root: "privacy", match: "EXACT", policy: "LEGAL_REVIEW_GATED" },
  { root: "terms", match: "EXACT", policy: "LEGAL_REVIEW_GATED" },

  { root: "help", match: "SUBTREE", policy: "PROTECTED" },
  { root: "program", match: "SUBTREE", policy: "PROTECTED" },

  { root: ".well-known", match: "SUBTREE", policy: "INTERNAL" },
  { root: "_next", match: "SUBTREE", policy: "INTERNAL" },
  { root: "admin", match: "SUBTREE", policy: "INTERNAL" },
  { root: "api", match: "SUBTREE", policy: "INTERNAL" },
  { root: "editorial-preview", match: "SUBTREE", policy: "INTERNAL" },
  { root: "go", match: "SUBTREE", policy: "INTERNAL" },
  { root: "llms.txt", match: "EXACT", policy: "INTERNAL" },
  { root: "mcp", match: "SUBTREE", policy: "INTERNAL" },
  { root: "outbound", match: "SUBTREE", policy: "INTERNAL" },
  { root: "r", match: "SUBTREE", policy: "INTERNAL" },
] as const satisfies readonly PublicRouteManifestEntry[];

function cleanPathname(pathname: string) {
  const suffixIndex = pathname.search(/[?#]/);
  const clean = (suffixIndex >= 0 ? pathname.slice(0, suffixIndex) : pathname) || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function routeSegments(pathname: string) {
  return cleanPathname(pathname).split("/").filter(Boolean);
}

export function publicRoutePolicy(pathname: string): PublicRoutePolicy | null {
  const segments = routeSegments(pathname);
  const root = segments[0] ?? "";
  const entry = PUBLIC_LOCALIZATION_ROUTE_MANIFEST.find((candidate) => (
    candidate.root === root
    && (candidate.match === "SUBTREE" || segments.length <= 1)
  ));
  return entry?.policy ?? null;
}

export function isLocalizedPublicDestination(pathname: string) {
  const policy = publicRoutePolicy(pathname);
  return policy === "LOCALIZABLE_PUBLIC" || policy === "LOCALIZABLE_DYNAMIC";
}

type PublicMarketRoute = Readonly<{
  market: MarketProfile;
  locale: SupportedLocale;
  pathname: string;
}>;

export type PublicMarketRouteParse =
  | ({ kind: "UNPREFIXED_DEFAULT" } & PublicMarketRoute)
  | ({ kind: "MARKET_DEFAULT" } & PublicMarketRoute)
  | ({ kind: "SECONDARY_LOCALE" } & PublicMarketRoute)
  | ({ kind: "DEFAULT_MARKET_ALIAS"; canonicalPath: string } & PublicMarketRoute)
  | ({ kind: "LEGACY_REDUNDANT_LOCALE"; canonicalPath: string } & PublicMarketRoute)
  | Readonly<{ kind: "INVALID"; pathname: string; reason: "ENCODED_SEPARATOR" | "UNREGISTERED_MARKET" | "UNSUPPORTED_LOCALE" | "ROUTE_NOT_LOCALIZABLE" }>;

function invalid(pathname: string, reason: Extract<PublicMarketRouteParse, { kind: "INVALID" }>["reason"]): PublicMarketRouteParse {
  return { kind: "INVALID", pathname: cleanPathname(pathname), reason };
}

function unprefixedPath(segments: readonly string[]) {
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function parsePublicMarketRoute(pathname: string): PublicMarketRouteParse {
  const clean = cleanPathname(pathname);
  if (/%2f|%5c/i.test(clean)) return invalid(clean, "ENCODED_SEPARATOR");
  const segments = routeSegments(clean);
  const routeMarket = segments[0] ? marketProfileByRouteMarket(segments[0]) : null;

  if (!routeMarket) {
    if (segments[0] && /^[a-z]{2}$/i.test(segments[0]) && !publicRoutePolicy(clean)) {
      return invalid(clean, "UNREGISTERED_MARKET");
    }
    if (!isLocalizedPublicDestination(clean)) return invalid(clean, "ROUTE_NOT_LOCALIZABLE");
    return {
      kind: "UNPREFIXED_DEFAULT",
      market: DEFAULT_MARKET_PROFILE,
      locale: DEFAULT_MARKET_PROFILE.defaultLocale,
      pathname: clean,
    };
  }

  const possibleLanguage = segments[1] ?? null;
  const explicitLocale = localeForLanguageSegment(routeMarket, possibleLanguage);
  const defaultLanguage = routeMarket.defaultLocale.split("-")[0].toLowerCase();
  const redundantDefaultLocale = explicitLocale === routeMarket.defaultLocale && possibleLanguage === defaultLanguage;
  const secondaryLocale = explicitLocale && explicitLocale !== routeMarket.defaultLocale ? explicitLocale : null;

  if (redundantDefaultLocale) {
    const equivalentPathname = unprefixedPath(segments.slice(2));
    if (!isLocalizedPublicDestination(equivalentPathname)) return invalid(clean, "ROUTE_NOT_LOCALIZABLE");
    return {
      kind: "LEGACY_REDUNDANT_LOCALE",
      market: routeMarket,
      locale: routeMarket.defaultLocale,
      pathname: equivalentPathname,
      canonicalPath: publicMarketPath(routeMarket, routeMarket.defaultLocale, equivalentPathname),
    };
  }

  if (secondaryLocale) {
    const equivalentPathname = unprefixedPath(segments.slice(2));
    if (!isLocalizedPublicDestination(equivalentPathname)) return invalid(clean, "ROUTE_NOT_LOCALIZABLE");
    return {
      kind: "SECONDARY_LOCALE",
      market: routeMarket,
      locale: secondaryLocale,
      pathname: equivalentPathname,
    };
  }

  const equivalentPathname = unprefixedPath(segments.slice(1));
  if (!isLocalizedPublicDestination(equivalentPathname)) {
    if (possibleLanguage && /^[a-z]{2,3}$/i.test(possibleLanguage)) {
      return invalid(clean, "UNSUPPORTED_LOCALE");
    }
    return invalid(clean, "ROUTE_NOT_LOCALIZABLE");
  }
  if (routeMarket.countryCode === DEFAULT_MARKET_PROFILE.countryCode) {
    return {
      kind: "DEFAULT_MARKET_ALIAS",
      market: routeMarket,
      locale: routeMarket.defaultLocale,
      pathname: equivalentPathname,
      canonicalPath: publicMarketPath(routeMarket, routeMarket.defaultLocale, equivalentPathname),
    };
  }
  return {
    kind: "MARKET_DEFAULT",
    market: routeMarket,
    locale: routeMarket.defaultLocale,
    pathname: equivalentPathname,
  };
}

export function stripPublicMarketPrefix(pathname: string) {
  const parsed = parsePublicMarketRoute(pathname);
  return parsed.kind === "INVALID" ? cleanPathname(pathname) : parsed.pathname;
}

export function localizePublicPath(profile: MarketProfile, locale: SupportedLocale, pathname: string) {
  const clean = cleanPathname(pathname);
  const suffix = pathname.slice(clean.length);
  const equivalentPathname = stripPublicMarketPrefix(clean);
  return publicMarketPath(
    profile,
    locale,
    isLocalizedPublicDestination(equivalentPathname) ? equivalentPathname : "/",
  ) + suffix;
}

export function localizePublicHref(href: string, currentPathname: string, profile: MarketProfile, locale: SupportedLocale) {
  const current = parsePublicMarketRoute(currentPathname);
  return current.kind !== "INVALID" && isLocalizedPublicDestination(href)
    ? localizePublicPath(profile, locale, href)
    : href;
}

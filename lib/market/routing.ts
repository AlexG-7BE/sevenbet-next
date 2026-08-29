import {
  isInitialEuropeanMarket,
  localeForLanguageSegment,
  localizedMarketPath,
  marketProfileByRouteMarket,
  type MarketProfile,
  type SupportedLocale,
} from "./registry";

export const PRESENTATION_MARKET_HEADER = "x-b4gamble-presentation-market";
export const PRESENTATION_LANGUAGE_HEADER = "x-b4gamble-presentation-language";
export const PRESENTATION_CONTEXT_HEADER = "x-b4gamble-presentation-context";

const localizedPublicRoots = new Set([
  "best-offers",
  "bonuses",
  "casino",
  "casinos",
  "learn",
]);

export type LocalizedPublicPath = Readonly<{
  market: MarketProfile;
  locale: SupportedLocale;
  pathname: string;
}>;

function cleanPathname(pathname: string) {
  const clean = pathname.split(/[?#]/, 1)[0] || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export function isLocalizedPublicDestination(pathname: string) {
  const clean = cleanPathname(pathname);
  if (clean === "/") return true;
  return localizedPublicRoots.has(clean.split("/").filter(Boolean)[0] ?? "");
}

export function parseLocalizedPublicPath(pathname: string): LocalizedPublicPath | null {
  const segments = cleanPathname(pathname).split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const market = marketProfileByRouteMarket(segments[0]);
  if (!market || !isInitialEuropeanMarket(market)) return null;
  const locale = localeForLanguageSegment(market, segments[1]);
  if (!locale) return null;
  const unprefixedPathname = segments.length === 2 ? "/" : `/${segments.slice(2).join("/")}`;
  if (!isLocalizedPublicDestination(unprefixedPathname)) return null;
  return { market, locale, pathname: unprefixedPathname };
}

export function stripLocalizedPublicPrefix(pathname: string) {
  return parseLocalizedPublicPath(pathname)?.pathname ?? cleanPathname(pathname);
}

export function localizePublicPath(
  profile: MarketProfile,
  locale: SupportedLocale,
  pathname: string,
) {
  const unprefixedPathname = stripLocalizedPublicPrefix(pathname);
  return localizedMarketPath(
    profile,
    locale,
    isLocalizedPublicDestination(unprefixedPathname) ? unprefixedPathname : "/",
  );
}

export function localizePublicHref(
  href: string,
  currentPathname: string,
  profile: MarketProfile,
  locale: SupportedLocale,
) {
  return parseLocalizedPublicPath(currentPathname) && isLocalizedPublicDestination(href)
    ? localizePublicPath(profile, locale, href)
    : href;
}

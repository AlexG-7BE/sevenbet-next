import { isLocalizedPublicDestination } from "@/lib/market/routing";
import {
  PUBLISHED_LANGUAGE_ROUTE_PROFILES,
  languageRouteByLocale,
  marketProfileByLocale,
  publicMarketPath,
  type SupportedLanguage,
  type SupportedLocale,
} from "@/lib/market/registry";

export const PROGRAMME_PRESENTATION_CONTEXT = "programme-v1";

export type ProgrammeLocale = Exclude<SupportedLocale, "es-PE" | "en-CA" | "fr-CA">;

export type ProgrammeRouteDefinition = Readonly<{
  locale: ProgrammeLocale;
  language: SupportedLanguage;
  path: string;
  legacyPaths: readonly string[];
  transcriptionLanguage: string;
}>;

const legacyProgrammePaths: Partial<Record<SupportedLanguage, readonly string[]>> = {
  sv: ["/se/program"],
  da: ["/dk/program"],
  el: ["/gr/program"],
  nb: ["/no/program"],
};

function isProgrammeCatalogLocale(locale: SupportedLocale): locale is ProgrammeLocale {
  return locale !== "es-PE" && locale !== "en-CA" && locale !== "fr-CA";
}

/** One canonical published-language registry drives both Home and Programme. */
export const PROGRAMME_ROUTES: readonly ProgrammeRouteDefinition[] = PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => {
  if (!isProgrammeCatalogLocale(profile.defaultLocale)) {
    throw new Error(`Published language ${profile.language} has no Programme catalog`);
  }
  return {
    locale: profile.defaultLocale,
    language: profile.language,
    path: profile.language === "en" ? "/program" : `/${profile.publicSlug}/program`,
    legacyPaths: legacyProgrammePaths[profile.language] ?? [],
    transcriptionLanguage: profile.language === "nb" ? "no" : profile.language,
  };
});

export const PROGRAMME_LOCALES: readonly ProgrammeLocale[] = PROGRAMME_ROUTES.map((route) => route.locale);

const localeSet = new Set<SupportedLocale>(PROGRAMME_LOCALES);
const routeByLocale = new Map<ProgrammeLocale, ProgrammeRouteDefinition>(
  PROGRAMME_ROUTES.map((route) => [route.locale, route]),
);
const routeByLanguage = new Map<SupportedLanguage, ProgrammeRouteDefinition>(
  PROGRAMME_ROUTES.map((route) => [route.language, route]),
);

export function isProgrammeLocale(value: unknown): value is ProgrammeLocale {
  return typeof value === "string" && localeSet.has(value as SupportedLocale);
}

export function parseProgrammeLocale(value: unknown): ProgrammeLocale {
  if (!isProgrammeLocale(value)) throw new TypeError("Unsupported Programme locale");
  return value;
}

export function programmeRoute(locale: ProgrammeLocale) {
  const route = routeByLocale.get(locale);
  if (!route) throw new TypeError("Unsupported Programme locale");
  return route;
}

export function programmePath(locale: ProgrammeLocale) {
  return programmeRoute(locale).path;
}

/** Resolve any internal locale variant through its canonical Programme language route. */
export function programmePathForPresentationLocale(locale: SupportedLocale) {
  return routeByLanguage.get(languageRouteByLocale(locale).language)?.path ?? "/program";
}

export function programmeTranscriptionLanguage(locale: ProgrammeLocale) {
  return programmeRoute(locale).transcriptionLanguage;
}

const localizedHelpLocales = new Set<ProgrammeLocale>([
  "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR",
]);

export function programmeHelpPath(locale: ProgrammeLocale) {
  const profile = marketProfileByLocale(locale);
  return profile && localizedHelpLocales.has(locale)
    ? publicMarketPath(profile, locale, "/help")
    : "/help";
}

/** Localize ordinary public links for every published language route. */
export function programmePublicHref(locale: ProgrammeLocale, pathname: string) {
  const profile = marketProfileByLocale(locale);
  return profile && isLocalizedPublicDestination(pathname, profile)
    ? publicMarketPath(profile, locale, pathname)
    : pathname;
}

function cleanPathname(value: string) {
  const suffixIndex = value.search(/[?#]/);
  const pathname = (suffixIndex >= 0 ? value.slice(0, suffixIndex) : value) || "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export type ProgrammeRouteParse = Readonly<{
  route: ProgrammeRouteDefinition;
  pathname: string;
  canonicalPathname: string;
  rendererPathname: string;
  trailingSlash: boolean;
  legacy: boolean;
}>;

/**
 * Parse canonical language routes and bounded legacy market-shaped aliases. A
 * suffix is accepted solely for the shared Programme not-found boundary.
 */
export function parseProgrammeRoute(pathname: string): ProgrammeRouteParse | null {
  const clean = cleanPathname(pathname);
  if (/%2f|%5c/i.test(clean)) return null;
  const trailingSlash = clean.length > 1 && clean.endsWith("/");
  const normalized = trailingSlash ? clean.replace(/\/+$/, "") : clean;
  for (const route of PROGRAMME_ROUTES) {
    for (const candidate of [route.path, ...route.legacyPaths]) {
      if (normalized !== candidate && !normalized.startsWith(`${candidate}/`)) continue;
      const suffix = normalized.slice(candidate.length);
      return {
        route,
        pathname: normalized,
        canonicalPathname: `${route.path}${suffix}`,
        rendererPathname: `/program${suffix}`,
        trailingSlash,
        legacy: candidate !== route.path,
      };
    }
  }
  return null;
}

export function programmeLocaleFromPath(value: unknown): ProgrammeLocale | null {
  if (typeof value !== "string") return null;
  const parsed = parseProgrammeRoute(value);
  return parsed && parsed.pathname === parsed.route.path ? parsed.route.locale : null;
}

const programmeAuthStates = new Set([
  "google-return",
  "google-error",
  "google-link-return",
  "google-link-error",
]);

/** Keep only callback state the Programme client explicitly understands. */
export function safeProgrammePresentationSearch(value: URLSearchParams | string) {
  const input = typeof value === "string" ? new URLSearchParams(value) : value;
  const output = new URLSearchParams();
  const auth = input.get("auth");
  if (auth && programmeAuthStates.has(auth)) {
    output.set("auth", auth);
    if (auth.endsWith("error") && input.get("error") === "account_not_linked") {
      output.set("error", "account_not_linked");
    }
  }
  const query = output.toString();
  return query ? `?${query}` : "";
}

export function programmeLocaleHref(locale: ProgrammeLocale, value: URLSearchParams | string = "") {
  return `${programmePath(locale)}${safeProgrammePresentationSearch(value)}`;
}

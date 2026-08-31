import type { MarketCode, SupportedLocale } from "@/lib/market/registry";

export const PROGRAMME_PRESENTATION_CONTEXT = "programme-v1";

export const PROGRAMME_LOCALES = [
  "en-GB",
  "de-DE",
  "es-ES",
  "sv-SE",
  "da-DK",
  "el-GR",
  "it-IT",
  "pt-PT",
  "nl-NL",
  "fi-FI",
  "nb-NO",
] as const satisfies readonly SupportedLocale[];

export type ProgrammeLocale = (typeof PROGRAMME_LOCALES)[number];

export type ProgrammeRouteDefinition = Readonly<{
  locale: ProgrammeLocale;
  marketCode: MarketCode;
  routeMarket: string;
  path: string;
  transcriptionLanguage: string;
}>;

export const PROGRAMME_ROUTES = [
  { locale: "en-GB", marketCode: "GB", routeMarket: "gb", path: "/program", transcriptionLanguage: "en" },
  { locale: "de-DE", marketCode: "DE", routeMarket: "de", path: "/de/program", transcriptionLanguage: "de" },
  { locale: "es-ES", marketCode: "ES", routeMarket: "es", path: "/es/program", transcriptionLanguage: "es" },
  { locale: "sv-SE", marketCode: "SE", routeMarket: "se", path: "/se/program", transcriptionLanguage: "sv" },
  { locale: "da-DK", marketCode: "DK", routeMarket: "dk", path: "/dk/program", transcriptionLanguage: "da" },
  { locale: "el-GR", marketCode: "GR", routeMarket: "gr", path: "/gr/program", transcriptionLanguage: "el" },
  { locale: "it-IT", marketCode: "IT", routeMarket: "it", path: "/it/program", transcriptionLanguage: "it" },
  { locale: "pt-PT", marketCode: "PT", routeMarket: "pt", path: "/pt/program", transcriptionLanguage: "pt" },
  { locale: "nl-NL", marketCode: "NL", routeMarket: "nl", path: "/nl/program", transcriptionLanguage: "nl" },
  { locale: "fi-FI", marketCode: "FI", routeMarket: "fi", path: "/fi/program", transcriptionLanguage: "fi" },
  { locale: "nb-NO", marketCode: "NO", routeMarket: "no", path: "/no/program", transcriptionLanguage: "no" },
] as const satisfies readonly ProgrammeRouteDefinition[];

const localeSet = new Set<string>(PROGRAMME_LOCALES);
const routeByLocale = new Map<ProgrammeLocale, ProgrammeRouteDefinition>(
  PROGRAMME_ROUTES.map((route) => [route.locale, route]),
);

export function isProgrammeLocale(value: unknown): value is ProgrammeLocale {
  return typeof value === "string" && localeSet.has(value);
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

export function programmeTranscriptionLanguage(locale: ProgrammeLocale) {
  return programmeRoute(locale).transcriptionLanguage;
}

const localizedHelpLocales = new Set<ProgrammeLocale>([
  "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR",
]);

export function programmeHelpPath(locale: ProgrammeLocale) {
  const route = programmeRoute(locale);
  return localizedHelpLocales.has(locale) ? `/${route.routeMarket}/help` : "/help";
}

/** Localize ordinary public links only for the already publication-approved first wave. */
export function programmePublicHref(locale: ProgrammeLocale, pathname: string) {
  if (!localizedHelpLocales.has(locale)) return pathname;
  const prefix = `/${programmeRoute(locale).routeMarket}`;
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function cleanPathname(value: string) {
  const suffixIndex = value.search(/[?#]/);
  const pathname = (suffixIndex >= 0 ? value.slice(0, suffixIndex) : value) || "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export type ProgrammeRouteParse = Readonly<{
  route: ProgrammeRouteDefinition;
  pathname: string;
  rendererPathname: string;
  trailingSlash: boolean;
}>;

/**
 * Parse only the Founder-approved Programme route family. A suffix is accepted
 * solely so an unknown child can reach the shared Programme not-found boundary.
 */
export function parseProgrammeRoute(pathname: string): ProgrammeRouteParse | null {
  const clean = cleanPathname(pathname);
  if (/%2f|%5c/i.test(clean)) return null;
  const trailingSlash = clean.length > 1 && clean.endsWith("/");
  const normalized = trailingSlash ? clean.replace(/\/+$/, "") : clean;
  for (const route of PROGRAMME_ROUTES) {
    if (normalized !== route.path && !normalized.startsWith(`${route.path}/`)) continue;
    const suffix = normalized.slice(route.path.length);
    return {
      route,
      pathname: normalized,
      rendererPathname: `/program${suffix}`,
      trailingSlash,
    };
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

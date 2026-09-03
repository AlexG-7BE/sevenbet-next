import {
  languageRouteByLocale,
  languageRouteByPublicSlug,
  localeMarketRoute,
  marketProfileByCountry,
  type SupportedLanguage,
  type SupportedLocale,
} from "./registry";
import type { PresentationPreference } from "./presentation-resolver";

export const PRESENTATION_PREFERENCE_COOKIE = "b4gamble_presentation";
const preferenceVersion = "v2";

export function serializePresentationPreference(language: SupportedLanguage) {
  const profile = languageRouteByPublicSlug(language);
  if (!profile) throw new Error("Unsupported presentation preference");
  return `${preferenceVersion}.${profile.language}`;
}

export function parsePresentationPreference(value: string | null | undefined): PresentationPreference | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts[0] === preferenceVersion && parts.length === 2) {
    const profile = languageRouteByPublicSlug(parts[1]);
    return profile ? { language: profile.language } : null;
  }

  // Read old v1 market+locale preferences only as a migration aid. The market
  // segment is validated against its former profile and then discarded.
  if (parts[0] === "v1" && parts.length === 3) {
    const profile = marketProfileByCountry(parts[1]);
    const locale = parts[2] as SupportedLocale;
    if (!profile || !localeMarketRoute(profile, locale)?.enabled) return null;
    return { language: languageRouteByLocale(locale).language };
  }
  return null;
}

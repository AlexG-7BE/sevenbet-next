import {
  isInitialEuropeanMarket,
  marketProfileByCountry,
  type MarketProfile,
  type SupportedLocale,
} from "./registry";
import type { PresentationPreference } from "./presentation-resolver";

export const PRESENTATION_PREFERENCE_COOKIE = "b4gamble_presentation";
const preferenceVersion = "v1";

export function serializePresentationPreference(profile: MarketProfile, locale: SupportedLocale) {
  if (!isInitialEuropeanMarket(profile) || !profile.supportedLocales.includes(locale)) {
    throw new Error("Unsupported presentation preference");
  }
  return `${preferenceVersion}.${profile.countryCode}.${locale}`;
}

export function parsePresentationPreference(value: string | null | undefined): PresentationPreference | null {
  if (!value) return null;
  const [version, countryCode, locale, ...unexpected] = value.split(".");
  if (version !== preferenceVersion || !countryCode || !locale || unexpected.length > 0) return null;
  const profile = marketProfileByCountry(countryCode);
  if (!profile || !isInitialEuropeanMarket(profile) || !profile.supportedLocales.includes(locale as SupportedLocale)) return null;
  return { countryCode: profile.countryCode, locale: locale as SupportedLocale };
}

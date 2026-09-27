/**
 * Swedish, Danish and German presentation of casino editorial text
 * (Founder, 27 September 2026 — docs/07_Decisions/REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27.md).
 *
 * Casino editorial text is written once, in English, in the published casino
 * snapshots and editorial reviews. This catalog translates it at the public
 * presentation boundary, keyed by the exact English source text (trimmed,
 * whitespace collapsed). A source the catalog does not know — including any
 * later editorial change to the English — is shown as written, so a stale
 * translation can never stand in for newer English copy. Numbers, amounts,
 * brand, operator, regulator and game names are kept as in the source. Offer
 * terms are not catalogued: they stay exactly as published (RFC-037).
 */
import { CASINO_EDITORIAL_ENTRIES } from "./entries";
import { CASINO_EDITORIAL_NATIVE_TEXT } from "./native";
import { CASINO_EDITORIAL_LANGUAGES, type CasinoEditorialEntry, type CasinoEditorialLanguage } from "./types";

export { CASINO_EDITORIAL_LANGUAGES, CASINO_EDITORIAL_NATIVE_TEXT };
export type { CasinoEditorialEntry, CasinoEditorialLanguage };

/**
 * Game-category labels left untranslated in German: every German rendering
 * would name a category hidden in Germany (lib/market-access/register.ts) and
 * break the German terminology rule (lib/i18n/german-terminology.ts).
 */
export const GERMAN_HIDDEN_CATEGORY_LABELS = [
  "Live Casino", "Live casino", "Live games", "Table Games", "Table games", "Casino",
  "Poker", "Video Poker", "Jackpots", "Blackjack", "Roulette", "Baccarat",
] as const;

export function normalizeCasinoEditorialSource(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/** The catalog language for a page language or locale ("sv", "da-DK", "de-DE"), or null. */
export function casinoEditorialLanguage(language: string | null | undefined): CasinoEditorialLanguage | null {
  const primary = language?.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  return (CASINO_EDITORIAL_LANGUAGES as readonly string[]).includes(primary) ? primary as CasinoEditorialLanguage : null;
}

const translations = new Map<CasinoEditorialLanguage, Map<string, string>>(
  CASINO_EDITORIAL_LANGUAGES.map((language) => [language, new Map<string, string>()]),
);
const textInLanguage = new Map<CasinoEditorialLanguage, Set<string>>(
  CASINO_EDITORIAL_LANGUAGES.map((language) => [language, new Set<string>(
    CASINO_EDITORIAL_NATIVE_TEXT[language].map(normalizeCasinoEditorialSource),
  )]),
);
const sourcesByTranslation = new Map<string, string[]>();

for (const entry of CASINO_EDITORIAL_ENTRIES) {
  const source = normalizeCasinoEditorialSource(entry.en);
  for (const language of CASINO_EDITORIAL_LANGUAGES) {
    const value = entry[language];
    if (!value?.trim()) continue;
    const translated = normalizeCasinoEditorialSource(value);
    translations.get(language)!.set(source, value);
    textInLanguage.get(language)!.add(translated);
    if (translated === source) continue;
    const sources = sourcesByTranslation.get(translated) ?? [];
    if (!sources.includes(entry.en)) sources.push(entry.en);
    sourcesByTranslation.set(translated, sources);
  }
}

export function casinoEditorialEntries(): readonly CasinoEditorialEntry[] {
  return CASINO_EDITORIAL_ENTRIES;
}

/** The catalog translation of an exact English source, or null when the catalog has none. */
export function casinoEditorialTranslation(text: string, language: string | null | undefined) {
  const target = casinoEditorialLanguage(language);
  if (!target) return null;
  return translations.get(target)!.get(normalizeCasinoEditorialSource(text)) ?? null;
}

/** The translation when the exact English source is known; otherwise the text exactly as given. */
export function translateCasinoEditorialText(text: string, language: string | null | undefined) {
  return casinoEditorialTranslation(text, language) ?? text;
}

/**
 * Whether text already reads in the catalog language: a catalog translation
 * into it, or published text written in it. English source text that fell
 * back untranslated is not.
 */
export function isCasinoEditorialTextInLanguage(text: string, language: string | null | undefined) {
  const target = casinoEditorialLanguage(language);
  return Boolean(target && textInLanguage.get(target)!.has(normalizeCasinoEditorialSource(text)));
}

/** The English source(s) of a catalog translation; unknown text has none. */
export function casinoEditorialSourceTexts(text: string): readonly string[] {
  return sourcesByTranslation.get(normalizeCasinoEditorialSource(text)) ?? [];
}

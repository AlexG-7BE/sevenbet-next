export const CASINO_EDITORIAL_LANGUAGES = ["sv", "da", "de"] as const;

export type CasinoEditorialLanguage = (typeof CASINO_EDITORIAL_LANGUAGES)[number];

/**
 * One English editorial source string and its presentation in each catalog
 * language. `en` is the exact published English text; lookups compare it
 * trimmed and with whitespace collapsed, nothing looser.
 */
export type CasinoEditorialEntry = Readonly<{
  en: string;
  sv: string;
  da: string;
  /**
   * Null only for a game-category label whose every German rendering would
   * name a category Germany hides (see GERMAN_HIDDEN_CATEGORY_LABELS); the
   * label then keeps its source text.
   */
  de: string | null;
}>;

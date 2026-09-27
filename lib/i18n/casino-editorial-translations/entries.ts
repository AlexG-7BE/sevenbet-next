import { FAQ_ENTRIES } from "./faq";
import { HIGHLIGHT_ENTRIES } from "./highlights";
import { LABEL_ENTRIES } from "./labels";
import { OFFER_ENTRIES } from "./offers";
import { REVIEW_ENTRIES } from "./reviews";
import { SUMMARY_ENTRIES } from "./summaries";
import type { CasinoEditorialEntry } from "./types";

/**
 * Every English editorial source string published on 27 September 2026 that a
 * reader of a Swedish, Danish or German page sees (or that structured data
 * carries), with its translations. Source: Production's public casino and
 * bonus API (global projection) and the published English review pages.
 */
export const CASINO_EDITORIAL_ENTRIES: readonly CasinoEditorialEntry[] = [
  ...LABEL_ENTRIES,
  ...OFFER_ENTRIES,
  ...FAQ_ENTRIES,
  ...HIGHLIGHT_ENTRIES,
  ...SUMMARY_ENTRIES,
  ...REVIEW_ENTRIES,
];

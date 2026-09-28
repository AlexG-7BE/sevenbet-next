import { FAQ_ENTRIES } from "./faq";
import { HIGHLIGHT_ENTRIES } from "./highlights";
import { LABEL_ENTRIES } from "./labels";
import { OFFER_ENTRIES } from "./offers";
import { REVIEW_ENTRIES } from "./reviews";
import { SUMMARY_ENTRIES } from "./summaries";
import type { CasinoEditorialEntry } from "./types";

/**
 * Every English casino editorial source string and English offer term
 * published on 27 September 2026 that a reader of a Swedish, Danish or German
 * page sees (or that structured data carries), with its translations. Source:
 * Production's public casino and bonus API (global projection, read with
 * Accept-Language: en) and the published English review pages. Offer terms are
 * translated by Founder decision (OFFER-TERMS-TRANSLATIONS-SV-DA-DE-2026-09-27).
 */
export const CASINO_EDITORIAL_ENTRIES: readonly CasinoEditorialEntry[] = [
  ...LABEL_ENTRIES,
  ...OFFER_ENTRIES,
  ...FAQ_ENTRIES,
  ...HIGHLIGHT_ENTRIES,
  ...SUMMARY_ENTRIES,
  ...REVIEW_ENTRIES,
];

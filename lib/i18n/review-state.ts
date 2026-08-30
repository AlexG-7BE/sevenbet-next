import type { SupportedLocale } from "@/lib/market/registry";

export type TranslationReviewState = Readonly<{
  content: "SOURCE_BASELINE" | "MACHINE_TRANSLATED";
  aiLanguageQa: "NOT_APPLICABLE_TO_SOURCE_BASELINE" | "AI_LANGUAGE_QA_REQUIRED" | "AI_LANGUAGE_QA_PASSED";
  founderPublication: "SOURCE_BASELINE_AUTHORITY" | "FOUNDER_PUBLICATION_NOT_ACCEPTED" | "FOUNDER_PUBLICATION_ACCEPTED";
  legalReview: "GB_SOURCE_REVIEWED" | "REQUIRED";
  marketEvidenceReview: "GB_BASELINE" | "FIRST_WAVE_EVIDENCE_REVIEWED" | "REQUIRED";
  indexingAuthority: "GB_SOURCE_BASELINE" | "NOT_ACTIVATED" | "FOUNDER_INDEXING_ACTIVATED";
}>;

const sourceBaseline: TranslationReviewState = {
  content: "SOURCE_BASELINE",
  aiLanguageQa: "NOT_APPLICABLE_TO_SOURCE_BASELINE",
  founderPublication: "SOURCE_BASELINE_AUTHORITY",
  legalReview: "GB_SOURCE_REVIEWED",
  marketEvidenceReview: "GB_BASELINE",
  indexingAuthority: "GB_SOURCE_BASELINE",
};

const machineTranslated: TranslationReviewState = {
  content: "MACHINE_TRANSLATED",
  aiLanguageQa: "AI_LANGUAGE_QA_PASSED",
  founderPublication: "FOUNDER_PUBLICATION_NOT_ACCEPTED",
  legalReview: "REQUIRED",
  marketEvidenceReview: "REQUIRED",
  indexingAuthority: "NOT_ACTIVATED",
};

const firstWavePublicationAccepted: TranslationReviewState = {
  ...machineTranslated,
  founderPublication: "FOUNDER_PUBLICATION_ACCEPTED",
  marketEvidenceReview: "FIRST_WAVE_EVIDENCE_REVIEWED",
};

const architectureOnlyTranslated: TranslationReviewState = {
  ...machineTranslated,
  aiLanguageQa: "AI_LANGUAGE_QA_REQUIRED",
};

/**
 * AI_LANGUAGE_QA_PASSED records the bounded automated catalog report in
 * `docs/internationalisation/ai-language-qa-report.json`. It is not human,
 * native-speaker, legal or publication review. Founder publication acceptance
 * is separately recorded only for the five explicitly accepted locales.
 */
export const TRANSLATION_REVIEW_STATE = {
  "en-GB": sourceBaseline,
  "de-DE": firstWavePublicationAccepted,
  "it-IT": machineTranslated,
  "es-ES": firstWavePublicationAccepted,
  "pt-PT": machineTranslated,
  "el-GR": firstWavePublicationAccepted,
  "nl-NL": machineTranslated,
  "sv-SE": firstWavePublicationAccepted,
  "da-DK": firstWavePublicationAccepted,
  "fi-FI": machineTranslated,
  "nb-NO": machineTranslated,
  "en-CA": architectureOnlyTranslated,
  "fr-CA": architectureOnlyTranslated,
} as const satisfies Record<SupportedLocale, TranslationReviewState>;

export function translationReviewState(locale: SupportedLocale) {
  return TRANSLATION_REVIEW_STATE[locale];
}

export function founderEditorialPublicationAccepted(locale: SupportedLocale) {
  return translationReviewState(locale).founderPublication === "FOUNDER_PUBLICATION_ACCEPTED";
}

export function publicTranslationIndexingApproved(locale: SupportedLocale) {
  const state = translationReviewState(locale);
  if (state.content === "SOURCE_BASELINE") return state.indexingAuthority === "GB_SOURCE_BASELINE";
  return state.aiLanguageQa === "AI_LANGUAGE_QA_PASSED"
    && state.founderPublication === "FOUNDER_PUBLICATION_ACCEPTED"
    && state.marketEvidenceReview !== "REQUIRED"
    && state.legalReview !== "REQUIRED"
    && state.indexingAuthority === "FOUNDER_INDEXING_ACTIVATED";
}

export function legalBodyPublicationApproved(locale: SupportedLocale) {
  return translationReviewState(locale).legalReview === "GB_SOURCE_REVIEWED";
}

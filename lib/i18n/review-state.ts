import type { SupportedLocale } from "@/lib/market/registry";

export type TranslationReviewState = Readonly<{
  content: "APPROVED_BASELINE" | "MACHINE_ASSISTED_DRAFT";
  linguisticReview: "COMPLETED" | "REQUIRED";
  legalReview: "GB_SOURCE_REVIEWED" | "REQUIRED";
  marketEvidenceReview: "GB_BASELINE" | "REQUIRED";
  indexingApproved: boolean;
}>;

const approvedBaseline: TranslationReviewState = {
  content: "APPROVED_BASELINE",
  linguisticReview: "COMPLETED",
  legalReview: "GB_SOURCE_REVIEWED",
  marketEvidenceReview: "GB_BASELINE",
  indexingApproved: true,
};

const machineDraft: TranslationReviewState = {
  content: "MACHINE_ASSISTED_DRAFT",
  linguisticReview: "REQUIRED",
  legalReview: "REQUIRED",
  marketEvidenceReview: "REQUIRED",
  indexingApproved: false,
};

export const TRANSLATION_REVIEW_STATE = {
  "en-GB": approvedBaseline,
  "de-DE": machineDraft,
  "it-IT": machineDraft,
  "es-ES": machineDraft,
  "pt-PT": machineDraft,
  "el-GR": machineDraft,
  "nl-NL": machineDraft,
  "sv-SE": machineDraft,
  "da-DK": machineDraft,
  "fi-FI": machineDraft,
  "nb-NO": machineDraft,
  "en-CA": machineDraft,
  "fr-CA": machineDraft,
} as const satisfies Record<SupportedLocale, TranslationReviewState>;

export function translationReviewState(locale: SupportedLocale) {
  return TRANSLATION_REVIEW_STATE[locale];
}

export function publicTranslationIndexingApproved(locale: SupportedLocale) {
  return translationReviewState(locale).indexingApproved;
}

export function legalBodyPublicationApproved(locale: SupportedLocale) {
  return translationReviewState(locale).legalReview === "GB_SOURCE_REVIEWED";
}

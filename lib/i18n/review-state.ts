import { marketIndexingApproved, marketProfileByLocale, type SupportedLocale } from "@/lib/market/registry";

export type TranslationReviewState = Readonly<{
  content: "SOURCE_BASELINE" | "MACHINE_TRANSLATED";
  publicExperience: "ARCHITECTURE_ONLY" | "HOME_READY" | "PUBLIC_CORE_READY";
  aiLanguageQa: "NOT_APPLICABLE_TO_SOURCE_BASELINE" | "AI_LANGUAGE_QA_REQUIRED" | "AI_LANGUAGE_QA_PASSED";
  founderPublication: "SOURCE_BASELINE_AUTHORITY" | "FOUNDER_PUBLICATION_NOT_ACCEPTED" | "FOUNDER_PUBLICATION_ACCEPTED";
  legalReview: "GB_SOURCE_REVIEWED" | "REQUIRED";
  marketEvidenceReview: "GB_BASELINE" | "FIRST_WAVE_EVIDENCE_REVIEWED" | "AUTHORITATIVE_MARKET_EVIDENCE_REVIEWED" | "REQUIRED";
}>;

const sourceBaseline: TranslationReviewState = {
  content: "SOURCE_BASELINE",
  publicExperience: "PUBLIC_CORE_READY",
  aiLanguageQa: "NOT_APPLICABLE_TO_SOURCE_BASELINE",
  founderPublication: "SOURCE_BASELINE_AUTHORITY",
  legalReview: "GB_SOURCE_REVIEWED",
  marketEvidenceReview: "GB_BASELINE",
};

const machineTranslated: TranslationReviewState = {
  content: "MACHINE_TRANSLATED",
  publicExperience: "HOME_READY",
  aiLanguageQa: "AI_LANGUAGE_QA_PASSED",
  founderPublication: "FOUNDER_PUBLICATION_NOT_ACCEPTED",
  legalReview: "REQUIRED",
  marketEvidenceReview: "REQUIRED",
};

const firstWavePublicationAccepted: TranslationReviewState = {
  ...machineTranslated,
  publicExperience: "PUBLIC_CORE_READY",
  founderPublication: "FOUNDER_PUBLICATION_ACCEPTED",
  marketEvidenceReview: "FIRST_WAVE_EVIDENCE_REVIEWED",
};

const authoritativeMarketPublicationAccepted: TranslationReviewState = {
  ...machineTranslated,
  publicExperience: "PUBLIC_CORE_READY",
  founderPublication: "FOUNDER_PUBLICATION_ACCEPTED",
  marketEvidenceReview: "AUTHORITATIVE_MARKET_EVIDENCE_REVIEWED",
};

const architectureOnlyTranslated: TranslationReviewState = {
  ...machineTranslated,
  publicExperience: "ARCHITECTURE_ONLY",
  aiLanguageQa: "AI_LANGUAGE_QA_REQUIRED",
};

/**
 * AI_LANGUAGE_QA_PASSED records the bounded automated catalog report in
 * `docs/internationalisation/ai-language-qa-report.json`. It is not human,
 * native-speaker, legal or publication review. Founder publication acceptance
 * is separately recorded only for the explicitly accepted locales.
 */
export const TRANSLATION_REVIEW_STATE = {
  "en-GB": sourceBaseline,
  "de-DE": firstWavePublicationAccepted,
  "it-IT": machineTranslated,
  "es-ES": firstWavePublicationAccepted,
  "es-PE": authoritativeMarketPublicationAccepted,
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

export function homeTranslationReady(locale: SupportedLocale) {
  return translationReviewState(locale).publicExperience === "HOME_READY"
    || translationReviewState(locale).publicExperience === "PUBLIC_CORE_READY";
}

export function publicCoreTranslationReady(locale: SupportedLocale) {
  return translationReviewState(locale).publicExperience === "PUBLIC_CORE_READY";
}

export function publicTranslationIndexingApproved(locale: SupportedLocale) {
  const profile = marketProfileByLocale(locale);
  return profile ? marketIndexingApproved(profile) : false;
}

export function legalBodyPublicationApproved(locale: SupportedLocale) {
  return translationReviewState(locale).legalReview === "GB_SOURCE_REVIEWED";
}

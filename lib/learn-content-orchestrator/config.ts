import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "@/lib/market/registry";

/**
 * Historical operational state of the retired server-side orchestrator
 * (LEARN-CHATGPT-SCHEDULER-2026-09-30). The row is kept as evidence; no code
 * reads or writes it any more.
 */
export const LEARN_CONTENT_STATE_KEY = "learn-content-orchestrator:v1";
/** English guides are the source a run in another language may localize (LEARN-COMMERCIAL-LOCALIZED-2026-09-30). */
export const LEARN_CONTENT_SOURCE_LOCALE = "en-GB";

/** The published inventory a cycle sees: its own language plus the English source guides. */
export function learnContentInventoryLocales(runLocale: string) {
  return [...new Set([runLocale, LEARN_CONTENT_SOURCE_LOCALE])];
}

type LearnContentEnvironment = Record<string, string | undefined> & {
  LEARN_CONTENT_LOCALES?: string;
};

export type LearnContentLocale = {
  language: string;
  locale: string;
  publicPathPrefix: string;
};

/**
 * The ordered launch languages an editorial cycle rotates through. The order is
 * the hosted `LEARN_CONTENT_LOCALES` value (default `en`); every entry must be a
 * published language and appear once.
 */
export function resolveLearnContentLaunchLocales(environment: LearnContentEnvironment = process.env): LearnContentLocale[] {
  const requested = (environment.LEARN_CONTENT_LOCALES?.trim() || "en").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!requested.length || requested.length > PUBLISHED_LANGUAGE_ROUTE_PROFILES.length || new Set(requested).size !== requested.length) {
    throw new Error("LEARN_CONTENT_LOCALES must contain unique published language slugs");
  }
  return requested.map((language) => {
    const profile = PUBLISHED_LANGUAGE_ROUTE_PROFILES.find((candidate) => candidate.language === language);
    if (!profile) throw new Error(`LEARN_CONTENT_LOCALES contains an unpublished language: ${language}`);
    return { language: profile.language, locale: profile.defaultLocale, publicPathPrefix: `/${profile.publicSlug}` };
  });
}

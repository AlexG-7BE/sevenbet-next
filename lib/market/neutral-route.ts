import { homeTranslationReady } from "@/lib/i18n/review-state";

import { resolvePresentationContext, type PresentationPreference } from "./presentation-resolver";
import { languageRouteByPublicSlug, type SupportedLanguage, type SupportedLocale } from "./registry";

/** Whether a public language route may present the visitor's language and locale. */
export function publicPresentationAvailable(language: SupportedLanguage, locale: SupportedLocale) {
  const route = languageRouteByPublicSlug(language);
  return Boolean(route)
    && route!.localeVariants.includes(locale)
    && homeTranslationReady(locale)
    && (process.env.VERCEL_ENV !== "production" || route!.published);
}

/**
 * The locale an unprefixed public path (`/casinos`) answers with: the language of the
 * middleware's 307. One function serves the middleware and the pages, so a link rendered
 * past that redirect lands exactly where the redirect would have sent the visitor.
 */
export function neutralRouteLocale(input: {
  preference: PresentationPreference | null;
  trustedCountryCode: string | null | undefined;
  acceptLanguage: string | null | undefined;
}): SupportedLocale {
  const resolution = resolvePresentationContext(input);
  return publicPresentationAvailable(resolution.language, resolution.locale)
    ? resolution.locale
    : resolvePresentationContext({ routeLanguage: "en" }).locale;
}

import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import {
  DEFAULT_MARKET_PROFILE,
  LANGUAGE_ROUTE_PROFILES,
  publicMarketPath,
  type SupportedLocale,
} from "@/lib/market/registry";
import { absoluteUrl } from "@/lib/site";

function articleLanguageRoute(locale: string) {
  return LANGUAGE_ROUTE_PROFILES.find((profile) => (profile.localeVariants as readonly string[]).includes(locale))
    ?? LANGUAGE_ROUTE_PROFILES[0];
}

/**
 * A guide exists only in the language it was published in; nothing links a guide to a
 * translation. Its hreflang therefore names that language alone (plus x-default for an
 * English guide) instead of the default four-language set, whose de/sv/da URLs answered 404
 * for all 27 guides (audit 27 Sep 2026).
 */
export function articleLanguageAlternates(article: Pick<PublicArticle, "category" | "slug" | "locale">): Record<string, string> {
  const language = articleLanguageRoute(article.locale);
  const pathname = articlePath(article);
  return {
    [language.language]: absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale as SupportedLocale, pathname)),
    ...(language.language === "en" ? { "x-default": absoluteUrl(pathname) } : {}),
  };
}

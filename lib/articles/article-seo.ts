import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import {
  DEFAULT_MARKET_PROFILE,
  LANGUAGE_ROUTE_PROFILES,
  publicMarketPath,
  type SupportedLocale,
} from "@/lib/market/registry";
import { absoluteUrl, originForSite } from "@/lib/site";
import type { SiteClass } from "@/lib/site/host-gate";

function articleLanguageRoute(locale: string) {
  return LANGUAGE_ROUTE_PROFILES.find((profile) => (profile.localeVariants as readonly string[]).includes(locale))
    ?? LANGUAGE_ROUTE_PROFILES[0];
}

/**
 * A guide exists only in the language it was published in; nothing links a guide to a
 * translation. Its hreflang therefore names that language alone (plus x-default for an
 * English guide) instead of the default four-language set, whose de/sv/da URLs answered 404
 * for all 27 guides (audit 27 Sep 2026). The x-default is the English page itself, never the
 * unprefixed path that only redirects (Semrush Site Audit, 2 Oct 2026).
 */
export function articleLanguageAlternates(article: Pick<PublicArticle, "category" | "slug" | "locale">, site: SiteClass = "main"): Record<string, string> {
  const language = articleLanguageRoute(article.locale);
  const url = absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale as SupportedLocale, articlePath(article)), site);
  return {
    [language.language]: url,
    ...(language.language === "en" ? { "x-default": url } : {}),
  };
}

/**
 * RFC-057 §14, the stored-canonical rule. A guide's `canonicalUrl` was stored as an absolute
 * `https://b4gamble.com<path>` or as a path, and a help guide printing the first would send
 * search engines to a URL on the other host — one that answers 301 after the move, and that
 * breaks the self-canonical rule either way. Only the **path** of a stored canonical is used,
 * resolved against the origin the guide is actually served from.
 */
export function storedCanonicalUrl(canonicalUrl: string, site: SiteClass) {
  const stored = new URL(canonicalUrl, originForSite(site));
  return `${originForSite(site)}${stored.pathname}${stored.search}${stored.hash}`;
}

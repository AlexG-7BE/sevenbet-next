import { after } from "next/server";

import { articlePath } from "@/lib/articles/article-types";
import {
  DEFAULT_MARKET_PROFILE,
  INDEXABLE_LANGUAGE_ROUTE_PROFILES,
  LANGUAGE_ROUTE_PROFILES,
  publicMarketPath,
} from "@/lib/market/registry";
import { reviewIndexable } from "@/lib/seo/review-indexing";
import { absoluteUrl, originForSite } from "@/lib/site";
import { learnArticleSite } from "@/lib/site/core-routes";
import type { SiteClass } from "@/lib/site/host-gate";

/**
 * IndexNow (Bing, Yandex, Seznam, Naver; shared between them) lets the site announce changed
 * URLs instead of waiting for a crawl. The key is public by design: it only proves that the
 * host serves `/<key>.txt` (app/<key>.txt/route.ts).
 */
export const INDEXNOW_KEY = "219017cffaba5177842beab195a2564c";
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;
/**
 * RFC-057 §12: the help host gets its own key and its own key file. The same key would work
 * on both hosts, but a key file shared by two domains is a public marker anyone can use to
 * join them — which is the one thing the second domain exists to avoid. Each host serves only
 * its own key: the main file is `COMMERCIAL` and the help file is `HELP`, so each answers 404
 * on the other host (lib/site/host-routes.ts).
 */
export const HELP_INDEXNOW_KEY = "fd78a34615b74c4e9db7fd7eb03f7659";
export const HELP_INDEXNOW_KEY_PATH = `/${HELP_INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function indexNowKey(site: SiteClass = "main") {
  return site === "help" ? HELP_INDEXNOW_KEY : INDEXNOW_KEY;
}

export function indexNowKeyPath(site: SiteClass = "main") {
  return site === "help" ? HELP_INDEXNOW_KEY_PATH : INDEXNOW_KEY_PATH;
}

type Environment = Record<string, string | undefined>;

/** Only Production announces URLs: previews and local runs share the canonical host. */
export function indexNowEnabled(environment: Environment = process.env) {
  return environment.VERCEL_ENV === "production" && environment.INDEXNOW_DISABLED !== "true";
}

/** One host's announcement: IndexNow accepts one host, with that host's key, per request. */
export function indexNowPayload(urls: readonly string[], site: SiteClass = "main") {
  const host = new URL(originForSite(site)).host;
  const urlList = [...new Set(urls)].filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });
  return { host, key: indexNowKey(site), keyLocation: absoluteUrl(indexNowKeyPath(site), site), urlList };
}

/**
 * The announcements a list of URLs produces, grouped by host (§12). A list may hold both
 * hosts' URLs at phase 3, when a moved guide is announced on the main host (so the 301 is
 * read) and on the help host (so the new address is crawled); each group is one POST with
 * that host's own key. A URL on neither host is dropped, as it always was.
 */
export function indexNowPayloadsByHost(urls: readonly string[]) {
  return (["main", "help"] as const)
    .map((site) => indexNowPayload(urls, site))
    .filter((payload) => payload.urlList.length > 0);
}

export async function submitIndexNow(
  urls: readonly string[],
  options: { environment?: Environment; fetchImpl?: typeof fetch } = {},
) {
  const payloads = indexNowPayloadsByHost(urls);
  if (!indexNowEnabled(options.environment) || !payloads.length) return { submitted: 0, status: null };
  let submitted = 0;
  let status: number | null = null;
  for (const payload of payloads) {
    const response = await (options.fetchImpl ?? fetch)(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    submitted += payload.urlList.length;
    status = response.status;
  }
  return { submitted, status };
}

/**
 * Best effort, after the admin response is sent: a failed or slow announcement never
 * delays or fails a publish. Outside a request (scripts, tests) nothing is sent.
 */
export function announceChangedUrls(urls: readonly string[], environment: Environment = process.env) {
  if (!indexNowEnabled(environment) || !urls.length) return false;
  try {
    after(() => submitIndexNow(urls, { environment }).then(() => undefined, () => undefined));
    return true;
  } catch {
    // Not inside a request scope: nothing to announce from here.
    return false;
  }
}

/** A review in every language open to search where its casino is licensed (lib/seo/review-indexing.ts). */
export function casinoReviewUrls(slug: string) {
  return INDEXABLE_LANGUAGE_ROUTE_PROFILES
    .filter((language) => reviewIndexable(slug, language.language))
    .map((language) => absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, `/casino/${slug}`)));
}

/** The commercial directories in every language open to search. */
export function productDirectoryUrls() {
  return INDEXABLE_LANGUAGE_ROUTE_PROFILES.flatMap((language) => ["/casinos", "/bonuses", "/best-offers"]
    .map((pathname) => absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, pathname))));
}

/**
 * A guide under the language it is published in, plus that language's Learn hub. Until
 * 12 October 2026 every guide was announced under `/en/`, so Swedish, Danish and German guides
 * reached Bing as `/en/learn/<category>/<swedish-slug>`, which answers 404 (Bing Webmaster
 * listed 31 such submissions). An unknown locale falls back to English.
 */
export function learnArticleUrls(category: string, slug: string, locale: string = DEFAULT_MARKET_PROFILE.defaultLocale) {
  const language = LANGUAGE_ROUTE_PROFILES.find((profile) => (profile.localeVariants as readonly string[]).includes(locale))
    ?? LANGUAGE_ROUTE_PROFILES.find((profile) => profile.defaultLocale === DEFAULT_MARKET_PROFILE.defaultLocale)!;
  // A guide is announced under the host it lives on (§12, §14): the help guides move with
  // their category when HELP_SITE_REDIRECTS is on, every other category stays on the main site.
  const site = learnArticleSite(category);
  return [
    absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, articlePath({ category, slug })), site),
    absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, "/learn"), site),
  ];
}

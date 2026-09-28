import { after } from "next/server";

import { articlePath } from "@/lib/articles/article-types";
import {
  DEFAULT_MARKET_PROFILE,
  INDEXABLE_LANGUAGE_ROUTE_PROFILES,
  publicMarketPath,
} from "@/lib/market/registry";
import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * IndexNow (Bing, Yandex, Seznam, Naver; shared between them) lets the site announce changed
 * URLs instead of waiting for a crawl. The key is public by design: it only proves that the
 * host serves `/<key>.txt` (app/<key>.txt/route.ts).
 */
export const INDEXNOW_KEY = "219017cffaba5177842beab195a2564c";
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

type Environment = Record<string, string | undefined>;

/** Only Production announces URLs: previews and local runs share the canonical host. */
export function indexNowEnabled(environment: Environment = process.env) {
  return environment.VERCEL_ENV === "production" && environment.INDEXNOW_DISABLED !== "true";
}

export function indexNowPayload(urls: readonly string[]) {
  const host = new URL(siteUrl).host;
  const urlList = [...new Set(urls)].filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });
  return { host, key: INDEXNOW_KEY, keyLocation: absoluteUrl(INDEXNOW_KEY_PATH), urlList };
}

export async function submitIndexNow(
  urls: readonly string[],
  options: { environment?: Environment; fetchImpl?: typeof fetch } = {},
) {
  const payload = indexNowPayload(urls);
  if (!indexNowEnabled(options.environment) || !payload.urlList.length) return { submitted: 0, status: null };
  const response = await (options.fetchImpl ?? fetch)(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5_000),
  });
  return { submitted: payload.urlList.length, status: response.status };
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

/** A review in every language open to search. */
export function casinoReviewUrls(slug: string) {
  return INDEXABLE_LANGUAGE_ROUTE_PROFILES.map((language) => absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, `/casino/${slug}`)));
}

/** The commercial directories in every language open to search. */
export function productDirectoryUrls() {
  return INDEXABLE_LANGUAGE_ROUTE_PROFILES.flatMap((language) => ["/casinos", "/bonuses", "/best-offers"]
    .map((pathname) => absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, language.defaultLocale, pathname))));
}

/** A guide is published in English today (see lib/articles/article-seo.ts), plus the English hub. */
export function learnArticleUrls(category: string, slug: string) {
  return [
    absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, articlePath({ category, slug }))),
    absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, "/learn")),
  ];
}

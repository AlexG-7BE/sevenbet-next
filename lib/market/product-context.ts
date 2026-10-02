import type { Metadata } from "next";

import { TRANSLATION_REVIEW_STATE } from "@/lib/i18n/review-state";
import { DEFAULT_OPEN_GRAPH_IMAGES } from "@/lib/seo/social-image";
import { absoluteUrl } from "@/lib/site";
import type { PresentationResolution } from "./presentation-resolver";
import {
  DEFAULT_MARKET_PROFILE,
  INDEXABLE_LANGUAGE_ROUTE_PROFILES,
  languageRouteByLocale,
  marketProfileByLocale,
  publicMarketPath,
  type MarketProfile,
  type SupportedLocale,
} from "./registry";
import { finalPublicHref, isLocalizedPublicDestination, localizePublicPath } from "./routing";

export const PRODUCT_TRANSLATION_REVIEW_STATE = {
  ...Object.fromEntries(Object.entries(TRANSLATION_REVIEW_STATE).map(([locale, state]) => [
    locale,
    state.content,
  ])),
} as Record<SupportedLocale, "SOURCE_BASELINE" | "MACHINE_TRANSLATED">;

/**
 * Founder editorial publication acceptance and indexing authority are separate.
 * A translated route stays outside the indexable sitemap and renders noindex
 * until its explicit indexing authority is activated.
 */
export function localizedProductIndexingApproved(locale: SupportedLocale) {
  return locale !== "en-GB" && productIndexingApproved(locale);
}

export function productIndexingApproved(locale: SupportedLocale) {
  const profile = languageRouteByLocale(locale);
  return profile.published && profile.indexable;
}

function editorialProfile(presentation: PresentationResolution) {
  return marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
}

export function productHref(presentation: PresentationResolution, href: string) {
  const profile = editorialProfile(presentation);
  return presentation.source === "EXPLICIT_ROUTE" && isLocalizedPublicDestination(href, profile)
    ? localizePublicPath(profile, presentation.locale, href)
    : finalPublicHref(href, presentation.neutralRouteLocale);
}

export function productCanonicalPath(presentation: PresentationResolution, pathname: string) {
  const profile = editorialProfile(presentation);
  return presentation.source === "EXPLICIT_ROUTE"
    ? localizePublicPath(profile, presentation.locale, pathname)
    : pathname;
}

/**
 * `x-default` names the English page itself. The unprefixed path only answers a 307 to the
 * visitor's language, and a hreflang target that redirects is an error for crawlers
 * (Semrush Site Audit, 2 Oct 2026: 27 incorrect hreflang links).
 */
export function defaultLanguageAlternate(pathname: string) {
  return absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, pathname));
}

export function productLanguageAlternatesForProfiles(pathname: string, profiles: readonly MarketProfile[]) {
  const byLanguage = new Map(profiles.map((profile) => {
    const language = languageRouteByLocale(profile.defaultLocale);
    return [language.language, [language.language, absoluteUrl(publicMarketPath(profile, language.defaultLocale, pathname))] as const];
  }));
  return Object.fromEntries([
    ...byLanguage.values(),
    ["x-default", defaultLanguageAlternate(pathname)],
  ]);
}

export function productLanguageAlternates(pathname: string) {
  return Object.fromEntries([
    ...INDEXABLE_LANGUAGE_ROUTE_PROFILES.map((language) => {
      const profile = marketProfileByLocale(language.defaultLocale) ?? DEFAULT_MARKET_PROFILE;
      return [language.language, absoluteUrl(publicMarketPath(profile, language.defaultLocale, pathname))] as const;
    }),
    ["x-default", defaultLanguageAlternate(pathname)],
  ]);
}

/** Whether a robots value lets search engines index the page. */
export function robotsAllowIndexing(robots: Metadata["robots"] | undefined) {
  if (!robots) return true;
  if (typeof robots === "string") return !/\b(?:noindex|none)\b/i.test(robots);
  return robots.index !== false;
}

export function firstWaveSafetyLanguageAlternates(pathname: "/help" | "/responsible-gambling") {
  return productLanguageAlternates(pathname);
}

export function openGraphLocale(locale: SupportedLocale) {
  return locale.replace("-", "_");
}

export function productMetadata(input: {
  presentation: PresentationResolution;
  pathname: string;
  title: string;
  description: string;
  robots?: Metadata["robots"];
  openGraphType?: "website" | "article";
  images?: NonNullable<Metadata["openGraph"]>["images"];
  languageAlternates?: Record<string, string>;
  /**
   * The request carries a query (`/learn?category=…`, `/program?entry=start`) and canonicalises
   * to the bare page. Only that canonical page names its language versions: a query variant
   * listing them is a hreflang/canonical conflict, and its alternates never link back to it.
   */
  queryVariant?: boolean;
}): Metadata {
  const canonical = absoluteUrl(productCanonicalPath(input.presentation, input.pathname));
  const explicitlyLocalized = input.presentation.source === "EXPLICIT_ROUTE";
  const robots = explicitlyLocalized
    && !productIndexingApproved(input.presentation.locale)
    ? { index: false, follow: true }
    : input.robots;
  // A noindex page (a review kept out of search, say) stays out of hreflang altogether: its
  // alternates would point search engines at pages they may not index.
  const languages = productIndexingApproved(input.presentation.locale) && robotsAllowIndexing(robots) && !input.queryVariant
    ? input.languageAlternates ?? productLanguageAlternates(input.pathname)
    : undefined;
  const locale = openGraphLocale(input.presentation.locale);
  // Setting openGraph here replaces the layout's, so the default social image is named explicitly.
  const images = input.images ?? DEFAULT_OPEN_GRAPH_IMAGES;
  const alternateLocale = INDEXABLE_LANGUAGE_ROUTE_PROFILES
    .map((profile) => openGraphLocale(profile.defaultLocale))
    .filter((candidate) => candidate !== locale);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: languages,
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: input.openGraphType ?? "website",
      siteName: "B4GAMBLE",
      title: input.title,
      description: input.description,
      url: canonical,
      locale,
      alternateLocale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images,
    },
  };
}

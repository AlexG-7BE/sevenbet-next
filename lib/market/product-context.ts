import type { Metadata } from "next";

import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { publicTranslationIndexingApproved, TRANSLATION_REVIEW_STATE } from "@/lib/i18n/review-state";
import { absoluteUrl } from "@/lib/site";
import type { PresentationResolution } from "./presentation-resolver";
import { FIRST_WAVE_MARKETS } from "./first-wave-evidence";
import { PUBLICATION_APPROVED_MARKET_PROFILES, marketProfileByCountry, publicMarketPath, type SupportedLocale } from "./registry";
import { isLocalizedPublicDestination, localizePublicPath } from "./routing";

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
  return locale !== "en-GB" && publicTranslationIndexingApproved(locale);
}

export function productHref(presentation: PresentationResolution, href: string) {
  return presentation.source === "EXPLICIT_ROUTE" && isLocalizedPublicDestination(href, presentation.market)
    ? localizePublicPath(presentation.market, presentation.locale, href)
    : href;
}

export function productCanonicalPath(presentation: PresentationResolution, pathname: string) {
  return presentation.source === "EXPLICIT_ROUTE"
    ? localizePublicPath(presentation.market, presentation.locale, pathname)
    : pathname;
}

export function productLanguageAlternates(pathname: string) {
  return Object.fromEntries([
    ...PUBLICATION_APPROVED_MARKET_PROFILES.map((profile) => [
      profile.defaultLocale,
      absoluteUrl(publicMarketPath(profile, profile.defaultLocale, pathname)),
    ]),
    ["x-default", absoluteUrl(pathname)],
  ]);
}

export function firstWaveSafetyLanguageAlternates(pathname: "/help" | "/responsible-gambling") {
  const profiles = ["GB", ...FIRST_WAVE_MARKETS]
    .map((countryCode) => marketProfileByCountry(countryCode))
    .filter((profile) => profile !== null);
  return Object.fromEntries([
    ...profiles.map((profile) => [
      profile.defaultLocale,
      absoluteUrl(publicMarketPath(profile, profile.defaultLocale, pathname)),
    ]),
    ["x-default", absoluteUrl(pathname)],
  ]);
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
}): Metadata {
  const canonical = absoluteUrl(productCanonicalPath(input.presentation, input.pathname));
  const explicitlyLocalized = input.presentation.source === "EXPLICIT_ROUTE";
  const robots = explicitlyLocalized
    && input.presentation.locale !== "en-GB"
    && !localizedProductIndexingApproved(input.presentation.locale)
    ? { index: false, follow: true }
    : input.robots;
  const locale = openGraphLocale(input.presentation.locale);
  const alternateLocale = PUBLICATION_APPROVED_MARKET_PROFILES
    .map((profile) => openGraphLocale(profile.defaultLocale))
    .filter((candidate) => candidate !== locale);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: input.languageAlternates ?? productLanguageAlternates(input.pathname),
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
      ...(input.images ? { images: input.images } : {}),
    },
    twitter: {
      card: input.images ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(input.images ? { images: input.images } : {}),
    },
  };
}

export function commercialAuthorityForPresentation(
  authority: CommercialJurisdictionAuthority | null | undefined,
  presentationCountry: string,
) {
  return authority?.countryCode === presentationCountry ? authority : null;
}

export function marketAvailability(
  countries: ReadonlyArray<{ countryCode: string; availability: string }>,
  presentationCountry: string,
) {
  return countries.some((country) => country.countryCode === presentationCountry && country.availability === "AVAILABLE");
}

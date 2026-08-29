import type { Metadata } from "next";

import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { absoluteUrl } from "@/lib/site";
import type { PresentationResolution } from "./presentation-resolver";
import { INITIAL_EUROPEAN_MARKET_PROFILES, localizedMarketPath, type SupportedLocale } from "./registry";
import { isLocalizedPublicDestination, localizePublicPath } from "./routing";

export const PRODUCT_TRANSLATION_REVIEW_STATE = {
  "en-GB": "APPROVED_BASELINE",
  "de-DE": "MACHINE_DRAFT",
  "it-IT": "MACHINE_DRAFT",
  "es-ES": "MACHINE_DRAFT",
  "pt-PT": "MACHINE_DRAFT",
  "el-GR": "MACHINE_DRAFT",
  "nl-NL": "MACHINE_DRAFT",
  "sv-SE": "MACHINE_DRAFT",
  "da-DK": "MACHINE_DRAFT",
  "fi-FI": "MACHINE_DRAFT",
  "nb-NO": "MACHINE_DRAFT",
  "en-CA": "MACHINE_DRAFT",
  "fr-CA": "MACHINE_DRAFT",
} as const satisfies Record<SupportedLocale, "APPROVED_BASELINE" | "MACHINE_DRAFT">;

/**
 * Localized product routes remain outside the indexable sitemap during this
 * Preview slice. This reversible gate avoids changing Production SEO authority
 * while machine-assisted copy and reciprocal alternates are reviewed.
 */
export function localizedProductIndexingApproved(_locale: SupportedLocale) {
  return false;
}

export function productHref(presentation: PresentationResolution, href: string) {
  return presentation.source === "EXPLICIT_ROUTE" && isLocalizedPublicDestination(href)
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
    ...INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => [
      profile.defaultLocale,
      absoluteUrl(localizedMarketPath(profile, profile.defaultLocale, pathname)),
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
}): Metadata {
  const canonical = absoluteUrl(productCanonicalPath(input.presentation, input.pathname));
  const explicitlyLocalized = input.presentation.source === "EXPLICIT_ROUTE";
  const robots = explicitlyLocalized && !localizedProductIndexingApproved(input.presentation.locale)
    ? { index: false, follow: true }
    : input.robots;
  const locale = openGraphLocale(input.presentation.locale);
  const alternateLocale = INITIAL_EUROPEAN_MARKET_PROFILES
    .map((profile) => openGraphLocale(profile.defaultLocale))
    .filter((candidate) => candidate !== locale);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: productLanguageAlternates(input.pathname),
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

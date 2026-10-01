import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * One sitewide identity for search engines and AI crawlers (audit 27 Sep 2026: the
 * Organization had only a name and a URL that changed with the page language, and there
 * was no WebSite). The URL is the bare origin on every page and in every language.
 */
export const ORGANIZATION_ID = `${siteUrl}/#organization`;
export const WEBSITE_ID = `${siteUrl}/#website`;
export const ORGANIZATION_LOGO_PATH = "/brand/b4gamble-logo-512.png";
export const EDITORIAL_AUTHOR_NAME = "B4GAMBLE Editorial";

/**
 * The brand's own public profiles, so search engines tie them to the site as one entity
 * (Founder, 1 Oct 2026). Only profiles B4GAMBLE controls; add one when it goes live.
 */
export const ORGANIZATION_PROFILES = [
  "https://www.facebook.com/b4gamble",
  "https://x.com/b4gamble",
  "https://www.instagram.com/b4gamble_com",
  "https://www.youtube.com/@b4gamble",
  "https://www.tiktok.com/@b4gamble.com",
  "https://www.pinterest.com/b4gamble",
  "https://medium.com/@b4gamble.com",
  "https://www.producthunt.com/@b4gamble",
  "https://www.crunchbase.com/organization/b4gamble",
  "https://www.trustpilot.com/review/b4gamble.com",
] as const;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "B4GAMBLE",
    legalName: "7BE Inc.",
    url: siteUrl,
    sameAs: [...ORGANIZATION_PROFILES],
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(ORGANIZATION_LOGO_PATH),
      width: 512,
      height: 512,
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "B4GAMBLE",
    url: siteUrl,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** A reference to the sitewide Organization, for `publisher` fields. */
export function organizationReference() {
  return { "@type": "Organization", "@id": ORGANIZATION_ID, name: "B4GAMBLE", url: siteUrl };
}

/** The editorial team as an organisation author; it is not a person. */
export function editorialAuthor() {
  return { "@type": "Organization", name: EDITORIAL_AUTHOR_NAME, url: siteUrl, parentOrganization: { "@id": ORGANIZATION_ID } };
}

/**
 * The later of the given dates, as an ISO string, never earlier than `publishedAt`
 * (108 of 108 reviews declared a `dateModified` weeks before their `datePublished`).
 */
export function modifiedNotBeforePublished(publishedAt: string | null | undefined, ...modifiedCandidates: Array<string | null | undefined>) {
  const times = [publishedAt, ...modifiedCandidates]
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => Boolean(value) && !Number.isNaN(value!.getTime()));
  if (!times.length) return null;
  return new Date(Math.max(...times.map((value) => value.getTime()))).toISOString();
}

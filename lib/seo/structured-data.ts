import { BRAND_STATEMENT } from "@/lib/i18n/static-pages/gambling-control";
import { absoluteUrl, originForSite, siteUrl } from "@/lib/site";
import { helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, type SiteClass } from "@/lib/site/host-gate";
import { BRAND_SOCIAL_PROFILES } from "@/lib/social/brand-profiles";

/**
 * One sitewide identity for search engines and AI crawlers (audit 27 Sep 2026: the
 * Organization had only a name and a URL that changed with the page language, and there
 * was no WebSite). The URL is the bare origin on every page and in every language.
 */
export const ORGANIZATION_ID = `${siteUrl}/#organization`;
export const WEBSITE_ID = `${siteUrl}/#website`;

/**
 * RFC-057 §8. The help host prints its own identity, never B4GAMBLE's: a `b4gamble.com` URL
 * in JSON-LD would break the one-way link rule (§6.1), the logo path is the B4GAMBLE mark the
 * help site carries nowhere (Q2), and the "Before Gamble" aliases are the other site's brand.
 * The help Organization has no `logo` field at all until a "Pause Plan" mark exists, and no
 * `sameAs`: the social profiles belong to the main brand.
 */
export function organizationIdForSite(site: SiteClass = "main") {
  return `${originForSite(site)}/#organization`;
}

export function websiteIdForSite(site: SiteClass = "main") {
  return `${originForSite(site)}/#website`;
}
export const ORGANIZATION_LOGO_PATH = "/brand/b4gamble-logo-512.png";
export const EDITORIAL_AUTHOR_NAME = "B4GAMBLE Editorial";

/**
 * What the name stands for, so a search for "before gamble" finds the brand
 * (Founder, 3 Oct 2026). The video outros already say "Before Gamble."
 */
export const BRAND_ALTERNATE_NAMES = ["Before Gamble", "Before You Gamble", "B4 Gamble"] as const;

/**
 * The brand's own public profiles, so search engines tie them to the site as one entity
 * (Founder, 1 Oct 2026). Only profiles B4GAMBLE controls; add one when it goes live.
 * The footer's accounts come first, from the list the footer itself renders. X, Medium and
 * Product Hunt left on 27 Oct 2026: they were 7BE's accounts and go back to 7BE.
 */
export const ORGANIZATION_PROFILES = [
  ...BRAND_SOCIAL_PROFILES.map((profile) => profile.href),
  "https://www.tiktok.com/@b4gamble.com",
  "https://www.pinterest.com/b4gamble",
  "https://www.crunchbase.com/organization/b4gamble",
  "https://www.trustpilot.com/review/b4gamble.com",
] as const;

export function organizationSchema(site: SiteClass = "main") {
  if (site === "help") {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationIdForSite("help"),
      name: HELP_SITE_NAME,
      legalName: "7BE Inc.",
      description: helpShellCopy("en-GB").statement,
      url: originForSite("help"),
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "B4GAMBLE",
    alternateName: [...BRAND_ALTERNATE_NAMES],
    legalName: "7BE Inc.",
    // The one phrase (Founder, 15 October 2026), the same words llms.txt opens with.
    description: BRAND_STATEMENT["en-GB"],
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

export function websiteSchema(site: SiteClass = "main") {
  if (site === "help") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteIdForSite("help"),
      name: HELP_SITE_NAME,
      url: originForSite("help"),
      publisher: { "@id": organizationIdForSite("help") },
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "B4GAMBLE",
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url: siteUrl,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** A reference to the sitewide Organization, for `publisher` fields. */
export function organizationReference(site: SiteClass = "main") {
  return site === "help"
    ? { "@type": "Organization", "@id": organizationIdForSite("help"), name: HELP_SITE_NAME, url: originForSite("help") }
    : { "@type": "Organization", "@id": ORGANIZATION_ID, name: "B4GAMBLE", url: siteUrl };
}

/** The editorial team as an organisation author; it is not a person. */
export function editorialAuthor(site: SiteClass = "main") {
  return site === "help"
    ? { "@type": "Organization", name: `${HELP_SITE_NAME} Editorial`, url: originForSite("help"), parentOrganization: { "@id": organizationIdForSite("help") } }
    : { "@type": "Organization", name: EDITORIAL_AUTHOR_NAME, url: siteUrl, parentOrganization: { "@id": ORGANIZATION_ID } };
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

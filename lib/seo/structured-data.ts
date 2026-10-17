import { BRAND_STATEMENT } from "@/lib/i18n/static-pages/gambling-control";
import { absoluteUrl, originForSite, siteUrl } from "@/lib/site";
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
 * RFC-057 §8. Each site has its own identity node on its own origin: a `b4gamble.com` URL in
 * the JSON-LD of a help page would break the one-way link rule (§6, rule 1), and the help site
 * carries no B4GAMBLE wordmark, alias or logo at all (Q2). The display name there is
 * "Pause Plan"; the legal name stays 7BE Inc., which is the honest part and the one
 * `/who-runs-this` repeats in words.
 */
export function organizationId(site: SiteClass = "main") {
  return `${originForSite(site)}/#organization`;
}

export function websiteId(site: SiteClass = "main") {
  return `${originForSite(site)}/#website`;
}

function siteName(site: SiteClass) {
  return site === "help" ? HELP_SITE_NAME : "B4GAMBLE";
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
 * The five the footer links to come first, from the list the footer itself renders.
 */
export const ORGANIZATION_PROFILES = [
  ...BRAND_SOCIAL_PROFILES.map((profile) => profile.href),
  "https://www.tiktok.com/@b4gamble.com",
  "https://www.pinterest.com/b4gamble",
  "https://medium.com/@b4gamble.com",
  "https://www.producthunt.com/@b4gamble",
  "https://www.crunchbase.com/organization/b4gamble",
  "https://www.trustpilot.com/review/b4gamble.com",
] as const;

export function organizationSchema(site: SiteClass = "main") {
  const help = site === "help";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(site),
    name: siteName(site),
    // The B4GAMBLE aliases and the brand's social profiles belong to the main site. The help
    // site's own profiles are the ones whose bios point at it, and there are none yet (§15).
    ...(help ? {} : { alternateName: [...BRAND_ALTERNATE_NAMES] }),
    legalName: "7BE Inc.",
    // The one phrase (Founder, 15 October 2026), the same words llms.txt opens with.
    ...(help ? {} : { description: BRAND_STATEMENT["en-GB"] }),
    url: originForSite(site),
    ...(help ? {} : { sameAs: [...ORGANIZATION_PROFILES] }),
    // The help host can neither resolve the logo against its own origin (the file is the
    // B4GAMBLE mark) nor serve it first-party (§4.2 denies `public/brand/`), so the field is
    // left out until the "Pause Plan" logo exists (§8).
    ...(help ? {} : {
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(ORGANIZATION_LOGO_PATH),
        width: 512,
        height: 512,
      },
    }),
  };
}

export function websiteSchema(site: SiteClass = "main") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(site),
    name: siteName(site),
    ...(site === "help" ? {} : { alternateName: [...BRAND_ALTERNATE_NAMES] }),
    url: originForSite(site),
    publisher: { "@id": organizationId(site) },
  };
}

/** A reference to the sitewide Organization, for `publisher` fields. */
export function organizationReference(site: SiteClass = "main") {
  return { "@type": "Organization", "@id": organizationId(site), name: siteName(site), url: originForSite(site) };
}

/** The editorial team as an organisation author; it is not a person. */
export function editorialAuthor(site: SiteClass = "main") {
  return {
    "@type": "Organization",
    name: site === "help" ? `${HELP_SITE_NAME} Editorial` : EDITORIAL_AUTHOR_NAME,
    url: originForSite(site),
    parentOrganization: { "@id": organizationId(site) },
  };
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

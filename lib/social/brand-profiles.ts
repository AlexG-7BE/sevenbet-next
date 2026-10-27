/**
 * Hidden from every visitor since 27 October 2026: the Founder stopped running B4GAMBLE's social
 * accounts and is moving them to 7BE (docs/07_Decisions/BRAND-SOCIAL-HIDDEN-2026-10-27.md). The
 * footer row renders nothing while this is `false`; the profiles stay listed so the Organization
 * `sameAs` still ties the accounts B4GAMBLE owns to the site. Set it to `true` to show the row again.
 */
export const BRAND_SOCIAL_VISIBLE: boolean = false;

/**
 * The brand's own social profiles, in the order the footer shows them (Founder, 11 Oct 2026:
 * a row of icons under the footer brand, on every page that carries the public footer). The
 * Organization `sameAs` is built from the same list, so the footer and the schema cannot name
 * different accounts.
 *
 * Instagram and Threads are both `b4gamble.c0m`: Meta disabled the first Instagram account on
 * 8–9 Oct 2026 and the Founder renamed the Threads profile to match on 11 Oct 2026. X left the
 * list on 27 Oct 2026: the account was 7BE's before it was B4GAMBLE's and goes back to 7BE.
 */
export const BRAND_SOCIAL_PROFILES = [
  { network: "instagram", name: "Instagram", href: "https://www.instagram.com/b4gamble.c0m" },
  { network: "youtube", name: "YouTube", href: "https://www.youtube.com/@b4gamble" },
  { network: "facebook", name: "Facebook", href: "https://www.facebook.com/b4gamble" },
  { network: "threads", name: "Threads", href: "https://www.threads.com/@b4gamble.c0m" },
] as const;

export type BrandSocialNetwork = (typeof BRAND_SOCIAL_PROFILES)[number]["network"];

/**
 * The brand's own social profiles, in the order the footer shows them (Founder, 11 Oct 2026:
 * five networks as a row of icons under the footer brand, on every page that carries the
 * public footer). The Organization `sameAs` is built from the same list, so the footer and
 * the schema cannot name different accounts.
 *
 * Instagram and Threads are both `b4gamble.c0m`: Meta disabled the first Instagram account on
 * 8–9 Oct 2026 and the Founder renamed the Threads profile to match on 11 Oct 2026.
 */
export const BRAND_SOCIAL_PROFILES = [
  { network: "instagram", name: "Instagram", href: "https://www.instagram.com/b4gamble.c0m" },
  { network: "youtube", name: "YouTube", href: "https://www.youtube.com/@b4gamble" },
  { network: "x", name: "X", href: "https://x.com/b4gamble" },
  { network: "facebook", name: "Facebook", href: "https://www.facebook.com/b4gamble" },
  { network: "threads", name: "Threads", href: "https://www.threads.com/@b4gamble.c0m" },
] as const;

export type BrandSocialNetwork = (typeof BRAND_SOCIAL_PROFILES)[number]["network"];

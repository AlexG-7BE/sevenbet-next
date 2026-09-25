import { normalizeRedirectSlug } from "@/lib/affiliate-routing/redirect-validation";

export const OUTBOUND_RECOVERY_PATH = "/outbound/unavailable";
export const OUTBOUND_RECOVERY_LINK_PARAM = "link";

/** The query value is untrusted: only a well-formed managed redirect slug survives. */
export function recoveryLinkSlug(value: unknown): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  try {
    return normalizeRedirectSlug(candidate);
  } catch {
    return null;
  }
}

/**
 * Founder decision 25 Sep 2026: a refused click lands on a recovery page that can lead back
 * to the casino the visitor chose. Only the managed slug travels; never a destination.
 */
export function outboundRecoveryUrl(base: URL, slug: string | null) {
  const url = new URL(base);
  url.pathname = OUTBOUND_RECOVERY_PATH;
  url.search = "";
  url.hash = "";
  const link = recoveryLinkSlug(slug);
  if (link) url.searchParams.set(OUTBOUND_RECOVERY_LINK_PARAM, link);
  return url;
}

import { worldwideFounderGbAuthorityApplies } from "@/lib/current-partner-worldwide-authority/inventory";

import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "./commercial-authority";

const FOUNDER_GB_INTERNAL_POLICY_REASONS = new Set(["COMMERCIAL_NOT_ACTIVE", "POLICY_STALE"]);

export function scopedCasinoReferralAllowed(
  authority: CommercialJurisdictionAuthority | null | undefined,
  casinoSlug: string | null | undefined,
) {
  if (jurisdictionAllowsReferral(authority)) return true;
  return Boolean(
    authority?.countryCode === "GB"
    && casinoSlug
    && worldwideFounderGbAuthorityApplies(casinoSlug)
    && FOUNDER_GB_INTERNAL_POLICY_REASONS.has(authority.reasonCode),
  );
}

/** Allows the repository query only; per-casino projection remains mandatory. */
export function scopedCommercialProjectionMayLoad(
  authority: CommercialJurisdictionAuthority | null | undefined,
  countryCode: string | null | undefined,
) {
  if (jurisdictionAllowsReferral(authority)) return true;
  return authority?.countryCode === "GB"
    && countryCode === "GB"
    && FOUNDER_GB_INTERNAL_POLICY_REASONS.has(authority.reasonCode);
}

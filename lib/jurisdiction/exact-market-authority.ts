import { buildWorldwideAuthorityMatrix } from "@/lib/current-partner-worldwide-authority/inventory";
const exactSubdivisionRows = buildWorldwideAuthorityMatrix().filter((row) => row.level === "SUBDIVISION");

export function exactSubdivisionEvidenceAuthority(input: { casinoSlug: string; marketCode: string }) {
  const marketCode = input.marketCode.trim().toUpperCase().replace(/_/g, "-");
  const row = exactSubdivisionRows.find((candidate) => candidate.casinoSlug === input.casinoSlug.trim().toLowerCase()
    && candidate.geo === marketCode) ?? null;
  return Boolean(
    row
    && row.marketSupportState === "SUPPORTED"
    && row.legalState === "ALLOWED"
    && row.supportEvidenceClassification === "DETECTED"
    && row.legalEvidenceClassification === "DETECTED"
    && row.founderCommercialAuthority === "APPROVED"
    && row.marketCommercialAuthority === "APPROVED",
  );
}

/**
 * Exact subdivision authority is intentionally stricter than parent-country
 * resolution. A positive result requires the exact Founder-scoped Casino/GEO
 * row, detected support and legal evidence, and a currently positive parent
 * jurisdiction decision. It cannot turn a parent legal denial into an allow.
 */
export function exactSubdivisionCommercialAuthority(input: {
  casinoSlug: string;
  marketCode: string;
  parentDecision: { countryCode?: string | null; commercialAllowed: boolean; referralAllowed: boolean };
}) {
  const marketCode = input.marketCode.trim().toUpperCase().replace(/_/g, "-");
  const row = exactSubdivisionRows.find((candidate) => candidate.casinoSlug === input.casinoSlug.trim().toLowerCase()
    && candidate.geo === marketCode) ?? null;
  const allowed = Boolean(
    exactSubdivisionEvidenceAuthority({ casinoSlug: input.casinoSlug, marketCode })
    && row
    && input.parentDecision.countryCode === row.countryCode
    && input.parentDecision.commercialAllowed
    && input.parentDecision.referralAllowed,
  );
  return {
    allowed,
    marketCode,
    countryCode: marketCode.slice(0, 2),
    reason: allowed
      ? "Exact detected subdivision support/legal authority and positive parent jurisdiction authority are present."
      : "Exact detected subdivision support/legal authority is unavailable or the parent jurisdiction denies commercial referral.",
  };
}

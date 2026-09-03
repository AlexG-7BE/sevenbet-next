import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { PublicCasinoMarketProfile } from "./public-casino.types";

export type PublicCasinoPresentationDisposition = "PROMOTABLE" | "INFORMATIONAL_ONLY" | "HIDDEN";

export type PublicCasinoDispositionReason =
  | "EXACT_MARKET_AND_ROUTE_ELIGIBLE"
  | "EXACT_MARKET_INFORMATION_ONLY"
  | "EDITORIAL_FALLBACK_MARKET_UNKNOWN"
  | "GLOBAL_IDENTITY_MARKET_PROFILE_MISSING"
  | "EXACT_MARKET_UNAVAILABLE_INFORMATION_ONLY"
  | "EXACT_MARKET_STATUS_UNKNOWN_INFORMATION_ONLY"
  | "EXACT_MARKET_PROFILE_MISSING"
  | "EXACT_MARKET_UNAVAILABLE"
  | "EXACT_MARKET_STATUS_UNKNOWN"
  | "EXACT_MARKET_EVIDENCE_CONTRADICTED"
  | "NON_PUBLIC_SYNTHETIC_IDENTITY";

export type PublicCasinoDispositionDecision = Readonly<{
  disposition: PublicCasinoPresentationDisposition;
  reasonCode: PublicCasinoDispositionReason;
}>;

/**
 * CASINO-COMMERCIAL-VISIBILITY-03 separates editorial publication from the
 * governed outbound action. A missing or UNKNOWN exact-market record is not a
 * content prohibition. Only synthetic identities are suppressed here; route
 * eligibility independently controls whether a CTA is promotable.
 */
export function decidePublicCasinoDisposition(input: {
  casinoId: string;
  requestCountryCode: string | null | undefined;
  marketProfile: PublicCasinoMarketProfile | null | undefined;
  governedVisitAvailable: boolean;
}): PublicCasinoDispositionDecision {
  if (isTemporaryDemoCasinoId(input.casinoId)) {
    return { disposition: "HIDDEN", reasonCode: "NON_PUBLIC_SYNTHETIC_IDENTITY" };
  }

  const countryCode = input.requestCountryCode?.trim().toUpperCase() || null;
  if (!countryCode) {
    return { disposition: "INFORMATIONAL_ONLY", reasonCode: "EDITORIAL_FALLBACK_MARKET_UNKNOWN" };
  }
  if (!input.marketProfile || input.marketProfile.countryCode !== countryCode) {
    return input.governedVisitAvailable
      ? { disposition: "PROMOTABLE", reasonCode: "EXACT_MARKET_AND_ROUTE_ELIGIBLE" }
      : { disposition: "INFORMATIONAL_ONLY", reasonCode: "GLOBAL_IDENTITY_MARKET_PROFILE_MISSING" };
  }
  if (input.marketProfile.evidence.some((record) => record.classification === "CONTRADICTION")) {
    return { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_EVIDENCE_CONTRADICTED" };
  }
  if (["UNAVAILABLE", "NOT_AVAILABLE", "RESTRICTED"].includes(input.marketProfile.availability.toUpperCase())) {
    return { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_UNAVAILABLE_INFORMATION_ONLY" };
  }
  if (input.marketProfile.availability !== "AVAILABLE") {
    return input.governedVisitAvailable
      ? { disposition: "PROMOTABLE", reasonCode: "EXACT_MARKET_AND_ROUTE_ELIGIBLE" }
      : { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_STATUS_UNKNOWN_INFORMATION_ONLY" };
  }
  return input.governedVisitAvailable
    ? { disposition: "PROMOTABLE", reasonCode: "EXACT_MARKET_AND_ROUTE_ELIGIBLE" }
    : { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_INFORMATION_ONLY" };
}

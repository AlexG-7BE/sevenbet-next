import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { marketProfileByCountry } from "@/lib/market/registry";
import type { PublicCasinoMarketProfile } from "./public-casino.types";
import { casinoMarketPresentationPolicy } from "./market-presentation-policy";

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
 * Repository-controlled public presentation policy. Known configured markets
 * apply their reviewed exact/missing-profile policy. Unknown or unconfigured
 * request GEO may receive only global neutral identity fields and can never
 * promote.
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
  const configuredMarket = marketProfileByCountry(countryCode);
  if (!countryCode || !configuredMarket) {
    return { disposition: "INFORMATIONAL_ONLY", reasonCode: "EDITORIAL_FALLBACK_MARKET_UNKNOWN" };
  }
  const policy = casinoMarketPresentationPolicy(configuredMarket.countryCode);
  if (!input.marketProfile || input.marketProfile.countryCode !== countryCode) {
    return policy.neutralGlobalIdentityAllowed
      ? { disposition: "INFORMATIONAL_ONLY", reasonCode: "GLOBAL_IDENTITY_MARKET_PROFILE_MISSING" }
      : { disposition: "HIDDEN", reasonCode: "EXACT_MARKET_PROFILE_MISSING" };
  }
  if (input.marketProfile.evidence.some((record) => record.classification === "CONTRADICTION")) {
    return { disposition: "HIDDEN", reasonCode: "EXACT_MARKET_EVIDENCE_CONTRADICTED" };
  }
  if (input.marketProfile.availability === "UNAVAILABLE") {
    return policy.explicitUnavailableInformationAllowed
      ? { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_UNAVAILABLE_INFORMATION_ONLY" }
      : { disposition: "HIDDEN", reasonCode: "EXACT_MARKET_UNAVAILABLE" };
  }
  if (input.marketProfile.availability !== "AVAILABLE") {
    const explicitlyProhibited = ["PROHIBITED", "NOT_LICENSED", "BLOCKED"].includes(input.marketProfile.availability.toUpperCase());
    return !explicitlyProhibited && policy.unknownExactMarketInformationAllowed
      ? { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_STATUS_UNKNOWN_INFORMATION_ONLY" }
      : { disposition: "HIDDEN", reasonCode: "EXACT_MARKET_STATUS_UNKNOWN" };
  }
  return input.governedVisitAvailable
    ? { disposition: "PROMOTABLE", reasonCode: "EXACT_MARKET_AND_ROUTE_ELIGIBLE" }
    : { disposition: "INFORMATIONAL_ONLY", reasonCode: "EXACT_MARKET_INFORMATION_ONLY" };
}

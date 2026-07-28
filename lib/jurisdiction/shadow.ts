import { jurisdictionResolver } from "./resolver";
import type { ResolutionInput } from "./types";

export function isJurisdictionResolverShadowEnabled() {
  return process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED === "true";
}

export async function evaluateJurisdictionShadow(entryPoint: "CASINO_DISCOVERY" | "AFFILIATE_REDIRECT" | "LEGACY_AFFILIATE_REDIRECT", input: ResolutionInput, legacy: { commercialAllowed: boolean; referralAllowed: boolean }) {
  if (!isJurisdictionResolverShadowEnabled()) return null;
  try {
    const proposed = await jurisdictionResolver.resolve(input);
    const mismatch = legacy.commercialAllowed !== proposed.commercialAllowed || legacy.referralAllowed !== proposed.referralAllowed;
    console.warn("jurisdiction_shadow_evaluation", {
      entryPoint, decisionId: proposed.decisionId, countryCode: proposed.countryCode, marketId: proposed.marketId,
      policyVersion: proposed.policyVersion, reasonCode: proposed.reasonCode, mismatch,
      legacyCommercialAllowed: legacy.commercialAllowed, legacyReferralAllowed: legacy.referralAllowed,
      proposedCommercialAllowed: proposed.commercialAllowed, proposedReferralAllowed: proposed.referralAllowed,
    });
    return proposed;
  } catch {
    console.warn("jurisdiction_shadow_evaluation_failed", { entryPoint });
    return null;
  }
}

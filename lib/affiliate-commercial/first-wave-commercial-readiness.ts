import type { FirstWaveMarketCode } from "@/lib/market/first-wave-evidence";

export type FirstWaveCommercialEvidence = Readonly<{
  existingCommercialAuthority: boolean;
  operatorMarketLicenceEvidence: boolean;
  exactOperatorDomainEvidence: boolean;
  requestedAdvertisingWithinOperatorAuthority: boolean;
  promotionalCopyReviewCleared: boolean;
  hgcAffiliateSuitabilityEvidence: boolean;
  partnerApproved: boolean;
  offerActive: boolean;
  trackingReady: boolean;
}>;

export type FirstWaveCommercialRequirement =
  | "EXISTING_COMMERCIAL_AUTHORITY"
  | "CURRENT_OPERATOR_MARKET_LICENCE"
  | "EXACT_OPERATOR_DOMAIN_MATCH"
  | "ADVERTISING_WITHIN_OPERATOR_AUTHORITY"
  | "PROMOTIONAL_COPY_REVIEW"
  | "HGC_AFFILIATE_SUITABILITY_REQUIRED"
  | "PARTNER_APPROVAL"
  | "ACTIVE_OFFER"
  | "TRACKING_READY";

const common: readonly FirstWaveCommercialRequirement[] = [
  "EXISTING_COMMERCIAL_AUTHORITY",
  "CURRENT_OPERATOR_MARKET_LICENCE",
  "PARTNER_APPROVAL",
  "ACTIVE_OFFER",
  "TRACKING_READY",
];

const requirements: Record<FirstWaveMarketCode, readonly FirstWaveCommercialRequirement[]> = {
  DE: [...common, "EXACT_OPERATOR_DOMAIN_MATCH"],
  ES: [...common, "ADVERTISING_WITHIN_OPERATOR_AUTHORITY", "PROMOTIONAL_COPY_REVIEW"],
  PE: [...common, "EXACT_OPERATOR_DOMAIN_MATCH", "ADVERTISING_WITHIN_OPERATOR_AUTHORITY", "PROMOTIONAL_COPY_REVIEW"],
  SE: common,
  DK: common,
  GR: [...common, "HGC_AFFILIATE_SUITABILITY_REQUIRED"],
};

function satisfied(requirement: FirstWaveCommercialRequirement, evidence: FirstWaveCommercialEvidence) {
  switch (requirement) {
    case "EXISTING_COMMERCIAL_AUTHORITY": return evidence.existingCommercialAuthority;
    case "CURRENT_OPERATOR_MARKET_LICENCE": return evidence.operatorMarketLicenceEvidence;
    case "EXACT_OPERATOR_DOMAIN_MATCH": return evidence.exactOperatorDomainEvidence;
    case "ADVERTISING_WITHIN_OPERATOR_AUTHORITY": return evidence.requestedAdvertisingWithinOperatorAuthority;
    case "PROMOTIONAL_COPY_REVIEW": return evidence.promotionalCopyReviewCleared;
    case "HGC_AFFILIATE_SUITABILITY_REQUIRED": return evidence.hgcAffiliateSuitabilityEvidence;
    case "PARTNER_APPROVAL": return evidence.partnerApproved;
    case "ACTIVE_OFFER": return evidence.offerActive;
    case "TRACKING_READY": return evidence.trackingReady;
  }
}

export function evaluateFirstWaveCommercialReadiness(market: FirstWaveMarketCode, evidence: FirstWaveCommercialEvidence) {
  const unmet = requirements[market].filter((requirement) => !satisfied(requirement, evidence));
  return {
    market,
    eligible: unmet.length === 0,
    decision: unmet.length === 0 ? "ELIGIBLE_FOR_EXISTING_GOVERNED_FLOW" : "DENIED_FAIL_CLOSED",
    requirements: requirements[market],
    unmet,
  } as const;
}

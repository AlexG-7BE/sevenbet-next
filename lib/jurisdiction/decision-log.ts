import type { JurisdictionDecision } from "./types";

export type JurisdictionEntryPoint =
  | "CASINO_DISCOVERY"
  | "CASINO_PROFILE"
  | "BONUSES"
  | "BEST_OFFERS"
  | "COMPARE"
  | "AFFILIATE_REDIRECT"
  | "LEGACY_AFFILIATE_REDIRECT";

export function logJurisdictionDecision(entryPoint: JurisdictionEntryPoint, value: JurisdictionDecision) {
  console.warn("jurisdiction_decision", {
    entryPoint,
    decisionId: value.decisionId,
    countryCode: value.countryCode,
    marketId: value.marketId,
    policyVersion: value.policyVersion,
    reasonCode: value.reasonCode,
    editorialAllowed: value.editorialAllowed,
    commercialAllowed: value.commercialAllowed,
    referralAllowed: value.referralAllowed,
  });
}

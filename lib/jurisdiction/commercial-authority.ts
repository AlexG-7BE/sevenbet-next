import type { JurisdictionDecision } from "./types";

export type CommercialJurisdictionAuthority = Pick<
  JurisdictionDecision,
  "commercialAllowed" | "referralAllowed" | "reasonCode" | "countryCode" | "policyVersion"
>;

export function jurisdictionAllowsCommercial(authority?: CommercialJurisdictionAuthority | null) {
  return authority?.commercialAllowed === true;
}

export function jurisdictionAllowsReferral(authority?: CommercialJurisdictionAuthority | null) {
  return jurisdictionAllowsCommercial(authority) && authority?.referralAllowed === true;
}

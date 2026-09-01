import type { CommercialJurisdictionAuthority } from "../lib/jurisdiction/commercial-authority";
import type { GbOperatorEligibilityDecision } from "../lib/jurisdiction/gb-operator-eligibility";
import type { JurisdictionDecision } from "../lib/jurisdiction/types";
import type { GbOperatorEligibilityAuthority } from "../lib/services/gb-operator-eligibility.service";
import type { GbCommercialReadinessAuthority } from "../lib/services/gb-commercial-readiness.service";

export const allowJurisdictionAuthority: CommercialJurisdictionAuthority = {
  commercialAllowed: true,
  referralAllowed: true,
  reasonCode: "POLICY_APPROVED",
  countryCode: "GB",
  policyVersion: "test-policy",
};

export const allowJurisdictionDecision: JurisdictionDecision = {
  ...allowJurisdictionAuthority,
  decisionId: "jrd_test_allow",
  marketId: "gb-test",
  jurisdictionId: "great-britain-test",
  editorialAllowed: true,
  evaluatedAt: "2030-06-01T00:00:00.000Z",
  revalidateAt: "2030-07-01T00:00:00.000Z",
  inputSummary: [],
};

export const allowOperatorDecision: GbOperatorEligibilityDecision = {
  editorialEligible: true,
  operatorEvidenceEligible: true,
  commercialEligible: true,
  referralEligible: true,
  reasonCodes: ["GB_OPERATOR_ELIGIBLE"],
  evidenceCheckedAt: "2030-05-31T00:00:00.000Z",
  revalidateAt: "2030-06-07T00:00:00.000Z",
};

export const allowOperatorAuthority: GbOperatorEligibilityAuthority = {
  async evaluate() { return allowOperatorDecision; },
  async evaluateMany(casinoIds) {
    return new Map(casinoIds.map((casinoId) => [casinoId, allowOperatorDecision]));
  },
};

export const allowGbCommercialReadinessAuthority: GbCommercialReadinessAuthority = {
  async evaluate() {
    return {
      jurisdictionAuthority: true,
      partnerAuthority: true,
      operatorAuthority: true,
      domainAuthority: true,
      programAuthority: true,
      offerAuthority: true,
      trackingAuthority: true,
      bonusAuthority: true,
      redirectAuthority: true,
      commercialReady: true,
      referralReady: true,
      reasonCodes: ["GB_COMMERCIAL_READY"],
      operatorEligibility: allowOperatorDecision,
      checkedAt: "2030-06-01T00:00:00.000Z",
      evidenceCheckedAt: allowOperatorDecision.evidenceCheckedAt,
      revalidateAt: allowOperatorDecision.revalidateAt,
    };
  },
};

export const allowJurisdictionResolver = {
  async resolve() { return allowJurisdictionDecision; },
};

export const allowPartnerRouteProductionAuthority = {
  async isProductionEligible() { return true; },
};

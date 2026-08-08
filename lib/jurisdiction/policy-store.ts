import type { JurisdictionPolicyStore } from "./types";
import { gbJurisdictionPolicy } from "./policies/gb";

export const unavailableJurisdictionPolicyStore: JurisdictionPolicyStore = {
  async findByCountry() { return null; },
};

const policies = new Map([[gbJurisdictionPolicy.countryCode, gbJurisdictionPolicy]]);

export const repositoryJurisdictionPolicyStore: JurisdictionPolicyStore = {
  async findByCountry(countryCode) {
    const policy = policies.get(countryCode.trim().toUpperCase());
    return policy ? {
      ...policy,
      checkedAt: new Date(policy.checkedAt),
      validUntil: policy.validUntil ? new Date(policy.validUntil) : null,
      evidenceIds: [...policy.evidenceIds],
    } : null;
  },
};

import type { JurisdictionPolicyStore } from "./types";

// The current schema has country and licence source facts, but no approved market-policy records.
// Shadow mode must therefore deny commercial capability rather than infer approval from those facts.
export const unavailableJurisdictionPolicyStore: JurisdictionPolicyStore = {
  async findByCountry() { return null; },
};

import {
  evaluateGbOperatorEligibility,
  unavailableGbOperatorEligibility,
  type GbOperatorEligibilityDecision,
  type GbOperatorEligibilityInput,
} from "@/lib/jurisdiction/gb-operator-eligibility";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

type EvidenceContext = Omit<GbOperatorEligibilityInput, "casino" | "now">;

export interface GbOperatorEligibilityAuthority {
  evaluate(casinoId: string, now: Date, context?: EvidenceContext): Promise<GbOperatorEligibilityDecision>;
  evaluateMany(casinoIds: string[], now: Date, context?: EvidenceContext): Promise<Map<string, GbOperatorEligibilityDecision>>;
}

export class GbOperatorEligibilityService implements GbOperatorEligibilityAuthority {
  constructor(private readonly source: CasinoDomainStore = casinoDomainRepository) {}

  async evaluate(casinoId: string, now: Date, context: EvidenceContext = {}) {
    try {
      const casino = await this.source.findById(casinoId);
      return casino ? evaluateGbOperatorEligibility({ casino, now, ...context }) : unavailableGbOperatorEligibility();
    } catch {
      return unavailableGbOperatorEligibility();
    }
  }

  async evaluateMany(casinoIds: string[], now: Date, context: EvidenceContext = {}) {
    const uniqueIds = [...new Set(casinoIds)];
    try {
      const casinos = await this.source.findManyByIds(uniqueIds);
      const byId = new Map(casinos.map((casino) => [casino.id, evaluateGbOperatorEligibility({ casino, now, ...context })]));
      return new Map(uniqueIds.map((id) => [id, byId.get(id) ?? unavailableGbOperatorEligibility()]));
    } catch {
      return new Map(uniqueIds.map((id) => [id, unavailableGbOperatorEligibility()]));
    }
  }
}

export const gbOperatorEligibilityService = new GbOperatorEligibilityService();

import {
  evaluateGbCommercialReadiness,
  unavailableGbCommercialReadiness,
  type GbCommercialJurisdictionDecision,
  type GbCommercialReadinessDecision,
  type GbCommercialRouteEvidence,
} from "@/lib/affiliate-commercial/gb-commercial-route-readiness";
import { gbCommercialDomainEvidenceStore, type GbCommercialDomainEvidenceStore } from "@/lib/affiliate-commercial/gb-domain-evidence";
import type { GbRedirectContractEvidence } from "@/lib/jurisdiction/gb-operator-eligibility";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

export interface GbCommercialReadinessRequest {
  casinoId: string;
  route: GbCommercialRouteEvidence;
  jurisdictionDecision: GbCommercialJurisdictionDecision;
  redirectContract: GbRedirectContractEvidence;
  founderWorldwideAuthority?: boolean;
  now: Date;
}

export interface GbCommercialReadinessAuthority {
  evaluate(input: GbCommercialReadinessRequest): Promise<GbCommercialReadinessDecision>;
  evaluateMany(inputs: readonly GbCommercialReadinessRequest[]): Promise<Map<string, GbCommercialReadinessDecision>>;
}

export class GbCommercialReadinessService implements GbCommercialReadinessAuthority {
  constructor(
    private readonly casinos: CasinoDomainStore = casinoDomainRepository,
    private readonly domains: GbCommercialDomainEvidenceStore = gbCommercialDomainEvidenceStore,
  ) {}

  async evaluate(input: GbCommercialReadinessRequest) {
    try {
      const casino = await this.casinos.findById(input.casinoId);
      if (!casino) return unavailableGbCommercialReadiness();
      const domainEvidence = this.domains.findExact(casino.id, casino.domain);
      return evaluateGbCommercialReadiness({ casino, domainEvidence, route: input.route, jurisdictionDecision: input.jurisdictionDecision, redirectContract: input.redirectContract, founderWorldwideAuthority: input.founderWorldwideAuthority, now: input.now });
    } catch {
      return unavailableGbCommercialReadiness();
    }
  }

  async evaluateMany(inputs: readonly GbCommercialReadinessRequest[]) {
    const unique = [...new Map(inputs.map((input) => [input.casinoId, input])).values()];
    try {
      const casinos = await this.casinos.findManyByIds(unique.map((input) => input.casinoId));
      const byId = new Map(casinos.map((casino) => [casino.id, casino]));
      return new Map(unique.map((input) => {
        const casino = byId.get(input.casinoId);
        if (!casino) return [input.casinoId, unavailableGbCommercialReadiness()];
        const domainEvidence = this.domains.findExact(casino.id, casino.domain);
        return [input.casinoId, evaluateGbCommercialReadiness({
          casino,
          domainEvidence,
          route: input.route,
          jurisdictionDecision: input.jurisdictionDecision,
          redirectContract: input.redirectContract,
          founderWorldwideAuthority: input.founderWorldwideAuthority,
          now: input.now,
        })];
      }));
    } catch {
      return new Map(unique.map((input) => [input.casinoId, unavailableGbCommercialReadiness()]));
    }
  }
}

export const gbCommercialReadinessService = new GbCommercialReadinessService();

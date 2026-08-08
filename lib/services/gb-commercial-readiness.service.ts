import type { CandidateOffer } from "@/lib/affiliate-routing/candidate-resolver";
import { evaluateGbCommercialReadiness, unavailableGbCommercialReadiness, type GbCommercialReadinessDecision } from "@/lib/affiliate-commercial/gb-commercial-readiness";
import { gbCommercialDomainEvidenceStore, type GbCommercialDomainEvidenceStore } from "@/lib/affiliate-commercial/gb-domain-evidence";
import type { JurisdictionDecision } from "@/lib/jurisdiction/types";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

export interface GbCommercialReadinessRequest {
  casinoId: string;
  offer: CandidateOffer;
  trackingLinkId: string;
  jurisdictionDecision: JurisdictionDecision;
  redirectContract: { slugActive: boolean; destinationServerOwned: boolean; destinationSafe: boolean };
  now: Date;
}

export interface GbCommercialReadinessAuthority {
  evaluate(input: GbCommercialReadinessRequest): Promise<GbCommercialReadinessDecision>;
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
      return evaluateGbCommercialReadiness({ casino, domainEvidence, offer: input.offer, trackingLinkId: input.trackingLinkId, jurisdictionDecision: input.jurisdictionDecision, redirectContract: input.redirectContract, now: input.now });
    } catch {
      return unavailableGbCommercialReadiness();
    }
  }
}

export const gbCommercialReadinessService = new GbCommercialReadinessService();

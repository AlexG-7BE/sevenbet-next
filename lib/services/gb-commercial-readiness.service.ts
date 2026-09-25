import {
  evaluateGbCommercialReadiness,
  unavailableGbCommercialReadiness,
  type GbCommercialJurisdictionDecision,
  type GbCommercialReadinessDecision,
  type GbCommercialRouteEvidence,
} from "@/lib/affiliate-commercial/gb-commercial-route-readiness";
import { gbCommercialDomainEvidenceStore, type GbCommercialDomainEvidenceStore } from "@/lib/affiliate-commercial/gb-domain-evidence";
import type { GbRedirectContractEvidence } from "@/lib/jurisdiction/gb-operator-eligibility";
import { marketAccess } from "@/lib/market-access/access";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

export interface GbCommercialReadinessRequest {
  casinoId: string;
  route: GbCommercialRouteEvidence;
  jurisdictionDecision: GbCommercialJurisdictionDecision;
  redirectContract: GbRedirectContractEvidence;
  founderWorldwideAuthority?: boolean;
  now: Date;
}

/**
 * RFC-054 (Founder instruction, 24 September 2026): market decisions follow the
 * operator's own licence. In Great Britain the licence register — each entry's
 * domain verified against the UKGC domain register — is the operator, domain
 * and partner evidence. A casino the register admits in GB is ready once the
 * jurisdiction admits referral; MarketActivation still owns route health,
 * bindings, date windows and the safe destination. A casino the register does
 * not admit never reaches this check (the market is closed before any route is read).
 */
function licenceRegisterReadiness(input: GbCommercialReadinessRequest, casinoSlug: string): GbCommercialReadinessDecision | null {
  if (!marketAccess(casinoSlug, "GB", input.now).open) return null;
  const jurisdiction = input.jurisdictionDecision;
  const founderSupersedesInternalGbDeny = input.founderWorldwideAuthority === true
    && ["COMMERCIAL_NOT_ACTIVE", "POLICY_STALE"].includes(jurisdiction.reasonCode);
  const jurisdictionAuthority = jurisdiction.countryCode === "GB"
    && ((jurisdiction.commercialAllowed && jurisdiction.referralAllowed) || founderSupersedesInternalGbDeny);
  if (!jurisdictionAuthority) return null;
  if (!Object.values(input.redirectContract).every(Boolean)) return null;
  const checkedAt = input.now.toISOString();
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
    operatorEligibility: {
      editorialEligible: true,
      operatorEvidenceEligible: true,
      commercialEligible: true,
      referralEligible: true,
      reasonCodes: ["GB_OPERATOR_ELIGIBLE"],
      evidenceCheckedAt: checkedAt,
      revalidateAt: null,
    },
    checkedAt,
    evidenceCheckedAt: checkedAt,
    revalidateAt: null,
  };
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
      const registered = licenceRegisterReadiness(input, casino.slug);
      if (registered) return registered;
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
        const registered = licenceRegisterReadiness(input, casino.slug);
        if (registered) return [input.casinoId, registered];
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

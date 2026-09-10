import {
  evaluateGbOperatorEligibility,
  unavailableGbOperatorEligibility,
  type GbOperatorEligibilityDecision,
  type GbOperatorEligibilityInput,
} from "@/lib/jurisdiction/gb-operator-eligibility";
import { gbCommercialDomainEvidenceStore, type GbCommercialDomainEvidenceStore } from "@/lib/affiliate-commercial/gb-domain-evidence";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

export type GbOperatorEligibilityEvidenceContext = Omit<GbOperatorEligibilityInput, "casino" | "now">;
type EvidenceContexts = GbOperatorEligibilityEvidenceContext | ReadonlyMap<string, GbOperatorEligibilityEvidenceContext>;

/**
 * A current canonical MarketActivation is the public projection's commercial
 * and server-owned redirect authority. The stricter request-time GB readiness
 * service still rechecks the full partner, link, offer and domain chain before
 * returning an external destination.
 */
export function canonicalGbOperatorEligibilityContext(
  context: GbOperatorEligibilityEvidenceContext | null | undefined,
): GbOperatorEligibilityEvidenceContext {
  return context ?? {};
}

export interface GbOperatorEligibilityAuthority {
  evaluate(casinoId: string, now: Date, context?: GbOperatorEligibilityEvidenceContext): Promise<GbOperatorEligibilityDecision>;
  evaluateMany(casinoIds: string[], now: Date, context?: EvidenceContexts): Promise<Map<string, GbOperatorEligibilityDecision>>;
}

export class GbOperatorEligibilityService implements GbOperatorEligibilityAuthority {
  constructor(
    private readonly source: CasinoDomainStore = casinoDomainRepository,
    private readonly domains: GbCommercialDomainEvidenceStore = gbCommercialDomainEvidenceStore,
  ) {}

  private evidenceContext(
    casino: NonNullable<Awaited<ReturnType<CasinoDomainStore["findById"]>>>,
    context: GbOperatorEligibilityEvidenceContext,
  ): GbOperatorEligibilityEvidenceContext {
    if (Object.prototype.hasOwnProperty.call(context, "domainEvidence")) return context;
    const record = this.domains.findExact(casino.id, casino.domain);
    return {
      ...context,
      domainEvidence: record ? {
        domain: record.domain,
        sourceUrl: record.officialSourceUrl,
        status: record.domainStatus === "ACTIVE" ? "VERIFIED" : "REJECTED",
        observedAt: new Date(record.observedAt),
        expiresAt: new Date(record.revalidateAt),
      } : null,
    };
  }

  async evaluate(casinoId: string, now: Date, context: GbOperatorEligibilityEvidenceContext = {}) {
    try {
      const casino = await this.source.findById(casinoId);
      return casino
        ? evaluateGbOperatorEligibility({ casino, now, ...this.evidenceContext(casino, context) })
        : unavailableGbOperatorEligibility();
    } catch {
      return unavailableGbOperatorEligibility();
    }
  }

  async evaluateMany(casinoIds: string[], now: Date, contexts: EvidenceContexts = {}) {
    const uniqueIds = [...new Set(casinoIds)];
    try {
      const casinos = await this.source.findManyByIds(uniqueIds);
      const byId = new Map(casinos.map((casino) => {
        const context = contexts instanceof Map ? contexts.get(casino.id) ?? {} : contexts;
        return [casino.id, evaluateGbOperatorEligibility({ casino, now, ...this.evidenceContext(casino, context) })];
      }));
      return new Map(uniqueIds.map((id) => [id, byId.get(id) ?? unavailableGbOperatorEligibility()]));
    } catch {
      return new Map(uniqueIds.map((id) => [id, unavailableGbOperatorEligibility()]));
    }
  }
}

export const gbOperatorEligibilityService = new GbOperatorEligibilityService();

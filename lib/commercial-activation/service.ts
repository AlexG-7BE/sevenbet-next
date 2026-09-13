import type { CommercialActivationBundle } from "./contract";
import { commercialActivationRepository, type CommercialActivationRepository } from "./repository";
import {
  finalizeCommercialActivationPlan,
  planCommercialActivationRecord,
  type CommercialActivationInspection,
  type CommercialActivationPlan,
} from "./planner";
import { jurisdictionResolver, type JurisdictionResolver } from "@/lib/jurisdiction/resolver";
import { partnerRouteService, type PartnerRouteService } from "@/lib/services/partner-route.service";

export interface CommercialActivationStore {
  inspect(record: CommercialActivationBundle["records"][number]): Promise<CommercialActivationInspection>;
}

export interface CommercialActivationVerification {
  schemaVersion: CommercialActivationBundle["schemaVersion"];
  bundleId: string;
  verified: boolean;
  productionReady: boolean;
  records: Array<{
    key: string;
    exactState: boolean;
    canonicalRouteReady: boolean;
    ctaReady: boolean;
    jurisdictionReason: string;
    blockedReasons: string[];
  }>;
}

export class CommercialActivationService {
  constructor(
    private readonly store: CommercialActivationStore = commercialActivationRepository as CommercialActivationRepository,
    private readonly routes: Pick<PartnerRouteService, "isCanonicalRouteActive"> = partnerRouteService,
    private readonly jurisdiction: Pick<JurisdictionResolver, "resolve"> = jurisdictionResolver,
  ) {}

  async preview(bundle: CommercialActivationBundle, now = new Date()): Promise<CommercialActivationPlan> {
    const inspections = await Promise.all(bundle.records.map((record) => this.store.inspect(record)));
    const records = bundle.records.map((record, index) => planCommercialActivationRecord(bundle, record, inspections[index], now));
    return finalizeCommercialActivationPlan(bundle, records);
  }

  async verify(bundle: CommercialActivationBundle, now = new Date()): Promise<CommercialActivationVerification> {
    const records = await Promise.all(bundle.records.map(async (record) => {
      const inspection = await this.store.inspect(record);
      const plan = planCommercialActivationRecord(bundle, record, inspection, now);
      const exactState = plan.ready && Object.values(plan.actions).every((action) => action === "UNCHANGED");
      let canonicalRouteReady = false;
      let jurisdictionReason = "JURISDICTION_DECISION_UNAVAILABLE";
      if (exactState && inspection.casino && inspection.offer && inspection.trackingLink && inspection.redirect) {
        try {
          const jurisdictionDecision = await this.jurisdiction.resolve({
            requestCountrySignal: { countryCode: record.market.countryCode, trust: "TRUSTED", observedAt: now },
            now,
          });
          jurisdictionReason = jurisdictionDecision.reasonCode;
          canonicalRouteReady = jurisdictionDecision.commercialAllowed
            && jurisdictionDecision.referralAllowed
            && await this.routes.isCanonicalRouteActive({
              casinoId: inspection.casino.id,
              countryCode: record.market.countryCode,
              redirectId: inspection.redirect.id,
              offerId: inspection.offer.id,
              trackingLinkId: inspection.trackingLink.id,
              now,
              commercialAllowed: jurisdictionDecision.commercialAllowed,
              referralAllowed: jurisdictionDecision.referralAllowed,
              redirectEnabled: true,
            });
        } catch {
          canonicalRouteReady = false;
        }
      }
      return { key: plan.key, exactState, canonicalRouteReady, ctaReady: canonicalRouteReady, jurisdictionReason, blockedReasons: plan.blockedReasons };
    }));
    return {
      schemaVersion: bundle.schemaVersion,
      bundleId: bundle.bundleId,
      verified: records.every((record) => record.exactState),
      productionReady: records.every((record) => record.ctaReady),
      records,
    };
  }

}

export const commercialActivationService = new CommercialActivationService();

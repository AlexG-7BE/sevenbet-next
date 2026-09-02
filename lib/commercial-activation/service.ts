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
  apply(bundle: CommercialActivationBundle, actorId: string, now: Date): Promise<Array<{
    key: string;
    changed: boolean;
    ids: { networkId: string; programId: string; offerId: string; trackingLinkId: string; redirectId: string };
  }>>;
}

export interface CommercialActivationVerification {
  schemaVersion: CommercialActivationBundle["schemaVersion"];
  bundleId: string;
  verified: boolean;
  productionReady: boolean;
  records: Array<{
    key: string;
    exactState: boolean;
    productionEligible: boolean;
    ctaReady: boolean;
    jurisdictionReason: string;
    blockedReasons: string[];
  }>;
}

export class CommercialActivationService {
  constructor(
    private readonly store: CommercialActivationStore = commercialActivationRepository as CommercialActivationRepository,
    private readonly productionRoutes: Pick<PartnerRouteService, "isProductionEligible"> = partnerRouteService,
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
      let productionEligible = false;
      let jurisdictionReason = "JURISDICTION_DECISION_UNAVAILABLE";
      if (exactState && inspection.casino && inspection.offer && inspection.trackingLink && inspection.redirect) {
        try {
          const jurisdictionDecision = await this.jurisdiction.resolve({
            requestCountrySignal: { countryCode: record.market.countryCode, trust: "TRUSTED", observedAt: now },
            now,
          });
          jurisdictionReason = jurisdictionDecision.reasonCode;
          productionEligible = await this.productionRoutes.isProductionEligible({
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
          productionEligible = false;
        }
      }
      return { key: plan.key, exactState, productionEligible, ctaReady: productionEligible, jurisdictionReason, blockedReasons: plan.blockedReasons };
    }));
    return {
      schemaVersion: bundle.schemaVersion,
      bundleId: bundle.bundleId,
      verified: records.every((record) => record.exactState),
      productionReady: records.every((record) => record.ctaReady),
      records,
    };
  }

  async apply(bundle: CommercialActivationBundle, actorId: string, now = new Date()) {
    const preview = await this.preview(bundle, now);
    if (!preview.ready) {
      const reasons = preview.records.flatMap((record) => record.blockedReasons.map((reason) => `${record.key}:${reason}`));
      throw new Error(`COMMERCIAL_ACTIVATION_BLOCKED:${reasons.join(",")}`);
    }
    const records = await this.store.apply(bundle, actorId, now);
    const verification = await this.verify(bundle, now);
    if (!verification.verified) throw new Error("COMMERCIAL_ACTIVATION_POST_APPLY_VERIFICATION_FAILED");
    return {
      schemaVersion: bundle.schemaVersion,
      bundleId: bundle.bundleId,
      applied: true,
      changedRecords: records.filter((record) => record.changed).length,
      unchangedRecords: records.filter((record) => !record.changed).length,
      records: records.map((record) => ({ key: record.key, changed: record.changed, ids: record.ids })),
      verification,
    };
  }
}

export const commercialActivationService = new CommercialActivationService();

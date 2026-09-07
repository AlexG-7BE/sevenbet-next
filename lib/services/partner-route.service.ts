import { projectPartnerRoutes, type PartnerRouteProjection } from "@/lib/affiliate-routing/partner-route-projection";
import { marketActivationRuntime, type MarketActivationRuntime } from "@/lib/market-activation/runtime";
import { partnerRouteRepository, type PartnerRouteStore } from "@/lib/repositories/partner-route.repository";

export class PartnerRouteService {
  constructor(
    private readonly store: PartnerRouteStore = partnerRouteRepository,
    private readonly activations: Pick<MarketActivationRuntime, "isActive"> = marketActivationRuntime,
  ) {}

  async resolve(casinoIds: string[], countryCode: string, options: { now?: Date; commercialAllowed?: boolean; referralAllowed?: boolean; redirectEnabled?: boolean } = {}): Promise<PartnerRouteProjection[]> {
    // Legacy projection retained for migration shadowing and route-health
    // diagnostics. It is not a public Production authority after RFC-042.
    const country = countryCode.trim().toUpperCase();
    if (!country) return [];
    return projectPartnerRoutes(await this.store.listCandidates(casinoIds, country), { countryCode: country, ...options });
  }

  async isProductionEligible(input: {
    casinoId: string;
    countryCode: string;
    redirectId: string;
    offerId: string;
    trackingLinkId: string;
    now?: Date;
    commercialAllowed?: boolean;
    referralAllowed?: boolean;
    redirectEnabled?: boolean;
  }) {
    return this.activations.isActive({
      casinoId: input.casinoId,
      countryCode: input.countryCode,
      redirectId: input.redirectId,
      offerId: input.offerId,
      trackingLinkId: input.trackingLinkId,
    });
  }
}

export const partnerRouteService = new PartnerRouteService();

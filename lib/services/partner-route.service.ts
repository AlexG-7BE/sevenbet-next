import { projectPartnerRoutes, type PartnerRouteProjection } from "@/lib/affiliate-routing/partner-route-projection";
import { partnerRouteRepository, type PartnerRouteStore } from "@/lib/repositories/partner-route.repository";

export class PartnerRouteService {
  constructor(private readonly store: PartnerRouteStore = partnerRouteRepository) {}

  async resolve(casinoIds: string[], countryCode: string, options: { now?: Date; commercialAllowed?: boolean; referralAllowed?: boolean; redirectEnabled?: boolean } = {}): Promise<PartnerRouteProjection[]> {
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
    const routes = await this.resolve([input.casinoId], input.countryCode, input);
    return routes.some((route) => route.productionEligible
      && route.redirect.id === input.redirectId
      && route.offer.id === input.offerId
      && route.tracking.id === input.trackingLinkId);
  }
}

export const partnerRouteService = new PartnerRouteService();

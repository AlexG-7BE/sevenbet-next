import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";

export interface PublicOfferStore {
  listOffers(options?: { includeCommercial?: boolean; countryCode?: string }): Promise<PublicOfferDTO[]>;
}

export class PublicOfferRepository implements PublicOfferStore {
  constructor(
    private readonly casinoStore: PublicCasinoStore = publicCasinoRepository,
    private readonly options: { redirectEnabled?: boolean; now?: Date } = {},
  ) {}

  async listOffers(options: { includeCommercial?: boolean; countryCode?: string } = {}) {
    const published = await this.casinoStore.listPublished(options.countryCode);
    const redirectEnabled = (options.includeCommercial ?? true) && (this.options.redirectEnabled ?? isAffiliateRedirectEnabled());
    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (redirectEnabled && published.length) {
      try {
        routes = await this.casinoStore.listActiveAffiliateRoutes(published.map((entry) => entry.casinoId), options.countryCode, this.options.now);
      } catch {
        // Published editorial offers remain visible without commercial actions.
      }
    }
    return published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, routes, { redirectEnabled, now: this.options.now, countryCode: options.countryCode });
      return casino ? publicCasinoToOffers(casino) : [];
    });
  }
}

export const publicOfferRepository = new PublicOfferRepository();

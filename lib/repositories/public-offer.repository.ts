import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import type { PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";
import type { GbOperatorEligibilityEvidenceContext } from "@/lib/services/gb-operator-eligibility.service";
import {
  extractOfferCandidatesFromPublishedRecords,
  publicOfferPresentation,
  resolvePublishedOfferInventory,
  withOfferPresentation,
} from "@/lib/public-offer/offer-presentation";

export type PublicOfferRecord = PublicOfferDTO & {
  /** Internal server projection context; stripped by PublicOfferService. */
  operatorEligibilityContext?: GbOperatorEligibilityEvidenceContext;
};

export interface PublicOfferStore {
  listOffers(options?: { includeCommercial?: boolean; countryCode?: string; commercialMarketCode?: string; presentationLanguage?: string }): Promise<PublicOfferRecord[]>;
}

export class PublicOfferRepository implements PublicOfferStore {
  constructor(
    private readonly casinoStore: PublicCasinoStore = publicCasinoRepository,
    private readonly options: { redirectEnabled?: boolean; now?: Date } = {},
  ) {}

  async listOffers(options: { includeCommercial?: boolean; countryCode?: string; commercialMarketCode?: string; presentationLanguage?: string } = {}) {
    const published = await this.casinoStore.listPublished(options.countryCode);
    let candidates: PublishedOfferCandidate[];
    if (!published.length) {
      candidates = [];
    } else if (!this.casinoStore.listPublishedOfferCandidates) {
      candidates = extractOfferCandidatesFromPublishedRecords(published, this.options.now);
    } else try {
      candidates = await this.casinoStore.listPublishedOfferCandidates(
        published.map((entry) => entry.casinoId),
        this.options.now,
      );
    } catch {
      candidates = extractOfferCandidatesFromPublishedRecords(published, this.options.now);
    }
    const redirectEnabled = (options.includeCommercial ?? true) && (this.options.redirectEnabled ?? isAffiliateRedirectEnabled());
    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (redirectEnabled && published.length) {
      try {
        routes = await this.casinoStore.listActiveAffiliateRoutes(
          published.map((entry) => entry.casinoId),
          options.commercialMarketCode ?? options.countryCode,
          this.options.now,
        );
      } catch {
        // Published editorial offers remain visible without commercial actions.
      }
    }
    return published.flatMap((entry) => {
      const mapped = mapPublishedCasino(entry, routes, {
        redirectEnabled,
        now: this.options.now,
        countryCode: options.countryCode,
        presentationLanguage: options.presentationLanguage,
      });
      if (!mapped) return [];
      const casinoCandidates = candidates.filter((candidate) => candidate.casinoId === mapped.id);
      const casino = withOfferPresentation(mapped, casinoCandidates, options.countryCode);
      const inventory = resolvePublishedOfferInventory(casinoCandidates, options.countryCode).map((resolved) => {
        const existing = resolved.relation !== "OTHER_MARKET"
          ? casino.bonuses.find((bonus) => bonus.id === resolved.candidate.bonus.id) ?? null
          : null;
        const bonus = existing ?? resolved.candidate.bonus;
        return {
          bonus,
          presentation: publicOfferPresentation(resolved, bonus, options.countryCode),
        };
      });
      const operatorEligibilityContext = routes.find((route) => route.casinoId === mapped.id)?.operatorEligibilityContext;
      return publicCasinoToOffers(casino, inventory).map((offer) => ({
        ...offer,
        ...(operatorEligibilityContext ? { operatorEligibilityContext } : {}),
      }));
    });
  }
}

export const publicOfferRepository = new PublicOfferRepository();

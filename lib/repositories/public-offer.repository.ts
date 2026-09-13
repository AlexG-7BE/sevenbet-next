import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import type { PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";
import {
  extractOfferCandidatesFromPublishedRecords,
  publicOfferPresentation,
  resolvePublishedOfferInventory,
  withOfferPresentation,
} from "@/lib/public-offer/offer-presentation";

export type PublicOfferRecord = PublicOfferDTO;

export interface PublicOfferStore {
  listOffers(options?: { countryCode?: string; presentationLanguage?: string }): Promise<PublicOfferRecord[]>;
}

export class PublicOfferRepository implements PublicOfferStore {
  constructor(
    private readonly casinoStore: PublicCasinoStore = publicCasinoRepository,
    private readonly options: { now?: Date } = {},
  ) {}

  async listOffers(options: { countryCode?: string; presentationLanguage?: string } = {}) {
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
    return published.flatMap((entry) => {
      const mapped = mapPublishedCasino(entry, {
        now: this.options.now,
        countryCode: options.countryCode,
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
      return publicCasinoToOffers(casino, inventory);
    });
  }
}

export const publicOfferRepository = new PublicOfferRepository();

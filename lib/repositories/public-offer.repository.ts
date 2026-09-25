import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import type { PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";
import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG, publicEditorialCache } from "@/lib/public-editorial-cache";
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

async function projectEditorialOffers(
  casinoStore: PublicCasinoStore,
  options: { countryCode?: string; presentationLanguage?: string },
  now?: Date,
) {
  const published = await casinoStore.listPublished(options.countryCode);
  let candidates: PublishedOfferCandidate[];
  if (!published.length) {
    candidates = [];
  } else if (!casinoStore.listPublishedOfferCandidates) {
    candidates = extractOfferCandidatesFromPublishedRecords(published, now);
  } else try {
    candidates = await casinoStore.listPublishedOfferCandidates(
      published.map((entry) => entry.casinoId),
      now,
    );
  } catch {
    candidates = extractOfferCandidatesFromPublishedRecords(published, now);
  }
  return published.flatMap((entry) => {
    const mapped = mapPublishedCasino(entry, { now, countryCode: options.countryCode });
    if (!mapped) return [];
    const casinoCandidates = candidates.filter((candidate) => candidate.casinoId === mapped.id);
    const casino = withOfferPresentation(mapped, casinoCandidates, options.countryCode);
    const inventory = resolvePublishedOfferInventory(casinoCandidates, options.countryCode).map((resolved) => {
      const existing = resolved.relation !== "OTHER_MARKET"
        ? casino.bonuses.find((bonus) => bonus.id === resolved.candidate.bonus.id) ?? null
        : null;
      const bonus = existing ?? resolved.candidate.bonus;
      return { bonus, presentation: publicOfferPresentation(resolved, bonus, options.countryCode) };
    });
    return publicCasinoToOffers(casino, inventory);
  });
}

// Keyed by market only: the projection does not depend on the page language, and a language
// in the key would make every market × language pair rebuild it separately.
const cachedEditorialOffers = publicEditorialCache(
  async (countryCode: string | null) => projectEditorialOffers(
    publicCasinoRepository,
    countryCode ? { countryCode } : {},
  ),
  ["public-offer-editorial-projection-v1"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

export class PublicOfferRepository implements PublicOfferStore {
  constructor(
    private readonly casinoStore: PublicCasinoStore = publicCasinoRepository,
    private readonly options: { now?: Date } = {},
  ) {}

  async listOffers(options: { countryCode?: string; presentationLanguage?: string } = {}) {
    if (this.casinoStore === publicCasinoRepository && this.options.now === undefined) {
      return cachedEditorialOffers(options.countryCode?.trim().toUpperCase() || null);
    }
    return projectEditorialOffers(this.casinoStore, options, this.options.now);
  }
}

export const publicOfferRepository = new PublicOfferRepository();

import { casinosForCollectionView } from "@/lib/commercial/commercial-presentation";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { REVIEW_INDEX_MARKETS, reviewIndexable } from "@/lib/seo/review-indexing";

export const LICENSED_NEIGHBOURS_LIMIT = 6;

export type LicensedNeighbour = Readonly<{ slug: string; name: string; rating: number | null }>;

/** The market whose licence a review page's neighbours must hold: the route language's market. */
export function licensedNeighbourMarket(language: string) {
  return REVIEW_INDEX_MARKETS[language] ?? null;
}

/**
 * The reviews a review page links to under "Other casinos licensed in <country>" (Founder's choice
 * in the affiliate traffic audit, 15 October 2026): published reviews indexed in this language —
 * so licensed in its market and not blocked there — in the catalogue's own default order, without
 * the page's own casino. Languages without a licence market get none, and an empty list hides the
 * block (Germany has two licensed reviews, so one of them shows one neighbour).
 */
export function licensedNeighbours(
  cards: readonly PublicCasinoCardDto[],
  currentSlug: string,
  language: string,
  limit = LICENSED_NEIGHBOURS_LIMIT,
): LicensedNeighbour[] {
  if (!licensedNeighbourMarket(language)) return [];
  const current = currentSlug.trim().toLowerCase();
  return casinosForCollectionView(cards, "top_rated")
    .filter((card) => card.dataClassification === "PUBLISHED_RECORD" && card.slug.toLowerCase() !== current && reviewIndexable(card.slug, language))
    .slice(0, limit)
    .map((card) => ({ slug: card.slug, name: card.name, rating: card.rating }));
}

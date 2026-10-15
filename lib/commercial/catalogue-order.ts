import { REVIEW_INDEX_MARKETS, reviewIndexable } from "@/lib/seo/review-indexing";

/**
 * Offers withheld from a market while the casino keeps its partner route there
 * (`withheld` in data/casino-global-catalog-01/offers-<market>.v1.json; tests keep the two in
 * step). Such a casino's button opens the casino, not an offer, so the catalogue order does not
 * count it as a button (affiliate traffic audit, 15 October 2026).
 */
export const WITHHELD_OFFER_MARKETS: readonly Readonly<{ casinoSlug: string; market: string }>[] = Object.freeze([
  { casinoSlug: "turbonino", market: "GB" },
  { casinoSlug: "drueckglueck", market: "GB" },
]);

export function offerWithheldInMarket(slug: string, market: string | null | undefined) {
  const country = market?.trim().toUpperCase().slice(0, 2);
  const key = slug.trim().toLowerCase();
  return Boolean(country && WITHHELD_OFFER_MARKETS.some((entry) => entry.casinoSlug === key && entry.market === country));
}

/**
 * Whether a casino is licensed in the market of the page's language (en→GB, sv→SE, da→DK,
 * de→DE; lib/seo/review-indexing.ts) — read from the licence register, never from the visitor,
 * so a crawler fetching from the United States sees the same licensed casinos first.
 */
export function licensedInRouteMarket(slug: string, language: string | null | undefined) {
  return Boolean(language && REVIEW_INDEX_MARKETS[language] && reviewIndexable(slug, language));
}

/** Who the catalogue is ordered for: the page's language and the visitor's market. */
export type CatalogueOrderContext = Readonly<{ language?: string | null; market?: string | null }>;

/**
 * The catalogue tiers (Founder's choice in the affiliate traffic audit, 15 October 2026):
 * 0 — a partner button for this visitor (a withheld offer does not count);
 * 1 — licensed in the page language's market;
 * 2 — the rest. Inside a tier the view's own order (editorial rating) holds.
 */
export function catalogueTier(slug: string, hasButton: boolean, context: CatalogueOrderContext = {}) {
  if (hasButton && !offerWithheldInMarket(slug, context.market)) return 0;
  return licensedInRouteMarket(slug, context.language) ? 1 : 2;
}

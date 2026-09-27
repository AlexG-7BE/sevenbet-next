import type { PublicOfferSearchResult } from "@/lib/public-offer/public-offer.types";

/**
 * The one rule for whether the Bonuses directory may be indexed, shared by the page's robots
 * and the sitemap: published offers only (no demonstration or unavailable inventory) and at
 * least one of them. The page applies it to what its visitor is shown; the sitemap applies
 * it to what a crawler is shown (see app/sitemap.ts).
 */
export function bonusDirectoryIndexable(result: Pick<PublicOfferSearchResult, "total" | "inventoryMode"> | null | undefined) {
  return Boolean(result && result.total > 0 && result.inventoryMode === "PUBLISHED_ONLY");
}

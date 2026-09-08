import { createHash } from "node:crypto";

import { CASINO_COMMERCIAL_VISIBILITY_RELEASE, superflyCommercialCatalog } from "@/lib/casino-commercial-visibility/catalog";
import { deterministicCasinoIngestionId } from "@/lib/casino-ingestion/importer";

export const MEDIA_GEO3_RELEASE = "MEDIA-GEO3";
export const MEDIA_GEO3_CATALOG_VERSION = "media-geo3:current-offer-catalog:v1";
export const MEDIA_GEO3_CATALOG_SLUGS = ["diamond7", "gday-casino", "21-prive"] as const;
export const MEDIA_GEO3_CATALOG_PLACEMENTS = ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"] as const;
export const MEDIA_GEO3_PREFLIGHT_TARGET = { countryCode: "KZ", languageCode: "en" } as const;
export const MEDIA_GEO3_PREFLIGHT_DEVICES = ["DESKTOP", "MOBILE"] as const;

export const mediaGeo3CurrentOfferCatalog = superflyCommercialCatalog.filter((definition) => (
  definition.media?.role === "CURRENT_OFFER_CREATIVE"
));

export function assertMediaGeo3Catalog() {
  const expected = new Set<string>(MEDIA_GEO3_CATALOG_SLUGS);
  const actual = new Set<string>(mediaGeo3CurrentOfferCatalog.map((definition) => definition.slug));
  if (actual.size !== expected.size || [...expected].some((slug) => !actual.has(slug))) {
    throw new Error("MEDIA-GEO3 exact-offer catalog differs from the Founder-authorized bounded set.");
  }
  for (const definition of mediaGeo3CurrentOfferCatalog) {
    if (!definition.media || definition.media.role !== "CURRENT_OFFER_CREATIVE") {
      throw new Error(`${definition.slug}: MEDIA-GEO3 refuses non-current promotional artwork.`);
    }
  }
  return mediaGeo3CurrentOfferCatalog;
}

export function mediaGeo3Id(slug: string, ...parts: string[]) {
  return deterministicCasinoIngestionId([MEDIA_GEO3_CATALOG_VERSION, slug, ...parts].join(":"));
}

export function mediaGeo3IdentityKey(slug: string) {
  return `${MEDIA_GEO3_CATALOG_VERSION}:${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${slug}`;
}

export function mediaGeo3PayloadHash(input: {
  slug: string;
  casinoId: string;
  affiliateOfferId: string;
  casinoBonusId: string | null;
  mediaAssetId: string;
  mediaChecksum: string;
}) {
  return createHash("sha256").update(JSON.stringify({
    release: MEDIA_GEO3_RELEASE,
    catalog: MEDIA_GEO3_CATALOG_VERSION,
    placements: MEDIA_GEO3_CATALOG_PLACEMENTS,
    targeting: { countryCode: null, languageCode: null, languageState: "NEUTRAL" },
    renderingMode: "CONTAIN",
    ...input,
  })).digest("hex");
}

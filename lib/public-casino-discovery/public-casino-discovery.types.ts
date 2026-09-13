import type { PublishedCasinoSnapshotRecord, PublicOfferPresentation, PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";
import type { GovernedCommercialAction } from "@/lib/commercial/governed-commercial-action";
import type { MediaPlacementVariantName, MediaRenderingModeName, PlacementMediaSource } from "@/lib/media/placement-media";

export type CasinoDiscoverySort = "FEATURED" | "RELEVANCE" | "NEWEST" | "NAME_ASC" | "NAME_DESC";

export interface CasinoDiscoveryQuery {
  search?: string;
  country?: string[];
  currency?: string[];
  license?: string[];
  payment?: string[];
  gameProvider?: string[];
  category?: string[];
  bonusType?: string[];
  hasBonus?: boolean;
  hasAvailableVisitAction?: boolean;
  hasResponsibleGambling?: boolean;
  supportsCrypto?: boolean;
  supportsMobile?: boolean;
  sort?: CasinoDiscoverySort;
  page?: number;
  pageSize?: number;
  /** Local-only visual fixture transport; runtime activation remains separately environment-gated. */
  visualFixture?: true;
}

export interface PublicLabelDto { key: string; label: string }
export interface PublicMediaDto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  /** Explicit server-owned classification; absence never implies editorial ownership. */
  ownership?: "B4GAMBLE_EDITORIAL";
  variants?: Partial<Record<MediaPlacementVariantName, Omit<PublicMediaDto, "variants">>>;
  renderingMode?: Exclude<MediaRenderingModeName, "AUTO">;
  source?: PlacementMediaSource;
  focalPoint?: { x: number; y: number } | null;
}
export type PublicCasinoDataClassification = "DEMO_FIXTURE" | "LOCAL_PREVIEW_FIXTURE" | "PUBLISHED_RECORD";
export type PublicCasinoInventoryMode = "DEMO_ONLY" | "MIXED" | "PUBLISHED_ONLY";

export interface PublicBonusSummaryDto {
  title: string;
  summary: string;
  type: string;
  keyTerms: string[];
  wageringRequirement: number | null;
  minimumDeposit: number | null;
  currency: string | null;
  validUntil: string | null;
  termsApply: true;
  presentation?: Omit<PublicOfferPresentation, "selectedOffer">;
}

export interface PublicCasinoCardDto {
  id: string;
  dataClassification: PublicCasinoDataClassification;
  slug: string;
  reviewHref?: string | null;
  name: string;
  logo: PublicMediaDto | null;
  hero?: PublicMediaDto | null;
  shortDescription: string | null;
  rating: number | null;
  reviewCount: number | null;
  licenses: PublicLabelDto[];
  countries: PublicLabelDto[];
  paymentMethods: PublicLabelDto[];
  /** Canonical source strings; consumer components must normalize before rendering. */
  withdrawalTimes?: string[];
  gameProviders: PublicLabelDto[];
  categories: PublicLabelDto[];
  highlights: string[];
  supportsCrypto?: boolean;
  supportsMobile?: boolean;
  featuredBonus: PublicBonusSummaryDto | null;
  action: GovernedCommercialAction | null;
  responsibleGamblingLabel: string | null;
  publishedAt: string | null;
  editorialUpdatedAt: string | null;
}

export interface CasinoDiscoveryFacetValue extends PublicLabelDto { count: number }
export interface CasinoDiscoveryFacets {
  countries: CasinoDiscoveryFacetValue[];
  currencies: CasinoDiscoveryFacetValue[];
  licenses: CasinoDiscoveryFacetValue[];
  payments: CasinoDiscoveryFacetValue[];
  gameProviders: CasinoDiscoveryFacetValue[];
  categories: CasinoDiscoveryFacetValue[];
  bonusTypes: CasinoDiscoveryFacetValue[];
}

export interface CasinoDiscoveryResult {
  items: PublicCasinoCardDto[];
  curated?: { bestBonusCasinoIds: string[] };
  inventoryMode: PublicCasinoInventoryMode;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: CasinoDiscoveryFacets;
  appliedFilters: CasinoDiscoveryQuery;
}

export interface DiscoveryAlias { casinoId: string; value: string }
export interface DiscoveryContext {
  aliases: DiscoveryAlias[];
}

export interface PublicCasinoDiscoveryStore {
  listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]>;
  listPublishedOfferCandidates?(casinoIds: string[], now?: Date): Promise<PublishedOfferCandidate[]>;
  loadContext(casinoIds: string[], options?: { includeAliases?: boolean }): Promise<DiscoveryContext>;
}

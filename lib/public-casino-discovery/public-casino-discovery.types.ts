import type { PublishedCasinoSnapshotRecord } from "@/lib/public-casino/public-casino.types";

export type CasinoDiscoverySort = "FEATURED" | "RELEVANCE" | "NEWEST" | "NAME_ASC" | "NAME_DESC";

export interface CasinoDiscoveryQuery {
  search?: string;
  country?: string[];
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
}

export interface PublicLabelDto { key: string; label: string }
export interface PublicMediaDto { url: string; alt: string; width: number | null; height: number | null }
export interface PublicVisitAction { available: boolean; redirectSlug: string | null; label: string; reasonCode: string | null }

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
}

export interface PublicCasinoCardDto {
  id: string;
  slug: string;
  name: string;
  logo: PublicMediaDto | null;
  shortDescription: string | null;
  rating: number | null;
  reviewCount: number | null;
  licenses: PublicLabelDto[];
  countries: PublicLabelDto[];
  paymentMethods: PublicLabelDto[];
  gameProviders: PublicLabelDto[];
  categories: PublicLabelDto[];
  highlights: string[];
  featuredBonus: PublicBonusSummaryDto | null;
  visitAction: PublicVisitAction;
  responsibleGamblingLabel: string | null;
  publishedAt: string | null;
  editorialUpdatedAt: string | null;
}

export interface CasinoDiscoveryFacetValue extends PublicLabelDto { count: number }
export interface CasinoDiscoveryFacets {
  countries: CasinoDiscoveryFacetValue[];
  licenses: CasinoDiscoveryFacetValue[];
  payments: CasinoDiscoveryFacetValue[];
  gameProviders: CasinoDiscoveryFacetValue[];
  categories: CasinoDiscoveryFacetValue[];
  bonusTypes: CasinoDiscoveryFacetValue[];
}

export interface CasinoDiscoveryResult {
  items: PublicCasinoCardDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: CasinoDiscoveryFacets;
  appliedFilters: CasinoDiscoveryQuery;
}

export interface DiscoveryAlias { casinoId: string; value: string }
export interface DiscoveryRedirect { casinoId: string; casinoBonusId: string | null; affiliateOfferId: string | null; slug: string }
export interface DiscoveryGeoRule { countryCode: string; mode: "GLOBAL" | "ALLOW" | "BLOCK" }
export interface DiscoveryOffer {
  id: string;
  casinoId: string;
  casinoBonusId: string | null;
  status: string;
  archivedAt: Date | null;
  startAt: Date | null;
  expiresAt: Date | null;
  featured: boolean;
  priority: number;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  countries: DiscoveryGeoRule[];
  program: { status: string; archivedAt: Date | null; network: { active: boolean; archivedAt: Date | null } };
  trackingLinks: Array<{
    id: string; active: boolean; archivedAt: Date | null; validFrom: Date | null; expiresAt: Date | null;
    priority: number; geoMode: "GLOBAL" | "ALLOW" | "BLOCK"; countries: DiscoveryGeoRule[];
  }>;
}
export interface DiscoveryContext {
  aliases: DiscoveryAlias[];
  offers: DiscoveryOffer[];
  redirects: DiscoveryRedirect[];
}

export interface PublicCasinoDiscoveryStore {
  listPublished(): Promise<PublishedCasinoSnapshotRecord[]>;
  loadContext(casinoIds: string[], options?: { includeAliases?: boolean; includeCommercial?: boolean }): Promise<DiscoveryContext>;
}

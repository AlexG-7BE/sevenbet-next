import type { PublicCasinoAffiliate, PublicCasinoMedia } from "@/lib/public-casino/public-casino.types";

export type PublicOfferAvailability = "AVAILABLE" | "UNAVAILABLE";
export type PublicOfferSort = "editorial" | "newest" | "highest-bonus" | "lowest-wagering" | "lowest-deposit";
export type PublicOfferDataClassification = "DEMO_FIXTURE" | "PUBLISHED_RECORD";
export type PublicOfferInventoryMode = "DEMO_ONLY" | "MIXED" | "PUBLISHED_ONLY";
export type PublicOfferProjectionMode = PublicOfferInventoryMode | "UNAVAILABLE";

export interface PublicOfferDTO {
  casino: {
    id: string;
    slug: string;
    name: string;
    summary: string;
    logo: PublicCasinoMedia | null;
    hero: PublicCasinoMedia | null;
    editorScore: number;
    featured: boolean;
    recommended: boolean;
    publishedAt: string | null;
    lastReviewedAt: string | null;
    countries: Array<{ countryCode: string; availability: string }>;
    licenses: Array<{ authority: string; jurisdiction: string | null; status: string }>;
    payments: Array<{
      key: string;
      name: string;
      minimumDeposit: number | null;
      supportsWithdrawals: boolean;
      withdrawalTime: string | null;
      minimumWithdrawal: number | null;
      maximumWithdrawal: number | null;
      fees: string | null;
      crypto: boolean;
    }>;
    responsibleGamblingTools: string[];
  };
  bonus: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    type: string;
    percentage: number | null;
    maximumBonus: number | null;
    currency: string | null;
    freeSpins: number | null;
    minimumDeposit: number | null;
    wageringMultiplier: number | null;
    wageringText: string | null;
    eligibility: string | null;
    importantConditions: string[];
    startsAt: string | null;
    expiresAt: string | null;
  };
  action: PublicCasinoAffiliate;
  commercialAvailability: PublicOfferAvailability;
  dataClassification: PublicOfferDataClassification;
}
export interface PublicOfferQuery {
  country?: string;
  type?: string;
  payment?: string;
  crypto?: boolean;
  maxDeposit?: number;
  maxWagering?: number;
  availability?: PublicOfferAvailability;
  featured?: boolean;
  recommended?: boolean;
  sort: PublicOfferSort;
  page: number;
  pageSize: number;
}

export interface PublicOfferFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface PublicOfferFacets {
  countries: PublicOfferFacetValue[];
  types: PublicOfferFacetValue[];
  payments: PublicOfferFacetValue[];
  crypto: PublicOfferFacetValue[];
  availability: PublicOfferFacetValue[];
}

export interface PublicOfferSearchResult {
  records: PublicOfferDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  query: PublicOfferQuery;
  facets: PublicOfferFacets;
  inventoryMode: PublicOfferProjectionMode;
}

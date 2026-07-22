export type PublicCasinoSource = "cms" | "legacy";

export interface PublicCasinoMedia {
  id: string;
  type: "logo" | "hero" | "screenshot" | "gallery" | "social" | "other";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  caption: string | null;
}

export interface PublicCasinoAffiliate {
  href: string | null;
  available: boolean;
}

export interface PublicCasinoBonus {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  percentage: number | null;
  minimumDeposit: number | null;
  maximumBonus: number | null;
  currency: string | null;
  freeSpins: number | null;
  wageringMultiplier: number | null;
  wageringText: string | null;
  eligibility: string | null;
  importantConditions: string[];
  termsUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  affiliate: PublicCasinoAffiliate;
}

export interface PublicCasinoDTO {
  source: PublicCasinoSource;
  id: string;
  slug: string;
  name: string;
  title: string;
  domain: string;
  summary: string;
  reviewContent: string;
  operator: string | null;
  foundedYear: number | null;
  editorScore: number;
  trustScore: number | null;
  featured: boolean;
  recommended: boolean;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  version: number;
  languages: string[];
  currencies: string[];
  pros: string[];
  cons: string[];
  responsibleGamblingTools: string[];
  seo: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    socialTitle: string;
    socialDescription: string;
    socialImage: string | null;
    structuredData: Record<string, unknown> | Array<Record<string, unknown>> | null;
  };
  licenses: Array<{
    authority: string;
    licenseNumber: string | null;
    jurisdiction: string | null;
    status: string;
    verificationUrl: string | null;
    expiresAt: string | null;
    lastVerifiedAt: string | null;
  }>;
  countries: Array<{
    countryCode: string;
    availability: string;
    minimumAge: number | null;
    currency: string | null;
    language: string | null;
  }>;
  payments: Array<{
    key: string;
    name: string;
    supportsDeposits: boolean;
    supportsWithdrawals: boolean;
    currencies: string[];
    minimumDeposit: number | null;
    minimumWithdrawal: number | null;
    maximumWithdrawal: number | null;
    depositProcessingTime: string | null;
    withdrawalTime: string | null;
    fees: string | null;
    crypto: boolean;
  }>;
  providers: Array<{ key: string; name: string; gameCount: number | null; liveCasino: boolean }>;
  categories: Array<{ key: string; name: string; gameCount: number | null; featured: boolean }>;
  bonuses: PublicCasinoBonus[];
  media: {
    logo: PublicCasinoMedia | null;
    hero: PublicCasinoMedia | null;
    screenshots: PublicCasinoMedia[];
    gallery: PublicCasinoMedia[];
    socialImage: PublicCasinoMedia | null;
  };
  affiliate: PublicCasinoAffiliate;
}

export interface PublishedCasinoSnapshotRecord {
  casinoId: string;
  version: number;
  status: string;
  snapshot: unknown;
  publishedAt: Date | null;
  archivedAt: Date | null;
}

export interface PublicAffiliateRoute {
  casinoId: string;
  casinoBonusId: string | null;
  slug: string;
}

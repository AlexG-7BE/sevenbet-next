import type { EditorialStatus } from "@/lib/cms/types";

export type CasinoBuilderSection =
  | "general"
  | "seo"
  | "licenses"
  | "countries"
  | "payments"
  | "game-providers"
  | "game-categories"
  | "bonuses"
  | "affiliate-links"
  | "media"
  | "publishing"
  | "history";

export interface CasinoBuilderImage {
  id: string;
  kind: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CasinoBuilderCountry {
  id: string;
  countryCode: string;
  availability: string;
  minimumAge: number | null;
  notes: string | null;
  currency: string | null;
  language: string | null;
  priority: number;
  archived: boolean;
}

export interface CasinoBuilderLicense {
  id: string;
  authority: string;
  licenseNumber: string | null;
  jurisdiction: string | null;
  status: string;
  verificationUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  notes: string | null;
  verified: boolean;
  archived: boolean;
}

export interface CasinoBuilderPaymentMethod {
  id: string;
  methodKey: string;
  name: string;
  supportsDeposits: boolean;
  supportsWithdrawals: boolean;
  currencies: string[];
  minimumDeposit: string | null;
  minimumWithdrawal: string | null;
  maximumWithdrawal: string | null;
  maximumDeposit: string | null;
  depositProcessingTime: string | null;
  withdrawalTime: string | null;
  fees: string | null;
  depositFee: string | null;
  withdrawalFee: string | null;
  type: string;
  countries: string[];
  verified: boolean;
  notes: string | null;
  archived: boolean;
  crypto: boolean;
  sortOrder: number;
}

export interface CasinoBuilderGameProvider {
  id: string;
  providerKey: string;
  name: string;
  websiteUrl: string | null;
  gameCount: number | null;
  liveCasino: boolean;
  featured: boolean;
  verified: boolean;
  archived: boolean;
  verifiedAt: string | null;
  sortOrder: number;
}

export interface CasinoBuilderGameCategory {
  id: string;
  categoryKey: string;
  name: string;
  gameCount: number | null;
  featured: boolean;
  icon: string | null;
  archived: boolean;
  sortOrder: number;
}

export interface CasinoBuilderAffiliateLink {
  id: string;
  casinoBonusId: string | null;
  slug: string;
  title: string;
  type: string;
  destinationUrl: string;
  countryCode: string | null;
  language: string | null;
  campaign: string | null;
  priority: number;
  status: EditorialStatus;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  lastVerifiedAt: string | null;
}

export interface CasinoBuilderBonus {
  id: string;
  slug: string;
  internalName: string;
  title: string;
  summary: string;
  shortTerms: string | null;
  amount: string | null;
  type: string;
  percentage: string | null;
  minimumDeposit: string | null;
  maximumBonus: string | null;
  currency: string | null;
  freeSpins: number | null;
  wageringMultiplier: string | null;
  wageringBase: string;
  minimumOdds: string | null;
  maximumBet: string | null;
  wageringText: string | null;
  eligibility: string | null;
  eligibleGames: string[];
  excludedGames: string[];
  eligiblePaymentMethods: string[];
  excludedPaymentMethods: string[];
  newPlayersOnly: boolean;
  existingPlayersAllowed: boolean;
  promoCode: string | null;
  importantConditions: string[];
  termsUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  evergreen: boolean;
  featured: boolean;
  exclusive: boolean;
  notes: string | null;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  allowedCountries: string[];
  blockedCountries: string[];
  status: EditorialStatus;
  offerStatus: string;
  lastVerifiedAt: string | null;
  sortOrder: number;
  affiliateLinks: CasinoBuilderAffiliateLink[];
}

export type CasinoBonusDraft = Omit<CasinoBuilderBonus, "affiliateLinks" | "lastVerifiedAt">;

export interface CasinoBuilderSeo {
  id: string;
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  robots: string;
  socialTitle: string | null;
  socialDescription: string | null;
  socialImage: string | null;
  structuredData: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface CasinoBuilderGeneralMetadata {
  trustScore: number | null;
  userExperienceScore: number | null;
  paymentsScore: number | null;
  gamesScore: number | null;
  supportScore: number | null;
  responsibleGamblingScore: number | null;
  featured: boolean;
  recommended: boolean;
  internalNotes: string | null;
}

export interface CasinoBuilderCasino {
  id: string;
  slug: string;
  internalName: string | null;
  title: string;
  domain: string;
  websiteUrl: string | null;
  operator: string | null;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  foundedYear: number | null;
  language: string;
  languages: string[];
  currencies: string[];
  editorScore: number | null;
  generalMetadata: CasinoBuilderGeneralMetadata;
  license: string | null;
  country: string | null;
  pros: string[];
  cons: string[];
  responsibleGamblingTools: string[];
  status: EditorialStatus;
  publishedVersion: number;
  draftVersion: number;
  publishedAt: string | null;
  scheduledPublishAt: string | null;
  lastReviewedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  images: CasinoBuilderImage[];
  countries: CasinoBuilderCountry[];
  licenses: CasinoBuilderLicense[];
  paymentMethods: CasinoBuilderPaymentMethod[];
  gameProviders: CasinoBuilderGameProvider[];
  gameCategories: CasinoBuilderGameCategory[];
  casinoBonuses: CasinoBuilderBonus[];
  casinoLinks: CasinoBuilderAffiliateLink[];
  seo: CasinoBuilderSeo | null;
}

export interface CasinoBuilderValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
  code: string;
}

export interface CasinoBuilderData {
  casino: CasinoBuilderCasino;
  validation: {
    valid: boolean;
    issues: CasinoBuilderValidationIssue[];
  };
  revisionCount: number;
  versionCount: number;
}

export type CasinoCoreDraft = Pick<
  CasinoBuilderCasino,
  | "slug"
  | "internalName"
  | "title"
  | "domain"
  | "websiteUrl"
  | "operator"
  | "tagline"
  | "summary"
  | "description"
  | "foundedYear"
  | "language"
  | "languages"
  | "currencies"
  | "editorScore"
  | "generalMetadata"
  | "licenses"
  | "countries"
  | "paymentMethods"
  | "gameProviders"
  | "gameCategories"
  | "seo"
> & { casinoBonuses: CasinoBonusDraft[] };

export interface SaveCasinoCoreDraftInput {
  draft: CasinoCoreDraft;
  expectedUpdatedAt?: string;
}

export interface CasinoRevisionHistoryItem {
  id: string;
  revisionNumber: number;
  summary: string;
  author: string;
  authorEmail: string | null;
  createdAt: string;
  workflowStatus: string;
  publishedVersion: number;
}

export type AffiliateStatusValue = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
export type AffiliateGeoModeValue = "GLOBAL" | "ALLOW" | "BLOCK";
export type AffiliatePayoutModelValue = "CPA" | "CPL" | "REV_SHARE" | "HYBRID" | "FLAT" | "UNKNOWN";
export type AffiliateNetworkTypeValue = "EVERFLOW" | "INCOME_ACCESS" | "MYAFFILIATES" | "NETREFER" | "DIRECT" | "OTHER";

export interface AffiliateNetworkRecord {
  id: string;
  name: string;
  slug: string;
  type: AffiliateNetworkTypeValue;
  websiteUrl: string | null;
  apiCapable: boolean;
  exportCapable: boolean;
  active: boolean;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateProgramRecord {
  id: string;
  networkId: string;
  externalProgramId: string | null;
  name: string;
  operator: string;
  status: AffiliateStatusValue;
  accountReference: string | null;
  supportedCountries: string[];
  supportedCurrencies: string[];
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  network: AffiliateNetworkRecord;
  _count: { offers: number };
}

export interface AffiliateCountryRuleRecord {
  countryCode: string;
  mode: AffiliateGeoModeValue;
}

export interface AffiliateTrackingRevisionRecord {
  id: string;
  revisionNumber: number;
  destinationUrl: string;
  trackingUrl: string;
  summary: string;
  createdAt: string;
}

export interface AffiliateTrackingLinkRecord {
  id?: string;
  clientKey?: string;
  externalLinkId: string | null;
  label: string;
  destinationUrl: string;
  trackingUrl: string;
  landingPage: string | null;
  geoMode: AffiliateGeoModeValue;
  countries: AffiliateCountryRuleRecord[];
  currencyCode: string | null;
  deviceTarget: string;
  language: string | null;
  promoCode: string | null;
  campaign: string | null;
  creativeReference: string | null;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  archivedAt?: string | null;
  archived?: boolean;
  priority: number;
  source: string;
  updatedAt?: string;
  revisions?: AffiliateTrackingRevisionRecord[];
}

export interface AffiliateOfferRecord {
  id: string;
  programId: string;
  casinoId: string;
  casinoBonusId: string | null;
  externalOfferId: string | null;
  internalName: string;
  publicLabel: string;
  offerType: string;
  status: AffiliateStatusValue;
  payoutModel: AffiliatePayoutModelValue;
  payoutAmount: string | null;
  payoutCurrency: string | null;
  revenueSharePercentage: string | null;
  hybridTerms: string | null;
  cookieDurationDays: number | null;
  geoMode: AffiliateGeoModeValue;
  countries: AffiliateCountryRuleRecord[];
  currencies: Array<{ currencyCode: string }>;
  startAt: string | null;
  expiresAt: string | null;
  evergreen: boolean;
  featured: boolean;
  priority: number;
  terms: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: AffiliateProgramRecord;
  casino: { id: string; title: string; slug: string };
  casinoBonus: { id: string; casinoId: string; title: string; slug: string } | null;
  trackingLinks: AffiliateTrackingLinkRecord[];
  revisions: Array<{ id: string; revisionNumber: number; summary: string; createdAt: string }>;
  _count?: { trackingLinks: number };
}

export type AffiliateOfferListRecord = Omit<AffiliateOfferRecord, "trackingLinks" | "revisions"> & {
  trackingLinks: Array<{ id: string }>;
  _count: { trackingLinks: number };
};

export interface AffiliateReferenceData {
  networks: AffiliateNetworkRecord[];
  programs: AffiliateProgramRecord[];
  casinos: Array<{ id: string; title: string; slug: string; domain: string }>;
}

export interface AffiliateRedirectSlugRecord {
  id: string;
  slug: string;
  casinoId: string;
  casinoBonusId: string | null;
  affiliateOfferId: string | null;
  defaultCurrency: string | null;
  defaultLanguage: string | null;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  casino: { id: string; title: string; slug: string };
  casinoBonus: { id: string; casinoId: string; title: string; slug: string } | null;
  affiliateOffer: { id: string; casinoId: string; casinoBonusId: string | null; internalName: string } | null;
  revisions: Array<{ id: string; revisionNumber: number; summary: string; createdAt: string }>;
}

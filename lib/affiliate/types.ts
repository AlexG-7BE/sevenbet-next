import type {
  AffiliateGeoMode,
  AffiliateIntegrationMode,
  AffiliateNetworkType,
  AffiliatePayoutModel,
  AffiliateStatus,
  AffiliateSyncMode,
  EditorialStatus,
} from "@prisma/client";

export interface AffiliateCountryRuleInput {
  countryCode: string;
  mode: AffiliateGeoMode;
}

export interface AffiliateTrackingLinkInput {
  id?: string;
  externalLinkId?: string | null;
  label: string;
  destinationUrl: string;
  trackingUrl: string;
  landingPage?: string | null;
  geoMode: AffiliateGeoMode;
  countries: AffiliateCountryRuleInput[];
  currencyCode?: string | null;
  deviceTarget?: string;
  language?: string | null;
  promoCode?: string | null;
  campaign?: string | null;
  creativeReference?: string | null;
  verifiedAt?: Date | null;
  lastCheckedAt?: Date | null;
  expiresAt?: Date | null;
  active: boolean;
  archived?: boolean;
  priority: number;
  source?: string;
}

export interface AffiliateNetworkInput {
  name: string;
  slug: string;
  type: AffiliateNetworkType;
  websiteUrl?: string | null;
  apiCapable?: boolean;
  exportCapable?: boolean;
  active?: boolean;
  notes?: string | null;
}

export interface AffiliateProgramInput {
  networkId: string;
  casinoId?: string | null;
  externalProgramId?: string | null;
  name: string;
  operator: string;
  status: AffiliateStatus;
  workflowStatus: EditorialStatus;
  providerType: string;
  providerAccountId?: string | null;
  integrationMode: AffiliateIntegrationMode;
  dashboardUrl?: string | null;
  accountReference?: string | null;
  accountManagerName?: string | null;
  accountManagerEmail?: string | null;
  defaultCurrency?: string | null;
  timezone?: string | null;
  supportedCountries: string[];
  supportedCurrencies: string[];
  metadata: Record<string, unknown>;
  sourceOfTruth: Record<string, string>;
  credentialReference?: string | null;
  syncEnabled: boolean;
  syncMode: AffiliateSyncMode;
  deactivateMissing: boolean;
  trustedAutoActivation: boolean;
  notes?: string | null;
}

export interface AffiliateOfferInput {
  programId: string;
  casinoId: string;
  casinoBonusId?: string | null;
  externalOfferId?: string | null;
  internalName: string;
  publicLabel: string;
  offerType: string;
  status: AffiliateStatus;
  payoutModel: AffiliatePayoutModel;
  payoutAmount?: string | null;
  payoutCurrency?: string | null;
  revenueSharePercentage?: string | null;
  hybridTerms?: string | null;
  cookieDurationDays?: number | null;
  geoMode: AffiliateGeoMode;
  countries: AffiliateCountryRuleInput[];
  currencies: string[];
  startAt?: Date | null;
  expiresAt?: Date | null;
  evergreen: boolean;
  featured?: boolean;
  priority?: number;
  terms?: string | null;
  notes?: string | null;
  trackingLinks: AffiliateTrackingLinkInput[];
}

export interface ActiveOfferQuery {
  casinoId: string;
  casinoBonusId?: string;
  countryCode?: string;
  currencyCode?: string;
  now?: Date;
}

export interface AffiliateRedirectSlugInput {
  slug: string;
  casinoId: string;
  casinoBonusId?: string | null;
  affiliateOfferId?: string | null;
  defaultCurrency?: string | null;
  defaultLanguage?: string | null;
  active: boolean;
}

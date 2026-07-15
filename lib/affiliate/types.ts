import type {
  AffiliateGeoMode,
  AffiliateNetworkType,
  AffiliatePayoutModel,
  AffiliateStatus,
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
  externalProgramId?: string | null;
  name: string;
  operator: string;
  status: AffiliateStatus;
  accountReference?: string | null;
  supportedCountries: string[];
  supportedCurrencies: string[];
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

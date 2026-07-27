export type AffiliateStatusValue = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
export type AffiliateGeoModeValue = "GLOBAL" | "ALLOW" | "BLOCK";
export type AffiliatePayoutModelValue = "CPA" | "CPL" | "REV_SHARE" | "HYBRID" | "FLAT" | "UNKNOWN";
export type AffiliateNetworkTypeValue = "EVERFLOW" | "INCOME_ACCESS" | "MYAFFILIATES" | "NETREFER" | "DIRECT" | "OTHER";
export type AffiliateConnectionStatusValue = "DISCONNECTED" | "CONFIGURED" | "CONNECTED" | "ERROR";
export type AffiliateIntegrationModeValue = "MANUAL" | "API" | "CSV" | "JSON" | "XML" | "SFTP" | "WEBHOOK";
export type AffiliateSyncModeValue = "FULL" | "INCREMENTAL";
export type AffiliateImportStatusValue = "PENDING" | "RUNNING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED" | "CANCELLED";
export type AffiliateMatchStatusValue = "MATCHED" | "UNMATCHED" | "REVIEW_REQUIRED" | "IGNORED" | "CONFLICT";

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
  casinoId: string | null;
  externalProgramId: string | null;
  name: string;
  operator: string;
  status: AffiliateStatusValue;
  workflowStatus: "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  providerType: string;
  providerAccountId: string | null;
  connectionStatus: AffiliateConnectionStatusValue;
  integrationMode: AffiliateIntegrationModeValue;
  dashboardUrl: string | null;
  accountReference: string | null;
  accountManagerName: string | null;
  accountManagerEmail: string | null;
  defaultCurrency: string | null;
  timezone: string | null;
  supportedCountries: string[];
  supportedCurrencies: string[];
  metadata: Record<string, unknown>;
  sourceOfTruth: Record<string, string>;
  credentialReference: string | null;
  syncEnabled: boolean;
  syncMode: AffiliateSyncModeValue;
  deactivateMissing: boolean;
  trustedAutoActivation: boolean;
  lastConnectionTestAt: string | null;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: AffiliateImportStatusValue | null;
  lastSyncError: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  network: AffiliateNetworkRecord;
  casino: { id: string; title: string; slug: string; domain: string } | null;
  externalMappings?: Array<{ id: string; matchStatus: AffiliateMatchStatusValue }>;
  _count: { offers: number; externalMappings: number; importJobs: number };
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

export interface AffiliateImportItemRecord {
  id: string;
  entityType: string;
  externalId: string;
  externalName: string | null;
  externalDomain: string | null;
  action: "CREATE" | "UPDATE" | "NO_CHANGE" | "ARCHIVE" | "SKIP" | "CONFLICT" | "ERROR";
  status: "PENDING" | "APPLIED" | "SKIPPED" | "FAILED";
  internalEntityId: string | null;
  matchStatus: AffiliateMatchStatusValue;
  matchMethod: string | null;
  matchConfidence: number | null;
  errors: string[] | null;
  conflictFields: string[];
}

export interface AffiliateImportJobRecord {
  id: string;
  affiliateProgramId: string;
  providerType: string;
  mode: AffiliateSyncModeValue;
  status: AffiliateImportStatusValue;
  dryRun: boolean;
  summary: {
    total?: number;
    create?: number;
    update?: number;
    noChange?: number;
    skipped?: number;
    conflicts?: number;
    errors?: number;
    unmatched?: number;
  };
  errorSummary: string[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  affiliateProgram: { id: string; name: string; providerType: string };
  items?: AffiliateImportItemRecord[];
  _count?: { items: number };
}

export interface AffiliateExternalMappingRecord {
  id: string;
  providerType: string;
  affiliateProgramId: string;
  entityType: string;
  externalId: string;
  externalName: string | null;
  externalDomain: string | null;
  internalEntityId: string | null;
  matchStatus: AffiliateMatchStatusValue;
  matchMethod: string | null;
  matchConfidence: number | null;
  updatedAt: string;
  affiliateProgram: { id: string; name: string; providerType: string };
}

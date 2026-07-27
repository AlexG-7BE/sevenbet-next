import type {
  AffiliateImportAction,
  AffiliateMatchMethod,
  AffiliateMatchStatus,
  AffiliatePayoutModel,
  AffiliateSourcePolicy,
  AffiliateStatus,
  AffiliateSyncMode,
} from "@prisma/client";

export const affiliateProviderCapabilities = [
  "offers",
  "trackingLinks",
  "bonuses",
  "creatives",
  "reports",
  "postbacks",
  "webhooks",
  "pagination",
  "incrementalSync",
] as const;

export type AffiliateProviderCapability = (typeof affiliateProviderCapabilities)[number];

export interface AffiliateCredentials {
  apiKey?: string;
  accountId?: string;
  username?: string;
  password?: string;
  token?: string;
  baseUrl?: string;
}

export interface AffiliateProviderContext {
  programId: string;
  providerType: string;
  providerAccountId?: string | null;
  credentials: AffiliateCredentials | null;
  payload?: unknown;
  signal?: AbortSignal;
}

export interface AffiliateSyncCursor {
  value: string;
}

export interface AffiliateProviderPage<T> {
  records: T[];
  nextCursor?: AffiliateSyncCursor | null;
}

export interface ConnectionTestResult {
  ok: boolean;
  status: "CONNECTED" | "CONFIGURED" | "DISCONNECTED" | "ERROR";
  message: string;
  checkedAt: Date;
}

export interface ExternalCasinoReference {
  externalId?: string | null;
  name: string;
  domain?: string | null;
}

export interface ExternalTrackingLink {
  externalId: string;
  label?: string | null;
  destinationUrl: string;
  trackingUrl: string;
  countries?: string[];
  languages?: string[];
  devices?: string[];
  currencyCode?: string | null;
  campaign?: string | null;
  subIdTemplate?: string | null;
  priority?: number;
  active?: boolean;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
  sourceUpdatedAt?: string | Date | null;
  metadata?: Record<string, unknown>;
}

export interface ExternalAffiliateOffer {
  externalId: string;
  externalName: string;
  casino: ExternalCasinoReference;
  offerType?: string;
  status?: string;
  commercialModel?: string;
  payoutAmount?: number | string | null;
  payoutCurrency?: string | null;
  revenueSharePercentage?: number | string | null;
  hybridTerms?: string | null;
  countries?: string[];
  excludedCountries?: string[];
  currencies?: string[];
  languages?: string[];
  devices?: string[];
  landingPageUrl?: string | null;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
  priority?: number;
  sourceUpdatedAt?: string | Date | null;
  metadata?: Record<string, unknown>;
  trackingLinks?: ExternalTrackingLink[];
}

export interface NormalizedTrackingLink {
  externalId: string;
  label: string;
  destinationUrl: string;
  trackingUrl: string;
  countries: string[];
  languages: string[];
  devices: string[];
  currencyCode: string | null;
  campaign: string | null;
  subIdTemplate: string | null;
  priority: number;
  active: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  metadata: Record<string, unknown>;
}

export interface NormalizedAffiliateOffer {
  externalId: string;
  externalName: string;
  casino: Required<Pick<ExternalCasinoReference, "name">> & {
    externalId: string | null;
    domain: string | null;
  };
  offerType: string;
  providerStatus: string;
  status: AffiliateStatus;
  payoutModel: AffiliatePayoutModel;
  payoutAmount: string | null;
  payoutCurrency: string | null;
  revenueSharePercentage: string | null;
  hybridTerms: string | null;
  countries: string[];
  excludedCountries: string[];
  currencies: string[];
  languages: string[];
  devices: string[];
  landingPageUrl: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  priority: number;
  sourceUpdatedAt: Date | null;
  metadata: Record<string, unknown>;
  trackingLinks: NormalizedTrackingLink[];
}

export interface AffiliateProviderAdapter {
  readonly providerType: string;
  readonly capabilities: ReadonlySet<AffiliateProviderCapability>;
  testConnection(context: AffiliateProviderContext): Promise<ConnectionTestResult>;
  fetchPrograms?(context: AffiliateProviderContext): Promise<AffiliateProviderPage<unknown>>;
  fetchOffers(
    context: AffiliateProviderContext,
    cursor?: AffiliateSyncCursor,
  ): Promise<AffiliateProviderPage<ExternalAffiliateOffer>>;
  fetchTrackingLinks?(
    context: AffiliateProviderContext,
    cursor?: AffiliateSyncCursor,
  ): Promise<AffiliateProviderPage<ExternalTrackingLink>>;
  fetchBonuses?(context: AffiliateProviderContext, cursor?: AffiliateSyncCursor): Promise<AffiliateProviderPage<unknown>>;
  fetchCreatives?(context: AffiliateProviderContext, cursor?: AffiliateSyncCursor): Promise<AffiliateProviderPage<unknown>>;
  normalizeOffer(external: ExternalAffiliateOffer): NormalizedAffiliateOffer;
  normalizeTrackingLink?(external: ExternalTrackingLink): NormalizedTrackingLink;
}

export interface CasinoMatchCandidate {
  id: string;
  title: string;
  internalName?: string | null;
  domain: string;
  aliases: Array<{ type: "BRAND" | "DOMAIN"; normalizedValue: string }>;
}

export interface ExistingExternalMapping {
  internalEntityId: string | null;
  matchStatus: AffiliateMatchStatus;
}

export interface CasinoMatchResult {
  casinoId: string | null;
  status: AffiliateMatchStatus;
  method: AffiliateMatchMethod | null;
  confidence: number | null;
}

export type AffiliateSourceRules = Partial<Record<string, AffiliateSourcePolicy>>;

export interface AffiliatePlannedItem {
  entityType: "OFFER";
  externalId: string;
  externalName: string;
  externalDomain: string | null;
  action: AffiliateImportAction;
  matchStatus: AffiliateMatchStatus;
  matchMethod: AffiliateMatchMethod | null;
  matchConfidence: number | null;
  internalEntityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  sourcePayload: Record<string, unknown>;
  errors: string[];
  conflictFields: string[];
}

export interface AffiliateSyncRequest {
  programId: string;
  providerType?: string;
  mode?: AffiliateSyncMode;
  dryRun?: boolean;
  payload?: unknown;
  initiatedBy: string;
}

export interface AffiliateImportSummary {
  total: number;
  create: number;
  update: number;
  noChange: number;
  skipped: number;
  conflicts: number;
  errors: number;
  unmatched: number;
}

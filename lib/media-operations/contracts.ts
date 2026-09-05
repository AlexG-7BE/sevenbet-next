import { z } from "zod";

import {
  mediaPlacements,
  mediaPlacementVariants,
  mediaRenderingModes,
} from "@/lib/media/placement-media";

export const MEDIA_INGESTION_PLAN_VERSION = 1 as const;
export const MEDIA_INGESTION_PLAN_KEY_PREFIX = "media-ingestion-plan:";
export const MEDIA_INGESTION_ASSIGNMENT_REFERENCE_PREFIX = "MEDIA_OPERATIONS:";

export const mediaIngestionContextSchema = z.object({
  casinoId: z.string().uuid().optional(),
  casinoSlug: z.string().trim().min(1).max(160).optional(),
  bonusId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  partnerIdentifier: z.string().trim().min(1).max(200).optional(),
}).strict();

export const mediaIngestPartnerSnippetInputSchema = z.object({
  snippet: z.string().min(1).max(128 * 1024),
  context: mediaIngestionContextSchema.optional(),
  dryRun: z.boolean().default(false),
}).strict();

export const mediaAnalyzeAndPlanInputSchema = z.object({
  planId: z.string().uuid(),
  useSemanticAnalysis: z.boolean().default(true),
}).strict();

export const mediaApplyDraftPlanInputSchema = z.object({
  planId: z.string().uuid(),
  recommendationIds: z.array(z.string().uuid()).max(100).optional(),
  replaceExisting: z.boolean().default(false),
  mode: z.enum(["APPLY", "ROLLBACK"]).default("APPLY"),
}).strict();

export const mediaGetPlanInputSchema = z.object({
  planId: z.string().uuid(),
}).strict();

export const mediaListRecentIngestionsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
}).strict();

export const safeUrlEvidenceSchema = z.object({
  urlHash: z.string().length(64),
  origin: z.string().max(300),
  pathname: z.string().max(1000),
  queryKeys: z.array(z.string().max(100)).max(50),
}).strict();

const parsedCreativeSchema = z.object({
  id: z.string().uuid(),
  sourceKind: z.enum(["ANCHOR_IMAGE", "IMAGE", "DIRECT_URL", "SAFE_DATA_IMAGE"]),
  source: safeUrlEvidenceSchema,
  anchor: safeUrlEvidenceSchema.nullable(),
  declaredWidth: z.number().int().positive().max(100_000).nullable(),
  declaredHeight: z.number().int().positive().max(100_000).nullable(),
  alt: z.string().max(300).nullable(),
  title: z.string().max(300).nullable(),
  providerDomain: z.string().max(253),
  providerReference: z.string().max(200).nullable(),
  identifiers: z.record(z.string(), z.string()).default({}),
  languageClues: z.array(z.string().max(20)).max(20),
  marketClues: z.array(z.string().max(20)).max(20),
  currencyClues: z.array(z.string().max(20)).max(20),
  warnings: z.array(z.string().max(200)).max(30),
}).strict();

const ingestedAssetSchema = z.object({
  creativeId: z.string().uuid(),
  state: z.enum(["INGESTED", "REUSED", "DRY_RUN_VALID", "REJECTED", "REVIEW_REQUIRED"]),
  assetId: z.string().uuid().nullable(),
  firstPartyUrl: z.string().url().nullable(),
  checksum: z.string().length(64).nullable(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]).nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  animated: z.boolean().nullable(),
  formatFamily: z.enum(["CARD", "MOBILE_LANDSCAPE", "STRIP", "WIDE", "PORTRAIT_INVENTORY", "BRAND_ART", "LOGO_ONLY", "UNCLASSIFIED"]).nullable(),
  resolvedSource: safeUrlEvidenceSchema.nullable(),
  redirectCount: z.number().int().min(0).max(3).nullable(),
  duplicate: z.boolean(),
  failureCode: z.string().max(100).nullable(),
  failureMessage: z.string().max(500).nullable(),
}).strict();

export const mediaSemanticResultSchema = z.object({
  creativeId: z.string().uuid(),
  state: z.enum(["COMPLETED", "NEEDS_VISUAL_REVIEW", "FAILED"]),
  provider: z.string().max(80).nullable(),
  model: z.string().max(100).nullable(),
  brandName: z.string().max(200).nullable(),
  assetPurpose: z.enum(["PROMO", "LOGO", "BRAND_ART", "OTHER", "UNKNOWN"]),
  language: z.string().max(20).nullable(),
  market: z.string().max(20).nullable(),
  currency: z.string().max(20).nullable(),
  offerText: z.string().max(500).nullable(),
  offerAmount: z.number().nonnegative().nullable(),
  offerPercentage: z.number().nonnegative().nullable(),
  freeSpins: z.number().int().nonnegative().nullable(),
  promoCode: z.string().max(100).nullable(),
  callToActionText: z.string().max(200).nullable(),
  containsPromotionalText: z.boolean(),
  containsFinePrint: z.boolean(),
  containsResponsibleGamblingText: z.boolean(),
  cropSafety: z.enum(["SAFE", "UNSAFE", "UNKNOWN"]),
  textReadability: z.enum(["READABLE", "PARTIAL", "UNREADABLE", "UNKNOWN"]),
  likelyMarkets: z.array(z.string().max(20)).max(20),
  complianceConcerns: z.array(z.string().max(300)).max(20),
  confidence: z.number().min(0).max(1),
  explanation: z.string().max(1000),
}).strict();

const resolvedContextSchema = z.object({
  state: z.enum(["RESOLVED", "AMBIGUOUS", "UNRESOLVED", "CONFLICT"]),
  source: z.enum(["EXPLICIT", "DETERMINISTIC", "NONE"]),
  casinoId: z.string().uuid().nullable(),
  casinoSlug: z.string().nullable(),
  casinoTitle: z.string().nullable(),
  bonusId: z.string().uuid().nullable(),
  bonusTitle: z.string().nullable(),
  affiliateOfferId: z.string().uuid().nullable(),
  opportunityId: z.string().uuid().nullable(),
  partnerIdentifier: z.string().nullable(),
  trackingDestinationState: z.enum(["MATCH", "MISMATCH", "TRACKING_DESTINATION_REVIEW_REQUIRED", "NOT_PRESENT"]),
  notes: z.array(z.string().max(400)).max(30),
}).strict();

export const mediaPlanRecommendationSchema = z.object({
  id: z.string().uuid(),
  creativeId: z.string().uuid(),
  assetId: z.string().uuid(),
  subjectType: z.enum(["CASINO", "CASINO_BONUS", "AFFILIATE_OFFER"]),
  subjectId: z.string().uuid(),
  placement: z.enum(mediaPlacements),
  variant: z.enum(mediaPlacementVariants),
  renderingMode: z.enum(mediaRenderingModes),
  cropSafe: z.boolean(),
  state: z.enum(["AUTO_ASSIGN_DRAFT", "SUGGEST_REVIEW", "LIBRARY_ONLY", "REJECT"]),
  score: z.number().min(0).max(100),
  offerMatch: z.enum(["MATCH", "LIKELY_MATCH", "MISMATCH", "UNKNOWN"]),
  marketHandling: z.enum(["GLOBAL_SAFE", "MARKET_SPECIFIC_REVIEW", "UNKNOWN"]),
  existingAssignmentId: z.string().uuid().nullable(),
  existingComparison: z.enum(["NEW_SLOT", "BETTER_CANDIDATE", "EQUIVALENT", "LOWER_PRIORITY", "CONFLICT"]),
  replacementEligible: z.boolean(),
  reasons: z.array(z.string().max(400)).min(1).max(30),
  appliedAssignmentId: z.string().uuid().nullable(),
  replacedAssignmentId: z.string().uuid().nullable(),
  appliedAt: z.string().datetime().nullable(),
  rolledBackAt: z.string().datetime().nullable(),
}).strict();

const planOperationSchema = z.object({
  id: z.string().uuid(),
  operation: z.enum(["INGEST", "ANALYZE", "APPLY_ASSIGNMENT", "REPLACE_ASSIGNMENT", "ROLLBACK_ASSIGNMENT", "RESTORE_ASSIGNMENT"]),
  recommendationId: z.string().uuid().nullable(),
  subject: z.string().max(200),
  previous: z.record(z.string(), z.unknown()).nullable(),
  result: z.record(z.string(), z.unknown()),
  actorId: z.string().uuid(),
  source: z.enum(["ADMIN", "CHATGPT_WORK", "SYSTEM"]),
  timestamp: z.string().datetime(),
}).strict();

export const mediaIngestionPlanSchema = z.object({
  version: z.literal(MEDIA_INGESTION_PLAN_VERSION),
  id: z.string().uuid(),
  snippetChecksum: z.string().length(64),
  state: z.enum(["INGESTING", "INGESTED", "PLANNED", "PARTIALLY_APPLIED", "APPLIED", "ROLLED_BACK", "FAILED", "REVIEW_REQUIRED"]),
  dryRun: z.boolean(),
  actorId: z.string().uuid(),
  source: z.enum(["ADMIN", "CHATGPT_WORK", "SYSTEM"]),
  providerReference: z.string().max(200).nullable(),
  requestedContext: mediaIngestionContextSchema,
  resolvedContext: resolvedContextSchema,
  creatives: z.array(parsedCreativeSchema).max(20),
  unsupportedElements: z.array(z.enum(["SCRIPT", "IFRAME"])).max(20),
  assets: z.array(ingestedAssetSchema).max(20),
  semanticResults: z.array(mediaSemanticResultSchema).max(20),
  recommendations: z.array(mediaPlanRecommendationSchema).max(100),
  warnings: z.array(z.string().max(500)).max(100),
  operations: z.array(planOperationSchema).max(300),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  analyzedAt: z.string().datetime().nullable(),
}).strict();

export type MediaIngestionContextInput = z.infer<typeof mediaIngestionContextSchema>;
export type MediaIngestPartnerSnippetInput = z.infer<typeof mediaIngestPartnerSnippetInputSchema>;
export type MediaAnalyzeAndPlanInput = z.infer<typeof mediaAnalyzeAndPlanInputSchema>;
export type MediaApplyDraftPlanInput = z.infer<typeof mediaApplyDraftPlanInputSchema>;
export type MediaIngestionPlan = z.infer<typeof mediaIngestionPlanSchema>;
export type MediaPlanRecommendation = z.infer<typeof mediaPlanRecommendationSchema>;
export type MediaSemanticResult = z.infer<typeof mediaSemanticResultSchema>;
export type MediaOperationsSource = MediaIngestionPlan["source"];

export function mediaIngestionPlanKey(planId: string) {
  return `${MEDIA_INGESTION_PLAN_KEY_PREFIX}${planId}`;
}

export function mediaIngestionAssignmentReference(planId: string, recommendationId: string) {
  return `${MEDIA_INGESTION_ASSIGNMENT_REFERENCE_PREFIX}${planId}:${recommendationId}`;
}

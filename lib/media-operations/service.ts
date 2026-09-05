import { randomUUID } from "node:crypto";

import type { MediaAssetTypeName, SupportedImageMime } from "@/lib/media/image-validation";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import {
  MEDIA_INGESTION_PLAN_VERSION,
  mediaAnalyzeAndPlanInputSchema,
  mediaApplyDraftPlanInputSchema,
  mediaGetPlanInputSchema,
  mediaIngestPartnerSnippetInputSchema,
  mediaListRecentIngestionsInputSchema,
  type MediaIngestionPlan,
  type MediaOperationsSource,
} from "@/lib/media-operations/contracts";
import { resolveMediaIngestionContext } from "@/lib/media-operations/context";
import { parsePartnerSnippet, persistedCreativeEvidence, safeUrlEvidence } from "@/lib/media-operations/parser";
import { buildMediaPlacementPlan, type ExistingMediaAssignment } from "@/lib/media-operations/planner";
import { fetchRemoteImage, RemoteImageFetchError } from "@/lib/media-operations/remote-image-fetch";
import { mediaIngestionRepository, type MediaIngestionRepository } from "@/lib/media-operations/repository";
import { analyzeMediaPlan } from "@/lib/media-operations/semantic-analysis";
import { prisma } from "@/lib/db/prisma";
import { commercialCreativePresentationFamily } from "@/lib/media/commercial-formats";
import { mediaService, type MediaService } from "@/lib/services/media.service";
import { NotFoundError, ValidationError } from "@/lib/services/service-error";

export type MediaOperationsActor = {
  actorId: string;
  source: MediaOperationsSource;
};

function extension(mimeType: SupportedImageMime) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
}

function mediaTypeFor(plan: Pick<MediaIngestionPlan, "resolvedContext">): MediaAssetTypeName {
  if (plan.resolvedContext.affiliateOfferId) return "AFFILIATE_CREATIVE";
  if (plan.resolvedContext.bonusId) return "BONUS_CREATIVE";
  return "OTHER";
}

function uploadFile(data: Uint8Array, mimeType: SupportedImageMime, index: number) {
  return {
    name: `partner-creative-${index + 1}.${extension(mimeType)}`,
    type: mimeType,
    size: data.byteLength,
    async arrayBuffer() {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    },
  };
}

function failure(error: unknown) {
  if (error instanceof RemoteImageFetchError) return { code: error.code, message: error.message };
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return { code: error.code.slice(0, 100), message: error instanceof Error ? error.message.slice(0, 500) : "Media ingestion failed" };
  return { code: "MEDIA_INGESTION_FAILED", message: error instanceof Error ? error.message.slice(0, 500) : "Media ingestion failed" };
}

function addWarning(plan: MediaIngestionPlan, warning: string) {
  if (!plan.warnings.includes(warning) && plan.warnings.length < 100) plan.warnings.push(warning);
}

function physicalFamily(width: number | null, height: number | null) {
  return commercialCreativePresentationFamily(width, height) ?? ("UNCLASSIFIED" as const);
}

export function mediaIngestionCompletionState(input: {
  stored: number;
  rejected: number;
  reviewRequired: boolean;
  dryRun: boolean;
  contextState: MediaIngestionPlan["resolvedContext"]["state"];
  creativeCount: number;
  unsupportedCount: number;
}): MediaIngestionPlan["state"] {
  if (input.stored > 0 && input.rejected === 0 && !input.reviewRequired) return "INGESTED";
  if (input.stored > 0 || input.dryRun || input.contextState !== "RESOLVED") return "REVIEW_REQUIRED";
  if (input.creativeCount === 0 && input.unsupportedCount > 0) return "REVIEW_REQUIRED";
  return "FAILED";
}

async function existingAssignments(plan: MediaIngestionPlan): Promise<ExistingMediaAssignment[]> {
  const casinoId = plan.resolvedContext.casinoId;
  const bonusId = plan.resolvedContext.bonusId;
  const offerId = plan.resolvedContext.affiliateOfferId;
  const casino = casinoId
    ? await prisma.casinoMediaAssignment.findMany({ where: { casinoId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } })
    : [];
  const bonus = bonusId
    ? await prisma.casinoBonusMediaAssignment.findMany({ where: { casinoBonusId: bonusId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } })
    : [];
  const offer = offerId
    ? await prisma.affiliateOfferMediaAssignment.findMany({ where: { affiliateOfferId: offerId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } })
    : [];
  return [
    ...casino.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, subjectType: "CASINO" as const, subjectId: casinoId!, placement: item.placement, variant: item.variant, mediaAsset: item.mediaAsset })),
    ...bonus.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, subjectType: "CASINO_BONUS" as const, subjectId: bonusId!, placement: item.placement, variant: item.variant, mediaAsset: item.mediaAsset })),
    ...offer.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, subjectType: "AFFILIATE_OFFER" as const, subjectId: offerId!, placement: item.placement, variant: item.variant, mediaAsset: item.mediaAsset })),
  ];
}

export class MediaOperationsService {
  constructor(
    private readonly repository: MediaIngestionRepository = mediaIngestionRepository,
    private readonly managedMedia: MediaService = mediaService,
  ) {}

  async ingest(rawInput: unknown, actor: MediaOperationsActor) {
    const input = mediaIngestPartnerSnippetInputSchema.parse(rawInput);
    const parsed = parsePartnerSnippet(input.snippet);
    const requestedContext = input.context ?? {};
    const context = await resolveMediaIngestionContext(requestedContext, parsed.creatives);
    const timestamp = new Date().toISOString();
    const plan: MediaIngestionPlan = {
      version: MEDIA_INGESTION_PLAN_VERSION,
      id: randomUUID(),
      snippetChecksum: parsed.snippetChecksum,
      state: "INGESTING",
      dryRun: input.dryRun,
      actorId: actor.actorId,
      source: actor.source,
      providerReference: requestedContext.partnerIdentifier ?? parsed.creatives.find((item) => item.providerReference)?.providerReference ?? parsed.creatives[0]?.providerDomain ?? null,
      requestedContext,
      resolvedContext: context.persisted,
      creatives: parsed.creatives.map(persistedCreativeEvidence),
      unsupportedElements: parsed.unsupportedElements,
      assets: [],
      semanticResults: [],
      recommendations: [],
      warnings: [...new Set([...parsed.warnings, ...context.persisted.notes])].slice(0, 100),
      operations: [{
        id: randomUUID(), operation: "INGEST", recommendationId: null,
        subject: context.persisted.casinoId ? `CASINO:${context.persisted.casinoId}` : "UNRESOLVED",
        previous: null, result: { creativesDetected: parsed.creatives.length, dryRun: input.dryRun },
        actorId: actor.actorId, source: actor.source, timestamp,
      }],
      createdAt: timestamp,
      updatedAt: timestamp,
      analyzedAt: null,
    };
    await this.repository.savePlan(plan, { operation: "INGEST_START", result: { creativesDetected: plan.creatives.length, rawSnippetPersisted: false } });

    for (let index = 0; index < parsed.creatives.length; index += 1) {
      const creative = parsed.creatives[index];
      try {
        const fetched = await fetchRemoteImage(creative.sourceUrl);
        if (input.dryRun || context.persisted.state !== "RESOLVED" || !context.persisted.casinoId) {
          plan.assets.push({
            creativeId: creative.id,
            state: input.dryRun ? "DRY_RUN_VALID" : "REVIEW_REQUIRED",
            assetId: null,
            firstPartyUrl: null,
            checksum: fetched.checksum,
            mimeType: fetched.mimeType,
            width: fetched.width,
            height: fetched.height,
            animated: fetched.animated,
            formatFamily: physicalFamily(fetched.width, fetched.height),
            resolvedSource: safeUrlEvidence(fetched.finalUrl),
            redirectCount: fetched.redirects.length,
            duplicate: false,
            failureCode: input.dryRun ? null : "CONTEXT_REVIEW_REQUIRED",
            failureMessage: input.dryRun ? null : "A single resolved governed Casino context is required before first-party storage can be created.",
          });
          continue;
        }
        const type = mediaTypeFor(plan);
        const uploaded = await this.managedMedia.upload({
          file: uploadFile(fetched.data, fetched.mimeType, index),
          type,
          altText: creative.alt || creative.title || `${context.persisted.casinoTitle || "Casino"} partner creative`,
          title: creative.title,
          featured: false,
          casinoId: context.persisted.casinoId,
          casinoBonusId: type === "BONUS_CREATIVE" ? context.persisted.bonusId : null,
          affiliateOfferId: type === "AFFILIATE_CREATIVE" ? context.persisted.affiliateOfferId : null,
          metadata: {
            mediaIngestionPlanId: plan.id,
            mediaIngestionCreativeId: creative.id,
            sourceUrlHash: creative.source.urlHash,
            sourceProviderDomain: creative.providerDomain,
            providerReference: creative.providerReference,
            declaredWidth: creative.declaredWidth,
            declaredHeight: creative.declaredHeight,
            languageClues: creative.languageClues,
            marketClues: creative.marketClues,
            currencyClues: creative.currencyClues,
            resolvedSource: safeUrlEvidence(fetched.finalUrl),
            redirectCount: fetched.redirects.length,
          },
          auditMetadata: {
            actorId: actor.actorId,
            source: "MEDIA_OPERATIONS",
            channel: actor.source,
            planId: plan.id,
            subject: { casinoId: context.persisted.casinoId, bonusId: context.persisted.bonusId, affiliateOfferId: context.persisted.affiliateOfferId },
            checksum: fetched.checksum,
            providerReference: plan.providerReference,
            operation: "CREATE_MEDIA_ASSET",
            previous: null,
            result: { sourceUrlHash: creative.source.urlHash, firstPartyStorage: true },
            timestamp: new Date().toISOString(),
          },
          dedupeScope: "GLOBAL",
          actorId: actor.actorId,
        });
        const duplicateOwnerConflict = uploaded.duplicate && uploaded.record.casinoId !== context.persisted.casinoId;
        plan.assets.push({
          creativeId: creative.id,
          state: duplicateOwnerConflict ? "REVIEW_REQUIRED" : uploaded.duplicate ? "REUSED" : "INGESTED",
          assetId: uploaded.record.id,
          firstPartyUrl: uploaded.record.publicUrl,
          checksum: uploaded.record.checksum,
          mimeType: uploaded.record.mimeType as SupportedImageMime,
          width: uploaded.record.width,
          height: uploaded.record.height,
          animated: fetched.animated,
          formatFamily: physicalFamily(uploaded.record.width, uploaded.record.height),
          resolvedSource: safeUrlEvidence(fetched.finalUrl),
          redirectCount: fetched.redirects.length,
          duplicate: uploaded.duplicate,
          failureCode: duplicateOwnerConflict ? "DUPLICATE_OWNER_REVIEW_REQUIRED" : null,
          failureMessage: duplicateOwnerConflict ? "Identical bytes already belong to a different Casino. The existing MediaAsset was retained without creating a duplicate, but cannot be assigned under this context automatically." : null,
        });
        if (duplicateOwnerConflict) addWarning(plan, "DUPLICATE_OWNER_REVIEW_REQUIRED");
      } catch (error) {
        if (isTransientDatabaseAvailabilityError(error)) throw error;
        const rejected = failure(error);
        plan.assets.push({
          creativeId: creative.id, state: "REJECTED", assetId: null, firstPartyUrl: null,
          checksum: null, mimeType: null, width: null, height: null, animated: null, duplicate: false,
          formatFamily: null, resolvedSource: null, redirectCount: null,
          failureCode: rejected.code, failureMessage: rejected.message,
        });
        addWarning(plan, `${rejected.code}: ${rejected.message}`);
      }
    }
    const stored = plan.assets.filter((asset) => asset.assetId).length;
    const rejected = plan.assets.filter((asset) => asset.state === "REJECTED").length;
    const reviewRequired = plan.assets.some((asset) => asset.state === "REVIEW_REQUIRED");
    plan.state = mediaIngestionCompletionState({
      stored,
      rejected,
      reviewRequired,
      dryRun: input.dryRun,
      contextState: context.persisted.state,
      creativeCount: plan.creatives.length,
      unsupportedCount: plan.unsupportedElements.length,
    });
    plan.updatedAt = new Date().toISOString();
    await this.repository.savePlan(plan, {
      operation: "INGEST_COMPLETE",
      previous: { state: "INGESTING" },
      result: { state: plan.state, stored, rejected, duplicatesReused: plan.assets.filter((asset) => asset.duplicate).length },
    });
    return plan;
  }

  async analyze(rawInput: unknown, actor: MediaOperationsActor) {
    const input = mediaAnalyzeAndPlanInputSchema.parse(rawInput);
    const plan = await this.repository.getPlan(input.planId);
    if (!plan) throw new NotFoundError("Media ingestion plan", { planId: input.planId });
    if (plan.state === "INGESTING") throw new ValidationError("Media ingestion has not completed");
    const previousState = plan.state;
    plan.semanticResults = await analyzeMediaPlan(plan, input.useSemanticAnalysis);
    const bonus = plan.resolvedContext.bonusId ? await prisma.casinoBonus.findUnique({ where: { id: plan.resolvedContext.bonusId }, select: { percentage: true, maximumBonus: true, currency: true, freeSpins: true } }) : null;
    plan.recommendations = buildMediaPlacementPlan(plan, {
      bonus: bonus ? {
        percentage: bonus.percentage === null ? null : Number(bonus.percentage.toString()),
        maximumBonus: bonus.maximumBonus === null ? null : Number(bonus.maximumBonus.toString()),
        currency: bonus.currency,
        freeSpins: bonus.freeSpins,
      } : null,
      existingAssignments: await existingAssignments(plan),
    });
    if (plan.semanticResults.some((result) => result.state !== "COMPLETED")) addWarning(plan, "NEEDS_VISUAL_REVIEW");
    if (plan.recommendations.some((result) => result.marketHandling === "MARKET_SPECIFIC_REVIEW")) addWarning(plan, "MARKET_SPECIFIC_REVIEW");
    plan.state = plan.recommendations.length ? "PLANNED" : "REVIEW_REQUIRED";
    plan.analyzedAt = new Date().toISOString();
    plan.updatedAt = plan.analyzedAt;
    plan.operations.push({
      id: randomUUID(), operation: "ANALYZE", recommendationId: null,
      subject: plan.resolvedContext.casinoId ? `CASINO:${plan.resolvedContext.casinoId}` : "UNRESOLVED",
      previous: { state: previousState },
      result: { state: plan.state, semanticCompleted: plan.semanticResults.filter((item) => item.state === "COMPLETED").length, recommendations: plan.recommendations.length },
      actorId: actor.actorId, source: actor.source, timestamp: plan.updatedAt,
    });
    plan.operations = plan.operations.slice(-300);
    await this.repository.savePlan(plan, {
      operation: "ANALYZE_PLAN", previous: { state: previousState }, result: { state: plan.state, recommendations: plan.recommendations.length }, actorId: actor.actorId, source: actor.source,
    });
    return plan;
  }

  async apply(rawInput: unknown, actor: MediaOperationsActor) {
    const input = mediaApplyDraftPlanInputSchema.parse(rawInput);
    return input.mode === "ROLLBACK"
      ? this.repository.rollbackDraftPlan({ planId: input.planId, recommendationIds: input.recommendationIds, actorId: actor.actorId, source: actor.source })
      : this.repository.applyDraftPlan({ planId: input.planId, recommendationIds: input.recommendationIds, replaceExisting: input.replaceExisting, actorId: actor.actorId, source: actor.source });
  }

  async get(rawInput: unknown) {
    const input = mediaGetPlanInputSchema.parse(rawInput);
    const plan = await this.repository.getPlan(input.planId);
    if (!plan) throw new NotFoundError("Media ingestion plan", { planId: input.planId });
    return plan;
  }

  async listRecent(rawInput: unknown) {
    const input = mediaListRecentIngestionsInputSchema.parse(rawInput ?? {});
    return this.repository.listRecent(input.limit);
  }

  async references() {
    return prisma.casino.findMany({
      where: { status: "DRAFT", archivedAt: null },
      select: {
        id: true, slug: true, title: true,
        casinoBonuses: { where: { status: "DRAFT" }, select: { id: true, title: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ title: "asc" }, { id: "asc" }],
      take: 500,
    });
  }
}

export const mediaOperationsService = new MediaOperationsService();

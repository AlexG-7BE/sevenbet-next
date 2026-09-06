import { randomUUID } from "node:crypto";

import {
  AffiliateStatus,
  EditorialStatus,
  MediaAssetStatus,
  type MediaPlacement,
  type MediaPlacementVariant,
  type MediaRenderingMode,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  mediaIngestionAssignmentReference,
  mediaIngestionBatchKey,
  mediaIngestionBatchSchema,
  mediaIngestionPlanKey,
  MEDIA_INGESTION_BATCH_KEY_PREFIX,
  mediaIngestionPlanSchema,
  MEDIA_INGESTION_PLAN_KEY_PREFIX,
  type MediaIngestionBatch,
  type MediaIngestionPlan,
  type MediaOperationsSource,
  type MediaPlanRecommendation,
} from "@/lib/media-operations/contracts";
import { isCasinoMediaPlacement } from "@/lib/media/placement-media";

type PlanAudit = {
  operation: string;
  previous?: Record<string, unknown> | null;
  result: Record<string, unknown>;
  actorId?: string;
  source?: MediaOperationsSource;
};

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function planSubject(plan: MediaIngestionPlan) {
  return {
    casinoId: plan.resolvedContext.casinoId,
    bonusId: plan.resolvedContext.bonusId,
    affiliateOfferId: plan.resolvedContext.affiliateOfferId,
    opportunityId: plan.resolvedContext.opportunityId,
    targetCountryCodes: plan.requestedContext.targetCountryCodes ?? [],
    creativeLanguage: plan.requestedContext.creativeLanguage ?? null,
    creativeLanguageState: plan.requestedContext.creativeLanguageState
      ?? (Object.prototype.hasOwnProperty.call(plan.requestedContext, "creativeLanguage") ? "NEUTRAL" : "UNKNOWN"),
  };
}

async function auditPlan(tx: Prisma.TransactionClient, plan: MediaIngestionPlan, audit: PlanAudit) {
  const actorId = audit.actorId ?? plan.actorId;
  const source = audit.source ?? plan.source;
  await tx.auditLog.create({
    data: {
      actorId,
      action: audit.operation.toLowerCase().replaceAll("_", "-"),
      entityType: "media-ingestion-plan",
      entityId: plan.id,
      summary: `Media ingestion ${audit.operation.toLowerCase().replaceAll("_", " ")}`,
      metadata: json({
        actorId,
        source: "MEDIA_OPERATIONS",
        channel: source,
        planId: plan.id,
        subject: planSubject(plan),
        checksum: plan.snippetChecksum,
        providerReference: plan.providerReference,
        operation: audit.operation,
        previous: audit.previous ?? null,
        result: audit.result,
        timestamp: plan.updatedAt,
      }),
    },
  });
}

async function writePlan(tx: Prisma.TransactionClient, plan: MediaIngestionPlan) {
  const parsed = mediaIngestionPlanSchema.parse(plan);
  await tx.siteSetting.upsert({
    where: { key: mediaIngestionPlanKey(parsed.id) },
    create: { key: mediaIngestionPlanKey(parsed.id), value: json(parsed) },
    update: { value: json(parsed) },
  });
}

function planFromValue(value: Prisma.JsonValue) {
  return mediaIngestionPlanSchema.parse(value);
}

type AssignmentIdentity = {
  id: string;
  reference: string | null;
  active: boolean;
  sourceMode: "FIRST_PARTY_MEDIA" | "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED";
  mediaAssetId: string | null;
  creativeId: string | null;
  countryCode: string | null;
  languageCode: string | null;
};

function targetScope(recommendation: MediaPlanRecommendation) {
  return { countryCode: recommendation.countryCode, languageCode: recommendation.languageCode };
}

function hostedTargetScope(recommendation: MediaPlanRecommendation) {
  return {
    ...targetScope(recommendation),
    languageState: recommendation.languageState ?? "NEUTRAL" as const,
  };
}

function hostedRecommendation(recommendation: MediaPlanRecommendation) {
  return Boolean(recommendation.sourceMode && recommendation.sourceMode !== "FIRST_PARTY_MEDIA");
}

async function subjectState(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation) {
  if (recommendation.subjectType === "CASINO") {
    const casino = await tx.casino.findUnique({ where: { id: recommendation.subjectId }, select: { id: true, status: true } });
    return casino ? { casinoId: casino.id, casinoStatus: casino.status, subjectStatus: casino.status, offerStatus: null } : null;
  }
  if (recommendation.subjectType === "CASINO_BONUS") {
    const bonus = await tx.casinoBonus.findUnique({ where: { id: recommendation.subjectId }, select: { casinoId: true, status: true, casino: { select: { status: true } } } });
    return bonus ? { casinoId: bonus.casinoId, casinoStatus: bonus.casino.status, subjectStatus: bonus.status, offerStatus: null } : null;
  }
  const offer = await tx.affiliateOffer.findUnique({ where: { id: recommendation.subjectId }, select: { casinoId: true, status: true, casino: { select: { status: true } } } });
  return offer ? { casinoId: offer.casinoId, casinoStatus: offer.casino.status, subjectStatus: offer.status, offerStatus: offer.status } : null;
}

async function activeAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation): Promise<AssignmentIdentity | null> {
  const where = {
    placement: recommendation.placement as MediaPlacement,
    variant: recommendation.variant as MediaPlacementVariant,
    ...targetScope(recommendation),
    active: true,
  };
  if (hostedRecommendation(recommendation)) {
    const hostedWhere = {
      placement: recommendation.placement as MediaPlacement,
      variant: recommendation.variant as MediaPlacementVariant,
      ...hostedTargetScope(recommendation),
      active: true,
    };
    const select = { id: true, reference: true, active: true, creativeId: true, countryCode: true, languageCode: true } as const;
    const record = recommendation.subjectType === "CASINO"
      ? await tx.casinoPartnerHostedCreativeAssignment.findFirst({ where: { casinoId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
      : recommendation.subjectType === "CASINO_BONUS"
        ? await tx.casinoBonusPartnerHostedCreativeAssignment.findFirst({ where: { casinoBonusId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
        : await tx.affiliateOfferPartnerHostedCreativeAssignment.findFirst({ where: { affiliateOfferId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    return record ? { ...record, sourceMode: recommendation.sourceMode as "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED", mediaAssetId: null } : null;
  }
  const select = { id: true, reference: true, active: true, mediaAssetId: true, countryCode: true, languageCode: true } as const;
  const record = recommendation.subjectType === "CASINO"
    ? await tx.casinoMediaAssignment.findFirst({ where: { casinoId: recommendation.subjectId, ...where }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    : recommendation.subjectType === "CASINO_BONUS"
      ? await tx.casinoBonusMediaAssignment.findFirst({ where: { casinoBonusId: recommendation.subjectId, ...where }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
      : await tx.affiliateOfferMediaAssignment.findFirst({ where: { affiliateOfferId: recommendation.subjectId, ...where }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return record ? { ...record, sourceMode: "FIRST_PARTY_MEDIA", creativeId: null } : null;
}

async function activeCrossSourceAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation): Promise<AssignmentIdentity | null> {
  const base = {
    placement: recommendation.placement as MediaPlacement,
    variant: recommendation.variant as MediaPlacementVariant,
    countryCode: recommendation.countryCode,
    languageCode: recommendation.languageCode,
    active: true,
  };
  if (hostedRecommendation(recommendation)) {
    if ((recommendation.languageState ?? "UNKNOWN") === "UNKNOWN") return null;
    const select = { id: true, reference: true, active: true, mediaAssetId: true, countryCode: true, languageCode: true } as const;
    const record = recommendation.subjectType === "CASINO"
      ? await tx.casinoMediaAssignment.findFirst({ where: { casinoId: recommendation.subjectId, ...base }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
      : recommendation.subjectType === "CASINO_BONUS"
        ? await tx.casinoBonusMediaAssignment.findFirst({ where: { casinoBonusId: recommendation.subjectId, ...base }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
        : await tx.affiliateOfferMediaAssignment.findFirst({ where: { affiliateOfferId: recommendation.subjectId, ...base }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    return record ? { ...record, sourceMode: "FIRST_PARTY_MEDIA", creativeId: null } : null;
  }
  const languageState = recommendation.languageCode ? "EXPLICIT" as const : "NEUTRAL" as const;
  const hostedWhere = { ...base, languageState };
  const select = { id: true, reference: true, active: true, creativeId: true, countryCode: true, languageCode: true, creative: { select: { sourceMode: true } } } as const;
  const record = recommendation.subjectType === "CASINO"
    ? await tx.casinoPartnerHostedCreativeAssignment.findFirst({ where: { casinoId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    : recommendation.subjectType === "CASINO_BONUS"
      ? await tx.casinoBonusPartnerHostedCreativeAssignment.findFirst({ where: { casinoBonusId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
      : await tx.affiliateOfferPartnerHostedCreativeAssignment.findFirst({ where: { affiliateOfferId: recommendation.subjectId, ...hostedWhere }, select, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return record ? { ...record, sourceMode: record.creative.sourceMode, mediaAssetId: null } : null;
}

async function deactivateAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, id: string) {
  if (hostedRecommendation(recommendation)) {
    const scope = { id, ...hostedTargetScope(recommendation), active: true };
    if (recommendation.subjectType === "CASINO") return tx.casinoPartnerHostedCreativeAssignment.updateMany({ where: { casinoId: recommendation.subjectId, ...scope }, data: { active: false } });
    if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusPartnerHostedCreativeAssignment.updateMany({ where: { casinoBonusId: recommendation.subjectId, ...scope }, data: { active: false } });
    return tx.affiliateOfferPartnerHostedCreativeAssignment.updateMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope }, data: { active: false } });
  }
  const scope = { id, ...targetScope(recommendation), active: true };
  if (recommendation.subjectType === "CASINO") return tx.casinoMediaAssignment.updateMany({ where: { casinoId: recommendation.subjectId, ...scope }, data: { active: false } });
  if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusMediaAssignment.updateMany({ where: { casinoBonusId: recommendation.subjectId, ...scope }, data: { active: false } });
  return tx.affiliateOfferMediaAssignment.updateMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope }, data: { active: false } });
}

async function createAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, reference: string) {
  if (hostedRecommendation(recommendation)) {
    if (!recommendation.hostedCreativeId) throw new Error("HOSTED_CREATIVE_REQUIRED");
    const data = {
      creativeId: recommendation.hostedCreativeId,
      placement: recommendation.placement as MediaPlacement,
      variant: recommendation.variant as MediaPlacementVariant,
      ...hostedTargetScope(recommendation),
      renderingMode: recommendation.renderingMode as MediaRenderingMode,
      sortOrder: 0,
      active: true,
      reference,
    };
    if (recommendation.subjectType === "CASINO") return tx.casinoPartnerHostedCreativeAssignment.create({ data: { casinoId: recommendation.subjectId, ...data } });
    if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusPartnerHostedCreativeAssignment.create({ data: { casinoBonusId: recommendation.subjectId, ...data } });
    return tx.affiliateOfferPartnerHostedCreativeAssignment.create({ data: { affiliateOfferId: recommendation.subjectId, ...data } });
  }
  if (!recommendation.assetId) throw new Error("MEDIA_ASSET_REQUIRED");
  const data = {
    mediaAssetId: recommendation.assetId,
    placement: recommendation.placement as MediaPlacement,
    variant: recommendation.variant as MediaPlacementVariant,
    countryCode: recommendation.countryCode,
    languageCode: recommendation.languageCode,
    renderingMode: recommendation.renderingMode as MediaRenderingMode,
    sortOrder: 0,
    active: true,
    cropSafe: recommendation.cropSafe,
    reference,
  };
  if (recommendation.subjectType === "CASINO") return tx.casinoMediaAssignment.create({ data: { casinoId: recommendation.subjectId, ...data } });
  if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusMediaAssignment.create({ data: { casinoBonusId: recommendation.subjectId, ...data } });
  return tx.affiliateOfferMediaAssignment.create({ data: { affiliateOfferId: recommendation.subjectId, ...data } });
}

async function deleteOwnedAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, id: string, reference: string) {
  if (hostedRecommendation(recommendation)) {
    const scope = { id, reference, ...hostedTargetScope(recommendation) };
    if (recommendation.subjectType === "CASINO") return (await tx.casinoPartnerHostedCreativeAssignment.deleteMany({ where: { casinoId: recommendation.subjectId, ...scope } })).count;
    if (recommendation.subjectType === "CASINO_BONUS") return (await tx.casinoBonusPartnerHostedCreativeAssignment.deleteMany({ where: { casinoBonusId: recommendation.subjectId, ...scope } })).count;
    return (await tx.affiliateOfferPartnerHostedCreativeAssignment.deleteMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope } })).count;
  }
  const scope = { id, reference, ...targetScope(recommendation) };
  if (recommendation.subjectType === "CASINO") return (await tx.casinoMediaAssignment.deleteMany({ where: { casinoId: recommendation.subjectId, ...scope } })).count;
  if (recommendation.subjectType === "CASINO_BONUS") return (await tx.casinoBonusMediaAssignment.deleteMany({ where: { casinoBonusId: recommendation.subjectId, ...scope } })).count;
  return (await tx.affiliateOfferMediaAssignment.deleteMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope } })).count;
}

async function restoreAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, id: string) {
  const current = await activeAssignment(tx, recommendation);
  const crossSource = await activeCrossSourceAssignment(tx, recommendation);
  if (current || crossSource) return false;
  if (hostedRecommendation(recommendation)) {
    const scope = { id, ...hostedTargetScope(recommendation), active: false };
    if (recommendation.subjectType === "CASINO") return Boolean(await tx.casinoPartnerHostedCreativeAssignment.updateMany({ where: { casinoId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
    if (recommendation.subjectType === "CASINO_BONUS") return Boolean(await tx.casinoBonusPartnerHostedCreativeAssignment.updateMany({ where: { casinoBonusId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
    return Boolean(await tx.affiliateOfferPartnerHostedCreativeAssignment.updateMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
  }
  const scope = { id, ...targetScope(recommendation), active: false };
  if (recommendation.subjectType === "CASINO") return Boolean(await tx.casinoMediaAssignment.updateMany({ where: { casinoId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
  if (recommendation.subjectType === "CASINO_BONUS") return Boolean(await tx.casinoBonusMediaAssignment.updateMany({ where: { casinoBonusId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
  return Boolean(await tx.affiliateOfferMediaAssignment.updateMany({ where: { affiliateOfferId: recommendation.subjectId, ...scope }, data: { active: true } }).then((result) => result.count));
}

async function auditAssignment(
  tx: Prisma.TransactionClient,
  plan: MediaIngestionPlan,
  recommendation: MediaPlanRecommendation,
  operation: string,
  assignmentId: string,
  previous: Record<string, unknown> | null,
  result: Record<string, unknown>,
  actorId: string,
  source: MediaOperationsSource,
) {
  const asset = plan.assets.find((entry) => recommendation.hostedCreativeId
    ? entry.hostedCreativeId === recommendation.hostedCreativeId
    : entry.assetId === recommendation.assetId);
  await tx.auditLog.create({
    data: {
      actorId,
      action: operation.toLowerCase().replaceAll("_", "-"),
      entityType: "media-assignment",
      entityId: assignmentId,
      summary: `Media Operations ${operation.toLowerCase().replaceAll("_", " ")}`,
      metadata: json({
        actorId,
        source: "MEDIA_OPERATIONS",
        channel: source,
        planId: plan.id,
        recommendationId: recommendation.id,
        subject: {
          type: recommendation.subjectType,
          id: recommendation.subjectId,
          countryCode: recommendation.countryCode,
          languageCode: recommendation.languageCode,
          languageState: recommendation.languageState ?? "NEUTRAL",
        },
        checksum: asset?.checksum ?? null,
        providerReference: plan.providerReference,
        operation,
        previous,
        result,
        timestamp: new Date().toISOString(),
      }),
    },
  });
}

export class MediaIngestionRepository {
  async savePlan(plan: MediaIngestionPlan, audit: PlanAudit) {
    return prisma.$transaction(async (tx) => {
      await writePlan(tx, plan);
      await auditPlan(tx, plan, audit);
      return plan;
    });
  }

  async getPlan(planId: string) {
    const record = await prisma.siteSetting.findUnique({ where: { key: mediaIngestionPlanKey(planId) } });
    return record ? planFromValue(record.value) : null;
  }

  async listRecent(limit = 20) {
    const records = await prisma.siteSetting.findMany({
      where: { key: { startsWith: MEDIA_INGESTION_PLAN_KEY_PREFIX } },
      orderBy: { updatedAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return records.map((record) => planFromValue(record.value));
  }

  async saveBatch(batch: MediaIngestionBatch, audit: { operation: string; result: Record<string, unknown> }) {
    const parsed = mediaIngestionBatchSchema.parse(batch);
    return prisma.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key: mediaIngestionBatchKey(parsed.id) },
        create: { key: mediaIngestionBatchKey(parsed.id), value: json(parsed) },
        update: { value: json(parsed) },
      });
      await tx.auditLog.create({
        data: {
          actorId: parsed.actorId,
          action: audit.operation.toLowerCase().replaceAll("_", "-"),
          entityType: "media-ingestion-batch",
          entityId: parsed.id,
          summary: `Media ingestion batch ${audit.operation.toLowerCase().replaceAll("_", " ")}`,
          metadata: json({
            actorId: parsed.actorId,
            source: "MEDIA_OPERATIONS",
            channel: parsed.source,
            batchId: parsed.id,
            batchChecksum: parsed.batchChecksum,
            planIds: parsed.planIds,
            operation: audit.operation,
            result: audit.result,
            timestamp: parsed.updatedAt,
          }),
        },
      });
      return parsed;
    });
  }

  async getBatch(batchId: string) {
    const record = await prisma.siteSetting.findUnique({ where: { key: mediaIngestionBatchKey(batchId) } });
    return record ? mediaIngestionBatchSchema.parse(record.value) : null;
  }

  async listRecentBatches(limit = 20) {
    const records = await prisma.siteSetting.findMany({
      where: { key: { startsWith: MEDIA_INGESTION_BATCH_KEY_PREFIX } },
      orderBy: { updatedAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return records.map((record) => mediaIngestionBatchSchema.parse(record.value));
  }

  async applyDraftPlan(input: { planId: string; recommendationIds?: string[]; replaceExisting: boolean; actorId: string; source: MediaOperationsSource }) {
    return prisma.$transaction(async (tx) => {
      const setting = await tx.siteSetting.findUnique({ where: { key: mediaIngestionPlanKey(input.planId) } });
      if (!setting) throw new Error("MEDIA_INGESTION_PLAN_NOT_FOUND");
      const plan = planFromValue(setting.value);
      const previousPlanState = plan.state;
      const selected = input.recommendationIds ? new Set(input.recommendationIds) : null;
      const now = new Date().toISOString();
      let applied = 0;
      const skipped: Array<{ recommendationId: string; reason: string }> = [];
      for (const recommendation of plan.recommendations) {
        if (selected && !selected.has(recommendation.id)) continue;
        if (recommendation.appliedAssignmentId && !recommendation.rolledBackAt) continue;
        if (recommendation.applyEligibility === "BLOCKED") {
          skipped.push({ recommendationId: recommendation.id, reason: recommendation.applyBlocker ?? "RECOMMENDATION_REQUIRES_REVIEW" });
          continue;
        }
        const allowed = recommendation.state === "AUTO_ASSIGN_DRAFT" || (input.replaceExisting && recommendation.state === "SUGGEST_REVIEW" && recommendation.replacementEligible);
        if (!allowed) { skipped.push({ recommendationId: recommendation.id, reason: "RECOMMENDATION_REQUIRES_REVIEW" }); continue; }
        if (recommendation.subjectType === "CASINO" ? !isCasinoMediaPlacement(recommendation.placement) : isCasinoMediaPlacement(recommendation.placement)) {
          skipped.push({ recommendationId: recommendation.id, reason: "SUBJECT_PLACEMENT_MISMATCH" }); continue;
        }
        if (recommendation.renderingMode === "COVER" && !recommendation.cropSafe) {
          skipped.push({ recommendationId: recommendation.id, reason: "CROP_SAFETY_REQUIRED" }); continue;
        }
        const state = await subjectState(tx, recommendation);
        if (!state || state.casinoStatus !== EditorialStatus.DRAFT || state.subjectStatus !== EditorialStatus.DRAFT || (state.offerStatus && state.offerStatus !== AffiliateStatus.DRAFT)) {
          skipped.push({ recommendationId: recommendation.id, reason: "SUBJECT_NOT_DRAFT" }); continue;
        }
        if (hostedRecommendation(recommendation)) {
          const creative = recommendation.hostedCreativeId
            ? await tx.partnerHostedCreative.findUnique({ where: { id: recommendation.hostedCreativeId }, select: {
              id: true,
              casinoId: true,
              casinoBonusId: true,
              affiliateOfferId: true,
              sourceMode: true,
              active: true,
              archivedAt: true,
              validationState: true,
              destinationVerificationState: true,
              redirectSlugId: true,
              trackingLinkId: true,
              countryCode: true,
              languageCode: true,
              languageState: true,
            } })
            : null;
          const subjectMatches = creative && (recommendation.subjectType === "CASINO"
            || (recommendation.subjectType === "CASINO_BONUS" && creative.casinoBonusId === recommendation.subjectId)
            || (recommendation.subjectType === "AFFILIATE_OFFER" && creative.affiliateOfferId === recommendation.subjectId));
          if (creative && (!creative.redirectSlugId || !creative.trackingLinkId)) {
            skipped.push({ recommendationId: recommendation.id, reason: "CANONICAL_COMMERCIAL_ROUTE_REQUIRED" }); continue;
          }
          if (creative && creative.validationState !== "VALIDATED") {
            skipped.push({ recommendationId: recommendation.id, reason: "MEDIA_VALIDATION_REQUIRED" }); continue;
          }
          if (creative && creative.destinationVerificationState !== "VERIFIED") {
            skipped.push({ recommendationId: recommendation.id, reason: "COMMERCIAL_ROUTE_VALIDATION_REQUIRED" }); continue;
          }
          if (!creative || !creative.active || creative.archivedAt || creative.casinoId !== state.casinoId
            || creative.validationState !== "VALIDATED" || creative.destinationVerificationState !== "VERIFIED"
            || !creative.redirectSlugId || !creative.trackingLinkId || creative.sourceMode !== recommendation.sourceMode
            || !subjectMatches
            || (creative.countryCode ?? null) !== recommendation.countryCode
            || (creative.languageCode ?? null) !== recommendation.languageCode
            || creative.languageState !== (recommendation.languageState ?? "UNKNOWN")) {
            skipped.push({ recommendationId: recommendation.id, reason: "HOSTED_CREATIVE_NOT_ELIGIBLE" }); continue;
          }
        } else {
          if ((recommendation.languageState ?? (recommendation.languageCode ? "EXPLICIT" : "NEUTRAL"))
            !== (recommendation.languageCode ? "EXPLICIT" : "NEUTRAL")) {
            skipped.push({ recommendationId: recommendation.id, reason: "FIRST_PARTY_LANGUAGE_STATE_UNREPRESENTABLE" }); continue;
          }
          const asset = recommendation.assetId
            ? await tx.mediaAsset.findUnique({ where: { id: recommendation.assetId }, select: { id: true, casinoId: true, status: true, archivedAt: true } })
            : null;
          if (!asset || asset.status !== MediaAssetStatus.ACTIVE || asset.archivedAt || asset.casinoId !== state.casinoId) {
            skipped.push({ recommendationId: recommendation.id, reason: "ASSET_NOT_ELIGIBLE" }); continue;
          }
        }
        const reference = mediaIngestionAssignmentReference(plan.id, recommendation.id);
        const current = await activeAssignment(tx, recommendation);
        const crossSource = await activeCrossSourceAssignment(tx, recommendation);
        if (crossSource) {
          skipped.push({ recommendationId: recommendation.id, reason: "CROSS_SOURCE_ASSIGNMENT_REQUIRES_EDITORIAL_RESOLUTION" }); continue;
        }
        if (current?.reference === reference) {
          recommendation.appliedAssignmentId = current.id;
          recommendation.appliedAt = recommendation.appliedAt ?? now;
          recommendation.rolledBackAt = null;
          continue;
        }
        if (recommendation.existingAssignmentId && current?.id !== recommendation.existingAssignmentId) {
          skipped.push({ recommendationId: recommendation.id, reason: "ASSIGNMENT_CHANGED_SINCE_PLAN" }); continue;
        }
        if (current && !input.replaceExisting) { skipped.push({ recommendationId: recommendation.id, reason: "EXPLICIT_ASSIGNMENT_PROTECTED" }); continue; }
        if (current && !recommendation.replacementEligible) { skipped.push({ recommendationId: recommendation.id, reason: "REPLACEMENT_NOT_ELIGIBLE" }); continue; }
        if (current) await deactivateAssignment(tx, recommendation, current.id);
        const created = await createAssignment(tx, recommendation, reference);
        recommendation.appliedAssignmentId = created.id;
        recommendation.replacedAssignmentId = current?.id ?? null;
        recommendation.appliedAt = now;
        recommendation.rolledBackAt = null;
        const operation = current ? "REPLACE_ASSIGNMENT" : "APPLY_ASSIGNMENT";
        plan.operations.push({
          id: randomUUID(), operation, recommendationId: recommendation.id,
          subject: `${recommendation.subjectType}:${recommendation.subjectId}:${recommendation.countryCode ?? "GLOBAL"}:${recommendation.languageCode ?? "neutral"}`,
          previous: current ? { assignmentId: current.id, mediaAssetId: current.mediaAssetId, hostedCreativeId: current.creativeId, countryCode: current.countryCode, languageCode: current.languageCode, active: true } : null,
          result: { assignmentId: created.id, mediaAssetId: recommendation.assetId, hostedCreativeId: recommendation.hostedCreativeId ?? null, countryCode: recommendation.countryCode, languageCode: recommendation.languageCode, languageState: recommendation.languageState ?? "NEUTRAL", active: true },
          actorId: input.actorId, source: input.source, timestamp: now,
        });
        await auditAssignment(tx, plan, recommendation, operation, created.id, current ? {
          assignmentId: current.id,
          countryCode: current.countryCode,
          languageCode: current.languageCode,
          active: true,
        } : null, {
          assignmentId: created.id,
          countryCode: recommendation.countryCode,
          languageCode: recommendation.languageCode,
          languageState: recommendation.languageState ?? "NEUTRAL",
          active: true,
        }, input.actorId, input.source);
        applied += 1;
      }
      plan.operations = plan.operations.slice(-300);
      const stillApplied = plan.recommendations.filter((item) => item.appliedAssignmentId && !item.rolledBackAt).length;
      plan.state = stillApplied === plan.recommendations.filter((item) => item.state === "AUTO_ASSIGN_DRAFT" || item.replacementEligible).length && stillApplied > 0 ? "APPLIED" : stillApplied > 0 ? "PARTIALLY_APPLIED" : plan.state;
      plan.updatedAt = now;
      await writePlan(tx, plan);
      await auditPlan(tx, plan, { operation: "APPLY_PLAN", previous: { state: previousPlanState }, result: { state: plan.state, applied, skipped }, actorId: input.actorId, source: input.source });
      return { plan, applied, skipped };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async rollbackDraftPlan(input: { planId: string; recommendationIds?: string[]; actorId: string; source: MediaOperationsSource }) {
    return prisma.$transaction(async (tx) => {
      const setting = await tx.siteSetting.findUnique({ where: { key: mediaIngestionPlanKey(input.planId) } });
      if (!setting) throw new Error("MEDIA_INGESTION_PLAN_NOT_FOUND");
      const plan = planFromValue(setting.value);
      const selected = input.recommendationIds ? new Set(input.recommendationIds) : null;
      const now = new Date().toISOString();
      let rolledBack = 0;
      const skipped: Array<{ recommendationId: string; reason: string }> = [];
      for (const recommendation of plan.recommendations) {
        if (selected && !selected.has(recommendation.id)) continue;
        if (!recommendation.appliedAssignmentId || recommendation.rolledBackAt) continue;
        const state = await subjectState(tx, recommendation);
        if (!state || state.casinoStatus !== EditorialStatus.DRAFT || state.subjectStatus !== EditorialStatus.DRAFT || (state.offerStatus && state.offerStatus !== AffiliateStatus.DRAFT)) {
          skipped.push({ recommendationId: recommendation.id, reason: "SUBJECT_NOT_DRAFT" }); continue;
        }
        const reference = mediaIngestionAssignmentReference(plan.id, recommendation.id);
        const removed = await deleteOwnedAssignment(tx, recommendation, recommendation.appliedAssignmentId, reference);
        if (!removed) { skipped.push({ recommendationId: recommendation.id, reason: "PLAN_OWNED_ASSIGNMENT_NOT_FOUND" }); continue; }
        const removedId = recommendation.appliedAssignmentId;
        let restored = false;
        if (recommendation.replacedAssignmentId) restored = await restoreAssignment(tx, recommendation, recommendation.replacedAssignmentId);
        recommendation.rolledBackAt = now;
        plan.operations.push({
          id: randomUUID(), operation: "ROLLBACK_ASSIGNMENT", recommendationId: recommendation.id,
          subject: `${recommendation.subjectType}:${recommendation.subjectId}:${recommendation.countryCode ?? "GLOBAL"}:${recommendation.languageCode ?? "neutral"}`,
          previous: { assignmentId: removedId, countryCode: recommendation.countryCode, languageCode: recommendation.languageCode, active: true },
          result: { assignmentRemoved: true, restoredAssignmentId: restored ? recommendation.replacedAssignmentId : null, countryCode: recommendation.countryCode, languageCode: recommendation.languageCode, assetRetained: true },
          actorId: input.actorId, source: input.source, timestamp: now,
        });
        await auditAssignment(tx, plan, recommendation, "ROLLBACK_ASSIGNMENT", removedId, {
          assignmentId: removedId,
          countryCode: recommendation.countryCode,
          languageCode: recommendation.languageCode,
          active: true,
        }, {
          assignmentRemoved: true,
          restoredAssignmentId: restored ? recommendation.replacedAssignmentId : null,
          countryCode: recommendation.countryCode,
          languageCode: recommendation.languageCode,
          assetRetained: true,
        }, input.actorId, input.source);
        rolledBack += 1;
      }
      plan.operations = plan.operations.slice(-300);
      const stillApplied = plan.recommendations.some((item) => item.appliedAssignmentId && !item.rolledBackAt);
      plan.state = stillApplied ? "PARTIALLY_APPLIED" : rolledBack ? "ROLLED_BACK" : plan.state;
      plan.updatedAt = now;
      await writePlan(tx, plan);
      await auditPlan(tx, plan, { operation: "ROLLBACK_PLAN", result: { rolledBack, skipped, assetsDeleted: 0 }, actorId: input.actorId, source: input.source });
      return { plan, rolledBack, skipped };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

export const mediaIngestionRepository = new MediaIngestionRepository();

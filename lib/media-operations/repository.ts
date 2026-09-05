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
  mediaIngestionPlanKey,
  mediaIngestionPlanSchema,
  MEDIA_INGESTION_PLAN_KEY_PREFIX,
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

type AssignmentIdentity = { id: string; reference: string | null; active: boolean; mediaAssetId: string };

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
  const where = { placement: recommendation.placement as MediaPlacement, variant: recommendation.variant as MediaPlacementVariant, active: true };
  if (recommendation.subjectType === "CASINO") return tx.casinoMediaAssignment.findFirst({ where: { casinoId: recommendation.subjectId, ...where }, select: { id: true, reference: true, active: true, mediaAssetId: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusMediaAssignment.findFirst({ where: { casinoBonusId: recommendation.subjectId, ...where }, select: { id: true, reference: true, active: true, mediaAssetId: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return tx.affiliateOfferMediaAssignment.findFirst({ where: { affiliateOfferId: recommendation.subjectId, ...where }, select: { id: true, reference: true, active: true, mediaAssetId: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
}

async function deactivateAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, id: string) {
  if (recommendation.subjectType === "CASINO") return tx.casinoMediaAssignment.update({ where: { id }, data: { active: false } });
  if (recommendation.subjectType === "CASINO_BONUS") return tx.casinoBonusMediaAssignment.update({ where: { id }, data: { active: false } });
  return tx.affiliateOfferMediaAssignment.update({ where: { id }, data: { active: false } });
}

async function createAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, reference: string) {
  const data = {
    mediaAssetId: recommendation.assetId,
    placement: recommendation.placement as MediaPlacement,
    variant: recommendation.variant as MediaPlacementVariant,
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
  if (recommendation.subjectType === "CASINO") return (await tx.casinoMediaAssignment.deleteMany({ where: { id, casinoId: recommendation.subjectId, reference } })).count;
  if (recommendation.subjectType === "CASINO_BONUS") return (await tx.casinoBonusMediaAssignment.deleteMany({ where: { id, casinoBonusId: recommendation.subjectId, reference } })).count;
  return (await tx.affiliateOfferMediaAssignment.deleteMany({ where: { id, affiliateOfferId: recommendation.subjectId, reference } })).count;
}

async function restoreAssignment(tx: Prisma.TransactionClient, recommendation: MediaPlanRecommendation, id: string) {
  const current = await activeAssignment(tx, recommendation);
  if (current) return false;
  if (recommendation.subjectType === "CASINO") return Boolean(await tx.casinoMediaAssignment.updateMany({ where: { id, casinoId: recommendation.subjectId, active: false }, data: { active: true } }).then((result) => result.count));
  if (recommendation.subjectType === "CASINO_BONUS") return Boolean(await tx.casinoBonusMediaAssignment.updateMany({ where: { id, casinoBonusId: recommendation.subjectId, active: false }, data: { active: true } }).then((result) => result.count));
  return Boolean(await tx.affiliateOfferMediaAssignment.updateMany({ where: { id, affiliateOfferId: recommendation.subjectId, active: false }, data: { active: true } }).then((result) => result.count));
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
  const asset = plan.assets.find((entry) => entry.assetId === recommendation.assetId);
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
        subject: { type: recommendation.subjectType, id: recommendation.subjectId },
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
        const asset = await tx.mediaAsset.findUnique({ where: { id: recommendation.assetId }, select: { id: true, casinoId: true, status: true, archivedAt: true } });
        if (!asset || asset.status !== MediaAssetStatus.ACTIVE || asset.archivedAt || asset.casinoId !== state.casinoId) {
          skipped.push({ recommendationId: recommendation.id, reason: "ASSET_NOT_ELIGIBLE" }); continue;
        }
        const reference = mediaIngestionAssignmentReference(plan.id, recommendation.id);
        const current = await activeAssignment(tx, recommendation);
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
          subject: `${recommendation.subjectType}:${recommendation.subjectId}`,
          previous: current ? { assignmentId: current.id, mediaAssetId: current.mediaAssetId, active: true } : null,
          result: { assignmentId: created.id, mediaAssetId: recommendation.assetId, active: true },
          actorId: input.actorId, source: input.source, timestamp: now,
        });
        await auditAssignment(tx, plan, recommendation, operation, created.id, current ? { assignmentId: current.id, active: true } : null, { assignmentId: created.id, active: true }, input.actorId, input.source);
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
          subject: `${recommendation.subjectType}:${recommendation.subjectId}`,
          previous: { assignmentId: removedId, active: true },
          result: { assignmentRemoved: true, restoredAssignmentId: restored ? recommendation.replacedAssignmentId : null, assetRetained: true },
          actorId: input.actorId, source: input.source, timestamp: now,
        });
        await auditAssignment(tx, plan, recommendation, "ROLLBACK_ASSIGNMENT", removedId, { assignmentId: removedId, active: true }, { assignmentRemoved: true, restoredAssignmentId: restored ? recommendation.replacedAssignmentId : null, assetRetained: true }, input.actorId, input.source);
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

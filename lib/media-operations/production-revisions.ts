import { createHash, randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { resolveCasinoMedia } from "@/lib/media/casino-media-resolver";
import { mediaPlacementRegistry, type MediaPlacementName, type PlacementMediaAssignment, type PlacementMediaAsset } from "@/lib/media/placement-media";
import type { MediaIngestionPlan, MediaOrchestrateProductionInput, MediaRollbackRevisionInput } from "@/lib/media-operations/contracts";
import { mediaIngestionRepository } from "@/lib/media-operations/repository";
import type { MediaOperationsActor } from "@/lib/media-operations/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/services/service-error";

const MAX_SERIALIZABLE_ATTEMPTS = 3;

type PreparedSource = {
  id: string;
  creativeId: string;
  mediaAssetId: string | null;
  hostedCreativeId: string | null;
  sourceHash: string;
  width: number;
  height: number;
  countryCode: string | null;
  languageCode: string | null;
  languageState: "EXPLICIT" | "NEUTRAL" | "UNKNOWN";
  variant: "DEFAULT" | "DESKTOP" | "MOBILE";
  placement: "CASINO_REVIEW_RIGHT_HERO" | "CASINO_DIRECTORY_CARD";
  priority: number;
  altText: string | null;
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, stable(entry)]));
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code);
}

async function serializable<T>(operation: () => Promise<T>) {
  let last: unknown;
  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!retryable(error) || attempt === MAX_SERIALIZABLE_ATTEMPTS - 1) throw error;
      last = error;
    }
  }
  throw last;
}

function deviceFor(width: number, height: number) {
  if (width <= 400 && height <= 120) return "MOBILE" as const;
  if (width / height >= 3.2) return "DESKTOP" as const;
  return "DEFAULT" as const;
}

function formatPriority(placement: PreparedSource["placement"], variant: PreparedSource["variant"], width: number, height: number) {
  const spec = mediaPlacementRegistry[placement];
  const key = variant === "MOBILE" ? "mobile" : variant === "DESKTOP" ? "desktop" : "default";
  const exact = `${width}×${height}`;
  const position = spec.preferredFormats[key].indexOf(exact as never);
  return position >= 0 ? 100 - position : 10;
}

function usableFor(placement: PreparedSource["placement"], width: number, height: number) {
  const spec = mediaPlacementRegistry[placement];
  return width >= spec.minimum.width && height >= spec.minimum.height;
}

function routeVerifiedStaticOverride(
  plan: MediaIngestionPlan,
  recommendation: MediaIngestionPlan["recommendations"][number],
  mediaAssetId: string | null,
  hostedCreativeId: string | null,
  affiliateOfferId: string,
) {
  if (!mediaAssetId || hostedCreativeId || recommendation.sourceMode !== "FIRST_PARTY_MEDIA") return false;
  if (plan.resolvedContext.state !== "RESOLVED" || plan.resolvedContext.source !== "EXPLICIT") return false;
  if (plan.requestedContext.affiliateOfferId !== affiliateOfferId || plan.resolvedContext.affiliateOfferId !== affiliateOfferId) return false;
  return plan.resolvedContext.trackingDestinationState === "MATCH" && recommendation.offerMatch !== "MISMATCH";
}

function productionRecommendations(
  plan: MediaIngestionPlan,
  creativeId: string,
  mediaAssetId: string | null,
  hostedCreativeId: string | null,
  affiliateOfferId: string,
) {
  return plan.recommendations.filter((recommendation) => {
    const exactSubject = recommendation.creativeId === creativeId
      && recommendation.subjectType === "AFFILIATE_OFFER"
      && recommendation.subjectId === affiliateOfferId
      && ["GLOBAL_SAFE", "TARGETED"].includes(recommendation.marketHandling)
      && recommendation.assetId === mediaAssetId
      && (recommendation.hostedCreativeId ?? null) === hostedCreativeId;
    if (!exactSubject) return false;
    const exactAutomatic = recommendation.offerMatch === "MATCH"
      && recommendation.state === "AUTO_ASSIGN_DRAFT"
      && recommendation.applyEligibility !== "BLOCKED";
    return exactAutomatic || routeVerifiedStaticOverride(
      plan,
      recommendation,
      mediaAssetId,
      hostedCreativeId,
      affiliateOfferId,
    );
  });
}

function uniqueScopes(recommendations: MediaIngestionPlan["recommendations"]) {
  const scopes = recommendations.map((recommendation) => ({
    countryCode: recommendation.countryCode,
    languageCode: recommendation.languageCode,
    languageState: recommendation.languageState ?? (recommendation.languageCode ? "EXPLICIT" : "NEUTRAL"),
  }));
  return [...new Map(scopes.map((scope) => [`${scope.countryCode ?? "GLOBAL"}:${scope.languageState}:${scope.languageCode ?? "none"}`, scope])).values()];
}

export function prepareProductionSources(
  plans: MediaIngestionPlan[],
  input: Pick<MediaOrchestrateProductionInput, "casinoId" | "affiliateOfferId" | "placements">,
) {
  const prepared: PreparedSource[] = [];
  const blockers: string[] = [];
  for (const plan of plans) {
    if (plan.resolvedContext.state !== "RESOLVED" || plan.resolvedContext.source !== "EXPLICIT"
      || plan.requestedContext.casinoId !== input.casinoId
      || plan.requestedContext.affiliateOfferId !== input.affiliateOfferId
      || plan.resolvedContext.casinoId !== input.casinoId
      || plan.resolvedContext.affiliateOfferId !== input.affiliateOfferId) {
      blockers.push(`PLAN_EXACT_IDENTITY_REQUIRED:${plan.id}`);
      continue;
    }
    for (const asset of plan.assets) {
      const firstParty = !asset.sourceMode || asset.sourceMode === "FIRST_PARTY_MEDIA";
      if (!asset.width || !asset.height || !asset.checksum
        || !["INGESTED", "REUSED", "HOSTED_INGESTED"].includes(asset.state)
        || (asset.mediaValidity && asset.mediaValidity !== "VALID")) {
        blockers.push(`SOURCE_NOT_MEDIA_VALID:${plan.id}:${asset.creativeId}`);
        continue;
      }
      if (asset.animated) {
        blockers.push(`ANIMATION_NOT_ALLOWED:${plan.id}:${asset.creativeId}`);
        continue;
      }
      if (firstParty !== Boolean(asset.assetId) || firstParty === Boolean(asset.hostedCreativeId)) {
        blockers.push(`SOURCE_RELATION_INVALID:${plan.id}:${asset.creativeId}`);
        continue;
      }
      const matching = productionRecommendations(
        plan,
        asset.creativeId,
        asset.assetId,
        asset.hostedCreativeId ?? null,
        input.affiliateOfferId,
      );
      if (!matching.length) {
        blockers.push(`EXACT_PRODUCTION_RECOMMENDATION_REQUIRED:${plan.id}:${asset.creativeId}`);
        continue;
      }
      const scopes = uniqueScopes(matching);
      for (const scope of scopes) {
        if (scope.languageState === "UNKNOWN") {
          blockers.push(`UNKNOWN_PROMOTIONAL_LANGUAGE:${plan.id}:${asset.creativeId}`);
          continue;
        }
        const variant = deviceFor(asset.width, asset.height);
        for (const placement of input.placements) {
          if (!usableFor(placement, asset.width, asset.height)) {
            blockers.push(`FORMAT_NOT_USABLE:${plan.id}:${asset.creativeId}:${placement}`);
            continue;
          }
          prepared.push({
            id: randomUUID(),
            creativeId: asset.creativeId,
            mediaAssetId: asset.assetId,
            hostedCreativeId: asset.hostedCreativeId ?? null,
            sourceHash: asset.checksum,
            width: asset.width,
            height: asset.height,
            countryCode: scope.countryCode,
            languageCode: scope.languageCode,
            languageState: scope.languageState,
            variant,
            placement,
            priority: formatPriority(placement, variant, asset.width, asset.height),
            altText: plan.creatives.find((creative) => creative.id === asset.creativeId)?.alt ?? null,
          });
        }
      }
    }
  }
  const uniquePrepared = new Map<string, PreparedSource>();
  for (const source of prepared) {
    const key = [
      source.sourceHash,
      source.placement,
      source.variant,
      source.countryCode ?? "GLOBAL",
      source.languageState,
      source.languageCode ?? "none",
    ].join(":");
    if (!uniquePrepared.has(key)) uniquePrepared.set(key, source);
  }
  return { prepared: [...uniquePrepared.values()], blockers: [...new Set(blockers)].sort() };
}

function publicAsset(source: PreparedSource, firstParty: {
  id: string; type: string; publicUrl: string; mimeType: string; width: number | null; height: number | null; altText: string; status: string; archivedAt: Date | null; checksum: string | null; metadata: unknown;
} | null, hosted: {
  id: string; provider: string; sourceMode: string; hostedImageUrl: string | null; declaredWidth: number; declaredHeight: number; actualWidth: number | null; actualHeight: number | null; altText: string | null; purpose: string | null; externalCreativeId: string; currencyCode: string | null;
} | null): PlacementMediaAsset | null {
  if (firstParty) return {
    id: firstParty.id,
    type: firstParty.type,
    publicUrl: firstParty.publicUrl,
    mimeType: firstParty.mimeType,
    width: firstParty.width,
    height: firstParty.height,
    altText: firstParty.altText,
    status: firstParty.status,
    archivedAt: firstParty.archivedAt,
    checksum: firstParty.checksum,
    metadata: firstParty.metadata,
    sourceMode: "FIRST_PARTY_MEDIA",
  };
  if (!hosted) return null;
  return {
    id: hosted.id,
    type: "AFFILIATE_CREATIVE",
    publicUrl: hosted.sourceMode === "PARTNER_HOSTED_EMBED" ? `/partner-creatives/${hosted.id}/frame` : hosted.hostedImageUrl,
    width: hosted.actualWidth ?? hosted.declaredWidth,
    height: hosted.actualHeight ?? hosted.declaredHeight,
    altText: hosted.altText,
    status: "ACTIVE",
    sourceMode: hosted.sourceMode as "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED",
    provider: hosted.provider as "SUPERFLY" | "BANNERFLOW",
    hostedCreativeId: hosted.id,
    externalCreativeId: hosted.externalCreativeId,
    currencyCode: hosted.currencyCode,
    purpose: hosted.purpose,
    checksum: source.sourceHash,
  };
}

function authorityForCountry(activations: Array<{
  countryCode: string; status: string; desiredState: string; affiliateOfferId: string | null; globalFallbackBlockedCountries: string[];
}>, countryCode: string, offerId: string) {
  const exact = activations.find((activation) => activation.countryCode === countryCode);
  if (exact) return exact.status === "ACTIVE" && exact.desiredState === "ACTIVE" && exact.affiliateOfferId === offerId;
  const global = activations.find((activation) => activation.countryCode === "ZZ");
  return Boolean(global && global.status === "ACTIVE" && global.desiredState === "ACTIVE"
    && global.affiliateOfferId === offerId && !global.globalFallbackBlockedCountries.includes(countryCode));
}

type Transaction = Prisma.TransactionClient;

async function lockRevisionScope(tx: Transaction, casinoId: string, affiliateOfferId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${casinoId}:${affiliateOfferId}`}, 0))::text AS locked`;
}

async function safeRevision(revisionId: string) {
  return prisma.mediaRevision.findUnique({
    where: { id: revisionId },
    select: {
      id: true, casinoId: true, affiliateOfferId: true, previousRevisionId: true, batchId: true,
      idempotencyKey: true, payloadHash: true, status: true, source: true, summary: true,
      failureCode: true, failureDetail: true, createdBy: true, createdAt: true, updatedAt: true,
      preparedAt: true, activatedAt: true, supersededAt: true, rolledBackAt: true,
      verificationAt: true, verificationResult: true,
      variants: { select: {
        id: true, creativeSetId: true, mediaAssetId: true, hostedCreativeId: true, placement: true,
        variant: true, countryCode: true, languageCode: true, languageState: true, renderingMode: true,
        cropSafe: true, priority: true, status: true, availability: true, sourceHash: true,
        validFrom: true, validUntil: true, activatedAt: true, deactivatedAt: true,
      }, orderBy: [{ placement: "asc" }, { variant: "asc" }, { countryCode: "asc" }, { languageCode: "asc" }, { id: "asc" }] },
      preflight: { select: {
        id: true, countryCode: true, languageCode: true, languageState: true, device: true, placement: true,
        resolutionSource: true, status: true, creativeSetId: true, creativeVariantId: true,
        mediaAssetId: true, hostedCreativeId: true, assetHash: true, provider: true,
        externalCreativeId: true, result: true, blockerCode: true, createdAt: true,
      }, orderBy: [{ countryCode: "asc" }, { languageCode: "asc" }, { device: "asc" }, { placement: "asc" }] },
    },
  });
}

async function validateSources(tx: Transaction, sources: PreparedSource[], casinoId: string, offerId: string) {
  const assetIds = sources.flatMap((source) => source.mediaAssetId ? [source.mediaAssetId] : []);
  const hostedIds = sources.flatMap((source) => source.hostedCreativeId ? [source.hostedCreativeId] : []);
  const [assets, hosted] = await Promise.all([
    tx.mediaAsset.findMany({ where: { id: { in: assetIds } } }),
    tx.partnerHostedCreative.findMany({ where: { id: { in: hostedIds } } }),
  ]);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const hostedById = new Map(hosted.map((creative) => [creative.id, creative]));
  const blockers: string[] = [];
  for (const source of sources) {
    if (source.mediaAssetId) {
      const asset = assetsById.get(source.mediaAssetId);
      if (!asset || asset.casinoId !== casinoId || asset.status !== "ACTIVE" || asset.archivedAt
        || asset.checksum !== source.sourceHash || asset.width !== source.width || asset.height !== source.height) {
        blockers.push(`FIRST_PARTY_SOURCE_CHANGED:${source.id}`);
      }
    } else if (source.hostedCreativeId) {
      const creative = hostedById.get(source.hostedCreativeId);
      if (!creative || creative.casinoId !== casinoId || creative.affiliateOfferId !== offerId
        || !creative.active || creative.archivedAt || creative.validationState !== "VALIDATED"
        || creative.destinationVerificationState !== "VERIFIED" || !creative.redirectSlugId || !creative.trackingLinkId
        || creative.sourceChecksum !== source.sourceHash) blockers.push(`HOSTED_SOURCE_NOT_AVAILABLE:${source.id}`);
    } else blockers.push(`SOURCE_RELATION_MISSING:${source.id}`);
  }
  return { assetsById, hostedById, blockers };
}

export class MediaProductionRevisionService {
  async orchestrate(input: MediaOrchestrateProductionInput, actor: MediaOperationsActor) {
    const batch = await mediaIngestionRepository.getBatch(input.batchId);
    if (!batch) throw new NotFoundError("Media ingestion batch", { batchId: input.batchId });
    const plans = await Promise.all(batch.planIds.map(async (planId) => {
      const plan = await mediaIngestionRepository.getPlan(planId);
      if (!plan) throw new NotFoundError("Media ingestion plan", { planId });
      return plan;
    }));
    const { prepared, blockers: extractionBlockers } = prepareProductionSources(plans, input);
    const payloadHash = hash({
      batchChecksum: batch.batchChecksum,
      casinoId: input.casinoId,
      affiliateOfferId: input.affiliateOfferId,
      creativeSetIdentityKey: input.creativeSetIdentityKey,
      creativeSetName: input.creativeSetName,
      externalCampaignId: input.externalCampaignId,
      placements: [...input.placements].sort(),
      targets: input.targets.map((target) => ({ ...target, devices: [...target.devices].sort() }))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
      useSemanticAnalysis: input.useSemanticAnalysis,
      activate: input.activate,
      prepared: prepared.map((source) => ({ ...source, id: undefined })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    });
    const replay = await prisma.mediaRevision.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (replay) {
      if (replay.payloadHash !== payloadHash) throw new ConflictError("Media revision idempotency key was reused with a different payload", { revisionId: replay.id });
      return safeRevision(replay.id);
    }
    const sameBatch = await prisma.mediaRevision.findUnique({ where: { batchId_payloadHash: { batchId: input.batchId, payloadHash } } });
    if (sameBatch) return safeRevision(sameBatch.id);

    const revisionId = randomUUID();
    try {
      await serializable(() => prisma.$transaction(async (tx) => {
      await lockRevisionScope(tx, input.casinoId, input.affiliateOfferId);
      const [casino, offer, activations] = await Promise.all([
        tx.casino.findUnique({ where: { id: input.casinoId }, select: { id: true, title: true, status: true, archivedAt: true } }),
        tx.affiliateOffer.findUnique({ where: { id: input.affiliateOfferId }, include: { casinoBonus: true } }),
        tx.marketActivation.findMany({
          where: { casinoId: input.casinoId, countryCode: { in: [...new Set([...input.targets.map((target) => target.countryCode), "ZZ"])] } },
          select: { countryCode: true, status: true, desiredState: true, affiliateOfferId: true, globalFallbackBlockedCountries: true },
        }),
      ]);
      if (!casino || casino.archivedAt || casino.status !== "PUBLISHED") throw new ValidationError("Exact published Casino is required for Production media");
      if (!offer || offer.casinoId !== input.casinoId) throw new ValidationError("Exact AffiliateOffer does not belong to the exact Casino");
      if (offer.status !== "ACTIVE" || offer.archivedAt || (offer.startAt && offer.startAt > new Date()) || (offer.expiresAt && offer.expiresAt <= new Date())) {
        throw new ValidationError("Exact AffiliateOffer is not currently active");
      }
      if (offer.casinoBonus && (offer.casinoBonus.status !== "PUBLISHED" || offer.casinoBonus.offerStatus !== "ACTIVE"
        || (offer.casinoBonus.startsAt && offer.casinoBonus.startsAt > new Date()) || (offer.casinoBonus.expiresAt && offer.casinoBonus.expiresAt <= new Date()))) {
        throw new ValidationError("Exact CasinoBonus is not currently active");
      }
      const existingSet = await tx.mediaCreativeSet.findUnique({ where: { identityKey: input.creativeSetIdentityKey } });
      if (existingSet && (existingSet.casinoId !== input.casinoId || existingSet.affiliateOfferId !== input.affiliateOfferId || existingSet.purpose !== "PROMOTION")) {
        throw new ConflictError("Creative-set identity belongs to another canonical subject", { creativeSetId: existingSet.id });
      }
      if (existingSet && (existingSet.status === "ARCHIVED" || existingSet.archivedAt)) {
        throw new ConflictError("Archived creative-set identity cannot be reused for Production", { creativeSetId: existingSet.id });
      }
      if (existingSet && existingSet.casinoBonusId !== offer.casinoBonusId) {
        throw new ConflictError("Creative-set bonus identity differs from the exact AffiliateOffer", { creativeSetId: existingSet.id });
      }
      if (existingSet && input.externalCampaignId && existingSet.externalCampaignId
        && existingSet.externalCampaignId !== input.externalCampaignId) {
        throw new ConflictError("Creative-set external campaign identity differs from the Production request", { creativeSetId: existingSet.id });
      }
      const creativeSet = existingSet ?? await tx.mediaCreativeSet.create({ data: {
        id: randomUUID(), casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId,
        casinoBonusId: offer.casinoBonusId, identityKey: input.creativeSetIdentityKey,
        name: input.creativeSetName, purpose: "PROMOTION", status: "DRAFT",
        externalCampaignId: input.externalCampaignId, createdBy: actor.actorId, updatedBy: actor.actorId,
        metadata: { batchId: input.batchId, source: actor.source },
      } });
      if (existingSet && (existingSet.name !== input.creativeSetName
        || (!existingSet.externalCampaignId && input.externalCampaignId))) {
        await tx.mediaCreativeSet.update({
          where: { id: existingSet.id },
          data: {
            name: input.creativeSetName,
            externalCampaignId: existingSet.externalCampaignId ?? input.externalCampaignId,
            updatedBy: actor.actorId,
          },
        });
      }
      const validated = await validateSources(tx, prepared, input.casinoId, input.affiliateOfferId);
      const staticBlockers = [...extractionBlockers, ...validated.blockers];
      const persistablePrepared = prepared.filter((source) => source.mediaAssetId
        ? validated.assetsById.has(source.mediaAssetId)
        : Boolean(source.hostedCreativeId && validated.hostedById.has(source.hostedCreativeId)));
      await tx.mediaRevision.create({ data: {
        id: revisionId, casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId,
        batchId: input.batchId, idempotencyKey: input.idempotencyKey, payloadHash,
        status: "PREPARED", source: actor.source, summary: `MEDIA-GEO3 ${input.creativeSetName}`,
        createdBy: actor.actorId,
      } });
      if (persistablePrepared.length) await tx.mediaCreativeVariant.createMany({ data: persistablePrepared.map((source) => ({
        id: source.id, creativeSetId: creativeSet.id, revisionId,
        mediaAssetId: source.mediaAssetId, hostedCreativeId: source.hostedCreativeId,
        placement: source.placement, variant: source.variant, countryCode: source.countryCode,
        languageCode: source.languageCode, languageState: source.languageState,
        renderingMode: "CONTAIN", cropSafe: false, priority: source.priority,
        status: "PREPARED", availability: "AVAILABLE", sourceHash: source.sourceHash,
        altTextOverride: source.altText,
        metadata: { batchId: input.batchId, creativeId: source.creativeId },
      })) });

      const assignments: PlacementMediaAssignment[] = prepared.flatMap((source) => {
        const firstParty = source.mediaAssetId ? validated.assetsById.get(source.mediaAssetId) ?? null : null;
        const hosted = source.hostedCreativeId ? validated.hostedById.get(source.hostedCreativeId) ?? null : null;
        const asset = publicAsset(source, firstParty, hosted);
        if (!asset) return [];
        return [{
          id: source.id, mediaAssetId: source.mediaAssetId ?? source.hostedCreativeId!, placement: source.placement,
          variant: source.variant, countryCode: source.countryCode, languageCode: source.languageCode,
          languageState: source.languageState, renderingMode: "CONTAIN", sortOrder: 0, active: true,
          cropSafe: false, creativeSetId: creativeSet.id, creativeVariantId: source.id,
          mediaRevisionId: revisionId, affiliateOfferId: input.affiliateOfferId, casinoBonusId: offer.casinoBonusId,
          purpose: "PROMOTION", priority: source.priority, availability: "AVAILABLE", mediaAsset: asset,
          sourceHash: source.sourceHash,
        }];
      });
      const matrix = input.targets.flatMap((target) => target.devices.flatMap((device) => input.placements.map((placement) => {
        const authority = authorityForCountry(activations, target.countryCode, input.affiliateOfferId);
        const resolution = resolveCasinoMedia({
          casino: { id: casino.id, name: casino.title },
          offer: {
            id: offer.id, status: offer.status, startAt: offer.startAt, expiresAt: offer.expiresAt,
            bonusStatus: offer.casinoBonus?.status, bonusOfferStatus: offer.casinoBonus?.offerStatus,
            bonusStartsAt: offer.casinoBonus?.startsAt, bonusExpiresAt: offer.casinoBonus?.expiresAt,
          },
          placement: placement as MediaPlacementName,
          country: target.countryCode,
          language: target.languageCode,
          device,
          now: new Date(),
          commercialAuthority: authority,
          context: { casinoName: casino.title, casinoAssignments: [], affiliateOfferAssignments: assignments, legacyMediaAssets: [] },
        });
        const forcedBlocker = staticBlockers[0] ?? (target.languageState === "UNKNOWN" ? "UNKNOWN_PROMOTIONAL_LANGUAGE" : null);
        const status = forcedBlocker ? "BLOCKED" : resolution.status ?? "MISSING";
        return { target, device, placement, resolution, status, forcedBlocker };
      })));
      if (matrix.length) await tx.mediaPreflightEntry.createMany({ data: matrix.map((entry) => ({
        id: randomUUID(), revisionId, casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId,
        creativeSetId: entry.resolution.creativeSetId, creativeVariantId: entry.resolution.creativeVariantId,
        mediaAssetId: entry.resolution.asset?.hostedCreativeId
          ? null
          : entry.resolution.assignment?.mediaAssetId ?? null,
        hostedCreativeId: entry.resolution.asset?.hostedCreativeId ?? null,
        countryCode: entry.target.countryCode, languageCode: entry.target.languageCode,
        languageState: entry.target.languageState, device: entry.device, placement: entry.placement,
        resolutionSource: entry.resolution.source, status: entry.status,
        assetHash: entry.resolution.asset?.checksum ?? entry.resolution.assignment?.mediaAsset?.checksum ?? null,
        provider: entry.resolution.asset?.provider ?? null,
        externalCreativeId: entry.resolution.asset?.externalCreativeId ?? null,
        result: {
          resolvedPlacement: entry.resolution.resolvedPlacement,
          resolvedVariant: entry.resolution.resolvedVariant,
          targetingResolution: entry.resolution.targetingResolution,
          reason: entry.resolution.evidence?.reason,
          rejected: entry.resolution.evidence?.rejected,
        },
        blockerCode: entry.forcedBlocker ?? (["CONFLICT", "BLOCKED"].includes(entry.status) ? entry.resolution.evidence?.reason ?? entry.status : null),
      })) });
      const unsafe = staticBlockers.length > 0 || matrix.some((entry) => entry.status !== "READY");
      if (unsafe) {
        await tx.mediaCreativeVariant.updateMany({ where: { revisionId }, data: { status: "BLOCKED" } });
        await tx.mediaRevision.update({ where: { id: revisionId }, data: {
          status: "FAILED", failureCode: staticBlockers[0] ?? `PREFLIGHT_${matrix.find((entry) => entry.status !== "READY")?.status ?? "MISSING"}`,
          failureDetail: { blockers: staticBlockers, matrix: matrix.map((entry) => ({ country: entry.target.countryCode, language: entry.target.languageCode, device: entry.device, placement: entry.placement, status: entry.status })) },
        } });
        await tx.auditLog.create({ data: {
          actorId: actor.actorId,
          action: "media-production-revision-blocked",
          entityType: "media-revision",
          entityId: revisionId,
          summary: "Production media revision failed closed before activation",
          metadata: { source: actor.source, casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId, blockerCode: staticBlockers[0] ?? "PREFLIGHT_NOT_READY" },
        } });
        return;
      }
      if (!input.activate) {
        await tx.auditLog.create({ data: {
          actorId: actor.actorId,
          action: "media-production-revision-prepared",
          entityType: "media-revision",
          entityId: revisionId,
          summary: "Production media revision prepared without activation",
          metadata: { source: actor.source, casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId, preflightCells: matrix.length },
        } });
        return;
      }
      const previous = await tx.mediaRevision.findFirst({
        where: { casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId, status: "ACTIVE" },
        orderBy: { activatedAt: "desc" },
      });
      const activatedAt = new Date();
      if (previous) {
        await tx.mediaCreativeVariant.updateMany({ where: { revisionId: previous.id, status: "ACTIVE" }, data: { status: "INACTIVE", deactivatedAt: activatedAt } });
        await tx.mediaRevision.update({ where: { id: previous.id }, data: { status: "SUPERSEDED", supersededAt: activatedAt } });
      }
      await tx.mediaCreativeSet.update({ where: { id: creativeSet.id }, data: { status: "ACTIVE", updatedBy: actor.actorId } });
      await tx.mediaCreativeVariant.updateMany({ where: { revisionId, status: "PREPARED" }, data: { status: "ACTIVE", activatedAt } });
      await tx.mediaRevision.update({ where: { id: revisionId }, data: {
        status: "ACTIVE", previousRevisionId: previous?.id ?? null, activatedAt,
        verificationAt: activatedAt, verificationResult: { preflight: "READY", cells: matrix.length },
      } });
      await tx.auditLog.create({ data: {
        actorId: actor.actorId,
        action: "media-production-revision-activated",
        entityType: "media-revision",
        entityId: revisionId,
        summary: "Production media revision atomically activated",
        metadata: { source: actor.source, casinoId: input.casinoId, affiliateOfferId: input.affiliateOfferId, previousRevisionId: previous?.id ?? null, preflightCells: matrix.length },
      } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    } catch (error) {
      if (retryable(error)) {
        const raced = await prisma.mediaRevision.findFirst({
          where: { OR: [{ idempotencyKey: input.idempotencyKey }, { batchId: input.batchId, payloadHash }] },
        });
        if (raced?.payloadHash === payloadHash) return safeRevision(raced.id);
      }
      throw error;
    }
    return safeRevision(revisionId);
  }

  async rollback(input: MediaRollbackRevisionInput, actor: MediaOperationsActor) {
    const revision = await prisma.mediaRevision.findUnique({ where: { id: input.revisionId } });
    if (!revision) throw new NotFoundError("Media revision", { revisionId: input.revisionId });
    const rollbackHash = hash({ revisionId: input.revisionId, idempotencyKey: input.idempotencyKey, reason: input.reason });
    const expectedKeyHash = hash(input.idempotencyKey);
    if (revision.status === "ROLLED_BACK") {
      const result = record(revision.verificationResult);
      if (result.rollbackIdempotencyKeyHash !== expectedKeyHash || result.rollbackPayloadHash !== rollbackHash) {
        throw new ConflictError("Media rollback idempotency key was reused with a different payload", { revisionId: revision.id });
      }
      return safeRevision(revision.id);
    }
    if (revision.status !== "ACTIVE") throw new ConflictError("Only the active media revision can be rolled back", { status: revision.status });
    const rollbackOfferId = revision.affiliateOfferId;
    if (!rollbackOfferId) throw new ConflictError("Production rollback requires an exact AffiliateOffer revision");
    await serializable(() => prisma.$transaction(async (tx) => {
      await lockRevisionScope(tx, revision.casinoId, rollbackOfferId);
      const current = await tx.mediaRevision.findUnique({ where: { id: input.revisionId } });
      if (!current) throw new ConflictError("Media revision changed before rollback");
      if (current.status === "ROLLED_BACK") {
        const result = record(current.verificationResult);
        if (result.rollbackIdempotencyKeyHash === expectedKeyHash && result.rollbackPayloadHash === rollbackHash) return;
        throw new ConflictError("Media rollback idempotency key was reused with a different payload", { revisionId: current.id });
      }
      if (current.status !== "ACTIVE") throw new ConflictError("Media revision changed before rollback");
      let previousVariantIds: string[] = [];
      if (current.previousRevisionId) {
        const previous = await tx.mediaRevision.findUnique({ where: { id: current.previousRevisionId } });
        if (!previous || previous.status !== "SUPERSEDED"
          || previous.casinoId !== current.casinoId
          || previous.affiliateOfferId !== current.affiliateOfferId) {
          throw new ConflictError("Previous known-good media revision is not restorable");
        }
        const previousVariants = await tx.mediaCreativeVariant.findMany({
          where: { revisionId: previous.id, activatedAt: { not: null } },
          include: { mediaAsset: true, hostedCreative: true, creativeSet: true },
          orderBy: { id: "asc" },
        });
        if (!previousVariants.length) throw new ConflictError("Previous known-good media revision has no restorable variants");
        const unavailable = previousVariants.find((variant) => {
          if (variant.status !== "INACTIVE" || variant.availability !== "AVAILABLE"
            || variant.languageState === "UNKNOWN" || variant.creativeSet.status === "ARCHIVED"
            || variant.creativeSet.archivedAt || variant.creativeSet.casinoId !== current.casinoId
            || variant.creativeSet.affiliateOfferId !== current.affiliateOfferId) return true;
          if (variant.mediaAsset) return variant.mediaAsset.casinoId !== current.casinoId
            || variant.mediaAsset.status !== "ACTIVE" || Boolean(variant.mediaAsset.archivedAt)
            || variant.mediaAsset.checksum !== variant.sourceHash;
          if (variant.hostedCreative) return variant.hostedCreative.casinoId !== current.casinoId
            || variant.hostedCreative.affiliateOfferId !== current.affiliateOfferId
            || !variant.hostedCreative.active || Boolean(variant.hostedCreative.archivedAt)
            || variant.hostedCreative.validationState !== "VALIDATED"
            || variant.hostedCreative.destinationVerificationState !== "VERIFIED"
            || !variant.hostedCreative.redirectSlugId || !variant.hostedCreative.trackingLinkId
            || variant.hostedCreative.sourceChecksum !== variant.sourceHash;
          return true;
        });
        if (unavailable) throw new ConflictError("Previous known-good media revision source is no longer restorable", { creativeVariantId: unavailable.id });
        previousVariantIds = previousVariants.map((variant) => variant.id);
      }
      const now = new Date();
      await tx.mediaCreativeVariant.updateMany({ where: { revisionId: current.id, status: "ACTIVE" }, data: { status: "INACTIVE", deactivatedAt: now } });
      await tx.mediaRevision.update({ where: { id: current.id }, data: {
        status: "ROLLED_BACK", rolledBackAt: now, verificationAt: now,
        verificationResult: { rollbackIdempotencyKeyHash: hash(input.idempotencyKey), rollbackPayloadHash: rollbackHash, reason: input.reason, actorId: actor.actorId },
      } });
      if (current.previousRevisionId) {
        const restored = await tx.mediaCreativeVariant.updateMany({
          where: { id: { in: previousVariantIds }, status: "INACTIVE", availability: "AVAILABLE" },
          data: { status: "ACTIVE", deactivatedAt: null },
        });
        if (restored.count !== previousVariantIds.length) throw new ConflictError("Previous known-good media revision changed during rollback");
        await tx.mediaRevision.update({ where: { id: current.previousRevisionId }, data: { status: "ACTIVE", supersededAt: null, rolledBackAt: null } });
      }
      await tx.auditLog.create({ data: {
        actorId: actor.actorId,
        action: "media-production-revision-rolled-back",
        entityType: "media-revision",
        entityId: current.id,
        summary: "Production media revision rolled back to the known-good predecessor",
        metadata: { source: actor.source, previousRevisionId: current.previousRevisionId, reason: input.reason },
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    return safeRevision(input.revisionId);
  }

  async get(revisionId: string) {
    const revision = await safeRevision(revisionId);
    if (!revision) throw new NotFoundError("Media revision", { revisionId });
    return revision;
  }
}

export const mediaProductionRevisionService = new MediaProductionRevisionService();

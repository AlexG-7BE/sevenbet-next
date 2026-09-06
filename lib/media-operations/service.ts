import { createHash, randomUUID } from "node:crypto";

import type { MediaAssetTypeName, SupportedImageMime } from "@/lib/media/image-validation";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import {
  MEDIA_INGESTION_PLAN_VERSION,
  MEDIA_INGESTION_BATCH_VERSION,
  mediaAnalyzeAndPlanInputSchema,
  mediaApplyDraftPlanInputSchema,
  mediaGetPlanInputSchema,
  mediaIngestPartnerBatchInputSchema,
  mediaIngestPartnerSnippetInputSchema,
  mediaListRecentIngestionsInputSchema,
  normalizeMediaIngestionContext,
  type MediaIngestPartnerBatchItem,
  type MediaIngestionBatch,
  type MediaIngestionPlan,
  type MediaOperationsSource,
} from "@/lib/media-operations/contracts";
import { resolveMediaIngestionContext } from "@/lib/media-operations/context";
import { parsePartnerSnippet, persistedCreativeEvidence, safeUrlEvidence } from "@/lib/media-operations/parser";
import {
  PartnerHostedCreativeParseError,
  parsePartnerDescription,
  parsePartnerHostedCreative,
  type ParsedPartnerHostedCreative,
} from "@/lib/media-operations/partner-hosted";
import {
  resolvePartnerHostedCommercialBinding,
  storePartnerHostedCreative,
  verifyPartnerHostedDestination,
} from "@/lib/media-operations/partner-hosted-repository";
import { buildMediaPlacementPlan, scoreMediaPlacements, type ExistingMediaAssignment } from "@/lib/media-operations/planner";
import { fetchRemoteImage, RemoteImageFetchError } from "@/lib/media-operations/remote-image-fetch";
import { mediaIngestionRepository, type MediaIngestionRepository } from "@/lib/media-operations/repository";
import { analyzeMediaPlan } from "@/lib/media-operations/semantic-analysis";
import { prisma } from "@/lib/db/prisma";
import { commercialCreativePresentationFamily } from "@/lib/media/commercial-formats";
import { mediaService, type MediaService } from "@/lib/services/media.service";
import { NotFoundError, ServiceError, ValidationError } from "@/lib/services/service-error";

export type MediaOperationsActor = {
  actorId: string;
  source: MediaOperationsSource;
};

type PreparedIngestion = {
  input: {
    snippet: string;
    context: MediaIngestionPlan["requestedContext"];
    dryRun: boolean;
  };
  hosted: ParsedPartnerHostedCreative | null;
  hostedCreative: ReturnType<typeof hostedParserCreative> | null;
  parsed: ReturnType<typeof parsePartnerSnippet>;
  context: Awaited<ReturnType<typeof resolveMediaIngestionContext>>;
  hostedBinding: Awaited<ReturnType<typeof resolvePartnerHostedCommercialBinding>> | null;
  sourceItemIndex?: number;
};

async function mapWithConcurrency<T, U>(items: readonly T[], concurrency: number, run: (item: T, index: number) => Promise<U>) {
  const output = new Array<U>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await run(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function equivalentHost(left: string | null | undefined, right: string | null | undefined) {
  const canonical = (value: string) => value.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  return Boolean(left && right && canonical(left) === canonical(right));
}

function hostedParserCreative(hosted: ParsedPartnerHostedCreative) {
  const id = randomUUID();
  return {
    id,
    sourceKind: hosted.sourceMode === "PARTNER_HOSTED_EMBED" ? "HOSTED_EMBED" as const : "ANCHOR_IMAGE" as const,
    sourceMode: hosted.sourceMode,
    provider: hosted.provider,
    source: hosted.sourceEvidence,
    anchor: hosted.destinationEvidence,
    declaredWidth: hosted.declaredWidth,
    declaredHeight: hosted.declaredHeight,
    dimensionProvenance: hosted.dimensionProvenance,
    alt: hosted.altText,
    title: hosted.description.purpose,
    providerDomain: hosted.provider === "BANNERFLOW" ? "c.bannerflow.net" : "go.superflypartners.net",
    providerReference: `${hosted.provider}:${hosted.externalCreativeId}`,
    identifiers: Object.fromEntries(Object.entries({
      creative_id: hosted.externalCreativeId,
      affiliate_id: hosted.affiliateId,
      campaign_id: hosted.campaignId,
      adgroupid: hosted.adGroupId,
      did: hosted.did,
      media: hosted.mediaId,
      operator_program_id: hosted.operatorProgramId,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))),
    languageClues: hosted.description.languageCode ? [hosted.description.languageCode] : [],
    marketClues: hosted.description.countryCode ? [hosted.description.countryCode] : [],
    currencyClues: hosted.description.currencyCode ? [hosted.description.currencyCode] : [],
    warnings: hosted.description.contradiction ? [hosted.description.contradiction] : [],
    externalLabel: hosted.description.externalLabel,
    brandLabel: hosted.description.brandLabel ?? hosted.altText,
    purpose: hosted.description.purpose,
    countryCode: hosted.description.countryCode,
    languageCode: hosted.description.languageCode,
    languageState: hosted.description.languageState,
    currencyCode: hosted.description.currencyCode,
    sourceUrl: hosted.hostedImageUrl ?? `https://c.bannerflow.net${hosted.providerEmbedPath}`,
    anchorHref: hosted.destinationUrl,
    sourceItemIndex: undefined as number | undefined,
  };
}

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
  if (error instanceof ServiceError && error.details && typeof error.details === "object" && "reasonCode" in error.details
    && typeof error.details.reasonCode === "string") {
    return { code: error.details.reasonCode.slice(0, 100), message: error.message.slice(0, 500) };
  }
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

export function mediaBatchItemOutcome(input: {
  index: number;
  plan: MediaIngestionPlan | null;
  error: { code: string; message: string } | null;
  dryRun: boolean;
}): MediaIngestionBatch["items"][number] {
  const { index, plan, error, dryRun } = input;
  if (!plan || error) return {
    index,
    state: "REJECTED",
    planId: null,
    creativeIds: [],
    assetIds: [],
    hostedCreativeIds: [],
    reasonCodes: [error?.code ?? "MEDIA_INGESTION_FAILED"],
  };
  const reasons = [...new Set(plan.assets.flatMap((asset) => [asset.failureCode, asset.commercialRouteReason]).filter((value): value is string => Boolean(value)))];
  const allRejected = plan.assets.length === 0 || plan.assets.every((asset) => asset.state === "REJECTED");
  const review = dryRun || plan.assets.some((asset) => asset.state === "REVIEW_REQUIRED"
    || asset.mediaValidity === "REVIEW_REQUIRED"
    || !["MATCH", "NOT_APPLICABLE"].includes(asset.commercialRouteValidity ?? "NOT_APPLICABLE"));
  const reused = plan.assets.length > 0 && plan.assets.every((asset) => asset.duplicate || asset.state === "REUSED");
  return {
    index,
    state: allRejected ? "REJECTED" : review ? "REVIEW_REQUIRED" : reused ? "REUSED" : "INGESTED",
    planId: plan.id,
    creativeIds: plan.creatives.map((creative) => creative.id),
    assetIds: plan.assets.flatMap((asset) => asset.assetId ? [asset.assetId] : []),
    hostedCreativeIds: plan.assets.flatMap((asset) => asset.hostedCreativeId ? [asset.hostedCreativeId] : []),
    reasonCodes: dryRun && !reasons.length ? ["DRY_RUN_NO_WRITE"] : reasons,
  };
}

async function existingAssignments(plan: MediaIngestionPlan): Promise<ExistingMediaAssignment[]> {
  const casinoId = plan.resolvedContext.casinoId;
  const bonusId = plan.resolvedContext.bonusId;
  const offerId = plan.resolvedContext.affiliateOfferId;
  const [casino, bonus, offer, hostedCasino, hostedBonus, hostedOffer] = await Promise.all([
    casinoId ? prisma.casinoMediaAssignment.findMany({ where: { casinoId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } }) : [],
    bonusId ? prisma.casinoBonusMediaAssignment.findMany({ where: { casinoBonusId: bonusId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } }) : [],
    offerId ? prisma.affiliateOfferMediaAssignment.findMany({ where: { affiliateOfferId: offerId, active: true }, include: { mediaAsset: { select: { width: true, height: true } } } }) : [],
    casinoId ? prisma.casinoPartnerHostedCreativeAssignment.findMany({ where: { casinoId, active: true }, include: { creative: { select: { declaredWidth: true, declaredHeight: true, sourceMode: true } } } }) : [],
    bonusId ? prisma.casinoBonusPartnerHostedCreativeAssignment.findMany({ where: { casinoBonusId: bonusId, active: true }, include: { creative: { select: { declaredWidth: true, declaredHeight: true, sourceMode: true } } } }) : [],
    offerId ? prisma.affiliateOfferPartnerHostedCreativeAssignment.findMany({ where: { affiliateOfferId: offerId, active: true }, include: { creative: { select: { declaredWidth: true, declaredHeight: true, sourceMode: true } } } }) : [],
  ]);
  return [
    ...casino.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, sourceMode: "FIRST_PARTY_MEDIA" as const, languageState: item.languageCode ? "EXPLICIT" as const : "NEUTRAL" as const, subjectType: "CASINO" as const, subjectId: casinoId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: item.mediaAsset })),
    ...bonus.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, sourceMode: "FIRST_PARTY_MEDIA" as const, languageState: item.languageCode ? "EXPLICIT" as const : "NEUTRAL" as const, subjectType: "CASINO_BONUS" as const, subjectId: bonusId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: item.mediaAsset })),
    ...offer.map((item) => ({ id: item.id, mediaAssetId: item.mediaAssetId, sourceMode: "FIRST_PARTY_MEDIA" as const, languageState: item.languageCode ? "EXPLICIT" as const : "NEUTRAL" as const, subjectType: "AFFILIATE_OFFER" as const, subjectId: offerId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: item.mediaAsset })),
    ...hostedCasino.map((item) => ({ id: item.id, mediaAssetId: null, hostedCreativeId: item.creativeId, sourceMode: item.creative.sourceMode, languageState: item.languageState, subjectType: "CASINO" as const, subjectId: casinoId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: { width: item.creative.declaredWidth, height: item.creative.declaredHeight } })),
    ...hostedBonus.map((item) => ({ id: item.id, mediaAssetId: null, hostedCreativeId: item.creativeId, sourceMode: item.creative.sourceMode, languageState: item.languageState, subjectType: "CASINO_BONUS" as const, subjectId: bonusId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: { width: item.creative.declaredWidth, height: item.creative.declaredHeight } })),
    ...hostedOffer.map((item) => ({ id: item.id, mediaAssetId: null, hostedCreativeId: item.creativeId, sourceMode: item.creative.sourceMode, languageState: item.languageState, subjectType: "AFFILIATE_OFFER" as const, subjectId: offerId!, placement: item.placement, variant: item.variant, countryCode: item.countryCode, languageCode: item.languageCode, mediaAsset: { width: item.creative.declaredWidth, height: item.creative.declaredHeight } })),
  ];
}

export class MediaOperationsService {
  constructor(
    private readonly repository: MediaIngestionRepository = mediaIngestionRepository,
    private readonly managedMedia: MediaService = mediaService,
  ) {}

  async ingest(rawInput: unknown, actor: MediaOperationsActor) {
    const parsedInput = mediaIngestPartnerSnippetInputSchema.parse(rawInput);
    const prepared = await this.prepareIngestion({
      ...parsedInput,
      context: parsedInput.context ?? {},
    });
    return this.ingestPrepared(prepared, actor);
  }

  private async prepareIngestion(input: {
    snippet: string;
    context: MediaIngestionPlan["requestedContext"];
    dryRun: boolean;
    metadata?: Partial<MediaIngestPartnerBatchItem>;
    sourceItemIndex?: number;
  }): Promise<PreparedIngestion> {
    if (new TextEncoder().encode(input.snippet).byteLength > 128 * 1024) {
      throw new ValidationError("Partner snippet exceeds 128 KiB");
    }
    const requestedContext = normalizeMediaIngestionContext(input.context ?? {});
    const normalizedInput = { snippet: input.snippet, context: requestedContext, dryRun: input.dryRun };
    let hosted: ParsedPartnerHostedCreative | null = null;
    try {
      hosted = parsePartnerHostedCreative(input.snippet, input.metadata);
    } catch (error) {
      if (error instanceof PartnerHostedCreativeParseError) {
        throw new ValidationError(`${error.code}: ${error.message}`, { reasonCode: error.code });
      }
      throw error;
    }
    const hostedCreative = hosted ? hostedParserCreative(hosted) : null;
    const parsed = hostedCreative ? {
      snippetChecksum: sha256(normalizedInput.snippet),
      creatives: [hostedCreative],
      unsupportedElements: [] as Array<"SCRIPT" | "IFRAME">,
      warnings: hosted?.description.contradiction ? [hosted.description.contradiction] : [],
    } : parsePartnerSnippet(normalizedInput.snippet);
    const metadataDescription = input.metadata ? parsePartnerDescription(null, input.metadata) : null;
    for (const creative of parsed.creatives) {
      creative.sourceItemIndex = input.sourceItemIndex;
      if (input.metadata?.providerReference) creative.providerReference = input.metadata.providerReference;
      if (!hosted && metadataDescription) {
        if (metadataDescription.width && metadataDescription.height) {
          creative.declaredWidth = metadataDescription.width;
          creative.declaredHeight = metadataDescription.height;
          creative.dimensionProvenance = metadataDescription.dimensionProvenance;
        }
        creative.title = input.metadata?.title?.slice(0, 300) ?? creative.title;
        creative.externalLabel = metadataDescription.externalLabel;
        creative.brandLabel = metadataDescription.brandLabel;
        creative.purpose = metadataDescription.purpose;
        creative.countryCode = metadataDescription.countryCode;
        creative.languageCode = metadataDescription.languageCode;
        creative.languageState = metadataDescription.languageState;
        creative.currencyCode = metadataDescription.currencyCode;
        creative.marketClues = metadataDescription.countryCode ? [metadataDescription.countryCode] : creative.marketClues;
        creative.languageClues = metadataDescription.languageCode ? [metadataDescription.languageCode] : creative.languageClues;
        creative.currencyClues = metadataDescription.currencyCode ? [metadataDescription.currencyCode] : creative.currencyClues;
      }
    }
    const context = await resolveMediaIngestionContext(requestedContext, parsed.creatives);
    const hostedBinding = hosted
      ? await resolvePartnerHostedCommercialBinding(hosted, context)
      : null;
    if (hostedBinding?.affiliateOfferId && !context.persisted.affiliateOfferId) {
      context.persisted.affiliateOfferId = hostedBinding.affiliateOfferId;
    }
    if (hostedBinding?.relationshipState === "MATCH") context.persisted.trackingDestinationState = "MATCH";
    return { input: normalizedInput, hosted, hostedCreative, parsed, context, hostedBinding, sourceItemIndex: input.sourceItemIndex };
  }

  private async ingestPrepared(
    prepared: PreparedIngestion,
    actor: MediaOperationsActor,
    options: { persist?: boolean; planId?: string; batchId?: string; batchItemIndexes?: number[] } = {},
  ) {
    const { input, hosted, hostedCreative, parsed, context, hostedBinding } = prepared;
    const timestamp = new Date().toISOString();
    const plan: MediaIngestionPlan = {
      version: MEDIA_INGESTION_PLAN_VERSION,
      id: options.planId ?? randomUUID(),
      snippetChecksum: parsed.snippetChecksum,
      state: "INGESTING",
      dryRun: input.dryRun,
      actorId: actor.actorId,
      source: actor.source,
      providerReference: input.context.partnerIdentifier ?? parsed.creatives.find((item) => item.providerReference)?.providerReference ?? parsed.creatives[0]?.providerDomain ?? null,
      ...(options.batchId ? { batchId: options.batchId } : {}),
      ...(options.batchItemIndexes ? { batchItemIndexes: options.batchItemIndexes } : {}),
      requestedContext: input.context,
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
        previous: null,
        result: {
          creativesDetected: parsed.creatives.length,
          dryRun: input.dryRun,
          targetCountryCodes: input.context.targetCountryCodes ?? [],
          creativeLanguage: input.context.creativeLanguage ?? null,
          creativeLanguageState: input.context.creativeLanguageState
            ?? (Object.prototype.hasOwnProperty.call(input.context, "creativeLanguage") ? "NEUTRAL" : "UNKNOWN"),
        },
        actorId: actor.actorId, source: actor.source, timestamp,
      }],
      createdAt: timestamp,
      updatedAt: timestamp,
      analyzedAt: null,
    };
    if (options.persist !== false) {
      await this.repository.savePlan(plan, { operation: "INGEST_START", result: { creativesDetected: plan.creatives.length, rawSnippetPersisted: false } });
    }

    for (let index = 0; index < parsed.creatives.length; index += 1) {
      const creative = parsed.creatives[index];
      try {
        if (hosted && hostedCreative && creative.id === hostedCreative.id) {
          if (input.dryRun || context.persisted.state !== "RESOLVED" || !context.persisted.casinoId || !hostedBinding) {
            const failureCode = context.persisted.state === "RESOLVED" ? hostedBinding?.reason ?? null : "CONTEXT_REVIEW_REQUIRED";
            plan.assets.push({
              creativeId: creative.id,
              state: input.dryRun ? "DRY_RUN_VALID" : "REVIEW_REQUIRED",
              sourceMode: hosted.sourceMode,
              provider: hosted.provider,
              assetId: null,
              hostedCreativeId: null,
              firstPartyUrl: null,
              renderUrl: hosted.hostedImageUrl,
              checksum: hosted.sourceChecksum,
              mimeType: null,
              width: hosted.declaredWidth,
              height: hosted.declaredHeight,
              animated: hosted.sourceMode === "PARTNER_HOSTED_EMBED" ? true : null,
              formatFamily: physicalFamily(hosted.declaredWidth, hosted.declaredHeight),
              dimensionProvenance: [hosted.dimensionProvenance],
              dimensionsMatch: null,
              mediaValidity: hosted.description.contradiction ? "REVIEW_REQUIRED" : "VALID",
              commercialRouteValidity: context.persisted.state === "RESOLVED"
                ? hostedBinding?.reason === "CANONICAL_COMMERCIAL_ROUTE_REQUIRED" ? "MISSING" : "REVIEW_REQUIRED"
                : "REVIEW_REQUIRED",
              commercialRouteReason: failureCode,
              resolvedSource: hosted.sourceEvidence,
              redirectCount: null,
              duplicate: false,
              failureCode,
              failureMessage: failureCode ? "A resolved casino and canonical commercial relationship are required before this hosted creative can become publishable." : null,
            });
            continue;
          }
          const existing = await prisma.partnerHostedCreative.findUnique({
            where: { providerIdentityKey: hosted.providerIdentityKey },
            select: {
              id: true,
              casinoId: true,
              affiliateOfferId: true,
              redirectSlugId: true,
              trackingLinkId: true,
              destinationUrlHash: true,
              destinationVerificationState: true,
              expectedOperatorHost: true,
              verifiedFinalHost: true,
            },
          });
          const existingVerificationMatchesBinding = existing?.casinoId === context.persisted.casinoId
            && existing.affiliateOfferId === hostedBinding.affiliateOfferId
            && existing.redirectSlugId === hostedBinding.redirectSlugId
            && existing.trackingLinkId === hostedBinding.trackingLinkId
            && existing.expectedOperatorHost === hostedBinding.expectedOperatorHost
            && existing.destinationUrlHash === hosted.destinationUrlHash
            && existing.destinationVerificationState === "VERIFIED"
            && (hostedBinding.matchAuthority === "EXACT_GOVERNED_ROUTE"
              || equivalentHost(existing.verifiedFinalHost, hostedBinding.expectedOperatorHost));
          const verification = hostedBinding.relationshipState === "MATCH"
            ? existingVerificationMatchesBinding
              ? hostedBinding.matchAuthority === "EXACT_GOVERNED_ROUTE"
                ? null
                : { status: "HEALTHY" as const, reason: "EXISTING_CHECKSUM_BOUND_VERIFICATION", method: "HEAD" as const, statusCode: 200, durationMs: 0, redirectCount: 0, finalHost: existing.verifiedFinalHost }
              : await verifyPartnerHostedDestination(hosted, hostedBinding)
            : null;
          const stored = await storePartnerHostedCreative({ parsed: hosted, context, binding: hostedBinding, verification, actor });
          const failureCode = stored.record.validationState === "REVIEW_REQUIRED" ? stored.record.validationReason : null;
          plan.assets.push({
            creativeId: creative.id,
            state: failureCode ? "REVIEW_REQUIRED" : existing ? "REUSED" : "HOSTED_INGESTED",
            sourceMode: hosted.sourceMode,
            provider: hosted.provider,
            assetId: null,
            hostedCreativeId: stored.record.id,
            firstPartyUrl: null,
            renderUrl: hosted.sourceMode === "PARTNER_HOSTED_IMAGE"
              ? hosted.hostedImageUrl
              : `/partner-creatives/${stored.record.id}/frame`,
            checksum: hosted.sourceChecksum,
            mimeType: null,
            width: hosted.declaredWidth,
            height: hosted.declaredHeight,
            animated: hosted.sourceMode === "PARTNER_HOSTED_EMBED" ? true : null,
              formatFamily: physicalFamily(hosted.declaredWidth, hosted.declaredHeight),
              dimensionProvenance: [hosted.dimensionProvenance],
              dimensionsMatch: null,
              mediaValidity: stored.mediaValidity,
              commercialRouteValidity: stored.commercialRouteValidity,
              commercialRouteReason: stored.commercialRouteReason,
              resolvedSource: hosted.sourceEvidence,
            redirectCount: verification?.redirectCount ?? null,
            duplicate: Boolean(existing),
            failureCode,
              failureMessage: failureCode ? `Hosted creative media requires review: ${failureCode}.` : null,
            });
            if (failureCode) addWarning(plan, failureCode);
          if (stored.commercialRouteReason) addWarning(plan, stored.commercialRouteReason);
          continue;
        }
        const fetched = await fetchRemoteImage(creative.sourceUrl);
        if (input.dryRun || context.persisted.state !== "RESOLVED" || !context.persisted.casinoId) {
          const dimensionsMatch = creative.declaredWidth && creative.declaredHeight
            ? creative.declaredWidth === fetched.width && creative.declaredHeight === fetched.height
            : null;
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
            dimensionProvenance: [...(creative.dimensionProvenance ? [creative.dimensionProvenance] : []), "PIXEL_VALIDATED"],
            dimensionsMatch,
            mediaValidity: dimensionsMatch === false ? "REVIEW_REQUIRED" : "VALID",
            commercialRouteValidity: "NOT_APPLICABLE",
            commercialRouteReason: null,
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
            dimensionProvenance: creative.dimensionProvenance,
            decodedDimensions: { width: fetched.width, height: fetched.height },
            declaredDimensionsMatchPixels: creative.declaredWidth && creative.declaredHeight
              ? creative.declaredWidth === fetched.width && creative.declaredHeight === fetched.height
              : null,
            languageClues: creative.languageClues,
            marketClues: creative.marketClues,
            currencyClues: creative.currencyClues,
            targetCountryCodes: input.context.targetCountryCodes ?? [],
            creativeLanguage: input.context.creativeLanguage ?? null,
            creativeLanguageState: input.context.creativeLanguageState
              ?? (Object.prototype.hasOwnProperty.call(input.context, "creativeLanguage") ? "NEUTRAL" : "UNKNOWN"),
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
            result: {
              sourceUrlHash: creative.source.urlHash,
              firstPartyStorage: true,
              targetCountryCodes: input.context.targetCountryCodes ?? [],
              creativeLanguage: input.context.creativeLanguage ?? null,
            },
            timestamp: new Date().toISOString(),
          },
          dedupeScope: "GLOBAL",
          actorId: actor.actorId,
        });
        const duplicateOwnerConflict = uploaded.duplicate && uploaded.record.casinoId !== context.persisted.casinoId;
        const dimensionsMatch = creative.declaredWidth && creative.declaredHeight
          ? creative.declaredWidth === fetched.width && creative.declaredHeight === fetched.height
          : null;
        const dimensionMismatch = dimensionsMatch === false;
        plan.assets.push({
          creativeId: creative.id,
          state: duplicateOwnerConflict || dimensionMismatch ? "REVIEW_REQUIRED" : uploaded.duplicate ? "REUSED" : "INGESTED",
          assetId: uploaded.record.id,
          firstPartyUrl: uploaded.record.publicUrl,
          checksum: uploaded.record.checksum,
          mimeType: uploaded.record.mimeType as SupportedImageMime,
          width: uploaded.record.width,
          height: uploaded.record.height,
          animated: fetched.animated,
          formatFamily: physicalFamily(uploaded.record.width, uploaded.record.height),
          dimensionProvenance: [...(creative.dimensionProvenance ? [creative.dimensionProvenance] : []), "PIXEL_VALIDATED"],
          dimensionsMatch,
          mediaValidity: duplicateOwnerConflict || dimensionMismatch ? "REVIEW_REQUIRED" : "VALID",
          commercialRouteValidity: "NOT_APPLICABLE",
          commercialRouteReason: null,
          resolvedSource: safeUrlEvidence(fetched.finalUrl),
          redirectCount: fetched.redirects.length,
          duplicate: uploaded.duplicate,
          failureCode: duplicateOwnerConflict ? "DUPLICATE_OWNER_REVIEW_REQUIRED" : dimensionMismatch ? "DECLARED_DIMENSIONS_MISMATCH" : null,
          failureMessage: duplicateOwnerConflict
            ? "Identical bytes already belong to a different Casino. The existing MediaAsset was retained without creating a duplicate, but cannot be assigned under this context automatically."
            : dimensionMismatch ? `Declared ${creative.declaredWidth}×${creative.declaredHeight} dimensions do not match decoded ${fetched.width}×${fetched.height} pixels.` : null,
        });
        if (duplicateOwnerConflict) addWarning(plan, "DUPLICATE_OWNER_REVIEW_REQUIRED");
        if (dimensionMismatch) addWarning(plan, "DECLARED_DIMENSIONS_MISMATCH");
      } catch (error) {
        if (isTransientDatabaseAvailabilityError(error)) throw error;
        const rejected = failure(error);
        plan.assets.push({
          creativeId: creative.id, state: "REJECTED", assetId: null, firstPartyUrl: null,
          checksum: null, mimeType: null, width: null, height: null, animated: null, duplicate: false,
          formatFamily: null, resolvedSource: null, redirectCount: null,
          dimensionProvenance: creative.dimensionProvenance ? [creative.dimensionProvenance] : [],
          dimensionsMatch: null, mediaValidity: "INVALID", commercialRouteValidity: "NOT_APPLICABLE", commercialRouteReason: null,
          failureCode: rejected.code, failureMessage: rejected.message,
        });
        addWarning(plan, `${rejected.code}: ${rejected.message}`);
      }
    }
    const stored = plan.assets.filter((asset) => asset.assetId || asset.hostedCreativeId).length;
    const rejected = plan.assets.filter((asset) => asset.state === "REJECTED").length;
    const reviewRequired = plan.assets.some((asset) => asset.state === "REVIEW_REQUIRED"
      || asset.mediaValidity === "REVIEW_REQUIRED"
      || !["MATCH", "NOT_APPLICABLE"].includes(asset.commercialRouteValidity ?? "NOT_APPLICABLE"));
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
    if (options.persist !== false) {
      await this.repository.savePlan(plan, {
        operation: "INGEST_COMPLETE",
        previous: { state: "INGESTING" },
        result: { state: plan.state, stored, rejected, duplicatesReused: plan.assets.filter((asset) => asset.duplicate).length },
      });
    }
    return plan;
  }

  async ingestBatch(rawInput: unknown, actor: MediaOperationsActor) {
    const input = mediaIngestPartnerBatchInputSchema.parse(rawInput);
    const batchId = randomUUID();
    const batchChecksum = sha256(JSON.stringify(input.items.map((item) => ({
      snippet: item.snippet,
      context: item.context ?? {},
      declaredWidth: item.declaredWidth ?? null,
      declaredHeight: item.declaredHeight ?? null,
      dimensionProvenance: item.dimensionProvenance,
      title: item.title ?? null,
      description: item.description ?? null,
      providerReference: item.providerReference ?? null,
    }))));
    const preparedResults: Array<{
      index: number;
      item: MediaIngestPartnerBatchItem;
      prepared: PreparedIngestion | null;
      error: ReturnType<typeof failure> | null;
    }> = await mapWithConcurrency(input.items, 4, async (item, index) => {
      try {
        const prepared = await this.prepareIngestion({
          snippet: item.snippet,
          context: item.context ?? {},
          dryRun: input.dryRun,
          metadata: item,
          sourceItemIndex: index,
        });
        return { index, item, prepared, error: null as ReturnType<typeof failure> | null };
      } catch (error) {
        if (isTransientDatabaseAvailabilityError(error)) throw error;
        return { index, item, prepared: null, error: failure(error) };
      }
    });

    let acceptedCreatives = 0;
    for (const result of preparedResults) {
      if (!result.prepared) continue;
      if (acceptedCreatives + result.prepared.parsed.creatives.length > 100) {
        result.error = { code: "BATCH_CREATIVE_LIMIT_EXCEEDED", message: "A Media Operations batch supports at most 100 parsed creatives." };
        result.prepared = null;
      } else acceptedCreatives += result.prepared.parsed.creatives.length;
    }

    const groups = new Map<string, Array<(typeof preparedResults)[number]>>();
    for (const result of preparedResults) {
      if (!result.prepared) continue;
      const context = result.prepared.context.persisted;
      const requested = result.prepared.input.context;
      const key = context.state === "RESOLVED" && context.casinoId
        ? JSON.stringify({
          casinoId: context.casinoId,
          bonusId: context.bonusId,
          affiliateOfferId: context.affiliateOfferId,
          opportunityId: context.opportunityId,
          targetCountryCodes: requested.targetCountryCodes ?? [],
          creativeLanguage: requested.creativeLanguage ?? null,
          creativeLanguageState: requested.creativeLanguageState ?? "UNKNOWN",
        })
        : `UNRESOLVED:${result.index}`;
      const group = groups.get(key) ?? [];
      group.push(result);
      groups.set(key, group);
    }

    const fragments = new Map<number, MediaIngestionPlan>();
    const planIds: string[] = [];
    for (const group of groups.values()) {
      const planId = randomUUID();
      const results = await mapWithConcurrency(group, 4, async (entry) => {
        try {
          const plan = await this.ingestPrepared(entry.prepared!, actor, {
            persist: false,
            planId,
            batchId,
            batchItemIndexes: [entry.index],
          });
          fragments.set(entry.index, plan);
          return plan;
        } catch (error) {
          if (isTransientDatabaseAvailabilityError(error)) throw error;
          entry.error = failure(error);
          entry.prepared = null;
          return null;
        }
      });
      const completed = results.filter((plan): plan is MediaIngestionPlan => Boolean(plan));
      if (!completed.length) continue;
      const first = completed[0];
      const assets = completed.flatMap((plan) => plan.assets);
      const creatives = completed.flatMap((plan) => plan.creatives);
      const stored = assets.filter((asset) => asset.assetId || asset.hostedCreativeId).length;
      const rejected = assets.filter((asset) => asset.state === "REJECTED").length;
      const reviewRequired = assets.some((asset) => asset.state === "REVIEW_REQUIRED"
        || asset.mediaValidity === "REVIEW_REQUIRED"
        || !["MATCH", "NOT_APPLICABLE"].includes(asset.commercialRouteValidity ?? "NOT_APPLICABLE"));
      const merged: MediaIngestionPlan = {
        ...first,
        id: planId,
        batchId,
        batchItemIndexes: completed.flatMap((plan) => plan.batchItemIndexes ?? []).filter((value, index, values) => values.indexOf(value) === index).sort((left, right) => left - right),
        snippetChecksum: sha256(completed.map((plan) => plan.snippetChecksum).join(":")),
        providerReference: [...new Set(completed.map((plan) => plan.providerReference).filter(Boolean))].length === 1
          ? completed.find((plan) => plan.providerReference)?.providerReference ?? null
          : `BATCH:${batchId}`,
        creatives,
        unsupportedElements: [...new Set(completed.flatMap((plan) => plan.unsupportedElements))],
        assets,
        semanticResults: [],
        recommendations: [],
        warnings: [...new Set(completed.flatMap((plan) => plan.warnings))].slice(0, 100),
        operations: completed.flatMap((plan) => plan.operations).slice(-300),
        state: mediaIngestionCompletionState({
          stored,
          rejected,
          reviewRequired,
          dryRun: input.dryRun,
          contextState: first.resolvedContext.state,
          creativeCount: creatives.length,
          unsupportedCount: completed.reduce((sum, plan) => sum + plan.unsupportedElements.length, 0),
        }),
        updatedAt: new Date().toISOString(),
      };
      await this.repository.savePlan(merged, {
        operation: "BULK_INGEST_COMPLETE",
        previous: null,
        result: {
          batchId,
          itemIndexes: merged.batchItemIndexes,
          state: merged.state,
          creativesDetected: merged.creatives.length,
          stored,
          rejected,
          duplicatesReused: merged.assets.filter((asset) => asset.duplicate).length,
          boundedConcurrency: 4,
        },
      });
      planIds.push(planId);
    }

    const outcomes: MediaIngestionBatch["items"] = preparedResults.map((result) => mediaBatchItemOutcome({
      index: result.index,
      plan: fragments.get(result.index) ?? null,
      error: result.error,
      dryRun: input.dryRun,
    }));
    const counts = {
      total: outcomes.length,
      ingested: outcomes.filter((item) => item.state === "INGESTED").length,
      reused: outcomes.filter((item) => item.state === "REUSED").length,
      reviewRequired: outcomes.filter((item) => item.state === "REVIEW_REQUIRED").length,
      rejected: outcomes.filter((item) => item.state === "REJECTED").length,
    };
    const timestamp = new Date().toISOString();
    const batch: MediaIngestionBatch = {
      version: MEDIA_INGESTION_BATCH_VERSION,
      id: batchId,
      batchChecksum,
      state: planIds.length === 0 ? "FAILED" : counts.reviewRequired || counts.rejected ? "REVIEW_REQUIRED" : "INGESTED",
      dryRun: input.dryRun,
      actorId: actor.actorId,
      source: actor.source,
      planIds,
      items: outcomes,
      counts,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.repository.saveBatch(batch, {
      operation: "BULK_INGEST",
      result: { state: batch.state, counts, planCount: planIds.length, boundedConcurrency: 4, rawSnippetsPersisted: false },
    });
    return batch;
  }

  async analyze(rawInput: unknown, actor: MediaOperationsActor): Promise<MediaIngestionPlan | { batch: MediaIngestionBatch; plans: MediaIngestionPlan[] }> {
    const input = mediaAnalyzeAndPlanInputSchema.parse(rawInput);
    if ("batchId" in input) {
      const batch = await this.repository.getBatch(input.batchId);
      if (!batch) throw new NotFoundError("Media ingestion batch", { batchId: input.batchId });
      const plans = await mapWithConcurrency(batch.planIds, 3, (planId) => this.analyzePlan({ planId, useSemanticAnalysis: input.useSemanticAnalysis }, actor));
      batch.state = "ANALYZED";
      batch.updatedAt = new Date().toISOString();
      await this.repository.saveBatch(batch, { operation: "BULK_ANALYZE", result: { state: batch.state, plans: plans.length, recommendations: plans.reduce((sum, plan) => sum + plan.recommendations.length, 0) } });
      return { batch, plans };
    }
    return this.analyzePlan(input, actor);
  }

  private async analyzePlan(
    input: { planId: string; useSemanticAnalysis: boolean },
    actor: MediaOperationsActor,
  ): Promise<MediaIngestionPlan> {
    const plan = await this.repository.getPlan(input.planId);
    if (!plan) throw new NotFoundError("Media ingestion plan", { planId: input.planId });
    if (plan.state === "INGESTING") throw new ValidationError("Media ingestion has not completed");
    const previousState = plan.state;
    const hostedCreativeIds = new Set(plan.assets.filter((asset) => asset.sourceMode && asset.sourceMode !== "FIRST_PARTY_MEDIA").map((asset) => asset.creativeId));
    const hostedSemanticResults = plan.creatives.filter((creative) => hostedCreativeIds.has(creative.id)).map((creative) => ({
      creativeId: creative.id,
      state: "COMPLETED" as const,
      provider: creative.provider ?? null,
      model: "deterministic-partner-metadata-v1",
      brandName: creative.brandLabel ?? null,
      assetPurpose: creative.purpose ? "PROMO" as const : "UNKNOWN" as const,
      language: creative.languageCode ?? null,
      market: creative.countryCode ?? null,
      currency: creative.currencyCode ?? null,
      offerText: creative.purpose ?? null,
      offerAmount: null,
      offerPercentage: null,
      freeSpins: null,
      promoCode: null,
      callToActionText: null,
      containsPromotionalText: Boolean(creative.purpose),
      containsFinePrint: false,
      containsResponsibleGamblingText: false,
      cropSafety: "UNKNOWN" as const,
      textReadability: "UNKNOWN" as const,
      likelyMarkets: creative.countryCode ? [creative.countryCode] : [],
      complianceConcerns: [],
      confidence: 1,
      explanation: "Deterministic Description/provider metadata only; creative pixels were not inspected.",
    }));
    const firstPartyCreativeIds = new Set(plan.creatives.filter((creative) => !hostedCreativeIds.has(creative.id)).map((creative) => creative.id));
    const firstPartySemanticResults = firstPartyCreativeIds.size
      ? await analyzeMediaPlan({
        ...plan,
        creatives: plan.creatives.filter((creative) => firstPartyCreativeIds.has(creative.id)),
        assets: plan.assets.filter((asset) => firstPartyCreativeIds.has(asset.creativeId)),
      }, input.useSemanticAnalysis)
      : [];
    const semanticByCreative = new Map([...hostedSemanticResults, ...firstPartySemanticResults].map((result) => [result.creativeId, result]));
    plan.semanticResults = plan.creatives.flatMap((creative) => {
      const result = semanticByCreative.get(creative.id);
      return result ? [result] : [];
    });
    for (const asset of plan.assets) {
      if (asset.width && asset.height) asset.placementScores = scoreMediaPlacements(asset.width, asset.height);
    }
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
    if (firstPartyCreativeIds.size && firstPartySemanticResults.some((result) => result.state !== "COMPLETED")) addWarning(plan, "NEEDS_VISUAL_REVIEW");
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
    if ("batchId" in input) {
      const batch = await this.repository.getBatch(input.batchId);
      if (!batch) throw new NotFoundError("Media ingestion batch", { batchId: input.batchId });
      const results = [];
      const previousBatchState = batch.state;
      for (const planId of batch.planIds) {
        results.push(input.mode === "ROLLBACK"
          ? await this.repository.rollbackDraftPlan({ planId, recommendationIds: input.recommendationIds, actorId: actor.actorId, source: actor.source })
          : await this.repository.applyDraftPlan({ planId, recommendationIds: input.recommendationIds, replaceExisting: input.replaceExisting, actorId: actor.actorId, source: actor.source }));
      }
      const plans = results.map((result) => result.plan);
      batch.state = input.mode === "ROLLBACK"
        ? results.some((result) => "rolledBack" in result && result.rolledBack > 0)
          ? plans.some((plan) => plan.state === "PARTIALLY_APPLIED") ? "PARTIALLY_APPLIED" : "ROLLED_BACK"
          : previousBatchState
        : plans.length > 0 && plans.every((plan) => plan.state === "APPLIED")
          ? "APPLIED"
          : results.some((result) => "applied" in result && result.applied > 0) ? "PARTIALLY_APPLIED" : previousBatchState;
      batch.updatedAt = new Date().toISOString();
      await this.repository.saveBatch(batch, { operation: input.mode === "ROLLBACK" ? "BULK_ROLLBACK" : "BULK_APPLY", result: { state: batch.state, plans: plans.length } });
      return { batch, results };
    }
    return input.mode === "ROLLBACK"
      ? this.repository.rollbackDraftPlan({ planId: input.planId, recommendationIds: input.recommendationIds, actorId: actor.actorId, source: actor.source })
      : this.repository.applyDraftPlan({ planId: input.planId, recommendationIds: input.recommendationIds, replaceExisting: input.replaceExisting, actorId: actor.actorId, source: actor.source });
  }

  async get(rawInput: unknown) {
    const input = mediaGetPlanInputSchema.parse(rawInput);
    if ("batchId" in input) {
      const batch = await this.repository.getBatch(input.batchId);
      if (!batch) throw new NotFoundError("Media ingestion batch", { batchId: input.batchId });
      const plans = await mapWithConcurrency(batch.planIds, 4, async (planId) => {
        const plan = await this.repository.getPlan(planId);
        if (!plan) throw new NotFoundError("Media ingestion plan", { planId });
        return plan;
      });
      return { batch, plans };
    }
    const plan = await this.repository.getPlan(input.planId);
    if (!plan) throw new NotFoundError("Media ingestion plan", { planId: input.planId });
    return plan;
  }

  async listRecent(rawInput: unknown) {
    const input = mediaListRecentIngestionsInputSchema.parse(rawInput ?? {});
    return this.repository.listRecent(input.limit);
  }

  async listRecentBatches(rawInput: unknown) {
    const input = mediaListRecentIngestionsInputSchema.parse(rawInput ?? {});
    return this.repository.listRecentBatches(input.limit);
  }

  async references() {
    return prisma.casino.findMany({
      where: { archivedAt: null },
      select: {
        id: true, slug: true, title: true,
        casinoBonuses: { select: { id: true, title: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ title: "asc" }, { id: "asc" }],
      take: 500,
    });
  }
}

export const mediaOperationsService = new MediaOperationsService();

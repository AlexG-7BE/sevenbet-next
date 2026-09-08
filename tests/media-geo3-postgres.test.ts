import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { assertMediaGeo3Schema } from "../lib/db/media-geo3-0033-release";
import {
  MEDIA_INGESTION_BATCH_KEY_PREFIX,
  MEDIA_INGESTION_PLAN_KEY_PREFIX,
  mediaIngestionBatchSchema,
  mediaIngestionPlanSchema,
} from "../lib/media-operations/contracts";
import { mediaIngestionRepository } from "../lib/media-operations/repository";
import { mediaOperationsService } from "../lib/media-operations/service";

const ID = {
  actor: "84000000-0000-4000-8000-000000000001",
  casino: "84000000-0000-4000-8000-000000000002",
  profile: "84000000-0000-4000-8000-000000000003",
  bonus: "84000000-0000-4000-8000-000000000004",
  network: "84000000-0000-4000-8000-000000000005",
  program: "84000000-0000-4000-8000-000000000006",
  offer: "84000000-0000-4000-8000-000000000007",
  tracking: "84000000-0000-4000-8000-000000000008",
  redirect: "84000000-0000-4000-8000-000000000009",
  activation: "84000000-0000-4000-8000-000000000010",
  firstAsset: "84000000-0000-4000-8000-000000000011",
  failedAsset: "84000000-0000-4000-8000-000000000012",
  secondAsset: "84000000-0000-4000-8000-000000000013",
};
const ACTOR = { actorId: ID.actor, source: "SYSTEM" as const };
const NOW = "2030-06-01T00:00:00.000Z";

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

test("Production schema verifier accepts every physical MEDIA-GEO3 index", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  try {
    await assertMediaGeo3Schema(prisma);
  } finally {
    await prisma.$disconnect();
  }
});

async function cleanup(prisma: PrismaClient) {
  await prisma.mediaRevision.updateMany({ where: { casinoId: ID.casino }, data: { previousRevisionId: null } });
  await prisma.mediaRevision.deleteMany({ where: { casinoId: ID.casino } });
  await prisma.mediaCreativeSet.deleteMany({ where: { casinoId: ID.casino } });
  await prisma.siteSetting.deleteMany({ where: { OR: [
    { key: { startsWith: MEDIA_INGESTION_PLAN_KEY_PREFIX } },
    { key: { startsWith: MEDIA_INGESTION_BATCH_KEY_PREFIX } },
  ] } });
  await prisma.marketActivation.deleteMany({ where: { casinoId: ID.casino } });
  await prisma.mediaAsset.deleteMany({ where: { casinoId: ID.casino } });
  await prisma.affiliateRedirectSlug.deleteMany({ where: { id: ID.redirect } });
  await prisma.affiliateTrackingLink.deleteMany({ where: { id: ID.tracking } });
  await prisma.affiliateOffer.deleteMany({ where: { id: ID.offer } });
  await prisma.casinoBonus.deleteMany({ where: { id: ID.bonus } });
  await prisma.affiliateProgram.deleteMany({ where: { id: ID.program } });
  await prisma.affiliateNetwork.deleteMany({ where: { id: ID.network } });
  await prisma.auditLog.deleteMany({ where: { actorId: ID.actor } });
  await prisma.casino.deleteMany({ where: { id: ID.casino } });
  await prisma.adminUser.deleteMany({ where: { id: ID.actor } });
}

async function setup(prisma: PrismaClient) {
  await prisma.adminUser.create({ data: { id: ID.actor, email: "media-geo3@invalid.example", name: "MEDIA-GEO3 fixture", role: "SUPER_ADMIN" } });
  await prisma.casino.create({ data: {
    id: ID.casino,
    slug: "media-geo3-casino",
    title: "MEDIA-GEO3 Casino",
    domain: "media-geo3.invalid",
    status: "PUBLISHED",
    domainPublicationStatus: "PUBLISHED",
    publishedAt: new Date(NOW),
    createdBy: "test",
    updatedBy: "test",
    countries: { create: { id: ID.profile, countryCode: "KZ", availability: "AVAILABLE" } },
  } });
  await prisma.casinoBonus.create({ data: {
    id: ID.bonus,
    casinoId: ID.casino,
    slug: "media-geo3-welcome",
    title: "100% current offer",
    summary: "Exact offer fixture",
    status: "PUBLISHED",
    offerStatus: "ACTIVE",
    createdBy: "test",
    updatedBy: "test",
  } });
  await prisma.affiliateNetwork.create({ data: { id: ID.network, name: "MEDIA-GEO3 Network", slug: "media-geo3-network", createdBy: "test", updatedBy: "test" } });
  await prisma.affiliateProgram.create({ data: {
    id: ID.program,
    networkId: ID.network,
    casinoId: ID.casino,
    name: "MEDIA-GEO3 Program",
    operator: "MEDIA-GEO3 Operator",
    status: "ACTIVE",
    workflowStatus: "PUBLISHED",
    connectionStatus: "CONNECTED",
    createdBy: "test",
    updatedBy: "test",
  } });
  await prisma.affiliateOffer.create({ data: {
    id: ID.offer,
    programId: ID.program,
    casinoId: ID.casino,
    casinoBonusId: ID.bonus,
    internalName: "MEDIA-GEO3 current offer",
    publicLabel: "100% current offer",
    offerType: "WELCOME",
    status: "ACTIVE",
    evergreen: true,
    createdBy: "test",
    updatedBy: "test",
  } });
  await prisma.affiliateTrackingLink.create({ data: {
    id: ID.tracking,
    offerId: ID.offer,
    label: "MEDIA-GEO3 route",
    destinationUrl: "https://operator.invalid/offer",
    trackingUrl: "https://tracking.invalid/offer",
    active: true,
    verifiedAt: new Date(NOW),
    lastCheckedAt: new Date(NOW),
    createdBy: "test",
    updatedBy: "test",
  } });
  await prisma.affiliateRedirectSlug.create({ data: {
    id: ID.redirect,
    slug: "media-geo3-route",
    casinoId: ID.casino,
    casinoBonusId: ID.bonus,
    affiliateOfferId: ID.offer,
    createdBy: "test",
    updatedBy: "test",
  } });
  await prisma.marketActivation.create({ data: {
    id: ID.activation,
    casinoId: ID.casino,
    countryCode: "KZ",
    desiredState: "ACTIVE",
    status: "ACTIVE",
    marketProfileId: ID.profile,
    affiliateOfferId: ID.offer,
    primaryTrackingLinkId: ID.tracking,
    redirectSlugId: ID.redirect,
    casinoBonusId: ID.bonus,
    version: 1,
    controllerVersion: "media-geo3-test",
    reconciliationFingerprint: "9".repeat(64),
    requestedBy: "test",
    requestReason: "Exact governed test authority",
    sourceReferences: ["TEST:MEDIA-GEO3"],
    activatedAt: new Date(NOW),
    lastReconciledAt: new Date(NOW),
    routeVerificationStatus: "HEALTHY",
    routeLastCheckedAt: new Date(NOW),
  } });
  for (const [id, checksum, storageKey] of [
    [ID.firstAsset, "a".repeat(64), "media-geo3/first.jpg"],
    [ID.failedAsset, "b".repeat(64), "media-geo3/failed.jpg"],
    [ID.secondAsset, "c".repeat(64), "media-geo3/second.jpg"],
  ] as const) await prisma.mediaAsset.create({ data: {
    id,
    casinoId: ID.casino,
    type: "BONUS_CREATIVE",
    storageProvider: "LOCAL",
    storageKey,
    publicUrl: `/${storageKey}`,
    originalFilename: storageKey.split("/").at(-1)!,
    mimeType: "image/jpeg",
    width: 300,
    height: 250,
    sizeBytes: 100,
    altText: "Exact current offer",
    checksum,
    metadata: { role: "CURRENT_OFFER_CREATIVE" },
    createdBy: ID.actor,
  } });
}

function plan(input: { planId: string; batchId: string; creativeId: string; assetId: string; checksum: string }) {
  const recommendationId = input.creativeId.replace(/.$/, "f");
  return mediaIngestionPlanSchema.parse({
    version: 1,
    id: input.planId,
    snippetChecksum: input.checksum,
    state: "PLANNED",
    dryRun: false,
    actorId: ID.actor,
    source: "SYSTEM",
    providerReference: "MEDIA-GEO3:postgres",
    batchId: input.batchId,
    batchItemIndexes: [0],
    requestedContext: {
      casinoId: ID.casino,
      affiliateOfferId: ID.offer,
      targetCountryCodes: ["KZ"],
      creativeLanguage: null,
      creativeLanguageState: "NEUTRAL",
    },
    resolvedContext: {
      state: "RESOLVED",
      source: "EXPLICIT",
      casinoId: ID.casino,
      casinoSlug: "media-geo3-casino",
      casinoTitle: "MEDIA-GEO3 Casino",
      bonusId: ID.bonus,
      bonusTitle: "100% current offer",
      affiliateOfferId: ID.offer,
      opportunityId: null,
      partnerIdentifier: null,
      trackingDestinationState: "MATCH",
      notes: [],
    },
    creatives: [{
      id: input.creativeId,
      sourceKind: "DIRECT_URL",
      sourceMode: "FIRST_PARTY_MEDIA",
      provider: null,
      source: { urlHash: input.checksum, origin: "https://media.invalid", pathname: "/offer.jpg", queryKeys: [] },
      anchor: null,
      declaredWidth: 300,
      declaredHeight: 250,
      dimensionProvenance: "PIXEL_VALIDATED",
      alt: "Exact current offer",
      title: "Current offer",
      providerDomain: "media.invalid",
      providerReference: null,
      identifiers: {},
      languageClues: [],
      marketClues: ["KZ"],
      currencyClues: [],
      warnings: [],
      countryCode: "KZ",
      languageCode: null,
      languageState: "NEUTRAL",
    }],
    unsupportedElements: [],
    assets: [{
      creativeId: input.creativeId,
      state: "INGESTED",
      sourceMode: "FIRST_PARTY_MEDIA",
      provider: null,
      assetId: input.assetId,
      hostedCreativeId: null,
      renderUrl: `/media/${input.assetId}.jpg`,
      firstPartyUrl: `/media/${input.assetId}.jpg`,
      checksum: input.checksum,
      mimeType: "image/jpeg",
      width: 300,
      height: 250,
      animated: false,
      formatFamily: "CARD",
      dimensionProvenance: ["PIXEL_VALIDATED"],
      dimensionsMatch: true,
      mediaValidity: "VALID",
      commercialRouteValidity: "MATCH",
      commercialRouteReason: null,
      placementScores: [],
      resolvedSource: { urlHash: input.checksum, origin: "https://media.invalid", pathname: "/offer.jpg", queryKeys: [] },
      redirectCount: 0,
      duplicate: false,
      failureCode: null,
      failureMessage: null,
    }],
    semanticResults: [{
      creativeId: input.creativeId,
      state: "COMPLETED",
      provider: null,
      model: "media-geo3-test",
      brandName: "MEDIA-GEO3 Casino",
      assetPurpose: "PROMO",
      language: null,
      market: "KZ",
      currency: null,
      offerText: "100% current offer",
      offerAmount: null,
      offerPercentage: 100,
      freeSpins: null,
      promoCode: null,
      callToActionText: "Play",
      containsPromotionalText: true,
      containsFinePrint: true,
      containsResponsibleGamblingText: false,
      cropSafety: "UNKNOWN",
      textReadability: "READABLE",
      likelyMarkets: ["KZ"],
      complianceConcerns: [],
      confidence: 0.99,
      explanation: "Exact offer fixture",
    }],
    recommendations: [{
      id: recommendationId,
      creativeId: input.creativeId,
      assetId: input.assetId,
      hostedCreativeId: null,
      sourceMode: "FIRST_PARTY_MEDIA",
      subjectType: "AFFILIATE_OFFER",
      subjectId: ID.offer,
      placement: "CASINO_REVIEW_RIGHT_HERO",
      variant: "DEFAULT",
      countryCode: "KZ",
      languageCode: null,
      languageState: "NEUTRAL",
      renderingMode: "CONTAIN",
      cropSafe: false,
      state: "AUTO_ASSIGN_DRAFT",
      score: 100,
      offerMatch: "MATCH",
      marketHandling: "TARGETED",
      existingAssignmentId: null,
      existingComparison: "NEW_SLOT",
      replacementEligible: true,
      applyEligibility: "ELIGIBLE",
      applyBlocker: null,
      reasons: ["Exact offer fixture"],
      appliedAssignmentId: null,
      replacedAssignmentId: null,
      appliedAt: null,
      rolledBackAt: null,
    }],
    warnings: [],
    operations: [],
    createdAt: NOW,
    updatedAt: NOW,
    analyzedAt: NOW,
  });
}

async function saveBatch(input: { batchId: string; planId: string; creativeId: string; assetId: string; checksum: string }) {
  const prepared = plan(input);
  await mediaIngestionRepository.savePlan(prepared, { operation: "TEST_PLAN", result: { fixture: true } });
  const batch = mediaIngestionBatchSchema.parse({
    version: 1,
    id: input.batchId,
    batchChecksum: input.checksum,
    state: "ANALYZED",
    dryRun: false,
    actorId: ID.actor,
    source: "SYSTEM",
    planIds: [input.planId],
    items: [{ index: 0, state: "INGESTED", planId: input.planId, creativeIds: [input.creativeId], assetIds: [input.assetId], hostedCreativeIds: [], reasonCodes: [] }],
    counts: { total: 1, ingested: 1, reused: 0, reviewRequired: 0, rejected: 0 },
    createdAt: NOW,
    updatedAt: NOW,
  });
  await mediaIngestionRepository.saveBatch(batch, { operation: "TEST_BATCH", result: { fixture: true } });
}

function orchestrate(batchId: string, idempotencyKey: string) {
  return mediaOperationsService.orchestrateProduction({
    batchId,
    casinoId: ID.casino,
    affiliateOfferId: ID.offer,
    creativeSetIdentityKey: "MEDIA-GEO3:postgres:current-offer",
    creativeSetName: "MEDIA-GEO3 current offer",
    idempotencyKey,
    targets: [{ countryCode: "KZ", languageCode: "en", languageState: "EXPLICIT", devices: ["DESKTOP", "MOBILE"] }],
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"],
    useSemanticAnalysis: false,
    activate: true,
  }, ACTOR);
}

test("18-20: PostgreSQL keeps the known-good creative on failure, atomically activates a safe revision, and rolls back", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  await cleanup(prisma);
  try {
    await setup(prisma);
    await saveBatch({
      batchId: "84000000-0000-4000-8000-000000000101",
      planId: "84000000-0000-4000-8000-000000000102",
      creativeId: "84000000-0000-4000-8000-000000000103",
      assetId: ID.firstAsset,
      checksum: "a".repeat(64),
    });
    const first = await orchestrate("84000000-0000-4000-8000-000000000101", "media-geo3:first:activate");
    assert.equal(first?.status, "ACTIVE");
    assert.equal(first?.variants.length, 2);
    assert.equal(first?.preflight.length, 4);
    assert.ok(first?.preflight.every((entry) => entry.status === "READY"));
    const replay = await orchestrate("84000000-0000-4000-8000-000000000101", "media-geo3:first:activate");
    assert.equal(replay?.id, first?.id);
    assert.equal(await prisma.mediaRevision.count({ where: { batchId: "84000000-0000-4000-8000-000000000101" } }), 1);

    await saveBatch({
      batchId: "84000000-0000-4000-8000-000000000201",
      planId: "84000000-0000-4000-8000-000000000202",
      creativeId: "84000000-0000-4000-8000-000000000203",
      assetId: ID.failedAsset,
      checksum: "d".repeat(64),
    });
    const failed = await orchestrate("84000000-0000-4000-8000-000000000201", "media-geo3:failed:activate");
    assert.equal(failed?.status, "FAILED");
    assert.match(failed?.failureCode ?? "", /FIRST_PARTY_SOURCE_CHANGED/);
    assert.equal((await prisma.mediaRevision.findFirstOrThrow({ where: { casinoId: ID.casino, affiliateOfferId: ID.offer, status: "ACTIVE" } })).id, first?.id);
    assert.equal(await prisma.mediaCreativeVariant.count({ where: { revisionId: first!.id, status: "ACTIVE" } }), 2);

    await saveBatch({
      batchId: "84000000-0000-4000-8000-000000000301",
      planId: "84000000-0000-4000-8000-000000000302",
      creativeId: "84000000-0000-4000-8000-000000000303",
      assetId: ID.secondAsset,
      checksum: "c".repeat(64),
    });
    const second = await orchestrate("84000000-0000-4000-8000-000000000301", "media-geo3:second:activate");
    assert.equal(second?.status, "ACTIVE");
    assert.equal(second?.previousRevisionId, first?.id);
    assert.equal((await prisma.mediaRevision.findUniqueOrThrow({ where: { id: first!.id } })).status, "SUPERSEDED");
    assert.equal(await prisma.mediaRevision.count({ where: { casinoId: ID.casino, affiliateOfferId: ID.offer, status: "ACTIVE" } }), 1);

    await prisma.mediaAsset.update({ where: { id: ID.firstAsset }, data: { status: "ARCHIVED", archivedAt: new Date() } });
    await assert.rejects(mediaOperationsService.rollbackProductionRevision({
      revisionId: second!.id,
      idempotencyKey: "media-geo3:second:unavailable-rollback",
      reason: "A missing prior source must preserve the current revision",
    }, ACTOR), /no longer restorable/);
    assert.equal((await prisma.mediaRevision.findUniqueOrThrow({ where: { id: second!.id } })).status, "ACTIVE");
    assert.equal(await prisma.mediaCreativeVariant.count({ where: { revisionId: second!.id, status: "ACTIVE" } }), 2);
    await prisma.mediaAsset.update({ where: { id: ID.firstAsset }, data: { status: "ACTIVE", archivedAt: null } });

    const rolledBack = await mediaOperationsService.rollbackProductionRevision({
      revisionId: second!.id,
      idempotencyKey: "media-geo3:second:rollback",
      reason: "Exercise the known-good rollback path",
    }, ACTOR);
    assert.equal(rolledBack?.status, "ROLLED_BACK");
    assert.equal((await prisma.mediaRevision.findUniqueOrThrow({ where: { id: first!.id } })).status, "ACTIVE");
    assert.equal(await prisma.mediaCreativeVariant.count({ where: { revisionId: first!.id, status: "ACTIVE" } }), 2);
    assert.equal(await prisma.mediaCreativeVariant.count({ where: { revisionId: second!.id, status: "ACTIVE" } }), 0);
    const rollbackReplay = await mediaOperationsService.rollbackProductionRevision({
      revisionId: second!.id,
      idempotencyKey: "media-geo3:second:rollback",
      reason: "Exercise the known-good rollback path",
    }, ACTOR);
    assert.equal(rollbackReplay?.status, "ROLLED_BACK");
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { MEDIA_INGESTION_PLAN_VERSION, mediaIngestionPlanSchema, MEDIA_INGESTION_PLAN_KEY_PREFIX, type MediaIngestionPlan } from "../lib/media-operations/contracts";
import { mediaIngestionRepository } from "../lib/media-operations/repository";

const ids = {
  actor: "58000000-0000-4000-8000-000000000001",
  casino: "58000000-0000-4000-8000-000000000002",
  bonus: "58000000-0000-4000-8000-000000000003",
  asset: "58000000-0000-4000-8000-000000000004",
  oldAsset: "58000000-0000-4000-8000-000000000005",
  explicitAssignment: "58000000-0000-4000-8000-000000000006",
  changedAssignment: "58000000-0000-4000-8000-000000000007",
};

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

async function cleanup(prisma: PrismaClient) {
  await prisma.siteSetting.deleteMany({ where: { key: { startsWith: MEDIA_INGESTION_PLAN_KEY_PREFIX } } });
  await prisma.casinoBonusMediaAssignment.deleteMany({ where: { casinoBonusId: ids.bonus } });
  await prisma.mediaAsset.deleteMany({ where: { id: { in: [ids.asset, ids.oldAsset] } } });
  await prisma.casinoBonus.deleteMany({ where: { id: ids.bonus } });
  await prisma.casinoVersion.deleteMany({ where: { casinoId: ids.casino } });
  await prisma.casino.deleteMany({ where: { id: ids.casino } });
  await prisma.adminUser.deleteMany({ where: { id: ids.actor } });
}

function plan(planId: string, state: "AUTO_ASSIGN_DRAFT" | "SUGGEST_REVIEW", replacementEligible: boolean): MediaIngestionPlan {
  const creativeId = `${planId.slice(0, -1)}7`;
  const recommendationId = `${planId.slice(0, -1)}8`;
  return mediaIngestionPlanSchema.parse({
    version: MEDIA_INGESTION_PLAN_VERSION,
    id: planId,
    snippetChecksum: "a".repeat(64),
    state: "PLANNED",
    dryRun: false,
    actorId: ids.actor,
    source: "ADMIN",
    providerReference: "postgres-fixture",
    requestedContext: { casinoId: ids.casino, bonusId: ids.bonus },
    resolvedContext: { state: "RESOLVED", source: "EXPLICIT", casinoId: ids.casino, casinoSlug: "media-ingestion-postgres", casinoTitle: "Media ingestion PostgreSQL", bonusId: ids.bonus, bonusTitle: "Fixture bonus", affiliateOfferId: null, opportunityId: null, partnerIdentifier: "fixture", trackingDestinationState: "NOT_PRESENT", notes: [] },
    creatives: [{ id: creativeId, sourceKind: "IMAGE", source: { urlHash: "b".repeat(64), origin: "https://cdn.example", pathname: "/creative.png", queryKeys: [] }, anchor: null, declaredWidth: 300, declaredHeight: 250, alt: "Fixture", title: null, providerDomain: "cdn.example", providerReference: "creative:fixture", identifiers: {}, languageClues: [], marketClues: [], currencyClues: [], warnings: [] }],
    unsupportedElements: [],
    assets: [{ creativeId, state: "INGESTED", assetId: ids.asset, firstPartyUrl: "https://media.example/creative.png", checksum: "c".repeat(64), mimeType: "image/png", width: 300, height: 250, animated: false, formatFamily: "CARD", resolvedSource: { urlHash: "d".repeat(64), origin: "https://cdn.example", pathname: "/creative.png", queryKeys: [] }, redirectCount: 0, duplicate: false, failureCode: null, failureMessage: null }],
    semanticResults: [{ creativeId, state: "COMPLETED", provider: "TEST", model: "TEST", brandName: "Fixture", assetPurpose: "PROMO", language: null, market: null, currency: null, offerText: "100% + 50 spins", offerAmount: null, offerPercentage: 100, freeSpins: 50, promoCode: null, callToActionText: "Join", containsPromotionalText: true, containsFinePrint: true, containsResponsibleGamblingText: false, cropSafety: "SAFE", textReadability: "READABLE", likelyMarkets: [], complianceConcerns: [], confidence: 1, explanation: "Fixture" }],
    recommendations: [{ id: recommendationId, creativeId, assetId: ids.asset, subjectType: "CASINO_BONUS", subjectId: ids.bonus, placement: "BONUS_LISTING_CARD", variant: "DEFAULT", renderingMode: "CONTAIN", cropSafe: false, state, score: 98, offerMatch: "MATCH", marketHandling: "GLOBAL_SAFE", existingAssignmentId: state === "SUGGEST_REVIEW" ? ids.explicitAssignment : null, existingComparison: state === "SUGGEST_REVIEW" ? "EQUIVALENT" : "NEW_SLOT", replacementEligible, reasons: ["PostgreSQL fixture"], appliedAssignmentId: null, replacedAssignmentId: null, appliedAt: null, rolledBackAt: null }],
    warnings: [], operations: [], createdAt: "2026-09-05T00:00:00.000Z", updatedAt: "2026-09-05T00:00:00.000Z", analyzedAt: "2026-09-05T00:00:00.000Z",
  });
}

test("PostgreSQL persists plans, applies only draft assignments, protects explicit state, rolls back ownership, and leaves public snapshots and assets untouched", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  try {
    await cleanup(prisma);
    await prisma.adminUser.create({ data: { id: ids.actor, email: "media-ingestion-postgres@invalid.example", name: "Media ingestion fixture", role: "SUPER_ADMIN" } });
    await prisma.casino.create({ data: { id: ids.casino, slug: "media-ingestion-postgres", title: "Media ingestion PostgreSQL", domain: "media-ingestion-postgres.invalid", createdBy: "fixture", updatedBy: "fixture" } });
    await prisma.casinoBonus.create({ data: { id: ids.bonus, casinoId: ids.casino, slug: "media-ingestion-postgres-bonus", title: "Fixture bonus", summary: "Fixture", createdBy: "fixture", updatedBy: "fixture" } });
    await prisma.casinoVersion.create({ data: { casinoId: ids.casino, version: 1, status: "PUBLISHED", snapshot: { immutablePublicMarker: "before-media-plan", mediaAssignments: [] }, createdBy: "fixture", publishedAt: new Date() } });
    for (const [id, checksum] of [[ids.asset, "c".repeat(64)], [ids.oldAsset, "d".repeat(64)]]) await prisma.mediaAsset.create({ data: { id, type: "BONUS_CREATIVE", storageKey: `media-ingestion-postgres/${id}`, publicUrl: `https://media.example/${id}.png`, originalFilename: `${id}.png`, mimeType: "image/png", width: 300, height: 250, sizeBytes: 100, altText: "Fixture", checksum, createdBy: "fixture", casinoId: ids.casino, casinoBonusId: ids.bonus } });

    const first = plan("58000000-0000-4000-8000-000000000010", "AUTO_ASSIGN_DRAFT", false);
    await mediaIngestionRepository.savePlan(first, { operation: "TEST_CREATE", result: { fixture: true } });
    assert.equal((await mediaIngestionRepository.getPlan(first.id))?.id, first.id);
    const applied = await mediaIngestionRepository.applyDraftPlan({ planId: first.id, replaceExisting: false, actorId: ids.actor, source: "ADMIN" });
    assert.equal(applied.applied, 1);
    const assignment = await prisma.casinoBonusMediaAssignment.findFirstOrThrow({ where: { casinoBonusId: ids.bonus, active: true } });
    assert.match(assignment.reference ?? "", new RegExp(`^MEDIA_OPERATIONS:${first.id}:`));
    const repeat = await mediaIngestionRepository.applyDraftPlan({ planId: first.id, replaceExisting: false, actorId: ids.actor, source: "ADMIN" });
    assert.equal(repeat.applied, 0);
    assert.equal(await prisma.casinoBonusMediaAssignment.count({ where: { casinoBonusId: ids.bonus, active: true } }), 1);
    assert.deepEqual((await prisma.casinoVersion.findFirstOrThrow({ where: { casinoId: ids.casino } })).snapshot, { immutablePublicMarker: "before-media-plan", mediaAssignments: [] });

    const rolledBack = await mediaIngestionRepository.rollbackDraftPlan({ planId: first.id, actorId: ids.actor, source: "ADMIN" });
    assert.equal(rolledBack.rolledBack, 1);
    assert.equal(await prisma.casinoBonusMediaAssignment.count({ where: { casinoBonusId: ids.bonus } }), 0);
    assert.equal(await prisma.mediaAsset.count({ where: { id: ids.asset } }), 1);

    await prisma.casinoBonusMediaAssignment.create({ data: { id: ids.explicitAssignment, casinoBonusId: ids.bonus, mediaAssetId: ids.oldAsset, placement: "BONUS_LISTING_CARD", reference: "Explicit Admin assignment" } });
    const replacement = plan("58000000-0000-4000-8000-000000000020", "SUGGEST_REVIEW", true);
    await mediaIngestionRepository.savePlan(replacement, { operation: "TEST_CREATE", result: { fixture: true } });
    const protectedResult = await mediaIngestionRepository.applyDraftPlan({ planId: replacement.id, replaceExisting: false, actorId: ids.actor, source: "ADMIN" });
    assert.equal(protectedResult.applied, 0);
    assert.equal((await prisma.casinoBonusMediaAssignment.findUniqueOrThrow({ where: { id: ids.explicitAssignment } })).active, true);
    await prisma.casinoBonusMediaAssignment.update({ where: { id: ids.explicitAssignment }, data: { active: false } });
    await prisma.casinoBonusMediaAssignment.create({ data: { id: ids.changedAssignment, casinoBonusId: ids.bonus, mediaAssetId: ids.oldAsset, placement: "BONUS_LISTING_CARD", reference: "Assignment changed after planning" } });
    const staleReplacement = await mediaIngestionRepository.applyDraftPlan({ planId: replacement.id, replaceExisting: true, actorId: ids.actor, source: "ADMIN" });
    assert.equal(staleReplacement.applied, 0);
    assert.ok(staleReplacement.skipped.some((item) => item.reason === "ASSIGNMENT_CHANGED_SINCE_PLAN"));
    await prisma.casinoBonusMediaAssignment.delete({ where: { id: ids.changedAssignment } });
    const missingReplacement = await mediaIngestionRepository.applyDraftPlan({ planId: replacement.id, replaceExisting: true, actorId: ids.actor, source: "ADMIN" });
    assert.equal(missingReplacement.applied, 0);
    assert.ok(missingReplacement.skipped.some((item) => item.reason === "ASSIGNMENT_CHANGED_SINCE_PLAN"));
    await prisma.casinoBonusMediaAssignment.update({ where: { id: ids.explicitAssignment }, data: { active: true } });
    const replaced = await mediaIngestionRepository.applyDraftPlan({ planId: replacement.id, replaceExisting: true, actorId: ids.actor, source: "ADMIN" });
    assert.equal(replaced.applied, 1);
    assert.equal((await prisma.casinoBonusMediaAssignment.findUniqueOrThrow({ where: { id: ids.explicitAssignment } })).active, false);
    await mediaIngestionRepository.rollbackDraftPlan({ planId: replacement.id, actorId: ids.actor, source: "ADMIN" });
    assert.equal((await prisma.casinoBonusMediaAssignment.findUniqueOrThrow({ where: { id: ids.explicitAssignment } })).active, true);

    await prisma.casinoBonus.update({ where: { id: ids.bonus }, data: { status: "IN_REVIEW" } });
    const blocked = plan("58000000-0000-4000-8000-000000000030", "AUTO_ASSIGN_DRAFT", false);
    await mediaIngestionRepository.savePlan(blocked, { operation: "TEST_CREATE", result: { fixture: true } });
    const blockedResult = await mediaIngestionRepository.applyDraftPlan({ planId: blocked.id, replaceExisting: false, actorId: ids.actor, source: "ADMIN" });
    assert.equal(blockedResult.applied, 0);
    assert.ok(blockedResult.skipped.some((item) => item.reason === "SUBJECT_NOT_DRAFT"));

    const audits = await prisma.auditLog.findMany({ where: { actorId: ids.actor, entityType: { in: ["media-ingestion-plan", "media-assignment"] } } });
    assert.ok(audits.length >= 8);
    assert.ok(audits.every((entry) => entry.metadata && JSON.stringify(entry.metadata).includes("planId") && JSON.stringify(entry.metadata).includes("checksum") && JSON.stringify(entry.metadata).includes("operation")));
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

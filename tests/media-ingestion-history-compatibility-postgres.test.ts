import assert from "node:assert/strict";
import test from "node:test";

import { Prisma, PrismaClient } from "@prisma/client";

import {
  MEDIA_INGESTION_BATCH_VERSION,
  MEDIA_INGESTION_PLAN_VERSION,
  mediaIngestionBatchKey,
  mediaIngestionPlanKey,
  mediaIngestionPlanSchema,
} from "../lib/media-operations/contracts";
import { mediaIngestionRepository } from "../lib/media-operations/repository";

const ids = {
  actor: "77000000-0000-4000-8000-000000000001",
  plan: "77000000-0000-4000-8000-000000000002",
  batch: "77000000-0000-4000-8000-000000000003",
  operation: "77000000-0000-4000-8000-000000000004",
  recommendation: "77000000-0000-4000-8000-000000000005",
  creative: "77000000-0000-4000-8000-000000000006",
  asset: "77000000-0000-4000-8000-000000000007",
  missingCasino: "77000000-0000-4000-8000-000000000008",
  missingAssignment: "77000000-0000-4000-8000-000000000009",
};

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

function legacyPlanValue(input?: { applied?: boolean }): Prisma.InputJsonValue {
  const current = mediaIngestionPlanSchema.parse({
    version: MEDIA_INGESTION_PLAN_VERSION,
    id: ids.plan,
    snippetChecksum: "c".repeat(64),
    state: "PLANNED",
    dryRun: false,
    actorId: ids.actor,
    source: "AUTOMATION",
    providerReference: "persisted-postgres-fixture",
    requestedContext: { casinoId: ids.missingCasino, creativeLanguageState: "UNKNOWN" },
    resolvedContext: {
      state: "RESOLVED",
      source: "EXPLICIT",
      casinoId: ids.missingCasino,
      casinoSlug: "missing-retired-media-fixture",
      casinoTitle: "Missing retired Media fixture",
      bonusId: null,
      bonusTitle: null,
      affiliateOfferId: null,
      opportunityId: null,
      partnerIdentifier: null,
      trackingDestinationState: "NOT_PRESENT",
      notes: [],
    },
    creatives: [],
    unsupportedElements: [],
    assets: [],
    semanticResults: [],
    recommendations: [{
      id: ids.recommendation,
      creativeId: ids.creative,
      assetId: ids.asset,
      subjectType: "CASINO",
      subjectId: ids.missingCasino,
      placement: "CASINO_DIRECTORY_CARD",
      variant: "DEFAULT",
      countryCode: null,
      languageCode: null,
      renderingMode: "CONTAIN",
      cropSafe: false,
      state: "AUTO_ASSIGN_DRAFT",
      score: 90,
      offerMatch: "MATCH",
      marketHandling: "GLOBAL_SAFE",
      existingAssignmentId: null,
      existingComparison: "NEW_SLOT",
      replacementEligible: false,
      applyEligibility: input?.applied ? "ELIGIBLE" : "BLOCKED",
      applyBlocker: input?.applied ? null : "PROMOTIONAL_MEDIA_RETIRED",
      reasons: ["Retirement constraint fixture"],
      appliedAssignmentId: input?.applied ? ids.missingAssignment : null,
      replacedAssignmentId: null,
      appliedAt: input?.applied ? "2026-09-07T00:01:00.000Z" : null,
      rolledBackAt: null,
    }],
    warnings: [],
    operations: [{
      id: ids.operation,
      operation: "ANALYZE",
      recommendationId: ids.recommendation,
      subject: `media-ingestion-plan:${ids.plan}`,
      previous: null,
      result: { state: "PLANNED" },
      actorId: ids.actor,
      source: "AUTOMATION",
      timestamp: "2026-09-07T00:00:00.000Z",
    }],
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
    analyzedAt: "2026-09-07T00:00:00.000Z",
  });
  const legacy = structuredClone(current) as unknown as Record<string, unknown>;
  legacy.source = "CHATGPT_WORK";
  (legacy.operations as Array<Record<string, unknown>>)[0].source = "CHATGPT_WORK";
  return legacy as Prisma.InputJsonValue;
}

function legacyBatchValue(): Prisma.InputJsonValue {
  return {
    version: MEDIA_INGESTION_BATCH_VERSION,
    id: ids.batch,
    batchChecksum: "d".repeat(64),
    state: "ANALYZED",
    dryRun: false,
    actorId: ids.actor,
    source: "CHATGPT_WORK",
    planIds: [ids.plan],
    items: [{
      index: 0,
      state: "INGESTED",
      planId: ids.plan,
      creativeIds: [],
      assetIds: [],
      hostedCreativeIds: [],
      reasonCodes: [],
    }],
    counts: { total: 1, ingested: 1, reused: 0, reviewRequired: 0, rejected: 0 },
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  };
}

test("PostgreSQL repository reads legacy Media history while retirement and ownership guards stay fail-closed", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  const keys = [mediaIngestionPlanKey(ids.plan), mediaIngestionBatchKey(ids.batch)];
  try {
    await prisma.siteSetting.deleteMany({ where: { key: { in: keys } } });
    await prisma.adminUser.deleteMany({ where: { id: ids.actor } });
    await prisma.adminUser.create({ data: {
      id: ids.actor,
      email: "media-history-compatibility@invalid.example",
      name: "Media history compatibility fixture",
      role: "SUPER_ADMIN",
    } });
    await prisma.siteSetting.create({ data: { key: keys[0], value: legacyPlanValue() } });
    await prisma.siteSetting.create({ data: { key: keys[1], value: legacyBatchValue() } });

    const plan = await mediaIngestionRepository.getPlan(ids.plan);
    assert.equal(plan?.source, "AUTOMATION");
    assert.equal(plan?.operations[0].source, "AUTOMATION");
    assert.equal((await mediaIngestionRepository.listRecent()).find((item) => item.id === ids.plan)?.source, "AUTOMATION");
    assert.equal((await mediaIngestionRepository.getBatch(ids.batch))?.source, "AUTOMATION");
    assert.equal((await mediaIngestionRepository.listRecentBatches()).find((item) => item.id === ids.batch)?.source, "AUTOMATION");

    const applyResult = await mediaIngestionRepository.applyDraftPlan({
      planId: ids.plan,
      replaceExisting: false,
      actorId: ids.actor,
      source: "SYSTEM",
    });
    assert.equal(applyResult.applied, 0);
    assert.deepEqual(applyResult.skipped, [{
      recommendationId: ids.recommendation,
      reason: "PROMOTIONAL_MEDIA_RETIRED",
    }]);

    await prisma.siteSetting.update({
      where: { key: keys[0] },
      data: { value: legacyPlanValue({ applied: true }) },
    });
    const rollbackResult = await mediaIngestionRepository.rollbackDraftPlan({
      planId: ids.plan,
      actorId: ids.actor,
      source: "SYSTEM",
    });
    assert.equal(rollbackResult.rolledBack, 0);
    assert.deepEqual(rollbackResult.skipped, [{
      recommendationId: ids.recommendation,
      reason: "SUBJECT_NOT_DRAFT",
    }]);
    assert.equal(await prisma.casinoMediaAssignment.count({ where: { id: ids.missingAssignment } }), 0);
  } finally {
    await prisma.siteSetting.deleteMany({ where: { key: { in: keys } } });
    await prisma.adminUser.deleteMany({ where: { id: ids.actor } });
    await prisma.$disconnect();
  }
});

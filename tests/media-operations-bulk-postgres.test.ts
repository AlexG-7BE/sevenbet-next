import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { MEDIA_INGESTION_BATCH_KEY_PREFIX, MEDIA_INGESTION_PLAN_KEY_PREFIX } from "../lib/media-operations/contracts";
import { mediaOperationsService } from "../lib/media-operations/service";
import { assertMediaOperationsBulk0030Schema } from "../lib/db/media-operations-bulk-0030-release";

const actorId = "73000000-0000-4000-8000-000000000001";
const casinoIds = [
  "73000000-0000-4000-8000-000000000010",
  "73000000-0000-4000-8000-000000000020",
  "73000000-0000-4000-8000-000000000030",
];

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

function hex24(value: number) {
  return value.toString(16).padStart(24, "0");
}

function bannerflow(index: number) {
  return `<script src="https://c.bannerflow.net/a/${hex24(index + 1)}?did=${hex24(index + 101)}&deeplink=on&adgroupid=${hex24(index + 201)}&redirecturl=https://record.partner.invalid/creative-${index}/&media=${310000 + index}&campaign=1"></script>`;
}

async function cleanup(prisma: PrismaClient) {
  await prisma.casinoPartnerHostedCreativeAssignment.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.partnerHostedCreative.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.siteSetting.deleteMany({ where: { OR: [
    { key: { startsWith: MEDIA_INGESTION_PLAN_KEY_PREFIX } },
    { key: { startsWith: MEDIA_INGESTION_BATCH_KEY_PREFIX } },
  ] } });
  await prisma.casino.deleteMany({ where: { id: { in: casinoIds } } });
  await prisma.adminUser.deleteMany({ where: { id: actorId } });
}

test("PostgreSQL bulk ingest isolates failures, returns three durable plans, analyzes missing-route media, blocks apply, and reuses replayed creatives", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  try {
    await cleanup(prisma);
    await prisma.adminUser.create({ data: { id: actorId, email: "media-operations-bulk@invalid.example", name: "Media bulk fixture", role: "SUPER_ADMIN" } });
    for (let index = 0; index < casinoIds.length; index += 1) {
      await prisma.casino.create({ data: {
        id: casinoIds[index], slug: `bulk-casino-${index + 1}`, title: `Bulk Casino ${index + 1}`,
        domain: `bulk-casino-${index + 1}.invalid`, createdBy: "fixture", updatedBy: "fixture",
      } });
    }
    const items = Array.from({ length: 24 }, (_, index) => ({
      snippet: bannerflow(index),
      title: `Bulk Casino ${index % 3 + 1} - ${index % 2 ? "300 x 250" : "728 x 90"}`,
      context: { casinoId: casinoIds[index % 3] },
    }));
    const first = await mediaOperationsService.ingestBatch({
      items: [...items, { snippet: '<script src="https://unapproved.invalid/a.js"></script>', title: "Invalid - 300 x 250", context: { casinoId: casinoIds[0] } }],
      dryRun: false,
    }, { actorId, source: "SYSTEM" });
    assert.equal(first.planIds.length, 3);
    assert.deepEqual(first.counts, { total: 25, ingested: 0, reused: 0, reviewRequired: 24, rejected: 1 });
    assert.deepEqual(first.items.find((item) => item.state === "REJECTED")?.reasonCodes, ["BANNERFLOW_PROVIDER_NOT_ALLOWED"]);
    assert.equal(await prisma.siteSetting.count({ where: { key: { startsWith: MEDIA_INGESTION_PLAN_KEY_PREFIX } } }), 3);
    assert.equal(await prisma.siteSetting.count({ where: { key: `${MEDIA_INGESTION_BATCH_KEY_PREFIX}${first.id}` } }), 1);

    const analyzed = await mediaOperationsService.analyze({ batchId: first.id, useSemanticAnalysis: false }, { actorId, source: "SYSTEM" });
    assert.ok("plans" in analyzed);
    if (!("plans" in analyzed)) return;
    assert.equal(analyzed.plans.reduce((sum, plan) => sum + plan.assets.length, 0), 24);
    assert.equal(analyzed.plans.reduce((sum, plan) => sum + plan.assets.filter((asset) => asset.mediaValidity === "VALID").length, 0), 24);
    assert.equal(analyzed.plans.reduce((sum, plan) => sum + plan.assets.filter((asset) => asset.commercialRouteValidity === "MISSING").length, 0), 24);
    assert.ok(analyzed.plans.every((plan) => plan.assets.every((asset) => (asset.placementScores?.length ?? 0) > 0)));

    const applied = await mediaOperationsService.apply({ batchId: first.id, mode: "APPLY" }, { actorId, source: "SYSTEM" });
    assert.ok("results" in applied);
    if (!("results" in applied)) return;
    assert.equal(applied.results.reduce((sum, result) => sum + ("applied" in result ? result.applied : 0), 0), 0);
    assert.ok(applied.results.flatMap((result) => result.skipped).every((item) => item.reason === "CANONICAL_COMMERCIAL_ROUTE_REQUIRED"));
    assert.equal(await prisma.casinoPartnerHostedCreativeAssignment.count({ where: { casinoId: { in: casinoIds } } }), 0);

    const replayBatch = await mediaOperationsService.ingestBatch({ items, dryRun: false }, { actorId, source: "SYSTEM" });
    const replay = await mediaOperationsService.get({ batchId: replayBatch.id });
    assert.ok("plans" in replay);
    if (!("plans" in replay)) return;
    assert.equal(await prisma.partnerHostedCreative.count({ where: { casinoId: { in: casinoIds } } }), 24);
    assert.equal(replay.plans.reduce((sum, plan) => sum + plan.assets.filter((asset) => asset.state === "REUSED").length, 0), 24);
    assert.ok(await prisma.auditLog.count({ where: { actorId, entityType: "media-ingestion-batch" } }) >= 3);
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

test("PostgreSQL applies the exact 0030 SQL over the 0029 constraints and verifies independent media/route state", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  try {
    const setupStatements = [
      'ALTER TABLE "PartnerHostedCreative" DROP CONSTRAINT IF EXISTS "PartnerHostedCreative_validated_destination_check"',
      'ALTER TABLE "PartnerHostedCreative" DROP CONSTRAINT IF EXISTS "PartnerHostedCreative_verified_binding_check"',
      `ALTER TABLE "PartnerHostedCreative"
        ADD CONSTRAINT "PartnerHostedCreative_validated_destination_check"
        CHECK ("validationState" <> 'VALIDATED' OR "destinationVerificationState" = 'VERIFIED')`,
      `ALTER TABLE "PartnerHostedCreative"
        ADD CONSTRAINT "PartnerHostedCreative_verified_binding_check"
        CHECK ("destinationVerificationState" <> 'VERIFIED' OR ("redirectSlugId" IS NOT NULL AND "trackingLinkId" IS NOT NULL AND "verifiedFinalHost" IS NOT NULL AND "destinationVerifiedAt" IS NOT NULL))`,
    ];
    for (const statement of setupStatements) await prisma.$executeRawUnsafe(statement);
    const migrationStatements = readFileSync("prisma/migrations/0030_media_operations_bulk_contract/migration.sql", "utf8")
      .split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of migrationStatements) await prisma.$executeRawUnsafe(statement);
    assert.deepEqual(await assertMediaOperationsBulk0030Schema(prisma), {
      mediaValidationIndependent: true,
      verifiedRouteBindingComplete: true,
    });
  } finally {
    await prisma.$disconnect();
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { Prisma, PrismaClient } from "@prisma/client";

import {
  applyDemoCasinoRetirement,
  inspectDemoCasinoRetirementPlan,
} from "../scripts/demo-casino-retirement-core";
import {
  demoAffiliateNetworkRetirementManifest,
  demoAffiliateRetirementManifest,
  demoCasinoRetirementIds,
  demoCasinoRetirementManifest,
} from "../scripts/demo-casino-retirement.manifest";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DEMO_RETIREMENT_POSTGRES_TEST_DATABASE_URL_REQUIRED");
const parsedDatabaseUrl = new URL(databaseUrl);
if (!["127.0.0.1", "localhost", "::1"].includes(parsedDatabaseUrl.hostname)) {
  throw new Error("DEMO_RETIREMENT_POSTGRES_TEST_REQUIRES_LOOPBACK_DATABASE");
}
if (!parsedDatabaseUrl.pathname.slice(1).endsWith("_ci")) {
  throw new Error("DEMO_RETIREMENT_POSTGRES_TEST_REQUIRES_CI_DATABASE");
}

const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
const actor = "demo-retirement-postgres-test";
const dataset = "temporary-production-demo-casinos-v2";
const adminId = "f0000000-0000-4000-8000-000000000001";
const auditId = "f0000000-0000-4000-8000-000000000002";
const bonusId = "f0000000-0000-4000-8000-000000000003";
const imageId = "f0000000-0000-4000-8000-000000000004";
const staleImageId = "f0000000-0000-4000-8000-000000000005";
const indirectMediaId = "f0000000-0000-4000-8000-000000000006";
const duplicatePathMediaId = "f0000000-0000-4000-8000-000000000007";
const relationshipId = "f0000000-0000-4000-8000-000000000008";
const similarRealCasinoId = "f0000000-0000-4000-8000-000000000009";
const testMediaIds = [indirectMediaId, duplicatePathMediaId];

async function cleanup() {
  await prisma.partnerCasinoRelationship.deleteMany({ where: { id: relationshipId } });
  await prisma.mediaAsset.deleteMany({ where: { id: { in: testMediaIds } } });
  await prisma.auditLog.deleteMany({ where: { id: auditId } });
  await prisma.affiliateRedirectSlug.deleteMany({
    where: { id: { in: demoAffiliateRetirementManifest.map((entry) => entry.redirectId) } },
  });
  await prisma.affiliateOffer.deleteMany({
    where: { id: { in: demoAffiliateRetirementManifest.map((entry) => entry.offerId) } },
  });
  await prisma.affiliateProgram.deleteMany({
    where: { id: { in: demoAffiliateRetirementManifest.map((entry) => entry.programId) } },
  });
  await prisma.affiliateNetwork.deleteMany({ where: { id: demoAffiliateNetworkRetirementManifest.id } });
  await prisma.casino.deleteMany({ where: { id: { in: [...demoCasinoRetirementIds, similarRealCasinoId] } } });
  await prisma.adminUser.deleteMany({ where: { id: adminId } });
}

async function seedExactRetirementGraph() {
  await prisma.casino.createMany({
    data: demoCasinoRetirementManifest.map((casino) => ({
      id: casino.id,
      slug: casino.slug,
      title: casino.name,
      domain: casino.domain,
      status: "ARCHIVED" as const,
      archivedAt: new Date("2026-09-01T00:00:00.000Z"),
      createdBy: actor,
      updatedBy: actor,
    })),
  });
  await prisma.affiliateNetwork.create({
    data: {
      id: demoAffiliateNetworkRetirementManifest.id,
      name: "Demo B4GAMBLE Internal Network",
      slug: demoAffiliateNetworkRetirementManifest.slug,
      type: "DIRECT",
      notes: "Synthetic internal-only routes; no partner relationship.",
      createdBy: actor,
      updatedBy: actor,
    },
  });
  await prisma.affiliateProgram.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => ({
      id: entry.programId,
      networkId: demoAffiliateNetworkRetirementManifest.id,
      casinoId: entry.casinoId,
      name: `${entry.redirectSlug} internal presentation`,
      operator: "Fictional B4GAMBLE Demo Studio",
      status: "ACTIVE" as const,
      workflowStatus: "PUBLISHED" as const,
      providerType: "MANUAL",
      integrationMode: "MANUAL" as const,
      connectionStatus: "DISCONNECTED" as const,
      metadata: { dataset },
      sourceOfTruth: { owner: actor },
      createdBy: actor,
      updatedBy: actor,
    })),
  });
  await prisma.affiliateOffer.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => ({
      id: entry.offerId,
      programId: entry.programId,
      casinoId: entry.casinoId,
      internalName: `${entry.redirectSlug} internal visit state`,
      publicLabel: "Demo internal profile",
      offerType: "INTERNAL_DEMO",
      status: "ACTIVE" as const,
      metadata: { dataset },
      createdBy: actor,
      updatedBy: actor,
    })),
  });
  await prisma.affiliateTrackingLink.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => {
      const internalDestination = `https://b4gamble.com/casino/${entry.redirectSlug}`;
      return {
        id: entry.trackingLinkId,
        offerId: entry.offerId,
        label: "Demo internal profile",
        destinationUrl: internalDestination,
        trackingUrl: internalDestination,
        source: "MANUAL_DEMO",
        metadata: { dataset },
        createdBy: actor,
        updatedBy: actor,
      };
    }),
  });
  await prisma.affiliateRedirectSlug.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => ({
      id: entry.redirectId,
      slug: entry.redirectSlug,
      casinoId: entry.casinoId,
      affiliateOfferId: entry.offerId,
      createdBy: actor,
      updatedBy: actor,
    })),
  });
  await prisma.affiliateOfferRevision.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => ({
      id: entry.offerRevisionId,
      offerId: entry.offerId,
      revisionNumber: 1,
      snapshot: { dataset, destination: "internal-only" },
      summary: "Created deterministic internal demo offer",
      createdBy: actor,
    })),
  });
  await prisma.affiliateTrackingLinkRevision.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => {
      const internalDestination = `https://b4gamble.com/casino/${entry.redirectSlug}`;
      return {
        id: entry.trackingRevisionId,
        trackingLinkId: entry.trackingLinkId,
        revisionNumber: 1,
        destinationUrl: internalDestination,
        trackingUrl: internalDestination,
        summary: "Created deterministic internal demo tracking link",
        createdBy: actor,
      };
    }),
  });
  await prisma.affiliateRedirectRevision.createMany({
    data: demoAffiliateRetirementManifest.map((entry) => ({
      id: entry.redirectRevisionId,
      redirectSlugId: entry.redirectId,
      revisionNumber: 1,
      snapshot: { dataset, slug: entry.redirectSlug, destination: "internal-only" },
      summary: "Created deterministic internal demo redirect",
      createdBy: actor,
    })),
  });
}

async function seedOwnedBonus() {
  await prisma.casinoBonus.create({
    data: {
      id: bonusId,
      casinoId: demoCasinoRetirementManifest[0].id,
      slug: "demo-retirement-postgres-test-bonus",
      title: "Disposable owned bonus",
      summary: "Disposable PostgreSQL acceptance fixture",
      createdBy: actor,
      updatedBy: actor,
    },
  });
}

async function serializableApply(
  planSha256: string,
  options?: Parameters<typeof applyDemoCasinoRetirement>[2],
) {
  return prisma.$transaction(
    (transaction) => applyDemoCasinoRetirement(transaction, planSha256, options),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 },
  );
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("real PLAN + APPLY + VERIFY retires exact roots, owned children, and is idempotent", async () => {
  await seedExactRetirementGraph();
  await seedOwnedBonus();
  await prisma.casinoImage.create({
    data: {
      id: imageId,
      casinoId: demoCasinoRetirementManifest[0].id,
      url: "/demo-retirement-postgres-test.png",
      alt: "Disposable retirement acceptance fixture",
    },
  });
  await prisma.adminUser.create({
    data: { id: adminId, email: "demo-retirement-postgres-test@b4gamble.invalid", name: "Demo retirement test" },
  });
  await prisma.auditLog.create({
    data: {
      id: auditId,
      actorId: adminId,
      action: "DEMO_RETIREMENT_TEST",
      entityType: "Casino",
      entityId: demoCasinoRetirementManifest[0].id,
      summary: "Truthful immutable disposable test history",
    },
  });
  await prisma.casino.create({
    data: {
      id: similarRealCasinoId,
      slug: "demo-northstar-real-casino",
      title: "Demo Northstar Real Casino",
      domain: "demo-northstar-real-casino.example",
      createdBy: actor,
      updatedBy: actor,
    },
  });

  const plan = await prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return inspectDemoCasinoRetirementPlan(transaction);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120_000 },
  );
  assert.equal(plan.existingDemoCasinoCount, 25);
  assert.deepEqual(plan.existingAffiliateRows, {
    networks: 1,
    programs: 5,
    offers: 5,
    trackingLinks: 5,
    redirects: 5,
    offerRevisions: 5,
    trackingLinkRevisions: 5,
    redirectRevisions: 5,
  });
  assert.equal(plan.readyToApply, true);
  assert.equal(plan.dependencies.find((dependency) => dependency.table === "CasinoBonus")?.totalRows, 1);
  assert.equal(plan.dependencies.find((dependency) => dependency.table === "CasinoImage")?.totalRows, 1);
  assert.equal(plan.dependencies.find((dependency) => dependency.table === "AuditLog")?.totalRows, 1);

  const applied = await serializableApply(plan.planSha256);
  assert.equal(applied.alreadyRetired, false);
  assert.equal(applied.deleted.casinos, 25);

  const verification = await prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return inspectDemoCasinoRetirementPlan(transaction);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120_000 },
  );
  assert.equal(verification.existingDemoCasinoCount, 0);
  assert.ok(Object.values(verification.existingAffiliateRows).every((count) => count === 0));
  assert.equal(await prisma.casinoBonus.count({ where: { id: bonusId } }), 0);
  assert.equal(await prisma.casinoImage.count({ where: { id: imageId } }), 0);
  assert.equal(await prisma.auditLog.count({ where: { id: auditId } }), 1);
  assert.deepEqual(await prisma.casino.findUnique({
    where: { id: similarRealCasinoId },
    select: { id: true, slug: true, title: true, domain: true },
  }), {
    id: similarRealCasinoId,
    slug: "demo-northstar-real-casino",
    title: "Demo Northstar Real Casino",
    domain: "demo-northstar-real-casino.example",
  });

  const repeated = await serializableApply(plan.planSha256);
  assert.equal(repeated.alreadyRetired, true);
  assert.deepEqual(repeated.deleted, {
    affiliateRedirects: 0,
    affiliateOffers: 0,
    affiliatePrograms: 0,
    affiliateNetworks: 0,
    casinos: 0,
  });
});

test("multi-path closure finds indirect-only protected media and deduplicates a row reached twice", async () => {
  await seedExactRetirementGraph();
  await seedOwnedBonus();
  await prisma.mediaAsset.createMany({
    data: [
      {
        id: indirectMediaId,
        storageKey: "demo-retirement/indirect-only",
        publicUrl: "/demo-retirement-indirect-only.png",
        originalFilename: "indirect-only.png",
        mimeType: "image/png",
        sizeBytes: 1,
        altText: "Indirect only protected media",
        createdBy: actor,
        casinoBonusId: bonusId,
      },
      {
        id: duplicatePathMediaId,
        storageKey: "demo-retirement/direct-and-indirect",
        publicUrl: "/demo-retirement-direct-and-indirect.png",
        originalFilename: "direct-and-indirect.png",
        mimeType: "image/png",
        sizeBytes: 1,
        altText: "Protected media reached through two paths",
        createdBy: actor,
        casinoId: demoCasinoRetirementManifest[0].id,
        casinoBonusId: bonusId,
      },
    ],
  });

  const plan = await inspectDemoCasinoRetirementPlan(prisma);
  const media = plan.dependencies.find((dependency) => dependency.table === "MediaAsset");
  assert.ok(media);
  assert.equal(media.totalRows, 2);
  assert.equal(media.rowsByCasino[demoCasinoRetirementManifest[0].id], 2);
  assert.ok(media.relationPaths.some((path) => path.some((segment) => segment.includes("MediaAsset.casinoBonusId -> CasinoBonus.id"))));
  assert.ok(media.relationPaths.some((path) => path.some((segment) => segment.includes("MediaAsset.casinoId -> Casino.id"))));
  assert.equal(plan.readyToApply, false);
  assert.ok(plan.conflicts.some((conflict) => conflict.table === "MediaAsset" && conflict.code === "DEMO_RETIREMENT_REAL_DATA_CONFLICT"));
});

test("real Partner relationship conflict blocks APPLY without deleting roots", async () => {
  await seedExactRetirementGraph();
  await prisma.partnerCasinoRelationship.create({
    data: {
      id: relationshipId,
      partnerId: demoAffiliateNetworkRetirementManifest.id,
      casinoId: demoCasinoRetirementManifest[0].id,
      confirmedAt: new Date("2026-09-01T00:00:00.000Z"),
      createdBy: actor,
      updatedBy: actor,
    },
  });

  const plan = await inspectDemoCasinoRetirementPlan(prisma);
  assert.equal(plan.readyToApply, false);
  assert.ok(plan.conflicts.some((conflict) => conflict.table === "PartnerCasinoRelationship"));
  await assert.rejects(serializableApply(plan.planSha256), /DEMO_RETIREMENT_REAL_DATA_CONFLICT/);
  assert.equal(await prisma.casino.count({ where: { id: { in: [...demoCasinoRetirementIds] } } }), 25);
});

test("stale reviewed hash fails before any delete", async () => {
  await seedExactRetirementGraph();
  const reviewedPlan = await inspectDemoCasinoRetirementPlan(prisma);
  assert.equal(reviewedPlan.readyToApply, true);
  await prisma.casinoImage.create({
    data: {
      id: staleImageId,
      casinoId: demoCasinoRetirementManifest[0].id,
      url: "/demo-retirement-stale-hash.png",
      alt: "Changes affected-row closure after review",
    },
  });

  await assert.rejects(serializableApply(reviewedPlan.planSha256), /DEMO_RETIREMENT_MANIFEST_DRIFT/);
  assert.equal(await prisma.casino.count({ where: { id: { in: [...demoCasinoRetirementIds] } } }), 25);
  assert.equal(await prisma.affiliateNetwork.count({ where: { id: demoAffiliateNetworkRetirementManifest.id } }), 1);
});

test("forced post-delete verification failure rolls the real transaction back", async () => {
  await seedExactRetirementGraph();
  const reviewedPlan = await inspectDemoCasinoRetirementPlan(prisma);
  let verifiedDeletedState = false;

  await assert.rejects(serializableApply(reviewedPlan.planSha256, {
    postDeleteVerification(verification) {
      verifiedDeletedState = verification.existingDemoCasinoCount === 0
        && Object.values(verification.existingAffiliateRows).every((count) => count === 0);
      throw new Error("FORCED_POST_DELETE_VERIFICATION_FAILURE");
    },
  }), /FORCED_POST_DELETE_VERIFICATION_FAILURE/);

  assert.equal(verifiedDeletedState, true);
  assert.equal(await prisma.casino.count({ where: { id: { in: [...demoCasinoRetirementIds] } } }), 25);
  assert.equal(await prisma.affiliateNetwork.count({ where: { id: demoAffiliateNetworkRetirementManifest.id } }), 1);
  assert.equal(await prisma.affiliateRedirectSlug.count({
    where: { id: { in: demoAffiliateRetirementManifest.map((entry) => entry.redirectId) } },
  }), 5);
});

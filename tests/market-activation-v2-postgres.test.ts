import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { MarketActivationController } from "../lib/market-activation/controller";
import { marketActivationRepository } from "../lib/market-activation/repository";
import { marketActivationRuntime } from "../lib/market-activation/runtime";

const CASINO_ID = "a3100000-0000-4000-8000-000000000001";
const PROFILE_ID = "a3100000-0000-4000-8000-000000000002";
const NETWORK_ID = "a3100000-0000-4000-8000-000000000003";
const PROGRAM_ID = "a3100000-0000-4000-8000-000000000004";
const OFFER_ID = "a3100000-0000-4000-8000-000000000005";
const TRACKING_ID = "a3100000-0000-4000-8000-000000000006";
const REDIRECT_ID = "a3100000-0000-4000-8000-000000000007";
const NOW = new Date("2031-01-15T00:00:00.000Z");
const marketActivationController = new MarketActivationController(marketActivationRepository, {
  verify: async (_activationId, checkedAt = new Date()) => ({
    status: "HEALTHY",
    reason: "TEST_ROUTE_VERIFIED",
    checkedAt,
    method: "HEAD",
    statusCode: 200,
    durationMs: 1,
    redirectCount: 1,
    finalHost: "operator.invalid",
  }),
});

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Market activation PostgreSQL test requires a loopback _ci database");
  }
}

async function cleanup(prisma: PrismaClient) {
  await prisma.marketActivation.deleteMany({ where: { casinoId: CASINO_ID } });
  await prisma.affiliateRedirectSlug.deleteMany({ where: { id: REDIRECT_ID } });
  await prisma.affiliateOffer.deleteMany({ where: { id: OFFER_ID } });
  await prisma.affiliateProgram.deleteMany({ where: { id: PROGRAM_ID } });
  await prisma.affiliateNetwork.deleteMany({ where: { id: NETWORK_ID } });
  await prisma.casino.deleteMany({ where: { id: CASINO_ID } });
}

function activeIntent(idempotencyKey: string, expectedVersion?: number) {
  return {
    casinoId: CASINO_ID,
    countryCode: "PE",
    product: "CASINO" as const,
    redirectSlugId: REDIRECT_ID,
    affiliateOfferId: OFFER_ID,
    primaryTrackingLinkId: TRACKING_ID,
    actorId: "market-activation-postgres-test",
    origin: "FOUNDER" as const,
    reason: "Exercise the canonical exact-market controller.",
    sourceReferences: ["TEST:EVIDENCED-ROUTE"],
    idempotencyKey,
    expectedVersion,
  };
}

test("PostgreSQL controller is idempotent, concurrent, reconciling, exact-market, and auditable", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  await cleanup(prisma);
  try {
    await prisma.casino.create({
      data: {
        id: CASINO_ID,
        slug: "market-activation-test",
        title: "Market Activation Test",
        domain: "market-activation-test.invalid",
        status: "PUBLISHED",
        domainPublicationStatus: "PUBLISHED",
        publishedAt: NOW,
        createdBy: "test",
        updatedBy: "test",
        countries: { create: { id: PROFILE_ID, countryCode: "PE", availability: "UNKNOWN" } },
        versions: { create: { version: 1, status: "PUBLISHED", snapshot: { id: CASINO_ID, slug: "market-activation-test", title: "Market Activation Test" }, publishedAt: NOW, createdBy: "test" } },
      },
    });
    await prisma.affiliateNetwork.create({ data: { id: NETWORK_ID, name: "Activation Test Network", slug: "activation-test-network", active: true, createdBy: "test", updatedBy: "test" } });
    await prisma.affiliateProgram.create({
      data: {
        id: PROGRAM_ID,
        networkId: NETWORK_ID,
        casinoId: CASINO_ID,
        name: "Activation Test Program",
        operator: "Activation Test Operator",
        status: "DRAFT",
        workflowStatus: "DRAFT",
        supportedCountries: ["PE"],
        createdBy: "test",
        updatedBy: "test",
      },
    });
    await prisma.affiliateOffer.create({
      data: {
        id: OFFER_ID,
        programId: PROGRAM_ID,
        casinoId: CASINO_ID,
        internalName: "Activation Test Offer",
        publicLabel: "Activation Test Casino",
        offerType: "CASINO",
        status: "DRAFT",
        geoMode: "ALLOW",
        createdBy: "test",
        updatedBy: "test",
        countries: { create: { countryCode: "PE", mode: "ALLOW" } },
      },
    });
    await prisma.affiliateTrackingLink.create({
      data: {
        id: TRACKING_ID,
        offerId: OFFER_ID,
        label: "Activation Test PE",
        destinationUrl: "https://operator.invalid/casino",
        trackingUrl: "https://tracking.invalid/click",
        geoMode: "ALLOW",
        active: true,
        priority: 100,
        source: "TEST",
        createdBy: "test",
        updatedBy: "test",
        countries: { create: { countryCode: "PE", mode: "ALLOW", productionEligible: false, productionEligibilityEvidence: "TEST:EVIDENCED-ROUTE" } },
      },
    });
    await prisma.affiliateRedirectSlug.create({
      data: { id: REDIRECT_ID, slug: "market-activation-test-casino", casinoId: CASINO_ID, affiliateOfferId: OFFER_ID, active: true, createdBy: "test", updatedBy: "test" },
    });

    const first = await marketActivationController.activateCasinoInGeo(activeIntent("postgres:first"), NOW);
    assert.equal(first.idempotent, false);
    assert.equal(first.activation.status, "ACTIVE");
    assert.equal(first.activation.version, 1);
    assert.equal(first.activation.routeVerificationStatus, "HEALTHY");
    const replay = await marketActivationController.activateCasinoInGeo(activeIntent("postgres:first"), NOW);
    assert.equal(replay.idempotent, true);
    assert.equal(await prisma.marketActivationIntent.count({ where: { activationId: first.activation.id } }), 1);

    const concurrent = await Promise.all([
      marketActivationController.activateCasinoInGeo(activeIntent("postgres:concurrent:a"), new Date(NOW.getTime() + 1_000)),
      marketActivationController.activateCasinoInGeo(activeIntent("postgres:concurrent:b"), new Date(NOW.getTime() + 2_000)),
    ]);
    assert.equal(concurrent.every((result) => result.activation.status === "ACTIVE"), true);
    const afterConcurrent = await prisma.marketActivation.findUniqueOrThrow({ where: { id: first.activation.id } });
    assert.equal(afterConcurrent.version, 1, "same-state concurrent intents must not rewrite canonical state");
    assert.equal(await prisma.marketActivationIntent.count({ where: { activationId: first.activation.id } }), 3);
    assert.ok(await prisma.marketActivationEvent.count({ where: { activationId: first.activation.id } }) >= 6);

    const [program, offer, authority, tracking] = await Promise.all([
      prisma.affiliateProgram.findUniqueOrThrow({ where: { id: PROGRAM_ID } }),
      prisma.affiliateOffer.findUniqueOrThrow({ where: { id: OFFER_ID } }),
      prisma.affiliateTrackingLinkCountry.findUniqueOrThrow({ where: { trackingLinkId_countryCode: { trackingLinkId: TRACKING_ID, countryCode: "PE" } } }),
      prisma.affiliateTrackingLink.findUniqueOrThrow({ where: { id: TRACKING_ID } }),
    ]);
    assert.equal(program.status, "ACTIVE");
    assert.equal(program.workflowStatus, "PUBLISHED");
    assert.equal(offer.status, "ACTIVE");
    assert.equal(authority.productionEligible, true);
    assert.equal(tracking.verifiedAt?.toISOString(), NOW.toISOString(), "only the injected successful route check may persist external verification");
    assert.equal(tracking.lastCheckedAt?.toISOString(), NOW.toISOString());

    await prisma.affiliateProgram.update({ where: { id: PROGRAM_ID }, data: { status: "DRAFT", workflowStatus: "DRAFT" } });
    await prisma.affiliateOffer.update({ where: { id: OFFER_ID }, data: { status: "DRAFT" } });
    await prisma.affiliateTrackingLinkCountry.update({ where: { trackingLinkId_countryCode: { trackingLinkId: TRACKING_ID, countryCode: "PE" } }, data: { productionEligible: false } });
    assert.equal((await marketActivationRuntime.listActive([CASINO_ID], "PE")).length, 1, "legacy drift cannot become an independent authority");
    const reconciled = await marketActivationController.activateCasinoInGeo(activeIntent("postgres:reconcile", afterConcurrent.version), new Date(NOW.getTime() + 3_000));
    assert.equal(reconciled.activation.status, "ACTIVE");
    assert.equal((await prisma.affiliateProgram.findUniqueOrThrow({ where: { id: PROGRAM_ID } })).workflowStatus, "PUBLISHED");

    const blocked = await marketActivationController.activateCasinoInGeo({
      casinoId: CASINO_ID,
      countryCode: "EE",
      product: "CASINO",
      redirectSlugId: REDIRECT_ID,
      actorId: "market-activation-postgres-test",
      origin: "FOUNDER",
      reason: "Missing exact market profile must remain internally preparing.",
      sourceReferences: ["TEST:EVIDENCED-ROUTE"],
      idempotencyKey: "postgres:blocked:ee",
    }, new Date(NOW.getTime() + 4_000));
    assert.equal(blocked.activation.status, "PREPARING");
    assert.equal(blocked.activation.externalBlockerCode, null);
    assert.equal((blocked.activation.diagnostics as { internalPending?: { code?: string } }).internalPending?.code, "MARKET_PROFILE_PENDING");

    const disabled = await marketActivationController.disableCasinoInGeo({
      casinoId: CASINO_ID,
      countryCode: "CL",
      product: "CASINO",
      actorId: "market-activation-postgres-test",
      origin: "FOUNDER",
      reason: "Negative exact-market fixture.",
      sourceReferences: ["TEST:NEGATIVE-FIXTURE"],
      idempotencyKey: "postgres:disabled:cl",
    }, new Date(NOW.getTime() + 5_000));
    assert.equal(disabled.activation.status, "DISABLED");
    assert.equal((await marketActivationRuntime.listActive([CASINO_ID], "CL")).length, 0);
    assert.equal((await marketActivationRuntime.listActive([CASINO_ID], "PE")).length, 1);
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

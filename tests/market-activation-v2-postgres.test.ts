import assert from "node:assert/strict";
import test from "node:test";

import { Prisma, PrismaClient } from "@prisma/client";

import { inspectCasinoMarket0025Release } from "../lib/db/casino-market-0025-release";
import {
  applyExactRouteMaterialization,
  planExactRouteMaterialization,
} from "../lib/market-activation/exact-route-materialization";
import { inspectExactRouteReadiness } from "../lib/market-activation/exact-route-readiness";
import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES,
  safeActivationDestination,
} from "../lib/market-activation/contract";
import { MarketActivationController } from "../lib/market-activation/controller";
import { marketActivationRepository } from "../lib/market-activation/repository";
import { marketActivationRuntime } from "../lib/market-activation/runtime";
import { isSafePublicSlug } from "../lib/public-casino/public-casino-validation";

const NOW = new Date("2031-01-15T00:00:00.000Z");

const PRIMARY = {
  casinoId: "a3100000-0000-4000-8000-000000000001",
  networkId: "a3100000-0000-4000-8000-000000000002",
  programId: "a3100000-0000-4000-8000-000000000003",
  offerId: "a3100000-0000-4000-8000-000000000004",
  trackingId: "a3100000-0000-4000-8000-000000000005",
  redirectId: "a3100000-0000-4000-8000-000000000006",
  slug: "21-prive",
  redirectSlug: "pr3-21-prive-casino",
} as const;

const UNPROVEN = {
  casinoId: "a3100000-0000-4000-8000-000000000011",
  networkId: "a3100000-0000-4000-8000-000000000012",
  programId: "a3100000-0000-4000-8000-000000000013",
  offerId: "a3100000-0000-4000-8000-000000000014",
  trackingId: "a3100000-0000-4000-8000-000000000015",
  redirectId: "a3100000-0000-4000-8000-000000000016",
  slug: "unproven-pr3-casino",
  redirectSlug: "unproven-pr3-casino-route",
} as const;

const previousRuntimeRouteInclude = {
  marketProfile: { select: { casinoId: true, countryCode: true } },
  affiliateOffer: {
    select: {
      id: true,
      casinoId: true,
      casinoBonusId: true,
      program: { select: { casinoId: true } },
      countries: { select: { countryCode: true, mode: true } },
    },
  },
  casinoBonus: { select: { id: true, casinoId: true } },
  primaryTrackingLink: {
    select: {
      id: true,
      offerId: true,
      trackingUrl: true,
      destinationUrl: true,
      countries: { select: { countryCode: true, mode: true } },
    },
  },
  redirectSlug: {
    select: {
      slug: true,
      casinoId: true,
      affiliateOfferId: true,
      casinoBonusId: true,
    },
  },
} satisfies Prisma.MarketActivationInclude;

type PreviousRuntimeRoute = Prisma.MarketActivationGetPayload<{
  include: typeof previousRuntimeRouteInclude;
}>;

const controller = new MarketActivationController(marketActivationRepository, {
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
  const casinoIds = [PRIMARY.casinoId, UNPROVEN.casinoId];
  const networkIds = [PRIMARY.networkId, UNPROVEN.networkId];
  await prisma.marketActivation.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.affiliateRedirectSlug.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.affiliateTrackingLink.deleteMany({ where: { offer: { casinoId: { in: casinoIds } } } });
  await prisma.affiliateOffer.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.affiliateProgram.deleteMany({ where: { casinoId: { in: casinoIds } } });
  await prisma.affiliateNetwork.deleteMany({ where: { id: { in: networkIds } } });
  await prisma.casino.deleteMany({ where: { id: { in: casinoIds } } });
}

async function seedCommercialGraph(prisma: PrismaClient, fixture: typeof PRIMARY | typeof UNPROVEN) {
  await prisma.casino.create({
    data: {
      id: fixture.casinoId,
      slug: fixture.slug,
      title: `PR3 ${fixture.slug}`,
      domain: `${fixture.slug}.invalid`,
      status: "PUBLISHED",
      domainPublicationStatus: "PUBLISHED",
      publishedAt: NOW,
      createdBy: "test",
      updatedBy: "test",
      versions: {
        create: {
          version: 1,
          status: "PUBLISHED",
          snapshot: { id: fixture.casinoId, slug: fixture.slug, title: `PR3 ${fixture.slug}` },
          publishedAt: NOW,
          createdBy: "test",
        },
      },
    },
  });
  await prisma.affiliateNetwork.create({
    data: {
      id: fixture.networkId,
      name: `PR3 ${fixture.slug} Network`,
      slug: `pr3-${fixture.slug}-network`,
      active: true,
      createdBy: "test",
      updatedBy: "test",
    },
  });
  await prisma.affiliateProgram.create({
    data: {
      id: fixture.programId,
      networkId: fixture.networkId,
      casinoId: fixture.casinoId,
      name: `PR3 ${fixture.slug} Program`,
      operator: "PR3 Operator",
      status: "DRAFT",
      workflowStatus: "DRAFT",
      supportedCountries: [],
      createdBy: "test",
      updatedBy: "test",
    },
  });
  await prisma.affiliateOffer.create({
    data: {
      id: fixture.offerId,
      programId: fixture.programId,
      casinoId: fixture.casinoId,
      internalName: `PR3 ${fixture.slug} Offer`,
      publicLabel: "Visit Casino",
      offerType: "CASINO",
      status: "DRAFT",
      geoMode: "BLOCK",
      createdBy: "test",
      updatedBy: "test",
    },
  });
  await prisma.affiliateTrackingLink.create({
    data: {
      id: fixture.trackingId,
      offerId: fixture.offerId,
      label: `PR3 ${fixture.slug} Link`,
      destinationUrl: "https://operator.invalid/casino",
      trackingUrl: "https://tracking.invalid/click",
      geoMode: "BLOCK",
      active: true,
      priority: 100,
      source: "TEST",
      createdBy: "test",
      updatedBy: "test",
      countries: {
        create: {
          countryCode: "PE",
          mode: "BLOCK",
          productionEligible: false,
          productionEligibilityEvidence: "TEST:INERT-LEGACY-METADATA",
        },
      },
    },
  });
  await prisma.affiliateRedirectSlug.create({
    data: {
      id: fixture.redirectId,
      slug: fixture.redirectSlug,
      casinoId: fixture.casinoId,
      affiliateOfferId: fixture.offerId,
      active: true,
      createdBy: "test",
      updatedBy: "test",
    },
  });
}

async function seedPreviousRuntimeCompatibility(
  prisma: PrismaClient,
  fixture: typeof PRIMARY | typeof UNPROVEN,
  input: { profileMarkets: string[]; offerMarkets: string[]; trackingMarkets: string[] },
) {
  await prisma.casinoCountry.createMany({
    data: input.profileMarkets.map((countryCode) => ({
      casinoId: fixture.casinoId,
      countryCode,
      availability: "AVAILABLE" as const,
    })),
  });
  await prisma.affiliateOfferCountry.createMany({
    data: input.offerMarkets.map((countryCode) => ({
      offerId: fixture.offerId,
      countryCode,
      mode: "ALLOW" as const,
    })),
  });
  await prisma.affiliateTrackingLinkCountry.createMany({
    data: input.trackingMarkets.map((countryCode) => ({
      trackingLinkId: fixture.trackingId,
      countryCode,
      mode: "ALLOW" as const,
      productionEligible: false,
      productionEligibilityEvidence: "TEST:PREVIOUS-RUNTIME-COMPATIBILITY",
    })),
  });
}

function previousRuntimeRouteAllowed(record: PreviousRuntimeRoute, requestedMarket: string) {
  const requestedCountry = requestedMarket.slice(0, 2);
  const exactMarket = record.marketCode === requestedMarket;
  const globalFallback = record.marketCode === "ZZ";
  const offerMarketAllows = globalFallback || Boolean(record.affiliateOffer?.countries.some((entry) => (
    entry.countryCode === record.marketCode && entry.mode === "ALLOW"
  )));
  const trackingMarketAllows = globalFallback || Boolean(record.primaryTrackingLink?.countries.some((entry) => (
    entry.countryCode === record.marketCode && entry.mode === "ALLOW"
  )));
  const scopeAllows = exactMarket
    ? Boolean(record.marketProfile
      && record.marketProfile.casinoId === record.casinoId
      && record.marketProfile.countryCode === record.countryCode
      && record.countryCode === requestedCountry)
    : globalFallback
      && record.marketProfile === null
      && MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES.every((country) => (
        record.globalFallbackBlockedCountries.includes(country)
      ))
      && !record.globalFallbackBlockedCountries.includes(requestedCountry);
  return record.desiredState === "ACTIVE"
    && record.status === "ACTIVE"
    && record.routeVerificationStatus === "HEALTHY"
    && record.routeLastCheckedAt !== null
    && scopeAllows
    && offerMarketAllows
    && trackingMarketAllows
    && Boolean(record.affiliateOffer
      && record.affiliateOffer.casinoId === record.casinoId
      && record.affiliateOffer.program.casinoId === record.casinoId
      && record.affiliateOffer.casinoBonusId === record.casinoBonusId)
    && Boolean(!record.casinoBonusId || (record.casinoBonus
      && record.casinoBonus.id === record.casinoBonusId
      && record.casinoBonus.casinoId === record.casinoId))
    && Boolean(record.primaryTrackingLink
      && record.primaryTrackingLink.offerId === record.affiliateOfferId
      && safeActivationDestination(record.primaryTrackingLink.trackingUrl)
      && safeActivationDestination(record.primaryTrackingLink.destinationUrl))
    && Boolean(record.redirectSlug
      && record.redirectSlug.casinoId === record.casinoId
      && record.redirectSlug.affiliateOfferId === record.affiliateOfferId
      && record.redirectSlug.casinoBonusId === record.casinoBonusId
      && isSafePublicSlug(record.redirectSlug.slug));
}

async function previousRuntimeCanRoute(prisma: PrismaClient, casinoId: string, marketCode: string) {
  const routes = await prisma.marketActivation.findMany({
    where: {
      casinoId,
      product: "CASINO",
      marketCode: { in: [marketCode, "ZZ"] },
    },
    include: previousRuntimeRouteInclude,
    orderBy: [{ marketCode: "asc" }, { id: "asc" }],
  });
  const exact = routes.find((route) => route.marketCode === marketCode);
  if (exact) return previousRuntimeRouteAllowed(exact, marketCode);
  const fallback = routes.find((route) => route.marketCode === "ZZ");
  return Boolean(fallback && previousRuntimeRouteAllowed(fallback, marketCode));
}

function activeIntent(marketCode: string, idempotencyKey: string) {
  return {
    casinoId: PRIMARY.casinoId,
    countryCode: marketCode,
    product: "CASINO" as const,
    redirectSlugId: PRIMARY.redirectId,
    affiliateOfferId: PRIMARY.offerId,
    primaryTrackingLinkId: PRIMARY.trackingId,
    actorId: "market-activation-postgres-test",
    origin: "FOUNDER" as const,
    reason: "Exercise one exact canonical market route.",
    sourceReferences: ["TEST:EVIDENCED-ROUTE"],
    idempotencyKey,
  };
}

function legacyRouteData(fixture: typeof PRIMARY | typeof UNPROVEN, id: string) {
  return {
    id,
    casinoId: fixture.casinoId,
    countryCode: "ZZ",
    marketCode: "ZZ",
    product: "CASINO" as const,
    desiredState: "ACTIVE" as const,
    status: "ACTIVE" as const,
    affiliateOfferId: fixture.offerId,
    primaryTrackingLinkId: fixture.trackingId,
    redirectSlugId: fixture.redirectId,
    version: 1,
    controllerVersion: "MARKET-ACTIVATION-V2",
    reconciliationFingerprint: "a".repeat(64),
    requestedBy: "legacy-fixture",
    requestedAt: NOW,
    requestReason: "Disposable pre-0040 legacy fixture.",
    sourceReferences: ["TEST:LEGACY-ZZ-EVIDENCE"],
    activatedAt: NOW,
    lastReconciledAt: NOW,
    routeVerificationStatus: "HEALTHY" as const,
    routeLastCheckedAt: NOW,
    routeFinalHost: "operator.invalid",
    routeVerificationDetail: "TEST_ROUTE_VERIFIED",
    globalFallbackBlockedCountries: [...MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES],
    diagnostics: { classification: "DETECTED" },
  };
}

async function seedPostMigrationLegacyRows(prisma: PrismaClient) {
  const [guard] = await prisma.$queryRawUnsafe<Array<{ enabled: string }>>(`
    SELECT tgenabled AS enabled
    FROM pg_trigger
    WHERE tgname = 'MarketActivation_guard_new_scope_trigger'
      AND tgrelid = 'public."MarketActivation"'::regclass
      AND NOT tgisinternal
  `);
  assert.equal(guard?.enabled, "O", "0040 scope-change guard must exist and be enabled");
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketActivation" DISABLE TRIGGER "MarketActivation_guard_new_scope_trigger"');
  try {
    await prisma.marketActivation.create({
      data: legacyRouteData(PRIMARY, "a3100000-0000-4000-8000-000000000021"),
    });
    await prisma.marketActivation.create({
      data: legacyRouteData(UNPROVEN, "a3100000-0000-4000-8000-000000000022"),
    });
    await prisma.marketActivation.create({
      data: {
        ...legacyRouteData(PRIMARY, "a3100000-0000-4000-8000-000000000023"),
        countryCode: "US",
        marketCode: "US-VA",
        globalFallbackBlockedCountries: [],
        requestReason: "Disposable pre-0040 non-canonical route fixture.",
      },
    });
  } finally {
    await prisma.$executeRawUnsafe('ALTER TABLE "MarketActivation" ENABLE TRIGGER "MarketActivation_guard_new_scope_trigger"');
  }
}

async function unrelatedCounts(prisma: PrismaClient) {
  const [crm, partnerSupport, offerCountries, trackingCountries] = await Promise.all([
    prisma.commercialOpportunity.count(),
    prisma.partnerCasinoMarketSupport.count(),
    prisma.affiliateOfferCountry.count(),
    prisma.affiliateTrackingLinkCountry.count(),
  ]);
  return { crm, partnerSupport, offerCountries, trackingCountries };
}

test("PostgreSQL exact-route authority ignores legacy GEO permissions and rejects new fallback authority", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  await cleanup(prisma);
  try {
    await seedCommercialGraph(prisma, PRIMARY);

    const first = await controller.activateCasinoInGeo(activeIntent("PE", "pr3:exact:pe"), NOW);
    assert.equal(first.activation.status, "ACTIVE");
    assert.equal(first.activation.marketProfileId, null, "factual presentation profile is not route permission");
    assert.equal(first.activation.routeVerificationStatus, "HEALTHY");
    assert.equal((await marketActivationRuntime.listActive([PRIMARY.casinoId], "PE"))[0]?.id, first.activation.id);

    const [program, offer, legacyCountry] = await Promise.all([
      prisma.affiliateProgram.findUniqueOrThrow({ where: { id: PRIMARY.programId } }),
      prisma.affiliateOffer.findUniqueOrThrow({ where: { id: PRIMARY.offerId } }),
      prisma.affiliateTrackingLinkCountry.findUniqueOrThrow({
        where: { trackingLinkId_countryCode: { trackingLinkId: PRIMARY.trackingId, countryCode: "PE" } },
      }),
    ]);
    assert.equal(program.status, "DRAFT");
    assert.equal(program.workflowStatus, "DRAFT");
    assert.equal(offer.status, "DRAFT");
    assert.equal(legacyCountry.mode, "BLOCK");
    assert.equal(legacyCountry.productionEligible, false);

    await prisma.affiliateTrackingLinkCountry.create({
      data: {
        trackingLinkId: PRIMARY.trackingId,
        countryCode: "CL",
        mode: "ALLOW",
        productionEligible: true,
        productionEligibilityVerifiedAt: NOW,
        productionEligibilityEvidence: "TEST:INERT-ORPHAN",
      },
    });
    await prisma.affiliateOfferCountry.create({
      data: {
        offerId: PRIMARY.offerId,
        countryCode: "CL",
        mode: "ALLOW",
      },
    });
    assert.deepEqual(await inspectCasinoMarket0025Release(prisma), { state: "already_applied_and_verified" });
    assert.equal((await marketActivationRuntime.listActive([PRIMARY.casinoId], "CL")).length, 0);

    await assert.rejects(
      controller.activateCasinoInGeo(activeIntent("ZZ", "pr3:forbidden:zz"), NOW),
      /MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN/,
    );
    await assert.rejects(
      prisma.marketActivation.create({
        data: {
          ...legacyRouteData(PRIMARY, "a3100000-0000-4000-8000-000000000023"),
          desiredState: "DISABLED",
          status: "DISABLED",
          activatedAt: null,
          routeVerificationStatus: "NOT_CHECKED",
          routeLastCheckedAt: null,
        },
      }),
      /MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN/,
    );
    await assert.rejects(
      controller.disableCasinoInGeo({
        casinoId: PRIMARY.casinoId,
        countryCode: "CL",
        actorId: "market-activation-postgres-test",
        origin: "FOUNDER",
        reason: "No negative authority row may be manufactured.",
        sourceReferences: ["TEST:NO-NEGATIVE-SHADOW"],
        idempotencyKey: "pr3:disable:missing:cl",
      }, NOW),
      /MARKET_ACTIVATION_ROUTE_NOT_FOUND/,
    );
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

test("PostgreSQL cutover plan blocks unsafe previous-runtime state and preserves old/new route parity", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  await cleanup(prisma);
  try {
    await seedCommercialGraph(prisma, PRIMARY);
    await seedCommercialGraph(prisma, UNPROVEN);
    await prisma.marketActivation.create({
      data: {
        id: "a3100000-0000-4000-8000-000000000024",
        casinoId: PRIMARY.casinoId,
        countryCode: "IE",
        marketCode: "IE",
        product: "CASINO",
        desiredState: "DISABLED",
        status: "DISABLED",
        disabledAt: NOW,
        affiliateOfferId: PRIMARY.offerId,
        primaryTrackingLinkId: PRIMARY.trackingId,
        redirectSlugId: PRIMARY.redirectId,
        version: 1,
        controllerVersion: "MARKET-ACTIVATION-V3-EXACT-ROUTES",
        reconciliationFingerprint: "b".repeat(64),
        requestedBy: "conflict-fixture",
        requestedAt: NOW,
        requestReason: "Existing disabled exact target must conflict.",
        sourceReferences: ["TEST:EXACT-CONFLICT"],
      },
    });
    await seedPostMigrationLegacyRows(prisma);

    const beforePlanCounts = {
      routes: await prisma.marketActivation.count(),
      intents: await prisma.marketActivationIntent.count(),
      events: await prisma.marketActivationEvent.count(),
    };
    const blockedPlan = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return planExactRouteMaterialization(transaction);
    });
    assert.equal(blockedPlan.readyToApply, false);
    assert.equal(blockedPlan.cutoverSafe, false);
    assert.deepEqual(
      new Set(blockedPlan.blockers.map((blocker) => blocker.code)),
      new Set(["EXACT_ROUTE_CONFLICT", "PREVIOUS_RUNTIME_CUTOVER_UNSAFE", "UNPROVEN_ROUTE_MATERIALIZATION"]),
    );
    assert.deepEqual({
      routes: await prisma.marketActivation.count(),
      intents: await prisma.marketActivationIntent.count(),
      events: await prisma.marketActivationEvent.count(),
    }, beforePlanCounts, "read-only plan must not mutate");
    await assert.rejects(
      applyExactRouteMaterialization(prisma, NOW),
      /EXACT_ROUTE_READINESS_BLOCKED:NON_CANONICAL_ROUTE_SCOPE=1/,
    );
    assert.equal(await prisma.marketActivation.count(), beforePlanCounts.routes);
    await prisma.marketActivation.delete({ where: { id: "a3100000-0000-4000-8000-000000000023" } });
    await assert.rejects(applyExactRouteMaterialization(prisma, NOW), /UNPROVEN_ROUTE_MATERIALIZATION/);
    assert.equal(await prisma.marketActivation.count(), beforePlanCounts.routes - 1);

    await prisma.marketActivation.delete({ where: { id: "a3100000-0000-4000-8000-000000000024" } });
    await prisma.marketActivation.delete({ where: { id: "a3100000-0000-4000-8000-000000000022" } });
    const compatibilityBeforeUnsafePlan = await unrelatedCounts(prisma);
    const unsafeCutoverPlan = await planExactRouteMaterialization(prisma);
    assert.equal(unsafeCutoverPlan.readyToApply, false);
    assert.equal(unsafeCutoverPlan.cutoverSafe, false);
    assert.ok(unsafeCutoverPlan.blockers.length > 0);
    assert.ok(unsafeCutoverPlan.blockers.every((blocker) => blocker.code === "PREVIOUS_RUNTIME_CUTOVER_UNSAFE"));
    assert.deepEqual(
      new Set(unsafeCutoverPlan.blockers.map((blocker) => blocker.prerequisite)),
      new Set(["MARKET_PROFILE_BINDING", "OFFER_MARKET_ALLOW", "TRACKING_MARKET_ALLOW"]),
    );
    assert.deepEqual(await unrelatedCounts(prisma), compatibilityBeforeUnsafePlan, "unsafe plan must not repair compatibility state");

    await seedPreviousRuntimeCompatibility(prisma, PRIMARY, {
      profileMarkets: ["IE", "MT"],
      offerMarkets: ["IE", "MT"],
      trackingMarkets: ["IE"],
    });
    const partiallyCompatiblePlan = await planExactRouteMaterialization(prisma);
    assert.equal(partiallyCompatiblePlan.cutoverSafe, false);
    assert.deepEqual(
      partiallyCompatiblePlan.blockers.map((blocker) => ({
        code: blocker.code,
        marketCode: blocker.marketCode,
        prerequisite: blocker.prerequisite,
      })),
      [{
        code: "PREVIOUS_RUNTIME_CUTOVER_UNSAFE",
        marketCode: "MT",
        prerequisite: "TRACKING_MARKET_ALLOW",
      }],
    );
    await prisma.affiliateTrackingLinkCountry.create({
      data: {
        trackingLinkId: PRIMARY.trackingId,
        countryCode: "MT",
        mode: "ALLOW",
        productionEligible: false,
        productionEligibilityEvidence: "TEST:PREVIOUS-RUNTIME-COMPATIBILITY",
      },
    });

    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "IE"), true);
    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "MT"), true);
    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "GB"), false);
    const unrelatedBefore = await unrelatedCounts(prisma);
    const compatibilityRowsBefore = await Promise.all([
      prisma.affiliateOfferCountry.findMany({
        where: { offerId: PRIMARY.offerId, countryCode: { in: ["IE", "MT"] } },
        orderBy: { countryCode: "asc" },
      }),
      prisma.affiliateTrackingLinkCountry.findMany({
        where: { trackingLinkId: PRIMARY.trackingId, countryCode: { in: ["IE", "MT"] } },
        orderBy: { countryCode: "asc" },
      }),
    ]);
    const readyPlan = await planExactRouteMaterialization(prisma);
    assert.equal(readyPlan.readyToApply, true);
    assert.equal(readyPlan.cutoverSafe, true);
    assert.deepEqual(readyPlan.create.map((operation) => operation.marketCode), ["IE", "MT"]);
    assert.equal(readyPlan.disable.length, 1);
    assert.equal(readyPlan.before.activeLegacyZzCount, 1);
    assert.equal(readyPlan.after.activeLegacyZzCount, 0);
    assert.ok(readyPlan.semanticProjection.every((entry) => entry.legacyRoutableWithinManifest
      && entry.exactRoutableAfterPlan
      && entry.previousRuntimeRoutableAfterPlan));

    const applied = await applyExactRouteMaterialization(prisma, NOW);
    assert.equal(applied.createdRouteCount, 2);
    assert.equal(applied.disabledLegacyZzCount, 1);
    assert.equal(applied.idempotent, false);
    const exactRoutes = await prisma.marketActivation.findMany({
      where: { casinoId: PRIMARY.casinoId, marketCode: { in: ["IE", "MT"] } },
      orderBy: { marketCode: "asc" },
    });
    assert.deepEqual(exactRoutes.map((route) => route.marketCode), ["IE", "MT"]);
    assert.ok(exactRoutes.every((route) => route.primaryTrackingLinkId === PRIMARY.trackingId
      && route.redirectSlugId === PRIMARY.redirectId
      && route.status === "ACTIVE"
      && route.routeVerificationStatus === "HEALTHY"));
    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "IE"), true);
    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "MT"), true);
    assert.equal(await previousRuntimeCanRoute(prisma, PRIMARY.casinoId, "GB"), false);
    assert.equal((await marketActivationRuntime.listActive([PRIMARY.casinoId], "IE"))[0]?.primaryTrackingLinkId, PRIMARY.trackingId);
    assert.equal((await marketActivationRuntime.listActive([PRIMARY.casinoId], "MT"))[0]?.primaryTrackingLinkId, PRIMARY.trackingId);
    assert.equal((await marketActivationRuntime.listActive([PRIMARY.casinoId], "GB")).length, 0, "blocked legacy market must stay unavailable");
    assert.deepEqual(await Promise.all([
      prisma.affiliateOfferCountry.findMany({
        where: { offerId: PRIMARY.offerId, countryCode: { in: ["IE", "MT"] } },
        orderBy: { countryCode: "asc" },
      }),
      prisma.affiliateTrackingLinkCountry.findMany({
        where: { trackingLinkId: PRIMARY.trackingId, countryCode: { in: ["IE", "MT"] } },
        orderBy: { countryCode: "asc" },
      }),
    ]), compatibilityRowsBefore, "materialization must not create or alter legacy GEO authority");
    assert.deepEqual(await unrelatedCounts(prisma), unrelatedBefore, "materialization must not mutate unrelated business tables");
    assert.equal((await inspectExactRouteReadiness(prisma)).ready, true);

    const replay = await applyExactRouteMaterialization(prisma, new Date(NOW.getTime() + 1_000));
    assert.equal(replay.idempotent, true);
    assert.equal(replay.createdRouteCount, 0);
    assert.equal(replay.disabledLegacyZzCount, 0);
    assert.equal(await prisma.marketActivation.count({ where: { casinoId: PRIMARY.casinoId, marketCode: { in: ["IE", "MT"] } } }), 2);
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});

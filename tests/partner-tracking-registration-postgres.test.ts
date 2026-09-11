import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { partnerTrackingLinkHash } from "../lib/commercial/partner-tracking-registration-contract";
import { PartnerTrackingRegistrationService } from "../lib/commercial/partner-tracking-registration-service";
import { CURRENT_PARTNER_INVENTORY, CURRENT_PARTNER_RECORDS } from "../lib/current-partner-rollout/inventory";
import { MarketActivationController } from "../lib/market-activation/controller";
import { MarketActivationRepository } from "../lib/market-activation/repository";
import { MarketActivationRuntime } from "../lib/market-activation/runtime";
import { PartnerTrackingRegistrationRepository } from "../lib/repositories/partner-tracking-registration.repository";

const PARTNER = CURRENT_PARTNER_RECORDS.find((record) => record.name === "Super Partners")!;
const ACTOR_ID = "71000000-0000-4000-8000-000000000001";
const CASINO_ID = "71000000-0000-4000-8000-000000000003";
const NOW = new Date("2026-09-10T12:00:00.000Z");
const GENERIC_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=generic";
const EXACT_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=exact-es";
const EXACT_ABSENT_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=exact-fr";
const REPLACEMENT_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=replacement";
const HEALTHY_REPLACEMENT_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=healthy-replacement";

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  for (const raw of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const url = new URL(raw ?? "");
    assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
    assert.ok(url.pathname.endsWith("_ci"));
  }
}

async function cleanup(client: PrismaClient) {
  await client.marketActivation.deleteMany({ where: { casinoId: CASINO_ID } });
  await client.partnerCasinoMarketSupport.deleteMany({ where: { casinoId: CASINO_ID } });
  await client.commercialOpportunity.deleteMany({ where: { id: PARTNER.opportunityId } });
  await client.affiliateRedirectSlug.deleteMany({ where: { casinoId: CASINO_ID } });
  await client.affiliateOffer.deleteMany({ where: { casinoId: CASINO_ID } });
  await client.affiliateProgram.deleteMany({ where: { casinoId: CASINO_ID } });
  await client.affiliateNetwork.deleteMany({ where: { slug: "super-partners" } });
  await client.casino.deleteMany({ where: { id: CASINO_ID } });
  await client.adminUser.deleteMany({ where: { id: ACTOR_ID } });
}

test("PostgreSQL tracking registration is concurrent, idempotent, precedence-safe, replaceable, and redacted", async () => {
  assertDisposablePostgres();
  const client = new PrismaClient();
  const repository = new PartnerTrackingRegistrationRepository(client);
  await cleanup(client);
  try {
    await client.adminUser.create({ data: {
      id: ACTOR_ID,
      email: "partner-tracking-postgres@invalid.example",
      name: "Partner tracking PostgreSQL fixture",
      role: "AFFILIATE_MANAGER",
    } });
    await client.casino.create({ data: {
      id: CASINO_ID,
      title: "Betway",
      slug: "betway",
      domain: "betway.example",
      websiteUrl: "https://betway.example/",
      status: "PUBLISHED",
      domainPublicationStatus: "PUBLISHED",
      publishedAt: NOW,
      createdBy: ACTOR_ID,
      updatedBy: ACTOR_ID,
      versions: { create: {
        version: 1,
        status: "PUBLISHED",
        snapshot: { id: CASINO_ID, title: "Betway", slug: "betway" },
        publishedAt: NOW,
        createdBy: ACTOR_ID,
      } },
    } });
    await client.commercialOpportunity.create({ data: {
      id: PARTNER.opportunityId,
      displayName: PARTNER.name,
      normalizedName: "super partners",
      organizationType: "AFFILIATE_NETWORK",
      stage: "ACTIVE",
      createdBy: ACTOR_ID,
      updatedBy: ACTOR_ID,
      tasks: { create: {
        type: "ACTIVATION",
        title: "MISSING_TRACKING_ROUTE: no current Super Partners route is captured.",
        idempotencyKey: "partner-tracking-postgres-missing",
        createdBy: ACTOR_ID,
      } },
    } });

    const target = await repository.resolveTarget({
      partner: PARTNER.name,
      partnerId: PARTNER.opportunityId,
      partnerAliases: PARTNER.aliases,
      casino: "betway",
      requestedGeos: ["AT", "PT", "US"],
    });
    assert.equal(target.casinoId, CASINO_ID);
    assert.equal(target.affiliateNetworkId, null);
    assert.equal(target.rows.length, 11);

    const stageInput = {
      target,
      trackingUrl: GENERIC_URL,
      linkHash: partnerTrackingLinkHash(GENERIC_URL),
      scope: "GENERIC" as const,
      geo: null,
      supportedGeos: ["AT", "PT", "US"],
      actorId: ACTOR_ID,
      now: NOW,
    };
    const [first, second] = await Promise.all([repository.stage(stageInput), repository.stage(stageInput)]);
    assert.ok(first.target.affiliateNetworkId);
    assert.equal(await client.affiliateNetwork.count({ where: { slug: "super-partners" } }), 1);
    assert.equal(first.trackingLinkId, second.trackingLinkId);
    assert.equal(await client.affiliateTrackingLink.count({ where: { offerId: first.affiliateOfferId } }), 1);
    assert.equal(await client.affiliateOffer.count({ where: { casinoId: CASINO_ID } }), 1);
    assert.equal(await client.affiliateProgram.count({ where: { casinoId: CASINO_ID } }), 1);
    assert.deepEqual(first.affectedRows.map((row) => row.geo), ["AT", "PT", "US"]);
    assert.equal(await client.partnerCasinoMarketSupport.count({ where: { casinoId: CASINO_ID } }), 3);
    assert.equal(await client.casinoCountry.count({ where: { casinoId: CASINO_ID, countryCode: { in: ["AT", "PT", "US"] }, availability: "AVAILABLE" } }), 3);
    assert.equal(await client.casinoCountryEvidence.count({
      where: {
        marketProfile: { casinoId: CASINO_ID },
        sourceReference: { startsWith: "COMMERCIAL_MCP_FOUNDER_MARKET_ASSERTION:" },
      },
    }), 3);
    assert.equal(first.newSupportedGeoCount + second.newSupportedGeoCount, 3);
    const neutralOffer = await client.affiliateOffer.findUniqueOrThrow({ where: { id: first.affiliateOfferId } });
    assert.equal(neutralOffer.publicLabel, "Visit Casino");
    assert.equal(neutralOffer.payoutModel, "UNKNOWN");
    assert.equal(neutralOffer.terms, null);

    await repository.recordVerification({
      stage: first,
      verification: "HEALTHY",
      reason: "GET_FALLBACK_OK",
      finalHost: "betway.example",
      redirectCount: 1,
      statusCode: 200,
      checkedAt: NOW,
      actorId: ACTOR_ID,
    });
    const promotedGeneric = await repository.promote({ stage: first, finalHost: "betway.example", redirectCount: 1, checkedAt: NOW, actorId: ACTOR_ID });
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: first.trackingLinkId } })).active, true);
    assert.equal(await client.affiliateTrackingLinkCountry.count({ where: { trackingLinkId: first.trackingLinkId } }), 3);
    assert.equal((await client.affiliateRedirectSlug.findUniqueOrThrow({ where: { id: first.redirectId } })).active, true);

    await client.affiliateOffer.update({ where: { id: first.affiliateOfferId }, data: {
      payoutModel: "REV_SHARE",
      revenueSharePercentage: 25,
      terms: "Validated fixture terms must survive route registration.",
    } });
    const restartedRepository = new PartnerTrackingRegistrationRepository(client);
    const restartedTarget = await restartedRepository.resolveTarget({
      partner: PARTNER.name,
      partnerId: PARTNER.opportunityId,
      partnerAliases: PARTNER.aliases,
      casino: "betway",
      requestedGeos: null,
    });
    assert.ok(restartedTarget.rows.some((row) => row.geo === "US" && row.supportOrigin === "RUNTIME"));

    let controllerVerifierCalls = 0;
    let registrationVerifierCalls = 0;
    const controller = new MarketActivationController(
      new MarketActivationRepository(),
      { async verify() { controllerVerifierCalls += 1; throw new Error("batch verification must be reused"); } },
      { async allowed() { return true; } },
      { async resolve() { throw new Error("country-only fixtures must not require subdivision authority"); } } as never,
    );
    const registrationService = new PartnerTrackingRegistrationService(
      restartedRepository,
      (async () => {
        registrationVerifierCalls += 1;
        return { status: "HEALTHY", reason: "GET_FALLBACK_OK", method: "GET", statusCode: 200, durationMs: 8, redirectCount: 1, finalHost: "betway.example" };
      }) as never,
      controller,
      async () => {},
      { async resolve(input) { return { countryCode: input.requestCountrySignal.countryCode, commercialAllowed: true, referralAllowed: true, reasonCode: "POLICY_ALLOWED" }; } },
    );
    const registeredBatch = await registrationService.register({
      partner: PARTNER.name,
      casino: "Betway",
      trackingUrl: GENERIC_URL,
      supportedGeos: ["US", "at", "PT", "US"],
    }, { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" }, new Date(NOW.getTime() + 500));
    assert.equal(registeredBatch.status, "NO_CHANGE");
    assert.equal(registrationVerifierCalls, 1);
    assert.equal(controllerVerifierCalls, 0);
    assert.equal(await client.marketActivation.count({
      where: { casinoId: CASINO_ID, marketCode: { in: ["AT", "PT", "US"] }, status: "ACTIVE", routeVerificationStatus: "HEALTHY" },
    }), 3);
    const runtime = new MarketActivationRuntime(client);
    const publicUs = await runtime.listPublicRoutes([CASINO_ID], "US", new Date(NOW.getTime() + 600));
    assert.equal(publicUs.length, 1);
    assert.equal(publicUs[0]?.slug, "betway-casino");
    assert.equal((await runtime.resolveRedirect("betway-casino", "US"))?.marketCode, "US");
    assert.equal((await runtime.listPublicRoutes([CASINO_ID], "NZ", new Date(NOW.getTime() + 600))).length, 0);

    const exactAbsent = await registrationService.register({
      partner: PARTNER.name,
      casino: "Betway",
      trackingUrl: EXACT_ABSENT_URL,
      geo: "FR",
    }, { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" }, new Date(NOW.getTime() + 650));
    assert.equal(exactAbsent.results[0]?.marketSupport, "CREATED");
    assert.equal(exactAbsent.results[0]?.finalState, "ACTIVE_HEALTHY");
    assert.equal(await client.partnerCasinoMarketSupport.count({ where: { casinoId: CASINO_ID, marketCode: "FR" } }), 1);
    assert.equal((await runtime.listActive([CASINO_ID], "FR"))[0]?.primaryTrackingLinkId, exactAbsent.trackingLinkId);

    const exactRuntime = await registrationService.register({
      partner: PARTNER.name,
      casino: "Betway",
      trackingUrl: EXACT_URL,
      geo: "US",
    }, { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" }, new Date(NOW.getTime() + 700));
    assert.equal(exactRuntime.trackingScope, "EXACT_GEO");
    assert.equal(exactRuntime.results.length, 1);
    assert.equal(exactRuntime.results[0]?.finalState, "ACTIVE_HEALTHY");
    const publicExactUs = await runtime.listActive([CASINO_ID], "US");
    assert.equal(publicExactUs[0]?.primaryTrackingLinkId, exactRuntime.trackingLinkId);
    assert.equal((await runtime.listActive([CASINO_ID], "AT"))[0]?.primaryTrackingLinkId, first.trackingLinkId);

    const beforeLegalBatchChecks = registrationVerifierCalls;
    const legalBatchInput = {
      partner: PARTNER.name,
      casino: "Betway",
      trackingUrl: GENERIC_URL,
      supportedGeos: ["AU", "NZ", "GR"],
    };
    const legalBatch = await registrationService.register(
      legalBatchInput,
      { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" },
      new Date(NOW.getTime() + 800),
    );
    assert.equal(registrationVerifierCalls - beforeLegalBatchChecks, 1);
    assert.deepEqual(legalBatch.results.map((row) => [row.geo, row.finalState]), [
      ["AU", "ACTIVE_HEALTHY"],
      ["GR", "ACTION_REQUIRED_REGULATORY"],
      ["NZ", "BLOCKED_BY_LAW"],
    ]);
    const durableCounts = await Promise.all([
      client.partnerCasinoMarketSupport.count({ where: { casinoId: CASINO_ID } }),
      client.casinoCountryEvidence.count({ where: { marketProfile: { casinoId: CASINO_ID }, sourceReference: { startsWith: "COMMERCIAL_MCP_FOUNDER_MARKET_ASSERTION:" } } }),
      client.affiliateProgram.count({ where: { casinoId: CASINO_ID } }),
      client.affiliateOffer.count({ where: { casinoId: CASINO_ID } }),
      client.affiliateTrackingLink.count({ where: { offerId: first.affiliateOfferId } }),
      client.marketActivation.count({ where: { casinoId: CASINO_ID } }),
    ]);
    await registrationService.register(
      legalBatchInput,
      { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" },
      new Date(NOW.getTime() + 900),
    );
    assert.deepEqual(await Promise.all([
      client.partnerCasinoMarketSupport.count({ where: { casinoId: CASINO_ID } }),
      client.casinoCountryEvidence.count({ where: { marketProfile: { casinoId: CASINO_ID }, sourceReference: { startsWith: "COMMERCIAL_MCP_FOUNDER_MARKET_ASSERTION:" } } }),
      client.affiliateProgram.count({ where: { casinoId: CASINO_ID } }),
      client.affiliateOffer.count({ where: { casinoId: CASINO_ID } }),
      client.affiliateTrackingLink.count({ where: { offerId: first.affiliateOfferId } }),
      client.marketActivation.count({ where: { casinoId: CASINO_ID } }),
    ]), durableCounts);

    const concurrentInput = {
      partner: PARTNER.name,
      casino: "Betway",
      trackingUrl: GENERIC_URL,
      supportedGeos: ["PL", "CZ", "EE"],
    };
    const beforeConcurrentChecks = registrationVerifierCalls;
    const concurrentResults = await Promise.all([
      registrationService.register(concurrentInput, { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" }, new Date(NOW.getTime() + 950)),
      registrationService.register(concurrentInput, { actorId: ACTOR_ID, clientId: "partner-tracking-postgres-client" }, new Date(NOW.getTime() + 951)),
    ]);
    assert.equal(registrationVerifierCalls - beforeConcurrentChecks, 2, "each concurrent invocation verifies its batch once");
    assert.ok(concurrentResults.every((result) => result.results.length === 3 && result.results.every((row) => row.finalState === "ACTIVE_HEALTHY")));
    assert.equal(await client.partnerCasinoMarketSupport.count({ where: { casinoId: CASINO_ID, marketCode: { in: ["PL", "CZ", "EE"] } } }), 3);
    assert.equal(await client.casinoCountryEvidence.count({
      where: {
        marketProfile: { casinoId: CASINO_ID },
        sourceReference: { startsWith: "COMMERCIAL_MCP_FOUNDER_MARKET_ASSERTION:" },
        OR: [
          { fieldKeys: { has: "operatorMarketSupported:PL" } },
          { fieldKeys: { has: "operatorMarketSupported:CZ" } },
          { fieldKeys: { has: "operatorMarketSupported:EE" } },
        ],
      },
    }), 3);
    assert.equal(await client.marketActivation.count({ where: { casinoId: CASINO_ID, marketCode: { in: ["PL", "CZ", "EE"] } } }), 3);
    assert.equal(controllerVerifierCalls, 0);

    const exactTarget = await restartedRepository.resolveTarget({
      partner: PARTNER.name,
      partnerId: PARTNER.opportunityId,
      partnerAliases: PARTNER.aliases,
      casino: "betway",
      requestedGeos: ["ES"],
    });
    const exact = await repository.stage({
      ...stageInput,
      target: exactTarget,
      trackingUrl: EXACT_URL,
      linkHash: partnerTrackingLinkHash(EXACT_URL),
      scope: "EXACT_GEO",
      geo: "ES",
      supportedGeos: null,
      now: new Date(NOW.getTime() + 1_000),
    });
    assert.deepEqual(exact.affectedRows.map((row) => row.geo), ["ES"]);
    await repository.recordVerification({ stage: exact, verification: "HEALTHY", reason: "GET_FALLBACK_OK", finalHost: "betway.example", redirectCount: 1, statusCode: 200, checkedAt: new Date(NOW.getTime() + 2_000), actorId: ACTOR_ID });
    await repository.promote({ stage: exact, finalHost: "betway.example", redirectCount: 1, checkedAt: new Date(NOW.getTime() + 2_000), actorId: ACTOR_ID });

    const exactIeTarget = await restartedRepository.resolveTarget({
      partner: PARTNER.name,
      partnerId: PARTNER.opportunityId,
      partnerAliases: PARTNER.aliases,
      casino: "betway",
      requestedGeos: ["IE"],
    });
    const exactIeUsingGenericValue = await repository.stage({
      ...stageInput,
      target: exactIeTarget,
      trackingUrl: GENERIC_URL,
      linkHash: partnerTrackingLinkHash(GENERIC_URL),
      scope: "EXACT_GEO",
      geo: "IE",
      supportedGeos: null,
      now: new Date(NOW.getTime() + 2_500),
    });
    assert.notEqual(exactIeUsingGenericValue.trackingLinkId, first.trackingLinkId, "scope identity must not be overwritten when the URL value is reused");
    assert.deepEqual(exactIeUsingGenericValue.affectedRows.map((row) => row.geo), ["IE"]);
    await repository.recordVerification({ stage: exactIeUsingGenericValue, verification: "HEALTHY", reason: "GET_FALLBACK_OK", finalHost: "betway.example", redirectCount: 1, statusCode: 200, checkedAt: new Date(NOW.getTime() + 2_700), actorId: ACTOR_ID });
    await repository.promote({ stage: exactIeUsingGenericValue, finalHost: "betway.example", redirectCount: 1, checkedAt: new Date(NOW.getTime() + 2_700), actorId: ACTOR_ID });

    const replacementTarget = await restartedRepository.resolveTarget({
      partner: PARTNER.name,
      partnerId: PARTNER.opportunityId,
      partnerAliases: PARTNER.aliases,
      casino: "betway",
      requestedGeos: null,
    });
    const genericStageInput = {
      ...stageInput,
      target: replacementTarget,
      supportedGeos: null,
    };
    const replacement = await repository.stage({
      ...genericStageInput,
      trackingUrl: REPLACEMENT_URL,
      linkHash: partnerTrackingLinkHash(REPLACEMENT_URL),
      now: new Date(NOW.getTime() + 3_000),
    });
    assert.equal(replacement.affectedRows.some((row) => row.geo === "ES"), false);
    assert.equal(replacement.affectedRows.some((row) => row.geo === "IE"), false);
    assert.equal(replacement.affectedRows.some((row) => row.geo === "AT"), true, "runtime support must survive restart and join later generic replacement scope");
    await repository.recordVerification({ stage: replacement, verification: "BROKEN", reason: "HTTP_404", finalHost: "betway.example", redirectCount: 1, statusCode: 404, checkedAt: new Date(NOW.getTime() + 4_000), actorId: ACTOR_ID });
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: first.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: exact.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: replacement.trackingLinkId } })).active, false);
    const redactedCandidate = await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: replacement.trackingLinkId } });
    assert.equal(redactedCandidate.trackingUrl.includes("redaction-fixture"), false);
    assert.equal(redactedCandidate.destinationUrl.includes("redaction-fixture"), false);

    const retriedReplacement = await repository.stage({
      ...genericStageInput,
      trackingUrl: REPLACEMENT_URL,
      linkHash: partnerTrackingLinkHash(REPLACEMENT_URL),
      now: new Date(NOW.getTime() + 4_500),
    });
    assert.equal(retriedReplacement.trackingLinkId, replacement.trackingLinkId);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: replacement.trackingLinkId } })).trackingUrl, REPLACEMENT_URL);
    await repository.recordVerification({
      stage: retriedReplacement,
      verification: "BROKEN",
      reason: "HTTP_404",
      finalHost: "betway.example",
      redirectCount: 1,
      statusCode: 404,
      checkedAt: new Date(NOW.getTime() + 4_800),
      actorId: ACTOR_ID,
    });

    const idempotent = await repository.stage({ ...stageInput, now: new Date(NOW.getTime() + 5_000) });
    assert.equal(idempotent.trackingLinkId, first.trackingLinkId);
    assert.equal(idempotent.alreadyCanonical, true);
    assert.equal(await client.affiliateTrackingLink.count({ where: { offerId: first.affiliateOfferId } }), 6);
    const richOffer = await client.affiliateOffer.findUniqueOrThrow({ where: { id: first.affiliateOfferId } });
    assert.equal(richOffer.payoutModel, "REV_SHARE");
    assert.equal(richOffer.terms, "Validated fixture terms must survive route registration.");

    const healthyReplacement = await repository.stage({
      ...genericStageInput,
      trackingUrl: HEALTHY_REPLACEMENT_URL,
      linkHash: partnerTrackingLinkHash(HEALTHY_REPLACEMENT_URL),
      now: new Date(NOW.getTime() + 5_500),
    });
    assert.equal(healthyReplacement.affectedRows.some((row) => row.geo === "ES"), false);
    await repository.recordVerification({
      stage: healthyReplacement,
      verification: "HEALTHY",
      reason: "GET_FALLBACK_OK",
      finalHost: "betway.example",
      redirectCount: 1,
      statusCode: 200,
      checkedAt: new Date(NOW.getTime() + 5_800),
      actorId: ACTOR_ID,
    });
    await repository.promote({ stage: healthyReplacement, finalHost: "betway.example", redirectCount: 1, checkedAt: new Date(NOW.getTime() + 5_800), actorId: ACTOR_ID });
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: first.trackingLinkId } })).active, true, "prior route remains rollback-capable before convergence finalization");
    await repository.finalizePromotion({ stage: healthyReplacement, checkedAt: new Date(NOW.getTime() + 5_900), actorId: ACTOR_ID });
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: first.trackingLinkId } })).active, false);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: exact.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: exactIeUsingGenericValue.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: healthyReplacement.trackingLinkId } })).active, true);

    const results = first.affectedRows.map((entry) => ({
      geo: entry.geo,
      marketSupport: entry.marketSupport,
      finalState: "ACTIVE_HEALTHY" as const,
      marketActivationId: null,
      routeHealth: "HEALTHY" as const,
      reason: "PostgreSQL fixture canonical convergence.",
    }));
    await repository.reconcileAuditAndCrm({
      stage: first,
      verification: "HEALTHY",
      previousTrackingLinkId: promotedGeneric.previousTrackingLinkId,
      results,
      actorId: ACTOR_ID,
      clientId: "partner-tracking-postgres-client",
      now: new Date(NOW.getTime() + 6_000),
    });
    const audit = await client.auditLog.findFirstOrThrow({ where: { actorId: ACTOR_ID, action: "commercial-partner-tracking-link-registered" } });
    const activity = await client.commercialActivity.findFirstOrThrow({ where: { opportunityId: PARTNER.opportunityId, type: "ACTIVATION_EVENT" } });
    const diagnostics = JSON.stringify({ audit: { summary: audit.summary, metadata: audit.metadata }, activity: { summary: activity.summary, details: activity.details, reason: activity.reason } });
    assert.equal(diagnostics.includes(GENERIC_URL), false);
    assert.equal(diagnostics.includes("redaction-fixture"), false);
    assert.equal(diagnostics.includes(partnerTrackingLinkHash(GENERIC_URL)), true);

    const missingTask = await client.commercialTask.findFirstOrThrow({ where: { opportunityId: PARTNER.opportunityId, idempotencyKey: "partner-tracking-postgres-missing" } });
    assert.equal(missingTask.completedAt, null);
    assert.match(missingTask.title, /^MISSING_TRACKING_ROUTE: 464 supported/);
  } finally {
    await cleanup(client);
    await client.$disconnect();
  }
});

test("an inferred seeded market may reverify only its already-canonical exact route", async () => {
  assertDisposablePostgres();
  const client = new PrismaClient();
  const repository = new PartnerTrackingRegistrationRepository(client);
  const partner = CURRENT_PARTNER_RECORDS.find((record) => record.name === "Betsson Group Affiliates")!;
  const actorId = "72000000-0000-4000-8000-000000000001";
  const networkId = "72000000-0000-4000-8000-000000000002";
  const casinoId = "72000000-0000-4000-8000-000000000003";
  const trackingUrl = "https://tracking-fixture.example/click?token=seeded-idempotency&campaign=rizk-rs";

  await client.marketActivation.deleteMany({ where: { casinoId } });
  await client.partnerCasinoMarketSupport.deleteMany({ where: { casinoId } });
  await client.commercialOpportunity.deleteMany({ where: { id: partner.opportunityId } });
  await client.affiliateRedirectSlug.deleteMany({ where: { casinoId } });
  await client.affiliateOffer.deleteMany({ where: { casinoId } });
  await client.affiliateProgram.deleteMany({ where: { casinoId } });
  await client.affiliateNetwork.deleteMany({ where: { id: networkId } });
  await client.casino.deleteMany({ where: { id: casinoId } });
  await client.adminUser.deleteMany({ where: { id: actorId } });

  try {
    await client.adminUser.create({ data: {
      id: actorId,
      email: "partner-tracking-seeded-idempotency@invalid.example",
      name: "Seeded idempotency fixture",
      role: "AFFILIATE_MANAGER",
    } });
    await client.casino.create({ data: {
      id: casinoId,
      title: "Rizk",
      slug: "rizk",
      domain: "rizk.com",
      websiteUrl: "https://rizk.com/",
      status: "PUBLISHED",
      domainPublicationStatus: "PUBLISHED",
      publishedAt: NOW,
      createdBy: actorId,
      updatedBy: actorId,
    } });
    const profile = await client.casinoCountry.create({ data: {
      casinoId,
      countryCode: "RS",
      availability: "AVAILABLE",
      localDomain: "rizk.rs",
      localWebsiteUrl: "https://rizk.rs/sr",
      lastVerifiedAt: NOW,
    } });
    await client.affiliateNetwork.create({ data: {
      id: networkId,
      name: partner.name,
      slug: "betsson-group-affiliates",
      active: true,
      createdBy: actorId,
      updatedBy: actorId,
    } });
    await client.commercialOpportunity.create({ data: {
      id: partner.opportunityId,
      displayName: partner.name,
      normalizedName: "betsson group affiliates",
      organizationType: "AFFILIATE_NETWORK",
      stage: "ACTIVE",
      affiliateNetworkId: networkId,
      createdBy: actorId,
      updatedBy: actorId,
    } });

    const inferredTarget = await repository.resolveTarget({
      partner: partner.name,
      partnerId: partner.opportunityId,
      partnerAliases: partner.aliases,
      casino: "Rizk",
      requestedGeos: ["RS"],
    });
    const seededRs = inferredTarget.rows.find((row) => row.geo === "RS")!;
    const inventoryRs = CURRENT_PARTNER_INVENTORY.find((row) => row.partner === partner.name && row.casino === "Rizk" && row.geo === "RS")!;
    assert.equal(seededRs.supportOrigin, "SEEDED");
    assert.ok(inventoryRs.supportEvidenceClassification === "INFERRED" || inventoryRs.legalEvidenceClassification === "INFERRED");

    const evidenceReadyTarget = {
      ...inferredTarget,
      rows: inferredTarget.rows.map((row) => row.geo === "RS" ? {
        ...row,
        supportEvidenceClassification: "DETECTED" as const,
        legalEvidenceClassification: "DETECTED" as const,
      } : row),
    };
    const initial = await repository.stage({
      target: evidenceReadyTarget,
      trackingUrl,
      linkHash: partnerTrackingLinkHash(trackingUrl),
      scope: "EXACT_GEO",
      geo: "RS",
      supportedGeos: null,
      actorId,
      now: NOW,
    });
    await repository.recordVerification({
      stage: initial,
      verification: "HEALTHY",
      reason: "GET_FALLBACK_OK",
      finalHost: "rizk.rs",
      redirectCount: 2,
      statusCode: 200,
      checkedAt: NOW,
      actorId,
    });
    await repository.promote({ stage: initial, finalHost: "rizk.rs", redirectCount: 2, checkedAt: NOW, actorId });
    await client.marketActivation.create({ data: {
      casinoId,
      countryCode: "RS",
      marketCode: "RS",
      product: "CASINO",
      desiredState: "ACTIVE",
      status: "ACTIVE",
      marketProfileId: profile.id,
      affiliateOfferId: initial.affiliateOfferId,
      primaryTrackingLinkId: initial.trackingLinkId,
      redirectSlugId: initial.redirectId,
      version: 1,
      controllerVersion: "RFC-042",
      reconciliationFingerprint: "a".repeat(64),
      requestedBy: actorId,
      requestedAt: NOW,
      requestReason: "Existing exact route fixture",
      sourceReferences: ["seeded-idempotency-fixture"],
      activatedAt: NOW,
      lastReconciledAt: NOW,
      routeVerificationStatus: "HEALTHY",
      routeLastCheckedAt: NOW,
      routeFinalHost: "rizk.rs",
    } });

    const existingLinkCount = await client.affiliateTrackingLink.count({ where: { offerId: initial.affiliateOfferId } });
    const idempotent = await repository.stage({
      target: inferredTarget,
      trackingUrl,
      linkHash: partnerTrackingLinkHash(trackingUrl),
      scope: "EXACT_GEO",
      geo: "RS",
      supportedGeos: null,
      actorId,
      now: new Date(NOW.getTime() + 1_000),
    });
    assert.equal(idempotent.alreadyCanonical, true);
    assert.equal(idempotent.candidateCreated, false);
    assert.equal(idempotent.trackingLinkId, initial.trackingLinkId);
    assert.deepEqual(idempotent.affectedRows.map((row) => row.geo), ["RS"]);
    assert.equal(await client.affiliateTrackingLink.count({ where: { offerId: initial.affiliateOfferId } }), existingLinkCount);
    assert.equal(await client.partnerCasinoMarketSupport.count({ where: { casinoId } }), 0);

    await assert.rejects(() => repository.stage({
      target: inferredTarget,
      trackingUrl: `${trackingUrl}-replacement`,
      linkHash: partnerTrackingLinkHash(`${trackingUrl}-replacement`),
      scope: "EXACT_GEO",
      geo: "RS",
      supportedGeos: null,
      actorId,
      now: new Date(NOW.getTime() + 2_000),
    }), (error: unknown) => error instanceof Error && "details" in error
      && (error.details as { reason?: string }).reason === "PARTNER_TRACKING_EVIDENCE_PENDING");
  } finally {
    await client.marketActivation.deleteMany({ where: { casinoId } });
    await client.partnerCasinoMarketSupport.deleteMany({ where: { casinoId } });
    await client.commercialOpportunity.deleteMany({ where: { id: partner.opportunityId } });
    await client.affiliateRedirectSlug.deleteMany({ where: { casinoId } });
    await client.affiliateOffer.deleteMany({ where: { casinoId } });
    await client.affiliateProgram.deleteMany({ where: { casinoId } });
    await client.affiliateNetwork.deleteMany({ where: { id: networkId } });
    await client.casino.deleteMany({ where: { id: casinoId } });
    await client.adminUser.deleteMany({ where: { id: actorId } });
    await client.$disconnect();
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { partnerTrackingLinkHash } from "../lib/commercial/partner-tracking-registration-contract";
import { CURRENT_PARTNER_RECORDS } from "../lib/current-partner-rollout/inventory";
import { PartnerTrackingRegistrationRepository } from "../lib/repositories/partner-tracking-registration.repository";

const PARTNER = CURRENT_PARTNER_RECORDS.find((record) => record.name === "Super Partners")!;
const ACTOR_ID = "71000000-0000-4000-8000-000000000001";
const CASINO_ID = "71000000-0000-4000-8000-000000000003";
const NOW = new Date("2026-09-10T12:00:00.000Z");
const GENERIC_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=generic";
const EXACT_URL = "https://tracking-fixture.example/click?token=redaction-fixture&campaign=exact-es";
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
      geo: null,
    });
    assert.equal(target.casinoId, CASINO_ID);
    assert.equal(target.affiliateNetworkId, null);
    assert.equal(target.rows.length, 8);

    const stageInput = {
      target,
      trackingUrl: GENERIC_URL,
      linkHash: partnerTrackingLinkHash(GENERIC_URL),
      scope: "GENERIC" as const,
      geo: null,
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
    assert.equal(await client.affiliateTrackingLinkCountry.count({ where: { trackingLinkId: first.trackingLinkId } }), 8);
    assert.equal((await client.affiliateRedirectSlug.findUniqueOrThrow({ where: { id: first.redirectId } })).active, true);

    await client.affiliateOffer.update({ where: { id: first.affiliateOfferId }, data: {
      payoutModel: "REV_SHARE",
      revenueSharePercentage: 25,
      terms: "Validated fixture terms must survive route registration.",
    } });
    const exact = await repository.stage({
      ...stageInput,
      trackingUrl: EXACT_URL,
      linkHash: partnerTrackingLinkHash(EXACT_URL),
      scope: "EXACT_GEO",
      geo: "ES",
      now: new Date(NOW.getTime() + 1_000),
    });
    assert.deepEqual(exact.affectedRows.map((row) => row.geo), ["ES"]);
    await repository.recordVerification({ stage: exact, verification: "HEALTHY", reason: "GET_FALLBACK_OK", finalHost: "betway.example", redirectCount: 1, statusCode: 200, checkedAt: new Date(NOW.getTime() + 2_000), actorId: ACTOR_ID });
    await repository.promote({ stage: exact, finalHost: "betway.example", redirectCount: 1, checkedAt: new Date(NOW.getTime() + 2_000), actorId: ACTOR_ID });

    const exactDkUsingGenericValue = await repository.stage({
      ...stageInput,
      trackingUrl: GENERIC_URL,
      linkHash: partnerTrackingLinkHash(GENERIC_URL),
      scope: "EXACT_GEO",
      geo: "DK",
      now: new Date(NOW.getTime() + 2_500),
    });
    assert.notEqual(exactDkUsingGenericValue.trackingLinkId, first.trackingLinkId, "scope identity must not be overwritten when the URL value is reused");
    assert.deepEqual(exactDkUsingGenericValue.affectedRows.map((row) => row.geo), ["DK"]);
    await repository.recordVerification({ stage: exactDkUsingGenericValue, verification: "HEALTHY", reason: "GET_FALLBACK_OK", finalHost: "betway.example", redirectCount: 1, statusCode: 200, checkedAt: new Date(NOW.getTime() + 2_700), actorId: ACTOR_ID });
    await repository.promote({ stage: exactDkUsingGenericValue, finalHost: "betway.example", redirectCount: 1, checkedAt: new Date(NOW.getTime() + 2_700), actorId: ACTOR_ID });

    const replacement = await repository.stage({
      ...stageInput,
      trackingUrl: REPLACEMENT_URL,
      linkHash: partnerTrackingLinkHash(REPLACEMENT_URL),
      now: new Date(NOW.getTime() + 3_000),
    });
    assert.equal(replacement.affectedRows.some((row) => row.geo === "ES"), false);
    assert.equal(replacement.affectedRows.some((row) => row.geo === "DK"), false);
    await repository.recordVerification({ stage: replacement, verification: "BROKEN", reason: "HTTP_404", finalHost: "betway.example", redirectCount: 1, statusCode: 404, checkedAt: new Date(NOW.getTime() + 4_000), actorId: ACTOR_ID });
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: first.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: exact.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: replacement.trackingLinkId } })).active, false);
    const redactedCandidate = await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: replacement.trackingLinkId } });
    assert.equal(redactedCandidate.trackingUrl.includes("redaction-fixture"), false);
    assert.equal(redactedCandidate.destinationUrl.includes("redaction-fixture"), false);

    const retriedReplacement = await repository.stage({
      ...stageInput,
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
    assert.equal(await client.affiliateTrackingLink.count({ where: { offerId: first.affiliateOfferId } }), 4);
    const richOffer = await client.affiliateOffer.findUniqueOrThrow({ where: { id: first.affiliateOfferId } });
    assert.equal(richOffer.payoutModel, "REV_SHARE");
    assert.equal(richOffer.terms, "Validated fixture terms must survive route registration.");

    const healthyReplacement = await repository.stage({
      ...stageInput,
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
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: exactDkUsingGenericValue.trackingLinkId } })).active, true);
    assert.equal((await client.affiliateTrackingLink.findUniqueOrThrow({ where: { id: healthyReplacement.trackingLinkId } })).active, true);

    const results = first.affectedRows.map((entry) => ({
      geo: entry.geo,
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

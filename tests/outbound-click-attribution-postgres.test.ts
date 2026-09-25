import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { mock } from "node:test";

import { NextRequest } from "next/server";

import { GET as outboundRedirectGet } from "../app/r/[slug]/route";
import {
  recordOutboundAttribution,
  type OutboundAttributionInput,
} from "../lib/analytics/outbound-attribution.server";
import { prisma } from "../lib/db/prisma";
import { affiliateRedirectService } from "../lib/services/affiliate-redirect.service";
import { outboundClickService } from "../lib/services/outbound-click.service";

const aggregateFailureConstraint = "OutboundClickAttribution_test_failure";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  const localHost = ["127.0.0.1", "localhost", "postgres"].includes(url.hostname);
  const disposableName = /(?:test|ci|disposable)/i.test(url.pathname);
  if (!localHost || !disposableName) {
    throw new Error("Outbound attribution integration tests require a disposable local/CI PostgreSQL database");
  }
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else Object.assign(process.env, { [name]: value });
}

async function dropAggregateFailureConstraint() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AffiliateOutboundClickDaily" DROP CONSTRAINT IF EXISTS "${aggregateFailureConstraint}"`,
  );
}

async function installAggregateFailureConstraint() {
  await dropAggregateFailureConstraint();
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AffiliateOutboundClickDaily" ADD CONSTRAINT "${aggregateFailureConstraint}" CHECK (false) NOT VALID`,
  );
}

async function createAffiliateFixture() {
  const suffix = randomUUID();
  const auditActor = `outbound-attribution:${suffix}`;
  const casino = await prisma.casino.create({
    data: {
      slug: `outbound-attribution-casino-${suffix}`,
      title: "Outbound Attribution Casino Fixture",
      domain: `outbound-attribution-${suffix}.invalid`,
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  const network = await prisma.affiliateNetwork.create({
    data: {
      name: "Outbound Attribution Network Fixture",
      slug: `outbound-attribution-network-${suffix}`,
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  const program = await prisma.affiliateProgram.create({
    data: {
      networkId: network.id,
      casinoId: casino.id,
      name: "Outbound Attribution Program Fixture",
      operator: "Fixture",
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  const offer = await prisma.affiliateOffer.create({
    data: {
      programId: program.id,
      casinoId: casino.id,
      internalName: "Outbound Attribution Offer Fixture",
      publicLabel: "Outbound Attribution Offer Fixture",
      offerType: "TEST",
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  const trackingLink = await prisma.affiliateTrackingLink.create({
    data: {
      offerId: offer.id,
      label: "Outbound Attribution Link Fixture",
      destinationUrl: "https://operator.example.invalid/landing",
      trackingUrl: "https://partner.example.invalid/click?token=never-persist",
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  const redirectSlug = await prisma.affiliateRedirectSlug.create({
    data: {
      slug: `outbound-attribution-route-${suffix}`,
      casinoId: casino.id,
      affiliateOfferId: offer.id,
      createdBy: auditActor,
      updatedBy: auditActor,
    },
  });
  return { suffix, casino, network, program, offer, trackingLink, redirectSlug };
}

type AffiliateFixture = Awaited<ReturnType<typeof createAffiliateFixture>>;

function successfulInput(
  fixture: AffiliateFixture,
  clickId: string,
  countryCode: string,
  attemptedAt: Date,
): OutboundAttributionInput {
  return {
    clickId,
    request: new Request(`https://b4gamble.com/r/${fixture.redirectSlug.slug}?placement=casino_detail_hero`, {
      headers: { referer: "https://b4gamble.com/casinos/outbound-attribution?token=never-persist" },
    }),
    requestedSlug: fixture.redirectSlug.slug,
    attemptedAt,
    resolvedAt: new Date(attemptedAt.getTime() + 25),
    state: "SUCCEEDED",
    countryCode,
    locale: "en",
    casinoId: fixture.casino.id,
    affiliateOfferId: fixture.offer.id,
    redirectSlugId: fixture.redirectSlug.id,
    trackingLinkId: fixture.trackingLink.id,
  };
}

async function cleanupFixture(fixture: AffiliateFixture, extraRequestedSlugs: string[] = []) {
  const clicks = await prisma.outboundClick.findMany({
    where: { requestedSlug: { in: [fixture.redirectSlug.slug, ...extraRequestedSlugs] } },
    select: { id: true },
  }).catch(() => []);
  const clickIds = clicks.map((click) => click.id);
  await prisma.affiliateOutboundClickDaily.deleteMany({ where: { casinoId: fixture.casino.id } }).catch(() => undefined);
  if (clickIds.length > 0) {
    await prisma.analyticsEvent.deleteMany({ where: { outboundClickId: { in: clickIds } } }).catch(() => undefined);
    await prisma.outboundClick.deleteMany({ where: { id: { in: clickIds } } }).catch(() => undefined);
  }
  await prisma.affiliateRedirectSlug.deleteMany({ where: { id: fixture.redirectSlug.id } }).catch(() => undefined);
  await prisma.affiliateTrackingLink.deleteMany({ where: { id: fixture.trackingLink.id } }).catch(() => undefined);
  await prisma.affiliateOffer.deleteMany({ where: { id: fixture.offer.id } }).catch(() => undefined);
  await prisma.affiliateProgram.deleteMany({ where: { id: fixture.program.id } }).catch(() => undefined);
  await prisma.affiliateNetwork.deleteMany({ where: { id: fixture.network.id } }).catch(() => undefined);
  await prisma.casino.deleteMany({ where: { id: fixture.casino.id } }).catch(() => undefined);
}

async function waitFor(check: () => boolean | Promise<boolean>, message: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(message);
}

test("canonical outbound attribution transaction is atomic, success-only, and click-id idempotent", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const oldNodeEnv = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "test" });
  const fixture = await createAffiliateFixture();
  const errorMock = mock.method(console, "error", () => undefined);
  const attemptedAt = new Date("2026-09-14T23:59:59.900Z");
  const clickIds = {
    success: randomUUID(),
    blocked: randomUUID(),
    aggregateFailure: randomUUID(),
    detailedFailure: randomUUID(),
    duplicate: randomUUID(),
  };

  try {
    await recordOutboundAttribution(successfulInput(fixture, clickIds.success, "PE", attemptedAt));
    const successfulClick = await prisma.outboundClick.findUniqueOrThrow({ where: { id: clickIds.success } });
    assert.deepEqual({
      state: successfulClick.state,
      attemptedAt: successfulClick.attemptedAt.toISOString(),
      casinoId: successfulClick.casinoId,
      affiliateOfferId: successfulClick.affiliateOfferId,
      affiliateNetworkId: successfulClick.affiliateNetworkId,
      redirectSlugId: successfulClick.redirectSlugId,
      trackingLinkId: successfulClick.trackingLinkId,
    }, {
      state: "SUCCEEDED",
      attemptedAt: attemptedAt.toISOString(),
      casinoId: fixture.casino.id,
      affiliateOfferId: fixture.offer.id,
      affiliateNetworkId: fixture.network.id,
      redirectSlugId: fixture.redirectSlug.id,
      trackingLinkId: fixture.trackingLink.id,
    });
    // This click carries no consent cookie. Where it came from is recorded for
    // every click; who made it is not. The referrer's query, with its token, is
    // dropped and only the path is kept.
    assert.deepEqual({
      sourcePage: successfulClick.sourcePage,
      placement: successfulClick.placement,
      anonymousId: successfulClick.anonymousId,
      analyticsSessionId: successfulClick.analyticsSessionId,
      userId: successfulClick.userId,
      locale: successfulClick.locale,
    }, {
      sourcePage: "/casinos/outbound-attribution",
      placement: "CASINO_DETAIL_HERO",
      anonymousId: null,
      analyticsSessionId: null,
      userId: null,
      locale: null,
    });
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: clickIds.success } }), 2);
    const successfulAggregate = await prisma.affiliateOutboundClickDaily.findFirstOrThrow({
      where: { casinoId: fixture.casino.id, countryCode: "PE" },
    });
    assert.deepEqual({
      day: successfulAggregate.day.toISOString(),
      casinoId: successfulAggregate.casinoId,
      countryCode: successfulAggregate.countryCode,
      redirectSlugId: successfulAggregate.redirectSlugId,
      affiliateOfferId: successfulAggregate.affiliateOfferId,
      trackingLinkId: successfulAggregate.trackingLinkId,
      clickCount: successfulAggregate.clickCount,
      lastClickedAt: successfulAggregate.lastClickedAt.toISOString(),
    }, {
      day: "2026-09-14T00:00:00.000Z",
      casinoId: fixture.casino.id,
      countryCode: "PE",
      redirectSlugId: fixture.redirectSlug.id,
      affiliateOfferId: fixture.offer.id,
      trackingLinkId: fixture.trackingLink.id,
      clickCount: 1,
      lastClickedAt: attemptedAt.toISOString(),
    });
    const report = await outboundClickService.report({
      from: "2026-09-14",
      to: "2026-09-14",
      casinoId: fixture.casino.id,
      countryCode: "PE",
      redirectSlugId: fixture.redirectSlug.id,
    });
    assert.deepEqual({
      totals: report.totals,
      privacy: report.privacy,
      daily: report.daily.map((row) => ({
        day: row.day,
        affiliateOfferId: row.affiliateOfferId,
        trackingLinkId: row.trackingLinkId,
        clickCount: row.clickCount,
      })),
    }, {
      totals: { clicks: 1, routes: 1 },
      privacy: "aggregate-only",
      daily: [{
        day: "2026-09-14",
        affiliateOfferId: fixture.offer.id,
        trackingLinkId: fixture.trackingLink.id,
        clickCount: 1,
      }],
    });

    await recordOutboundAttribution({
      ...successfulInput(fixture, clickIds.blocked, "DK", attemptedAt),
      state: "BLOCKED",
      blockedReason: "JURISDICTION_DENIED",
    });
    assert.equal((await prisma.outboundClick.findUniqueOrThrow({ where: { id: clickIds.blocked } })).state, "BLOCKED");
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: clickIds.blocked } }), 2);
    assert.equal(await prisma.affiliateOutboundClickDaily.count({ where: { casinoId: fixture.casino.id, countryCode: "DK" } }), 0);

    await installAggregateFailureConstraint();
    await assert.rejects(recordOutboundAttribution(successfulInput(fixture, clickIds.aggregateFailure, "MT", attemptedAt)));
    await dropAggregateFailureConstraint();
    assert.equal(await prisma.outboundClick.count({ where: { id: clickIds.aggregateFailure } }), 0);
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: clickIds.aggregateFailure } }), 0);
    assert.equal(await prisma.affiliateOutboundClickDaily.count({ where: { casinoId: fixture.casino.id, countryCode: "MT" } }), 0);

    await assert.rejects(recordOutboundAttribution({
      ...successfulInput(fixture, clickIds.detailedFailure, "IT", attemptedAt),
      resolvedAt: new Date(attemptedAt.getTime() - 1),
    }));
    assert.equal(await prisma.outboundClick.count({ where: { id: clickIds.detailedFailure } }), 0);
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: clickIds.detailedFailure } }), 0);
    assert.equal(await prisma.affiliateOutboundClickDaily.count({ where: { casinoId: fixture.casino.id, countryCode: "IT" } }), 0);

    const duplicateInput = successfulInput(fixture, clickIds.duplicate, "SE", attemptedAt);
    await recordOutboundAttribution(duplicateInput);
    await assert.rejects(recordOutboundAttribution(duplicateInput));
    assert.equal(await prisma.outboundClick.count({ where: { id: clickIds.duplicate } }), 1);
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: clickIds.duplicate } }), 2);
    assert.equal((await prisma.affiliateOutboundClickDaily.findFirstOrThrow({
      where: { casinoId: fixture.casino.id, countryCode: "SE" },
    })).clickCount, 1);
  } finally {
    await dropAggregateFailureConstraint().catch(() => undefined);
    await cleanupFixture(fixture);
    errorMock.mock.restore();
    restoreEnvironment("NODE_ENV", oldNodeEnv);
  }
});

test("/r preserves successful 302 and blocked recovery responses when observation is best-effort", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const oldEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    AFFILIATE_REDIRECT_ENGINE_ENABLED: process.env.AFFILIATE_REDIRECT_ENGINE_ENABLED,
  };
  Object.assign(process.env, {
    NODE_ENV: "test",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    AFFILIATE_REDIRECT_ENGINE_ENABLED: "true",
  });
  const fixture = await createAffiliateFixture();
  const blockedSlug = `blocked-attribution-route-${fixture.suffix}`;
  const warnings: Array<{ message: unknown; context: unknown }> = [];
  const errorMock = mock.method(console, "error", () => undefined);
  const warnMock = mock.method(console, "warn", (message: unknown, context: unknown) => {
    warnings.push({ message, context });
  });
  const resolveMock = mock.method(affiliateRedirectService, "resolve", async () => ({
    ok: true as const,
    destination: new URL("https://partner.example.invalid/click?token=never-persist"),
    slugId: fixture.redirectSlug.id,
    casinoId: fixture.casino.id,
    offerId: fixture.offer.id,
    trackingLinkId: fixture.trackingLink.id,
    candidates: [],
    jurisdictionDecision: {
      decisionId: `outbound-attribution-${fixture.suffix}`,
      countryCode: "PE",
      marketId: "pe-online-casino",
      jurisdictionId: "peru",
      editorialAllowed: true,
      commercialAllowed: true,
      referralAllowed: true,
      reasonCode: "POLICY_APPROVED" as const,
      policyVersion: "test",
      evaluatedAt: new Date().toISOString(),
      revalidateAt: null,
      inputSummary: [],
    },
  }));

  try {
    await installAggregateFailureConstraint();
    const successfulResponse = await outboundRedirectGet(new NextRequest(
      `https://b4gamble.com/r/${fixture.redirectSlug.slug}?language=en`,
      { headers: { "x-vercel-ip-country": "PE" } },
    ), { params: Promise.resolve({ slug: fixture.redirectSlug.slug }) });
    assert.equal(successfulResponse.status, 302);
    assert.equal(successfulResponse.headers.get("location"), "https://partner.example.invalid/click?token=never-persist");
    await waitFor(
      () => warnings.some((warning) => warning.message === "[analytics] outbound attribution failed"),
      "The fallback-scheduled attribution observer did not finish",
    );
    assert.equal(await prisma.outboundClick.count({ where: { requestedSlug: fixture.redirectSlug.slug } }), 0);
    assert.equal(await prisma.affiliateOutboundClickDaily.count({ where: { casinoId: fixture.casino.id } }), 0);

    await dropAggregateFailureConstraint();
    Object.assign(process.env, { AFFILIATE_REDIRECT_ENGINE_ENABLED: "false" });
    const blockedResponse = await outboundRedirectGet(new NextRequest(
      `https://b4gamble.com/r/${blockedSlug}`,
      { headers: { "x-vercel-ip-country": "PE" } },
    ), { params: Promise.resolve({ slug: blockedSlug }) });
    assert.equal(blockedResponse.status, 303);
    assert.equal(blockedResponse.headers.get("location"), `https://b4gamble.com/outbound/unavailable?link=${blockedSlug}`);
    assert.match(blockedResponse.headers.get("cache-control") ?? "", /no-store/);
    await waitFor(
      async () => await prisma.outboundClick.count({ where: { requestedSlug: blockedSlug } }) === 1,
      "The blocked redirect observation did not finish",
    );
    assert.equal((await prisma.outboundClick.findFirstOrThrow({ where: { requestedSlug: blockedSlug } })).state, "BLOCKED");
    assert.equal(await prisma.affiliateOutboundClickDaily.count({ where: { casinoId: fixture.casino.id } }), 0);
  } finally {
    resolveMock.mock.restore();
    warnMock.mock.restore();
    errorMock.mock.restore();
    await dropAggregateFailureConstraint().catch(() => undefined);
    await cleanupFixture(fixture, [blockedSlug]);
    restoreEnvironment("NODE_ENV", oldEnvironment.NODE_ENV);
    restoreEnvironment("VERCEL", oldEnvironment.VERCEL);
    restoreEnvironment("VERCEL_ENV", oldEnvironment.VERCEL_ENV);
    restoreEnvironment("AFFILIATE_REDIRECT_ENGINE_ENABLED", oldEnvironment.AFFILIATE_REDIRECT_ENGINE_ENABLED);
  }
});

test.after(async () => {
  await dropAggregateFailureConstraint().catch(() => undefined);
  await prisma.$disconnect();
});

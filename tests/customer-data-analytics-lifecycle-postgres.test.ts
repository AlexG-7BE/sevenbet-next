import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { recordAnalyticsConsentPreference } from "../lib/analytics/consent.server";
import { commercialDashboard, emailDashboard, founderOverview, programmeDashboard } from "../lib/analytics/dashboard.server";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
} from "../lib/analytics/consent-contract";
import {
  resolveAnalyticsRequestIdentity,
  persistClientAnalyticsEvent,
} from "../lib/analytics/service.server";
import { analyticsRange } from "../lib/analytics/metrics";
import { createClientProductAnalyticsEvent } from "../lib/analytics/product-analytics-events";
import { recordOutboundAttribution } from "../lib/analytics/outbound-attribution.server";
import { observeProgrammeState } from "../lib/analytics/programme-observer.server";
import { signedAnalyticsConsent, signedAnalyticsUuid } from "../lib/analytics/identity.server";
import { customerDetail, listCustomers } from "../lib/customers/admin.server";
import { observeSuccessfulAuthentication } from "../lib/customers/auth-observer.server";
import { updateCustomerEmailPreference } from "../lib/customers/email-preference.server";
import {
  createEmailCampaign,
  queueEmailCampaign,
  refreshCampaignStates,
  reviewEmailCampaign,
} from "../lib/email/campaigns.server";
import type { EmailProviderEnvelope, LifecycleEmailProvider } from "../lib/email/provider.server";
import {
  processQueuedEmailMessage,
  queueEmailMessage,
  queueProgrammeReminders,
  unsubscribeTokenForMessage,
} from "../lib/email/service.server";
import { unsubscribeWithToken } from "../lib/email/unsubscribe.server";
import { normalizeResendWebhook, processResendWebhook } from "../lib/email/webhook.server";

const prisma = new PrismaClient();

class FakeResendLifecycleEmailProvider implements LifecycleEmailProvider {
  private readonly sent = new Map<string, EmailProviderEnvelope & { messageId: string }>();

  async send(envelope: EmailProviderEnvelope) {
    const existing = this.sent.get(envelope.idempotencyKey);
    if (existing) return { status: "accepted" as const, provider: "resend" as const, messageId: existing.messageId };
    const messageId = `test-resend-${this.sent.size + 1}`;
    this.sent.set(envelope.idempotencyKey, { ...envelope, messageId });
    return { status: "accepted" as const, provider: "resend" as const, messageId };
  }

  messages() { return [...this.sent.values()]; }
}

function setEnvironment(values: Record<string, string>) {
  Object.assign(process.env, values);
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else Object.assign(process.env, { [name]: value });
}

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  const localHost = ["127.0.0.1", "localhost", "postgres"].includes(url.hostname);
  const disposableName = /(?:test|ci|disposable)/i.test(url.pathname);
  if (!localHost || !disposableName) {
    throw new Error("Customer Core integration tests require a disposable local/CI PostgreSQL database");
  }
}

test("Customer Core v1 persists one end-to-end relational lifecycle without external delivery", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const suffix = randomUUID();
  const userId = `customer-core-user-${suffix}`;
  const duplicateUserId = `customer-core-duplicate-${suffix}`;
  const email = `customer-core-${suffix}@example.invalid`;
  const analyticsSecret = `customer-core-postgres-secret-${suffix}`;
  const anonymousId = randomUUID();
  const clickIds = [randomUUID(), randomUUID()];
  const eventPrefix = `customer-core:${suffix}`;
  const now = new Date();
  const old = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    ANALYTICS_SIGNING_SECRET: process.env.ANALYTICS_SIGNING_SECRET,
    PROGRAMME_REMINDER_INACTIVITY_DAYS: process.env.PROGRAMME_REMINDER_INACTIVITY_DAYS,
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: process.env.LIFECYCLE_EMAIL_DELIVERY_ENABLED,
  };
  setEnvironment({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    ANALYTICS_SIGNING_SECRET: analyticsSecret,
    PROGRAMME_REMINDER_INACTIVITY_DAYS: "7",
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: "false",
  });

  let adminId: string | null = null;
  let campaignId: string | null = null;
  let programId: string | null = null;
  let programVersionId: string | null = null;
  let casinoId: string | null = null;
  let networkId: string | null = null;
  let affiliateProgramId: string | null = null;
  let offerId: string | null = null;
  let trackingLinkId: string | null = null;
  let redirectSlugId: string | null = null;

  try {
    await prisma.user.create({
      data: { id: userId, name: "Customer Core Test", email, emailVerified: true },
    });
    await assert.rejects(
      prisma.user.create({
        data: { id: duplicateUserId, name: "Duplicate", email: `  ${email.toUpperCase()}  `, emailVerified: true },
      }),
      (error: unknown) => Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"),
    );
    assert.equal(await prisma.user.count({ where: { id: { in: [userId, duplicateUserId] } } }), 1);

    const consentCookie = signedAnalyticsConsent("granted", analyticsSecret);
    const anonymousCookie = signedAnalyticsUuid(anonymousId, analyticsSecret);
    const consentHeaders = new Headers({
      cookie: `${ANALYTICS_CONSENT_COOKIE}=${consentCookie}; ${ANALYTICS_ANONYMOUS_COOKIE}=${anonymousCookie}`,
      referer: "https://b4gamble.com/program?source=founder-core&utm_source=integration&utm_medium=test&utm_campaign=core-v1",
      "user-agent": "Mozilla/5.0 Customer Core Integration",
      "x-b4gamble-presentation-language": "en",
      "x-vercel-ip-country": "GB",
    });
    await recordAnalyticsConsentPreference({ anonymousId, granted: true, userId });
    await recordAnalyticsConsentPreference({ anonymousId, granted: false, userId });
    await recordAnalyticsConsentPreference({ anonymousId, granted: false, userId });
    await recordAnalyticsConsentPreference({ anonymousId, granted: true, userId });
    const analyticsConsentActions = await prisma.consentEvent.groupBy({
      by: ["action"],
      where: { userId, purpose: "ANALYTICS" },
      _count: { _all: true },
    });
    assert.deepEqual(
      Object.fromEntries(analyticsConsentActions.map((row) => [row.action, row._count._all])),
      { DENIED: 1, GRANTED: 2, WITHDRAWN: 1 },
    );
    const signupRequest = new Request("https://b4gamble.com/api/auth/sign-up/email", { headers: consentHeaders });
    const responseBody = { user: { id: userId, email: `  ${email.toUpperCase()}  ` } };
    assert.deepEqual(await observeSuccessfulAuthentication({ request: signupRequest, responseBody, kind: "signup" }), {
      observed: true, userId, kind: "signup",
    });
    await observeSuccessfulAuthentication({ request: signupRequest, responseBody, kind: "signup" });
    await observeSuccessfulAuthentication({ request: signupRequest, responseBody, kind: "login" });
    await observeSuccessfulAuthentication({ request: signupRequest, responseBody, kind: "login" });
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email, email);
    assert.equal(await prisma.emailMessage.count({ where: { userId, purpose: "WELCOME" } }), 1);
    assert.equal(await prisma.analyticsEvent.count({ where: { userId, type: "SIGNUP_COMPLETED" } }), 1);
    assert.equal(await prisma.analyticsEvent.count({ where: { userId, type: "LOGIN_COMPLETED" } }), 1);

    await updateCustomerEmailPreference(userId, {
      marketingAllowed: true,
      source: "PROGRAMME_SIGNUP",
      policyVersion: "email-marketing-v1",
      locale: "en",
    });
    const preference = await prisma.customerEmailPreference.findUniqueOrThrow({ where: { userId } });
    assert.equal(preference.marketingAllowed, true);
    assert.equal(preference.suppressionScope, "NONE");
    assert.equal(await prisma.consentEvent.count({ where: { userId, purpose: "MARKETING_EMAIL", action: "GRANTED" } }), 1);
    const listed = await listCustomers({ query: email, marketing: "allowed" });
    assert.equal(listed.customers.some((customer) => customer.id === userId), true);
    assert.equal((await customerDetail(userId))?.id, userId);

    const pageEvent = createClientProductAnalyticsEvent("page_viewed", {
      pagePath: "/program",
      locale: "en",
      acquisitionSource: "founder-core",
    }, { eventId: randomUUID(), occurredAt: now });
    const analyticsRequest = new Request("https://b4gamble.com/api/analytics/events", { headers: consentHeaders });
    const identity = await resolveAnalyticsRequestIdentity(analyticsRequest, pageEvent, now);
    assert.equal(identity.anonymousId, anonymousId);
    assert.equal(identity.createdSession, true);
    assert.equal(await persistClientAnalyticsEvent({ event: pageEvent, identity, now }), "accepted");
    assert.equal(await persistClientAnalyticsEvent({ event: pageEvent, identity, now }), "duplicate");
    assert.equal(await prisma.analyticsEvent.count({ where: { id: pageEvent.eventId } }), 1);

    const program = await prisma.program.create({
      data: {
        slug: `customer-core-${suffix}`,
        internalName: "Customer Core Programme Fixture",
        title: "Customer Core Programme Fixture",
        summary: "Disposable integration fixture",
        introduction: "Disposable integration fixture",
        estimatedTotalMinutes: 10,
        completionRules: [],
        createdBy: eventPrefix,
        updatedBy: eventPrefix,
      },
    });
    programId = program.id;
    const version = await prisma.programVersion.create({
      data: { programId: program.id, version: 1, status: "PUBLISHED", snapshot: {}, createdBy: eventPrefix },
    });
    programVersionId = version.id;
    const enrollment = await prisma.programEnrollment.create({
      data: {
        userId,
        programId: program.id,
        programVersionId: version.id,
        startedAt: new Date(now.getTime() - 31 * 86_400_000),
      },
    });
    await prisma.programmeMissionProgress.create({
      data: { enrollmentId: enrollment.id, missionNumber: 1, status: "COMPLETED", taskStates: [], completedAt: new Date(now.getTime() - 30 * 86_400_000) },
    });
    await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date(now.getTime() - 30 * 86_400_000) } });
    assert.deepEqual(await queueProgrammeReminders(), { eligible: 1, queued: 1 });
    assert.deepEqual(await queueProgrammeReminders(), { eligible: 0, queued: 0 });
    assert.equal(await prisma.emailMessage.count({ where: { userId, purpose: "PROGRAMME_REMINDER" } }), 1);

    const programmeHeaders = new Headers(consentHeaders);
    programmeHeaders.set("cookie", `${ANALYTICS_CONSENT_COOKIE}=${consentCookie}; ${ANALYTICS_ANONYMOUS_COOKIE}=${anonymousCookie}; ${ANALYTICS_SESSION_COOKIE}=${signedAnalyticsUuid(identity.sessionId, analyticsSecret)}`);
    assert.equal((await observeProgrammeState(userId, programmeHeaders)).observed, true);
    assert.equal((await observeProgrammeState(userId, programmeHeaders)).observed, true);
    assert.equal(await prisma.analyticsEvent.count({ where: { dedupeKey: `programme:${enrollment.id}:started` } }), 1);
    assert.equal(await prisma.analyticsEvent.count({ where: { dedupeKey: `programme:${enrollment.id}:step:1:completed` } }), 1);
    await prisma.programmeMissionProgress.createMany({
      data: Array.from({ length: 9 }, (_, index) => ({
        enrollmentId: enrollment.id,
        missionNumber: index + 2,
        status: "COMPLETED" as const,
        taskStates: [],
        completedAt: new Date(now.getTime() - (9 - index) * 60_000),
      })),
    });
    await prisma.programEnrollment.update({ where: { id: enrollment.id }, data: { completedAt: now } });
    await observeProgrammeState(userId, programmeHeaders);
    assert.equal(await prisma.analyticsEvent.count({ where: { dedupeKey: `programme:${enrollment.id}:completed` } }), 1);

    const casino = await prisma.casino.create({
      data: {
        slug: `customer-core-casino-${suffix}`,
        title: "Customer Core Casino Fixture",
        domain: `customer-core-${suffix}.invalid`,
        createdBy: eventPrefix,
        updatedBy: eventPrefix,
      },
    });
    casinoId = casino.id;
    const network = await prisma.affiliateNetwork.create({
      data: { name: "Customer Core Network Fixture", slug: `customer-core-network-${suffix}`, createdBy: eventPrefix, updatedBy: eventPrefix },
    });
    networkId = network.id;
    const affiliateProgram = await prisma.affiliateProgram.create({
      data: { networkId: network.id, casinoId: casino.id, name: "Customer Core Program", operator: "Fixture", createdBy: eventPrefix, updatedBy: eventPrefix },
    });
    affiliateProgramId = affiliateProgram.id;
    const offer = await prisma.affiliateOffer.create({
      data: {
        programId: affiliateProgram.id,
        casinoId: casino.id,
        internalName: "Customer Core Offer",
        publicLabel: "Customer Core Offer",
        offerType: "TEST",
        createdBy: eventPrefix,
        updatedBy: eventPrefix,
      },
    });
    offerId = offer.id;
    const link = await prisma.affiliateTrackingLink.create({
      data: {
        offerId: offer.id,
        label: "Customer Core Link",
        destinationUrl: "https://partner.example.invalid/landing",
        trackingUrl: "https://partner.example.invalid/track?token=never-persist-in-analytics",
        createdBy: eventPrefix,
        updatedBy: eventPrefix,
      },
    });
    trackingLinkId = link.id;
    const redirect = await prisma.affiliateRedirectSlug.create({
      data: { slug: `customer-core-route-${suffix}`, casinoId: casino.id, affiliateOfferId: offer.id, createdBy: eventPrefix, updatedBy: eventPrefix },
    });
    redirectSlugId = redirect.id;
    const clickRequest = new Request(`https://b4gamble.com/r/${redirect.slug}?placement=casino_detail_hero`, {
      headers: new Headers({ ...Object.fromEntries(programmeHeaders.entries()), referer: "https://b4gamble.com/casinos/customer-core?token=must-not-persist" }),
    });
    await persistClientAnalyticsEvent({
      event: createClientProductAnalyticsEvent("commercial_cta_clicked", { pagePath: "/casinos/customer-core", placement: "CASINO_DETAIL_HERO" }, { eventId: randomUUID(), occurredAt: now }),
      identity,
      now,
    });
    await persistClientAnalyticsEvent({
      event: createClientProductAnalyticsEvent("casino_viewed", { pagePath: "/casinos/customer-core", casinoId: casino.id }, { eventId: randomUUID(), occurredAt: now }),
      identity,
      now,
    });
    await persistClientAnalyticsEvent({
      event: createClientProductAnalyticsEvent("offer_viewed", { pagePath: "/casinos/customer-core", casinoId: casino.id, affiliateOfferId: offer.id }, { eventId: randomUUID(), occurredAt: now }),
      identity,
      now,
    });
    await recordOutboundAttribution({
      clickId: clickIds[0]!, request: clickRequest, requestedSlug: redirect.slug, attemptedAt: now,
      state: "SUCCEEDED", countryCode: "GB", locale: "en", casinoId: casino.id, affiliateOfferId: offer.id,
      redirectSlugId: redirect.id, trackingLinkId: link.id,
    });
    await recordOutboundAttribution({
      clickId: clickIds[1]!, request: clickRequest, requestedSlug: "blocked-route", attemptedAt: now,
      state: "BLOCKED", blockedReason: "REGULATORY_BLOCK", countryCode: "GB", locale: "en", casinoId: casino.id,
    });
    assert.deepEqual((await prisma.outboundClick.findMany({ where: { id: { in: clickIds } }, orderBy: { state: "asc" }, select: { state: true, blockedReason: true, sourcePage: true } })).map((row) => row.state).sort(), ["BLOCKED", "SUCCEEDED"]);
    assert.equal(await prisma.analyticsEvent.count({ where: { outboundClickId: { in: clickIds } } }), 4);
    const persistedClickJson = JSON.stringify(await prisma.outboundClick.findMany({ where: { id: { in: clickIds } } }));
    assert.doesNotMatch(persistedClickJson, /never-persist|must-not-persist|partner\.example/i);

    const admin = await prisma.adminUser.create({
      data: { email: `customer-core-admin-${suffix}@example.invalid`, name: "Customer Core Admin", role: "ADMIN" },
    });
    adminId = admin.id;
    const marketingTemplate = await prisma.emailTemplate.findFirstOrThrow({ where: { key: "MARKETING_BROADCAST", locale: "en", active: true } });
    const campaign = await createEmailCampaign({
      name: "Customer Core Broadcast Fixture",
      templateId: marketingTemplate.id,
      idempotencyKey: `customer-core-campaign-${suffix}`,
      locale: "en",
      countryCode: null,
      programmeSegment: "COMPLETED",
      inactiveDays: null,
      newUsersOnly: false,
    }, admin.id);
    assert.ok(campaign);
    campaignId = campaign.id;
    const reviewed = await reviewEmailCampaign(campaign.id, admin.id);
    assert.equal(reviewed?.status, "REVIEWED");
    const queued = await queueEmailCampaign(campaign.id, admin.id);
    assert.equal(queued.status, "QUEUED");
    await queueEmailCampaign(campaign.id, admin.id);
    assert.equal(await prisma.emailMessage.count({ where: { campaignId: campaign.id, userId } }), 1);
    assert.equal(await prisma.auditLog.count({
      where: { actorId: admin.id, entityId: campaign.id, action: { in: ["email-campaign-created", "email-campaign-reviewed", "email-campaign-queued"] } },
    }), 3);
    const campaignMessage = await prisma.emailMessage.findFirstOrThrow({ where: { campaignId: campaign.id, userId } });
    const queuedBeforeUnsubscribe = await queueEmailMessage({
      userId,
      templateKey: "MARKETING_BROADCAST",
      idempotencyKey: `customer-core:pre-unsubscribe:${suffix}`,
    });
    assert.equal(queuedBeforeUnsubscribe?.status, "QUEUED");
    const provider = new FakeResendLifecycleEmailProvider();
    assert.equal((await processQueuedEmailMessage(campaignMessage.id, { provider, siteUrl: "https://b4gamble.com" })).status, "sent");
    assert.equal((await processQueuedEmailMessage(campaignMessage.id, { provider, siteUrl: "https://b4gamble.com" })).status, "not-claimed");
    assert.equal(provider.messages().length, 1);
    const providerMessageId = provider.messages()[0]!.messageId;
    const delivered = normalizeResendWebhook(`customer-core-delivered-${suffix}`, {
      type: "email.delivered", created_at: now.toISOString(), data: { email_id: providerMessageId },
    });
    assert.equal((await processResendWebhook(delivered)).status, "processed");
    assert.equal((await processResendWebhook(delivered)).status, "duplicate");
    assert.equal((await prisma.emailMessage.findUniqueOrThrow({ where: { id: campaignMessage.id } })).status, "DELIVERED");

    const token = unsubscribeTokenForMessage(campaignMessage.id, analyticsSecret);
    assert.equal((await unsubscribeWithToken(token, new Date(now.getTime() + 1_000))).status, "unsubscribed");
    assert.equal((await unsubscribeWithToken(token, new Date(now.getTime() + 2_000))).status, "already-unsubscribed");
    await updateCustomerEmailPreference(userId, {
      marketingAllowed: true,
      source: "ACCOUNT_PREFERENCES",
      policyVersion: "email-marketing-v1",
      locale: "en",
    });
    assert.equal((await unsubscribeWithToken(token, new Date(now.getTime() + 2_250))).status, "unsubscribed");
    assert.equal((await processQueuedEmailMessage(queuedBeforeUnsubscribe!.id, { provider, siteUrl: "https://b4gamble.com" })).status, "suppressed");
    assert.equal(provider.messages().length, 1);
    const suppressed = await queueEmailMessage({
      userId, templateKey: "MARKETING_BROADCAST", idempotencyKey: `customer-core:suppressed:${suffix}`,
    });
    assert.equal(suppressed?.status, "SUPPRESSED");
    const transactional = await queueEmailMessage({
      userId, templateKey: "PASSWORD_RESET", idempotencyKey: `customer-core:transactional:${suffix}`,
    });
    assert.equal(transactional?.status, "QUEUED");
    const finalPreference = await prisma.customerEmailPreference.findUniqueOrThrow({ where: { userId } });
    assert.deepEqual({ allowed: finalPreference.marketingAllowed, scope: finalPreference.suppressionScope }, { allowed: false, scope: "MARKETING" });
    const bounced = normalizeResendWebhook(`customer-core-bounced-${suffix}`, {
      type: "email.bounced", created_at: new Date(now.getTime() + 2_500).toISOString(), data: { email_id: providerMessageId },
    });
    assert.equal((await processResendWebhook(bounced)).status, "processed");
    const lateDelivered = normalizeResendWebhook(`customer-core-late-delivered-${suffix}`, {
      type: "email.delivered", created_at: new Date(now.getTime() + 2_750).toISOString(), data: { email_id: providerMessageId },
    });
    assert.equal((await processResendWebhook(lateDelivered)).status, "processed");
    assert.equal((await prisma.emailMessage.findUniqueOrThrow({ where: { id: campaignMessage.id } })).status, "BOUNCED");
    await assert.rejects(updateCustomerEmailPreference(userId, {
      marketingAllowed: true,
      source: "ACCOUNT_PREFERENCES",
      policyVersion: "email-marketing-v1",
      locale: "en",
    }), /suppression cannot be removed/);
    assert.equal((await unsubscribeWithToken(token, new Date(now.getTime() + 3_000))).status, "already-unsubscribed");
    assert.equal((await prisma.customerEmailPreference.findUniqueOrThrow({ where: { userId } })).suppressionScope, "ALL");
    await refreshCampaignStates();

    const range = analyticsRange({ range: "90" }, now);
    const [founder, programme, commercial, emailMetrics] = await Promise.all([
      founderOverview(range), programmeDashboard(range), commercialDashboard(range), emailDashboard(range),
    ]);
    assert.equal(founder.registeredUsers >= 1, true);
    assert.equal(founder.programmeStarts >= 1, true);
    assert.equal(founder.programmeCompletions >= 1, true);
    assert.equal(programme.starts >= 1, true);
    assert.equal(programme.completions >= 1, true);
    assert.equal(programme.steps[0]?.completed >= 1, true);
    assert.equal(commercial.ctaClicks >= 1, true);
    assert.equal(commercial.outboundSuccesses >= 1, true);
    assert.equal(commercial.outboundBlocks >= 1, true);
    assert.equal(emailMetrics.sent >= 1, true);
    assert.equal(emailMetrics.delivered >= 1, true);

    const sanity = await prisma.$queryRaw<Array<{
      duplicateNormalizedEmails: bigint;
      duplicateEventKeys: bigint;
      duplicateProviderEvents: bigint;
      impossibleOutboundStates: bigint;
      marketingEligibilityDefects: bigint;
    }>>`
      SELECT
        (SELECT COUNT(*) FROM (SELECT lower(btrim("email")) FROM "User" GROUP BY 1 HAVING COUNT(*) > 1) duplicate_emails)::bigint AS "duplicateNormalizedEmails",
        (SELECT COUNT(*) FROM (SELECT "dedupeKey" FROM "AnalyticsEvent" GROUP BY 1 HAVING COUNT(*) > 1) duplicate_events)::bigint AS "duplicateEventKeys",
        (SELECT COUNT(*) FROM (SELECT "providerEventId" FROM "EmailProviderEvent" GROUP BY 1 HAVING COUNT(*) > 1) duplicate_provider_events)::bigint AS "duplicateProviderEvents",
        (SELECT COUNT(*) FROM "OutboundClick" WHERE ("state" = 'SUCCEEDED' AND "blockedReason" IS NOT NULL) OR ("state" = 'BLOCKED' AND "blockedReason" IS NULL))::bigint AS "impossibleOutboundStates",
        (SELECT COUNT(*) FROM "CustomerEmailPreference" WHERE "marketingAllowed" = true AND ("unsubscribedAt" IS NOT NULL OR "suppressionScope" <> 'NONE'))::bigint AS "marketingEligibilityDefects"
    `;
    assert.deepEqual(sanity[0], {
      duplicateNormalizedEmails: 0n,
      duplicateEventKeys: 0n,
      duplicateProviderEvents: 0n,
      impossibleOutboundStates: 0n,
      marketingEligibilityDefects: 0n,
    });
  } finally {
    await prisma.emailMessage.deleteMany({ where: { userId } }).catch(() => undefined);
    if (campaignId) await prisma.emailCampaign.deleteMany({ where: { id: campaignId } }).catch(() => undefined);
    if (adminId) await prisma.adminUser.deleteMany({ where: { id: adminId } }).catch(() => undefined);
    await prisma.analyticsEvent.deleteMany({ where: { OR: [{ userId }, { anonymousId }, { outboundClickId: { in: clickIds } }, { dedupeKey: { startsWith: eventPrefix } }] } }).catch(() => undefined);
    await prisma.outboundClick.deleteMany({ where: { id: { in: clickIds } } }).catch(() => undefined);
    await prisma.analyticsSession.deleteMany({ where: { anonymousId } }).catch(() => undefined);
    await prisma.consentEvent.deleteMany({ where: { OR: [{ userId }, { anonymousId }] } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: [userId, duplicateUserId] } } }).catch(() => undefined);
    if (redirectSlugId) await prisma.affiliateRedirectSlug.deleteMany({ where: { id: redirectSlugId } }).catch(() => undefined);
    if (trackingLinkId) await prisma.affiliateTrackingLink.deleteMany({ where: { id: trackingLinkId } }).catch(() => undefined);
    if (offerId) await prisma.affiliateOffer.deleteMany({ where: { id: offerId } }).catch(() => undefined);
    if (affiliateProgramId) await prisma.affiliateProgram.deleteMany({ where: { id: affiliateProgramId } }).catch(() => undefined);
    if (networkId) await prisma.affiliateNetwork.deleteMany({ where: { id: networkId } }).catch(() => undefined);
    if (casinoId) await prisma.casino.deleteMany({ where: { id: casinoId } }).catch(() => undefined);
    if (programVersionId) await prisma.programVersion.deleteMany({ where: { id: programVersionId } }).catch(() => undefined);
    if (programId) await prisma.program.deleteMany({ where: { id: programId } }).catch(() => undefined);
    restoreEnvironment("NODE_ENV", old.NODE_ENV);
    restoreEnvironment("VERCEL_ENV", old.VERCEL_ENV);
    restoreEnvironment("ANALYTICS_SIGNING_SECRET", old.ANALYTICS_SIGNING_SECRET);
    restoreEnvironment("PROGRAMME_REMINDER_INACTIVITY_DAYS", old.PROGRAMME_REMINDER_INACTIVITY_DAYS);
    restoreEnvironment("LIFECYCLE_EMAIL_DELIVERY_ENABLED", old.LIFECYCLE_EMAIL_DELIVERY_ENABLED);
  }
});

test.after(async () => {
  await prisma.$disconnect();
});

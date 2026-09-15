import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { updateCustomerEmailPreference } from "../lib/customers/email-preference.server";
import {
  campaignRecipientIdempotencyKey,
  createEmailCampaign,
  queueEmailCampaign,
  refreshCampaignStates,
  reviewEmailCampaign,
} from "../lib/email/campaigns.server";
import type {
  EmailProviderEnvelope,
  EmailProviderResult,
  LifecycleEmailProvider,
} from "../lib/email/provider.server";
import {
  authEmailIdempotencyKey,
  processQueuedEmailBatch,
  processQueuedEmailMessage,
  queueEmailMessage,
  recoverStaleEmailClaims,
  sendAuthEmail,
} from "../lib/email/service.server";
import { normalizeResendWebhook, processResendWebhook } from "../lib/email/webhook.server";

const prisma = new PrismaClient();
const SITE_URL = "https://b4gamble.com";
const environmentNames = [
  "NODE_ENV",
  "VERCEL_ENV",
  "ANALYTICS_SIGNING_SECRET",
  "BETTER_AUTH_SECRET",
  "LIFECYCLE_EMAIL_DELIVERY_ENABLED",
] as const;
const previousEnvironment = Object.fromEntries(environmentNames.map((name) => [name, process.env[name]]));
const createdUserIds: string[] = [];
const createdCampaignIds: string[] = [];
const createdAdminIds: string[] = [];

class RecordingProvider implements LifecycleEmailProvider {
  readonly envelopes: EmailProviderEnvelope[] = [];
  private readonly accepted = new Map<string, string>();

  constructor(private readonly result?: EmailProviderResult | Error) {}

  async send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult> {
    this.envelopes.push(envelope);
    if (this.result instanceof Error) throw this.result;
    if (this.result) return this.result;
    const messageId = this.accepted.get(envelope.idempotencyKey) ?? `memory-${randomUUID()}`;
    this.accepted.set(envelope.idempotencyKey, messageId);
    return { status: "accepted", provider: "memory", messageId };
  }
}

class IdempotentResendProvider implements LifecycleEmailProvider {
  readonly envelopes: EmailProviderEnvelope[] = [];
  private readonly accepted = new Map<string, string>();

  async send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult> {
    this.envelopes.push(envelope);
    const messageId = this.accepted.get(envelope.idempotencyKey) ?? `resend-${randomUUID()}`;
    this.accepted.set(envelope.idempotencyKey, messageId);
    return { status: "accepted", provider: "resend", messageId };
  }
}

class DeferredProvider implements LifecycleEmailProvider {
  readonly started: Promise<void>;
  private markStarted!: () => void;
  private releaseSend!: (result: EmailProviderResult) => void;

  constructor() {
    this.started = new Promise((resolve) => { this.markStarted = resolve; });
  }

  async send(): Promise<EmailProviderResult> {
    this.markStarted();
    return new Promise((resolve) => { this.releaseSend = resolve; });
  }

  release(result: EmailProviderResult) {
    this.releaseSend(result);
  }
}

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!["127.0.0.1", "localhost", "postgres"].includes(url.hostname)
    || !/(?:test|ci|disposable)/i.test(url.pathname)) {
    throw new Error("Email reliability tests require disposable local/CI PostgreSQL");
  }
}

async function createUser(marketingAllowed = false) {
  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: {
      id: `email-reliability-${suffix}`,
      name: "Email Reliability Fixture",
      email: `email-reliability-${suffix}@example.invalid`,
      emailVerified: true,
      preferredLocale: "en",
    },
  });
  createdUserIds.push(user.id);
  if (marketingAllowed) {
    await updateCustomerEmailPreference(user.id, {
      marketingAllowed: true,
      source: "ACCOUNT_PREFERENCES",
      policyVersion: "email-marketing-v1",
      locale: "en",
    });
  }
  return user;
}

async function deleteUserEvidence(userId: string) {
  await prisma.analyticsEvent.deleteMany({ where: { userId } });
  await prisma.consentEvent.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  const index = createdUserIds.indexOf(userId);
  if (index >= 0) createdUserIds.splice(index, 1);
}

test.before(async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  Object.assign(process.env, {
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    ANALYTICS_SIGNING_SECRET: "email-reliability-postgres-secret-32",
    BETTER_AUTH_SECRET: "email-reliability-better-auth-secret-32",
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: "false",
  });
});

test("auth password-reset and verification messages use one queued claim before normal send", async () => {
  const user = await createUser();
  try {
    const provider = new RecordingProvider();
    const resetUrl = `${SITE_URL}/api/auth/reset-password/reset-token?callbackURL=%2Freset-password`;
    const verificationUrl = `${SITE_URL}/api/auth/verify-email?token=verification-token&callbackURL=%2Fprogram`;
    assert.deepEqual(await sendAuthEmail({ user, actionUrl: resetUrl, templateKey: "PASSWORD_RESET" }, {
      provider, siteUrl: SITE_URL,
    }), { status: "sent" });
    assert.deepEqual(await sendAuthEmail({ user, actionUrl: verificationUrl, templateKey: "EMAIL_VERIFICATION" }, {
      provider, siteUrl: SITE_URL,
    }), { status: "sent" });
    assert.equal(provider.envelopes.length, 2);
    assert.match(provider.envelopes[0]!.text, /reset-token/);
    assert.match(provider.envelopes[1]!.text, /verification-token/);
    const messages = await prisma.emailMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(messages.map(({ purpose, status, attemptCount }) => ({ purpose, status, attemptCount })), [
      { purpose: "PASSWORD_RESET", status: "SENT", attemptCount: 1 },
      { purpose: "EMAIL_VERIFICATION", status: "SENT", attemptCount: 1 },
    ]);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("explicit rejection is terminal while provider 5xx and timeout are bounded retryable failures", async () => {
  const user = await createUser();
  try {
    const cases = [
      { token: "rejected", code: "REJECTED" as const, retryable: false },
      { token: "server-error", code: "PROVIDER_5XX" as const, retryable: true },
      { token: "timeout", code: "TIMEOUT" as const, retryable: true },
    ];
    for (const item of cases) {
      const actionUrl = `${SITE_URL}/api/auth/reset-password/${item.token}?callbackURL=%2Freset-password`;
      const provider = new RecordingProvider({ status: "unavailable", code: item.code });
      assert.deepEqual(await sendAuthEmail({ user, actionUrl, templateKey: "PASSWORD_RESET" }, {
        provider, siteUrl: SITE_URL,
      }), { status: "failed", code: item.code });
      const message = await prisma.emailMessage.findUniqueOrThrow({
        where: { environment_idempotencyKey: { environment: "PRODUCTION", idempotencyKey: authEmailIdempotencyKey(user.id, actionUrl) } },
      });
      assert.equal(message.status, "FAILED");
      assert.equal(message.deliveryErrorCode, item.code);
      assert.equal(message.nextAttemptAt !== null, item.retryable);
    }
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("an unexpected provider exception becomes a retryable NETWORK result without stranding SENDING", async () => {
  const user = await createUser();
  try {
    const actionUrl = `${SITE_URL}/api/auth/reset-password/network-error?callbackURL=%2Freset-password`;
    const result = await sendAuthEmail({ user, actionUrl, templateKey: "PASSWORD_RESET" }, {
      provider: new RecordingProvider(new Error("secret provider detail")),
      siteUrl: SITE_URL,
    });
    assert.deepEqual(result, { status: "failed", code: "NETWORK" });
    const message = await prisma.emailMessage.findFirstOrThrow({ where: { userId: user.id } });
    assert.equal(message.status, "FAILED");
    assert.ok(message.nextAttemptAt);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("a process death after auth claim is reclaimed once with the same provider idempotency key", async () => {
  const user = await createUser();
  try {
    const actionUrl = `${SITE_URL}/api/auth/reset-password/crash-before-provider?callbackURL=%2Freset-password`;
    const message = await queueEmailMessage({
      userId: user.id,
      templateKey: "PASSWORD_RESET",
      idempotencyKey: authEmailIdempotencyKey(user.id, actionUrl),
    });
    assert.ok(message);
    const now = new Date();
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: "SENDING", attemptCount: 1, lastAttemptAt: new Date(now.getTime() - 16 * 60_000) },
    });
    const provider = new RecordingProvider();
    assert.equal((await processQueuedEmailMessage(message.id, { provider, siteUrl: SITE_URL, actionUrl, now })).status, "sent");
    const recovered = await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } });
    assert.deepEqual({ status: recovered.status, attemptCount: recovered.attemptCount }, { status: "SENT", attemptCount: 2 });
    assert.equal(provider.envelopes.length, 1);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("the ordinary recovery sweep makes stale auth claims retryable and terminalizes expired ambiguity", async () => {
  const user = await createUser();
  try {
    const now = new Date();
    const staleUrl = `${SITE_URL}/api/auth/reset-password/stale-claim?callbackURL=%2Freset-password`;
    const expiredUrl = `${SITE_URL}/api/auth/reset-password/expired-claim?callbackURL=%2Freset-password`;
    const stale = await queueEmailMessage({ userId: user.id, templateKey: "PASSWORD_RESET", idempotencyKey: authEmailIdempotencyKey(user.id, staleUrl) });
    const expired = await queueEmailMessage({ userId: user.id, templateKey: "PASSWORD_RESET", idempotencyKey: authEmailIdempotencyKey(user.id, expiredUrl) });
    assert.ok(stale && expired);
    await prisma.emailMessage.update({ where: { id: stale.id }, data: { status: "SENDING", attemptCount: 1, lastAttemptAt: new Date(now.getTime() - 16 * 60_000) } });
    await prisma.emailMessage.update({ where: { id: expired.id }, data: { status: "SENDING", attemptCount: 1, lastAttemptAt: new Date(now.getTime() - 24 * 60 * 60_000) } });
    const recovery = await recoverStaleEmailClaims(now);
    assert.deepEqual(recovery, { staleAuth: 1, expiredSending: 1, exhaustedSending: 0, expiredAmbiguousFailures: 0 });
    const states = await prisma.emailMessage.findMany({ where: { id: { in: [stale.id, expired.id] } }, orderBy: { id: "asc" } });
    assert.deepEqual(states.map((message) => [message.status, message.deliveryErrorCode]).sort(), [
      ["FAILED", "STALE_AUTH_CLAIM"],
      ["UNKNOWN", "IDEMPOTENCY_HORIZON_EXPIRED"],
    ]);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("duplicate auth requests and concurrent workers produce one claim, one provider call, and one attempt", async () => {
  const user = await createUser();
  try {
    const actionUrl = `${SITE_URL}/api/auth/reset-password/duplicate?callbackURL=%2Freset-password`;
    const provider = new RecordingProvider();
    const authResults = await Promise.all([
      sendAuthEmail({ user, actionUrl, templateKey: "PASSWORD_RESET" }, { provider, siteUrl: SITE_URL }),
      sendAuthEmail({ user, actionUrl, templateKey: "PASSWORD_RESET" }, { provider, siteUrl: SITE_URL }),
    ]);
    assert.deepEqual(authResults.map((result) => result.status).sort(), ["duplicate", "sent"]);
    assert.equal(provider.envelopes.length, 1);
    const authMessage = await prisma.emailMessage.findFirstOrThrow({ where: { userId: user.id } });
    assert.equal(authMessage.attemptCount, 1);

    const welcome = await queueEmailMessage({
      userId: user.id,
      templateKey: "WELCOME",
      idempotencyKey: `email-reliability:concurrent:${randomUUID()}`,
    });
    assert.ok(welcome);
    const workerProvider = new RecordingProvider();
    const workerResults = await Promise.all([
      processQueuedEmailMessage(welcome.id, { provider: workerProvider, siteUrl: SITE_URL }),
      processQueuedEmailMessage(welcome.id, { provider: workerProvider, siteUrl: SITE_URL }),
    ]);
    assert.deepEqual(workerResults.map((result) => result.status).sort(), ["not-claimed", "sent"]);
    assert.equal(workerProvider.envelopes.length, 1);
    assert.equal((await prisma.emailMessage.findUniqueOrThrow({ where: { id: welcome.id } })).attemptCount, 1);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("an expired worker result cannot overwrite a newer successful claim", async () => {
  const user = await createUser();
  try {
    const message = await queueEmailMessage({
      userId: user.id,
      templateKey: "WELCOME",
      idempotencyKey: `email-reliability:lease-cas:${randomUUID()}`,
    });
    assert.ok(message);
    const firstClaimAt = new Date(Date.now() - 16 * 60_000);
    const deferred = new DeferredProvider();
    const expiredWorker = processQueuedEmailMessage(message.id, { provider: deferred, siteUrl: SITE_URL, now: firstClaimAt });
    await deferred.started;
    const currentWorker = await processQueuedEmailMessage(message.id, {
      provider: new RecordingProvider(),
      siteUrl: SITE_URL,
      now: new Date(),
    });
    assert.equal(currentWorker.status, "sent");
    deferred.release({ status: "unavailable", code: "PROVIDER_5XX" });
    assert.equal((await expiredWorker).status, "stale-result");
    const finalMessage = await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } });
    assert.deepEqual({ status: finalMessage.status, attemptCount: finalMessage.attemptCount }, { status: "SENT", attemptCount: 2 });
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("suppression and consent are re-read after queueing and before every retry", async () => {
  const transactionalUser = await createUser();
  const marketingUser = await createUser(true);
  try {
    const firstAttemptAt = new Date();
    const authUrl = `${SITE_URL}/api/auth/reset-password/suppressed?callbackURL=%2Freset-password`;
    const auth = await queueEmailMessage({ userId: transactionalUser.id, templateKey: "PASSWORD_RESET", idempotencyKey: authEmailIdempotencyKey(transactionalUser.id, authUrl) });
    const marketing = await queueEmailMessage({ userId: marketingUser.id, templateKey: "MARKETING_BROADCAST", idempotencyKey: `email-reliability:marketing:${randomUUID()}` });
    assert.ok(auth && marketing);
    const transientProvider = new RecordingProvider({ status: "unavailable", code: "PROVIDER_5XX" });
    assert.equal((await processQueuedEmailMessage(auth.id, {
      provider: transientProvider,
      siteUrl: SITE_URL,
      actionUrl: authUrl,
      now: firstAttemptAt,
    })).status, "failed");
    assert.equal((await processQueuedEmailMessage(marketing.id, {
      provider: transientProvider,
      siteUrl: SITE_URL,
      now: firstAttemptAt,
    })).status, "failed");
    assert.equal(transientProvider.envelopes.length, 2);

    const suppressedAt = new Date(firstAttemptAt.getTime() + 60_000);
    await prisma.customerEmailPreference.create({
      data: { userId: transactionalUser.id, marketingAllowed: false, suppressionScope: "ALL", suppressedAt, suppressionReason: "TEST_SUPPRESSION" },
    });
    await prisma.customerEmailPreference.update({
      where: { userId: marketingUser.id },
      data: { marketingAllowed: false, unsubscribedAt: suppressedAt, suppressionScope: "MARKETING", suppressedAt, suppressionReason: "UNSUBSCRIBE" },
    });
    const retryAt = new Date(firstAttemptAt.getTime() + 6 * 60_000);
    const retryProvider = new RecordingProvider();
    assert.equal((await processQueuedEmailMessage(auth.id, {
      provider: retryProvider,
      siteUrl: SITE_URL,
      actionUrl: authUrl,
      now: retryAt,
    })).status, "suppressed");
    assert.equal((await processQueuedEmailMessage(marketing.id, {
      provider: retryProvider,
      siteUrl: SITE_URL,
      now: retryAt,
    })).status, "suppressed");
    assert.equal(retryProvider.envelopes.length, 0);
  } finally {
    await deleteUserEvidence(transactionalUser.id);
    await deleteUserEvidence(marketingUser.id);
  }
});

test("partial campaign preparation has zero send authority; retry completes without duplicate recipients", async () => {
  const users = await Promise.all([createUser(true), createUser(true), createUser(true)]);
  const admin = await prisma.adminUser.create({
    data: { email: `email-reliability-admin-${randomUUID()}@example.invalid`, name: "Email Reliability Admin", role: "ADMIN" },
  });
  createdAdminIds.push(admin.id);
  try {
    const template = await prisma.emailTemplate.findFirstOrThrow({ where: { key: "MARKETING_BROADCAST", locale: "en", active: true } });
    const campaign = await createEmailCampaign({
      name: "Email reliability partial preparation",
      templateId: template.id,
      idempotencyKey: `email-reliability-campaign-${randomUUID()}`,
      locale: "en",
      countryCode: null,
      programmeSegment: "ANY",
      inactiveDays: null,
      newUsersOnly: false,
    }, admin.id);
    assert.ok(campaign);
    createdCampaignIds.push(campaign.id);
    assert.equal((await reviewEmailCampaign(campaign.id, admin.id))?.status, "REVIEWED");
    const partialMessages = [];
    for (const user of users.slice(0, 2)) {
      partialMessages.push(await queueEmailMessage({
        userId: user.id,
        templateKey: "MARKETING_BROADCAST",
        templateId: template.id,
        campaignId: campaign.id,
        idempotencyKey: campaignRecipientIdempotencyKey(campaign.id, user.id),
      }));
    }
    const blockedProvider = new RecordingProvider();
    for (const message of partialMessages) {
      assert.ok(message);
      assert.equal((await processQueuedEmailMessage(message.id, { provider: blockedProvider, siteUrl: SITE_URL })).status, "campaign-not-authorized");
      assert.equal((await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } })).attemptCount, 0);
    }
    assert.equal(blockedProvider.envelopes.length, 0);
    const blockedBatch = await processQueuedEmailBatch(50, { provider: blockedProvider, siteUrl: SITE_URL });
    assert.equal(blockedBatch.selected, 0);
    assert.equal(blockedProvider.envelopes.length, 0);

    assert.equal((await queueEmailCampaign(campaign.id, admin.id)).status, "QUEUED");
    await queueEmailCampaign(campaign.id, admin.id);
    const campaignMessages = await prisma.emailMessage.findMany({ where: { campaignId: campaign.id } });
    assert.equal(campaignMessages.length, 3);
    assert.equal(new Set(campaignMessages.map((message) => message.userId)).size, 3);
    const provider = new RecordingProvider();
    const delivery = await processQueuedEmailBatch(50, { provider, siteUrl: SITE_URL });
    assert.deepEqual({ selected: delivery.selected, sent: delivery.sent, failed: delivery.failed }, { selected: 3, sent: 3, failed: 0 });
    assert.equal(provider.envelopes.length, 3);
    await refreshCampaignStates();
    assert.equal((await prisma.emailCampaign.findUniqueOrThrow({ where: { id: campaign.id } })).status, "COMPLETED");
  } finally {
    await prisma.emailMessage.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    for (const campaignId of createdCampaignIds.splice(0)) await prisma.emailCampaign.deleteMany({ where: { id: campaignId } });
    for (const user of users) await deleteUserEvidence(user.id);
    await prisma.adminUser.deleteMany({ where: { id: admin.id } });
    const index = createdAdminIds.indexOf(admin.id);
    if (index >= 0) createdAdminIds.splice(index, 1);
  }
});

test("an ambiguous accepted send reconciles by idempotent replay and later webhook replay", async () => {
  const user = await createUser();
  try {
    const message = await queueEmailMessage({ userId: user.id, templateKey: "WELCOME", idempotencyKey: `email-reliability:ambiguous:${randomUUID()}` });
    assert.ok(message);
    const provider = new IdempotentResendProvider();
    const providerAcceptance = await provider.send({
      to: user.email,
      subject: message.subject,
      html: "<p>accepted before crash</p>",
      text: "accepted before crash",
      idempotencyKey: message.idempotencyKey,
    });
    assert.equal(providerAcceptance.status, "accepted");
    if (providerAcceptance.status !== "accepted") throw new Error("fixture acceptance failed");
    const now = new Date();
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: "SENDING", attemptCount: 1, lastAttemptAt: new Date(now.getTime() - 16 * 60_000) },
    });
    const event = normalizeResendWebhook(`email-reliability-event-${randomUUID()}`, {
      type: "email.delivered",
      created_at: now.toISOString(),
      data: { email_id: providerAcceptance.messageId },
    });
    assert.equal((await processResendWebhook(event)).status, "ignored");
    assert.equal((await processQueuedEmailMessage(message.id, { provider, siteUrl: SITE_URL, now })).status, "sent");
    const reconciled = await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } });
    assert.equal(reconciled.providerMessageId, providerAcceptance.messageId);
    assert.equal(provider.envelopes.length, 2);
    assert.equal((await processResendWebhook(event)).status, "processed");
    assert.equal((await processResendWebhook(event)).status, "duplicate");
    assert.equal((await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } })).status, "DELIVERED");
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test("marketing suppression remains separate from transactional password recovery", async () => {
  const user = await createUser();
  try {
    await prisma.customerEmailPreference.create({
      data: {
        userId: user.id,
        marketingAllowed: false,
        suppressionScope: "MARKETING",
        unsubscribedAt: new Date(),
        suppressedAt: new Date(),
        suppressionReason: "UNSUBSCRIBE",
      },
    });
    const marketing = await queueEmailMessage({ userId: user.id, templateKey: "MARKETING_BROADCAST", idempotencyKey: `email-reliability:suppressed-marketing:${randomUUID()}` });
    assert.equal(marketing?.status, "SUPPRESSED");
    const provider = new RecordingProvider();
    const actionUrl = `${SITE_URL}/api/auth/reset-password/transactional-separation?callbackURL=%2Freset-password`;
    assert.equal((await sendAuthEmail({ user, actionUrl, templateKey: "PASSWORD_RESET" }, { provider, siteUrl: SITE_URL })).status, "sent");
    assert.equal(provider.envelopes.length, 1);
  } finally {
    await deleteUserEvidence(user.id);
  }
});

test.after(async () => {
  if (createdUserIds.length) {
    await prisma.emailMessage.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.analyticsEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.consentEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  if (createdCampaignIds.length) await prisma.emailCampaign.deleteMany({ where: { id: { in: createdCampaignIds } } });
  if (createdAdminIds.length) await prisma.adminUser.deleteMany({ where: { id: { in: createdAdminIds } } });
  for (const name of environmentNames) {
    const value = previousEnvironment[name];
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Object.assign(process.env, { [name]: value });
  }
  await prisma.$disconnect();
});

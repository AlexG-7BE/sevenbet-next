import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import type { EmailPurpose, EmailTemplateKey, Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { analyticsEnvironment, analyticsSigningSecret } from "@/lib/analytics/identity.server";
import { recordServerAnalyticsEventBestEffort } from "@/lib/analytics/service.server";
import { emailSendEligibility, marketingEmailPurposes } from "@/lib/email/eligibility";
import {
  DisabledLifecycleEmailProvider,
  ResendLifecycleEmailProvider,
  type LifecycleEmailProvider,
} from "@/lib/email/provider.server";
import { resolveLifecycleEmailRuntimeConfig } from "@/lib/email/runtime-config.server";
import { activeEmailTemplate, renderEmailTemplate } from "@/lib/email/templates.server";

const EMAIL_TOKEN_DOMAIN = "b4gamble:email-unsubscribe:v1";
const EMAIL_AUTH_KEY_DOMAIN = "b4gamble:email-auth-action:v1";
const MAX_EMAIL_ATTEMPTS = 5;
const EMAIL_CLAIM_STALE_MS = 15 * 60_000;
const PROVIDER_IDEMPOTENCY_HORIZON_MS = 23 * 60 * 60_000;
const AUTH_EMAIL_PURPOSES = ["EMAIL_VERIFICATION", "PASSWORD_RESET"] as const satisfies readonly EmailPurpose[];
const WORKER_EMAIL_PURPOSES = ["WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST", "TEST"] as const satisfies readonly EmailPurpose[];
const CAMPAIGN_SEND_STATES = ["QUEUED", "SENDING"] as const;
const RETRYABLE_PROVIDER_CODES = new Set(["NOT_CONFIGURED", "TIMEOUT", "NETWORK", "RATE_LIMITED", "PROVIDER_5XX"]);

function logEmailDeliveryState(
  state: "claimed" | "stale_claim_reclaimed" | "retry_scheduled" | "terminal_failure" | "campaign_not_authorized",
  purpose: EmailPurpose,
) {
  console.info("[email] delivery state", {
    email_delivery_state: state,
    email_purpose: purpose,
  });
}

const purposeByTemplate: Record<EmailTemplateKey, EmailPurpose> = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  ACCOUNT_SECURITY: "ACCOUNT_SECURITY",
  WELCOME: "WELCOME",
  PROGRAMME_REMINDER: "PROGRAMME_REMINDER",
  MARKETING_BROADCAST: "MARKETING_BROADCAST",
};

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function isAuthEmailPurpose(purpose: EmailPurpose) {
  return AUTH_EMAIL_PURPOSES.includes(purpose as typeof AUTH_EMAIL_PURPOSES[number]);
}

function validAuthActionUrl(value: string | undefined, siteUrl: string | null) {
  if (!value || !siteUrl) return null;
  try {
    const candidate = new URL(value);
    return candidate.origin === siteUrl && !candidate.username && !candidate.password
      ? candidate.toString()
      : null;
  } catch {
    return null;
  }
}

function campaignSendAuthority(environment: ReturnType<typeof analyticsEnvironment>): Prisma.EmailMessageWhereInput {
  return {
    OR: [
      { campaignId: null },
      { campaign: { is: { environment, status: { in: [...CAMPAIGN_SEND_STATES] } } } },
    ],
  };
}

function claimableState(now: Date): Prisma.EmailMessageWhereInput {
  const staleBefore = new Date(now.getTime() - EMAIL_CLAIM_STALE_MS);
  const providerHorizon = new Date(now.getTime() - PROVIDER_IDEMPOTENCY_HORIZON_MS);
  return {
    OR: [
      {
        status: { in: ["QUEUED", "FAILED"] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      {
        status: "SENDING",
        lastAttemptAt: { lt: staleBefore, gte: providerHorizon },
      },
    ],
  };
}

function providerForRuntime(): { provider: LifecycleEmailProvider; siteUrl: string | null } {
  const config = resolveLifecycleEmailRuntimeConfig();
  return config
    ? { provider: new ResendLifecycleEmailProvider(config), siteUrl: config.siteUrl }
    : { provider: new DisabledLifecycleEmailProvider(), siteUrl: null };
}

export function unsubscribeTokenForMessage(messageId: string, secret = analyticsSigningSecret()) {
  if (!messageId) throw new Error("Email message identifier is required");
  return createHmac("sha256", secret).update(`${EMAIL_TOKEN_DOMAIN}\n${messageId}`).digest("base64url");
}

export function hashUnsubscribeToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function opaqueLifecycleKey(scope: "welcome" | "programme-reminder", subjectId: string, templateVersion: number) {
  const digest = createHash("sha256")
    .update(`b4gamble:lifecycle:${scope}:v1\n${subjectId}\n${templateVersion}`, "utf8")
    .digest("hex");
  return `lifecycle:${scope}:v${templateVersion}:${digest}`;
}

export function authEmailIdempotencyKey(userId: string, actionUrl: string, secret = analyticsSigningSecret()) {
  const digest = createHmac("sha256", secret)
    .update(`${EMAIL_AUTH_KEY_DOMAIN}\n${userId}\n${actionUrl}`, "utf8")
    .digest("hex");
  return `auth:${digest}`;
}

export function welcomeEmailIdempotencyKey(userId: string, templateVersion: number) {
  if (!userId || !Number.isSafeInteger(templateVersion) || templateVersion < 1) {
    throw new Error("Welcome email idempotency input is invalid");
  }
  return opaqueLifecycleKey("welcome", userId, templateVersion);
}

export function programmeReminderIdempotencyKey(enrollmentId: string, templateVersion: number) {
  if (!enrollmentId || !Number.isSafeInteger(templateVersion) || templateVersion < 1) {
    throw new Error("Programme reminder idempotency input is invalid");
  }
  return opaqueLifecycleKey("programme-reminder", enrollmentId, templateVersion);
}

async function currentEligibility(userId: string, purpose: EmailPurpose) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      accountState: true,
      preferredLocale: true,
      emailPreference: {
        select: {
          marketingAllowed: true,
          unsubscribedAt: true,
          suppressionScope: true,
        },
      },
    },
  });
  if (!user) return null;
  const decision = emailSendEligibility({
    accountState: user.accountState,
    emailVerified: user.emailVerified,
    email: user.email,
    purpose,
    marketingAllowed: user.emailPreference?.marketingAllowed ?? false,
    unsubscribedAt: user.emailPreference?.unsubscribedAt ?? null,
    suppressionScope: user.emailPreference?.suppressionScope ?? "NONE",
  });
  return { user, decision };
}

export async function queueEmailMessage({
  userId,
  templateKey,
  idempotencyKey,
  campaignId,
  templateId,
  isTest = false,
}: {
  userId: string;
  templateKey: EmailTemplateKey;
  idempotencyKey: string;
  campaignId?: string | null;
  templateId?: string | null;
  isTest?: boolean;
}) {
  if (!idempotencyKey || idempotencyKey.length > 200) throw new Error("Email idempotency key is invalid");
  const environment = analyticsEnvironment();
  const purpose = isTest ? "TEST" : purposeByTemplate[templateKey];
  const eligibility = await currentEligibility(userId, purpose);
  if (!eligibility) return null;
  const locale = eligibility.user.preferredLocale || "en";
  const template = templateId
    ? await prisma.emailTemplate.findFirst({ where: { id: templateId, key: templateKey, ...(isTest ? {} : { active: true }) } })
    : await activeEmailTemplate(templateKey, locale);
  if (!template) throw new Error(`No active ${templateKey} email template`);
  const rendered = renderEmailTemplate(template, {
    name: eligibility.user.name,
    action_url: "",
    programme_url: "",
    unsubscribe_url: "",
  });
  const status = eligibility.decision.allowed ? "QUEUED" : "SUPPRESSED";
  try {
    const message = await prisma.emailMessage.create({
      data: {
        userId,
        campaignId: campaignId ?? null,
        templateId: template.id,
        purpose,
        status,
        environment,
        locale: template.locale,
        recipientEmail: eligibility.user.email.trim().toLowerCase(),
        subject: isTest ? `[TEST] ${rendered.subject}` : rendered.subject,
        templateVersion: template.version,
        idempotencyKey,
        isTest,
        ...(status === "SUPPRESSED" ? {
          deliveryErrorCode: eligibility.decision.reason.slice(0, 64),
        } : {}),
      },
    });
    return { ...message, createdNow: true };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const message = await prisma.emailMessage.findUnique({
      where: { environment_idempotencyKey: { environment, idempotencyKey } },
    });
    return message ? { ...message, createdNow: false } : null;
  }
}

export async function queueWelcomeEmail(userId: string) {
  const template = await activeEmailTemplate("WELCOME", "en");
  if (!template) return null;
  return queueEmailMessage({
    userId,
    templateKey: "WELCOME",
    templateId: template.id,
    idempotencyKey: welcomeEmailIdempotencyKey(userId, template.version),
  });
}

async function claimQueuedMessage(messageId: string, now: Date, environment: ReturnType<typeof analyticsEnvironment>) {
  const claimed = await prisma.emailMessage.updateMany({
    where: {
      id: messageId,
      environment,
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
      AND: [claimableState(now), campaignSendAuthority(environment)],
    },
    data: {
      status: "SENDING",
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
      nextAttemptAt: null,
    },
  });
  return claimed.count === 1;
}

async function settleClaim(
  messageId: string,
  claimStartedAt: Date,
  data: Prisma.EmailMessageUpdateManyMutationInput,
) {
  const settled = await prisma.emailMessage.updateMany({
    where: { id: messageId, status: "SENDING", lastAttemptAt: claimStartedAt },
    data,
  });
  return settled.count === 1;
}

function retryAt(attemptCount: number, now: Date) {
  const minutes = Math.min(60, 5 * (2 ** Math.max(0, attemptCount - 1)));
  return new Date(now.getTime() + minutes * 60_000);
}

function providerFailureState(code: string, attemptCount: number, now: Date) {
  const retryable = RETRYABLE_PROVIDER_CODES.has(code) && attemptCount < MAX_EMAIL_ATTEMPTS;
  return {
    status: "FAILED" as const,
    failedAt: now,
    nextAttemptAt: retryable ? retryAt(attemptCount, now) : null,
    deliveryErrorCode: code.slice(0, 64),
  };
}

async function ensureCurrentUnsubscribeToken({
  messageId,
  userId,
  token,
}: {
  messageId: string;
  userId: string;
  token: string;
}) {
  const tokenHash = hashUnsubscribeToken(token);
  const existing = await prisma.emailUnsubscribeToken.findUnique({ where: { messageId } });
  if (existing) return existing.userId === userId && existing.tokenHash === tokenHash;
  try {
    await prisma.emailUnsubscribeToken.create({ data: { messageId, userId, tokenHash } });
    return true;
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const raced = await prisma.emailUnsubscribeToken.findUnique({ where: { messageId } });
    return raced?.userId === userId && raced.tokenHash === tokenHash;
  }
}

export async function processQueuedEmailMessage(
  messageId: string,
  overrides: { provider?: LifecycleEmailProvider; siteUrl?: string; actionUrl?: string; now?: Date } = {},
) {
  const now = overrides.now ?? new Date();
  const environment = analyticsEnvironment();
  const runtime = providerForRuntime();
  const provider = overrides.provider ?? runtime.provider;
  const siteUrl = overrides.siteUrl ?? runtime.siteUrl;
  const candidate = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    select: {
      purpose: true,
      status: true,
      campaignId: true,
      campaign: { select: { environment: true, status: true } },
    },
  });
  if (!candidate) return { status: "not-found" } as const;
  if (candidate.campaignId && (!candidate.campaign
    || candidate.campaign.environment !== environment
    || !CAMPAIGN_SEND_STATES.includes(candidate.campaign.status as typeof CAMPAIGN_SEND_STATES[number]))) {
    logEmailDeliveryState("campaign_not_authorized", candidate.purpose);
    return { status: "campaign-not-authorized" } as const;
  }
  const actionUrl = isAuthEmailPurpose(candidate.purpose)
    ? validAuthActionUrl(overrides.actionUrl, siteUrl)
    : null;
  if (isAuthEmailPurpose(candidate.purpose) && !actionUrl) {
    return { status: "auth-action-unavailable" } as const;
  }
  if (!await claimQueuedMessage(messageId, now, environment)) return { status: "not-claimed" } as const;
  logEmailDeliveryState(candidate.status === "SENDING" ? "stale_claim_reclaimed" : "claimed", candidate.purpose);
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: { template: true, campaign: { select: { environment: true, status: true } } },
  });
  if (!message) return { status: "not-found" } as const;
  const eligibility = await currentEligibility(message.userId, message.purpose);
  if (!eligibility?.decision.allowed) {
    if (!await settleClaim(message.id, now, {
      status: "SUPPRESSED",
      nextAttemptAt: null,
      deliveryErrorCode: (eligibility?.decision.reason ?? "ACCOUNT_NOT_FOUND").slice(0, 64),
    })) return { status: "stale-result" } as const;
    return { status: "suppressed" } as const;
  }
  if (!siteUrl) {
    const failure = providerFailureState("NOT_CONFIGURED", message.attemptCount, now);
    if (!await settleClaim(message.id, now, failure)) {
      return { status: "stale-result" } as const;
    }
    logEmailDeliveryState(failure.nextAttemptAt ? "retry_scheduled" : "terminal_failure", message.purpose);
    return { status: "unavailable", code: "NOT_CONFIGURED" } as const;
  }
  const needsUnsubscribe = marketingEmailPurposes.includes(message.purpose as typeof marketingEmailPurposes[number]);
  const token = needsUnsubscribe ? unsubscribeTokenForMessage(message.id) : null;
  if (token && !await ensureCurrentUnsubscribeToken({ messageId: message.id, userId: message.userId, token })) {
    // Never overwrite the hash behind a link that may already be in a
    // customer's inbox after signing-secret rotation. Stop this ambiguous
    // message; a newly queued message can use the new secret safely.
    if (!await settleClaim(message.id, now, {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "UNSUBSCRIBE_TOKEN_MISMATCH",
    })) return { status: "stale-result" } as const;
    logEmailDeliveryState("terminal_failure", message.purpose);
    return { status: "unknown", code: "UNSUBSCRIBE_TOKEN_MISMATCH" } as const;
  }
  // This is intentionally a second, immediate read. Audience selection and
  // queue-time eligibility are advisory; the current authority immediately
  // before the provider call decides whether anything may leave B4GAMBLE.
  const finalEligibility = await currentEligibility(message.userId, message.purpose);
  if (!finalEligibility?.decision.allowed) {
    if (!await settleClaim(message.id, now, {
      status: "SUPPRESSED",
      nextAttemptAt: null,
      deliveryErrorCode: (finalEligibility?.decision.reason ?? "ACCOUNT_NOT_FOUND").slice(0, 64),
    })) return { status: "stale-result" } as const;
    return { status: "suppressed" } as const;
  }
  if (message.campaignId) {
    const campaignAuthorized = await prisma.emailCampaign.count({
      where: {
        id: message.campaignId,
        environment,
        status: { in: [...CAMPAIGN_SEND_STATES] },
      },
    });
    if (campaignAuthorized !== 1) {
      if (!await settleClaim(message.id, now, {
        status: "QUEUED",
        nextAttemptAt: null,
        deliveryErrorCode: "CAMPAIGN_NOT_AUTHORIZED",
      })) return { status: "stale-result" } as const;
      logEmailDeliveryState("campaign_not_authorized", message.purpose);
      return { status: "campaign-not-authorized" } as const;
    }
  }
  const currentRecipientEmail = finalEligibility.user.email.trim().toLowerCase();
  let rendered: ReturnType<typeof renderEmailTemplate>;
  try {
    rendered = renderEmailTemplate(message.template, {
      name: finalEligibility.user.name,
      action_url: actionUrl ?? "",
      programme_url: `${siteUrl}/program`,
      unsubscribe_url: token ? `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` : `${siteUrl}/unsubscribe?test=1`,
    });
  } catch {
    if (!await settleClaim(message.id, now, {
      status: "CANCELLED",
      failedAt: now,
      nextAttemptAt: null,
      deliveryErrorCode: "TEMPLATE_RENDER_INVALID",
    })) return { status: "stale-result" } as const;
    logEmailDeliveryState("terminal_failure", message.purpose);
    return { status: "failed", code: "TEMPLATE_RENDER_INVALID" } as const;
  }
  const currentSubject = message.isTest ? `[TEST] ${rendered.subject}` : rendered.subject;
  if (currentRecipientEmail !== message.recipientEmail || currentSubject !== message.subject) {
    if (!await settleClaim(message.id, now, { recipientEmail: currentRecipientEmail, subject: currentSubject })) {
      return { status: "stale-result" } as const;
    }
  }
  let result: Awaited<ReturnType<LifecycleEmailProvider["send"]>>;
  try {
    result = await provider.send({
      to: currentRecipientEmail,
      subject: currentSubject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: message.idempotencyKey,
    });
  } catch {
    result = { status: "unavailable", code: "NETWORK" };
  }
  const outcomeAt = overrides.now ?? new Date();
  if (result.status !== "accepted") {
    const failure = providerFailureState(result.code, message.attemptCount, outcomeAt);
    if (!await settleClaim(message.id, now, failure)) {
      return { status: "stale-result" } as const;
    }
    logEmailDeliveryState(failure.nextAttemptAt ? "retry_scheduled" : "terminal_failure", message.purpose);
    console.error("[email] provider send failed", {
      email_failure_category: result.code,
      email_purpose: message.purpose,
    });
    return { status: "failed", code: result.code } as const;
  }
  const sentAt = outcomeAt;
  if (!await settleClaim(message.id, now, {
    status: "SENT",
    provider: result.provider,
    providerMessageId: result.messageId,
    sentAt,
    failedAt: null,
    deliveryErrorCode: null,
  })) return { status: "stale-result" } as const;
  await recordServerAnalyticsEventBestEffort({
    name: "email_sent",
    dedupeKey: `email:${message.id}:sent`,
    occurredAt: sentAt,
    userId: message.userId,
    emailMessageId: message.id,
    locale: message.locale,
    environment: message.environment,
  });
  return { status: "sent", messageId: message.id } as const;
}

export async function recoverStaleEmailClaims(now = new Date()) {
  const environment = analyticsEnvironment();
  const staleBefore = new Date(now.getTime() - EMAIL_CLAIM_STALE_MS);
  const providerHorizon = new Date(now.getTime() - PROVIDER_IDEMPOTENCY_HORIZON_MS);
  const expiredSending = await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "SENDING",
      OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: providerHorizon } }],
    },
    data: {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "IDEMPOTENCY_HORIZON_EXPIRED",
    },
  });
  const exhaustedSending = await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "SENDING",
      lastAttemptAt: { lt: staleBefore },
      attemptCount: { gte: MAX_EMAIL_ATTEMPTS },
    },
    data: {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "AMBIGUOUS_MAX_ATTEMPTS",
    },
  });
  const expiredAmbiguousFailures = await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "FAILED",
      lastAttemptAt: { lt: providerHorizon },
      deliveryErrorCode: { in: ["TIMEOUT", "NETWORK"] },
    },
    data: {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "AMBIGUOUS_PROVIDER_RESULT",
    },
  });
  const staleAuth = await prisma.emailMessage.updateMany({
    where: {
      environment,
      purpose: { in: [...AUTH_EMAIL_PURPOSES] },
      status: "SENDING",
      lastAttemptAt: { lt: staleBefore, gte: providerHorizon },
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
    },
    data: {
      status: "FAILED",
      nextAttemptAt: now,
      deliveryErrorCode: "STALE_AUTH_CLAIM",
    },
  });
  return {
    staleAuth: staleAuth.count,
    expiredSending: expiredSending.count,
    exhaustedSending: exhaustedSending.count,
    expiredAmbiguousFailures: expiredAmbiguousFailures.count,
  };
}

export async function processQueuedEmailBatch(
  limit = 50,
  overrides: { provider?: LifecycleEmailProvider; siteUrl?: string; now?: Date } = {},
) {
  // A disabled or incomplete Production runtime is an intentional operational
  // state, not a delivery attempt. Leave durable intent untouched so a staged
  // deployment or kill-switch rollback cannot exhaust message retries.
  if (!resolveLifecycleEmailRuntimeConfig() && !overrides.provider) {
    return {
      selected: 0,
      sent: 0,
      suppressed: 0,
      failed: 0,
      recovery: { staleAuth: 0, expiredSending: 0, exhaustedSending: 0, expiredAmbiguousFailures: 0 },
    };
  }
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const environment = analyticsEnvironment();
  const now = overrides.now ?? new Date();
  const recovery = await recoverStaleEmailClaims(now);
  const messages = await prisma.emailMessage.findMany({
    where: {
      environment,
      purpose: { in: [...WORKER_EMAIL_PURPOSES] },
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
      AND: [claimableState(now), campaignSendAuthority(environment)],
    },
    select: { id: true },
    orderBy: [{ queuedAt: "asc" }, { id: "asc" }],
    take: boundedLimit,
  });
  const outcomes = [];
  for (const message of messages) {
    outcomes.push(await processQueuedEmailMessage(message.id, {
      provider: overrides.provider,
      siteUrl: overrides.siteUrl,
      now: overrides.now,
    }));
  }
  return {
    selected: messages.length,
    sent: outcomes.filter((item) => item.status === "sent").length,
    suppressed: outcomes.filter((item) => item.status === "suppressed").length,
    failed: outcomes.filter((item) => item.status === "failed" || item.status === "unavailable"
      || item.status === "unknown" || item.status === "stale-result").length,
    recovery,
  };
}

export async function sendAuthEmail({
  user,
  templateKey,
  actionUrl,
}: {
  user: { id: string; name: string; email: string };
  templateKey: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  actionUrl: string;
}, overrides: { provider?: LifecycleEmailProvider; siteUrl?: string; now?: Date } = {}) {
  const purpose = purposeByTemplate[templateKey];
  const eligibility = await currentEligibility(user.id, purpose);
  if (!eligibility?.decision.allowed) return { status: "suppressed" } as const;
  const template = await activeEmailTemplate(templateKey, "en");
  if (!template) return { status: "template-unavailable" } as const;
  const idempotencyKey = authEmailIdempotencyKey(user.id, actionUrl);
  const runtime = providerForRuntime();
  const provider = overrides.provider ?? runtime.provider;
  const siteUrl = overrides.siteUrl ?? runtime.siteUrl;
  const verifiedActionUrl = validAuthActionUrl(actionUrl, siteUrl);
  if (!siteUrl) return { status: "provider-unavailable" } as const;
  if (!verifiedActionUrl) return { status: "invalid-action-url" } as const;
  const message = await queueEmailMessage({
    userId: user.id,
    templateKey,
    templateId: template.id,
    idempotencyKey,
  });
  if (!message || message.status === "SUPPRESSED") return { status: "suppressed" } as const;
  const result = await processQueuedEmailMessage(message.id, {
    provider,
    siteUrl,
    actionUrl: verifiedActionUrl,
    now: overrides.now,
  });
  if (result.status === "sent") return { status: "sent" } as const;
  if (result.status === "not-claimed") return { status: "duplicate" } as const;
  return result;
}

export async function queueProgrammeReminders() {
  const configuredDays = Number.parseInt(process.env.PROGRAMME_REMINDER_INACTIVITY_DAYS ?? "7", 10);
  const inactivityDays = configuredDays === 30 ? 30 : 7;
  const before = new Date(Date.now() - inactivityDays * 86_400_000);
  const template = await activeEmailTemplate("PROGRAMME_REMINDER", "en");
  if (!template) return { eligible: 0, queued: 0 };
  const environment = analyticsEnvironment();
  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      completedAt: null,
      startedAt: { lte: before },
      user: {
        accountState: "ACTIVE",
        emailVerified: true,
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lte: before } }],
        emailPreference: {
          is: {
            marketingAllowed: true,
            unsubscribedAt: null,
            suppressionScope: "NONE",
          },
        },
        emailMessages: {
          none: { templateId: template.id, purpose: "PROGRAMME_REMINDER", environment },
        },
      },
    },
    select: { id: true, userId: true },
    orderBy: { startedAt: "asc" },
    take: 500,
  });
  let queued = 0;
  for (const enrollment of enrollments) {
    const message = await queueEmailMessage({
      userId: enrollment.userId,
      templateKey: "PROGRAMME_REMINDER",
      templateId: template.id,
      idempotencyKey: programmeReminderIdempotencyKey(enrollment.id, template.version),
    }).catch(() => {
      console.warn("[email] Programme reminder queue candidate failed", {
        email_failure_category: "queue_candidate",
      });
      return null;
    });
    if (message?.status === "QUEUED" && message.createdNow) queued += 1;
  }
  return { eligible: enrollments.length, queued };
}

export function createEmailId() { return randomUUID(); }

import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import type { EmailPurpose, EmailTemplateKey } from "@prisma/client";

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
      status: { in: ["QUEUED", "FAILED"] },
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
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

function retryAt(attemptCount: number, now: Date) {
  const minutes = Math.min(60, 5 * (2 ** Math.max(0, attemptCount - 1)));
  return new Date(now.getTime() + minutes * 60_000);
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
  overrides: { provider?: LifecycleEmailProvider; siteUrl?: string } = {},
) {
  const now = new Date();
  const environment = analyticsEnvironment();
  if (!await claimQueuedMessage(messageId, now, environment)) return { status: "not-claimed" } as const;
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: { template: true },
  });
  if (!message) return { status: "not-found" } as const;
  const eligibility = await currentEligibility(message.userId, message.purpose);
  if (!eligibility?.decision.allowed) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "SUPPRESSED",
        deliveryErrorCode: (eligibility?.decision.reason ?? "ACCOUNT_NOT_FOUND").slice(0, 64),
      },
    });
    return { status: "suppressed" } as const;
  }
  const runtime = providerForRuntime();
  const provider = overrides.provider ?? runtime.provider;
  const siteUrl = overrides.siteUrl ?? runtime.siteUrl;
  if (!siteUrl) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "FAILED",
        failedAt: now,
        nextAttemptAt: message.attemptCount < MAX_EMAIL_ATTEMPTS ? retryAt(message.attemptCount, now) : null,
        deliveryErrorCode: "NOT_CONFIGURED",
      },
    });
    return { status: "unavailable", code: "NOT_CONFIGURED" } as const;
  }
  const needsUnsubscribe = marketingEmailPurposes.includes(message.purpose as typeof marketingEmailPurposes[number]);
  const token = needsUnsubscribe ? unsubscribeTokenForMessage(message.id) : null;
  if (token && !await ensureCurrentUnsubscribeToken({ messageId: message.id, userId: message.userId, token })) {
    // Never overwrite the hash behind a link that may already be in a
    // customer's inbox after signing-secret rotation. Stop this ambiguous
    // message; a newly queued message can use the new secret safely.
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "UNKNOWN",
        nextAttemptAt: null,
        deliveryErrorCode: "UNSUBSCRIBE_TOKEN_MISMATCH",
      },
    });
    return { status: "unknown", code: "UNSUBSCRIBE_TOKEN_MISMATCH" } as const;
  }
  // This is intentionally a second, immediate read. Audience selection and
  // queue-time eligibility are advisory; the current authority immediately
  // before the provider call decides whether anything may leave B4GAMBLE.
  const finalEligibility = await currentEligibility(message.userId, message.purpose);
  if (!finalEligibility?.decision.allowed) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "SUPPRESSED",
        deliveryErrorCode: (finalEligibility?.decision.reason ?? "ACCOUNT_NOT_FOUND").slice(0, 64),
      },
    });
    return { status: "suppressed" } as const;
  }
  const currentRecipientEmail = finalEligibility.user.email.trim().toLowerCase();
  let rendered: ReturnType<typeof renderEmailTemplate>;
  try {
    rendered = renderEmailTemplate(message.template, {
      name: finalEligibility.user.name,
      action_url: "",
      programme_url: `${siteUrl}/program`,
      unsubscribe_url: token ? `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` : `${siteUrl}/unsubscribe?test=1`,
    });
  } catch {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "CANCELLED",
        failedAt: now,
        nextAttemptAt: null,
        deliveryErrorCode: "TEMPLATE_RENDER_INVALID",
      },
    });
    return { status: "failed", code: "TEMPLATE_RENDER_INVALID" } as const;
  }
  if (currentRecipientEmail !== message.recipientEmail || rendered.subject !== message.subject) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { recipientEmail: currentRecipientEmail, subject: rendered.subject },
    });
  }
  const result = await provider.send({
    to: currentRecipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: message.idempotencyKey,
  });
  if (result.status !== "accepted") {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "FAILED",
        failedAt: now,
        nextAttemptAt: message.attemptCount < MAX_EMAIL_ATTEMPTS ? retryAt(message.attemptCount, now) : null,
        deliveryErrorCode: result.code,
      },
    });
    console.error("[email] provider send failed", {
      email_failure_category: result.code,
      email_purpose: message.purpose,
    });
    return { status: "failed", code: result.code } as const;
  }
  const sentAt = new Date();
  await prisma.emailMessage.update({
    where: { id: message.id },
    data: {
      status: "SENT",
      provider: result.provider,
      providerMessageId: result.messageId,
      sentAt,
      failedAt: null,
      deliveryErrorCode: null,
    },
  });
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

export async function processQueuedEmailBatch(limit = 50) {
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const environment = analyticsEnvironment();
  const stale = new Date(Date.now() - 15 * 60_000);
  const providerIdempotencyHorizon = new Date(Date.now() - 23 * 60 * 60_000);
  await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "SENDING",
      lastAttemptAt: { lt: providerIdempotencyHorizon },
    },
    data: {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "IDEMPOTENCY_HORIZON_EXPIRED",
    },
  });
  await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "FAILED",
      lastAttemptAt: { lt: providerIdempotencyHorizon },
      deliveryErrorCode: { in: ["TIMEOUT", "NETWORK"] },
    },
    data: {
      status: "UNKNOWN",
      nextAttemptAt: null,
      deliveryErrorCode: "AMBIGUOUS_PROVIDER_RESULT",
    },
  });
  await prisma.emailMessage.updateMany({
    where: {
      environment,
      status: "SENDING",
      lastAttemptAt: { lt: stale, gte: providerIdempotencyHorizon },
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
    },
    data: { status: "FAILED", nextAttemptAt: new Date() },
  });
  const messages = await prisma.emailMessage.findMany({
    where: {
      environment,
      purpose: { in: ["WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST", "TEST"] },
      status: { in: ["QUEUED", "FAILED"] },
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    select: { id: true },
    orderBy: [{ queuedAt: "asc" }, { id: "asc" }],
    take: boundedLimit,
  });
  const outcomes = [];
  for (const message of messages) outcomes.push(await processQueuedEmailMessage(message.id));
  return {
    selected: messages.length,
    sent: outcomes.filter((item) => item.status === "sent").length,
    suppressed: outcomes.filter((item) => item.status === "suppressed").length,
    failed: outcomes.filter((item) => item.status === "failed" || item.status === "unavailable" || item.status === "unknown").length,
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
}) {
  const purpose = purposeByTemplate[templateKey];
  const eligibility = await currentEligibility(user.id, purpose);
  if (!eligibility?.decision.allowed) return { status: "suppressed" } as const;
  const template = await activeEmailTemplate(templateKey, "en");
  if (!template) return { status: "template-unavailable" } as const;
  const idempotencyKey = authEmailIdempotencyKey(user.id, actionUrl);
  const runtime = providerForRuntime();
  if (!runtime.siteUrl) return { status: "provider-unavailable" } as const;
  let verifiedActionUrl: string;
  try {
    const candidate = new URL(actionUrl);
    if (candidate.origin !== runtime.siteUrl || candidate.username || candidate.password) {
      return { status: "invalid-action-url" } as const;
    }
    verifiedActionUrl = candidate.toString();
  } catch {
    return { status: "invalid-action-url" } as const;
  }
  const rendered = renderEmailTemplate(template, { name: eligibility.user.name, action_url: verifiedActionUrl, programme_url: "", unsubscribe_url: "" });
  let message;
  try {
    message = await prisma.emailMessage.create({
      data: {
        userId: user.id,
        templateId: template.id,
        purpose,
        status: "SENDING",
        environment: analyticsEnvironment(),
        locale: template.locale,
        recipientEmail: eligibility.user.email.trim().toLowerCase(),
        subject: rendered.subject,
        templateVersion: template.version,
        idempotencyKey,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "duplicate" } as const;
    throw error;
  }
  const result = await runtime.provider.send({
    to: message.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey,
  });
  if (result.status !== "accepted") {
    await prisma.emailMessage.update({ where: { id: message.id }, data: { status: "FAILED", failedAt: new Date(), deliveryErrorCode: result.code } });
    return { status: "failed", code: result.code } as const;
  }
  const sentAt = new Date();
  await prisma.emailMessage.update({
    where: { id: message.id },
    data: { status: "SENT", provider: result.provider, providerMessageId: result.messageId, sentAt },
  });
  await recordServerAnalyticsEventBestEffort({
    name: "email_sent",
    dedupeKey: `email:${message.id}:sent`,
    occurredAt: sentAt,
    userId: user.id,
    emailMessageId: message.id,
    locale: message.locale,
    environment: message.environment,
  });
  return { status: "sent" } as const;
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

import "server-only";

import type { EmailProviderEventType } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { recordServerAnalyticsEventBestEffort } from "@/lib/analytics/service.server";

const providerTypes = {
  "email.delivered": "DELIVERED",
  "email.bounced": "BOUNCED",
  "email.clicked": "CLICKED",
  "email.complained": "COMPLAINED",
} as const satisfies Record<string, EmailProviderEventType>;

export type NormalizedResendWebhook = {
  providerEventId: string;
  providerMessageId: string;
  type: EmailProviderEventType;
  occurredAt: Date;
};

export function normalizeResendWebhook(providerEventId: string, value: unknown): NormalizedResendWebhook {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(providerEventId)) throw new Error("Invalid provider event identifier");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid provider event");
  const payload = value as Record<string, unknown>;
  const type = providerTypes[String(payload.type) as keyof typeof providerTypes];
  const data = payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown> : null;
  const providerMessageId = data?.email_id;
  const occurredAt = new Date(String(payload.created_at ?? ""));
  if (!type || typeof providerMessageId !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(providerMessageId)
    || !Number.isFinite(occurredAt.getTime())) throw new Error("Unsupported provider event");
  return { providerEventId, providerMessageId, type, occurredAt };
}

function analyticsName(type: EmailProviderEventType) {
  if (type === "DELIVERED") return "email_delivered" as const;
  if (type === "BOUNCED") return "email_bounced" as const;
  if (type === "CLICKED") return "email_clicked" as const;
  return null;
}

export async function processResendWebhook(event: NormalizedResendWebhook) {
  const message = await prisma.emailMessage.findUnique({
    where: { providerMessageId: event.providerMessageId },
    select: { id: true, userId: true, locale: true, environment: true, provider: true },
  });
  if (!message || message.environment !== "PRODUCTION" || message.provider !== "resend") {
    return { status: "ignored" } as const;
  }
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.emailProviderEvent.create({
        data: {
          providerEventId: event.providerEventId,
          messageId: message.id,
          providerMessageId: event.providerMessageId,
          type: event.type,
          occurredAt: event.occurredAt,
        },
      });
      if (event.type === "DELIVERED") {
        await transaction.emailMessage.updateMany({
          where: { id: message.id, status: { notIn: ["BOUNCED", "SUPPRESSED"] } },
          data: { status: "DELIVERED", deliveredAt: event.occurredAt },
        });
      } else if (event.type === "BOUNCED") {
        await transaction.emailMessage.update({ where: { id: message.id }, data: { status: "BOUNCED", bouncedAt: event.occurredAt } });
        await transaction.customerEmailPreference.upsert({
          where: { userId: message.userId },
          create: { userId: message.userId, marketingAllowed: false, suppressedAt: event.occurredAt, suppressionScope: "ALL", suppressionReason: "PROVIDER_BOUNCE" },
          update: { marketingAllowed: false, suppressedAt: event.occurredAt, suppressionScope: "ALL", suppressionReason: "PROVIDER_BOUNCE" },
        });
        await transaction.consentEvent.create({ data: { userId: message.userId, purpose: "MARKETING_EMAIL", action: "SUPPRESSED", source: "PROVIDER_WEBHOOK", occurredAt: event.occurredAt } });
      } else if (event.type === "CLICKED") {
        await transaction.emailMessage.update({ where: { id: message.id }, data: { clickedAt: event.occurredAt } });
      } else {
        await transaction.emailMessage.update({ where: { id: message.id }, data: { status: "SUPPRESSED" } });
        await transaction.customerEmailPreference.upsert({
          where: { userId: message.userId },
          create: { userId: message.userId, marketingAllowed: false, suppressedAt: event.occurredAt, suppressionScope: "ALL", suppressionReason: "PROVIDER_COMPLAINT" },
          update: { marketingAllowed: false, suppressedAt: event.occurredAt, suppressionScope: "ALL", suppressionReason: "PROVIDER_COMPLAINT" },
        });
        await transaction.consentEvent.create({ data: { userId: message.userId, purpose: "MARKETING_EMAIL", action: "SUPPRESSED", source: "PROVIDER_WEBHOOK", occurredAt: event.occurredAt } });
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { status: "duplicate" } as const;
    }
    throw error;
  }
  const name = analyticsName(event.type);
  if (name) {
    await recordServerAnalyticsEventBestEffort({
      name,
      dedupeKey: `email-provider:${event.providerEventId}`,
      occurredAt: event.occurredAt,
      userId: message.userId,
      emailMessageId: message.id,
      locale: message.locale,
      environment: message.environment,
    });
  }
  return { status: "processed" } as const;
}

import "server-only";

import prisma from "@/lib/db/prisma";
import { recordServerAnalyticsEventBestEffort } from "@/lib/analytics/service.server";
import { hashUnsubscribeToken } from "@/lib/email/service.server";

export function isValidUnsubscribeToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export async function unsubscribeWithToken(token: string, now = new Date()) {
  if (!isValidUnsubscribeToken(token)) return { status: "invalid" } as const;
  const record = await prisma.emailUnsubscribeToken.findUnique({
    where: { tokenHash: hashUnsubscribeToken(token) },
    include: { message: { select: { id: true, userId: true, locale: true, environment: true } } },
  });
  if (!record) return { status: "invalid" } as const;
  if (record.userId !== record.message.userId) return { status: "invalid" } as const;
  const changed = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.emailUnsubscribeToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: now },
    });
    const current = await transaction.customerEmailPreference.findUnique({
      where: { userId: record.userId },
    });
    const alreadyBlocked = Boolean(current
      && !current.marketingAllowed
      && current.unsubscribedAt
      && current.suppressionScope !== "NONE");
    if (!alreadyBlocked) {
      if (current?.suppressionScope === "ALL") {
        // A marketing unsubscribe can never downgrade provider-level ALL
        // suppression, even when an old token is replayed after an opt-in.
        await transaction.customerEmailPreference.update({
          where: { userId: record.userId },
          data: { marketingAllowed: false, unsubscribedAt: current.unsubscribedAt ?? now },
        });
      } else {
        await transaction.customerEmailPreference.upsert({
          where: { userId: record.userId },
          create: {
            userId: record.userId,
            marketingAllowed: false,
            unsubscribedAt: now,
            suppressionScope: "MARKETING",
            suppressedAt: now,
            suppressionReason: "UNSUBSCRIBE",
          },
          update: {
            marketingAllowed: false,
            unsubscribedAt: now,
            suppressionScope: "MARKETING",
            suppressedAt: now,
            suppressionReason: "UNSUBSCRIBE",
          },
        });
      }
    }
    if (!consumed.count && alreadyBlocked) return false;
    await transaction.consentEvent.create({
      data: { userId: record.userId, purpose: "MARKETING_EMAIL", action: "WITHDRAWN", source: "UNSUBSCRIBE_LINK", occurredAt: now },
    });
    await transaction.emailMessage.update({ where: { id: record.messageId }, data: { unsubscribedAt: now } });
    return true;
  });
  if (!changed) return { status: "already-unsubscribed" } as const;
  await recordServerAnalyticsEventBestEffort({
    name: "email_unsubscribed",
    dedupeKey: `email:${record.messageId}:unsubscribed`,
    occurredAt: now,
    userId: record.userId,
    emailMessageId: record.message.id,
    locale: record.message.locale,
    environment: record.message.environment,
  });
  return { status: "unsubscribed" } as const;
}

import "server-only";

import type { ConsentAction, Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { ANALYTICS_CONSENT_POLICY_VERSION } from "@/lib/analytics/consent-contract";

export function analyticsConsentLedgerAction(
  granted: boolean,
  previousAction: ConsentAction | null,
): ConsentAction {
  if (granted) return "GRANTED";
  return previousAction === "GRANTED" ? "WITHDRAWN" : "DENIED";
}

export async function recordAnalyticsConsentPreference({
  anonymousId,
  granted,
  userId,
}: {
  anonymousId: string | null;
  granted: boolean;
  userId: string | null;
}) {
  if (!anonymousId && !userId) return null;
  const subjects: Prisma.ConsentEventWhereInput[] = [];
  if (userId) subjects.push({ userId });
  if (anonymousId) subjects.push({ anonymousId });
  return prisma.$transaction(async (transaction) => {
    const previous = await transaction.consentEvent.findFirst({
      where: { purpose: "ANALYTICS", OR: subjects },
      select: { action: true },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    });
    return transaction.consentEvent.create({
      data: {
        userId,
        anonymousId,
        purpose: "ANALYTICS",
        action: analyticsConsentLedgerAction(granted, previous?.action ?? null),
        source: "ANALYTICS_PREFERENCE",
        policyVersion: ANALYTICS_CONSENT_POLICY_VERSION,
        occurredAt: new Date(),
      },
    });
  });
}

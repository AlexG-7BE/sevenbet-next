import "server-only";

import prisma from "@/lib/db/prisma";
import { ANALYTICS_ANONYMOUS_COOKIE } from "@/lib/analytics/consent-contract";
import {
  analyticsEnvironment,
  analyticsSigningSecret,
  readAnalyticsConsent,
  readAnalyticsUuid,
} from "@/lib/analytics/identity.server";

export type InternalTrafficOwners = { anonymousId: string | null; userId: string | null };

/**
 * Whose earlier activity becomes internal when a staff browser is marked: this
 * browser's consented analytics ID and the signed-in staff account. Without the
 * analytics grant the browser has no ID to match, so only the account is used.
 */
export function internalTrafficOwners(headers: Headers, staffUserId: string | null): InternalTrafficOwners {
  let anonymousId: string | null = null;
  try {
    const secret = analyticsSigningSecret();
    if (readAnalyticsConsent(headers, secret) === "granted") {
      anonymousId = readAnalyticsUuid(headers, ANALYTICS_ANONYMOUS_COOKIE, secret);
    }
  } catch {
    anonymousId = null;
  }
  return { anonymousId, userId: staffUserId };
}

/**
 * Staff test visits recorded before the browser was marked are reclassified from
 * HUMAN to INTERNAL in this environment, so the Founder's own clicks and sign-ups
 * never inflate conversion. The success-only daily click aggregate is additive and
 * is not rewritten; it only receives Production human clicks from now on.
 */
export async function reclassifyStaffActivityAsInternal(
  owners: InternalTrafficOwners,
  environment = analyticsEnvironment(),
) {
  const owner = [
    ...(owners.anonymousId ? [{ anonymousId: owners.anonymousId }] : []),
    ...(owners.userId ? [{ userId: owners.userId }] : []),
  ];
  if (!owner.length) return { sessions: 0, events: 0, outboundClicks: 0 };
  const where = { environment, trafficKind: "HUMAN" as const, OR: owner };
  const [sessions, events, outboundClicks] = await prisma.$transaction([
    prisma.analyticsSession.updateMany({ where, data: { trafficKind: "INTERNAL" } }),
    prisma.analyticsEvent.updateMany({ where, data: { trafficKind: "INTERNAL" } }),
    prisma.outboundClick.updateMany({ where, data: { trafficKind: "INTERNAL" } }),
  ]);
  return { sessions: sessions.count, events: events.count, outboundClicks: outboundClicks.count };
}

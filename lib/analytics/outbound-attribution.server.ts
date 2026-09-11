import "server-only";

import { randomUUID } from "node:crypto";

import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics/consent-contract";
import {
  analyticsDeviceCategory,
  analyticsEnvironment,
  analyticsSigningSecret,
  analyticsTrafficKind,
  readAnalyticsConsent,
  readAnalyticsUuid,
  safeReferrerContext,
} from "@/lib/analytics/identity.server";

export type OutboundAttributionInput = {
  clickId: string;
  request: Request;
  requestedSlug: string;
  attemptedAt: Date;
  resolvedAt?: Date;
  state: "SUCCEEDED" | "BLOCKED";
  blockedReason?: string | null;
  countryCode?: string | null;
  locale?: string | null;
  casinoId?: string | null;
  affiliateOfferId?: string | null;
  redirectSlugId?: string | null;
  trackingLinkId?: string | null;
};

export function safeOutboundSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80) || "invalid";
}

export function safeOutboundPlacement(value: string | null) {
  const placement = value?.trim().toUpperCase();
  return placement && /^[A-Z0-9_]{1,64}$/.test(placement) ? placement : null;
}

export async function recordOutboundAttribution(input: OutboundAttributionInput) {
  const environment = analyticsEnvironment();
  const trafficKind = analyticsTrafficKind(input.request.headers, environment);
  const resolvedAt = input.resolvedAt ?? new Date();
  const placement = safeOutboundPlacement(new URL(input.request.url).searchParams.get("placement"));
  const referrer = safeReferrerContext(input.request.url, input.request.headers.get("referer"));
  let anonymousId: string | null = null;
  let analyticsSessionId: string | null = null;
  let userId: string | null = null;
  let acquisitionSource: string | null = null;
  let consented = false;
  try {
    const secret = analyticsSigningSecret();
    consented = readAnalyticsConsent(input.request.headers, secret) === "granted";
    if (consented) {
      anonymousId = readAnalyticsUuid(input.request.headers, ANALYTICS_ANONYMOUS_COOKIE, secret);
      userId = await getServerSession(input.request.headers)
        .then((sessionValue) => sessionValue?.user.id ?? null)
        .catch(() => null);
      const candidateSessionId = readAnalyticsUuid(input.request.headers, ANALYTICS_SESSION_COOKIE, secret);
      const session = candidateSessionId
        ? await prisma.analyticsSession.findUnique({
            where: { id: candidateSessionId },
            select: {
              id: true,
              anonymousId: true,
              environment: true,
              expiresAt: true,
              userId: true,
              acquisitionSource: true,
            },
          })
        : null;
      const validSession = session
        && anonymousId
        && session.anonymousId === anonymousId
        && session.environment === environment
        && session.expiresAt > input.attemptedAt
        && (session.userId === null || session.userId === userId)
        ? session
        : null;
      analyticsSessionId = validSession?.id ?? null;
      acquisitionSource = validSession?.acquisitionSource ?? null;
    }
  } catch {
    // Missing consent configuration removes optional identity enrichment. It
    // never alters the already-authoritative redirect result.
  }
  const affiliateNetworkId = input.affiliateOfferId
    ? await prisma.affiliateOffer.findUnique({
        where: { id: input.affiliateOfferId },
        select: { program: { select: { networkId: true } } },
      }).then((offer) => offer?.program.networkId ?? null)
    : null;
  const common = {
    environment,
    trafficKind,
    occurredAt: input.attemptedAt,
    anonymousId,
    analyticsSessionId,
    userId,
    pagePath: consented ? referrer.sourcePage : null,
    locale: consented ? input.locale : null,
    countryCode: input.countryCode,
    acquisitionSource,
    deviceCategory: consented ? analyticsDeviceCategory(input.request.headers) : "UNKNOWN",
    casinoId: input.casinoId,
    affiliateOfferId: input.affiliateOfferId,
    affiliateNetworkId,
    placement: consented ? placement : null,
    outboundClickId: input.clickId,
  } as const;
  await prisma.$transaction([
    prisma.outboundClick.create({
      data: {
        id: input.clickId,
        state: input.state,
        blockedReason: input.state === "BLOCKED" ? (input.blockedReason || "UNKNOWN").slice(0, 64) : null,
        environment,
        trafficKind,
        attemptedAt: input.attemptedAt,
        resolvedAt,
        anonymousId,
        analyticsSessionId,
        userId,
        sourcePage: consented ? referrer.sourcePage : null,
        locale: consented ? input.locale : null,
        countryCode: input.countryCode,
        acquisitionSource,
        placement: consented ? placement : null,
        requestedSlug: safeOutboundSlug(input.requestedSlug),
        casinoId: input.casinoId,
        affiliateOfferId: input.affiliateOfferId,
        affiliateNetworkId,
        redirectSlugId: input.redirectSlugId,
        trackingLinkId: input.trackingLinkId,
      },
    }),
    prisma.analyticsEvent.createMany({
      data: [
        {
          id: randomUUID(),
          dedupeKey: `outbound:${input.clickId}:attempted`,
          schemaVersion: 1,
          type: "OUTBOUND_REDIRECT_ATTEMPTED",
          ...common,
        },
        {
          id: randomUUID(),
          dedupeKey: `outbound:${input.clickId}:${input.state.toLowerCase()}`,
          schemaVersion: 1,
          type: input.state === "SUCCEEDED" ? "OUTBOUND_REDIRECT_SUCCEEDED" : "OUTBOUND_REDIRECT_BLOCKED",
          ...common,
          occurredAt: resolvedAt,
        },
      ],
      skipDuplicates: true,
    }),
  ]);
  return input.clickId;
}

export async function recordOutboundAttributionBestEffort(input: OutboundAttributionInput) {
  try {
    await recordOutboundAttribution(input);
    return true;
  } catch {
    console.warn("[analytics] outbound attribution failed", {
      analytics_failure_category: "database",
      outbound_state: input.state,
    });
    return false;
  }
}

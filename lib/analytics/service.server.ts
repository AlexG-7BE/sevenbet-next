import "server-only";

import { randomUUID } from "node:crypto";
import type {
  AnalyticsDeviceCategory,
  AnalyticsEnvironment,
  AnalyticsEventType,
  AnalyticsTrafficKind,
} from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import {
  analyticsDatabaseEventTypes,
  type ClientProductAnalyticsEvent,
  type ProductAnalyticsEventName,
} from "@/lib/analytics/product-analytics-events";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics/consent-contract";
import {
  ANALYTICS_SESSION_INACTIVITY_MS,
  analyticsDeviceCategory,
  analyticsEnvironment,
  analyticsSigningSecret,
  analyticsTrafficKind,
  newAnalyticsUuid,
  readAnalyticsConsent,
  readAnalyticsUuid,
  safeReferrerContext,
} from "@/lib/analytics/identity.server";

const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_EVENT_FUTURE_SKEW_MS = 5 * 60 * 1000;

export class AnalyticsConsentRequiredError extends Error {
  constructor() {
    super("Analytics consent is required");
    this.name = "AnalyticsConsentRequiredError";
  }
}

export class AnalyticsTimestampError extends Error {
  constructor() {
    super("Analytics event timestamp is outside the accepted window");
    this.name = "AnalyticsTimestampError";
  }
}

export type AnalyticsRequestIdentity = {
  anonymousId: string;
  sessionId: string;
  userId: string | null;
  environment: AnalyticsEnvironment;
  trafficKind: AnalyticsTrafficKind;
  deviceCategory: AnalyticsDeviceCategory;
  countryCode: string | null;
  createdSession: boolean;
};

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function boundedOccurredAt(value: string, now: Date) {
  const occurredAt = new Date(value);
  if (!Number.isFinite(occurredAt.getTime())
    || occurredAt.getTime() < now.getTime() - MAX_EVENT_AGE_MS
    || occurredAt.getTime() > now.getTime() + MAX_EVENT_FUTURE_SKEW_MS) {
    throw new AnalyticsTimestampError();
  }
  return occurredAt;
}

async function authenticatedUserId(headers: Headers) {
  try {
    return (await getServerSession(headers))?.user.id ?? null;
  } catch {
    console.warn("[analytics] authenticated identity enrichment failed", {
      analytics_failure_category: "auth_lookup",
    });
    return null;
  }
}

export async function resolveAnalyticsRequestIdentity(
  request: Request,
  seed: ClientProductAnalyticsEvent,
  now = new Date(),
): Promise<AnalyticsRequestIdentity> {
  const secret = analyticsSigningSecret();
  if (readAnalyticsConsent(request.headers, secret) !== "granted") {
    throw new AnalyticsConsentRequiredError();
  }
  const anonymousId = readAnalyticsUuid(request.headers, ANALYTICS_ANONYMOUS_COOKIE, secret)
    ?? newAnalyticsUuid();
  const requestedSessionId = readAnalyticsUuid(request.headers, ANALYTICS_SESSION_COOKIE, secret);
  const environment = analyticsEnvironment();
  const trafficKind = analyticsTrafficKind(request.headers, environment);
  const deviceCategory = analyticsDeviceCategory(request.headers);
  const countryCode = requestCountrySignalFromHeaders(request.headers, now)?.countryCode ?? null;
  const userId = await authenticatedUserId(request.headers);
  const existing = requestedSessionId
    ? await prisma.analyticsSession.findUnique({ where: { id: requestedSessionId } })
    : null;
  const canResume = Boolean(existing
    && existing.anonymousId === anonymousId
    && existing.environment === environment
    && existing.expiresAt > now
    // A browser may keep an analytics cookie across account sign-out/sign-in.
    // Never reuse a session already owned by a different (or now signed-out)
    // identity; rotate instead of silently joining two customers' histories.
    && (existing.userId === null || existing.userId === userId));
  const sessionId = canResume ? requestedSessionId! : newAnalyticsUuid();
  const expiresAt = new Date(now.getTime() + ANALYTICS_SESSION_INACTIVITY_MS);
  const referrer = safeReferrerContext(request.url, request.headers.get("referer"));

  if (canResume) {
    await prisma.analyticsSession.update({
      where: { id: sessionId },
      data: {
        ...(userId ? { userId } : {}),
        lastActivityAt: now,
        expiresAt,
      },
    });
  } else {
    const sessionContext = {
      anonymousId,
      userId,
      environment,
      trafficKind,
      pagePath: seed.pagePath,
      locale: seed.locale,
      countryCode,
      referrerHost: seed.referrerHost ?? referrer.referrerHost,
      acquisitionSource: seed.acquisitionSource,
      utmSource: seed.utmSource,
      utmMedium: seed.utmMedium,
      utmCampaign: seed.utmCampaign,
      utmContent: seed.utmContent,
      utmTerm: seed.utmTerm,
      deviceCategory,
    };
    await prisma.$transaction([
      prisma.analyticsSession.create({
        data: {
          id: sessionId,
          anonymousId,
          userId,
          environment,
          trafficKind,
          startedAt: now,
          lastActivityAt: now,
          expiresAt,
          landingPath: seed.pagePath,
          locale: seed.locale,
          countryCode,
          referrerHost: sessionContext.referrerHost,
          acquisitionSource: seed.acquisitionSource,
          utmSource: seed.utmSource,
          utmMedium: seed.utmMedium,
          utmCampaign: seed.utmCampaign,
          utmContent: seed.utmContent,
          utmTerm: seed.utmTerm,
          deviceCategory,
        },
      }),
      prisma.analyticsEvent.create({
        data: {
          id: randomUUID(),
          dedupeKey: `session:${sessionId}`,
          schemaVersion: 1,
          type: "SESSION_STARTED",
          occurredAt: now,
          analyticsSessionId: sessionId,
          ...sessionContext,
        },
      }),
    ]);
  }

  if (userId) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { lastSeenAt: now } }),
      prisma.analyticsSession.updateMany({
        where: { anonymousId, userId: null },
        data: { userId },
      }),
      prisma.analyticsEvent.updateMany({
        where: { anonymousId, userId: null },
        data: { userId },
      }),
      prisma.outboundClick.updateMany({
        where: { anonymousId, userId: null },
        data: { userId },
      }),
      prisma.consentEvent.updateMany({
        where: { anonymousId, userId: null },
        data: { userId },
      }),
    ]);
  }

  return {
    anonymousId,
    sessionId,
    userId,
    environment,
    trafficKind,
    deviceCategory,
    countryCode,
    createdSession: !canResume,
  };
}

export async function persistClientAnalyticsEvent({
  event,
  identity,
  now = new Date(),
}: {
  event: ClientProductAnalyticsEvent;
  identity: AnalyticsRequestIdentity;
  now?: Date;
}) {
  const occurredAt = boundedOccurredAt(event.occurredAt, now);
  try {
    await prisma.analyticsEvent.create({
      data: {
        id: event.eventId,
        dedupeKey: `client:${event.eventId}`,
        schemaVersion: 1,
        type: analyticsDatabaseEventTypes[event.name] as AnalyticsEventType,
        environment: identity.environment,
        trafficKind: identity.trafficKind,
        occurredAt,
        receivedAt: now,
        anonymousId: identity.anonymousId,
        analyticsSessionId: identity.sessionId,
        userId: identity.userId,
        pagePath: event.pagePath,
        locale: event.locale,
        countryCode: identity.countryCode,
        referrerHost: event.referrerHost,
        acquisitionSource: event.acquisitionSource,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        utmContent: event.utmContent,
        utmTerm: event.utmTerm,
        deviceCategory: identity.deviceCategory,
        casinoId: event.casinoId,
        affiliateOfferId: event.affiliateOfferId,
        placement: event.placement,
        programmeStep: event.programmeStep,
      },
    });
    return "accepted" as const;
  } catch (error) {
    if (isUniqueConflict(error)) return "duplicate" as const;
    throw error;
  }
}

export type ServerAnalyticsEventInput = {
  name: ProductAnalyticsEventName;
  dedupeKey: string;
  occurredAt?: Date;
  anonymousId?: string | null;
  analyticsSessionId?: string | null;
  userId?: string | null;
  environment?: AnalyticsEnvironment;
  trafficKind?: AnalyticsTrafficKind;
  pagePath?: string | null;
  locale?: string | null;
  countryCode?: string | null;
  referrerHost?: string | null;
  acquisitionSource?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  deviceCategory?: AnalyticsDeviceCategory;
  casinoId?: string | null;
  affiliateOfferId?: string | null;
  affiliateNetworkId?: string | null;
  placement?: string | null;
  programmeStep?: number | null;
  outboundClickId?: string | null;
  emailMessageId?: string | null;
};

export async function persistServerAnalyticsEvent(input: ServerAnalyticsEventInput) {
  if (!input.dedupeKey || input.dedupeKey.length > 200) {
    throw new Error("Analytics dedupe key is invalid");
  }
  try {
    await prisma.analyticsEvent.create({
      data: {
        id: randomUUID(),
        dedupeKey: input.dedupeKey,
        schemaVersion: 1,
        type: analyticsDatabaseEventTypes[input.name] as AnalyticsEventType,
        environment: input.environment ?? analyticsEnvironment(),
        trafficKind: input.trafficKind ?? "HUMAN",
        occurredAt: input.occurredAt ?? new Date(),
        anonymousId: input.anonymousId,
        analyticsSessionId: input.analyticsSessionId,
        userId: input.userId,
        pagePath: input.pagePath,
        locale: input.locale,
        countryCode: input.countryCode,
        referrerHost: input.referrerHost,
        acquisitionSource: input.acquisitionSource,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        deviceCategory: input.deviceCategory ?? "UNKNOWN",
        casinoId: input.casinoId,
        affiliateOfferId: input.affiliateOfferId,
        affiliateNetworkId: input.affiliateNetworkId,
        placement: input.placement,
        programmeStep: input.programmeStep,
        outboundClickId: input.outboundClickId,
        emailMessageId: input.emailMessageId,
      },
    });
    return "accepted" as const;
  } catch (error) {
    if (isUniqueConflict(error)) return "duplicate" as const;
    throw error;
  }
}

export async function recordServerAnalyticsEventBestEffort(input: ServerAnalyticsEventInput) {
  try {
    return await persistServerAnalyticsEvent(input);
  } catch {
    console.warn("[analytics] server event persistence failed", {
      analytics_event_name: input.name,
      analytics_failure_category: "database",
    });
    return "failed" as const;
  }
}

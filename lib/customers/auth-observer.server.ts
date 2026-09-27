import "server-only";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics/consent-contract";
import {
  analyticsEnvironment,
  analyticsSigningSecret,
  analyticsTrafficKind,
  readAnalyticsConsent,
  readAnalyticsUuid,
  safeReferrerContext,
} from "@/lib/analytics/identity.server";
import { recordServerAnalyticsEventBestEffort } from "@/lib/analytics/service.server";
import { consentedFirstTouch, signupAcquisitionColumns, type AcquisitionTouch } from "@/lib/analytics/first-touch.server";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import prisma from "@/lib/db/prisma";
import { queueWelcomeEmail } from "@/lib/email/service.server";
import { normalizeCustomerEmail } from "@/lib/customers/auth-hooks.server";

function resultUser(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const top = value as Record<string, unknown>;
  const candidate = top.user && typeof top.user === "object" && !Array.isArray(top.user)
    ? top.user as Record<string, unknown>
    : top.data && typeof top.data === "object" && !Array.isArray(top.data)
      && (top.data as Record<string, unknown>).user
      && typeof (top.data as Record<string, unknown>).user === "object"
      ? (top.data as Record<string, Record<string, unknown>>).user
      : null;
  return candidate && typeof candidate.id === "string" && typeof candidate.email === "string"
    ? { id: candidate.id, email: normalizeCustomerEmail(candidate.email) }
    : null;
}

function requestLocale(request: Request) {
  const internal = request.headers.get("x-b4gamble-presentation-language")?.trim().toLowerCase();
  if (internal && /^[a-z]{2}$/.test(internal)) return internal;
  const accepted = request.headers.get("accept-language")?.split(",")[0]?.trim();
  const match = accepted?.match(/^([a-z]{2})(?:-([A-Z]{2}))?/);
  return match ? `${match[1]}${match[2] ? `-${match[2]}` : ""}` : null;
}

export async function observeSuccessfulAuthentication({
  request,
  responseBody,
  kind,
}: {
  request: Request;
  responseBody: unknown;
  kind: "signup" | "login";
}) {
  const user = resultUser(responseBody);
  if (!user) return { observed: false } as const;
  const now = new Date();
  let consented = false;
  let anonymousId: string | null = null;
  let analyticsSessionId: string | null = null;
  // Where the customer came from is the consented browser's first touch, never
  // the Referer of this auth request (that is our own page or Google).
  let acquisition: AcquisitionTouch | null = null;
  try {
    const secret = analyticsSigningSecret();
    consented = isProductAnalyticsEnabled() && readAnalyticsConsent(request.headers, secret) === "granted";
    if (consented) {
      anonymousId = readAnalyticsUuid(request.headers, ANALYTICS_ANONYMOUS_COOKIE, secret);
      const requestedSessionId = readAnalyticsUuid(request.headers, ANALYTICS_SESSION_COOKIE, secret);
      const environment = analyticsEnvironment();
      const session = requestedSessionId && anonymousId
        ? await prisma.analyticsSession.findUnique({
            where: { id: requestedSessionId },
            select: { id: true, anonymousId: true, environment: true, expiresAt: true, userId: true },
          })
        : null;
      analyticsSessionId = session
        && session.anonymousId === anonymousId
        && session.environment === environment
        && session.expiresAt > now
        && (session.userId === null || session.userId === user.id)
        ? session.id
        : null;
      if (anonymousId && kind === "signup") {
        acquisition = await consentedFirstTouch({
          anonymousId,
          userId: user.id,
          environment,
          siteHost: new URL(request.url).hostname,
        });
      }
    }
  } catch {
    // The account operation is complete; analytics enrichment is optional.
  }
  const countryCode = requestCountrySignalFromHeaders(request.headers, now)?.countryCode ?? null;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        lastSeenAt: now,
        ...(kind === "signup" ? {
          preferredLocale: requestLocale(request),
          signupCountryCode: countryCode,
          ...(consented && acquisition ? signupAcquisitionColumns(acquisition) : {}),
        } : {}),
      },
    }),
    prisma.customerEmailPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
    ...(consented && anonymousId ? [
      prisma.analyticsSession.updateMany({ where: { anonymousId, userId: null }, data: { userId: user.id } }),
      prisma.analyticsEvent.updateMany({ where: { anonymousId, userId: null }, data: { userId: user.id } }),
      prisma.outboundClick.updateMany({ where: { anonymousId, userId: null }, data: { userId: user.id } }),
      prisma.consentEvent.updateMany({ where: { anonymousId, userId: null }, data: { userId: user.id } }),
    ] : []),
  ]);
  if (consented) {
    const referrer = safeReferrerContext(request.url, request.headers.get("referer"));
    await recordServerAnalyticsEventBestEffort({
      name: kind === "signup" ? "signup_completed" : "login_completed",
      dedupeKey: kind === "signup"
        ? `auth:${user.id}:signup`
        : `auth:${user.id}:login:${Math.floor(now.getTime() / 60_000)}`,
      occurredAt: now,
      anonymousId,
      analyticsSessionId,
      userId: user.id,
      environment: analyticsEnvironment(),
      trafficKind: analyticsTrafficKind(request.headers),
      pagePath: referrer.sourcePage,
      locale: requestLocale(request),
      countryCode,
      ...(acquisition ?? {}),
    });
  }
  if (kind === "signup") {
    await queueWelcomeEmail(user.id).catch(() => {
      console.error("[email] welcome queue failed", {
        email_failure_category: "queue",
      });
    });
  }
  return { observed: true, userId: user.id, kind } as const;
}

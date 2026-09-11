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

function referralAcquisition(request: Request) {
  const referrer = request.headers.get("referer");
  if (!referrer) return {};
  try {
    const url = new URL(referrer);
    if (url.protocol !== "https:" && url.protocol !== "http:") return {};
    const host = url.hostname.toLowerCase();
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(host)) return {};
    const bounded = (value: string | null, maximum: number) => {
      const normalized = value?.trim().slice(0, maximum);
      return normalized && /^[\p{L}\p{N}][\p{L}\p{N} ._+():-]*$/u.test(normalized)
        ? normalized
        : null;
    };
    return {
      signupReferrerHost: host.slice(0, 253),
      signupSource: bounded(url.searchParams.get("source"), 64),
      signupUtmSource: bounded(url.searchParams.get("utm_source"), 100),
      signupUtmMedium: bounded(url.searchParams.get("utm_medium"), 100),
      signupUtmCampaign: bounded(url.searchParams.get("utm_campaign"), 100),
      signupUtmContent: bounded(url.searchParams.get("utm_content"), 100),
      signupUtmTerm: bounded(url.searchParams.get("utm_term"), 100),
    };
  } catch {
    return {};
  }
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
          ...(consented ? referralAcquisition(request) : {}),
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

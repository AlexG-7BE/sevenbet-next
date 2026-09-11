import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  type AnalyticsConsentState,
} from "@/lib/analytics/consent-contract";

const SIGNING_DOMAIN = "b4gamble:analytics-cookie:v1";
export const ANALYTICS_SESSION_INACTIVITY_MS = 30 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AnalyticsRuntimeEnvironment = {
  ANALYTICS_SIGNING_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  CI?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

function requestCookie(headers: Headers, name: string) {
  const encoded = headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!encoded) return null;
  try { return decodeURIComponent(encoded); } catch { return null; }
}

export function analyticsSigningSecret(
  environment: AnalyticsRuntimeEnvironment = process.env,
) {
  const secret = environment.ANALYTICS_SIGNING_SECRET?.trim()
    || environment.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("Analytics signing is not configured");
  }
  return secret;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${SIGNING_DOMAIN}\n${payload}`, "utf8")
    .digest("base64url");
}

function signedValue(payload: string, secret: string) {
  return `v1.${payload}.${signature(payload, secret)}`;
}

function verifiedPayload(value: string | null, secret: string) {
  if (!value) return null;
  const match = /^v1\.([^.]+)\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return null;
  const expected = Buffer.from(signature(match[1], secret));
  const actual = Buffer.from(match[2]);
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? match[1]
    : null;
}

export function readAnalyticsConsent(headers: Headers, secret = analyticsSigningSecret()): AnalyticsConsentState {
  const payload = verifiedPayload(requestCookie(headers, ANALYTICS_CONSENT_COOKIE), secret);
  return payload === "granted" || payload === "denied" ? payload : "unknown";
}

export function readAnalyticsUuid(headers: Headers, name: typeof ANALYTICS_ANONYMOUS_COOKIE | typeof ANALYTICS_SESSION_COOKIE, secret = analyticsSigningSecret()) {
  const payload = verifiedPayload(requestCookie(headers, name), secret);
  return payload && UUID_PATTERN.test(payload) ? payload.toLowerCase() : null;
}

export function newAnalyticsUuid() {
  return randomUUID();
}

export function signedAnalyticsConsent(state: Exclude<AnalyticsConsentState, "unknown">, secret = analyticsSigningSecret()) {
  return signedValue(state, secret);
}

export function signedAnalyticsUuid(value: string, secret = analyticsSigningSecret()) {
  if (!UUID_PATTERN.test(value)) throw new Error("Analytics identifier must be a UUID");
  return signedValue(value.toLowerCase(), secret);
}

export function analyticsCookieSecure(
  environment: AnalyticsRuntimeEnvironment = process.env,
) {
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") return true;
  const authOrigin = environment.BETTER_AUTH_URL?.trim() ?? "";
  const loopbackCiHttp = environment.CI === "true"
    && /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(authOrigin);
  return environment.NODE_ENV === "production" && !loopbackCiHttp;
}

function commonCookieOptions() {
  return {
    sameSite: "lax" as const,
    secure: analyticsCookieSecure(),
    path: "/",
  };
}

export function applyAnalyticsConsentCookie(
  response: NextResponse,
  state: Exclude<AnalyticsConsentState, "unknown">,
  secret = analyticsSigningSecret(),
) {
  response.cookies.set(ANALYTICS_CONSENT_COOKIE, signedAnalyticsConsent(state, secret), {
    ...commonCookieOptions(),
    httpOnly: false,
    maxAge: 180 * 24 * 60 * 60,
  });
}

export function applyAnalyticsIdentityCookies(
  response: NextResponse,
  identity: { anonymousId: string; sessionId: string },
  secret = analyticsSigningSecret(),
) {
  response.cookies.set(ANALYTICS_ANONYMOUS_COOKIE, signedAnalyticsUuid(identity.anonymousId, secret), {
    ...commonCookieOptions(),
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
  });
  response.cookies.set(ANALYTICS_SESSION_COOKIE, signedAnalyticsUuid(identity.sessionId, secret), {
    ...commonCookieOptions(),
    httpOnly: true,
    maxAge: ANALYTICS_SESSION_INACTIVITY_MS / 1000,
  });
}

export function clearAnalyticsIdentityCookies(response: NextResponse) {
  response.cookies.set(ANALYTICS_ANONYMOUS_COOKIE, "", { ...commonCookieOptions(), httpOnly: true, maxAge: 0 });
  response.cookies.set(ANALYTICS_SESSION_COOKIE, "", { ...commonCookieOptions(), httpOnly: true, maxAge: 0 });
}

export function analyticsEnvironment(environment: AnalyticsRuntimeEnvironment = process.env) {
  if (environment.NODE_ENV === "test") return "TEST" as const;
  if (environment.VERCEL_ENV === "production") return "PRODUCTION" as const;
  if (environment.VERCEL_ENV === "preview") return "PREVIEW" as const;
  return "LOCAL" as const;
}

export function analyticsTrafficKind(headers: Headers, environment = analyticsEnvironment()) {
  if (environment === "TEST") return "TEST" as const;
  const configuredInternalToken = process.env.ANALYTICS_INTERNAL_TRAFFIC_TOKEN?.trim();
  if (configuredInternalToken && headers.get("x-b4gamble-internal-traffic") === configuredInternalToken) {
    return "INTERNAL" as const;
  }
  const userAgent = headers.get("user-agent") ?? "";
  return /bot|crawler|spider|headless|playwright|lighthouse|monitor/i.test(userAgent)
    ? "BOT" as const
    : "HUMAN" as const;
}

export function analyticsDeviceCategory(headers: Headers) {
  const userAgent = headers.get("user-agent") ?? "";
  if (/ipad|tablet|kindle/i.test(userAgent)) return "TABLET" as const;
  if (/mobile|iphone|android/i.test(userAgent)) return "MOBILE" as const;
  return userAgent ? "DESKTOP" as const : "UNKNOWN" as const;
}

export function safeReferrerContext(requestUrl: string, referrer: string | null) {
  if (!referrer) return { referrerHost: null, sourcePage: null };
  try {
    const request = new URL(requestUrl);
    const source = new URL(referrer);
    return {
      referrerHost: source.hostname.toLowerCase().slice(0, 253),
      sourcePage: source.origin === request.origin ? source.pathname.slice(0, 512) : null,
    };
  } catch {
    return { referrerHost: null, sourcePage: null };
  }
}

import { NextResponse } from "next/server";

import {
  ANALYTICS_ANONYMOUS_COOKIE,
} from "@/lib/analytics/consent-contract";
import { recordAnalyticsConsentPreference } from "@/lib/analytics/consent.server";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import {
  analyticsSigningSecret,
  applyAnalyticsConsentCookie,
  applyAnalyticsIdentityCookies,
  clearAnalyticsIdentityCookies,
  newAnalyticsUuid,
  readAnalyticsConsent,
  readAnalyticsUuid,
} from "@/lib/analytics/identity.server";
import { getServerSession } from "@/lib/auth/session";
import { isSameOriginMutation } from "@/lib/http/mutation-request";
import { readBoundedRequestText } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  const result = NextResponse.json(body, { status });
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("Vary", "Cookie");
  return result;
}

export async function GET(request: Request) {
  try {
    return response({ analytics: readAnalyticsConsent(request.headers) });
  } catch {
    return response({ analytics: "unknown" });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return response({ code: "CROSS_ORIGIN_DENIED" }, 403);
  let analytics: boolean;
  try {
    const text = await readBoundedRequestText(request, 1024);
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
      || Object.keys(parsed).length !== 1 || typeof (parsed as { analytics?: unknown }).analytics !== "boolean") {
      throw new Error("invalid");
    }
    analytics = (parsed as { analytics: boolean }).analytics;
  } catch {
    return response({ code: "INVALID_CONSENT_REQUEST" }, 400);
  }

  if (analytics && !isProductAnalyticsEnabled()) {
    return response({ code: "ANALYTICS_DISABLED" }, 409);
  }

  try {
    const secret = analyticsSigningSecret();
    const currentAnonymousId = readAnalyticsUuid(request.headers, ANALYTICS_ANONYMOUS_COOKIE, secret);
    const anonymousId = currentAnonymousId ?? (analytics ? newAnalyticsUuid() : null);
    const userId = await getServerSession(request.headers).then((session) => session?.user.id ?? null).catch(() => null);
    await recordAnalyticsConsentPreference({ anonymousId, granted: analytics, userId });
    const result = response({ analytics: analytics ? "granted" : "denied" });
    applyAnalyticsConsentCookie(result, analytics ? "granted" : "denied", secret);
    if (analytics && anonymousId) {
      applyAnalyticsIdentityCookies(result, { anonymousId, sessionId: newAnalyticsUuid() }, secret);
    } else {
      clearAnalyticsIdentityCookies(result);
    }
    return result;
  } catch {
    console.error("[consent] analytics preference persistence failed", {
      consent_failure_category: "database_or_configuration",
    });
    return response({ code: "CONSENT_TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

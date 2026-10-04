import { NextResponse } from "next/server";

import { isAnalyticsExcludedPath } from "@/lib/analytics/excluded-paths";
import { safeParseProductAnalyticsEvent } from "@/lib/analytics/product-analytics-events";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import { analyticsRequestSource, consumeAnalyticsRateLimit } from "@/lib/analytics/rate-limit.server";
import { AnalyticsTimestampError, persistCookielessVisit } from "@/lib/analytics/service.server";
import { isSameOriginMutation } from "@/lib/http/mutation-request";
import { readBoundedRequestText } from "@/lib/programme/http";

export const dynamic = "force-dynamic";
const MAX_VISIT_BODY_BYTES = 4 * 1024;

function response(body: unknown, status: number) {
  const result = NextResponse.json(body, { status });
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  return result;
}

/**
 * RFC-046 §17: counts a page view (and an arrival) for every visitor, with or without the
 * cookie choice. It reads no analytics cookie, sets none and stores no identifier.
 */
export async function POST(request: Request) {
  if (!isProductAnalyticsEnabled()) return response({ code: "ANALYTICS_DISABLED" }, 404);
  if (!isSameOriginMutation(request)) return response({ code: "CROSS_ORIGIN_DENIED" }, 403);

  let payload: unknown;
  try {
    const text = await readBoundedRequestText(request, MAX_VISIT_BODY_BYTES);
    payload = JSON.parse(text) as unknown;
  } catch (error) {
    const tooLarge = error && typeof error === "object" && "code" in error && error.code === "PAYLOAD_TOO_LARGE";
    return response({ code: tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON" }, tooLarge ? 413 : 400);
  }
  const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : null;
  const keys = body ? Object.keys(body).sort().join(",") : "";
  const parsed = keys === "entry,event" && typeof body!.entry === "boolean" ? safeParseProductAnalyticsEvent(body!.event) : null;
  if (!parsed?.success || parsed.data.name !== "page_viewed" || !parsed.data.pagePath) {
    return response({ code: "INVALID_VISIT" }, 400);
  }
  // Protected Help, self-check and Admin are never counted, whatever a client sends.
  if (isAnalyticsExcludedPath(parsed.data.pagePath)) return response({ code: "EXCLUDED_PATH" }, 400);
  const entry = body!.entry as boolean;

  try {
    const rate = await consumeAnalyticsRateLimit({
      source: analyticsRequestSource(request.headers),
      eventCount: entry ? 2 : 1,
    });
    if (!rate.allowed) {
      const limited = response({ code: "RATE_LIMITED" }, 429);
      limited.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return limited;
    }
    const result = await persistCookielessVisit({ event: parsed.data, entry, headers: request.headers });
    return response({ result }, 202);
  } catch (error) {
    if (error instanceof AnalyticsTimestampError) return response({ code: "INVALID_TIMESTAMP" }, 400);
    console.warn("[analytics] cookieless count rejected", { analytics_failure_category: "database" });
    return response({ code: "ANALYTICS_TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

import { NextResponse } from "next/server";

import { safeParseProductAnalyticsEvent } from "@/lib/analytics/product-analytics-events";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import {
  AnalyticsConsentRequiredError,
  AnalyticsTimestampError,
  persistClientAnalyticsEvent,
  resolveAnalyticsRequestIdentity,
} from "@/lib/analytics/service.server";
import { applyAnalyticsIdentityCookies } from "@/lib/analytics/identity.server";
import {
  analyticsRequestSource,
  consumeAnalyticsRateLimit,
} from "@/lib/analytics/rate-limit.server";
import { isSameOriginMutation } from "@/lib/http/mutation-request";
import { readBoundedRequestText } from "@/lib/programme/http";

export const dynamic = "force-dynamic";
const MAX_ANALYTICS_BODY_BYTES = 32 * 1024;
const MAX_EVENTS_PER_REQUEST = 20;

function response(body: unknown, status: number) {
  const result = NextResponse.json(body, { status });
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("Vary", "Cookie");
  return result;
}

export async function POST(request: Request) {
  if (!isProductAnalyticsEnabled()) {
    return response({ code: "ANALYTICS_DISABLED" }, 404);
  }
  if (!isSameOriginMutation(request)) {
    return response({ code: "CROSS_ORIGIN_DENIED" }, 403);
  }

  let payload: unknown;
  try {
    const text = await readBoundedRequestText(request, MAX_ANALYTICS_BODY_BYTES);
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    const tooLarge = error && typeof error === "object" && "code" in error && error.code === "PAYLOAD_TOO_LARGE";
    return response({ code: tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON" }, tooLarge ? 413 : 400);
  }

  const rawEvents = payload && typeof payload === "object" && !Array.isArray(payload)
    && Object.keys(payload).length === 1 && "events" in payload
    && Array.isArray((payload as { events?: unknown }).events)
    ? (payload as { events: unknown[] }).events
    : null;
  if (!rawEvents || rawEvents.length < 1 || rawEvents.length > MAX_EVENTS_PER_REQUEST) {
    return response({ code: "INVALID_BATCH", maximum: MAX_EVENTS_PER_REQUEST }, 400);
  }

  try {
    const rate = await consumeAnalyticsRateLimit({
      source: analyticsRequestSource(request.headers),
      eventCount: rawEvents.length,
    });
    if (!rate.allowed) {
      const limited = response({ code: "RATE_LIMITED" }, 429);
      limited.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return limited;
    }
  } catch {
    console.error("[analytics] rate-limit persistence failed", {
      analytics_failure_category: "rate_limit_database",
    });
    return response({ code: "ANALYTICS_TEMPORARILY_UNAVAILABLE" }, 503);
  }

  const parsed = rawEvents.map((event, index) => ({
    index,
    result: safeParseProductAnalyticsEvent(event),
  }));
  const valid = parsed.flatMap((item) => item.result.success
    ? [{ index: item.index, event: item.result.data }]
    : []);
  if (!valid.length) {
    return response({
      accepted: 0,
      duplicate: 0,
      rejected: parsed.map(({ index }) => ({ index, code: "INVALID_EVENT" })),
    }, 400);
  }

  try {
    const identity = await resolveAnalyticsRequestIdentity(request, valid[0]!.event);
    const outcomes: Array<{ index: number; result: "accepted" | "duplicate" | "rejected"; code?: string }> = parsed
      .filter((item) => !item.result.success)
      .map(({ index }) => ({ index, result: "rejected", code: "INVALID_EVENT" }));

    for (const item of valid) {
      try {
        const result = await persistClientAnalyticsEvent({ event: item.event, identity });
        outcomes.push({ index: item.index, result });
      } catch (error) {
        outcomes.push({
          index: item.index,
          result: "rejected",
          code: error instanceof AnalyticsTimestampError ? "INVALID_TIMESTAMP" : "PERSISTENCE_ERROR",
        });
        console.warn("[analytics] event rejected", {
          analytics_event_name: item.event.name,
          analytics_failure_category: error instanceof AnalyticsTimestampError ? "timestamp" : "database",
        });
      }
    }

    outcomes.sort((left, right) => left.index - right.index);
    const result = response({
      accepted: outcomes.filter((item) => item.result === "accepted").length,
      duplicate: outcomes.filter((item) => item.result === "duplicate").length,
      rejected: outcomes.filter((item) => item.result === "rejected")
        .map(({ index, code }) => ({ index, code })),
    }, outcomes.some((item) => item.result === "rejected") ? 207 : 202);
    applyAnalyticsIdentityCookies(result, {
      anonymousId: identity.anonymousId,
      sessionId: identity.sessionId,
    });
    return result;
  } catch (error) {
    if (error instanceof AnalyticsConsentRequiredError) {
      return response({ code: "ANALYTICS_CONSENT_REQUIRED" }, 403);
    }
    console.error("[analytics] ingestion failed", {
      analytics_failure_category: "database",
    });
    return response({ code: "ANALYTICS_TEMPORARILY_UNAVAILABLE" }, 503);
  }
}

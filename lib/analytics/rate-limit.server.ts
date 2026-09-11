import "server-only";

import { createHmac } from "node:crypto";

import prisma from "@/lib/db/prisma";
import { analyticsSigningSecret } from "@/lib/analytics/identity.server";

export const ANALYTICS_RATE_LIMIT_WINDOW_MS = 60_000;
export const ANALYTICS_EVENTS_PER_SOURCE_PER_MINUTE = 240;
const RATE_LIMIT_DOMAIN = "b4gamble:analytics-ingestion-rate-limit:v1";

type AnalyticsRateLimitStore = {
  upsert(args: {
    where: { bucketKey: string };
    create: { bucketKey: string; count: number; windowStartedAt: Date; expiresAt: Date };
    update: { count: { increment: number }; expiresAt: Date };
    select: { count: true };
  }): Promise<{ count: number }>;
};

export function deriveAnalyticsRateLimitKey({
  source,
  windowNumber,
  secret,
}: {
  source: string;
  windowNumber: number;
  secret: string;
}) {
  if (!source || !secret || !Number.isSafeInteger(windowNumber) || windowNumber < 0) {
    throw new Error("Invalid analytics rate-limit input");
  }
  const purposeKey = createHmac("sha256", secret).update(RATE_LIMIT_DOMAIN).digest();
  return createHmac("sha256", purposeKey)
    .update(`${source}\n${windowNumber}`)
    .digest("hex");
}

export async function consumeAnalyticsRateLimit({
  source,
  eventCount,
  now = new Date(),
  store = prisma.analyticsRateLimitBucket,
  secret = analyticsSigningSecret(),
}: {
  source: string;
  eventCount: number;
  now?: Date;
  store?: AnalyticsRateLimitStore;
  secret?: string;
}) {
  if (!Number.isInteger(eventCount) || eventCount < 1 || eventCount > 20) {
    throw new Error("Invalid analytics rate-limit event count");
  }
  const timestamp = now.getTime();
  const windowNumber = Math.floor(timestamp / ANALYTICS_RATE_LIMIT_WINDOW_MS);
  const windowStartedAt = new Date(windowNumber * ANALYTICS_RATE_LIMIT_WINDOW_MS);
  const expiresAt = new Date(windowStartedAt.getTime() + ANALYTICS_RATE_LIMIT_WINDOW_MS);
  const bucketKey = deriveAnalyticsRateLimitKey({ source, windowNumber, secret });
  const bucket = await store.upsert({
    where: { bucketKey },
    create: { bucketKey, count: eventCount, windowStartedAt, expiresAt },
    update: { count: { increment: eventCount }, expiresAt },
    select: { count: true },
  });
  return {
    allowed: bucket.count <= ANALYTICS_EVENTS_PER_SOURCE_PER_MINUTE,
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - timestamp) / 1000)),
  };
}

export function analyticsRequestSource(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")?.trim()
    || "unknown";
}

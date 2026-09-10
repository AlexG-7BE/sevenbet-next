import { createHash } from "node:crypto";

import prisma from "@/lib/db/prisma";

export async function consumeCommercialMcpRateLimit({
  bucket,
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}) {
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStartedAt + windowMs;
  const bucketKey = createHash("sha256")
    .update(`${bucket}\0${key}\0${windowStartedAt}`)
    .digest("hex");
  await prisma.commercialMcpRateLimitBucket.deleteMany({
    where: { expiresAt: { lte: new Date(now) } },
  });
  const row = await prisma.commercialMcpRateLimitBucket.upsert({
    where: { bucketKey },
    create: {
      bucketKey,
      scope: bucket,
      count: 1,
      windowStartedAt: new Date(windowStartedAt),
      expiresAt: new Date(resetAt),
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt,
  };
}

export type PartnerTrackingRegistrationMetric =
  | "REQUEST"
  | "RESOLUTION_FAILURE"
  | "HEALTHY_VERIFICATION"
  | "BROKEN_VERIFICATION"
  | "INCONCLUSIVE_VERIFICATION"
  | "ACTIVATED_GEO"
  | "BLOCKED_LEGAL_GEO"
  | "REGULATORY_ACTION_GEO";

export async function recordPartnerTrackingRegistrationMetric({
  metric,
  increment = 1,
  now = Date.now(),
}: {
  metric: PartnerTrackingRegistrationMetric;
  increment?: number;
  now?: number;
}) {
  const boundedIncrement = Math.max(1, Math.min(10_000, Math.trunc(increment)));
  const windowMs = 24 * 60 * 60 * 1_000;
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const scope = `partner-tracking-registration:${metric.toLowerCase()}`;
  const bucketKey = createHash("sha256")
    .update(`${scope}\0${windowStartedAt}`)
    .digest("hex");
  await prisma.commercialMcpRateLimitBucket.upsert({
    where: { bucketKey },
    create: {
      bucketKey,
      scope,
      count: boundedIncrement,
      windowStartedAt: new Date(windowStartedAt),
      expiresAt: new Date(windowStartedAt + 35 * windowMs),
    },
    update: { count: { increment: boundedIncrement } },
  });
}

export function commercialMcpRateLimitKey(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function clearCommercialMcpRateLimitsForTests() {
  return prisma.commercialMcpRateLimitBucket.deleteMany();
}

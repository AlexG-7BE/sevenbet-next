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

export function commercialMcpRateLimitKey(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function clearCommercialMcpRateLimitsForTests() {
  return prisma.commercialMcpRateLimitBucket.deleteMany();
}

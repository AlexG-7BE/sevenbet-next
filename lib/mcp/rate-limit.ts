import { createHash } from "node:crypto";

type Bucket = { count: number; expiresAt: number };

const MAX_BUCKETS = 10_000;

export function mcpRequestKey(request: Request) {
  const address = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}

// One process-local fixed-window limiter per service-authenticated MCP endpoint;
// endpoints never share buckets.
export function createMcpRateLimiter() {
  const buckets = new Map<string, Bucket>();
  return {
    consume(key: string, limit: number, windowMs: number, now = Date.now()) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.expiresAt <= now) buckets.delete(bucketKey);
      }
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const bucketKey = `${key}:${windowStart}`;
      if (!buckets.has(bucketKey) && buckets.size >= MAX_BUCKETS) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1_000)) };
      }
      const bucket = buckets.get(bucketKey) ?? { count: 0, expiresAt: windowStart + windowMs };
      bucket.count += 1;
      buckets.set(bucketKey, bucket);
      return { allowed: bucket.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1_000)) };
    },
    clear() {
      buckets.clear();
    },
  };
}

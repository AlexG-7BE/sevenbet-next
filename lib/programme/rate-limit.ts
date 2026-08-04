import { ServiceError } from "@/lib/services/service-error";

const buckets = new Map<string, { count: number; resetsAt: number }>();

export function assertProgrammeRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now = Date.now(),
) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) {
    throw new ServiceError("Too many programme requests", "RATE_LIMITED", 429);
  }
  bucket.count += 1;
}
export function resetProgrammeRateLimitsForTests() {
  buckets.clear();
}

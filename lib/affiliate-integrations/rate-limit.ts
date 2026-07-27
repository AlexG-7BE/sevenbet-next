import { ValidationError } from "@/lib/services/service-error";

const operations = new Map<string, number[]>();

export function assertAffiliateOperationRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const recent = (operations.get(key) ?? []).filter((timestamp) => now - timestamp < options.windowMs);
  if (recent.length >= options.limit) throw new ValidationError("Too many affiliate integration requests. Try again shortly.");
  recent.push(now);
  operations.set(key, recent);
}

export function resetAffiliateOperationRateLimitsForTests() {
  operations.clear();
}

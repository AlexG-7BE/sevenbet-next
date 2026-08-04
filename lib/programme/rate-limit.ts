import { ServiceError } from "@/lib/services/service-error";

export type ProgrammeRateLimitPolicy = { limit: number; windowMs: number };

export type ProgrammeRateLimiter = {
  assert(key: string, policy: ProgrammeRateLimitPolicy, now?: number): void;
};

/**
 * Single-process development baseline. Production multi-instance deployment
 * must replace this provider behind the same application-facing contract.
 */
class InMemoryProgrammeRateLimiter implements ProgrammeRateLimiter {
  private readonly buckets = new Map<
    string,
    { count: number; resetsAt: number }
  >();

  assert(
    key: string,
    { limit, windowMs }: ProgrammeRateLimitPolicy,
    now = Date.now(),
  ) {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetsAt <= now) {
      this.buckets.set(key, { count: 1, resetsAt: now + windowMs });
      return;
    }
    if (bucket.count >= limit) {
      throw new ServiceError("Too many programme requests", "RATE_LIMITED", 429);
    }
    bucket.count += 1;
  }

  reset() {
    this.buckets.clear();
  }
}

const inMemoryProgrammeRateLimiter = new InMemoryProgrammeRateLimiter();

export let programmeRateLimiter: ProgrammeRateLimiter = inMemoryProgrammeRateLimiter;

export function configureProgrammeRateLimiter(rateLimiter: ProgrammeRateLimiter) {
  programmeRateLimiter = rateLimiter;
}

export function assertProgrammeRateLimit(
  key: string,
  policy: ProgrammeRateLimitPolicy,
  now?: number,
) {
  programmeRateLimiter.assert(key, policy, now);
}

export function resetProgrammeRateLimitsForTests() {
  inMemoryProgrammeRateLimiter.reset();
  programmeRateLimiter = inMemoryProgrammeRateLimiter;
}

import { createHmac } from "node:crypto";

import prisma from "@/lib/db/prisma";
import { ServiceError } from "@/lib/services/service-error";

export const PROGRAMME_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_KEY_DOMAIN = "b4gamble:programme-rate-limit:key:v1";

export const programmeRateLimitPolicies = {
  PROGRAMME_SESSION_CREATE_IP: 12,
  PROGRAMME_TRANSCRIPTION_SESSION: 6,
  PROGRAMME_TRANSCRIPTION_IP: 20,
  PROGRAMME_M1_AI_SESSION: 4,
  PROGRAMME_M1_AI_IP: 30,
  PROGRAMME_MISSION_GUIDANCE_USER: 30,
  PROGRAMME_REVIEW_USER: 12,
  PROGRAMME_MUTATION_USER: 120,
} as const;

export type ProgrammeRateLimitScope = keyof typeof programmeRateLimitPolicies;

export type ProgrammeRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type ProgrammeRateLimiter = {
  consume(input: {
    scope: ProgrammeRateLimitScope;
    source: string;
    now?: Date;
  }): Promise<ProgrammeRateLimitDecision>;
};

type RateLimitBucketStore = {
  upsert(args: {
    where: { bucketKey: string };
    create: {
      bucketKey: string;
      scope: ProgrammeRateLimitScope;
      count: number;
      windowStartedAt: Date;
      expiresAt: Date;
    };
    update: {
      count: { increment: number };
      expiresAt: Date;
    };
    select: { count: true };
  }): Promise<{ count: number }>;
};

type RateLimitDatabase = {
  programmeRuntimeRateLimitBucket: RateLimitBucketStore;
};

function rateLimitSecret(
  environment: { BETTER_AUTH_SECRET?: string } = process.env as {
    BETTER_AUTH_SECRET?: string;
  },
) {
  const secret = environment.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new Error("Programme runtime rate limiting is not configured");
  return secret;
}

export function deriveProgrammeRateLimitBucketKey({
  secret,
  scope,
  source,
  windowNumber,
}: {
  secret: string;
  scope: ProgrammeRateLimitScope;
  source: string;
  windowNumber: number;
}) {
  if (!secret.trim() || !source || !Number.isSafeInteger(windowNumber) || windowNumber < 0) {
    throw new Error("Programme runtime rate-limit key input is invalid");
  }
  const purposeKey = createHmac("sha256", secret)
    .update(RATE_LIMIT_KEY_DOMAIN, "utf8")
    .digest();
  return createHmac("sha256", purposeKey)
    .update(`${scope}\n${source}\n${windowNumber}`, "utf8")
    .digest("hex");
}

function windowFacts(now: Date) {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error("Programme runtime rate-limit clock is invalid");
  const windowNumber = Math.floor(timestamp / PROGRAMME_RATE_LIMIT_WINDOW_MS);
  const windowStartedAt = new Date(windowNumber * PROGRAMME_RATE_LIMIT_WINDOW_MS);
  const expiresAt = new Date(windowStartedAt.getTime() + PROGRAMME_RATE_LIMIT_WINDOW_MS);
  const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - timestamp) / 1000));
  return { windowNumber, windowStartedAt, expiresAt, retryAfterSeconds };
}

export class PrismaProgrammeRateLimiter implements ProgrammeRateLimiter {
  constructor(
    private readonly database: RateLimitDatabase,
    private readonly secret: string,
  ) {}

  async consume({
    scope,
    source,
    now = new Date(),
  }: {
    scope: ProgrammeRateLimitScope;
    source: string;
    now?: Date;
  }) {
    const facts = windowFacts(now);
    const bucketKey = deriveProgrammeRateLimitBucketKey({
      secret: this.secret,
      scope,
      source,
      windowNumber: facts.windowNumber,
    });
    const bucket = await this.database.programmeRuntimeRateLimitBucket.upsert({
      where: { bucketKey },
      create: {
        bucketKey,
        scope,
        count: 1,
        windowStartedAt: facts.windowStartedAt,
        expiresAt: facts.expiresAt,
      },
      update: {
        count: { increment: 1 },
        expiresAt: facts.expiresAt,
      },
      select: { count: true },
    });
    return {
      allowed: bucket.count <= programmeRateLimitPolicies[scope],
      retryAfterSeconds: facts.retryAfterSeconds,
    };
  }
}

export class InMemoryProgrammeRateLimiter implements ProgrammeRateLimiter {
  private readonly buckets = new Map<string, number>();

  constructor(private readonly secret = "programme-runtime-rate-limit-test-secret") {}

  async consume({
    scope,
    source,
    now = new Date(),
  }: {
    scope: ProgrammeRateLimitScope;
    source: string;
    now?: Date;
  }) {
    const facts = windowFacts(now);
    const bucketKey = deriveProgrammeRateLimitBucketKey({
      secret: this.secret,
      scope,
      source,
      windowNumber: facts.windowNumber,
    });
    const count = (this.buckets.get(bucketKey) ?? 0) + 1;
    this.buckets.set(bucketKey, count);
    return {
      allowed: count <= programmeRateLimitPolicies[scope],
      retryAfterSeconds: facts.retryAfterSeconds,
    };
  }
}

class EnvironmentProgrammeRateLimiter implements ProgrammeRateLimiter {
  async consume(input: { scope: ProgrammeRateLimitScope; source: string; now?: Date }) {
    // Only Node's isolated test workers use the memory seam. Local, Preview and
    // Production runtime requests all use the shared PostgreSQL bucket table.
    if (process.env.NODE_TEST_CONTEXT) {
      return developmentProgrammeRateLimiter.consume(input);
    }
    return new PrismaProgrammeRateLimiter(prisma, rateLimitSecret()).consume(input);
  }
}

export class ProgrammeRateLimitError extends ServiceError {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many programme requests", "RATE_LIMITED", 429);
    this.name = "ProgrammeRateLimitError";
  }
}

const developmentProgrammeRateLimiter = new InMemoryProgrammeRateLimiter();
const environmentProgrammeRateLimiter = new EnvironmentProgrammeRateLimiter();
export let programmeRateLimiter: ProgrammeRateLimiter = environmentProgrammeRateLimiter;

export function configureProgrammeRateLimiter(rateLimiter: ProgrammeRateLimiter) {
  programmeRateLimiter = rateLimiter;
}

export async function programmeRateLimitDecision(
  scope: ProgrammeRateLimitScope,
  source: string,
  now?: Date,
) {
  if (!source) {
    return { allowed: false, retryAfterSeconds: Math.ceil(PROGRAMME_RATE_LIMIT_WINDOW_MS / 1000) };
  }
  try {
    return await programmeRateLimiter.consume({ scope, source, now });
  } catch {
    console.error("[programme-rate-limit] check failed", {
      rate_limit_scope: scope,
      failure_category: "database",
    });
    throw new ServiceError(
      "Programme request protection is temporarily unavailable",
      "RATE_LIMIT_CHECK_FAILED",
      503,
    );
  }
}

export async function assertProgrammeRateLimit(
  scope: ProgrammeRateLimitScope,
  source: string,
  now?: Date,
) {
  const decision = await programmeRateLimitDecision(scope, source, now);
  if (!decision.allowed) {
    console.warn("[programme-rate-limit] request limited", {
      rate_limit_scope: scope,
      rate_limited: true,
    });
    throw new ProgrammeRateLimitError(decision.retryAfterSeconds);
  }
  return decision;
}

export async function programmeProviderRateLimitAllowance(
  scope: ProgrammeRateLimitScope,
  source: string,
  now?: Date,
) {
  try {
    return (await programmeRateLimitDecision(scope, source, now)).allowed;
  } catch {
    return false;
  }
}

export function resetProgrammeRateLimitsForTests() {
  programmeRateLimiter = new InMemoryProgrammeRateLimiter();
}

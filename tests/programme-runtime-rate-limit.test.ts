import assert from "node:assert/strict";
import test from "node:test";

import { DELETE as withdrawAuthority, POST as confirmAuthority } from "../app/api/program/program-ai/authority/route";
import { POST as createProgramAiClaim } from "../app/api/program/program-ai/claim/route";
import { POST as confirmStartingPoint } from "../app/api/program/program-ai/starting-point/route";
import { POST as continueAfterSupport } from "../app/api/program/program-ai/support/continue/route";
import { POST as createProgramAiTurn } from "../app/api/program/program-ai/turn/route";
import { POST as createLegacyClaim } from "../app/api/program/session/mission-01/claim/route";
import { PATCH as saveLegacyMissionOne } from "../app/api/program/session/mission-01/route";
import { ProgrammeAiGuidanceService } from "../lib/programme/application/programme-ai-guidance.service";
import { anonymousProgrammeCookie, programmeErrorResponse } from "../lib/programme/http";
import { ProgrammeProviderError } from "../lib/programme/program-ai/provider-errors";
import {
  PROGRAMME_RATE_LIMIT_WINDOW_MS,
  ProgrammeRateLimitError,
  PrismaProgrammeRateLimiter,
  configureProgrammeRateLimiter,
  deriveProgrammeRateLimitBucketKey,
  programmeProviderRateLimitAllowance,
  programmeRateLimitPolicies,
  resetProgrammeRateLimitsForTests,
} from "../lib/programme/rate-limit";
import { hashOpaqueToken } from "../lib/programme/security";

function rateLimitDatabase() {
  const counts = new Map<string, number>();
  const writes: Array<Record<string, unknown>> = [];
  return {
    counts,
    writes,
    database: {
      programmeRuntimeRateLimitBucket: {
        async upsert(args: {
          where: { bucketKey: string };
          create: unknown;
          update: unknown;
          select: unknown;
        }) {
          writes.push(args);
          const key = args.where.bucketKey as string;
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          return { count };
        },
      },
    },
  };
}

test("the PostgreSQL limiter enforces exact thresholds and resets in a new fixed window", async () => {
  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, "test-secret");
  const now = new Date("2026-08-11T10:01:00.000Z");
  for (let index = 0; index < programmeRateLimitPolicies.PROGRAMME_M1_AI_SESSION; index += 1) {
    assert.equal((await limiter.consume({ scope: "PROGRAMME_M1_AI_SESSION", source: "session-a", now })).allowed, true);
  }
  const limited = await limiter.consume({ scope: "PROGRAMME_M1_AI_SESSION", source: "session-a", now });
  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfterSeconds > 0 && limited.retryAfterSeconds <= PROGRAMME_RATE_LIMIT_WINDOW_MS / 1_000);
  assert.equal((await limiter.consume({
    scope: "PROGRAMME_M1_AI_SESSION",
    source: "session-a",
    now: new Date(now.getTime() + PROGRAMME_RATE_LIMIT_WINDOW_MS),
  })).allowed, true);
  assert.equal((await limiter.consume({ scope: "PROGRAMME_M1_AI_SESSION", source: "session-b", now })).allowed, true);
});

test("IP, anonymous-session, and user sources remain independent and 429 responses are bounded", async () => {
  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, "test-secret");
  const now = new Date("2026-08-11T10:01:00.000Z");
  for (const scope of [
    "PROGRAMME_SESSION_CREATE_IP",
    "PROGRAMME_TRANSCRIPTION_SESSION",
    "PROGRAMME_MISSION_GUIDANCE_USER",
  ] as const) {
    const first = scope.endsWith("_IP") ? "198.51.100.1" : scope.endsWith("_SESSION") ? "anonymous-a" : "user-a";
    const second = scope.endsWith("_IP") ? "198.51.100.2" : scope.endsWith("_SESSION") ? "anonymous-b" : "user-b";
    for (let index = 0; index < programmeRateLimitPolicies[scope]; index += 1) {
      assert.equal((await limiter.consume({ scope, source: first, now })).allowed, true);
    }
    assert.equal((await limiter.consume({ scope, source: first, now })).allowed, false);
    assert.equal((await limiter.consume({ scope, source: second, now })).allowed, true);
  }

  const response = programmeErrorResponse(new ProgrammeRateLimitError(42));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "42");
  assert.deepEqual(await response.json(), { code: "RATE_LIMITED", retryAfterSeconds: 42 });
});

test("anonymous mutation scope allows 60, limits 61, and isolates sessions", async () => {
  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, "test-secret");
  const now = new Date("2026-08-11T10:01:00.000Z");
  const sessionA = hashOpaqueToken("anonymous-session-a");
  const sessionB = hashOpaqueToken("anonymous-session-b");
  for (let index = 0; index < programmeRateLimitPolicies.PROGRAMME_MUTATION_SESSION; index += 1) {
    assert.equal((await limiter.consume({ scope: "PROGRAMME_MUTATION_SESSION", source: sessionA, now })).allowed, true);
  }
  assert.equal((await limiter.consume({ scope: "PROGRAMME_MUTATION_SESSION", source: sessionA, now })).allowed, false);
  assert.equal((await limiter.consume({ scope: "PROGRAMME_MUTATION_SESSION", source: sessionB, now })).allowed, true);
});

test("every previously protected anonymous mutation uses the distributed session scope", async () => {
  const rawToken = "anonymous-route-wiring-token";
  const expectedSource = hashOpaqueToken(rawToken);
  const consumed: Array<{ scope: string; source: string }> = [];
  configureProgrammeRateLimiter({
    consume: async ({ scope, source }) => {
      consumed.push({ scope, source });
      return { allowed: false, retryAfterSeconds: 42 };
    },
  });
  const request = (method: string) => new Request("https://b4gamble.com/api/program/test", {
    method,
    headers: { cookie: `${anonymousProgrammeCookie}=${rawToken}` },
  });
  try {
    const responses = await Promise.all([
      confirmAuthority(request("POST")),
      withdrawAuthority(request("DELETE")),
      createProgramAiClaim(request("POST")),
      confirmStartingPoint(request("POST")),
      continueAfterSupport(request("POST")),
      createProgramAiTurn(request("POST")),
      createLegacyClaim(request("POST")),
      saveLegacyMissionOne(request("PATCH")),
    ]);
    assert.ok(responses.every((response) => response.status === 429));
    assert.equal(consumed.length, 8);
    assert.ok(consumed.every(({ scope, source }) => (
      scope === "PROGRAMME_MUTATION_SESSION" && source === expectedSource
    )));
    assert.ok(consumed.every(({ source }) => source !== rawToken));
  } finally {
    resetProgrammeRateLimitsForTests();
  }
});

test("a normal Mission 01 anonymous mutation path remains well below the generic threshold", async () => {
  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, "test-secret");
  const source = hashOpaqueToken("normal-m1-session");
  const decisions = await Promise.all(Array.from({ length: 8 }, () => limiter.consume({
    scope: "PROGRAMME_MUTATION_SESSION",
    source,
    now: new Date("2026-08-11T10:01:00.000Z"),
  })));
  assert.ok(decisions.every((decision) => decision.allowed));
  assert.equal(programmeRateLimitPolicies.PROGRAMME_MUTATION_SESSION - decisions.length, 52);
});

test("concurrent attempts use one atomic bucket and permit only the configured allowance", async () => {
  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, "test-secret");
  const decisions = await Promise.all(Array.from({ length: 50 }, () => limiter.consume({
    scope: "PROGRAMME_SESSION_CREATE_IP",
    source: "203.0.113.8",
    now: new Date("2026-08-11T10:01:00.000Z"),
  })));
  assert.equal(decisions.filter((decision) => decision.allowed).length, programmeRateLimitPolicies.PROGRAMME_SESSION_CREATE_IP);
  assert.deepEqual([...state.counts.values()], [50]);
});

test("bucket keys are deterministic HMAC digests and raw sources never enter writes", async () => {
  const input = {
    secret: "test-secret",
    scope: "PROGRAMME_TRANSCRIPTION_IP" as const,
    source: "198.51.100.42",
    windowNumber: 10,
  };
  const first = deriveProgrammeRateLimitBucketKey(input);
  assert.equal(first, deriveProgrammeRateLimitBucketKey(input));
  assert.notEqual(first, deriveProgrammeRateLimitBucketKey({ ...input, scope: "PROGRAMME_M1_AI_IP" }));
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(first, /198\.51\.100\.42/);

  const state = rateLimitDatabase();
  const limiter = new PrismaProgrammeRateLimiter(state.database, input.secret);
  await limiter.consume({ scope: input.scope, source: input.source, now: new Date("2026-08-11T10:01:00.000Z") });
  assert.doesNotMatch(JSON.stringify(state.writes), /198\.51\.100\.42/);
  assert.match(JSON.stringify(state.writes), /PROGRAMME_TRANSCRIPTION_IP/);

  const rawToken = "anonymous-private-token";
  const tokenHash = hashOpaqueToken(rawToken);
  const mutationState = rateLimitDatabase();
  const mutationLimiter = new PrismaProgrammeRateLimiter(mutationState.database, input.secret);
  await mutationLimiter.consume({
    scope: "PROGRAMME_MUTATION_SESSION",
    source: tokenHash,
    now: new Date("2026-08-11T10:01:00.000Z"),
  });
  const mutationWrites = JSON.stringify(mutationState.writes);
  assert.doesNotMatch(mutationWrites, new RegExp(rawToken));
  assert.doesNotMatch(mutationWrites, new RegExp(tokenHash));
  assert.notEqual((mutationState.writes[0].where as { bucketKey: string }).bucketKey, tokenHash);
});

test("a limiter failure suppresses provider work instead of bypassing protection", async () => {
  configureProgrammeRateLimiter({ consume: async () => { throw new Error("database unavailable"); } });
  try {
    assert.equal(await programmeProviderRateLimitAllowance("PROGRAMME_REVIEW_USER", "user-a"), false);
  } finally {
    resetProgrammeRateLimitsForTests();
  }
});

test("a rate-limited guidance request returns the deterministic fallback without invoking the provider", async () => {
  const previousFlag = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  let providerCalls = 0;
  const missions = {
    mission: async () => ({
      title: "Set a 7-day goal",
      artifact: {},
      actionsCompleted: 0,
    }),
    home: async () => ({ startingPoint: null }),
    reviewContext: async () => ({ startingPoint: null, facts: [] }),
  };
  const service = new ProgrammeAiGuidanceService(
    missions as never,
    { generate: async () => { providerCalls += 1; throw new Error("must not run"); } },
  );
  try {
    const result = await service.missionGuidance("user-a", 2, { locale: "en-GB" }, false);
    assert.equal(result.generation, "deterministic_fallback");
    const review = await service.review("user-a", "first", { locale: "en-GB" }, false);
    assert.equal(review.generation, "deterministic_fallback");
    assert.equal(providerCalls, 0);
  } finally {
    if (previousFlag === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previousFlag;
  }
});

test("provider failures retain a usable fallback and expose only a closed reliability category", async () => {
  const previousFlag = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  const missions = {
    mission: async () => ({ title: "Set a 7-day goal", artifact: {}, actionsCompleted: 0 }),
    home: async () => ({ startingPoint: null }),
  };
  try {
    for (const [providerCode, providerOutcome] of [
      ["PROVIDER_TIMEOUT", "timeout"],
      ["PROVIDER_INVALID_OUTPUT", "invalid_output"],
      ["PROVIDER_RATE_LIMIT", "rate_limited"],
      ["PROVIDER_UNAVAILABLE", "provider_error"],
    ] as const) {
      const service = new ProgrammeAiGuidanceService(
        missions as never,
        { generate: async () => { throw new ProgrammeProviderError(providerCode); } },
      );
      const result = await service.missionGuidance("user-a", 2, { locale: "en-GB" }, true);
      assert.equal(result.generation, "deterministic_fallback");
      assert.equal(result.providerOutcome, providerOutcome);
    }
  } finally {
    if (previousFlag === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previousFlag;
  }
});

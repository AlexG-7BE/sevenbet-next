import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { AuthenticationRequiredError } from "../lib/auth/errors";
import {
  handleCompleteProgress,
  handleCurrentStepProgress,
  handleExerciseProgress,
  handleLessonProgress,
  handleMergeProgress,
  handleQuizProgress,
  handleScenarioProgress,
  handleStartProgress,
  handleStepProgress,
  progressErrorResponse,
} from "../lib/progress/http";
import { programmeErrorResponse, programmeResponse } from "../lib/programme/http";
import {
  LegacyProgrammeModeConflictError,
  assertLegacyProgrammeMutationAllowed,
} from "../lib/programme/legacy-runtime";
import {
  configureProgrammeRateLimiter,
  resetProgrammeRateLimitsForTests,
} from "../lib/programme/rate-limit";

const modeConflictWrites = [
  "session:POST",
  "session/mission-01:PATCH",
  "session/mission-01/claim:POST",
  "claims/redeem:POST",
  "missions/01:PATCH",
  "missions/01/complete:POST",
  "missions/02:PUT",
  "missions/02/complete:POST",
  "missions/03:PUT",
  "missions/03/complete:POST",
  "missions/04:PATCH",
  "missions/04/complete:POST",
  "artefacts/moment-map:PATCH",
  "artefacts/current-goal:PATCH",
  "artefacts/urge-learning-record:PATCH",
  "artefacts/active-boundary:PATCH",
  "reflections:POST",
  "progress/start:POST",
  "progress/current-step:POST",
  "progress/lesson:POST",
  "progress/exercise:POST",
  "progress/quiz:POST",
  "progress/scenario:POST",
  "progress/step:POST",
  "progress/complete:POST",
  "progress/merge:POST",
] as const;

const featureOnCleanupRoutes = [
  "session:DELETE",
  "artefacts/moment-map:DELETE",
  "artefacts/current-goal:DELETE",
  "artefacts/urge-learning-record:DELETE",
  "artefacts/active-boundary:DELETE",
  "reflections:DELETE",
] as const;

const directlyUserRateLimitedRoutes = [
  "claims/redeem:POST",
  "missions/01:PATCH",
  "missions/01/complete:POST",
  "missions/02:PUT",
  "missions/02/complete:POST",
  "missions/03:PUT",
  "missions/03/complete:POST",
  "missions/04:PATCH",
  "missions/04/complete:POST",
  "artefacts/current-goal:PATCH",
  "artefacts/current-goal:DELETE",
  "artefacts/urge-learning-record:PATCH",
  "artefacts/urge-learning-record:DELETE",
  "artefacts/active-boundary:PATCH",
  "artefacts/active-boundary:DELETE",
  "artefacts/moment-map:DELETE",
  "reflections:DELETE",
] as const;

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function routeMethodSource(identifier: string) {
  const separator = identifier.lastIndexOf(":");
  const path = identifier.slice(0, separator);
  const method = identifier.slice(separator + 1);
  const source = readFileSync(`app/api/program/${path}/route.ts`, "utf8");
  const start = source.indexOf(`export async function ${method}`);
  assert.notEqual(start, -1, identifier);
  const next = source.indexOf("\nexport async function ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

function request() {
  return new Request("https://b4gamble.com/api/program/progress/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });
}

test("the legacy-mode guard is exact-true and maps to one stable conflict", async () => {
  for (const value of [undefined, "", "false", "TRUE", " true "]) {
    assert.doesNotThrow(() => assertLegacyProgrammeMutationAllowed(value));
  }
  let captured: unknown;
  try {
    assertLegacyProgrammeMutationAllowed("true");
  } catch (error) {
    captured = error;
  }
  assert.ok(captured instanceof LegacyProgrammeModeConflictError);
  assert.equal(captured.code, "PROGRAMME_RUNTIME_MODE_CONFLICT");
  assert.equal(captured.statusCode, 409);
  const response = programmeErrorResponse(captured);
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Legacy Programme mutations are unavailable while PROGRAM-AI is enabled",
    code: "PROGRAMME_RUNTIME_MODE_CONFLICT",
  });
});

test("every non-AI legacy mutation route is explicitly classified", () => {
  const discovered = filesBelow("app/api/program")
    .filter((path) => path.endsWith("/route.ts") && !path.includes("/program-ai/"))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      const relative = path
        .replace(/^app\/api\/program\//, "")
        .replace(/\/route\.ts$/, "");
      return [...source.matchAll(/^export async function (POST|PUT|PATCH|DELETE)\b/gm)]
        .map((match) => `${relative}:${match[1]}`);
    })
    .sort();
  const classified = [...modeConflictWrites, ...featureOnCleanupRoutes].sort();
  assert.deepEqual(discovered, classified);
  assert.equal(modeConflictWrites.length, 26);
  assert.equal(featureOnCleanupRoutes.length, 6);
});

test("every direct legacy write checks mode before auth, input, limits, or services", () => {
  for (const identifier of modeConflictWrites.filter((value) => !value.startsWith("progress/"))) {
    const source = routeMethodSource(identifier);
    const guard = source.indexOf("assertLegacyProgrammeMutationAllowed()");
    assert.notEqual(guard, -1, identifier);
    const possibleSideEffects = [
      "requireCurrentUser(",
      "requireProgrammeAcceptedUser(",
      "requestCookie(",
      "assertProgrammeRateLimit(",
      "assertAnonymousProgrammeMutationRateLimit(",
      "readProgrammeJson(",
      "programmeSessionService.",
      "programmeClaimService.",
      "missionOneService.",
      "missionTwoService.",
      "missionThreeService.",
      "missionFourService.",
      "programmeArtefactService.",
    ]
      .map((needle) => source.indexOf(needle))
      .filter((index) => index !== -1);
    assert.ok(possibleSideEffects.length > 0, identifier);
    assert.ok(guard < Math.min(...possibleSideEffects), identifier);
  }

  const progress = readFileSync("lib/progress/http.ts", "utf8");
  const start = progress.slice(
    progress.indexOf("export async function handleStartProgress"),
    progress.indexOf("async function handleProgressAction"),
  );
  const action = progress.slice(
    progress.indexOf("async function handleProgressAction"),
    progress.indexOf("export function handleCurrentStepProgress"),
  );
  for (const [name, source] of [["start", start], ["action", action]] as const) {
    const guard = source.indexOf("assertLegacyProgrammeMutationAllowed()");
    assert.notEqual(guard, -1, name);
    assert.ok(guard < source.indexOf("dependencies.requireUser"), name);
    assert.ok(source.indexOf("dependencies.requireUser") < source.indexOf("assertProgrammeRateLimit"), name);
    assert.ok(source.indexOf("assertProgrammeRateLimit") < source.indexOf("readProgressJson"), name);
  }
});

test("feature-on keeps authenticated reads and personal-data cleanup routes reachable", () => {
  for (const identifier of featureOnCleanupRoutes) {
    const source = routeMethodSource(identifier);
    assert.doesNotMatch(source, /assertLegacyProgrammeMutationAllowed/, identifier);
    assert.match(source, /require(?:CurrentUser|ProgrammeAcceptedUser)\(/, identifier);
  }
  const reflections = readFileSync("app/api/program/reflections/route.ts", "utf8");
  assert.doesNotMatch(reflections, /NextResponse/);
  assert.match(reflections, /programmeErrorResponse/);
  assert.match(reflections, /programmeResponse/);
  const reflectionDelete = routeMethodSource("reflections:DELETE");
  assert.match(reflectionDelete, /readProgrammeJson/);
  assert.match(reflectionDelete, /assertOnlyKeys/);
});

test("every authenticated legacy database mutation uses the RFC-026 user scope", () => {
  for (const identifier of directlyUserRateLimitedRoutes) {
    const source = routeMethodSource(identifier);
    assert.match(source, /assertProgrammeRateLimit\("PROGRAMME_MUTATION_USER", user\.id\)/, identifier);
    const authorization = [source.indexOf("requireCurrentUser"), source.indexOf("requireProgrammeAcceptedUser")]
      .filter((index) => index !== -1);
    assert.ok(Math.min(...authorization) < source.indexOf("assertProgrammeRateLimit"), identifier);
    const inputOrService = ["readProgrammeJson(", "programmeClaimService.", "missionOneService.", "missionTwoService.", "missionThreeService.", "missionFourService.", "programmeArtefactService.", "programReflectionService."]
      .map((needle) => source.indexOf(needle))
      .filter((index) => index !== -1);
    assert.ok(inputOrService.length > 0, identifier);
    assert.ok(source.indexOf("assertProgrammeRateLimit") < Math.min(...inputOrService), identifier);
  }
});

test("all generic progress mutations apply the RFC-026 user limiter before parsing or service work", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "false";
  const consumed: Array<{ scope: string; source: string }> = [];
  configureProgrammeRateLimiter({
    consume: async ({ scope, source }) => {
      consumed.push({ scope, source });
      return { allowed: false, retryAfterSeconds: 37 };
    },
  });
  const dependencies = {
    requireUser: async () => ({ id: "progress-user" }),
    service: new Proxy({}, {
      get() {
        throw new Error("service must not be read when the limiter denies");
      },
    }),
  } as never;
  const handlers = [
    handleStartProgress,
    handleCurrentStepProgress,
    handleLessonProgress,
    handleExerciseProgress,
    handleQuizProgress,
    handleScenarioProgress,
    handleStepProgress,
    handleCompleteProgress,
    handleMergeProgress,
  ];
  try {
    for (const handler of handlers) {
      const response = await handler(request(), dependencies);
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("retry-after"), "37");
      assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    }
    assert.deepEqual(
      consumed,
      handlers.map(() => ({ scope: "PROGRAMME_MUTATION_USER", source: "progress-user" })),
    );
  } finally {
    resetProgrammeRateLimitsForTests();
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("legacy success and auth-error responses are private and use the Programme mapper", async () => {
  const success = programmeResponse({ ok: true });
  assert.equal(success.headers.get("cache-control"), "private, no-store, max-age=0");

  const response = progressErrorResponse(new AuthenticationRequiredError());
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Authentication required",
    code: "AUTHENTICATION_REQUIRED",
  });
});

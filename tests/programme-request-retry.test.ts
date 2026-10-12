import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  PROGRAMME_RETRY_DELAY_MS,
  fetchProgrammeWithRetry,
  programmeRequestIsRepeatable,
} from "../lib/programme/request-retry";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/** A fetch that answers from a script and records what it was asked. */
function scriptedFetch(script: (Response | Error)[]) {
  const calls: { path: string; init?: RequestInit }[] = [];
  const waits: number[] = [];
  return {
    calls,
    waits,
    runtime: {
      fetcher: async (path: string, init?: RequestInit) => {
        calls.push({ path, init });
        const next = script[calls.length - 1];
        if (!next) throw new Error("the script has no answer for this call");
        if (next instanceof Error) throw next;
        return next;
      },
      wait: async (milliseconds: number) => { waits.push(milliseconds); },
    },
  };
}

const answer = (status: number, body: unknown = { ok: status < 400 }) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const action = { method: "POST", body: JSON.stringify({ action: "choose_direction", artifact: { direction: "reduce" } }) };

test("the requests that are repeated are exactly the ones the server answers the same way twice", () => {
  const repeated: [string, string][] = [
    ["GET", "/api/program/program-ai/home"],
    ["GET", "/api/program/program-ai/missions/2"],
    ["GET", "/api/program/program-ai/reviews/first?locale=sv-SE"],
    ["GET", "/api/programme-access/authority"],
    ["POST", "/api/program/program-ai/missions/2/actions"],
    ["POST", "/api/program/program-ai/missions/10/actions"],
    ["POST", "/api/program/program-ai/missions/2/complete"],
    ["POST", "/api/program/program-ai/missions/10/complete"],
    ["POST", "/api/program/program-ai/missions/9/guidance"],
    ["POST", "/api/program/program-ai/reviews/mid?locale=en-GB"],
    ["POST", "/api/program/program-ai/authority"],
    ["POST", "/api/program/program-ai/starting-point"],
    ["POST", "/api/program/program-ai/support/continue"],
    ["POST", "/api/program/program-ai/claims/redeem"],
    ["POST", "/api/programme-access/authority"],
  ];
  for (const [method, path] of repeated) assert.equal(programmeRequestIsRepeatable(path, method), true, `${method} ${path}`);

  const sentOnce: [string, string][] = [
    // Each call creates a new anonymous session.
    ["POST", "/api/program/program-ai/session"],
    // Each call reserves one of the session's three AI calls.
    ["POST", "/api/program/program-ai/turn"],
    // Refused once a claim exists; the client makes a new claim itself when redeeming fails.
    ["POST", "/api/program/program-ai/claim"],
    // Mission 01 is not an authenticated Mission route, and 11 does not exist.
    ["POST", "/api/program/program-ai/missions/1/actions"],
    ["POST", "/api/program/program-ai/missions/11/complete"],
    ["POST", "/api/program/program-ai/missions/2/actions/extra"],
    // Withdrawing consent and ending the Programme session are deliberate single presses.
    ["DELETE", "/api/program/program-ai/authority"],
    ["DELETE", "/api/program/session"],
    // Nothing outside the Programme is repeated by this helper.
    ["POST", "/api/auth/sign-in/social"],
    ["GET", "/api/customer/email-preference"],
    ["POST", "/api/analytics/events"],
  ];
  for (const [method, path] of sentOnce) assert.equal(programmeRequestIsRepeatable(path, method), false, `${method} ${path}`);
  assert.equal(programmeRequestIsRepeatable("/api/program/program-ai/home"), true, "a request without a method is a read");
});

test("every repeated POST has its route handler, so the list cannot drift from the API", () => {
  for (const route of [
    "app/api/program/program-ai/missions/[missionNumber]/actions/route.ts",
    "app/api/program/program-ai/missions/[missionNumber]/complete/route.ts",
    "app/api/program/program-ai/missions/[missionNumber]/guidance/route.ts",
    "app/api/program/program-ai/reviews/[milestone]/route.ts",
    "app/api/program/program-ai/authority/route.ts",
    "app/api/program/program-ai/starting-point/route.ts",
    "app/api/program/program-ai/support/continue/route.ts",
    "app/api/program/program-ai/claims/redeem/route.ts",
    "app/api/programme-access/authority/route.ts",
  ]) {
    assert.equal(existsSync(new URL(`../${route}`, import.meta.url)), true, route);
    assert.match(source(route), /export async function POST/, route);
  }
});

test("the server rules the repeated Mission requests rely on are still in the service", () => {
  const missions = source("lib/programme/application/programme-ai-missions.service.ts");
  const recordAction = missions.slice(missions.indexOf("async recordAction("), missions.indexOf("async complete("));
  const complete = missions.slice(missions.indexOf("async complete("), missions.indexOf("private async ensureProgrammeCompletion("));
  // One transaction; an action already recorded, or a Mission already complete, is answered with 0 XP.
  assert.match(recordAction, /this\.unitOfWork\.serializable\(/);
  assert.match(recordAction, /if \(existingStates\.includes\(taskState\)\) \{[\s\S]*?xpAwarded: 0/);
  assert.match(complete, /this\.unitOfWork\.serializable\(/);
  assert.match(complete, /if \(progress\.status === "COMPLETED"\) \{[\s\S]*?xpAwarded: 0/);
  // XP, progress events and active days are written under fixed keys and duplicates are skipped.
  const rewards = source("lib/programme/infrastructure/repositories/programme-reward.repository.ts");
  for (const method of ["recordProgressEvent", "recordProgrammeAiMissionXp", "recordActiveDay"]) {
    const body = rewards.slice(rewards.indexOf(`${method}(`));
    assert.match(body.slice(0, body.indexOf("\n  }\n")), /skipDuplicates: true/, method);
  }
  // A claim already consumed by the same account is answered with its plan.
  const missionOne = source("lib/programme/application/programme-ai-mission-one.service.ts");
  assert.match(missionOne, /if \(claim\.consumedAt\) \{[\s\S]*?claimRedeemed: false/);
});

test("a Mission action that is answered 500 once is sent again after the pause and succeeds", async () => {
  const saved = answer(200, { ok: true, xpAwarded: 20 });
  const { calls, waits, runtime } = scriptedFetch([answer(500, { ok: false, code: "INTERNAL_ERROR" }), saved]);
  const response = await fetchProgrammeWithRetry("/api/program/program-ai/missions/2/actions", action, runtime);
  assert.equal(response, saved);
  assert.equal(calls.length, 2);
  assert.deepEqual(waits, [PROGRAMME_RETRY_DELAY_MS]);
  assert.deepEqual(calls[1], calls[0], "the same path, method, headers and body");
  assert.equal(PROGRAMME_RETRY_DELAY_MS, 600);
});

test("a network failure is repeated the same way", async () => {
  const saved = answer(200);
  const { calls, waits, runtime } = scriptedFetch([new TypeError("Failed to fetch"), saved]);
  assert.equal(await fetchProgrammeWithRetry("/api/program/program-ai/missions/2/complete", { method: "POST", body: "{}" }, runtime), saved);
  assert.equal(calls.length, 2);
  assert.deepEqual(waits, [PROGRAMME_RETRY_DELAY_MS]);
});

test("there is one repeat only: a second failure reaches the caller, which shows its error text", async () => {
  const second = answer(503, { ok: false });
  const twice = scriptedFetch([answer(500), second, answer(200)]);
  assert.equal(await fetchProgrammeWithRetry("/api/program/program-ai/missions/2/actions", action, twice.runtime), second);
  assert.equal(twice.calls.length, 2);

  const offline = scriptedFetch([new TypeError("Failed to fetch"), new TypeError("Failed to fetch again"), answer(200)]);
  await assert.rejects(fetchProgrammeWithRetry("/api/program/program-ai/home", undefined, offline.runtime), /Failed to fetch again/);
  assert.equal(offline.calls.length, 2);
});

test("an answer below 500 is final: saved, refused, invalid and rate-limited requests are not repeated", async () => {
  for (const status of [200, 201, 400, 401, 403, 404, 409, 429]) {
    const first = answer(status);
    const { calls, waits, runtime } = scriptedFetch([first, answer(200)]);
    assert.equal(await fetchProgrammeWithRetry("/api/program/program-ai/missions/2/actions", action, runtime), first, String(status));
    assert.equal(calls.length, 1, String(status));
    assert.deepEqual(waits, []);
  }
});

test("a request that is not safe to send twice is sent once, whatever happens to it", async () => {
  for (const path of ["/api/program/program-ai/session", "/api/program/program-ai/turn", "/api/program/program-ai/claim"]) {
    const failed = answer(500);
    const refused = scriptedFetch([failed, answer(200)]);
    assert.equal(await fetchProgrammeWithRetry(path, { method: "POST", body: "{}" }, refused.runtime), failed, path);
    assert.equal(refused.calls.length, 1, path);

    const dropped = scriptedFetch([new TypeError("Failed to fetch"), answer(200)]);
    await assert.rejects(fetchProgrammeWithRetry(path, { method: "POST", body: "{}" }, dropped.runtime), /Failed to fetch/, path);
    assert.equal(dropped.calls.length, 1, path);
  }
});

test("a request that was cancelled, or whose body cannot be sent again, is not repeated", async () => {
  const controller = new AbortController();
  controller.abort();
  const cancelled = scriptedFetch([new DOMException("The operation was aborted.", "AbortError"), answer(200)]);
  await assert.rejects(fetchProgrammeWithRetry("/api/program/program-ai/home", { signal: controller.signal }, cancelled.runtime), /aborted/);
  assert.equal(cancelled.calls.length, 1);

  const form = new FormData();
  form.set("field", "value");
  const failed = answer(500);
  const upload = scriptedFetch([failed, answer(200)]);
  assert.equal(await fetchProgrammeWithRetry("/api/program/program-ai/missions/2/actions", { method: "POST", body: form }, upload.runtime), failed);
  assert.equal(upload.calls.length, 1);
});

test("the Programme screens send their requests through the helper", () => {
  const experience = source("components/programme/ProgramAiExperience.tsx");
  const helper = experience.slice(experience.indexOf("async function programAiRequest<T>("), experience.indexOf("export function ProgramAiExperience("));
  assert.match(helper, /await fetchProgrammeWithRetry\(path, \{/);
  assert.doesNotMatch(helper, /await fetch\(/);

  const mission = source("components/programme/ProgramAiMissionExperience.tsx");
  assert.match(mission, /async function request<T>\(path: string, init\?: RequestInit\) \{\s+const response = await fetchProgrammeWithRetry\(path, \{/);
  assert.doesNotMatch(mission, /await fetch\(/);
  // The screen stays busy over both attempts: the busy state ends only after the request settles.
  for (const handler of ["saveAction", "getGuidance", "complete"]) {
    const body = mission.slice(mission.indexOf(`async function ${handler}(`));
    assert.match(body.slice(0, body.indexOf("\n  }\n")), /setBusy\(true\); setError\(""\);[\s\S]*await request<[\s\S]*finally \{ setBusy\(false\); \}/, handler);
  }

  const review = source("components/programme/ProgramAiReviewScreen.tsx");
  assert.match(review, /const response = await fetchProgrammeWithRetry\(`\/api\/program\/program-ai\/reviews\/\$\{milestone\}/);
  assert.doesNotMatch(review, /await fetch\(/);

  const access = source("lib/programme/access-client.ts");
  assert.match(access, /const accessFetch: AccessFetcher = \(input, init\) => fetchProgrammeWithRetry\(input, init\);/);
  assert.equal(access.split("fetcher: AccessFetcher = accessFetch").length - 1, 3, "all three access requests");
  assert.doesNotMatch(access, /AccessFetcher = fetch\b/);
});

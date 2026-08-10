import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { POST as createProgramAiSession } from "../app/api/program/program-ai/session/route";
import { issueProgrammeAccessProof } from "../lib/auth/programme-access-proof";
import { resolveProgramAiClaimCompatibility } from "../lib/programme/application/programme-ai-mission-one.service";
import {
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_HEADER_VALUES,
  PROGRAMME_ACCESS_TTL_MS,
  PROGRAMME_AUTH_ACCESS_HEADERS,
} from "../lib/programme/access-contract";
import { ProgrammeAiMissionOneRepository } from "../lib/programme/infrastructure/repositories/programme-ai-mission-one.repository";
import {
  anonymousProgramAiXp,
  programAiMissionOneActions,
} from "../lib/programme/program-ai/contracts";
import { ProgrammeAiOrchestrator } from "../lib/programme/program-ai/orchestration";
import { programAiMissionOneRewardPolicy } from "../lib/programme/program-ai/reward-policy";
import { isProgramAiV1Enabled } from "../lib/programme/program-ai/runtime-config";
import {
  parseProgrammeAiPortResult,
  parseProgrammeAiTurn,
  parseStartingPoint,
} from "../lib/programme/program-ai/validation";

const startingPoint = {
  startingPoint: "I open a betting app late at night after a stressful workday.",
  desiredChange: "Pause before opening it.",
  broadContext: "WORK" as const,
  continuationCue: "Continue from the late-night opening cue.",
};

const accessSecret = "program-ai-access-proof-test-secret-at-least-32-bytes";

function resignAccessProof(proof: string, mutate: (claims: Record<string, unknown>) => void) {
  const [, encoded] = proof.split(".");
  const claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(claims);
  const nextEncoded = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const key = createHmac("sha256", accessSecret)
    .update("sevenbet/programme-auth-access/hmac-sha256/v1")
    .digest();
  const signature = createHmac("sha256", key).update(`pa1.${nextEncoded}`).digest("base64url");
  return `pa1.${nextEncoded}.${signature}`;
}

test("Program AI runtime gate is exact, server-controlled and fails closed", () => {
  assert.equal(isProgramAiV1Enabled(undefined), false);
  assert.equal(isProgramAiV1Enabled("false"), false);
  assert.equal(isProgramAiV1Enabled("TRUE"), false);
  assert.equal(isProgramAiV1Enabled(" true "), false);
  assert.equal(isProgramAiV1Enabled("true"), true);
});

test("direct Program AI session creation rejects every unsigned, forged or mismatched access bypass", async () => {
  const previousFlag = process.env.PROGRAM_AI_V1_ENABLED;
  const previousSecret = process.env.BETTER_AUTH_SECRET;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  process.env.BETTER_AUTH_SECRET = accessSecret;
  const now = Date.now();
  const journeyId = "c90bfc5e-2e12-4a8b-9b84-52bf15fce684";
  const otherJourneyId = "2db9293d-fd2a-423e-8424-61552342ed86";
  const authority = issueProgrammeAccessProof({ journeyId, secret: accessSecret, now });
  const [proofPrefix, proofClaims, proofSignature] = authority.proof.split(".");
  const forgedProof = `${proofPrefix}.${proofClaims}.${proofSignature[0] === "A" ? "B" : "A"}${proofSignature.slice(1)}`;
  const expired = resignAccessProof(authority.proof, (claims) => {
    const createdAt = now - PROGRAMME_ACCESS_TTL_MS - 1_000;
    claims.createdAt = createdAt;
    claims.expiresAt = createdAt + PROGRAMME_ACCESS_TTL_MS;
    claims.adultConfirmedAt = createdAt;
    claims.termsAcceptedAt = createdAt;
    claims.privacyAcknowledgedAt = createdAt;
  });
  const attempts: Array<Record<string, string>> = [
    {},
    {
      [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
      [PROGRAMME_ACCESS_HEADERS.terms]: PROGRAMME_ACCESS_HEADER_VALUES.terms,
      [PROGRAMME_ACCESS_HEADERS.privacy]: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: forgedProof,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: authority.proof,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: otherJourneyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignAccessProof(authority.proof, (claims) => { claims.purpose = "PROGRAMME_CONTENT_CLAIM"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignAccessProof(authority.proof, (claims) => { claims.termsVersion = "obsolete"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignAccessProof(authority.proof, (claims) => { claims.privacyVersion = "obsolete"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: expired,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
    {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: "not-a-proof",
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: journeyId,
    },
  ];
  try {
    for (const [index, attempt] of attempts.entries()) {
      const response = await createProgramAiSession(new Request("http://localhost/api/program/program-ai/session", {
        method: "POST",
        headers: { ...attempt, "x-forwarded-for": `198.51.100.${index + 1}` },
      }));
      assert.equal(response.status, 403);
      assert.equal((await response.json()).code, "CURRENT_ACCESS_AUTHORITY_REQUIRED");
    }
  } finally {
    if (previousFlag === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previousFlag;
    if (previousSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = previousSecret;
  }
});

test("active authority confirmation is immutable and claim binding becomes user-only", async () => {
  const firstConfirmedAt = new Date("2026-08-10T10:00:00.000Z");
  const later = new Date("2026-08-10T10:05:00.000Z");
  const anonymous = {
    id: "authority-a",
    anonymousSessionId: "session-a",
    userId: null,
    purposeVersion: "purpose-v1",
    statementVersion: "statement-v1",
    confirmedAt: firstConfirmedAt,
    withdrawnAt: null,
  };
  let upserts = 0;
  let transitionData: Record<string, unknown> | null = null;
  const database = {
    programmeSensitiveInputAuthority: {
      findFirst: async () => anonymous,
      findUnique: async (input: { where: Record<string, unknown> }) => (
        "anonymousSessionId_purposeVersion_statementVersion" in input.where ? anonymous : null
      ),
      upsert: async () => { upserts += 1; return { ...anonymous, confirmedAt: later }; },
      updateMany: async (input: { data: Record<string, unknown> }) => {
        transitionData = input.data;
        return { count: 1 };
      },
    },
  };
  const repository = new ProgrammeAiMissionOneRepository(database as never);
  const confirmed = await repository.confirmAnonymousAuthority({
    anonymousSessionId: "session-a",
    purposeVersion: "purpose-v1",
    statementVersion: "statement-v1",
    confirmedAt: later,
  });
  assert.equal(confirmed.confirmedAt, firstConfirmedAt);
  assert.equal(upserts, 0);

  const bound = await repository.bindAnonymousAuthorityToUser({
    anonymousSessionId: "session-a",
    userId: "user-a",
    purposeVersion: "purpose-v1",
    statementVersion: "statement-v1",
  });
  assert.deepEqual(bound, { count: 1 });
  assert.deepEqual(transitionData, { anonymousSessionId: null, userId: "user-a" });
});

test("Mission 01 reward policy has two versioned logical awards and no registration reward", () => {
  assert.deepEqual(programAiMissionOneActions, [
    "program_ai_situation_submitted",
    "program_ai_starting_point_complete",
  ]);
  assert.equal(programAiMissionOneRewardPolicy.situationSubmitted.xp, 20);
  assert.equal(programAiMissionOneRewardPolicy.startingPointComplete.xp, 20);
  assert.equal(programAiMissionOneRewardPolicy.clarification.xp, 0);
  assert.equal(programAiMissionOneRewardPolicy.registration.xp, 0);
  assert.match(programAiMissionOneRewardPolicy.situationSubmitted.awardKey, /program-ai-01:v1$/);
  assert.match(programAiMissionOneRewardPolicy.startingPointComplete.awardKey, /program-ai-01:v1$/);
  assert.notEqual(
    programAiMissionOneRewardPolicy.situationSubmitted.awardKey,
    programAiMissionOneRewardPolicy.startingPointComplete.awardKey,
  );
  assert.equal(anonymousProgramAiXp([]), 0);
  assert.equal(anonymousProgramAiXp([programAiMissionOneActions[0]]), 20);
  assert.equal(anonymousProgramAiXp([...programAiMissionOneActions]), 40);
});

test("turn validation admits only bounded text and at most two clarifications", () => {
  const parsed = parseProgrammeAiTurn({
    inputMode: "text",
    situation: startingPoint.startingPoint,
    clarificationAnswers: ["I want a pause.", "Mostly after work."],
  });
  assert.equal(parsed.clarificationAnswers.length, 2);
  assert.throws(() => parseProgrammeAiTurn({
    inputMode: "text",
    situation: startingPoint.startingPoint,
    clarificationAnswers: ["one", "two", "three"],
  }), /maximum|items|clarificationAnswers/i);
  assert.throws(() => parseProgrammeAiTurn({
    inputMode: "text",
    situation: startingPoint.startingPoint,
    clarificationAnswers: [],
    marketingConsent: true,
  }), /unsupported/i);
});

test("provider output is a strict union and cannot smuggle authority, raw payload or unsupported generation", () => {
  assert.deepEqual(parseProgrammeAiPortResult({
    kind: "STARTING_POINT_CANDIDATE",
    candidate: startingPoint,
    generation: "PROVIDER",
    disposition: "CONTINUE",
  }), {
    kind: "STARTING_POINT_CANDIDATE",
    candidate: { ...startingPoint, chosenBoundaryAction: undefined },
    generation: "PROVIDER",
    disposition: "CONTINUE",
  });
  for (const extra of [
    { authority: true },
    { providerPayload: { prompt: "raw" } },
    { riskLabel: "high" },
  ]) {
    assert.throws(() => parseProgrammeAiPortResult({
      kind: "STARTING_POINT_CANDIDATE",
      candidate: startingPoint,
      generation: "PROVIDER",
      disposition: "CONTINUE",
      ...extra,
    }), /unsupported/i);
  }
  assert.throws(() => parseProgrammeAiPortResult({
    kind: "STARTING_POINT_CANDIDATE",
    candidate: startingPoint,
    generation: "USER_CONTROLLED_FALLBACK",
    disposition: "CONTINUE",
  }), /generation/i);
});

test("no-adapter orchestration is truthful, deterministic and leaves user-controlled fields incomplete", async () => {
  const orchestrator = new ProgrammeAiOrchestrator(null);
  const result = await orchestrator.createTurn({
    inputMode: "text",
    situation: `  ${startingPoint.startingPoint}  `,
    clarificationAnswers: [],
  });
  assert.equal(result.kind, "STARTING_POINT_CANDIDATE");
  if (result.kind !== "STARTING_POINT_CANDIDATE") return;
  assert.equal(result.generation, "USER_CONTROLLED_FALLBACK");
  assert.equal(result.disposition, "CONTINUE");
  assert.equal(result.candidate.startingPoint, startingPoint.startingPoint);
  assert.equal(result.candidate.desiredChange, "");
  assert.equal(result.candidate.continuationCue, "");
  assert.equal(result.candidate.broadContext, "NOT_SPECIFIED");
});

test("support-first is a transient port disposition, not a classifier or persisted label", async () => {
  const orchestrator = new ProgrammeAiOrchestrator({
    async createTurn() {
      return {
        kind: "CLARIFICATION_REQUIRED",
        prompt: "Would you prefer to pause here and open support?",
        reason: "CONTEXT_UNCLEAR",
        disposition: "SUPPORT_FIRST",
      };
    },
  });
  const result = await orchestrator.createTurn({
    inputMode: "text",
    situation: startingPoint.startingPoint,
    clarificationAnswers: [],
  });
  assert.equal(result.disposition, "SUPPORT_FIRST");
  assert.equal("riskLabel" in result, false);
});

test("confirmed Starting Points require all closed structural fields", () => {
  assert.equal(parseStartingPoint(startingPoint).broadContext, "WORK");
  assert.throws(() => parseStartingPoint({ ...startingPoint, broadContext: "CASINO_X" }), /broadContext/i);
  assert.throws(() => parseStartingPoint({ ...startingPoint, diagnosis: "addiction" }), /unsupported/i);
  assert.throws(() => parseStartingPoint({ ...startingPoint, desiredChange: "" }), /required|characters/i);
});

test("legacy completion, higher progress and existing Starting Point always dominate collisions", () => {
  assert.equal(resolveProgramAiClaimCompatibility({ missionOneStatus: null, hasHigherMissionProgress: false, hasStartingPoint: false }), "PERSIST_NEW_PROGRAM_AI_RESULT");
  assert.equal(resolveProgramAiClaimCompatibility({ missionOneStatus: "IN_PROGRESS", hasHigherMissionProgress: false, hasStartingPoint: false }), "PERSIST_NEW_PROGRAM_AI_RESULT");
  assert.equal(resolveProgramAiClaimCompatibility({ missionOneStatus: "COMPLETED", hasHigherMissionProgress: false, hasStartingPoint: false }), "AUTHENTICATED_PROGRESS_DOMINATES");
  assert.equal(resolveProgramAiClaimCompatibility({ missionOneStatus: "IN_PROGRESS", hasHigherMissionProgress: true, hasStartingPoint: false }), "AUTHENTICATED_PROGRESS_DOMINATES");
  assert.equal(resolveProgramAiClaimCompatibility({ missionOneStatus: null, hasHigherMissionProgress: false, hasStartingPoint: true }), "AUTHENTICATED_PROGRESS_DOMINATES");
});

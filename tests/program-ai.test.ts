import assert from "node:assert/strict";
import test from "node:test";

import { resolveProgramAiClaimCompatibility } from "../lib/programme/application/programme-ai-mission-one.service";
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

test("Program AI runtime gate is exact, server-controlled and fails closed", () => {
  assert.equal(isProgramAiV1Enabled(undefined), false);
  assert.equal(isProgramAiV1Enabled("false"), false);
  assert.equal(isProgramAiV1Enabled("TRUE"), false);
  assert.equal(isProgramAiV1Enabled(" true "), false);
  assert.equal(isProgramAiV1Enabled("true"), true);
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

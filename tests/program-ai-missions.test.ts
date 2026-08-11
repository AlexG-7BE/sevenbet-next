import assert from "node:assert/strict";
import test from "node:test";

import { ProgrammeAiGuidanceService } from "../lib/programme/application/programme-ai-guidance.service";
import { ProgrammeAiMissionsService } from "../lib/programme/application/programme-ai-missions.service";
import { MissionLockedError } from "../lib/programme/domain/programme-errors";
import {
  actionAwardKey,
  actionTaskState,
  commercialDiscoveryLinks,
  completionAwardKey,
  programAiMissionRegistry,
} from "../lib/programme/program-ai/mission-registry";
import { parseProgramAiMissionAction } from "../lib/programme/program-ai/mission-validation";
import { deterministicGuidance, parseGeneratedResult } from "../lib/programme/program-ai/mission-guidance";
import { presentMissionArtifact } from "../lib/programme/program-ai/mission-presentation";
import { ProgrammeProviderError } from "../lib/programme/program-ai/provider-errors";

const actionInputs: Record<string, Record<string, unknown>> = {
  choose_direction: { direction: "pause" },
  build_7_day_goal: { goalStyle: "pause_first", reviewWindowDays: 7 },
  reality_check: { realityCheck: "restart_next_day" },
  map_urge_sequence: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] },
  name_early_signal: { earlySignalCategory: "thought" },
  choose_pause_move: { pauseMove: "wait_ten_minutes" },
  choose_boundary: { boundaryCategory: "pause", triggerType: "saved_early_signal" },
  build_boundary_rule: { executionMethod: "bank_block" },
  choose_execution: { pressureCheck: "needs_setup" },
  run_decision_check: { scenarioChoice: "unexpected_offer" },
  build_three_checks: { decisionChecks: ["purpose", "terms", "exit"] },
  commit_pause_rule: { pauseRuleType: "pause_when_terms_are_unclear" },
  choose_friction_layer: { frictionMethods: ["bank_block"] },
  build_friction_stack: { frictionMethods: ["bank_block", "remove_saved_payment"] },
  rehearse_bypass: { fallbackMethod: "leave", bypassReason: "easy_to_disable" },
  choose_support_route: { supportModes: ["protected_help"] },
  build_support_card: { supportCardStyle: "when_then" },
  choose_exit_action: { exitActionType: "open_help" },
  learn_comparison_signals: { comparisonSignals: ["licensing_status", "material_terms"] },
  decode_offer_terms: { offerTermSignal: "wagering_requirement" },
  build_research_checklist: { researchCriteria: ["licensing_status", "terms", "withdrawals"] },
  choose_scenario: { scenarioType: "unclear_terms" },
  rehearse_response: { responseStrategy: "pause_and_check" },
  build_fallback_response: { fallbackStrategy: "leave_and_return" },
  review_my_plan: { timelineReviewed: true },
  assemble_final_plan: { planPriorityIds: ["pause_move", "boundary", "fallback"] },
  choose_review_cadence: { reviewCadenceDays: 14 },
};

type Progress = {
  id: string;
  enrollmentId: string;
  missionNumber: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "READY_TO_SAVE" | "COMPLETED";
  taskStates: string[];
  draft: Record<string, unknown> | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function fakeUnitOfWork({ legacy = false, m1Incomplete = false }: { legacy?: boolean; m1Incomplete?: boolean } = {}) {
  const programId = "00000000-0000-4000-8000-000000000010";
  const enrollment = {
    id: "00000000-0000-4000-8000-000000000020",
    userId: "user-a",
    programId,
    programVersionId: "00000000-0000-4000-8000-000000000030",
    currentStepId: "00000000-0000-4000-8000-000000000101",
    timezone: "UTC",
  };
  const steps = Array.from({ length: 10 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
    order: index + 1,
  }));
  const now = new Date("2026-08-11T10:00:00.000Z");
  const progress = new Map<number, Progress>();
  const completedThrough = legacy ? 4 : m1Incomplete ? 0 : 1;
  for (let missionNumber = 1; missionNumber <= completedThrough; missionNumber += 1) {
    progress.set(missionNumber, {
      id: `00000000-0000-4000-8000-${String(missionNumber).padStart(12, "0")}`,
      enrollmentId: enrollment.id,
      missionNumber,
      status: "COMPLETED",
      taskStates: legacy ? [`legacy-mission-${missionNumber}`] : ["program_ai_situation_submitted", "program_ai_starting_point_complete"],
      draft: null,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (m1Incomplete) {
    progress.set(1, { id: "00000000-0000-4000-8000-000000000001", enrollmentId: enrollment.id, missionNumber: 1, status: "IN_PROGRESS", taskStates: ["program_ai_situation_submitted"], draft: null, completedAt: null, createdAt: now, updatedAt: now });
  } else if (!legacy) {
    progress.set(2, { id: "00000000-0000-4000-8000-000000000002", enrollmentId: enrollment.id, missionNumber: 2, status: "IN_PROGRESS", taskStates: [], draft: null, completedAt: null, createdAt: now, updatedAt: now });
  }
  const xpEvents = new Map<string, number>(legacy
    ? [["legacy:m1", 60], ["legacy:m2", 80], ["legacy:m3", 90], ["legacy:m4", 100]]
    : m1Incomplete ? [["programme-ai-m1-situation", 20]] : [["programme-ai-m1", 40]]);
  const progressEvents = new Set<string>();
  let queue = Promise.resolve();
  const source = { program: { id: programId, steps }, version: { id: enrollment.programVersionId, status: "PUBLISHED" } };
  const unit = {
    serializable<T>(operation: (value: unknown) => Promise<T>) {
      const result = queue.then(() => operation(unit));
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
    snapshot<T>(operation: (value: unknown) => Promise<T>) { return operation(unit); },
    progress: {
      findControlProgram: async () => source,
      findEnrollment: async (userId: string) => userId === enrollment.userId ? enrollment : null,
      findMissionProgress: async (_enrollmentId: string, missionNumber: number) => progress.get(missionNumber) ?? null,
      upsertMissionProgress: async (input: Omit<Progress, "id" | "createdAt" | "updatedAt">) => {
        const existing = progress.get(input.missionNumber);
        const saved: Progress = {
          id: existing?.id ?? `00000000-0000-4000-8000-${String(input.missionNumber).padStart(12, "0")}`,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          ...input,
          draft: input.draft === undefined ? existing?.draft ?? null : input.draft,
        };
        progress.set(input.missionNumber, saved);
        return saved;
      },
      setEnrollmentCurrentStep: async (_id: string, currentStepId: string) => { enrollment.currentStepId = currentStepId; return enrollment; },
    },
    rewards: {
      recordProgrammeAiMissionXp: async (input: { awardKey: string; xp: number }) => {
        if (xpEvents.has(input.awardKey)) return { count: 0 };
        xpEvents.set(input.awardKey, input.xp);
        return { count: 1 };
      },
      recordProgressEvent: async (input: { eventKey: string }) => {
        const fresh = !progressEvents.has(input.eventKey);
        progressEvents.add(input.eventKey);
        return { count: fresh ? 1 : 0 };
      },
      recordActiveDay: async () => ({ count: 1 }),
    },
    programAiMissionOne: {
      home: async (userId: string) => ({
        enrollment: userId === enrollment.userId ? {
          ...enrollment,
          missionProgress: [...progress.values()].sort((a, b) => a.missionNumber - b.missionNumber),
          programmeStartingPoint: {
            startingPoint: "I return quickly after a difficult day.",
            desiredChange: "Pause before deciding.",
            broadContext: "HOME",
            continuationCue: "The quick-return cue.",
            chosenBoundaryAction: null,
          },
        } : null,
        totalXp: [...xpEvents.values()].reduce((sum, value) => sum + value, 0),
      }),
    },
  };
  return { unit, progress, xpEvents };
}

test("Missions 02–10 expose exact immutable action and reward contracts", () => {
  assert.equal(programAiMissionRegistry.length, 9);
  assert.deepEqual(programAiMissionRegistry.map((mission) => mission.missionNumber), [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const keys = new Set<string>();
  for (const mission of programAiMissionRegistry) {
    assert.deepEqual(mission.actions.map((action) => action.xp), [15, 20, 15]);
    for (const action of mission.actions) {
      assert.match(actionTaskState(mission.missionNumber, action.id), /^programme-ai-v1:m\d{2}:/);
      keys.add(actionAwardKey(mission.missionNumber, action.id));
    }
    keys.add(completionAwardKey(mission.missionNumber));
  }
  assert.equal(keys.size, 36);
  assert.equal(40 + programAiMissionRegistry.length * 75, 715);
});

test("every Mission action validates its exact closed artifact and rejects unknown client fields", () => {
  for (const mission of programAiMissionRegistry) {
    for (const action of mission.actions) {
      const parsed = parseProgramAiMissionAction(mission.missionNumber, { action: action.id, artifact: actionInputs[action.id] });
      assert.equal(parsed.action.id, action.id);
      assert.throws(() => parseProgramAiMissionAction(mission.missionNumber, { action: action.id, artifact: { ...actionInputs[action.id], privateNarrative: "do not persist" } }), /unsupported/i);
    }
    assert.throws(() => parseProgramAiMissionAction(mission.missionNumber, { action: "client_awards_xp", artifact: {} }), /not supported/i);
  }
  assert.throws(() => parseProgramAiMissionAction(3, { action: "map_urge_sequence", artifact: { sequenceOrder: ["choice_point", "cue", "early_signal", "urge_builds"] } }), /approved sequence/i);
});

test("clean sequential and concurrent duplicate progression reaches exactly 715 XP", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const fake = fakeUnitOfWork();
    const service = new ProgrammeAiMissionsService(fake.unit as never);
    for (const mission of programAiMissionRegistry) {
      for (const action of mission.actions) {
        const duplicate = await Promise.all([
          service.recordAction("user-a", mission.missionNumber, { action: action.id, artifact: actionInputs[action.id] }),
          service.recordAction("user-a", mission.missionNumber, { action: action.id, artifact: actionInputs[action.id] }),
        ]);
        assert.deepEqual(duplicate.map((result) => result.xpAwarded).sort((a, b) => a - b), [0, action.xp]);
      }
      const duplicateCompletion = await Promise.all([
        service.complete("user-a", mission.missionNumber),
        service.complete("user-a", mission.missionNumber),
      ]);
      assert.deepEqual(duplicateCompletion.map((result) => result.xpAwarded).sort((a, b) => a - b), [0, 25]);
    }
    const home = await service.home("user-a");
    assert.equal(home.totalXp, 715);
    assert.equal(home.missions[0].xpEarnedHere, 40);
    assert.deepEqual(home.reviews.map((review) => review.status), ["available", "available", "available"]);
    assert.equal(home.nextReview, null);
    assert.equal(fake.xpEvents.size, 37);
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("Mission 10 receives completed Programme facts and omits missing artifacts", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const fake = fakeUnitOfWork();
    const service = new ProgrammeAiMissionsService(fake.unit as never);
    for (const mission of programAiMissionRegistry.filter((item) => item.missionNumber <= 9)) {
      for (const action of mission.actions) {
        await service.recordAction("user-a", mission.missionNumber, { action: action.id, artifact: actionInputs[action.id] });
      }
      await service.complete("user-a", mission.missionNumber);
    }

    const mission = await service.mission("user-a", 10);
    assert.ok("programmeFacts" in mission);
    assert.equal(mission.programmeFacts?.startingPoint?.startingPoint, "I return quickly after a difficult day.");
    assert.deepEqual(mission.programmeFacts?.facts.map((fact) => fact.missionNumber), [2, 3, 4, 5, 6, 7, 8, 9]);
    const rendered = mission.programmeFacts?.facts.flatMap((fact) => presentMissionArtifact(fact.artifact)) ?? [];
    const text = rendered.flatMap((row) => [row.label, row.value]).join(" ");
    assert.match(text, /Pause before one decision/);
    assert.match(text, /Bank block/);
    assert.match(text, /Pause and run the checks/);
    assert.doesNotMatch(text, /pause_first|bank_block|pause_and_check/);

    fake.progress.get(7)!.draft = null;
    const withMissingSupport = await service.mission("user-a", 10);
    assert.ok("programmeFacts" in withMissingSupport);
    assert.equal(withMissingSupport.programmeFacts?.facts.some((fact) => fact.missionNumber === 7), false);
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("M10 final-plan context contains only confirmed history and persisted priorities", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const fake = fakeUnitOfWork();
    const missions = new ProgrammeAiMissionsService(fake.unit as never);
    for (const mission of programAiMissionRegistry.filter((item) => item.missionNumber <= 9)) {
      for (const action of mission.actions) {
        await missions.recordAction("user-a", mission.missionNumber, { action: action.id, artifact: actionInputs[action.id] });
      }
      await missions.complete("user-a", mission.missionNumber);
    }
    await missions.recordAction("user-a", 10, { action: "review_my_plan", artifact: actionInputs.review_my_plan });

    const capture: { value?: unknown } = {};
    const guidance = new ProgrammeAiGuidanceService(missions, {
      generate: async (operation, context) => {
        capture.value = context;
        return deterministicGuidance(operation as "M10_FINAL_PLAN", context);
      },
    });
    await assert.rejects(
      () => guidance.missionGuidance("user-a", 10, {}),
      /priorities before building/i,
    );
    assert.equal(Object.prototype.hasOwnProperty.call(capture, "value"), false);
    await missions.recordAction("user-a", 10, { action: "assemble_final_plan", artifact: actionInputs.assemble_final_plan });
    const result = await guidance.missionGuidance("user-a", 10, { localWording: "Unrestricted old narrative must not be forwarded." });
    assert.equal(result.operation, "M10_FINAL_PLAN");
    const context = capture.value as Record<string, unknown>;
    assert.deepEqual(Object.keys(context).sort(), ["facts", "operation", "planPriorityIds", "startingPoint"]);
    assert.deepEqual(context.planPriorityIds, ["pause_move", "boundary", "fallback"]);
    assert.deepEqual((context.facts as Array<{ missionNumber: number }>).map((fact) => fact.missionNumber), [2, 3, 4, 5, 6, 7, 8, 9]);
    const serialized = JSON.stringify(context);
    assert.doesNotMatch(serialized, /transcript|rawNarrative|unrestricted old narrative|commercial|affiliate|href|ranking/i);
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("prerequisites and enrollment ownership deny bypass while legacy completion remains dominant", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const fresh = fakeUnitOfWork();
    const service = new ProgrammeAiMissionsService(fresh.unit as never);
    await assert.rejects(() => service.recordAction("user-a", 3, { action: "map_urge_sequence", artifact: actionInputs.map_urge_sequence }), MissionLockedError);
    await assert.rejects(() => service.mission("foreign-user", 2), /enrollment/i);

    const legacy = fakeUnitOfWork({ legacy: true });
    const legacyService = new ProgrammeAiMissionsService(legacy.unit as never);
    const before = legacy.xpEvents.size;
    const result = await legacyService.recordAction("user-a", 4, { action: "choose_boundary", artifact: actionInputs.choose_boundary });
    assert.equal(result.xpAwarded, 0);
    assert.equal(legacy.xpEvents.size, before);
    const home = await legacyService.home("user-a");
    assert.equal(home.totalXp, 330);
    assert.equal(home.missions[0].xpEarnedHere, 60);
    assert.equal(home.currentMission, 5);
    assert.deepEqual(home.missions.slice(1, 4).map((mission) => mission.xpEarnedHere), [0, 0, 0]);
    assert.equal(home.reviews[0].status, "available");
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("an authenticated incomplete Mission 01 remains current without fabricated completion or XP", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const fake = fakeUnitOfWork({ m1Incomplete: true });
    const service = new ProgrammeAiMissionsService(fake.unit as never);
    const home = await service.home("user-a");
    assert.equal(home.currentMission, 1);
    assert.equal(home.missions[0].status, "current");
    assert.equal(home.missions[1].status, "locked");
    assert.equal(home.totalXp, 20);
    assert.equal(home.missions[0].xpEarnedHere, 0);
    assert.equal(fake.xpEvents.size, 1);
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("Reviews fall back safely, stay completion-derived and never call a reward port", async () => {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  try {
    const missions = {
      mission: async () => ({ title: "Set a 7-day goal", artifact: {}, actionsCompleted: 1 }),
      home: async () => ({ startingPoint: null }),
      reviewContext: async () => ({ startingPoint: null, facts: [{ title: "Set a 7-day goal", artifact: { direction: "pause" } }] }),
    };
    const unavailable = { generate: async () => { throw new ProgrammeProviderError("PROVIDER_UNAVAILABLE"); } };
    const guidance = new ProgrammeAiGuidanceService(missions as never, unavailable);
    const review = await guidance.review("user-a", "first", {}, true);
    assert.equal(review.kind, "review");
    assert.equal(review.generation, "deterministic_fallback");
    assert.equal(review.sections.length, 3);
  } finally {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  }
});

test("provider output is locally strict and commercial navigation is immutable", () => {
  assert.deepEqual(commercialDiscoveryLinks.map((link) => link.href), ["/casinos", "/compare", "/bonuses", "/best-offers"]);
  const valid = parseGeneratedResult("M9_REHEARSAL", { kind: "guidance", operation: "M9_REHEARSAL", title: "Rehearse once", summary: "Choose the response that makes a clear decision point.", options: [{ id: "pause_and_check", text: "Pause and run the checks." }] });
  assert.equal(valid.generation, "provider");
  assert.throws(() => parseGeneratedResult("M9_REHEARSAL", { kind: "guidance", operation: "M9_REHEARSAL", title: "Play safely", summary: "We recommend a casino bonus for you.", options: [{ id: "cashout", text: "Continue" }] }), /Personalisation|valid/i);
});

test("consumer artifact presentation maps every representative field and never exposes internal names", () => {
  const rows = presentMissionArtifact({
    goalStyle: "pause_first",
    reviewWindowDays: 7,
    earlySignalCategory: "action_tendency",
    executionMethod: "bank_block",
    supportCardStyle: "when_then",
    responseStrategy: "leave_and_return",
  });
  const renderedText = rows.flatMap((row) => [row.label, row.value]).join(" ");
  assert.match(renderedText, /Your 7-day approach/);
  assert.match(renderedText, /Pause before one decision/);
  assert.match(renderedText, /In the urge to act/);
  assert.match(renderedText, /Bank block/);
  assert.match(renderedText, /Leave and return later/);
  for (const internal of ["pause_first", "action_tendency", "bank_block", "goalStyle", "supportCardStyle", "reviewWindowDays"]) {
    assert.doesNotMatch(renderedText, new RegExp(internal));
  }
});

test("provider-off M9 rehearsal keeps contextual closed option IDs for responseStrategy", () => {
  const rehearsal = deterministicGuidance("M9_REHEARSAL", {
    mission: { artifact: { scenarioType: "unclear_terms" } },
  });
  assert.match(rehearsal.title, /terms/i);
  assert.deepEqual(rehearsal.options.map((option) => option.id), [
    "pause_and_check",
    "leave_and_return",
    "use_boundary",
    "ask_for_support",
  ]);
  for (const option of rehearsal.options) {
    const parsed = parseProgramAiMissionAction(9, { action: "rehearse_response", artifact: { responseStrategy: option.id } });
    assert.equal(parsed.artifact.responseStrategy, option.id);
  }
});

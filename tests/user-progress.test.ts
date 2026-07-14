import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Prisma } from "@prisma/client";

import { AuthenticationRequiredError } from "../lib/auth/errors";
import type { ProgramStep } from "../lib/program";
import {
  applyServerProgress,
  normalizeLocalProgramState,
  preserveDeviceProgress,
  resolveProgressAfterSave,
  shouldOfferProgressMerge,
} from "../lib/progress/client-state";
import {
  handleCompleteProgress,
  handleCurrentStepProgress,
  handleExerciseProgress,
  handleGetProgress,
  handleLessonProgress,
  handleMergeProgress,
  handleQuizProgress,
  handleScenarioProgress,
  handleStartProgress,
  handleStepProgress,
} from "../lib/progress/http";
import {
  parseMergeProgressBody,
  parseStartProgramBody,
} from "../lib/progress/input";
import {
  assertNoProgressUserOrphans,
  buildProgressOrphanReport,
  ProgressUserOrphanError,
} from "../lib/progress/orphan-check";
import type { UserProgressResponse } from "../lib/progress/types";
import type {
  PublishedProgramProgressSource,
  RecordUserProgressEventInput,
  StoredProgressEvent,
  UserProgressEnrollment,
  UserProgressStore,
} from "../lib/repositories/user-progress.repository";
import type {
  CreateXpAwardInput,
  EligibleXpRule,
  StoredXpEvent,
  XpStore,
} from "../lib/repositories/xp.repository";
import type { AchievementStore } from "../lib/repositories/achievement.repository";
import type { RewardTransactionRunner } from "../lib/repositories/reward-transaction.repository";
import { AchievementService } from "../lib/services/achievement.service";
import { ValidationError } from "../lib/services/service-error";
import { UserProgressService } from "../lib/services/user-progress.service";
import { XpService } from "../lib/services/xp.service";

const ids = {
  program: "10000000-0000-4000-8000-000000000001",
  version: "10000000-0000-4000-8000-000000000002",
  stepOne: "10000000-0000-4000-8000-000000000003",
  lessonOne: "10000000-0000-4000-8000-000000000004",
  quiz: "10000000-0000-4000-8000-000000000005",
  enrollment: "10000000-0000-4000-8000-000000000006",
  event: "10000000-0000-4000-8000-000000000007",
  scenario: "10000000-0000-4000-8000-000000000008",
  exercise: "10000000-0000-4000-8000-000000000009",
  stepTwo: "10000000-0000-4000-8000-000000000010",
  lessonTwo: "10000000-0000-4000-8000-000000000011",
  lessonXpRule: "10000000-0000-4000-8000-000000000012",
  unknown: "20000000-0000-4000-8000-000000000001",
};

const publishedSnapshot = {
  program: { id: ids.program },
  steps: [
    {
      id: ids.stepOne,
      order: 1,
      lessons: [
        {
          id: ids.lessonOne,
          required: true,
          blocks: [
            {
              id: ids.quiz,
              type: "QUIZ",
              required: false,
              archived: false,
              data: {
                questions: [
                  {
                    options: [
                      { label: "One", correct: false },
                      { label: "Two", correct: true },
                    ],
                  },
                ],
              },
            },
            {
              id: ids.scenario,
              type: "SCENARIO",
              required: false,
              archived: false,
              data: { choices: [{ label: "One" }, { label: "Two" }] },
            },
            {
              id: ids.exercise,
              type: "REFLECTION",
              required: false,
              archived: false,
              data: {},
            },
          ],
        },
      ],
    },
    {
      id: ids.stepTwo,
      order: 2,
      lessons: [
        {
          id: ids.lessonTwo,
          required: true,
          blocks: [],
        },
      ],
    },
  ],
  achievements: [],
  xpRules: [
    {
      id: ids.lessonXpRule,
      entity: "xp-rule",
      slug: "lesson-completion",
      title: "Lesson completion",
      eventType: "LESSON_COMPLETION",
      xp: 10,
      active: true,
      awardKey: "program-v1:lesson-completion",
      status: "PUBLISHED",
    },
  ],
} as unknown as Prisma.JsonValue;

const clientSteps = [
  {
    stableId: ids.stepOne,
    lessonId: ids.lessonOne,
    quizBlockId: ids.quiz,
    scenarioBlockId: ids.scenario,
    exerciseBlockId: ids.exercise,
    day: 1,
  },
  {
    stableId: ids.stepTwo,
    lessonId: ids.lessonTwo,
    day: 2,
  },
] as ProgramStep[];

class FakeProgressStore implements UserProgressStore {
  enrollment: UserProgressEnrollment | null = null;
  eventSequence = 0;

  readonly source: PublishedProgramProgressSource = {
    programId: ids.program,
    programVersionId: ids.version,
    version: 1,
    snapshot: publishedSnapshot,
  };

  async findPublishedProgram(programId: string) {
    return programId === ids.program ? this.source : null;
  }

  async findEnrollment(userId: string, programId: string) {
    return this.enrollment?.userId === userId &&
      this.enrollment.programId === programId
      ? this.enrollment
      : null;
  }

  async getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }) {
    this.enrollment ??= {
      id: ids.enrollment,
      userId: input.userId,
      programId: input.programId,
      programVersionId: input.programVersionId,
      startedAt: new Date("2026-07-14T00:00:00.000Z"),
      completedAt: null,
      currentStepId: input.currentStepId ?? null,
      programVersion: {
        id: ids.version,
        programId: ids.program,
        version: 1,
        status: "PUBLISHED",
        snapshot: publishedSnapshot,
      },
      progressEvents: [],
    };
    return this.enrollment;
  }

  async setCurrentStep(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
    currentStepId: string;
  }) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    enrollment.currentStepId = input.currentStepId;
    return enrollment;
  }

  async recordEvent(input: RecordUserProgressEventInput) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    const existing = enrollment.progressEvents.find(
      (event) => event.eventKey === input.eventKey,
    );
    if (existing) return { event: existing, created: false };

    this.eventSequence += 1;
    const event: StoredProgressEvent = {
      id: `${ids.event.slice(0, -2)}${String(this.eventSequence).padStart(2, "0")}`,
      enrollmentId: enrollment.id,
      entityId: input.entityId,
      entityType: input.entityType,
      eventType: input.eventType,
      eventKey: input.eventKey,
      metadata: (input.metadata as Prisma.JsonValue | undefined) ?? null,
      createdAt: new Date(`2026-07-14T00:01:${String(this.eventSequence).padStart(2, "0")}.000Z`),
    };
    enrollment.progressEvents.push(event);
    return { event, created: true };
  }

  async completeEnrollment(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
  }) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    enrollment.completedAt ??= new Date("2026-07-14T00:02:00.000Z");
    return enrollment;
  }

}

class EmptyXpStore implements XpStore {
  async findEligibleRules() { return []; }
  async createAward(): Promise<never> { throw new Error("No XP rule expected"); }
  async totalXp() { return 0; }
}

class LessonXpStore implements XpStore {
  readonly awards = new Map<string, StoredXpEvent>();
  readonly rule: EligibleXpRule = {
    id: ids.lessonXpRule,
    eventType: "LESSON_COMPLETION",
    targetId: null,
    xp: 10,
    awardKey: "program-v1:lesson-completion",
  };

  async findEligibleRules(eventType: EligibleXpRule["eventType"]) {
    return eventType === this.rule.eventType ? [this.rule] : [];
  }

  async createAward(input: CreateXpAwardInput) {
    const key = `${input.userId}:${input.awardKey}`;
    const existing = this.awards.get(key);
    if (existing) return { event: existing, created: false };
    const event: StoredXpEvent = {
      id: `50000000-0000-4000-8000-${String(this.awards.size + 1).padStart(12, "0")}`,
      userId: input.userId,
      ruleId: input.ruleId ?? null,
      achievementId: input.achievementId ?? null,
      eventType: input.eventType,
      xp: input.xp,
      createdAt: new Date("2026-07-14T00:00:00.000Z"),
    };
    this.awards.set(key, event);
    return { event, created: true };
  }

  async totalXp(userId: string) {
    return Array.from(this.awards.entries())
      .filter(([key]) => key.startsWith(`${userId}:`))
      .reduce((total, [, event]) => total + event.xp, 0);
  }
}

class EmptyAchievementStore implements AchievementStore {
  async findEligible() { return []; }
  async createUnlock(): Promise<never> { throw new Error("No achievement expected"); }
  async listUnlocked() { return []; }
  async progressCounts() {
    return { lessons: 0, steps: 0, quizzes: 0, passedQuizzes: 0, programs: 0 };
  }
}

function createService(store = new FakeProgressStore()) {
  const xpStore = new EmptyXpStore();
  const achievementStore = new EmptyAchievementStore();
  const xp = new XpService(xpStore);
  const achievements = new AchievementService(achievementStore, xp);
  const transactions: RewardTransactionRunner = {
    run: (operation) => operation({ progress: store, xp: xpStore, achievements: achievementStore }),
  };
  return new UserProgressService(store, transactions, xp, achievements);
}

function createRewardedService(store: FakeProgressStore, xpStore: XpStore) {
  const achievementStore = new EmptyAchievementStore();
  const xp = new XpService(xpStore);
  const achievements = new AchievementService(achievementStore, xp);
  const transactions: RewardTransactionRunner = {
    run: (operation) =>
      operation({ progress: store, xp: xpStore, achievements: achievementStore }),
  };
  return new UserProgressService(store, transactions, xp, achievements);
}

function mergeBody(extra: Record<string, unknown> = {}) {
  return {
    programId: ids.program,
    currentStepId: ids.stepTwo,
    completedStepIds: [ids.stepOne],
    completedLessonIds: [ids.lessonOne],
    completedQuizIds: [ids.quiz],
    completedScenarioIds: [ids.scenario],
    completedExerciseIds: [ids.exercise],
    programCompleted: false,
    ...extra,
  };
}

test("all anonymous progress APIs return 401 before parsing input", async () => {
  const service = createService();
  const dependencies = {
    requireUser: async () => {
      throw new AuthenticationRequiredError();
    },
    service,
  };
  const actions = [
    [handleGetProgress, "GET", undefined],
    [handleStartProgress, "POST", { programId: ids.program }],
    [handleCurrentStepProgress, "POST", { programId: ids.program, stepId: ids.stepOne }],
    [handleLessonProgress, "POST", { programId: ids.program, lessonId: ids.lessonOne }],
    [handleQuizProgress, "POST", { programId: ids.program, blockId: ids.quiz, answerIndex: 0 }],
    [handleScenarioProgress, "POST", { programId: ids.program, blockId: ids.scenario, answerIndex: 0 }],
    [handleExerciseProgress, "POST", { programId: ids.program, blockId: ids.exercise, response: "Reflection" }],
    [handleStepProgress, "POST", { programId: ids.program, stepId: ids.stepOne }],
    [handleCompleteProgress, "POST", { programId: ids.program }],
    [handleMergeProgress, "POST", mergeBody()],
  ] as const;

  for (const [handler, method, body] of actions) {
    const response = await handler(
      new Request(
        `http://localhost/api/program/progress${method === "GET" ? `?programId=${ids.program}` : ""}`,
        {
          method,
          body: body ? JSON.stringify(body) : undefined,
          headers: body ? { "content-type": "application/json" } : undefined,
        },
      ),
      dependencies,
    );
    assert.equal(response.status, 401);
  }
});

test("server-managed fields are rejected from start and merge payloads", () => {
  assert.throws(
    () => parseStartProgramBody({ programId: ids.program, userId: "other-user" }),
    ValidationError,
  );
  for (const field of ["userId", "enrollmentId", "xp", "achievementId", "eventKey"]) {
    assert.throws(
      () => parseMergeProgressBody(mergeBody({ [field]: "forbidden" })),
      ValidationError,
    );
  }
});

test("progress request bodies are limited before service input is parsed", async () => {
  const response = await handleStartProgress(
    new Request("http://localhost/api/program/progress/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ programId: ids.program, padding: "x".repeat(33_000) }),
    }),
    {
      requireUser: async () => ({ id: "user-one" }),
      service: createService(),
    },
  );
  assert.equal(response.status, 413);
});

test("hydration returns only the current user's enrollment", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  await service.startProgram("user-one", { programId: ids.program });
  assert.equal(
    (await service.getCurrentProgress("user-one", ids.program)).progress?.source,
    "server",
  );
  assert.equal(
    (await service.getCurrentProgress("user-two", ids.program)).progress,
    null,
  );
});

test("starting a published program is idempotent", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  const first = await service.startProgram("user-one", { programId: ids.program });
  const second = await service.startProgram("user-one", { programId: ids.program });
  assert.deepEqual(second, first);
  assert.equal(store.enrollment?.currentStepId, ids.stepOne);
});

test("server current step never moves backward", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  await service.startProgram("user-one", { programId: ids.program });
  await service.setCurrentStep("user-one", {
    programId: ids.program,
    stepId: ids.stepTwo,
  });
  const result = await service.setCurrentStep("user-one", {
    programId: ids.program,
    stepId: ids.stepOne,
  });
  assert.equal(result.progress?.currentStepId, ids.stepTwo);
  assert.equal(store.enrollment?.currentStepId, ids.stepTwo);
});

test("duplicate event keys do not create duplicate progress events", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  await service.startProgram("user-one", { programId: ids.program });
  await service.completeLesson("user-one", {
    programId: ids.program,
    lessonId: ids.lessonOne,
  });
  await service.completeLesson("user-one", {
    programId: ids.program,
    lessonId: ids.lessonOne,
  });
  assert.equal(store.enrollment?.progressEvents.length, 1);
});

test("an enrollment owned by another user is not accessible", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  await service.startProgram("user-one", { programId: ids.program });
  await assert.rejects(
    service.completeLesson("user-two", {
      programId: ids.program,
      lessonId: ids.lessonOne,
    }),
    /Program enrollment not found/,
  );
});

test("direct actions reject invalid lesson and block IDs", async () => {
  const service = createService();
  await service.startProgram("user-one", { programId: ids.program });
  await assert.rejects(
    service.completeLesson("user-one", {
      programId: ids.program,
      lessonId: ids.unknown,
    }),
    /Lesson does not belong to this program/,
  );
  await assert.rejects(
    service.saveQuizResult("user-one", {
      programId: ids.program,
      blockId: ids.unknown,
      answerIndex: 0,
    }),
    /Block does not belong to this program/,
  );
});

test("merge is explicit, ignores unknown IDs, and is idempotent", async () => {
  const store = new FakeProgressStore();
  const service = createService(store);
  const local = normalizeLocalProgramState(
    { completedStepIds: [ids.stepOne], completedSteps: [1], activeStep: 2 },
    clientSteps,
  );
  assert.equal(shouldOfferProgressMerge(local, null, clientSteps), true);
  assert.equal(store.enrollment, null);

  const request = () =>
    new Request("http://localhost/api/program/progress/merge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mergeBody({ completedStepIds: [ids.stepOne, ids.unknown] }),
      ),
    });
  const dependencies = {
    requireUser: async () => ({ id: "user-one" }),
    service,
  };
  const first = await handleMergeProgress(request(), dependencies);
  assert.equal(first.status, 200);
  const firstEnrollment = await store.findEnrollment("user-one", ids.program);
  const eventCount = firstEnrollment?.progressEvents.length;
  const second = await handleMergeProgress(request(), dependencies);
  assert.equal(second.status, 200);
  const secondEnrollment = await store.findEnrollment("user-one", ids.program);
  assert.equal(secondEnrollment?.progressEvents.length, eventCount);
  const progress = (await second.json()) as {
    progress: UserProgressResponse;
  };
  assert.deepEqual(progress.progress.completedStepIds, [ids.stepOne]);
  assert.deepEqual(progress.progress.completedLessonIds, [ids.lessonOne]);
  assert.deepEqual(progress.progress.completedQuizIds, [ids.quiz]);
  assert.deepEqual(progress.progress.completedScenarioIds, [ids.scenario]);
  assert.deepEqual(progress.progress.completedExerciseIds, [ids.exercise]);
  assert.equal(progress.progress.currentStepId, ids.stepTwo);
});

test("repeated local merge does not duplicate server XP", async () => {
  const store = new FakeProgressStore();
  const xpStore = new LessonXpStore();
  const service = createRewardedService(store, xpStore);
  const request = () =>
    new Request("http://localhost/api/program/progress/merge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mergeBody()),
    });
  const dependencies = {
    requireUser: async () => ({ id: "user-one" }),
    service,
  };
  const first = await handleMergeProgress(request(), dependencies);
  const firstPayload = (await first.json()) as {
    xp: { awardedNow: number; total: number };
  };
  const second = await handleMergeProgress(request(), dependencies);
  const secondPayload = (await second.json()) as {
    xp: { awardedNow: number; total: number };
  };
  assert.deepEqual(firstPayload.xp, { awardedNow: 10, total: 10 });
  assert.deepEqual(secondPayload.xp, { awardedNow: 0, total: 10 });
  assert.equal(xpStore.awards.size, 1);
  const publicPayload = JSON.stringify(firstPayload);
  for (const privateField of [
    "awardKey",
    "ruleId",
    "achievementId",
    "enrollmentId",
    "userId",
    "triggerConfig",
  ]) {
    assert.equal(publicPayload.includes(privateField), false);
  }
});

test("authenticated hydration rejects attempts to select another user", async () => {
  const response = await handleGetProgress(
    new Request(
      `http://localhost/api/program/progress?programId=${ids.program}&userId=user-two`,
    ),
    {
      requireUser: async () => ({ id: "user-one" }),
      service: createService(),
    },
  );
  assert.equal(response.status, 422);
});

test("client hydration preserves local XP and answers while using server completion", () => {
  const local = normalizeLocalProgramState(
    {
      completedSteps: [1],
      completedStepIds: [ids.stepOne],
      activeStep: 2,
      xp: 40,
      answers: { "exercise-1": "Local reflection" },
    },
    clientSteps,
  );
  const server: UserProgressResponse = {
    programId: ids.program,
    currentStepId: ids.stepTwo,
    completedStepIds: [ids.stepOne],
    completedLessonIds: [ids.lessonOne],
    completedQuizIds: [],
    completedScenarioIds: [],
    completedExerciseIds: [],
    completedAt: null,
    updatedAt: "2026-07-14T00:00:00.000Z",
    source: "server",
  };
  const hydrated = applyServerProgress(local, server, clientSteps);
  assert.equal(hydrated.activeStepId, ids.stepTwo);
  assert.deepEqual(hydrated.completedStepIds, [ids.stepOne]);
  assert.equal(hydrated.xp, 40);
  assert.equal(hydrated.answers["exercise-1"], "Local reflection");
});

test("API failure does not reset client progress", () => {
  const local = normalizeLocalProgramState(
    { completedSteps: [1], xp: 40, answers: { "exercise-1": "Kept" } },
    clientSteps,
  );
  assert.strictEqual(resolveProgressAfterSave(local, null, clientSteps), local);
});

test("server hydration does not erase a stronger device fallback", () => {
  const device = normalizeLocalProgramState(
    {
      completedSteps: [1],
      completedStepIds: [ids.stepOne],
      activeStep: 2,
      activeStepId: ids.stepTwo,
      xp: 40,
    },
    clientSteps,
  );
  const serverState = applyServerProgress(
    device,
    {
      programId: ids.program,
      currentStepId: ids.stepOne,
      completedStepIds: [],
      completedLessonIds: [],
      completedQuizIds: [],
      completedScenarioIds: [],
      completedExerciseIds: [],
      completedAt: null,
      updatedAt: "2026-07-14T00:00:00.000Z",
      source: "server",
    },
    clientSteps,
  );
  const preserved = preserveDeviceProgress(device, serverState, clientSteps);
  assert.deepEqual(preserved.completedStepIds, [ids.stepOne]);
  assert.equal(preserved.activeStepId, ids.stepTwo);
  assert.equal(preserved.xp, 40);
});

test("anonymous localStorage fallback remains in ProgramExperience", () => {
  const source = readFileSync("components/ProgramExperience.tsx", "utf8");
  assert.match(source, /sevenbet-program-progress-v1/);
  assert.match(source, /window\.localStorage\.getItem/);
  assert.match(source, /window\.localStorage\.setItem/);
});

test("orphan preflight fails when a referenced user does not exist", () => {
  const report = buildProgressOrphanReport(
    {
      programEnrollments: ["known-user", "orphan-user"],
      xpEvents: ["orphan-user"],
      achievements: [],
    },
    ["known-user"],
  );
  assert.equal(report.orphanCount, 1);
  assert.throws(
    () => assertNoProgressUserOrphans(report),
    ProgressUserOrphanError,
  );
});

test("migration 0004 remains unchanged and uses compatible TEXT foreign keys", () => {
  const foundation = readFileSync(
    "prisma/migrations/0002_program_builder/migration.sql",
    "utf8",
  );
  const auth = readFileSync(
    "prisma/migrations/0003_auth_foundation/migration.sql",
    "utf8",
  );
  const migration = readFileSync(
    "prisma/migrations/0004_progress_user_foreign_keys/migration.sql",
    "utf8",
  ).replace(/\s+/g, " ");
  assert.match(auth, /CREATE TABLE "User"[\s\S]*?"id" TEXT NOT NULL/);
  for (const table of ["ProgramEnrollment", "UserXpEvent", "UserAchievement"]) {
    assert.match(
      foundation,
      new RegExp(`CREATE TABLE "${table}"[\\s\\S]*?"userId" TEXT NOT NULL`),
    );
    assert.match(
      migration,
      new RegExp(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey" FOREIGN KEY \\(\\"userId\\"\\) REFERENCES \\"User\\"\\(\\"id\\"\\) ON DELETE CASCADE ON UPDATE CASCADE`,
      ),
    );
  }
});

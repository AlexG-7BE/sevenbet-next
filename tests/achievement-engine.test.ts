import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma, XpEventType } from "@prisma/client";

import type {
  AchievementProgressCounts,
  AchievementStore,
  EligibleAchievement,
  StoredUserAchievement,
} from "../lib/repositories/achievement.repository";
import type {
  CreateXpAwardInput,
  StoredXpEvent,
  XpStore,
} from "../lib/repositories/xp.repository";
import type { ProgressRewardContext } from "../lib/rewards/types";
import { AchievementService } from "../lib/services/achievement.service";
import { XpService } from "../lib/services/xp.service";

const ids = {
  user: "user-one",
  program: "10000000-0000-4000-8000-000000000001",
  lesson: "10000000-0000-4000-8000-000000000002",
  step: "10000000-0000-4000-8000-000000000003",
  quiz: "10000000-0000-4000-8000-000000000004",
  firstLesson: "10000000-0000-4000-8000-000000000005",
  stepAchievement: "10000000-0000-4000-8000-000000000006",
  programAchievement: "10000000-0000-4000-8000-000000000007",
  quizPassed: "10000000-0000-4000-8000-000000000008",
  quizCount: "10000000-0000-4000-8000-000000000009",
  malformed: "10000000-0000-4000-8000-000000000010",
};

class AchievementXpStore implements XpStore {
  readonly awards = new Map<string, StoredXpEvent>();

  async findEligibleRules() { return []; }

  async createAward(input: CreateXpAwardInput) {
    const key = `${input.userId}:${input.awardKey}`;
    const existing = this.awards.get(key);
    if (existing) return { event: existing, created: false };
    const event: StoredXpEvent = {
      id: `30000000-0000-4000-8000-${String(this.awards.size + 1).padStart(12, "0")}`,
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

class MemoryAchievementStore implements AchievementStore {
  readonly unlocked = new Map<string, StoredUserAchievement>();

  constructor(
    readonly achievements: EligibleAchievement[],
    public counts: AchievementProgressCounts,
  ) {}

  async findEligible() { return this.achievements; }

  async createUnlock(input: {
    userId: string;
    achievementId: string;
    awardKey: string;
  }) {
    const key = `${input.userId}:${input.awardKey}`;
    const existing = this.unlocked.get(key);
    if (existing) return { achievement: existing, created: false };
    const achievement: StoredUserAchievement = {
      id: `40000000-0000-4000-8000-${String(this.unlocked.size + 1).padStart(12, "0")}`,
      ...input,
      awardedAt: new Date("2026-07-14T00:00:00.000Z"),
    };
    this.unlocked.set(key, achievement);
    return { achievement, created: true };
  }

  async listUnlocked(userId: string) {
    return Array.from(this.unlocked.values())
      .filter((unlock) => unlock.userId === userId)
      .map((unlock) => {
        const achievement = this.achievements.find(
          (candidate) => candidate.id === unlock.achievementId,
        );
        if (!achievement) throw new Error("Missing achievement fixture");
        return {
          awardedAt: unlock.awardedAt,
          achievement: {
            id: achievement.id,
            slug: achievement.slug,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            tier: achievement.tier,
          },
        };
      });
  }

  async progressCounts() { return this.counts; }
}

function achievement(
  id: string,
  triggerType: string,
  triggerConfig: Prisma.JsonValue,
  options: { hidden?: boolean; xpReward?: number } = {},
): EligibleAchievement {
  return {
    id,
    slug: `achievement-${id}`,
    title: `Achievement ${id.slice(-2)}`,
    description: "Educational milestone",
    icon: "01",
    category: "PROGRAM",
    tier: "COMMON",
    xpReward: options.xpReward ?? 0,
    hidden: options.hidden ?? false,
    triggerType,
    triggerConfig,
  };
}

function context(
  kind: ProgressRewardContext["kind"],
  entityId: string,
  xpEventType: XpEventType,
): ProgressRewardContext {
  return {
    userId: ids.user,
    programId: ids.program,
    entityId,
    kind,
    xpEventType,
    ...(kind === "QUIZ_PASSED" ? { quizPassed: true } : {}),
  };
}

const zeroCounts = (): AchievementProgressCounts => ({
  lessons: 0,
  steps: 0,
  quizzes: 0,
  passedQuizzes: 0,
  programs: 0,
});

test("FIRST_LESSON unlocks once and a hidden achievement appears only after unlock", async () => {
  const item = achievement(ids.firstLesson, "FIRST_LESSON", {}, { hidden: true });
  const store = new MemoryAchievementStore([item], { ...zeroCounts(), lessons: 1 });
  const xp = new XpService(new AchievementXpStore());
  const service = new AchievementService(store, xp);
  assert.deepEqual(await service.listUnlocked(ids.user), []);
  const first = await service.evaluate(
    ids.user,
    context("LESSON_COMPLETED", ids.lesson, "LESSON_COMPLETION"),
  );
  const second = await service.evaluate(
    ids.user,
    context("LESSON_COMPLETED", ids.lesson, "LESSON_COMPLETION"),
  );
  assert.equal(first.newlyUnlocked.length, 1);
  assert.equal(second.newlyUnlocked.length, 0);
  assert.equal((await service.listUnlocked(ids.user)).length, 1);
});

test("STEP_COMPLETED and PROGRAM_COMPLETED triggers unlock from confirmed facts", async () => {
  const step = achievement(ids.stepAchievement, "STEP_COMPLETED", { count: 1 });
  const program = achievement(ids.programAchievement, "PROGRAM_COMPLETED", {
    programId: ids.program,
  });
  const store = new MemoryAchievementStore(
    [step, program],
    { ...zeroCounts(), steps: 1, programs: 1 },
  );
  const service = new AchievementService(store, new XpService(new AchievementXpStore()));
  const stepResult = await service.evaluate(
    ids.user,
    context("STEP_COMPLETED", ids.step, "STEP_COMPLETION"),
  );
  const programResult = await service.evaluate(
    ids.user,
    context("PROGRAM_COMPLETED", ids.program, "PROGRAM_COMPLETION"),
  );
  assert.equal(stepResult.newlyUnlocked[0]?.slug, step.slug);
  assert.equal(programResult.newlyUnlocked[0]?.slug, program.slug);
});

test("QUIZ_PASSED and QUIZ_COUNT use server contexts and thresholds", async () => {
  const passed = achievement(ids.quizPassed, "QUIZ_PASSED", { blockId: ids.quiz });
  const count = achievement(ids.quizCount, "QUIZ_COUNT", { count: 2 });
  const store = new MemoryAchievementStore(
    [passed, count],
    { ...zeroCounts(), quizzes: 1, passedQuizzes: 1 },
  );
  const service = new AchievementService(store, new XpService(new AchievementXpStore()));
  const passedResult = await service.evaluate(
    ids.user,
    context("QUIZ_PASSED", ids.quiz, "QUIZ_PASSING"),
  );
  assert.equal(passedResult.newlyUnlocked[0]?.slug, passed.slug);
  const beforeThreshold = await service.evaluate(
    ids.user,
    context("QUIZ_COMPLETED", ids.quiz, "QUIZ_COMPLETION"),
  );
  assert.equal(beforeThreshold.newlyUnlocked.length, 0);
  store.counts = { ...store.counts, quizzes: 2 };
  const atThreshold = await service.evaluate(
    ids.user,
    context("QUIZ_COMPLETED", ids.quiz, "QUIZ_COMPLETION"),
  );
  assert.equal(atThreshold.newlyUnlocked[0]?.slug, count.slug);
});

test("achievement reward XP is atomic in the service path and never duplicates", async () => {
  const item = achievement(
    ids.programAchievement,
    "PROGRAM_COMPLETED",
    { programId: ids.program },
    { xpReward: 100 },
  );
  const achievementStore = new MemoryAchievementStore(
    [item],
    { ...zeroCounts(), programs: 1 },
  );
  const xpStore = new AchievementXpStore();
  const xp = new XpService(xpStore);
  const service = new AchievementService(achievementStore, xp);
  const trigger = context("PROGRAM_COMPLETED", ids.program, "PROGRAM_COMPLETION");
  const first = await service.evaluate(ids.user, trigger);
  const second = await service.evaluate(ids.user, trigger);
  assert.equal(first.xpAwardedNow, 100);
  assert.equal(second.xpAwardedNow, 0);
  assert.equal(await xp.totalXp(ids.user), 100);
  assert.equal(xpStore.awards.size, 1);
});

test("malformed and deferred trigger configs do not break or simulate progress", async () => {
  const malformed = achievement(ids.malformed, "QUIZ_COUNT", { count: "two" });
  const deferred = achievement(ids.stepAchievement, "LEARNING_STREAK", { count: 2 });
  const store = new MemoryAchievementStore(
    [malformed, deferred],
    { ...zeroCounts(), quizzes: 10 },
  );
  const service = new AchievementService(store, new XpService(new AchievementXpStore()));
  const originalWarn = console.warn;
  let warnings = 0;
  console.warn = () => { warnings += 1; };
  try {
    const result = await service.evaluate(
      ids.user,
      context("QUIZ_COMPLETED", ids.quiz, "QUIZ_COMPLETION"),
    );
    assert.deepEqual(result.newlyUnlocked, []);
    assert.equal(warnings, 1);
  } finally {
    console.warn = originalWarn;
  }
});

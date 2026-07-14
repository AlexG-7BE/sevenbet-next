import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { XpEventType } from "@prisma/client";

import type { CmsBlock, CmsXpRule } from "../lib/cms/types";
import { parseQuizBody } from "../lib/progress/input";
import type {
  CreateXpAwardInput,
  EligibleXpRule,
  StoredXpEvent,
  XpStore,
} from "../lib/repositories/xp.repository";
import type { ProgressRewardContext } from "../lib/rewards/types";
import { ValidationError } from "../lib/services/service-error";
import { evaluateQuizSubmission } from "../lib/services/user-progress.service";
import { XpService } from "../lib/services/xp.service";

const ids = {
  user: "user-one",
  program: "10000000-0000-4000-8000-000000000001",
  lesson: "10000000-0000-4000-8000-000000000002",
  quiz: "10000000-0000-4000-8000-000000000003",
  lessonRule: "10000000-0000-4000-8000-000000000004",
  quizCompletionRule: "10000000-0000-4000-8000-000000000005",
  quizPassingRule: "10000000-0000-4000-8000-000000000006",
};

class MemoryXpStore implements XpStore {
  readonly awards = new Map<string, StoredXpEvent>();

  constructor(readonly rules: EligibleXpRule[]) {}

  async findEligibleRules(eventType: XpEventType, targetId: string) {
    return this.rules.filter(
      (rule) =>
        rule.eventType === eventType &&
        (!rule.targetId || rule.targetId === targetId),
    );
  }

  async createAward(input: CreateXpAwardInput) {
    const key = `${input.userId}:${input.awardKey}`;
    const existing = this.awards.get(key);
    if (existing) return { event: existing, created: false };
    const event: StoredXpEvent = {
      id: `20000000-0000-4000-8000-${String(this.awards.size + 1).padStart(12, "0")}`,
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

function dbRule(
  id: string,
  eventType: XpEventType,
  xp: number,
): EligibleXpRule {
  return { id, eventType, targetId: null, xp, awardKey: `rule:${id}` };
}

function snapshotRule(rule: EligibleXpRule, active = true): CmsXpRule {
  return {
    id: rule.id,
    entity: "xp-rule",
    slug: `rule-${rule.id}`,
    title: "XP rule",
    eventType: rule.eventType,
    targetId: rule.targetId ?? undefined,
    xp: rule.xp,
    active,
    awardKey: rule.awardKey,
    status: "PUBLISHED",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
    createdBy: "system",
    updatedBy: "system",
  };
}

function context(
  entityId: string,
  kind: ProgressRewardContext["kind"],
  xpEventType: XpEventType,
): ProgressRewardContext {
  return {
    userId: ids.user,
    programId: ids.program,
    entityId,
    kind,
    xpEventType,
  };
}

test("lesson XP is awarded once and concurrent duplicates stay idempotent", async () => {
  const rule = dbRule(ids.lessonRule, "LESSON_COMPLETION", 10);
  const store = new MemoryXpStore([rule]);
  const service = new XpService(store);
  const trigger = context(ids.lesson, "LESSON_COMPLETED", "LESSON_COMPLETION");
  const [first, second] = await Promise.all([
    service.awardProgress(trigger, [snapshotRule(rule)]),
    service.awardProgress(trigger, [snapshotRule(rule)]),
  ]);
  assert.equal(first + second, 10);
  assert.equal(store.awards.size, 1);
  assert.equal(await service.totalXp(ids.user), 10);
});

test("unknown and inactive snapshot rules do not award XP", async () => {
  const rule = dbRule(ids.lessonRule, "LESSON_COMPLETION", 10);
  const store = new MemoryXpStore([rule]);
  const service = new XpService(store);
  const trigger = context(ids.lesson, "LESSON_COMPLETED", "LESSON_COMPLETION");
  const unknown = { ...rule, id: ids.quizPassingRule };
  assert.equal(await service.awardProgress(trigger, [snapshotRule(unknown)]), 0);
  assert.equal(await service.awardProgress(trigger, [snapshotRule(rule, false)]), 0);
  assert.equal(await service.totalXp(ids.user), 0);
});

test("server quiz evaluation distinguishes completion from passing", async () => {
  const completion = dbRule(ids.quizCompletionRule, "QUIZ_COMPLETION", 5);
  const passing = dbRule(ids.quizPassingRule, "QUIZ_PASSING", 15);
  const store = new MemoryXpStore([completion, passing]);
  const service = new XpService(store);
  const block = {
    id: ids.quiz,
    type: "QUIZ",
    data: {
      questions: [{ options: [{ correct: false }, { correct: true }] }],
    },
  } as unknown as CmsBlock;

  const wrong = evaluateQuizSubmission(block, 0);
  assert.equal(wrong.passed, false);
  assert.equal(
    await service.awardProgress(
      context(ids.quiz, "QUIZ_COMPLETED", "QUIZ_COMPLETION"),
      [snapshotRule(completion), snapshotRule(passing)],
    ),
    5,
  );
  assert.equal(await service.totalXp(ids.user), 5);

  const correct = evaluateQuizSubmission(block, 1);
  assert.equal(correct.passed, true);
  assert.equal(
    await service.awardProgress(
      { ...context(ids.quiz, "QUIZ_PASSED", "QUIZ_PASSING"), quizPassed: true },
      [snapshotRule(completion), snapshotRule(passing)],
    ),
    15,
  );
  assert.equal(
    await service.awardProgress(
      { ...context(ids.quiz, "QUIZ_PASSED", "QUIZ_PASSING"), quizPassed: true },
      [snapshotRule(completion), snapshotRule(passing)],
    ),
    0,
  );
  assert.equal(await service.totalXp(ids.user), 20);
});

test("client XP and passed flags are rejected", () => {
  for (const field of ["xp", "totalXp", "ruleId", "awardKey", "passed"]) {
    assert.throws(
      () =>
        parseQuizBody({
          programId: ids.program,
          blockId: ids.quiz,
          answerIndex: 1,
          [field]: field === "passed" ? true : 100,
        }),
      ValidationError,
    );
  }
});

test("XP total is the sum of server-authored award events", async () => {
  const first = dbRule(ids.lessonRule, "LESSON_COMPLETION", 10);
  const second = dbRule(ids.quizPassingRule, "QUIZ_PASSING", 15);
  const store = new MemoryXpStore([first, second]);
  const service = new XpService(store);
  await service.awardProgress(
    context(ids.lesson, "LESSON_COMPLETED", "LESSON_COMPLETION"),
    [snapshotRule(first), snapshotRule(second)],
  );
  await service.awardProgress(
    { ...context(ids.quiz, "QUIZ_PASSED", "QUIZ_PASSING"), quizPassed: true },
    [snapshotRule(first), snapshotRule(second)],
  );
  assert.equal(await service.totalXp(ids.user), 25);
});

test("migration 0005 models exactly one XP source and is not folded into older migrations", () => {
  const migration = readFileSync(
    "prisma/migrations/0005_xp_achievement_idempotency/migration.sql",
    "utf8",
  ).replace(/\s+/g, " ");
  assert.match(migration, /ALTER COLUMN "ruleId" DROP NOT NULL/);
  assert.match(migration, /ADD COLUMN "achievementId" UUID/);
  assert.match(migration, /UserXpEvent_source_check/);
  assert.match(migration, /FOREIGN KEY \("ruleId"\) REFERENCES "XpRule"\("id"\)/);
  assert.match(
    migration,
    /FOREIGN KEY \("achievementId"\) REFERENCES "Achievement"\("id"\)/,
  );
});

import type { Prisma } from "@prisma/client";

import {
  achievementRepository,
  type AchievementProgressCounts,
  type AchievementStore,
  type EligibleAchievement,
} from "@/lib/repositories/achievement.repository";
import type {
  AchievementSummary,
  ProgressRewardContext,
} from "@/lib/rewards/types";

import { XpService, xpService } from "./xp.service";

const implementedTriggers = new Set([
  "FIRST_LESSON",
  "STEP_COMPLETED",
  "PROGRAM_COMPLETED",
  "QUIZ_PASSED",
  "QUIZ_COUNT",
]);

type TriggerConfig = {
  programId?: string;
  stepId?: string;
  blockId?: string;
  count?: number;
};

function configRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Prisma.JsonValue>
    : null;
}

function parseTriggerConfig(achievement: EligibleAchievement): TriggerConfig | null {
  const record = configRecord(achievement.triggerConfig);
  if (!record) return null;
  const allowedByType: Record<string, string[]> = {
    FIRST_LESSON: ["programId"],
    STEP_COMPLETED: ["programId", "stepId", "count"],
    PROGRAM_COMPLETED: ["programId"],
    QUIZ_PASSED: ["programId", "blockId"],
    QUIZ_COUNT: ["programId", "count"],
  };
  const allowed = allowedByType[achievement.triggerType];
  if (!allowed || Object.keys(record).some((key) => !allowed.includes(key))) {
    return null;
  }
  for (const field of ["programId", "stepId", "blockId"] as const) {
    const value = record[field];
    if (
      value !== undefined &&
      (typeof value !== "string" || !value.trim() || value.length > 200)
    ) {
      return null;
    }
  }
  if (
    record.count !== undefined &&
    (!Number.isInteger(record.count) ||
      (record.count as number) < 1 ||
      (record.count as number) > 10_000)
  ) {
    return null;
  }
  if (achievement.triggerType === "QUIZ_COUNT" && record.count === undefined) {
    return null;
  }
  return {
    programId: record.programId as string | undefined,
    stepId: record.stepId as string | undefined,
    blockId: record.blockId as string | undefined,
    count: record.count as number | undefined,
  };
}

function appliesToContext(config: TriggerConfig, context: ProgressRewardContext) {
  return !config.programId || config.programId === context.programId;
}

function triggerMatches(
  achievement: EligibleAchievement,
  config: TriggerConfig,
  context: ProgressRewardContext,
  counts: AchievementProgressCounts,
) {
  if (!appliesToContext(config, context)) return false;
  switch (achievement.triggerType) {
    case "FIRST_LESSON":
      return context.kind === "LESSON_COMPLETED" && counts.lessons >= 1;
    case "STEP_COMPLETED":
      return (
        context.kind === "STEP_COMPLETED" &&
        (!config.stepId || config.stepId === context.entityId) &&
        (!config.count || counts.steps >= config.count)
      );
    case "PROGRAM_COMPLETED":
      return context.kind === "PROGRAM_COMPLETED";
    case "QUIZ_PASSED":
      return (
        context.kind === "QUIZ_PASSED" &&
        context.quizPassed === true &&
        (!config.blockId || config.blockId === context.entityId)
      );
    case "QUIZ_COUNT":
      return context.kind === "QUIZ_COMPLETED" && counts.quizzes >= (config.count ?? 1);
    default:
      return false;
  }
}

function summary(
  achievement: EligibleAchievement,
  awardedAt: Date,
): AchievementSummary {
  return {
    slug: achievement.slug,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    tier: achievement.tier,
    awardedAt: awardedAt.toISOString(),
  };
}

export class AchievementService {
  constructor(
    private readonly repository: AchievementStore = achievementRepository,
    private readonly xp: XpService = xpService,
  ) {}

  async evaluate(userId: string, context: ProgressRewardContext) {
    const achievements = await this.repository.findEligible(new Date());
    const [programCounts, globalCounts] = await Promise.all([
      this.repository.progressCounts(userId, context.programId),
      this.repository.progressCounts(userId),
    ]);
    const newlyUnlocked: AchievementSummary[] = [];
    let xpAwardedNow = 0;

    for (const achievement of achievements) {
      if (!implementedTriggers.has(achievement.triggerType)) continue;
      const config = parseTriggerConfig(achievement);
      if (!config) {
        console.warn("Skipping malformed achievement trigger configuration", {
          achievementId: achievement.id,
          triggerType: achievement.triggerType,
        });
        continue;
      }
      const counts = config.programId ? programCounts : globalCounts;
      if (!triggerMatches(achievement, config, context, counts)) continue;

      const unlock = await this.repository.createUnlock({
        userId,
        achievementId: achievement.id,
        awardKey: `achievement:${achievement.id}:unlocked`,
      });
      if (!unlock.created) continue;

      xpAwardedNow += await this.xp.awardAchievementReward(
        userId,
        achievement,
        context.xpEventType,
      );
      newlyUnlocked.push(summary(achievement, unlock.achievement.awardedAt));
    }

    return { newlyUnlocked, xpAwardedNow };
  }

  async listUnlocked(userId: string) {
    const unlocked = await this.repository.listUnlocked(userId);
    return unlocked.map(({ achievement, awardedAt }) => ({
      ...achievement,
      awardedAt: awardedAt.toISOString(),
    }));
  }
}

export const achievementService = new AchievementService();

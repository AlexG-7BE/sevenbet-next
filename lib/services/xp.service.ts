import type { CmsXpRule } from "@/lib/cms/types";
import {
  xpRepository,
  type XpStore,
} from "@/lib/repositories/xp.repository";
import type {
  EligibleAchievement,
} from "@/lib/repositories/achievement.repository";
import type { ProgressRewardContext } from "@/lib/rewards/types";

const maximumXpPerAward = 1000;

function progressAwardPrefix(context: ProgressRewardContext) {
  switch (context.kind) {
    case "LESSON_COMPLETED":
      return `xp:lesson:${context.entityId}:completed`;
    case "STEP_COMPLETED":
      return `xp:step:${context.entityId}:completed`;
    case "QUIZ_COMPLETED":
      return `xp:quiz:${context.entityId}:completed`;
    case "QUIZ_PASSED":
      return `xp:quiz:${context.entityId}:passed`;
    case "SCENARIO_COMPLETED":
      return `xp:scenario:${context.entityId}:completed`;
    case "EXERCISE_COMPLETED":
      return `xp:exercise:${context.entityId}:completed`;
    case "PROGRAM_COMPLETED":
      return `xp:program:${context.entityId}:completed`;
  }
}

function snapshotRuleIsEligible(
  rule: CmsXpRule,
  context: ProgressRewardContext,
) {
  return (
    rule.status === "PUBLISHED" &&
    rule.active &&
    !rule.archivedAt &&
    rule.eventType === context.xpEventType &&
    (!rule.targetId || rule.targetId === context.entityId)
  );
}

export class XpService {
  constructor(private readonly repository: XpStore = xpRepository) {}

  async awardProgress(
    context: ProgressRewardContext,
    snapshotRules: CmsXpRule[],
  ) {
    const now = new Date();
    const snapshotRuleIds = new Set(
      snapshotRules
        .filter((rule) => snapshotRuleIsEligible(rule, context))
        .map((rule) => rule.id),
    );
    const rules = (
      await this.repository.findEligibleRules(
        context.xpEventType,
        context.entityId,
        now,
      )
    ).filter(
      (rule) =>
        snapshotRuleIds.has(rule.id) &&
        rule.xp > 0 &&
        rule.xp <= maximumXpPerAward,
    );

    let awardedNow = 0;
    for (const rule of rules) {
      const result = await this.repository.createAward({
        userId: context.userId,
        ruleId: rule.id,
        awardKey: `${progressAwardPrefix(context)}:${rule.awardKey}`,
        eventType: context.xpEventType,
        xp: rule.xp,
      });
      if (result.created) awardedNow += result.event.xp;
    }
    return awardedNow;
  }

  async awardAchievementReward(
    userId: string,
    achievement: EligibleAchievement,
    eventType: ProgressRewardContext["xpEventType"],
  ) {
    if (
      achievement.xpReward <= 0 ||
      achievement.xpReward > maximumXpPerAward
    ) {
      return 0;
    }
    const result = await this.repository.createAward({
      userId,
      achievementId: achievement.id,
      awardKey: `xp:achievement:${achievement.id}:unlocked`,
      eventType,
      xp: achievement.xpReward,
    });
    return result.created ? result.event.xp : 0;
  }

  totalXp(userId: string) {
    return this.repository.totalXp(userId);
  }
}

export const xpService = new XpService();

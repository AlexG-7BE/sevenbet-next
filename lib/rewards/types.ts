import type { XpEventType } from "@prisma/client";

export type ProgressRewardKind =
  | "LESSON_COMPLETED"
  | "STEP_COMPLETED"
  | "QUIZ_COMPLETED"
  | "QUIZ_PASSED"
  | "SCENARIO_COMPLETED"
  | "EXERCISE_COMPLETED"
  | "PROGRAM_COMPLETED";

export type ProgressRewardContext = {
  userId: string;
  programId: string;
  entityId: string;
  kind: ProgressRewardKind;
  xpEventType: XpEventType;
  quizPassed?: boolean;
};

export type AchievementSummary = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  awardedAt: string;
};

export type RewardSummary = {
  xpAwardedNow: number;
  newlyUnlockedAchievements: AchievementSummary[];
};

export const emptyRewardSummary = (): RewardSummary => ({
  xpAwardedNow: 0,
  newlyUnlockedAchievements: [],
});

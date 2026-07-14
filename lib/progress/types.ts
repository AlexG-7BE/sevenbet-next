import type { AchievementSummary } from "@/lib/rewards/types";

export type UserProgressResponse = {
  programId: string;
  currentStepId: string | null;
  completedStepIds: string[];
  completedLessonIds: string[];
  completedQuizIds: string[];
  completedScenarioIds: string[];
  completedExerciseIds: string[];
  completedAt: string | null;
  updatedAt: string;
  source: "server";
};

export type ServerProgramState = {
  progress: UserProgressResponse | null;
  xp: {
    awardedNow: number;
    total: number;
  };
  achievements: {
    newlyUnlocked: AchievementSummary[];
    allUnlocked: AchievementSummary[];
  };
  source: "server";
};

export type MergeLocalProgressInput = {
  programId: string;
  currentStepId?: string;
  completedStepIds: string[];
  completedLessonIds: string[];
  completedQuizIds: string[];
  completedScenarioIds: string[];
  completedExerciseIds: string[];
  programCompleted: boolean;
};

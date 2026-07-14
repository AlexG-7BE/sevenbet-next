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

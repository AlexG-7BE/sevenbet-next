import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";
import type { ProgrammeStartingPointValue } from "@/lib/programme/program-ai/contracts";

export type ProgramAiHome = {
  totalXp: number;
  activeDays: number;
  currentStreak: number;
  achievements: Array<{
    slug: string;
    title: string;
    state: "earned" | "locked";
    awardedAt: string | null;
  }>;
  currentMission: number;
  engagementDayBucket: ProductAnalyticsEventMap["programme_home_viewed"]["engagementDayBucket"];
  currentAction: string | null;
  startingPoint: ProgrammeStartingPointValue | null;
  missions: Array<{
    missionNumber: number;
    title: string;
    status: "completed" | "current" | "locked";
    actionsCompleted: number;
    actionsTotal: number;
    xpEarnedHere: number;
    completionBonus: number;
  }>;
  reviews: Array<{
    milestone: "first" | "mid" | "full";
    unlockMission: 3 | 6 | 10;
    title: string;
    maxWords: number;
    status: "available" | "locked";
  }>;
  nextReview: null | {
    milestone: "first" | "mid" | "full";
    unlockMission: 3 | 6 | 10;
    title: string;
    xpRemaining: number;
    missionsRemaining: number;
  };
  discoveryLinks: ReadonlyArray<{ href: string; label: string }>;
};

export type ProgramAiMission = {
  missionNumber: number;
  stepId: string;
  title: string;
  purpose: string;
  status: string;
  actions: Array<{ id: string; label: string; xp: 15 | 20; completed: boolean }>;
  currentAction: string | null;
  actionsCompleted: number;
  artifact: Record<string, string | number | boolean | string[]>;
  artifactVersion: string;
  xpEarnedHere: number;
  completionBonus: 25;
  completedAt: string | null;
  legacyCompletion: boolean;
  programmeFacts?: {
    startingPoint: ProgrammeStartingPointValue | null;
    facts: Array<{
      missionNumber: number;
      title: string;
      artifact: Record<string, string | number | boolean | string[]>;
    }>;
  };
};

export type ProgramAiGuidance = {
  kind: "guidance";
  operation: string;
  title: string;
  summary: string;
  options: Array<{ id: string; text: string }>;
  generation: "provider" | "deterministic_fallback";
};

export type ProgramAiReview = {
  kind: "review";
  operation: string;
  title: string;
  sections: Array<{ id: string; title: string; body: string }>;
  generation: "provider" | "deterministic_fallback";
};

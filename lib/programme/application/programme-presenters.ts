import { programmeEvidence } from "@/lib/programme/contract";
import { missionRegistry } from "@/lib/programme/domain/mission-registry";
import { currentMissionNumber } from "@/lib/programme/domain/programme-state";
import { activeDayStreak } from "@/lib/programme/security";

export function momentMapDto(value: {
  id: string;
  situation: string;
  cues: string[];
  thoughtOrFeeling: string;
  response: string;
  immediateConsequence: string;
  noticeRule: string;
  neutralFlags: string[];
  notSureFlags: string[];
  missionVersion: string;
  evidenceVersion: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: value.id,
    situation: "",
    cues: [],
    thoughtOrFeeling: "",
    response: "",
    immediateConsequence: "",
    noticeRule: "",
    neutralFlags: [],
    notSureFlags: [],
    contentStorage: "browser_session" as const,
    missionVersion: value.missionVersion,
    evidenceVersion: value.evidenceVersion,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export function currentGoalDto(value: {
  id: string;
  sourceMomentMapId: string;
  direction: string;
  action: string;
  triggerOrSituation: string;
  alternativeAction: string;
  successSignal: string;
  reviewAt: Date;
  confidence: number;
  confidenceAdjustment: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: value.id,
    sourceMomentMapId: value.sourceMomentMapId,
    direction: value.direction.toLowerCase(),
    action: "",
    triggerOrSituation: "",
    alternativeAction: "",
    successSignal: "",
    reviewAt: value.reviewAt.toISOString(),
    confidence: value.confidence,
    confidenceAdjustment: "",
    contentStorage: "browser_session" as const,
    status: value.status.toLowerCase(),
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export function urgeLearningRecordDto(value: {
  id: string;
  missionVersion: string;
  learningItemId: string;
  evidenceVersion: string;
  reviewedAt: Date;
  scenarioCheckCompletedAt: Date;
  meaningCheckCompletedAt: Date;
  earlySignalCategory: string | null;
  earlySignalText: string | null;
  notNow: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: value.id,
    missionVersion: value.missionVersion,
    learningItemId: value.learningItemId,
    evidenceVersion: value.evidenceVersion,
    reviewedAt: value.reviewedAt.toISOString(),
    scenarioCheckCompletedAt: value.scenarioCheckCompletedAt.toISOString(),
    meaningCheckCompletedAt: value.meaningCheckCompletedAt.toISOString(),
    earlySignalCategory: null,
    earlySignalText: null,
    notNow: value.notNow,
    contentStorage: "browser_session" as const,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export function activeBoundaryDto(value: {
  id: string;
  sourceCurrentGoalId: string | null;
  sourceUrgeLearningRecordId: string | null;
  missionVersion: string;
  evidenceVersion: string;
  category: string;
  triggerType: string;
  triggerText: string | null;
  ruleText: string;
  limitValue: { toNumber(): number } | number | null;
  limitUnit: string | null;
  limitPeriod: string | null;
  executionMethod: string;
  executionDetail: string | null;
  copingAction: string;
  reviewAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: value.id,
    sourceCurrentGoalId: value.sourceCurrentGoalId,
    sourceUrgeLearningRecordId: value.sourceUrgeLearningRecordId,
    missionVersion: value.missionVersion,
    evidenceVersion: value.evidenceVersion,
    category: value.category.toLowerCase(),
    triggerType: value.triggerType,
    triggerText: "",
    ruleText: "",
    limitValue: typeof value.limitValue === "number"
      ? value.limitValue
      : value.limitValue?.toNumber() ?? null,
    limitUnit: null,
    limitPeriod: null,
    executionMethod: value.executionMethod,
    executionDetail: null,
    copingAction: "",
    reviewAt: value.reviewAt.toISOString(),
    status: value.status.toLowerCase(),
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    contentStorage: "browser_session" as const,
  };
}

export function programmeDashboardDto(
  programId: string,
  data: readonly [any, any[], any[]],
) {
  const [enrollment, xpEvents, achievementRows] = data;
  const completed = new Set<number>(
    enrollment.missionProgress
      .filter((mission: { status: string }) => mission.status === "COMPLETED")
      .map((mission: { missionNumber: number }) => mission.missionNumber),
  );
  const currentMission = currentMissionNumber(enrollment.missionProgress, missionRegistry.length);
  const activeDates = enrollment.activeDays.map((day: { localDate: Date }) =>
    day.localDate.toISOString().slice(0, 10)
  );
  const firstPlan = achievementRows.find(
    (row: any) => row.achievement.slug === "first-plan",
  );
  const boundaryBuilt = achievementRows.find(
    (row: any) => row.achievement.slug === "boundary-built",
  );
  return {
    programId,
    totalXp: xpEvents.reduce(
      (total: number, event: { xp: number }) => total + event.xp,
      0,
    ),
    currentMission,
    missions: missionRegistry.map((definition) => ({
      missionNumber: definition.missionNumber,
      title: definition.title,
      status: completed.has(definition.missionNumber)
        ? "completed"
        : definition.missionNumber === currentMission
          ? "current"
          : "locked",
    })),
    activeDays: activeDates.length,
    activeDayDates: activeDates,
    currentStreak: activeDayStreak(activeDates),
    timezone: enrollment.timezone,
    achievements: [
      {
        slug: "first-plan",
        title: "First Plan",
        state: firstPlan ? "earned" : "locked",
        awardedAt: firstPlan?.awardedAt.toISOString() ?? null,
      },
      {
        slug: "boundary-built",
        title: "Boundary Built",
        state: boundaryBuilt ? "earned" : "locked",
        awardedAt: boundaryBuilt?.awardedAt.toISOString() ?? null,
      },
    ],
    momentMap:
      enrollment.momentMap && !enrollment.momentMap.deletedAt
        ? momentMapDto(enrollment.momentMap)
        : null,
    currentGoal:
      enrollment.currentGoal && !enrollment.currentGoal.deletedAt
        ? currentGoalDto(enrollment.currentGoal)
        : null,
    urgeLearningRecord:
      enrollment.urgeLearningRecord && !enrollment.urgeLearningRecord.deletedAt
        ? urgeLearningRecordDto(enrollment.urgeLearningRecord)
        : null,
    activeBoundary:
      enrollment.activeBoundary && !enrollment.activeBoundary.deletedAt
        ? activeBoundaryDto(enrollment.activeBoundary)
        : null,
    evidence: {
      mission01: programmeEvidence.mission01,
      mission02: programmeEvidence.mission02,
      mission03: programmeEvidence.mission03,
      mission04: programmeEvidence.mission04,
    },
    rewardLedger: xpEvents.map((event: any) => ({
      eventType: event.eventType.toLowerCase(),
      missionNumber: event.missionNumber,
      xpDelta: event.xp,
      sourceArtifact: event.sourceArtifactType
        ? { type: event.sourceArtifactType.toLowerCase(), id: event.sourceArtifactId }
        : null,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

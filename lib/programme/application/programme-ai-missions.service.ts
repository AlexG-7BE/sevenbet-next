import type { ProgrammeMissionStatus } from "@prisma/client";

import { requireControlProgram, requireEnrollment } from "@/lib/programme/application/programme-context";
import {
  MissionLockedError,
  ProgrammeResourceNotFoundError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import type { ProgrammeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import {
  actionAwardKey,
  actionTaskState,
  commercialDiscoveryLinks,
  completionAwardKey,
  programmeMissionTitles,
  programAiMissionDefinition,
  programAiMissionRegistry,
  programAiReviewDefinitions,
  type ProgramAiMissionDefinition,
  type ProgramAiMissionNumber,
} from "@/lib/programme/program-ai/mission-registry";
import {
  parseProgramAiMissionAction,
  type ProgramAiStructuralArtifact,
} from "@/lib/programme/program-ai/mission-validation";
import { assertProgramAiV1Enabled } from "@/lib/programme/program-ai/runtime-config";
import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";

type MissionProgress = {
  id: string;
  missionNumber: number;
  status: ProgrammeMissionStatus;
  taskStates: string[];
  draft: unknown;
  completedAt: Date | null;
};

const artifactFields: Record<ProgramAiMissionNumber, readonly string[]> = {
  2: ["direction", "goalStyle", "reviewWindowDays", "realityCheck"],
  3: ["earlySignalCategory", "pauseMove", "sequenceOrder"],
  4: ["boundaryCategory", "triggerType", "executionMethod", "pressureCheck"],
  5: ["decisionChecks", "pauseRuleType", "scenarioChoice"],
  6: ["frictionMethods", "fallbackMethod", "bypassReason"],
  7: ["supportModes", "exitActionType", "supportCardStyle"],
  8: ["researchCriteria", "comparisonSignals", "offerTermSignal"],
  9: ["scenarioType", "responseStrategy", "fallbackStrategy"],
  10: ["reviewCadenceDays", "planPriorityIds", "timelineReviewed"],
};

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function artifactFromDraft(draft: unknown, definition: ProgramAiMissionDefinition) {
  const namespace = recordValue(recordValue(draft).programAiV1);
  if (!Object.keys(namespace).length || namespace.version !== definition.artifactVersion) return {};
  const artifact = recordValue(namespace.artifact);
  const unsupported = Object.keys(artifact).filter(
    (key) => !artifactFields[definition.missionNumber].includes(key),
  );
  if (unsupported.length) {
    throw new ProgrammeStateConflictError("Stored Mission artifact has unsupported fields", {
      fields: unsupported,
    });
  }
  return artifact as ProgramAiStructuralArtifact;
}

function mergedDraft(
  draft: unknown,
  definition: ProgramAiMissionDefinition,
  fragment: ProgramAiStructuralArtifact,
) {
  const root = recordValue(draft);
  const namespace = recordValue(root.programAiV1);
  if (Object.keys(namespace).length && namespace.version !== definition.artifactVersion) {
    throw new ProgrammeStateConflictError("Stored Mission artifact version is not supported");
  }
  const current = artifactFromDraft(draft, definition);
  return {
    ...root,
    programAiV1: {
      version: definition.artifactVersion,
      artifact: { ...current, ...fragment },
    },
  };
}

function missionActionStates(definition: ProgramAiMissionDefinition) {
  return definition.actions.map((action) => actionTaskState(definition.missionNumber, action.id));
}

function actionXpEarned(definition: ProgramAiMissionDefinition, progress?: MissionProgress | null) {
  if (!progress) return 0;
  const actionXp = definition.actions.reduce(
    (total, action) => total + (progress.taskStates.includes(actionTaskState(definition.missionNumber, action.id)) ? action.xp : 0),
    0,
  );
  const hasNewContract = missionActionStates(definition).every((state) => progress.taskStates.includes(state));
  return actionXp + (progress.status === "COMPLETED" && hasNewContract ? 25 : 0);
}

function highestActiveMission(progress: readonly MissionProgress[]) {
  const highestCompleted = Math.max(1, ...progress.filter((item) => item.status === "COMPLETED").map((item) => item.missionNumber));
  const highestOpen = Math.max(0, ...progress.filter((item) => item.status !== "COMPLETED" && item.status !== "NOT_STARTED").map((item) => item.missionNumber));
  return Math.min(10, Math.max(2, highestCompleted + 1, highestOpen));
}

export class ProgrammeAiMissionsService {
  constructor(private readonly unitOfWork = programmeUnitOfWork) {}

  async home(userId: string) {
    assertProgramAiV1Enabled();
    return this.unitOfWork.snapshot((unitOfWork) => this.projectHome(unitOfWork, userId));
  }

  async mission(userId: string, missionNumber: ProgramAiMissionNumber) {
    assertProgramAiV1Enabled();
    return this.unitOfWork.snapshot(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, missionNumber);
      await this.assertAccessible(unitOfWork, enrollment.id, missionNumber, progress);
      return this.projectMission(definitionFor(missionNumber), progress, source.program.steps[missionNumber - 1]?.id ?? "");
    });
  }

  async reviewContext(userId: string, unlockMission: 3 | 6 | 10) {
    assertProgramAiV1Enabled();
    return this.unitOfWork.snapshot(async (unitOfWork) => {
      const { source } = await requireEnrollment(unitOfWork, userId);
      const result = await unitOfWork.programAiMissionOne.home(userId, source.program.id);
      const progress = new Map(
        (result.enrollment?.missionProgress as MissionProgress[] | undefined)?.map((item) => [item.missionNumber, item]) ?? [],
      );
      if (progress.get(unlockMission)?.status !== "COMPLETED") {
        throw new ProgrammeStateConflictError(`Mission ${unlockMission} must be completed before this Personal Review`);
      }
      return {
        startingPoint: result.enrollment?.programmeStartingPoint
          ? {
              startingPoint: result.enrollment.programmeStartingPoint.startingPoint,
              desiredChange: result.enrollment.programmeStartingPoint.desiredChange,
              broadContext: result.enrollment.programmeStartingPoint.broadContext,
              continuationCue: result.enrollment.programmeStartingPoint.continuationCue,
              chosenBoundaryAction: result.enrollment.programmeStartingPoint.chosenBoundaryAction,
            }
          : null,
        facts: programAiMissionRegistry
          .filter((definition) => definition.missionNumber <= unlockMission)
          .map((definition) => ({
            missionNumber: definition.missionNumber,
            title: definition.title,
            artifact: progress.get(definition.missionNumber)
              ? artifactFromDraft(progress.get(definition.missionNumber)!.draft, definition)
              : {},
          })),
      };
    });
  }

  async recordAction(
    userId: string,
    missionNumber: ProgramAiMissionNumber,
    value: unknown,
    now = new Date(),
  ) {
    assertProgramAiV1Enabled();
    const definition = definitionFor(missionNumber);
    const input = parseProgramAiMissionAction(missionNumber, value);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, missionNumber);
      await this.assertAccessible(unitOfWork, enrollment.id, missionNumber, progress);
      if (progress?.status === "COMPLETED") {
        return {
          xpAwarded: 0,
          mission: this.projectMission(definition, progress, source.program.steps[missionNumber - 1].id),
          home: await this.projectHome(unitOfWork, userId),
        };
      }
      const targetIndex = definition.actions.findIndex((action) => action.id === input.action.id);
      const requiredPrior = definition.actions.slice(0, targetIndex).map(
        (action) => actionTaskState(missionNumber, action.id),
      );
      const existingStates = progress?.taskStates ?? [];
      if (requiredPrior.some((state) => !existingStates.includes(state))) {
        throw new ProgrammeStateConflictError("Complete the current Mission action first");
      }
      const taskState = actionTaskState(missionNumber, input.action.id);
      if (existingStates.includes(taskState)) {
        if (!progress) throw new ProgrammeResourceNotFoundError(`Mission ${missionNumber} progress`);
        return {
          xpAwarded: 0,
          mission: this.projectMission(definition, progress, source.program.steps[missionNumber - 1].id),
          home: await this.projectHome(unitOfWork, userId),
        };
      }
      const saved = await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber,
        status: "IN_PROGRESS",
        taskStates: [...existingStates, taskState],
        draft: mergedDraft(progress?.draft, definition, input.artifact),
        completedAt: null,
      });
      const awardKey = actionAwardKey(missionNumber, input.action.id);
      const xpEvent = await unitOfWork.rewards.recordProgrammeAiMissionXp({
        userId,
        programId: source.program.id,
        missionNumber,
        xp: input.action.xp,
        awardKey,
        sourceArtifactType: "PROGRAM_AI_MISSION_PROGRESS",
        sourceArtifactId: saved.id,
      });
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[missionNumber - 1].id,
        eventKey: `${taskState}:progress`,
        eventType: "ACTION_COMPLETED",
      });
      await unitOfWork.rewards.recordActiveDay({
        userId,
        enrollmentId: enrollment.id,
        localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
        timezone: enrollment.timezone,
        sourceEventKey: awardKey,
        eligibleActivityAt: now,
      });
      return {
        xpAwarded: xpEvent.count ? input.action.xp : 0,
        mission: this.projectMission(definition, saved, source.program.steps[missionNumber - 1].id),
        home: await this.projectHome(unitOfWork, userId),
      };
    });
  }

  async complete(userId: string, missionNumber: ProgramAiMissionNumber, now = new Date()) {
    assertProgramAiV1Enabled();
    const definition = definitionFor(missionNumber);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, missionNumber);
      await this.assertAccessible(unitOfWork, enrollment.id, missionNumber, progress);
      if (!progress) throw new ProgrammeResourceNotFoundError(`Mission ${missionNumber} progress`);
      if (progress.status === "COMPLETED") {
        return {
          xpAwarded: 0,
          mission: this.projectMission(definition, progress, source.program.steps[missionNumber - 1].id),
          home: await this.projectHome(unitOfWork, userId),
        };
      }
      const required = missionActionStates(definition);
      const missing = required.filter((state) => !progress.taskStates.includes(state));
      if (missing.length) {
        throw new ProgrammeStateConflictError("Complete all three Mission actions first", { fields: missing });
      }
      const saved = await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber,
        status: "COMPLETED",
        taskStates: progress.taskStates,
        draft: recordValue(progress.draft),
        completedAt: progress.completedAt ?? now,
      });
      const awardKey = completionAwardKey(missionNumber);
      const xpEvent = await unitOfWork.rewards.recordProgrammeAiMissionXp({
        userId,
        programId: source.program.id,
        missionNumber,
        xp: 25,
        awardKey,
        sourceArtifactType: "PROGRAM_AI_MISSION_PROGRESS",
        sourceArtifactId: saved.id,
      });
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[missionNumber - 1].id,
        eventKey: `${definition.artifactVersion}:complete:progress`,
      });
      if (missionNumber < 10) {
        const next = await unitOfWork.progress.findMissionProgress(enrollment.id, missionNumber + 1);
        if (!next) {
          await unitOfWork.progress.upsertMissionProgress({
            enrollmentId: enrollment.id,
            missionNumber: missionNumber + 1,
            status: "IN_PROGRESS",
            taskStates: [],
            draft: null,
            completedAt: null,
          });
        }
        const currentStepIndex = source.program.steps.findIndex((step) => step.id === enrollment.currentStepId);
        if (currentStepIndex <= missionNumber - 1) {
          await unitOfWork.progress.setEnrollmentCurrentStep(enrollment.id, source.program.steps[missionNumber].id);
        }
      }
      await unitOfWork.rewards.recordActiveDay({
        userId,
        enrollmentId: enrollment.id,
        localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
        timezone: enrollment.timezone,
        sourceEventKey: awardKey,
        eligibleActivityAt: now,
      });
      return {
        xpAwarded: xpEvent.count ? 25 : 0,
        mission: this.projectMission(definition, saved, source.program.steps[missionNumber - 1].id),
        home: await this.projectHome(unitOfWork, userId),
      };
    });
  }

  private async assertAccessible(
    unitOfWork: ProgrammeUnitOfWork,
    enrollmentId: string,
    missionNumber: ProgramAiMissionNumber,
    progress: MissionProgress | null,
  ) {
    if (progress?.status === "COMPLETED") return;
    const prerequisite = await unitOfWork.progress.findMissionProgress(enrollmentId, missionNumber - 1);
    if (prerequisite?.status !== "COMPLETED") {
      throw new MissionLockedError(missionNumber - 1, missionNumber);
    }
  }

  private projectMission(
    definition: ProgramAiMissionDefinition,
    progress: MissionProgress | null,
    stepId: string,
  ) {
    const states = progress?.taskStates ?? [];
    const actions = definition.actions.map((action) => ({
      id: action.id,
      label: action.label,
      xp: action.xp,
      completed: states.includes(actionTaskState(definition.missionNumber, action.id)),
    }));
    const currentAction = actions.find((action) => !action.completed)?.id ?? null;
    const hasNewContract = actions.every((action) => action.completed);
    return {
      missionNumber: definition.missionNumber,
      stepId,
      title: definition.title,
      purpose: definition.purpose,
      status: progress?.status.toLowerCase() ?? "not_started",
      actions,
      currentAction,
      actionsCompleted: actions.filter((action) => action.completed).length,
      artifact: progress ? artifactFromDraft(progress.draft, definition) : {},
      artifactVersion: definition.artifactVersion,
      xpEarnedHere: actionXpEarned(definition, progress),
      completionBonus: 25,
      completedAt: progress?.completedAt?.toISOString() ?? null,
      legacyCompletion: progress?.status === "COMPLETED" && !hasNewContract,
    };
  }

  private async projectHome(unitOfWork: ProgrammeUnitOfWork, userId: string) {
    const source = await requireControlProgram(unitOfWork);
    const result = await unitOfWork.programAiMissionOne.home(userId, source.program.id);
    if (!result.enrollment) {
      return {
        totalXp: result.totalXp,
        currentMission: 1,
        currentAction: null,
        startingPoint: null,
        missions: programmeMissionTitles.map((title, index) => ({ missionNumber: index + 1, title, status: index === 0 ? "current" : "locked", actionsCompleted: 0, xpEarnedHere: 0 })),
        reviews: Object.values(programAiReviewDefinitions).map((review) => ({ ...review, status: "locked" })),
        nextReview: { ...programAiReviewDefinitions.first, xpRemaining: 150, missionsRemaining: 2 },
        discoveryLinks: commercialDiscoveryLinks,
      };
    }
    const enrollment = result.enrollment;
    const allProgress = enrollment.missionProgress as MissionProgress[];
    const byMission = new Map(allProgress.map((progress) => [progress.missionNumber, progress]));
    const currentMission = highestActiveMission(allProgress);
    const currentDefinition = programAiMissionDefinition(currentMission);
    const currentProgress = byMission.get(currentMission);
    const reviews = Object.values(programAiReviewDefinitions).map((review) => ({
      ...review,
      status: byMission.get(review.unlockMission)?.status === "COMPLETED" ? "available" : "locked",
    }));
    const nextLockedReview = reviews.find((review) => review.status === "locked");
    const nextReview = nextLockedReview
      ? {
          ...nextLockedReview,
          xpRemaining: programAiMissionRegistry
            .filter((mission) => mission.missionNumber <= nextLockedReview.unlockMission)
            .reduce((total, mission) => {
              const missionProgress = byMission.get(mission.missionNumber);
              if (missionProgress?.status === "COMPLETED") return total;
              const actionRemaining = mission.actions.reduce(
                (sum, action) => sum + (missionProgress?.taskStates.includes(actionTaskState(mission.missionNumber, action.id)) ? 0 : action.xp),
                0,
              );
              return total + actionRemaining + 25;
            }, 0),
          missionsRemaining: programAiMissionRegistry.filter(
            (mission) => mission.missionNumber <= nextLockedReview.unlockMission && byMission.get(mission.missionNumber)?.status !== "COMPLETED",
          ).length,
        }
      : null;
    return {
      totalXp: result.totalXp,
      currentMission,
      currentAction: currentDefinition
        ? currentDefinition.actions.find((action) => !currentProgress?.taskStates.includes(actionTaskState(currentMission, action.id)))?.id ?? null
        : null,
      startingPoint: enrollment.programmeStartingPoint
        ? {
            startingPoint: enrollment.programmeStartingPoint.startingPoint,
            desiredChange: enrollment.programmeStartingPoint.desiredChange,
            broadContext: enrollment.programmeStartingPoint.broadContext,
            continuationCue: enrollment.programmeStartingPoint.continuationCue,
            chosenBoundaryAction: enrollment.programmeStartingPoint.chosenBoundaryAction,
          }
        : null,
      missions: programmeMissionTitles.map((title, index) => {
        const missionNumber = index + 1;
        const missionProgress = byMission.get(missionNumber);
        const definition = programAiMissionDefinition(missionNumber);
        return {
          missionNumber,
          title,
          status: missionProgress?.status === "COMPLETED" ? "completed" : missionNumber === currentMission ? "current" : "locked",
          actionsCompleted: definition
            ? definition.actions.filter((action) => missionProgress?.taskStates.includes(actionTaskState(missionNumber, action.id))).length
            : missionProgress?.status === "COMPLETED" ? 2 : 0,
          xpEarnedHere: definition ? actionXpEarned(definition, missionProgress) : missionProgress?.status === "COMPLETED" ? 40 : 0,
        };
      }),
      reviews,
      nextReview,
      discoveryLinks: commercialDiscoveryLinks,
    };
  }
}

function definitionFor(missionNumber: ProgramAiMissionNumber) {
  const definition = programAiMissionDefinition(missionNumber);
  if (!definition) throw new ProgrammeResourceNotFoundError("PROGRAM-AI Mission");
  return definition;
}

export const programmeAiMissionsService = new ProgrammeAiMissionsService();

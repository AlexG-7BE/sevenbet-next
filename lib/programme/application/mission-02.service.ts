import { requireEnrollment } from "@/lib/programme/application/programme-context";
import { ProgrammeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import {
  ProgrammeResourceNotFoundError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import {
  implementedMissionDefinition,
  progressEventKey,
} from "@/lib/programme/domain/mission-registry";
import {
  assertMissionPrerequisite,
  assertMissionTasksComplete,
  mergedMissionTasks,
} from "@/lib/programme/domain/programme-state";
import { rewardPolicyForMission } from "@/lib/programme/domain/reward-policy";
import {
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import {
  missionTwoStages,
  programmeEvidence,
  serialiseMissionState,
} from "@/lib/programme/contract";
import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";
import {
  parseCurrentGoal,
  parseMissionTwoDraft,
} from "@/lib/programme/validation";
import { ValidationError } from "@/lib/services/service-error";
import { localOnlyGoalNarrative } from "@/lib/programme/privacy";

function jsonGoal(value: ReturnType<typeof parseCurrentGoal>) {
  return {
    ...value,
    ...(value.reviewAt ? { reviewAt: value.reviewAt.toISOString() } : {}),
  };
}

export class MissionTwoService {
  private readonly dashboardService: ProgrammeDashboardService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
  }

  async getDraft(userId: string) {
    const { source, enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 2);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 02 progress");
    return {
      missionNumber: 2,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionTwoStages,
      draft: progress.draft ?? null,
      evidence: programmeEvidence.mission02,
      programId: source.program.id,
    };
  }

  async saveDraft(userId: string, value: unknown) {
    const definition = implementedMissionDefinition(2);
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const missionOne = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 1);
    assertMissionPrerequisite(missionOne?.status, 1, 2);
    const existing = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 2);
    if (existing?.status === "COMPLETED") {
      throw new ProgrammeStateConflictError("Mission 02 is already completed");
    }
    const input = parseMissionTwoDraft(value);
    const mergedTaskStates = mergedMissionTasks(
      existing?.taskStates ?? [],
      input.taskStates,
      definition.completion.taskStates,
    );
    const state = mergedTaskStates.length === definition.completion.taskStates.length
      ? "READY_TO_SAVE"
      : "IN_PROGRESS";
    const previousDraft = existing?.draft
      && typeof existing.draft === "object"
      && !Array.isArray(existing.draft)
      ? existing.draft as { currentGoal?: Record<string, unknown> }
      : {};
    const mergedGoal = {
      ...(previousDraft.currentGoal ?? {}),
      ...jsonGoal(input.currentGoal),
    };
    const saved = await this.unitOfWork.progress.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 2,
      status: state,
      taskStates: mergedTaskStates,
      draft: { currentGoal: mergedGoal },
    });
    if (saved.count !== 1) {
      throw new ProgrammeStateConflictError("Mission 02 draft can no longer be changed");
    }
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 2);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 02 progress");
    return {
      missionNumber: 2,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionTwoStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  complete(userId: string, now = new Date()) {
    const definition = implementedMissionDefinition(2);
    const reward = rewardPolicyForMission(2);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, 2);
      if (progress?.status === "COMPLETED") {
        return this.dashboardService.project(unitOfWork, userId, source.program.id);
      }
      if (!progress) throw new ProgrammeResourceNotFoundError("Mission 02 progress");
      const missionOne = await unitOfWork.progress.findMissionProgress(enrollment.id, 1);
      assertMissionPrerequisite(missionOne?.status, 1, 2);
      assertMissionTasksComplete(progress.taskStates, definition.completion.taskStates);
      const stored = progress.draft as { currentGoal?: unknown } | null;
      const currentGoalInput = parseCurrentGoal(stored?.currentGoal ?? {}, {
        complete: true,
        now,
      });
      const momentMap = await unitOfWork.artefacts.findMomentMap(enrollment.id);
      if (!momentMap || momentMap.deletedAt) {
        throw new ProgrammeStateConflictError(
          "An active Moment Map is required for Mission 02",
        );
      }
      if (currentGoalInput.sourceMomentMapId !== momentMap.id) {
        throw new ValidationError(
          "Current Goal must reference the account Moment Map",
        );
      }
      const goal = await unitOfWork.artefacts.upsertCurrentGoal({
        enrollmentId: enrollment.id,
        sourceMomentMapId: momentMap.id,
        direction: currentGoalInput.direction!,
        ...localOnlyGoalNarrative,
        reviewAt: currentGoalInput.reviewAt!,
        confidence: currentGoalInput.confidence!,
        status: currentGoalInput.status!,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 2,
        status: "COMPLETED",
        taskStates: [...definition.completion.taskStates],
        draft: null,
        completedAt: now,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 3,
        status: "IN_PROGRESS",
        taskStates: [],
        draft: null,
        completedAt: null,
      });
      await unitOfWork.progress.setEnrollmentCurrentStep(
        enrollment.id,
        source.program.steps[2].id,
      );
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[1].id,
        eventKey: progressEventKey(source.program.steps[1].id),
      });
      await unitOfWork.rewards.recordMissionXp({
        userId,
        programId: source.program.id,
        missionNumber: 2,
        xp: reward.xp,
        awardKey: reward.awardKey,
        sourceArtifactType: reward.sourceArtifactType,
        sourceArtifactId: goal.id,
      });
      const achievement = await unitOfWork.rewards.findAchievement(
        reward.achievement!.slug,
      );
      if (!achievement) {
        throw new ProgrammeStateConflictError("First Plan achievement is unavailable");
      }
      await unitOfWork.rewards.unlockAchievement({
        userId,
        achievementId: achievement.id,
        awardKey: reward.achievement!.awardKey,
      });
      await unitOfWork.rewards.recordActiveDay({
        userId,
        enrollmentId: enrollment.id,
        localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
        timezone: enrollment.timezone,
        sourceEventKey: reward.awardKey,
        eligibleActivityAt: now,
      });
      return this.dashboardService.project(unitOfWork, userId, source.program.id);
    });
  }
}

export const missionTwoService = new MissionTwoService();

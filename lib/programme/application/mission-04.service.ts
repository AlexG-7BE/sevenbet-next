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
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import {
  MISSION_FOUR_EVIDENCE_VERSION,
  missionFourStages,
  programmeEvidence,
  serialiseMissionState,
} from "@/lib/programme/contract";
import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";
import {
  parseActiveBoundary,
  parseMissionFourDraft,
} from "@/lib/programme/validation";
import { localOnlyBoundaryNarrative } from "@/lib/programme/privacy";

function jsonBoundary(value: ReturnType<typeof parseActiveBoundary>) {
  return {
    ...value,
    ...(value.reviewAt ? { reviewAt: value.reviewAt.toISOString() } : {}),
  };
}

export class MissionFourService {
  private readonly dashboardService: ProgrammeDashboardService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
  }

  async getDraft(userId: string) {
    const { source, enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 4);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 04 progress");
    return {
      missionNumber: 4,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionFourStages,
      draft: progress.draft ?? null,
      evidence: programmeEvidence.mission04,
      evidenceVersion: MISSION_FOUR_EVIDENCE_VERSION,
      currentGoal: await this.unitOfWork.artefacts.findCurrentGoal(enrollment.id),
      urgeLearningRecord: await this.unitOfWork.artefacts.findUrgeLearningRecord(
        enrollment.id,
      ),
      programId: source.program.id,
    };
  }

  async saveDraft(userId: string, value: unknown) {
    const definition = implementedMissionDefinition(4);
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const missionThree = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 3);
    assertMissionPrerequisite(missionThree?.status, 3, 4);
    const existing = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 4);
    if (!existing) throw new ProgrammeResourceNotFoundError("Mission 04 progress");
    if (existing.status === "COMPLETED") {
      throw new ProgrammeStateConflictError("Mission 04 is already completed");
    }
    const input = parseMissionFourDraft(value);
    const mergedTaskStates = mergedMissionTasks(
      existing.taskStates,
      input.taskStates,
      definition.completion.taskStates,
    );
    const previousDraft = existing.draft
      && typeof existing.draft === "object"
      && !Array.isArray(existing.draft)
      ? existing.draft as { activeBoundary?: Record<string, unknown> }
      : {};
    const mergedBoundary = {
      ...(previousDraft.activeBoundary ?? {}),
      ...jsonBoundary(input.activeBoundary),
    };
    const ready = mergedTaskStates.length === definition.completion.taskStates.length;
    if (ready) parseActiveBoundary(mergedBoundary, { complete: true });
    const saved = await this.unitOfWork.progress.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 4,
      status: ready ? "READY_TO_SAVE" : "IN_PROGRESS",
      taskStates: mergedTaskStates,
      draft: { activeBoundary: mergedBoundary },
    });
    if (saved.count !== 1) {
      throw new ProgrammeStateConflictError("Mission 04 draft can no longer be changed");
    }
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 4);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 04 progress");
    return {
      missionNumber: 4,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionFourStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  complete(userId: string, now = new Date()) {
    const definition = implementedMissionDefinition(4);
    const reward = rewardPolicyForMission(4);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, 4);
      if (progress?.status === "COMPLETED") {
        return this.dashboardService.project(unitOfWork, userId, source.program.id);
      }
      if (!progress) throw new ProgrammeResourceNotFoundError("Mission 04 progress");
      const missionThree = await unitOfWork.progress.findMissionProgress(enrollment.id, 3);
      assertMissionPrerequisite(missionThree?.status, 3, 4);
      assertMissionTasksComplete(progress.taskStates, definition.completion.taskStates);
      const stored = progress.draft as { activeBoundary?: unknown } | null;
      const boundary = parseActiveBoundary(stored?.activeBoundary ?? {}, {
        complete: true,
        now,
      });
      const currentGoal = await unitOfWork.artefacts.findCurrentGoal(enrollment.id);
      const urgeRecord = await unitOfWork.artefacts.findUrgeLearningRecord(enrollment.id);
      if (
        boundary.triggerType === "saved_early_signal"
        && (!urgeRecord || urgeRecord.deletedAt || urgeRecord.notNow)
      ) {
        throw new ProgrammeStateConflictError(
          "An active saved early signal is required for this decision point",
        );
      }
      const activeBoundary = await unitOfWork.artefacts.upsertActiveBoundary({
        enrollmentId: enrollment.id,
        sourceCurrentGoalId: currentGoal && !currentGoal.deletedAt ? currentGoal.id : null,
        sourceUrgeLearningRecordId:
          boundary.triggerType === "saved_early_signal" ? urgeRecord!.id : null,
        missionVersion: definition.completion.version,
        evidenceVersion: definition.completion.evidenceVersion,
        category: boundary.category!,
        triggerType: boundary.triggerType!,
        ...localOnlyBoundaryNarrative,
        limitValue: boundary.limitValue ?? null,
        limitUnit: null,
        limitPeriod: null,
        executionMethod: boundary.executionMethod!,
        reviewAt: boundary.reviewAt!,
        status: boundary.status!,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 4,
        status: "COMPLETED",
        taskStates: [...definition.completion.taskStates],
        draft: null,
        completedAt: now,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 5,
        status: "IN_PROGRESS",
        taskStates: [],
        draft: null,
        completedAt: null,
      });
      await unitOfWork.progress.setEnrollmentCurrentStep(
        enrollment.id,
        source.program.steps[4].id,
      );
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[3].id,
        eventKey: progressEventKey(source.program.steps[3].id),
      });
      await unitOfWork.rewards.recordMissionXp({
        userId,
        programId: source.program.id,
        missionNumber: 4,
        xp: reward.xp,
        awardKey: reward.awardKey,
        sourceArtifactType: reward.sourceArtifactType,
        sourceArtifactId: activeBoundary.id,
      });
      const achievement = await unitOfWork.rewards.findAchievement(
        reward.achievement!.slug,
      );
      if (!achievement) {
        throw new ProgrammeStateConflictError(
          "Boundary Built achievement is unavailable",
        );
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

export const missionFourService = new MissionFourService();

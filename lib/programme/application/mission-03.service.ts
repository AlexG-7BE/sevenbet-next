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
  MISSION_THREE_EVIDENCE_VERSION,
  MISSION_THREE_LEARNING_ITEM_ID,
  missionThreeStages,
  programmeEvidence,
  serialiseMissionState,
} from "@/lib/programme/contract";
import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";
import {
  parseMissionThreeDraft,
  parseUrgeLearningDraft,
} from "@/lib/programme/validation";

export class MissionThreeService {
  private readonly dashboardService: ProgrammeDashboardService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
  }

  async getDraft(userId: string) {
    const { source, enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 3);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 03 progress");
    return {
      missionNumber: 3,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionThreeStages,
      draft: progress.draft ?? null,
      evidence: programmeEvidence.mission03,
      learningItemId: MISSION_THREE_LEARNING_ITEM_ID,
      evidenceVersion: MISSION_THREE_EVIDENCE_VERSION,
      programId: source.program.id,
    };
  }

  async saveDraft(userId: string, value: unknown) {
    const definition = implementedMissionDefinition(3);
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const missionTwo = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 2);
    assertMissionPrerequisite(missionTwo?.status, 2, 3);
    const existing = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 3);
    if (existing?.status === "COMPLETED") {
      throw new ProgrammeStateConflictError("Mission 03 is already completed");
    }
    if (!existing) throw new ProgrammeResourceNotFoundError("Mission 03 progress");
    const input = parseMissionThreeDraft(value);
    const mergedTaskStates = mergedMissionTasks(
      existing.taskStates,
      input.taskStates,
      definition.completion.taskStates,
    );
    const previousDraft = existing.draft
      && typeof existing.draft === "object"
      && !Array.isArray(existing.draft)
      ? existing.draft as { urgeLearning?: Record<string, unknown> }
      : {};
    const mergedLearning: Record<string, unknown> = {
      ...(previousDraft.urgeLearning ?? {}),
      ...input.urgeLearning,
    };
    const ready = mergedTaskStates.length === definition.completion.taskStates.length;
    if (ready) parseUrgeLearningDraft(mergedLearning, { complete: true });
    const saved = await this.unitOfWork.progress.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 3,
      status: ready ? "READY_TO_SAVE" : "IN_PROGRESS",
      taskStates: mergedTaskStates,
      draft: { urgeLearning: mergedLearning },
    });
    if (saved.count !== 1) {
      throw new ProgrammeStateConflictError("Mission 03 draft can no longer be changed");
    }
    const progress = await this.unitOfWork.progress.findMissionProgress(enrollment.id, 3);
    if (!progress) throw new ProgrammeResourceNotFoundError("Mission 03 progress");
    return {
      missionNumber: 3,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionThreeStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  complete(userId: string, now = new Date()) {
    const definition = implementedMissionDefinition(3);
    const reward = rewardPolicyForMission(3);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const { source, enrollment } = await requireEnrollment(unitOfWork, userId);
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, 3);
      if (progress?.status === "COMPLETED") {
        return this.dashboardService.project(unitOfWork, userId, source.program.id);
      }
      if (!progress) throw new ProgrammeResourceNotFoundError("Mission 03 progress");
      const missionTwo = await unitOfWork.progress.findMissionProgress(enrollment.id, 2);
      assertMissionPrerequisite(missionTwo?.status, 2, 3);
      assertMissionTasksComplete(progress.taskStates, definition.completion.taskStates);
      const stored = progress.draft as { urgeLearning?: unknown } | null;
      const learning = parseUrgeLearningDraft(stored?.urgeLearning ?? {}, {
        complete: true,
      });
      const record = await unitOfWork.artefacts.upsertUrgeLearningRecord({
        enrollmentId: enrollment.id,
        missionVersion: definition.completion.version,
        learningItemId: MISSION_THREE_LEARNING_ITEM_ID,
        evidenceVersion: definition.completion.evidenceVersion,
        reviewedAt: now,
        scenarioCheckCompletedAt: now,
        meaningCheckCompletedAt: now,
        earlySignalCategory: null,
        earlySignalText: null,
        notNow: learning.signalChoice === "not_now",
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 3,
        status: "COMPLETED",
        taskStates: [...definition.completion.taskStates],
        draft: null,
        completedAt: now,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 4,
        status: "IN_PROGRESS",
        taskStates: [],
        draft: null,
        completedAt: null,
      });
      await unitOfWork.progress.setEnrollmentCurrentStep(
        enrollment.id,
        source.program.steps[3].id,
      );
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[2].id,
        eventKey: progressEventKey(source.program.steps[2].id),
      });
      await unitOfWork.rewards.recordMissionXp({
        userId,
        programId: source.program.id,
        missionNumber: 3,
        xp: reward.xp,
        awardKey: reward.awardKey,
        sourceArtifactType: reward.sourceArtifactType,
        sourceArtifactId: record.id,
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

export const missionThreeService = new MissionThreeService();

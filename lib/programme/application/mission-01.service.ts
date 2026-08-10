import { requireControlProgram } from "@/lib/programme/application/programme-context";
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
  assertMissionTasksComplete,
  mergedMissionTasks,
} from "@/lib/programme/domain/programme-state";
import { rewardPolicyForMission } from "@/lib/programme/domain/reward-policy";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import { localOnlyMomentMap } from "@/lib/programme/privacy";
import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";
import { parseMissionOneDraft, parseTimeZone } from "@/lib/programme/validation";

type ControlProgramme = Awaited<ReturnType<typeof requireControlProgram>>;
type ProgrammeEnrollment = NonNullable<
  Awaited<ReturnType<ProgrammeUnitOfWork["progress"]["findEnrollment"]>>
>;

export async function persistMissionOneCompletion(input: {
  unitOfWork: ProgrammeUnitOfWork;
  userId: string;
  source: ControlProgramme;
  enrollment: ProgrammeEnrollment;
  timeZone: string;
  missionVersion: string;
  evidenceVersion: string;
  now: Date;
}) {
  const definition = implementedMissionDefinition(1);
  const reward = rewardPolicyForMission(1);
  const completed = await input.unitOfWork.progress.completeMissionProgressIfReady({
    enrollmentId: input.enrollment.id,
    missionNumber: 1,
    taskStates: [...definition.completion.taskStates],
    completedAt: input.now,
  });
  if (completed.count !== 1) return false;

  const momentMap = await input.unitOfWork.artefacts.createMomentMap({
    enrollmentId: input.enrollment.id,
    ...localOnlyMomentMap,
    missionVersion: input.missionVersion,
    evidenceVersion: input.evidenceVersion,
  });
  await input.unitOfWork.progress.upsertMissionProgress({
    enrollmentId: input.enrollment.id,
    missionNumber: 2,
    status: "IN_PROGRESS",
    taskStates: [],
    draft: null,
    completedAt: null,
  });
  await input.unitOfWork.progress.setEnrollmentCurrentStep(
    input.enrollment.id,
    input.source.program.steps[1].id,
  );
  await input.unitOfWork.progress.setEnrollmentTimezone(
    input.enrollment.id,
    input.timeZone,
  );
  await input.unitOfWork.rewards.recordProgressEvent({
    enrollmentId: input.enrollment.id,
    entityId: input.source.program.steps[0].id,
    eventKey: progressEventKey(input.source.program.steps[0].id),
  });
  await input.unitOfWork.rewards.recordMissionXp({
    userId: input.userId,
    programId: input.source.program.id,
    missionNumber: 1,
    xp: reward.xp,
    awardKey: reward.awardKey,
    sourceArtifactType: reward.sourceArtifactType,
    sourceArtifactId: momentMap.id,
  });
  await input.unitOfWork.rewards.recordActiveDay({
    userId: input.userId,
    enrollmentId: input.enrollment.id,
    localDate: dateOnlyUtc(localDateAt(input.now, input.timeZone)),
    timezone: input.timeZone,
    sourceEventKey: reward.awardKey,
    eligibleActivityAt: input.now,
  });
  return true;
}

export class MissionOneService {
  private readonly dashboardService: ProgrammeDashboardService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
  }

  saveDraft(userId: string, value: unknown) {
    const input = parseMissionOneDraft(value);
    const definition = implementedMissionDefinition(1);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const source = await requireControlProgram(unitOfWork);
      let enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
      if (!enrollment) {
        enrollment = await unitOfWork.progress.getOrCreateEnrollment({
          userId,
          programId: source.program.id,
          programVersionId: source.version.id,
          currentStepId: source.program.steps[0].id,
          timezone: "UTC",
        });
      }
      const existing = await unitOfWork.progress.findMissionProgress(enrollment.id, 1);
      if (existing?.status === "COMPLETED") {
        throw new ProgrammeStateConflictError("Mission 01 is already completed");
      }
      const taskStates = mergedMissionTasks(
        existing?.taskStates ?? [],
        input.taskStates,
        definition.completion.taskStates,
      );
      const status = taskStates.length === definition.completion.taskStates.length
        ? "READY_TO_SAVE"
        : "IN_PROGRESS";
      const progress = await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 1,
        status,
        taskStates,
        draft: { contentStorage: "browser_session" },
        completedAt: null,
      });
      return {
        missionNumber: 1,
        status: progress.status.toLowerCase(),
        taskStates: progress.taskStates,
      };
    });
  }

  complete(userId: string, timeZoneValue: unknown, now = new Date()) {
    const timeZone = parseTimeZone(timeZoneValue);
    const definition = implementedMissionDefinition(1);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const source = await requireControlProgram(unitOfWork);
      const enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
      if (!enrollment) throw new ProgrammeResourceNotFoundError("Program enrollment");
      const progress = await unitOfWork.progress.findMissionProgress(enrollment.id, 1);
      if (progress?.status === "COMPLETED") {
        return this.dashboardService.project(unitOfWork, userId, source.program.id);
      }
      if (!progress) throw new ProgrammeResourceNotFoundError("Mission 01 progress");
      assertMissionTasksComplete(progress.taskStates, definition.completion.taskStates);
      const completed = await persistMissionOneCompletion({
        unitOfWork,
        userId,
        source,
        enrollment,
        timeZone,
        missionVersion: definition.completion.version,
        evidenceVersion: definition.completion.evidenceVersion,
        now,
      });
      if (!completed) {
        const latest = await unitOfWork.progress.findMissionProgress(enrollment.id, 1);
        if (latest?.status !== "COMPLETED") {
          throw new ProgrammeStateConflictError("Mission 01 can no longer be completed");
        }
      }
      return this.dashboardService.project(unitOfWork, userId, source.program.id);
    });
  }
}

export const missionOneService = new MissionOneService();

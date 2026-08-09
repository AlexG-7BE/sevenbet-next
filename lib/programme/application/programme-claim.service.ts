import { requireControlProgram } from "@/lib/programme/application/programme-context";
import { ProgrammeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import {
  ClaimExpiredError,
  ProgrammeResourceNotFoundError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import {
  implementedMissionDefinition,
  progressEventKey,
} from "@/lib/programme/domain/mission-registry";
import { assertMissionTasksComplete } from "@/lib/programme/domain/programme-state";
import { rewardPolicyForMission } from "@/lib/programme/domain/reward-policy";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import {
  dateOnlyUtc,
  hashOpaqueToken,
  localDateAt,
} from "@/lib/programme/security";
import { parseTimeZone } from "@/lib/programme/validation";
import { localOnlyMomentMap } from "@/lib/programme/privacy";

export class ProgrammeClaimService {
  private readonly dashboardService: ProgrammeDashboardService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
  }

  redeemPendingClaim(
    userId: string,
    claimToken: string,
    timeZoneValue: unknown,
    now = new Date(),
  ) {
    const timeZone = parseTimeZone(timeZoneValue);
    const definition = implementedMissionDefinition(1);
    const reward = rewardPolicyForMission(1);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const claim = await unitOfWork.sessions.findClaim(hashOpaqueToken(claimToken));
      if (!claim) throw new ProgrammeResourceNotFoundError("Pending programme claim");
      if (claim.consumedAt) {
        throw new ProgrammeStateConflictError(
          "Pending programme claim has already been used",
        );
      }
      if (claim.expiresAt <= now) throw new ClaimExpiredError();
      const anonymousSession = claim.anonymousSession;
      if (
        anonymousSession.deletedAt
        || anonymousSession.expiresAt <= now
        || anonymousSession.missionState !== "REGISTRATION_REQUIRED"
      ) {
        throw new ProgrammeStateConflictError(
          "Anonymous Mission 01 result is unavailable",
        );
      }
      assertMissionTasksComplete(
        anonymousSession.taskStates,
        definition.completion.taskStates,
      );
      const source = await requireControlProgram(unitOfWork);
      let enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
      if (enrollment) {
        const existingMission = await unitOfWork.progress.findMissionProgress(
          enrollment.id,
          1,
        );
        if (existingMission?.status === "COMPLETED") {
          throw new ProgrammeStateConflictError(
            "Mission 01 is already completed for this account",
          );
        }
      } else {
        enrollment = await unitOfWork.progress.getOrCreateEnrollment({
          userId,
          programId: source.program.id,
          programVersionId: source.version.id,
          currentStepId: source.program.steps[1].id,
          timezone: timeZone,
        });
      }
      const claimed = await unitOfWork.sessions.consumeClaim(claim.id, userId, now);
      if (claimed.count !== 1) {
        throw new ProgrammeStateConflictError(
          "Pending programme claim is no longer available",
        );
      }
      const momentMap = await unitOfWork.artefacts.createMomentMap({
        enrollmentId: enrollment.id,
        ...localOnlyMomentMap,
        missionVersion: anonymousSession.missionVersion,
        evidenceVersion: anonymousSession.evidenceVersion,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 1,
        status: "COMPLETED",
        taskStates: [...definition.completion.taskStates],
        draft: null,
        completedAt: now,
      });
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 2,
        status: "IN_PROGRESS",
        taskStates: [],
        draft: null,
        completedAt: null,
      });
      await unitOfWork.progress.setEnrollmentCurrentStep(
        enrollment.id,
        source.program.steps[1].id,
      );
      await unitOfWork.rewards.recordProgressEvent({
        enrollmentId: enrollment.id,
        entityId: source.program.steps[0].id,
        eventKey: progressEventKey(source.program.steps[0].id),
      });
      await unitOfWork.rewards.recordMissionXp({
        userId,
        programId: source.program.id,
        missionNumber: 1,
        xp: reward.xp,
        awardKey: reward.awardKey,
        sourceArtifactType: reward.sourceArtifactType,
        sourceArtifactId: momentMap.id,
      });
      await unitOfWork.rewards.recordActiveDay({
        userId,
        enrollmentId: enrollment.id,
        localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
        timezone: enrollment.timezone,
        sourceEventKey: reward.awardKey,
        eligibleActivityAt: now,
      });
      await unitOfWork.sessions.completeAnonymousSession(anonymousSession.id, now);
      return this.dashboardService.project(
        unitOfWork,
        userId,
        source.program.id,
      );
    });
  }
}

export const programmeClaimService = new ProgrammeClaimService();

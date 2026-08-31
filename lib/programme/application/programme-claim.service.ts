import { requireControlProgram } from "@/lib/programme/application/programme-context";
import { ProgrammeAccessService } from "@/lib/programme/application/programme-access.service";
import { ProgrammeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import { persistMissionOneCompletion } from "@/lib/programme/application/mission-01.service";
import {
  ClaimExpiredError,
  PendingProgrammeClaimUnavailableError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import { implementedMissionDefinition } from "@/lib/programme/domain/mission-registry";
import { assertMissionTasksComplete } from "@/lib/programme/domain/programme-state";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import { hashOpaqueToken } from "@/lib/programme/security";
import { parseTimeZone } from "@/lib/programme/validation";

export class ProgrammeClaimService {
  private readonly dashboardService: ProgrammeDashboardService;
  private readonly accessService: ProgrammeAccessService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.dashboardService = new ProgrammeDashboardService(unitOfWork);
    this.accessService = new ProgrammeAccessService(unitOfWork);
  }

  redeemPendingClaim(
    userId: string,
    claimToken: string,
    timeZoneValue: unknown,
    now = new Date(),
  ) {
    const timeZone = parseTimeZone(timeZoneValue);
    const definition = implementedMissionDefinition(1);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const claim = await unitOfWork.sessions.findClaim(hashOpaqueToken(claimToken));
      if (!claim) throw new PendingProgrammeClaimUnavailableError();
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
      await this.accessService.requireAnonymousAcceptance(unitOfWork, anonymousSession.id);
      const source = await requireControlProgram(unitOfWork);
      let enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
      if (enrollment) {
        const existingMission = await unitOfWork.progress.findMissionProgress(
          enrollment.id,
          1,
        );
        if (existingMission) {
          throw new ProgrammeStateConflictError(
            "Mission 01 already has authenticated account progress",
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
      await unitOfWork.progress.upsertMissionProgress({
        enrollmentId: enrollment.id,
        missionNumber: 1,
        status: "READY_TO_SAVE",
        taskStates: [...definition.completion.taskStates],
        draft: { contentStorage: "browser_session" },
        completedAt: null,
      });
      const claimed = await unitOfWork.sessions.consumeClaim(claim.id, userId, now);
      if (claimed.count !== 1) {
        throw new ProgrammeStateConflictError(
          "Pending programme claim is no longer available",
        );
      }
      await this.accessService.bindAnonymousAcceptanceToUser(
        unitOfWork,
        anonymousSession.id,
        userId,
      );
      const completed = await persistMissionOneCompletion({
        unitOfWork,
        userId,
        source,
        enrollment,
        timeZone,
        missionVersion: anonymousSession.missionVersion,
        evidenceVersion: anonymousSession.evidenceVersion,
        now,
      });
      if (!completed) {
        throw new ProgrammeStateConflictError("Mission 01 claim could not be completed");
      }
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

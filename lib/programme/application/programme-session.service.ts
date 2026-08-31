import {
  missionStateFromTaskCount,
  serialiseMissionState,
} from "@/lib/programme/contract";
import {
  ProgrammeResourceNotFoundError,
  ProgrammeSessionExpiredError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import { implementedMissionDefinition } from "@/lib/programme/domain/mission-registry";
import {
  assertMissionTasksComplete,
  mergedMissionTasks,
} from "@/lib/programme/domain/programme-state";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import { ProgrammeAccessService } from "@/lib/programme/application/programme-access.service";
import type { ProgrammeAccessAuthority } from "@/lib/programme/access-contract";
import {
  anonymousSessionLifetimeMs,
  createOpaqueToken,
  expiresAfter,
  hashOpaqueToken,
  pendingClaimLifetimeMs,
} from "@/lib/programme/security";
import { parseMissionOneDraft } from "@/lib/programme/validation";

function persistenceMissionStatus(value: ReturnType<typeof missionStateFromTaskCount>) {
  return value.toUpperCase() as "NOT_STARTED" | "IN_PROGRESS" | "READY_TO_SAVE";
}

export class ProgrammeSessionService {
  private readonly access: ProgrammeAccessService;

  constructor(private readonly unitOfWork = programmeUnitOfWork) {
    this.access = new ProgrammeAccessService(unitOfWork);
  }

  async createAnonymousSession(accessAuthority: ProgrammeAccessAuthority, now = new Date()) {
    const policy = implementedMissionDefinition(1).completion;
    const token = createOpaqueToken();
    const session = await this.unitOfWork.serializable(async (unitOfWork) => {
      const created = await unitOfWork.sessions.createAnonymousSession({
        tokenHash: hashOpaqueToken(token),
        missionVersion: policy.version,
        evidenceVersion: policy.evidenceVersion,
        expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
      });
      await this.access.acceptAnonymousSessionOnce(unitOfWork, created.id, accessAuthority);
      return created;
    });
    return {
      token,
      session: {
        state: serialiseMissionState(session.missionState),
        taskStates: session.taskStates,
        expiresAt: session.expiresAt.toISOString(),
        xpPreview: policy.xp,
      },
    };
  }

  async saveMissionOneDraft(token: string, value: unknown, now = new Date()) {
    const policy = implementedMissionDefinition(1).completion;
    const session = await this.requireAnonymousSession(this.unitOfWork, token, now);
    if (["REGISTRATION_REQUIRED", "COMPLETED"].includes(session.missionState)) {
      throw new ProgrammeStateConflictError("Mission 01 draft can no longer be changed");
    }
    const input = parseMissionOneDraft(value);
    const mergedTaskStates = mergedMissionTasks(
      session.taskStates,
      input.taskStates,
      policy.taskStates,
    );
    const state = missionStateFromTaskCount(
      mergedTaskStates.length,
      policy.taskStates.length,
    );
    const updated = await this.unitOfWork.sessions.updateAnonymousSession(session.id, {
      missionState: persistenceMissionStatus(state),
      taskStates: mergedTaskStates,
      draft: { contentStorage: "browser_session" },
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
      lastActivityAt: now,
    });
    return {
      state: serialiseMissionState(updated.missionState),
      taskStates: updated.taskStates,
      expiresAt: updated.expiresAt.toISOString(),
      xpPreview: policy.xp,
    };
  }

  async createPendingClaim(token: string, now = new Date()) {
    const policy = implementedMissionDefinition(1).completion;
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const session = await this.requireAnonymousSession(unitOfWork, token, now);
      assertMissionTasksComplete(session.taskStates, policy.taskStates);
      if (session.missionState !== "READY_TO_SAVE") {
        throw new ProgrammeStateConflictError("Mission 01 is not ready to save");
      }
      const claimToken = createOpaqueToken();
      const expiresAt = expiresAfter(now, pendingClaimLifetimeMs);
      const transition = await unitOfWork.sessions.transitionAnonymousSessionToRegistration(
        session.id,
        now,
      );
      if (transition.count !== 1) {
        throw new ProgrammeStateConflictError(
          "Mission 01 claim is already being created",
        );
      }
      await unitOfWork.sessions.upsertPendingClaim({
        anonymousSessionId: session.id,
        tokenHash: hashOpaqueToken(claimToken),
        expiresAt,
      });
      return { claimToken, expiresAt: expiresAt.toISOString() };
    });
  }

  private async requireAnonymousSession(
    unitOfWork: ProgrammeUnitOfWork,
    token: string,
    now: Date,
  ) {
    if (!token) throw new ProgrammeResourceNotFoundError("Anonymous programme session");
    const session = await unitOfWork.sessions.findAnonymousSession(hashOpaqueToken(token));
    if (!session || session.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Anonymous programme session");
    }
    if (session.expiresAt <= now) throw new ProgrammeSessionExpiredError();
    return session;
  }
}

export const programmeSessionService = new ProgrammeSessionService();

import { requireControlProgram } from "@/lib/programme/application/programme-context";
import {
  ClaimExpiredError,
  PendingProgrammeClaimUnavailableError,
  ProgrammeResourceNotFoundError,
  ProgrammeSessionExpiredError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import type { ProgrammeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import { localOnlyMomentMap } from "@/lib/programme/privacy";
import {
  anonymousProgramAiXp,
  PROGRAM_AI_EVIDENCE_VERSION,
  PROGRAM_AI_M1_VERSION,
  PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
  PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
  programAiMissionOneActions,
  type ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";
import { ProgrammeAiOrchestrator, programmeAiOrchestrator } from "@/lib/programme/program-ai/orchestration";
import { programAiMissionOneRewardPolicy } from "@/lib/programme/program-ai/reward-policy";
import {
  assertProgramAiV1Enabled,
  isProgramAiRealProviderEnabled,
} from "@/lib/programme/program-ai/runtime-config";
import { parseProgrammeAiTurn, parseStartingPoint } from "@/lib/programme/program-ai/validation";
import {
  anonymousSessionLifetimeMs,
  createOpaqueToken,
  dateOnlyUtc,
  expiresAfter,
  hashOpaqueToken,
  localDateAt,
  pendingClaimLifetimeMs,
} from "@/lib/programme/security";
import { parseTimeZone } from "@/lib/programme/validation";
import { ServiceError, ValidationError } from "@/lib/services/service-error";

function mergedActions(current: readonly string[], next: readonly string[]) {
  return [...new Set([...current, ...next])];
}

function structuralDraft(value: unknown) {
  const draft = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    inputMode: draft.inputMode === "voice" ? "voice" : "text",
    clarificationCount: typeof draft.clarificationCount === "number"
      ? Math.min(2, Math.max(0, draft.clarificationCount))
      : 0,
    providerCallCount: typeof draft.providerCallCount === "number"
      ? Math.min(3, Math.max(0, Math.trunc(draft.providerCallCount)))
      : 0,
    lifecycle: draft.lifecycle === "SUPPORT_FIRST" ? "SUPPORT_FIRST" : "INTAKE",
  };
}

export function resolveProgramAiClaimCompatibility(input: {
  missionOneStatus: string | null;
  hasHigherMissionProgress: boolean;
  hasStartingPoint: boolean;
}) {
  return input.missionOneStatus === "COMPLETED"
    || input.hasHigherMissionProgress
    || input.hasStartingPoint
    ? "AUTHENTICATED_PROGRESS_DOMINATES" as const
    : "PERSIST_NEW_PROGRAM_AI_RESULT" as const;
}

export class ProgrammeAiMissionOneService {
  constructor(
    private readonly unitOfWork = programmeUnitOfWork,
    private readonly orchestrator = programmeAiOrchestrator,
  ) {}

  async createAnonymousSession(now = new Date()) {
    assertProgramAiV1Enabled();
    const token = createOpaqueToken();
    const session = await this.unitOfWork.sessions.createAnonymousSession({
      tokenHash: hashOpaqueToken(token),
      missionVersion: PROGRAM_AI_M1_VERSION,
      evidenceVersion: PROGRAM_AI_EVIDENCE_VERSION,
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
    });
    return {
      token,
      session: {
        state: "not_started" as const,
        taskStates: session.taskStates,
        expiresAt: session.expiresAt.toISOString(),
        xpPreview: 0,
      },
    };
  }

  async authorityStatus(token: string, now = new Date()) {
    assertProgramAiV1Enabled();
    const session = await this.requireSession(this.unitOfWork, token, now);
    const authority = await this.unitOfWork.programAiMissionOne.findActiveAnonymousAuthority({
      anonymousSessionId: session.id,
      purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
      statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
    });
    return {
      active: Boolean(authority),
      confirmedAt: authority?.confirmedAt.toISOString() ?? null,
      purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
      statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
    };
  }

  async confirmAuthority(token: string, value: unknown, now = new Date()) {
    assertProgramAiV1Enabled();
    const body = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
    const keys = Object.keys(body);
    if (keys.some((key) => !["confirmed", "purposeVersion", "statementVersion"].includes(key))) {
      throw new ValidationError("Sensitive-input authority contains unsupported fields");
    }
    if (
      body.confirmed !== true
      || body.purposeVersion !== PROGRAM_AI_SENSITIVE_PURPOSE_VERSION
      || body.statementVersion !== PROGRAM_AI_SENSITIVE_STATEMENT_VERSION
    ) {
      throw new ValidationError("Current sensitive-input authority must be confirmed explicitly");
    }
    const session = await this.requireSession(this.unitOfWork, token, now);
    const authority = await this.unitOfWork.programAiMissionOne.confirmAnonymousAuthority({
      anonymousSessionId: session.id,
      purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
      statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
      confirmedAt: now,
    });
    return { active: true, confirmedAt: authority.confirmedAt.toISOString() };
  }

  async withdrawAuthority(token: string, now = new Date()) {
    assertProgramAiV1Enabled();
    const session = await this.requireSession(this.unitOfWork, token, now);
    await this.unitOfWork.programAiMissionOne.withdrawAnonymousAuthority(session.id, now);
    return { active: false };
  }

  async createTurn(
    token: string,
    value: unknown,
    now = new Date(),
    providerAllowedByRateLimit = true,
  ) {
    assertProgramAiV1Enabled();
    const input = parseProgrammeAiTurn(value);
    const providerConfigured = isProgramAiRealProviderEnabled();
    const reserveProviderCall = providerConfigured && providerAllowedByRateLimit;
    const reservation = await this.unitOfWork.serializable(async (unitOfWork) => {
      const session = await this.requireSession(unitOfWork, token, now);
      await this.requireAuthority(session.id, unitOfWork);
      const draft = structuralDraft(session.draft);
      const providerAllowed = reserveProviderCall && draft.providerCallCount < 3;
      const taskStates = mergedActions(session.taskStates, [programAiMissionOneActions[0]]);
      await unitOfWork.sessions.updateAnonymousSession(session.id, {
        missionState: "IN_PROGRESS",
        taskStates,
        draft: {
          ...draft,
          inputMode: input.inputMode,
          providerCallCount: reserveProviderCall && providerAllowed
            ? draft.providerCallCount + 1
            : draft.providerCallCount,
        },
        expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
        lastActivityAt: now,
      });
      return {
        sessionId: session.id,
        providerAllowed,
        situationFirstAccepted: !session.taskStates.includes(programAiMissionOneActions[0]),
        taskStates,
      };
    });

    // The unrestricted input exists only in this call and the configured port.
    // Provider work runs after the metadata-only reservation and outside every database transaction.
    const generation = reservation.providerAllowed
      ? await this.orchestrator.createTurnWithOutcome(input)
      : await new ProgrammeAiOrchestrator(null).createTurnWithOutcome(input);
    const result = generation.result;
    await this.unitOfWork.serializable(async (unitOfWork) => {
      const session = await this.requireSession(unitOfWork, token, now);
      const currentDraft = structuralDraft(session.draft);
      await unitOfWork.sessions.updateAnonymousSession(session.id, {
        missionState: "IN_PROGRESS",
        taskStates: mergedActions(session.taskStates, reservation.taskStates),
        draft: {
          ...currentDraft,
          inputMode: input.inputMode,
          clarificationCount: 0,
          lifecycle: result.disposition === "SUPPORT_FIRST" ? "SUPPORT_FIRST" : "INTAKE",
        },
        expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
        lastActivityAt: now,
      });
    });
    return {
      result,
      progress: {
        taskStates: reservation.taskStates,
        xpPreview: anonymousProgramAiXp(reservation.taskStates),
      },
      inputMode: input.inputMode,
      situationFirstAccepted: reservation.situationFirstAccepted,
      providerOutcome: generation.providerOutcome,
    };
  }

  async continueAfterSupport(token: string, now = new Date()) {
    assertProgramAiV1Enabled();
    const session = await this.requireSession(this.unitOfWork, token, now);
    await this.requireAuthority(session.id);
    const draft = structuralDraft(session.draft);
    await this.unitOfWork.sessions.updateAnonymousSession(session.id, {
      missionState: session.missionState === "NOT_STARTED" ? "IN_PROGRESS" : session.missionState,
      taskStates: session.taskStates,
      draft: { ...draft, lifecycle: "INTAKE" },
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
      lastActivityAt: now,
    });
    return { disposition: "CONTINUE" as const };
  }

  async confirmStartingPoint(token: string, value: unknown, now = new Date()) {
    assertProgramAiV1Enabled();
    const startingPoint = parseStartingPoint(value);
    const session = await this.requireSession(this.unitOfWork, token, now);
    await this.requireAuthority(session.id);
    if (structuralDraft(session.draft).lifecycle === "SUPPORT_FIRST") {
      throw new ProgrammeStateConflictError("Continue from the support-first screen before confirming a Starting Point");
    }
    if (!session.taskStates.includes(programAiMissionOneActions[0])) {
      throw new ProgrammeStateConflictError("A situation must be submitted before confirming a Starting Point");
    }
    const taskStates = mergedActions(session.taskStates, [programAiMissionOneActions[1]]);
    await this.unitOfWork.sessions.updateAnonymousSession(session.id, {
      missionState: "READY_TO_SAVE",
      taskStates,
      draft: {
        ...structuralDraft(session.draft),
        lifecycle: "READY_TO_SAVE",
        confirmedContentStorage: "browser_session",
      },
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
      lastActivityAt: now,
    });
    return {
      state: "ready_to_save" as const,
      taskStates,
      xpPreview: anonymousProgramAiXp(taskStates),
      startingPoint,
    };
  }

  createPendingClaim(token: string, now = new Date()) {
    assertProgramAiV1Enabled();
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const session = await this.requireSession(unitOfWork, token, now);
      await this.requireAuthority(session.id, unitOfWork);
      if (
        session.missionState !== "READY_TO_SAVE"
        || !programAiMissionOneActions.every((action) => session.taskStates.includes(action))
      ) {
        throw new ProgrammeStateConflictError("Program AI Mission 01 is not ready to save");
      }
      const claimToken = createOpaqueToken();
      const expiresAt = expiresAfter(now, pendingClaimLifetimeMs);
      const transitioned = await unitOfWork.sessions.transitionAnonymousSessionToRegistration(session.id, now);
      if (transitioned.count !== 1) {
        throw new ProgrammeStateConflictError("Program AI Mission 01 claim is already being created");
      }
      await unitOfWork.sessions.upsertPendingClaim({
        anonymousSessionId: session.id,
        tokenHash: hashOpaqueToken(claimToken),
        expiresAt,
      });
      return { claimToken, expiresAt: expiresAt.toISOString() };
    });
  }

  redeemPendingClaim(
    userId: string,
    claimToken: string,
    input: { timeZone: unknown; startingPoint: unknown },
    now = new Date(),
  ) {
    assertProgramAiV1Enabled();
    const timeZone = parseTimeZone(input.timeZone);
    const startingPoint = parseStartingPoint(input.startingPoint);
    return this.unitOfWork.serializable(async (unitOfWork) => {
      const claim = await unitOfWork.sessions.findClaim(hashOpaqueToken(claimToken));
      if (!claim) throw new PendingProgrammeClaimUnavailableError();
      if (claim.consumedAt) {
        if (claim.consumedByUserId !== userId) {
          throw new ProgrammeStateConflictError("Pending programme claim belongs to another account");
        }
        return {
          home: await this.projectHome(unitOfWork, userId),
          claimRedeemed: false,
        };
      }
      if (claim.expiresAt <= now) throw new ClaimExpiredError();
      const anonymousSession = claim.anonymousSession;
      if (
        anonymousSession.deletedAt
        || anonymousSession.expiresAt <= now
        || anonymousSession.missionState !== "REGISTRATION_REQUIRED"
        || !programAiMissionOneActions.every((action) => anonymousSession.taskStates.includes(action))
      ) {
        throw new ProgrammeStateConflictError("Anonymous Program AI Mission 01 result is unavailable");
      }
      await this.requireAuthority(anonymousSession.id, unitOfWork);
      const source = await requireControlProgram(unitOfWork);
      let enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
      if (!enrollment) {
        enrollment = await unitOfWork.progress.getOrCreateEnrollment({
          userId,
          programId: source.program.id,
          programVersionId: source.version.id,
          currentStepId: source.program.steps[1].id,
          timezone: timeZone,
        });
      }
      const [missionOne, higherMission, existingStartingPoint] = await Promise.all([
        unitOfWork.progress.findMissionProgress(enrollment.id, 1),
        unitOfWork.programAiMissionOne.findHigherMissionProgress(enrollment.id),
        unitOfWork.programAiMissionOne.findStartingPoint(userId),
      ]);
      const authenticatedProgressDominates = resolveProgramAiClaimCompatibility({
        missionOneStatus: missionOne?.status ?? null,
        hasHigherMissionProgress: Boolean(higherMission),
        hasStartingPoint: Boolean(existingStartingPoint),
      }) === "AUTHENTICATED_PROGRESS_DOMINATES";
      const consumed = await unitOfWork.sessions.consumeClaim(claim.id, userId, now);
      if (consumed.count !== 1) {
        throw new ProgrammeStateConflictError("Pending programme claim is no longer available");
      }

      await unitOfWork.programAiMissionOne.bindAnonymousAuthorityToUser({
        anonymousSessionId: anonymousSession.id,
        userId,
        purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
        statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
      });

      if (!authenticatedProgressDominates) {
        const allTaskStates = mergedActions(missionOne?.taskStates ?? [], programAiMissionOneActions);
        const completedProgress = await unitOfWork.progress.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 1,
          status: "COMPLETED",
          taskStates: allTaskStates,
          draft: null,
          completedAt: now,
        });
        const persistedStartingPoint = await unitOfWork.programAiMissionOne.createStartingPoint({
          userId,
          enrollmentId: enrollment.id,
          value: startingPoint,
          confirmedAt: now,
          version: PROGRAM_AI_M1_VERSION,
        });
        let momentMap = await unitOfWork.artefacts.findMomentMap(enrollment.id);
        if (!momentMap) {
          momentMap = await unitOfWork.artefacts.createMomentMap({
            enrollmentId: enrollment.id,
            ...localOnlyMomentMap,
            missionVersion: PROGRAM_AI_M1_VERSION,
            evidenceVersion: PROGRAM_AI_EVIDENCE_VERSION,
          });
        }
        await unitOfWork.progress.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 2,
          status: "IN_PROGRESS",
          taskStates: [],
          draft: null,
          completedAt: null,
        });
        await unitOfWork.progress.setEnrollmentCurrentStep(enrollment.id, source.program.steps[1].id);
        await unitOfWork.progress.setEnrollmentTimezone(enrollment.id, timeZone);
        await unitOfWork.rewards.recordProgressEvent({
          enrollmentId: enrollment.id,
          entityId: source.program.steps[0].id,
          eventKey: "programme:m01:complete:program-ai-01:v1",
          eventType: "COMPLETED",
        });
        await unitOfWork.rewards.recordProgrammeAiXp({
          userId,
          programId: source.program.id,
          missionNumber: 1,
          xp: programAiMissionOneRewardPolicy.situationSubmitted.xp,
          awardKey: programAiMissionOneRewardPolicy.situationSubmitted.awardKey,
          sourceArtifactType: programAiMissionOneRewardPolicy.situationSubmitted.sourceArtifactType,
          sourceArtifactId: completedProgress.id,
        });
        await unitOfWork.rewards.recordProgrammeAiXp({
          userId,
          programId: source.program.id,
          missionNumber: 1,
          xp: programAiMissionOneRewardPolicy.startingPointComplete.xp,
          awardKey: programAiMissionOneRewardPolicy.startingPointComplete.awardKey,
          sourceArtifactType: programAiMissionOneRewardPolicy.startingPointComplete.sourceArtifactType,
          sourceArtifactId: persistedStartingPoint.id,
        });
        await unitOfWork.rewards.recordActiveDay({
          userId,
          enrollmentId: enrollment.id,
          localDate: dateOnlyUtc(localDateAt(now, timeZone)),
          timezone: timeZone,
          sourceEventKey: programAiMissionOneRewardPolicy.startingPointComplete.awardKey,
          eligibleActivityAt: now,
        });
        void momentMap;
      }
      await unitOfWork.sessions.completeAnonymousSession(anonymousSession.id, now);
      return {
        home: await this.projectHome(unitOfWork, userId),
        claimRedeemed: true,
      };
    });
  }

  async home(userId: string) {
    assertProgramAiV1Enabled();
    return this.unitOfWork.snapshot((unitOfWork) => this.projectHome(unitOfWork, userId));
  }

  private async projectHome(unitOfWork: ProgrammeUnitOfWork, userId: string) {
    const source = await requireControlProgram(unitOfWork);
    const { enrollment, totalXp } = await unitOfWork.programAiMissionOne.home(userId, source.program.id);
    if (!enrollment) {
      return { totalXp, currentMission: 1, startingPoint: null, missions: [], reviews: [] };
    }
    const progress = new Map(enrollment.missionProgress.map((mission) => [mission.missionNumber, mission]));
    const completed = (mission: number) => progress.get(mission)?.status === "COMPLETED";
    const currentMission = Math.min(10, Math.max(1,
      enrollment.missionProgress.find((mission) => mission.status !== "COMPLETED")?.missionNumber
        ?? (Math.max(0, ...enrollment.missionProgress.map((mission) => mission.missionNumber)) + 1),
    ));
    return {
      totalXp,
      currentMission,
      startingPoint: enrollment.programmeStartingPoint
        ? {
            startingPoint: enrollment.programmeStartingPoint.startingPoint,
            desiredChange: enrollment.programmeStartingPoint.desiredChange,
            broadContext: enrollment.programmeStartingPoint.broadContext,
            continuationCue: enrollment.programmeStartingPoint.continuationCue,
            chosenBoundaryAction: enrollment.programmeStartingPoint.chosenBoundaryAction,
          }
        : null,
      missions: Array.from({ length: 10 }, (_, index) => {
        const missionNumber = index + 1;
        return {
          missionNumber,
          status: completed(missionNumber)
            ? "completed"
            : missionNumber === currentMission ? "current" : "locked",
        };
      }),
      reviews: [3, 6, 10].map((missionNumber) => ({
        missionNumber,
        status: completed(missionNumber) ? "available" : "locked",
      })),
    };
  }

  private async requireAuthority(
    anonymousSessionId: string,
    unitOfWork = this.unitOfWork,
  ) {
    const authority = await unitOfWork.programAiMissionOne.findActiveAnonymousAuthority({
      anonymousSessionId,
      purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
      statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
    });
    if (!authority) {
      throw new ServiceError(
        "Confirm the narrow sensitive-input authority before sharing a situation",
        "SENSITIVE_INPUT_AUTHORITY_REQUIRED",
        403,
      );
    }
    return authority;
  }

  private async requireSession(
    unitOfWork: ProgrammeUnitOfWork,
    token: string,
    now: Date,
  ) {
    if (!token) throw new ProgrammeResourceNotFoundError("Anonymous programme session");
    const session = await unitOfWork.sessions.findAnonymousSession(hashOpaqueToken(token));
    if (!session || session.deletedAt || session.missionVersion !== PROGRAM_AI_M1_VERSION) {
      throw new ProgrammeResourceNotFoundError("Anonymous programme session");
    }
    if (session.expiresAt <= now) throw new ProgrammeSessionExpiredError();
    return session;
  }
}

export const programmeAiMissionOneService = new ProgrammeAiMissionOneService();

export type ProgrammeAiMissionOneTestResult = ProgrammeAiTurnResult;

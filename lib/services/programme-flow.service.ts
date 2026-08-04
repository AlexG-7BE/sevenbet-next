import { Prisma, type GoalDirection, type GoalStatus } from "@prisma/client";

import {
  CONTROL_PROGRAM_SLUG,
  EVIDENCE_CONTENT_VERSION,
  MISSION_ONE_VERSION,
  controlProgrammePath,
  missionOneTaskStates,
  missionStateFromTaskCount,
  missionTwoStages,
  missionTwoTaskStates,
  programmeEvidence,
  serialiseMissionState,
} from "@/lib/programme/contract";
import {
  activeDayStreak,
  anonymousSessionLifetimeMs,
  createOpaqueToken,
  dateOnlyUtc,
  expiresAfter,
  hashOpaqueToken,
  localDateAt,
  pendingClaimLifetimeMs,
} from "@/lib/programme/security";
import {
  assertCompleteTasks,
  parseCurrentGoal,
  parseMissionOneDraft,
  parseMissionTwoDraft,
  parseMomentMap,
  parseTimeZone,
} from "@/lib/programme/validation";
import {
  ProgrammeFlowRepository,
  programmeFlowRepository,
} from "@/lib/repositories/programme-flow.repository";

import {
  ConflictError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "./service-error";

const missionOneAwardKey = "programme:mission:01:save:v1";
const missionTwoAwardKey = "programme:mission:02:save:v1";

function missionStatus(value: ReturnType<typeof missionStateFromTaskCount>) {
  return value.toUpperCase() as
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "READY_TO_SAVE";
}

function goalDirection(value: string) {
  return value.toUpperCase() as GoalDirection;
}

function goalStatus(value: string) {
  return value.toUpperCase() as GoalStatus;
}

function jsonGoal(value: ReturnType<typeof parseCurrentGoal>) {
  return {
    ...value,
    ...(value.reviewAt ? { reviewAt: value.reviewAt.toISOString() } : {}),
  } as Prisma.InputJsonObject;
}

function assertProgrammeShape(
  source: NonNullable<Awaited<ReturnType<ProgrammeFlowRepository["findControlProgram"]>>>,
) {
  if (source.program.steps.length < 10) {
    throw new ConflictError("Published Control Program must contain ten missions");
  }
  return source;
}

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function withSerializableRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error)) throw error;
    }
  }
  throw lastError;
}

export class ProgrammeFlowService {
  constructor(private readonly repository = programmeFlowRepository) {}

  async createAnonymousSession(now = new Date()) {
    const token = createOpaqueToken();
    const session = await this.repository.createAnonymousSession({
      tokenHash: hashOpaqueToken(token),
      missionVersion: MISSION_ONE_VERSION,
      evidenceVersion: EVIDENCE_CONTENT_VERSION,
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
    });
    return {
      token,
      session: {
        state: serialiseMissionState(session.missionState),
        taskStates: session.taskStates,
        expiresAt: session.expiresAt.toISOString(),
        xpPreview: 60,
      },
    };
  }

  async saveMissionOneDraft(token: string, value: unknown, now = new Date()) {
    const session = await this.requireAnonymousSession(token, now);
    if (["REGISTRATION_REQUIRED", "COMPLETED"].includes(session.missionState)) {
      throw new ConflictError("Mission 01 draft can no longer be changed");
    }
    const input = parseMissionOneDraft(value);
    const previousDraft =
      session.draft && typeof session.draft === "object" && !Array.isArray(session.draft)
        ? session.draft as Record<string, unknown>
        : {};
    const mergedDraft = { ...previousDraft, ...input.momentMap };
    const mergedTaskStates = missionOneTaskStates.filter(
      (task) => session.taskStates.includes(task) || input.taskStates.includes(task),
    );
    const completeTasks = mergedTaskStates.length === missionOneTaskStates.length;
    if (completeTasks) parseMomentMap(mergedDraft, true);
    const state = missionStateFromTaskCount(mergedTaskStates.length, missionOneTaskStates.length);
    const updated = await this.repository.updateAnonymousSession(session.id, {
      missionState: missionStatus(state),
      taskStates: mergedTaskStates,
      draft: mergedDraft as Prisma.InputJsonObject,
      expiresAt: expiresAfter(now, anonymousSessionLifetimeMs),
      lastActivityAt: now,
    });
    return {
      state: serialiseMissionState(updated.missionState),
      taskStates: updated.taskStates,
      expiresAt: updated.expiresAt.toISOString(),
      xpPreview: 60,
    };
  }

  async createPendingClaim(token: string, now = new Date()) {
    const session = await this.requireAnonymousSession(token, now);
    assertCompleteTasks(session.taskStates, missionOneTaskStates);
    parseMomentMap(session.draft ?? {}, true);
    if (session.missionState !== "READY_TO_SAVE") {
      throw new ConflictError("Mission 01 is not ready to save");
    }
    const claimToken = createOpaqueToken();
    const expiresAt = expiresAfter(now, pendingClaimLifetimeMs);
    await this.repository.transaction(async (repository) => {
      const transition = await repository.transitionAnonymousSessionToRegistration(
        session.id,
        now,
      );
      if (transition.count !== 1) {
        throw new ConflictError("Mission 01 claim is already being created");
      }
      await repository.upsertPendingClaim({
        anonymousSessionId: session.id,
        tokenHash: hashOpaqueToken(claimToken),
        expiresAt,
      });
    });
    return { claimToken, expiresAt: expiresAt.toISOString() };
  }

  async redeemPendingClaim(
    userId: string,
    claimToken: string,
    timeZoneValue: unknown,
    now = new Date(),
  ) {
    const timeZone = parseTimeZone(timeZoneValue);
    return withSerializableRetry(() =>
      this.repository.transaction(async (repository) => {
        const claim = await repository.findClaim(hashOpaqueToken(claimToken));
        if (!claim) throw new NotFoundError("Pending programme claim");
        if (claim.consumedAt) {
          throw new ConflictError("Pending programme claim has already been used");
        }
        if (claim.expiresAt <= now) {
          throw new ServiceError(
            "Pending programme claim has expired",
            "CLAIM_EXPIRED",
            410,
          );
        }
        const anonymousSession = claim.anonymousSession;
        if (
          anonymousSession.deletedAt ||
          anonymousSession.expiresAt <= now ||
          anonymousSession.missionState !== "REGISTRATION_REQUIRED"
        ) {
          throw new ConflictError("Anonymous Mission 01 result is unavailable");
        }
        assertCompleteTasks(anonymousSession.taskStates, missionOneTaskStates);
        const momentMapInput = parseMomentMap(anonymousSession.draft ?? {}, true);
        const source = await this.requireControlProgram(repository);
        let enrollment = await repository.findEnrollment(userId, source.program.id);
        if (enrollment) {
          const existingMission = await repository.findMissionProgress(enrollment.id, 1);
          if (existingMission?.status === "COMPLETED") {
            throw new ConflictError("Mission 01 is already completed for this account");
          }
        } else {
          enrollment = await repository.getOrCreateEnrollment({
            userId,
            programId: source.program.id,
            programVersionId: source.version.id,
            currentStepId: source.program.steps[1].id,
            timezone: timeZone,
          });
        }
        const claimed = await repository.consumeClaim(claim.id, userId, now);
        if (claimed.count !== 1) {
          throw new ConflictError("Pending programme claim is no longer available");
        }
        const momentMap = await repository.createMomentMap({
          enrollmentId: enrollment.id,
          ...momentMapInput,
          missionVersion: anonymousSession.missionVersion,
          evidenceVersion: anonymousSession.evidenceVersion,
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 1,
          status: "COMPLETED",
          taskStates: [...missionOneTaskStates],
          draft: Prisma.JsonNull,
          completedAt: now,
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 2,
          status: "IN_PROGRESS",
          taskStates: [],
          draft: Prisma.JsonNull,
          completedAt: null,
        });
        await repository.setEnrollmentCurrentStep(enrollment.id, source.program.steps[1].id);
        await repository.recordProgressEvent({
          enrollmentId: enrollment.id,
          entityId: source.program.steps[0].id,
          eventKey: `step:${source.program.steps[0].id}:completed`,
        });
        await repository.recordMissionXp({
          userId,
          programId: source.program.id,
          missionNumber: 1,
          xp: 60,
          awardKey: missionOneAwardKey,
          sourceArtifactType: "MOMENT_MAP",
          sourceArtifactId: momentMap.id,
        });
        await repository.recordActiveDay({
          userId,
          enrollmentId: enrollment.id,
          localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
          timezone: enrollment.timezone,
          sourceEventKey: missionOneAwardKey,
          eligibleActivityAt: now,
        });
        await repository.completeAnonymousSession(anonymousSession.id, now);
        return this.dashboardFrom(repository, userId, source.program.id);
      }),
    );
  }

  async getDashboard(userId: string) {
    const source = await this.requireControlProgram(this.repository);
    return this.dashboardFrom(this.repository, userId, source.program.id);
  }

  async getMissionTwoDraft(userId: string) {
    const { source, enrollment } = await this.requireEnrollment(userId);
    const progress = await this.repository.findMissionProgress(enrollment.id, 2);
    if (!progress) throw new NotFoundError("Mission 02 progress");
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

  async saveMissionTwoDraft(userId: string, value: unknown) {
    const { enrollment } = await this.requireEnrollment(userId);
    const missionOne = await this.repository.findMissionProgress(enrollment.id, 1);
    if (missionOne?.status !== "COMPLETED") {
      throw new ConflictError("Mission 01 must be completed before Mission 02");
    }
    const existing = await this.repository.findMissionProgress(enrollment.id, 2);
    if (existing?.status === "COMPLETED") {
      throw new ConflictError("Mission 02 is already completed");
    }
    const input = parseMissionTwoDraft(value);
    const mergedTaskStates = missionTwoTaskStates.filter(
      (task) => existing?.taskStates.includes(task) || input.taskStates.includes(task),
    );
    const state = mergedTaskStates.length === missionTwoTaskStates.length
      ? "READY_TO_SAVE"
      : "IN_PROGRESS";
    const previousDraft =
      existing?.draft && typeof existing.draft === "object" && !Array.isArray(existing.draft)
        ? existing.draft as { currentGoal?: Record<string, unknown> }
        : {};
    const mergedGoal = {
      ...(previousDraft.currentGoal ?? {}),
      ...jsonGoal(input.currentGoal),
    } as Prisma.InputJsonObject;
    const saved = await this.repository.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 2,
      status: state,
      taskStates: mergedTaskStates,
      draft: { currentGoal: mergedGoal },
    });
    if (saved.count !== 1) {
      throw new ConflictError("Mission 02 draft can no longer be changed");
    }
    const progress = await this.repository.findMissionProgress(enrollment.id, 2);
    if (!progress) throw new NotFoundError("Mission 02 progress");
    return {
      missionNumber: 2,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionTwoStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  async completeMissionTwo(userId: string, now = new Date()) {
    return withSerializableRetry(() =>
      this.repository.transaction(async (repository) => {
        const source = await this.requireControlProgram(repository);
        const enrollment = await repository.findEnrollment(userId, source.program.id);
        if (!enrollment) throw new NotFoundError("Program enrollment");
        const progress = await repository.findMissionProgress(enrollment.id, 2);
        if (progress?.status === "COMPLETED") {
          return this.dashboardFrom(repository, userId, source.program.id);
        }
        if (!progress) throw new NotFoundError("Mission 02 progress");
        assertCompleteTasks(progress.taskStates, missionTwoTaskStates);
        const stored = progress.draft as { currentGoal?: unknown } | null;
        const currentGoalInput = parseCurrentGoal(stored?.currentGoal ?? {}, {
          complete: true,
          now,
        });
        const momentMap = await repository.findMomentMap(enrollment.id);
        if (!momentMap || momentMap.deletedAt) {
          throw new ConflictError("An active Moment Map is required for Mission 02");
        }
        if (currentGoalInput.sourceMomentMapId !== momentMap.id) {
          throw new ValidationError("Current Goal must reference the account Moment Map");
        }
        const goal = await repository.upsertCurrentGoal({
          enrollmentId: enrollment.id,
          sourceMomentMapId: momentMap.id,
          direction: goalDirection(currentGoalInput.direction!),
          action: currentGoalInput.action!,
          triggerOrSituation: currentGoalInput.triggerOrSituation!,
          alternativeAction: currentGoalInput.alternativeAction!,
          successSignal: currentGoalInput.successSignal!,
          reviewAt: currentGoalInput.reviewAt!,
          confidence: currentGoalInput.confidence!,
          confidenceAdjustment: currentGoalInput.confidenceAdjustment!,
          status: goalStatus(currentGoalInput.status!),
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 2,
          status: "COMPLETED",
          taskStates: [...missionTwoTaskStates],
          draft: Prisma.JsonNull,
          completedAt: now,
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 3,
          status: "IN_PROGRESS",
          taskStates: [],
          draft: Prisma.JsonNull,
          completedAt: null,
        });
        await repository.setEnrollmentCurrentStep(enrollment.id, source.program.steps[2].id);
        await repository.recordProgressEvent({
          enrollmentId: enrollment.id,
          entityId: source.program.steps[1].id,
          eventKey: `step:${source.program.steps[1].id}:completed`,
        });
        await repository.recordMissionXp({
          userId,
          programId: source.program.id,
          missionNumber: 2,
          xp: 80,
          awardKey: missionTwoAwardKey,
          sourceArtifactType: "CURRENT_GOAL",
          sourceArtifactId: goal.id,
        });
        const achievement = await repository.findFirstPlanAchievement();
        if (!achievement) throw new ConflictError("First Plan achievement is unavailable");
        await repository.unlockAchievement({
          userId,
          achievementId: achievement.id,
          awardKey: "achievement:first-plan:mission-02:v1",
        });
        await repository.recordActiveDay({
          userId,
          enrollmentId: enrollment.id,
          localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
          timezone: enrollment.timezone,
          sourceEventKey: missionTwoAwardKey,
          eligibleActivityAt: now,
        });
        return this.dashboardFrom(repository, userId, source.program.id);
      }),
    );
  }

  async updateMomentMap(userId: string, value: unknown) {
    const { enrollment } = await this.requireEnrollment(userId);
    const momentMap = await this.repository.findMomentMap(enrollment.id);
    if (!momentMap || momentMap.deletedAt) throw new NotFoundError("Moment Map");
    const data = parseMomentMap(value, false);
    if (!Object.keys(data).length) throw new ValidationError("At least one Moment Map field is required");
    const updated = await this.repository.updateMomentMap(momentMap.id, data);
    return this.momentMapDto(updated);
  }

  async deleteMomentMap(userId: string, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const momentMap = await this.repository.findMomentMap(enrollment.id);
    if (!momentMap || momentMap.deletedAt) throw new NotFoundError("Moment Map");
    await this.repository.eraseMomentMap(momentMap.id, now);
  }

  async updateCurrentGoal(userId: string, value: unknown, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const currentGoal = await this.repository.findCurrentGoal(enrollment.id);
    if (!currentGoal || currentGoal.deletedAt) throw new NotFoundError("Current Goal");
    const input = parseCurrentGoal(value, { now });
    if (input.sourceMomentMapId && input.sourceMomentMapId !== currentGoal.sourceMomentMapId) {
      throw new ValidationError("sourceMomentMapId cannot be changed");
    }
    const data = {
      ...(input.direction ? { direction: goalDirection(input.direction) } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.triggerOrSituation ? { triggerOrSituation: input.triggerOrSituation } : {}),
      ...(input.alternativeAction ? { alternativeAction: input.alternativeAction } : {}),
      ...(input.successSignal ? { successSignal: input.successSignal } : {}),
      ...(input.reviewAt ? { reviewAt: input.reviewAt } : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
      ...(input.confidenceAdjustment ? { confidenceAdjustment: input.confidenceAdjustment } : {}),
      ...(input.status ? { status: goalStatus(input.status) } : {}),
    };
    if (!Object.keys(data).length) throw new ValidationError("At least one Current Goal field is required");
    const updated = await this.repository.updateCurrentGoal(currentGoal.id, data);
    return this.currentGoalDto(updated);
  }

  async deleteCurrentGoal(userId: string, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const currentGoal = await this.repository.findCurrentGoal(enrollment.id);
    if (!currentGoal || currentGoal.deletedAt) throw new NotFoundError("Current Goal");
    await this.repository.eraseCurrentGoal(currentGoal.id, now);
  }

  async getRewards(userId: string) {
    const source = await this.requireControlProgram(this.repository);
    const dashboard = await this.dashboardFrom(this.repository, userId, source.program.id);
    return {
      totalXp: dashboard.totalXp,
      ledger: dashboard.rewardLedger,
      achievements: dashboard.achievements,
      activeDays: dashboard.activeDays,
      currentStreak: dashboard.currentStreak,
    };
  }

  async voidActiveDay(
    actor: { id: string; role: string },
    activeDayId: string,
    reasonValue: unknown,
    now = new Date(),
  ) {
    if (actor.role !== "SUPER_ADMIN") {
      throw new ServiceError("SUPER_ADMIN access required", "STAFF_PERMISSION_REQUIRED", 403);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activeDayId)) {
      throw new ValidationError("activeDayId must be a valid UUID");
    }
    if (typeof reasonValue !== "string" || reasonValue.trim().length < 10 || reasonValue.trim().length > 500) {
      throw new ValidationError("reason must contain 10-500 characters");
    }
    const result = await this.repository.voidActiveDay({
      activeDayId,
      adminUserId: actor.id,
      reason: reasonValue.trim(),
      voidedAt: now,
    });
    if (result.count !== 1) throw new NotFoundError("Active day");
  }

  private async requireAnonymousSession(token: string, now: Date) {
    if (!token) throw new NotFoundError("Anonymous programme session");
    const session = await this.repository.findAnonymousSession(hashOpaqueToken(token));
    if (!session || session.deletedAt) throw new NotFoundError("Anonymous programme session");
    if (session.expiresAt <= now) {
      throw new ServiceError(
        "Anonymous programme session has expired",
        "SESSION_EXPIRED",
        410,
      );
    }
    return session;
  }

  private async requireControlProgram(repository: ProgrammeFlowRepository) {
    const source = await repository.findControlProgram();
    if (!source) {
      throw new NotFoundError("Published Control Program", {
        slug: CONTROL_PROGRAM_SLUG,
      });
    }
    return assertProgrammeShape(source);
  }

  private async requireEnrollment(userId: string) {
    const source = await this.requireControlProgram(this.repository);
    const enrollment = await this.repository.findEnrollment(userId, source.program.id);
    if (!enrollment) throw new NotFoundError("Program enrollment");
    return { source, enrollment };
  }

  private async dashboardFrom(
    repository: ProgrammeFlowRepository,
    userId: string,
    programId: string,
  ) {
    const [enrollment, xpEvents, achievementRows] =
      await repository.findDashboardData(userId, programId);
    if (!enrollment) throw new NotFoundError("Program enrollment");
    const completed = new Set(
      enrollment.missionProgress
        .filter((mission) => mission.status === "COMPLETED")
        .map((mission) => mission.missionNumber),
    );
    const currentMission =
      enrollment.missionProgress.find((mission) => mission.status !== "COMPLETED")
        ?.missionNumber ?? Math.min(completed.size + 1, 10);
    const activeDates = enrollment.activeDays.map((day) =>
      day.localDate.toISOString().slice(0, 10),
    );
    const firstPlan = achievementRows[0];
    return {
      programId,
      totalXp: xpEvents.reduce((total, event) => total + event.xp, 0),
      currentMission,
      missions: controlProgrammePath.map((title, index) => {
        const missionNumber = index + 1;
        return {
          missionNumber,
          title,
          status: completed.has(missionNumber)
            ? "completed"
            : missionNumber === currentMission
              ? "current"
              : "locked",
        };
      }),
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
      ],
      momentMap:
        enrollment.momentMap && !enrollment.momentMap.deletedAt
          ? this.momentMapDto(enrollment.momentMap)
          : null,
      currentGoal:
        enrollment.currentGoal && !enrollment.currentGoal.deletedAt
          ? this.currentGoalDto(enrollment.currentGoal)
          : null,
      evidence: {
        mission01: programmeEvidence.mission01,
        mission02: programmeEvidence.mission02,
      },
      rewardLedger: xpEvents.map((event) => ({
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

  private momentMapDto(value: {
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
      situation: value.situation,
      cues: value.cues,
      thoughtOrFeeling: value.thoughtOrFeeling,
      response: value.response,
      immediateConsequence: value.immediateConsequence,
      noticeRule: value.noticeRule,
      neutralFlags: value.neutralFlags,
      notSureFlags: value.notSureFlags,
      missionVersion: value.missionVersion,
      evidenceVersion: value.evidenceVersion,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }

  private currentGoalDto(value: {
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
      action: value.action,
      triggerOrSituation: value.triggerOrSituation,
      alternativeAction: value.alternativeAction,
      successSignal: value.successSignal,
      reviewAt: value.reviewAt.toISOString(),
      confidence: value.confidence,
      confidenceAdjustment: value.confidenceAdjustment,
      status: value.status.toLowerCase(),
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }
}

export const programmeFlowService = new ProgrammeFlowService();

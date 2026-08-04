import {
  type BoundaryCategory,
  type BoundaryStatus,
  Prisma,
  type EarlySignalCategory,
  type GoalDirection,
  type GoalStatus,
} from "@prisma/client";

import {
  CONTROL_PROGRAM_SLUG,
  EVIDENCE_CONTENT_VERSION,
  MISSION_FOUR_EVIDENCE_VERSION,
  MISSION_FOUR_VERSION,
  MISSION_ONE_VERSION,
  MISSION_THREE_EVIDENCE_VERSION,
  MISSION_THREE_LEARNING_ITEM_ID,
  MISSION_THREE_VERSION,
  controlProgrammePath,
  missionOneTaskStates,
  missionFourStages,
  missionFourTaskStates,
  missionStateFromTaskCount,
  missionThreeStages,
  missionThreeTaskStates,
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
  parseActiveBoundary,
  parseEarlySignalChoice,
  parseCurrentGoal,
  parseMissionOneDraft,
  parseMissionFourDraft,
  parseMissionThreeDraft,
  parseMissionTwoDraft,
  parseMomentMap,
  parseTimeZone,
  parseUrgeLearningDraft,
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
const missionThreeAwardKey = "programme:mission:03:save:v1";
const missionFourAwardKey = "programme:mission:04:save:v1";

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

function earlySignalCategory(value: string) {
  return value.toUpperCase() as EarlySignalCategory;
}

function boundaryCategory(value: string) {
  return value.toUpperCase() as BoundaryCategory;
}

function boundaryStatus(value: string) {
  return value.toUpperCase() as BoundaryStatus;
}

function jsonGoal(value: ReturnType<typeof parseCurrentGoal>) {
  return {
    ...value,
    ...(value.reviewAt ? { reviewAt: value.reviewAt.toISOString() } : {}),
  } as Prisma.InputJsonObject;
}

function jsonBoundary(value: ReturnType<typeof parseActiveBoundary>) {
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

  async getMissionThreeDraft(userId: string) {
    const { source, enrollment } = await this.requireEnrollment(userId);
    const progress = await this.repository.findMissionProgress(enrollment.id, 3);
    if (!progress) throw new NotFoundError("Mission 03 progress");
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

  async saveMissionThreeDraft(userId: string, value: unknown) {
    const { enrollment } = await this.requireEnrollment(userId);
    const missionTwo = await this.repository.findMissionProgress(enrollment.id, 2);
    if (missionTwo?.status !== "COMPLETED") {
      throw new ConflictError("Mission 02 must be completed before Mission 03");
    }
    const existing = await this.repository.findMissionProgress(enrollment.id, 3);
    if (existing?.status === "COMPLETED") {
      throw new ConflictError("Mission 03 is already completed");
    }
    if (!existing) throw new NotFoundError("Mission 03 progress");

    const input = parseMissionThreeDraft(value);
    const mergedTaskStates = missionThreeTaskStates.filter(
      (task) => existing.taskStates.includes(task) || input.taskStates.includes(task),
    );
    const previousDraft =
      existing.draft && typeof existing.draft === "object" && !Array.isArray(existing.draft)
        ? existing.draft as { urgeLearning?: Record<string, unknown> }
        : {};
    const mergedLearning: Record<string, unknown> = {
      ...(previousDraft.urgeLearning ?? {}),
      ...input.urgeLearning,
    };
    if (input.urgeLearning.notNow === true) {
      delete mergedLearning.earlySignalCategory;
      delete mergedLearning.earlySignalText;
    }
    if (
      input.urgeLearning.earlySignalCategory !== undefined ||
      input.urgeLearning.earlySignalText !== undefined
    ) {
      mergedLearning.notNow = false;
    }

    const ready = mergedTaskStates.length === missionThreeTaskStates.length;
    if (ready) parseUrgeLearningDraft(mergedLearning, { complete: true });
    const saved = await this.repository.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 3,
      status: ready ? "READY_TO_SAVE" : "IN_PROGRESS",
      taskStates: mergedTaskStates,
      draft: { urgeLearning: mergedLearning as Prisma.InputJsonObject },
    });
    if (saved.count !== 1) {
      throw new ConflictError("Mission 03 draft can no longer be changed");
    }
    const progress = await this.repository.findMissionProgress(enrollment.id, 3);
    if (!progress) throw new NotFoundError("Mission 03 progress");
    return {
      missionNumber: 3,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionThreeStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  async completeMissionThree(userId: string, now = new Date()) {
    return withSerializableRetry(() =>
      this.repository.transaction(async (repository) => {
        const source = await this.requireControlProgram(repository);
        const enrollment = await repository.findEnrollment(userId, source.program.id);
        if (!enrollment) throw new NotFoundError("Program enrollment");
        const progress = await repository.findMissionProgress(enrollment.id, 3);
        if (progress?.status === "COMPLETED") {
          return this.dashboardFrom(repository, userId, source.program.id);
        }
        if (!progress) throw new NotFoundError("Mission 03 progress");
        assertCompleteTasks(progress.taskStates, missionThreeTaskStates);
        const stored = progress.draft as { urgeLearning?: unknown } | null;
        const learning = parseUrgeLearningDraft(stored?.urgeLearning ?? {}, {
          complete: true,
        });
        const missionTwo = await repository.findMissionProgress(enrollment.id, 2);
        if (missionTwo?.status !== "COMPLETED") {
          throw new ConflictError("Mission 02 must be completed before Mission 03");
        }
        const record = await repository.upsertUrgeLearningRecord({
          enrollmentId: enrollment.id,
          missionVersion: MISSION_THREE_VERSION,
          learningItemId: MISSION_THREE_LEARNING_ITEM_ID,
          evidenceVersion: MISSION_THREE_EVIDENCE_VERSION,
          reviewedAt: now,
          scenarioCheckCompletedAt: now,
          meaningCheckCompletedAt: now,
          earlySignalCategory: learning.notNow
            ? null
            : earlySignalCategory(learning.earlySignalCategory!),
          earlySignalText: learning.notNow ? null : learning.earlySignalText ?? null,
          notNow: Boolean(learning.notNow),
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 3,
          status: "COMPLETED",
          taskStates: [...missionThreeTaskStates],
          draft: Prisma.JsonNull,
          completedAt: now,
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 4,
          status: "IN_PROGRESS",
          taskStates: [],
          draft: Prisma.JsonNull,
          completedAt: null,
        });
        await repository.setEnrollmentCurrentStep(enrollment.id, source.program.steps[3].id);
        await repository.recordProgressEvent({
          enrollmentId: enrollment.id,
          entityId: source.program.steps[2].id,
          eventKey: `step:${source.program.steps[2].id}:completed`,
        });
        await repository.recordMissionXp({
          userId,
          programId: source.program.id,
          missionNumber: 3,
          xp: 90,
          awardKey: missionThreeAwardKey,
          sourceArtifactType: "URGE_LEARNING_RECORD",
          sourceArtifactId: record.id,
        });
        await repository.recordActiveDay({
          userId,
          enrollmentId: enrollment.id,
          localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
          timezone: enrollment.timezone,
          sourceEventKey: missionThreeAwardKey,
          eligibleActivityAt: now,
        });
        return this.dashboardFrom(repository, userId, source.program.id);
      }),
    );
  }

  async getMissionFourDraft(userId: string) {
    const { source, enrollment } = await this.requireEnrollment(userId);
    const progress = await this.repository.findMissionProgress(enrollment.id, 4);
    if (!progress) throw new NotFoundError("Mission 04 progress");
    return {
      missionNumber: 4,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionFourStages,
      draft: progress.draft ?? null,
      evidence: programmeEvidence.mission04,
      evidenceVersion: MISSION_FOUR_EVIDENCE_VERSION,
      currentGoal: enrollment.id
        ? await this.repository.findCurrentGoal(enrollment.id)
        : null,
      urgeLearningRecord: enrollment.id
        ? await this.repository.findUrgeLearningRecord(enrollment.id)
        : null,
      programId: source.program.id,
    };
  }

  async saveMissionFourDraft(userId: string, value: unknown) {
    const { enrollment } = await this.requireEnrollment(userId);
    const missionThree = await this.repository.findMissionProgress(enrollment.id, 3);
    if (missionThree?.status !== "COMPLETED") {
      throw new ConflictError("Mission 03 must be completed before Mission 04");
    }
    const existing = await this.repository.findMissionProgress(enrollment.id, 4);
    if (!existing) throw new NotFoundError("Mission 04 progress");
    if (existing.status === "COMPLETED") {
      throw new ConflictError("Mission 04 is already completed");
    }
    const input = parseMissionFourDraft(value);
    const mergedTaskStates = missionFourTaskStates.filter(
      (task) => existing.taskStates.includes(task) || input.taskStates.includes(task),
    );
    const previousDraft =
      existing.draft && typeof existing.draft === "object" && !Array.isArray(existing.draft)
        ? existing.draft as { activeBoundary?: Record<string, unknown> }
        : {};
    const mergedBoundary = {
      ...(previousDraft.activeBoundary ?? {}),
      ...jsonBoundary(input.activeBoundary),
    } as Prisma.InputJsonObject;
    const ready = mergedTaskStates.length === missionFourTaskStates.length;
    if (ready) parseActiveBoundary(mergedBoundary, { complete: true });
    const saved = await this.repository.updateMissionDraftIfOpen({
      enrollmentId: enrollment.id,
      missionNumber: 4,
      status: ready ? "READY_TO_SAVE" : "IN_PROGRESS",
      taskStates: mergedTaskStates,
      draft: { activeBoundary: mergedBoundary },
    });
    if (saved.count !== 1) {
      throw new ConflictError("Mission 04 draft can no longer be changed");
    }
    const progress = await this.repository.findMissionProgress(enrollment.id, 4);
    if (!progress) throw new NotFoundError("Mission 04 progress");
    return {
      missionNumber: 4,
      status: serialiseMissionState(progress.status),
      taskStates: progress.taskStates,
      stages: missionFourStages,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }

  async completeMissionFour(userId: string, now = new Date()) {
    return withSerializableRetry(() =>
      this.repository.transaction(async (repository) => {
        const source = await this.requireControlProgram(repository);
        const enrollment = await repository.findEnrollment(userId, source.program.id);
        if (!enrollment) throw new NotFoundError("Program enrollment");
        const progress = await repository.findMissionProgress(enrollment.id, 4);
        if (progress?.status === "COMPLETED") {
          return this.dashboardFrom(repository, userId, source.program.id);
        }
        if (!progress) throw new NotFoundError("Mission 04 progress");
        assertCompleteTasks(progress.taskStates, missionFourTaskStates);
        const stored = progress.draft as { activeBoundary?: unknown } | null;
        const boundary = parseActiveBoundary(stored?.activeBoundary ?? {}, {
          complete: true,
          now,
        });
        const missionThree = await repository.findMissionProgress(enrollment.id, 3);
        if (missionThree?.status !== "COMPLETED") {
          throw new ConflictError("Mission 03 must be completed before Mission 04");
        }
        const currentGoal = await repository.findCurrentGoal(enrollment.id);
        const urgeRecord = await repository.findUrgeLearningRecord(enrollment.id);
        if (
          boundary.triggerType === "saved_early_signal" &&
          (!urgeRecord || urgeRecord.deletedAt || urgeRecord.notNow)
        ) {
          throw new ConflictError("An active saved early signal is required for this decision point");
        }
        const triggerText = boundary.triggerType === "saved_early_signal"
          ? urgeRecord!.earlySignalText ?? urgeRecord!.earlySignalCategory?.toLowerCase().replaceAll("_", " ") ?? null
          : boundary.triggerText ?? null;
        const activeBoundary = await repository.upsertActiveBoundary({
          enrollmentId: enrollment.id,
          sourceCurrentGoalId: currentGoal && !currentGoal.deletedAt ? currentGoal.id : null,
          sourceUrgeLearningRecordId:
            boundary.triggerType === "saved_early_signal" ? urgeRecord!.id : null,
          missionVersion: MISSION_FOUR_VERSION,
          evidenceVersion: MISSION_FOUR_EVIDENCE_VERSION,
          category: boundaryCategory(boundary.category!),
          triggerType: boundary.triggerType!,
          triggerText,
          ruleText: boundary.ruleText!,
          limitValue: boundary.limitValue === undefined
            ? null
            : new Prisma.Decimal(boundary.limitValue),
          limitUnit: boundary.limitUnit ?? null,
          limitPeriod: boundary.limitPeriod ?? null,
          executionMethod: boundary.executionMethod!,
          executionDetail: boundary.executionDetail ?? null,
          copingAction: boundary.copingAction!,
          reviewAt: boundary.reviewAt!,
          status: boundaryStatus(boundary.status!),
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 4,
          status: "COMPLETED",
          taskStates: [...missionFourTaskStates],
          draft: Prisma.JsonNull,
          completedAt: now,
        });
        await repository.upsertMissionProgress({
          enrollmentId: enrollment.id,
          missionNumber: 5,
          status: "IN_PROGRESS",
          taskStates: [],
          draft: Prisma.JsonNull,
          completedAt: null,
        });
        await repository.setEnrollmentCurrentStep(enrollment.id, source.program.steps[4].id);
        await repository.recordProgressEvent({
          enrollmentId: enrollment.id,
          entityId: source.program.steps[3].id,
          eventKey: `step:${source.program.steps[3].id}:completed`,
        });
        await repository.recordMissionXp({
          userId,
          programId: source.program.id,
          missionNumber: 4,
          xp: 100,
          awardKey: missionFourAwardKey,
          sourceArtifactType: "ACTIVE_BOUNDARY",
          sourceArtifactId: activeBoundary.id,
        });
        const achievement = await repository.findBoundaryBuiltAchievement();
        if (!achievement) throw new ConflictError("Boundary Built achievement is unavailable");
        await repository.unlockAchievement({
          userId,
          achievementId: achievement.id,
          awardKey: "achievement:boundary-built:mission-04:v1",
        });
        await repository.recordActiveDay({
          userId,
          enrollmentId: enrollment.id,
          localDate: dateOnlyUtc(localDateAt(now, enrollment.timezone)),
          timezone: enrollment.timezone,
          sourceEventKey: missionFourAwardKey,
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

  async updateUrgeLearningRecord(userId: string, value: unknown) {
    const { enrollment } = await this.requireEnrollment(userId);
    const record = await this.repository.findUrgeLearningRecord(enrollment.id);
    if (!record || record.deletedAt) throw new NotFoundError("Urge Learning Record");
    const input = parseEarlySignalChoice(value);
    const updated = await this.repository.updateUrgeLearningRecord(record.id, {
      earlySignalCategory: input.notNow
        ? null
        : earlySignalCategory(input.earlySignalCategory!),
      earlySignalText: input.notNow ? null : input.earlySignalText ?? null,
      notNow: input.notNow,
    });
    return this.urgeLearningRecordDto(updated);
  }

  async deleteUrgeLearningRecord(userId: string, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const record = await this.repository.findUrgeLearningRecord(enrollment.id);
    if (!record || record.deletedAt) throw new NotFoundError("Urge Learning Record");
    await this.repository.eraseUrgeLearningRecord(record.id, now);
  }

  async updateActiveBoundary(userId: string, value: unknown, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const current = await this.repository.findActiveBoundary(enrollment.id);
    if (!current || current.deletedAt) throw new NotFoundError("Active Boundary");
    const input = parseActiveBoundary(value, { now });
    const data = {
      ...(input.category ? { category: boundaryCategory(input.category) } : {}),
      ...(input.triggerType ? { triggerType: input.triggerType } : {}),
      ...(input.triggerText !== undefined ? { triggerText: input.triggerText ?? null } : {}),
      ...(input.ruleText ? { ruleText: input.ruleText } : {}),
      ...(input.limitValue !== undefined
        ? { limitValue: new Prisma.Decimal(input.limitValue) }
        : {}),
      ...(input.limitUnit !== undefined ? { limitUnit: input.limitUnit ?? null } : {}),
      ...(input.limitPeriod !== undefined ? { limitPeriod: input.limitPeriod ?? null } : {}),
      ...(input.executionMethod ? { executionMethod: input.executionMethod } : {}),
      ...(input.executionDetail !== undefined
        ? { executionDetail: input.executionDetail ?? null }
        : {}),
      ...(input.copingAction ? { copingAction: input.copingAction } : {}),
      ...(input.reviewAt ? { reviewAt: input.reviewAt } : {}),
      ...(input.status ? { status: boundaryStatus(input.status) } : {}),
    };
    if (!Object.keys(data).length) {
      throw new ValidationError("At least one Active Boundary field is required");
    }
    const updated = await this.repository.updateActiveBoundary(current.id, data);
    return this.activeBoundaryDto(updated);
  }

  async deleteActiveBoundary(userId: string, now = new Date()) {
    const { enrollment } = await this.requireEnrollment(userId);
    const current = await this.repository.findActiveBoundary(enrollment.id);
    if (!current || current.deletedAt) throw new NotFoundError("Active Boundary");
    await this.repository.eraseActiveBoundary(current.id, now);
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
    const firstPlan = achievementRows.find((row) => row.achievement.slug === "first-plan");
    const boundaryBuilt = achievementRows.find(
      (row) => row.achievement.slug === "boundary-built",
    );
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
        {
          slug: "boundary-built",
          title: "Boundary Built",
          state: boundaryBuilt ? "earned" : "locked",
          awardedAt: boundaryBuilt?.awardedAt.toISOString() ?? null,
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
      urgeLearningRecord:
        enrollment.urgeLearningRecord && !enrollment.urgeLearningRecord.deletedAt
          ? this.urgeLearningRecordDto(enrollment.urgeLearningRecord)
          : null,
      activeBoundary:
        enrollment.activeBoundary && !enrollment.activeBoundary.deletedAt
          ? this.activeBoundaryDto(enrollment.activeBoundary)
          : null,
      evidence: {
        mission01: programmeEvidence.mission01,
        mission02: programmeEvidence.mission02,
        mission03: programmeEvidence.mission03,
        mission04: programmeEvidence.mission04,
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

  private urgeLearningRecordDto(value: {
    id: string;
    missionVersion: string;
    learningItemId: string;
    evidenceVersion: string;
    reviewedAt: Date;
    scenarioCheckCompletedAt: Date;
    meaningCheckCompletedAt: Date;
    earlySignalCategory: string | null;
    earlySignalText: string | null;
    notNow: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: value.id,
      missionVersion: value.missionVersion,
      learningItemId: value.learningItemId,
      evidenceVersion: value.evidenceVersion,
      reviewedAt: value.reviewedAt.toISOString(),
      scenarioCheckCompletedAt: value.scenarioCheckCompletedAt.toISOString(),
      meaningCheckCompletedAt: value.meaningCheckCompletedAt.toISOString(),
      earlySignalCategory: value.earlySignalCategory?.toLowerCase() ?? null,
      earlySignalText: value.earlySignalText,
      notNow: value.notNow,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }


  private activeBoundaryDto(value: {
    id: string;
    sourceCurrentGoalId: string | null;
    sourceUrgeLearningRecordId: string | null;
    missionVersion: string;
    evidenceVersion: string;
    category: string;
    triggerType: string;
    triggerText: string | null;
    ruleText: string;
    limitValue: Prisma.Decimal | null;
    limitUnit: string | null;
    limitPeriod: string | null;
    executionMethod: string;
    executionDetail: string | null;
    copingAction: string;
    reviewAt: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: value.id,
      sourceCurrentGoalId: value.sourceCurrentGoalId,
      sourceUrgeLearningRecordId: value.sourceUrgeLearningRecordId,
      missionVersion: value.missionVersion,
      evidenceVersion: value.evidenceVersion,
      category: value.category.toLowerCase(),
      triggerType: value.triggerType,
      triggerText: value.triggerText,
      ruleText: value.ruleText,
      limitValue: value.limitValue?.toNumber() ?? null,
      limitUnit: value.limitUnit,
      limitPeriod: value.limitPeriod,
      executionMethod: value.executionMethod,
      executionDetail: value.executionDetail,
      copingAction: value.copingAction,
      reviewAt: value.reviewAt.toISOString(),
      status: value.status.toLowerCase(),
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }
}

export const programmeFlowService = new ProgrammeFlowService();

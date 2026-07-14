import type { Prisma } from "@prisma/client";

import type {
  CmsBlock,
  ProgramBuilderLesson,
  ProgramBuilderSnapshot,
  ProgramBuilderStep,
} from "@/lib/cms/types";
import type {
  MergeLocalProgressInput,
  ServerProgramState,
  UserProgressResponse,
} from "@/lib/progress/types";
import {
  rewardTransactionRunner,
  type RewardTransactionRunner,
  type RewardTransactionStores,
} from "@/lib/repositories/reward-transaction.repository";
import {
  userProgressRepository,
  type PublishedProgramProgressSource,
  type UserProgressEnrollment,
  type UserProgressStore,
} from "@/lib/repositories/user-progress.repository";
import {
  emptyRewardSummary,
  type ProgressRewardContext,
  type RewardSummary,
} from "@/lib/rewards/types";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./service-error";
import { AchievementService, achievementService } from "./achievement.service";
import { XpService, xpService } from "./xp.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EntityEventKind =
  | "lesson"
  | "quiz"
  | "scenario"
  | "exercise"
  | "step"
  | "program";

export function progressEventKey(
  kind: EntityEventKind,
  entityId: string,
  event: "completed" | "submitted",
) {
  return `${kind}:${entityId}:${event}`;
}

function requireUuid(value: string, field: string) {
  if (!uuidPattern.test(value)) {
    throw new ValidationError(`${field} must be a valid UUID`);
  }
}

function readPublishedSnapshot(
  value: Prisma.JsonValue,
  programId: string,
): ProgramBuilderSnapshot {
  const snapshot = value as unknown as ProgramBuilderSnapshot;

  if (
    !snapshot?.program ||
    snapshot.program.id !== programId ||
    !Array.isArray(snapshot.steps)
  ) {
    throw new ConflictError("Published program snapshot is invalid", {
      programId,
    });
  }

  return snapshot;
}

function snapshotForEnrollment(enrollment: UserProgressEnrollment) {
  if (enrollment.programVersion.status !== "PUBLISHED") {
    throw new ConflictError("Enrollment is not pinned to a published version", {
      programId: enrollment.programId,
    });
  }

  return readPublishedSnapshot(
    enrollment.programVersion.snapshot,
    enrollment.programId,
  );
}

function findStep(snapshot: ProgramBuilderSnapshot, stepId: string) {
  const step = snapshot.steps.find(
    (candidate) => candidate.id === stepId && !candidate.archivedAt,
  );
  if (!step) {
    throw new ValidationError("Step does not belong to this program", {
      stepId,
    });
  }
  return step;
}

function findLesson(snapshot: ProgramBuilderSnapshot, lessonId: string) {
  for (const step of snapshot.steps) {
    if (step.archivedAt) continue;
    const lesson = step.lessons.find(
      (candidate) => candidate.id === lessonId && !candidate.archivedAt,
    );
    if (lesson) return { step, lesson };
  }

  throw new ValidationError("Lesson does not belong to this program", {
    lessonId,
  });
}

function findBlock(snapshot: ProgramBuilderSnapshot, blockId: string) {
  for (const step of snapshot.steps) {
    if (step.archivedAt) continue;
    for (const lesson of step.lessons) {
      if (lesson.archivedAt) continue;
      const block = lesson.blocks.find(
        (candidate) => candidate.id === blockId && !candidate.archived,
      );
      if (block) return { step, lesson, block };
    }
  }

  throw new ValidationError("Block does not belong to this program", {
    blockId,
  });
}

function requiredBlockEventKey(block: CmsBlock) {
  if (block.type === "QUIZ") {
    return progressEventKey("quiz", block.id, "submitted");
  }
  if (block.type === "SCENARIO") {
    return progressEventKey("scenario", block.id, "submitted");
  }
  if (
    block.type === "EXERCISE" ||
    block.type === "REFLECTION" ||
    block.type === "PRACTICAL_TASK"
  ) {
    return progressEventKey("exercise", block.id, "completed");
  }
  return null;
}

function dataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function quizConfiguration(block: CmsBlock) {
  const questions = Array.isArray(block.data.questions)
    ? block.data.questions.map(dataRecord)
    : [];
  const firstQuestion = questions[0] ?? {};
  const options = Array.isArray(firstQuestion.options)
    ? firstQuestion.options.map(dataRecord)
    : Array.isArray(block.data.options)
      ? block.data.options.map(dataRecord)
      : [];
  const configuredCorrectIndex = block.data.correctIndex;
  const correctIndex =
    typeof configuredCorrectIndex === "number"
      ? configuredCorrectIndex
      : options.findIndex((option) => option.correct === true);
  return { options, correctIndex };
}

export function evaluateQuizSubmission(block: CmsBlock, answerIndex: number) {
  const { options, correctIndex } = quizConfiguration(block);
  if (
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    (options.length > 0 && answerIndex >= options.length)
  ) {
    throw new ValidationError("answerIndex is outside the quiz options");
  }
  return {
    passed: correctIndex >= 0 && answerIndex === correctIndex,
    hasConfiguredAnswer: correctIndex >= 0,
  };
}

function assertRequiredBlocksCompleted(
  lesson: ProgramBuilderLesson,
  eventKeys: Set<string>,
) {
  const missing = lesson.blocks
    .filter((block) => block.required && !block.archived)
    .map(requiredBlockEventKey)
    .filter((key): key is string => Boolean(key))
    .filter((key) => !eventKeys.has(key));

  if (missing.length) {
    throw new ConflictError("Required lesson activities are incomplete", {
      lessonId: lesson.id,
      missingEventKeys: missing,
    });
  }
}

function assertStepCanComplete(
  step: ProgramBuilderStep,
  eventKeys: Set<string>,
) {
  const missingLessons = step.lessons
    .filter((lesson) => lesson.required && !lesson.archivedAt)
    .filter(
      (lesson) =>
        !eventKeys.has(progressEventKey("lesson", lesson.id, "completed")),
    )
    .map((lesson) => lesson.id);

  if (missingLessons.length) {
    throw new ConflictError("Required lessons are incomplete", {
      stepId: step.id,
      missingLessonIds: missingLessons,
    });
  }
}

function toResponse(enrollment: UserProgressEnrollment): UserProgressResponse {
  const idsFor = (prefix: string, suffix: string) =>
    enrollment.progressEvents
      .filter(
        (event) =>
          event.eventKey.startsWith(`${prefix}:`) &&
          event.eventKey.endsWith(`:${suffix}`),
      )
      .map((event) => event.entityId);

  const updatedAt = [
    enrollment.startedAt,
    ...(enrollment.completedAt ? [enrollment.completedAt] : []),
    ...enrollment.progressEvents.map((event) => event.createdAt),
  ].reduce((latest, value) => (value > latest ? value : latest));

  return {
    programId: enrollment.programId,
    currentStepId: enrollment.currentStepId,
    completedStepIds: idsFor("step", "completed"),
    completedLessonIds: idsFor("lesson", "completed"),
    completedQuizIds: idsFor("quiz", "submitted"),
    completedScenarioIds: idsFor("scenario", "submitted"),
    completedExerciseIds: idsFor("exercise", "completed"),
    completedAt: enrollment.completedAt?.toISOString() ?? null,
    updatedAt: updatedAt.toISOString(),
    source: "server",
  };
}

function firstStepId(source: PublishedProgramProgressSource) {
  const snapshot = readPublishedSnapshot(source.snapshot, source.programId);
  return snapshot.steps
    .filter((step) => !step.archivedAt)
    .slice()
    .sort((a, b) => a.order - b.order)[0]?.id;
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values));
}

export class UserProgressService {
  constructor(
    private readonly repository: UserProgressStore = userProgressRepository,
    private readonly transactions: RewardTransactionRunner = rewardTransactionRunner,
    private readonly xp: XpService = xpService,
    private readonly achievements: AchievementService = achievementService,
  ) {}

  async getCurrentProgress(userId: string, programId: string) {
    requireUuid(programId, "programId");
    const enrollment = await this.repository.findEnrollment(userId, programId);
    if (enrollment) snapshotForEnrollment(enrollment);
    return this.serverState(
      userId,
      enrollment ? toResponse(enrollment) : null,
      emptyRewardSummary(),
      this.xp,
      this.achievements,
    );
  }

  async startProgram(userId: string, input: { programId: string }) {
    requireUuid(input.programId, "programId");
    const source = await this.repository.findPublishedProgram(input.programId);
    if (!source) {
      throw new NotFoundError("Published program", { programId: input.programId });
    }
    const enrollment = await this.repository.getOrCreateEnrollment({
      userId,
      programId: source.programId,
      programVersionId: source.programVersionId,
      currentStepId: firstStepId(source),
    });
    return this.serverState(
      userId,
      toResponse(enrollment),
      emptyRewardSummary(),
      this.xp,
      this.achievements,
    );
  }

  async setCurrentStep(
    userId: string,
    input: { programId: string; stepId: string },
  ) {
    requireUuid(input.programId, "programId");
    requireUuid(input.stepId, "stepId");
    const enrollment = await this.requireEnrollment(
      this.repository,
      userId,
      input.programId,
    );
    const snapshot = snapshotForEnrollment(enrollment);
    const targetStep = findStep(snapshot, input.stepId);
    const currentStep = enrollment.currentStepId
      ? snapshot.steps.find((step) => step.id === enrollment.currentStepId)
      : undefined;
    let updated = enrollment;
    if (!currentStep || currentStep.order < targetStep.order) {
      await this.recordEvent(this.repository, enrollment, {
        userId,
        entityId: targetStep.id,
        entityType: "STEP",
        eventType: "CURRENT",
        eventKey: `step:${targetStep.id}:current`,
      });
      const result = await this.repository.setCurrentStep({
        userId,
        programId: input.programId,
        enrollmentId: enrollment.id,
        currentStepId: targetStep.id,
      });
      if (!result) throw new NotFoundError("Program enrollment");
      updated = result;
    }
    return this.serverState(
      userId,
      toResponse(updated),
      emptyRewardSummary(),
      this.xp,
      this.achievements,
    );
  }

  completeLesson(userId: string, input: { programId: string; lessonId: string }) {
    requireUuid(input.lessonId, "lessonId");
    return this.rewardedAction(userId, input.programId, async (stores, enrollment) => {
      const { lesson } = findLesson(snapshotForEnrollment(enrollment), input.lessonId);
      assertRequiredBlocksCompleted(
        lesson,
        new Set(enrollment.progressEvents.map((event) => event.eventKey)),
      );
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: lesson.id,
        entityType: "LESSON",
        eventType: "COMPLETED",
        eventKey: progressEventKey("lesson", lesson.id, "completed"),
      });
      return recorded.created
        ? [this.rewardContext(userId, input.programId, lesson.id, "LESSON_COMPLETED")]
        : [];
    });
  }

  saveQuizResult(
    userId: string,
    input: { programId: string; blockId: string; answerIndex: number },
  ) {
    requireUuid(input.blockId, "blockId");
    return this.rewardedAction(userId, input.programId, async (stores, enrollment) => {
      const { block } = this.requireBlockFromEnrollment(enrollment, input.blockId, ["QUIZ"]);
      const { passed, hasConfiguredAnswer } = evaluateQuizSubmission(
        block,
        input.answerIndex,
      );
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: block.id,
        entityType: "QUIZ",
        eventType: "SUBMITTED",
        eventKey: progressEventKey("quiz", block.id, "submitted"),
        metadata: {
          answerIndex: input.answerIndex,
          ...(hasConfiguredAnswer ? { correct: passed } : {}),
        },
      });
      if (!recorded.created) return [];
      const contexts = [
        this.rewardContext(userId, input.programId, block.id, "QUIZ_COMPLETED"),
      ];
      if (passed) {
        contexts.push({
          ...this.rewardContext(userId, input.programId, block.id, "QUIZ_PASSED"),
          quizPassed: true,
        });
      }
      return contexts;
    });
  }

  saveScenarioResult(
    userId: string,
    input: { programId: string; blockId: string; answerIndex: number },
  ) {
    requireUuid(input.blockId, "blockId");
    return this.rewardedAction(userId, input.programId, async (stores, enrollment) => {
      const { block } = this.requireBlockFromEnrollment(enrollment, input.blockId, ["SCENARIO"]);
      const options = Array.isArray(block.data.choices)
        ? block.data.choices
        : Array.isArray(block.data.options)
          ? block.data.options
          : [];
      if (
        !Number.isInteger(input.answerIndex) ||
        input.answerIndex < 0 ||
        (options.length > 0 && input.answerIndex >= options.length)
      ) {
        throw new ValidationError("answerIndex is outside the scenario options");
      }
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: block.id,
        entityType: "SCENARIO",
        eventType: "SUBMITTED",
        eventKey: progressEventKey("scenario", block.id, "submitted"),
        metadata: { answerIndex: input.answerIndex },
      });
      return recorded.created
        ? [this.rewardContext(userId, input.programId, block.id, "SCENARIO_COMPLETED")]
        : [];
    });
  }

  saveExercise(
    userId: string,
    input: { programId: string; blockId: string; response: string },
  ) {
    requireUuid(input.blockId, "blockId");
    const response = input.response.trim();
    if (!response || response.length > 4000) {
      throw new ValidationError("Exercise response must contain 1-4000 characters");
    }
    return this.rewardedAction(userId, input.programId, async (stores, enrollment) => {
      const { block } = this.requireBlockFromEnrollment(
        enrollment,
        input.blockId,
        ["EXERCISE", "REFLECTION", "PRACTICAL_TASK"],
      );
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: block.id,
        entityType: block.type,
        eventType: "COMPLETED",
        eventKey: progressEventKey("exercise", block.id, "completed"),
        metadata: { response },
      });
      return recorded.created
        ? [this.rewardContext(userId, input.programId, block.id, "EXERCISE_COMPLETED")]
        : [];
    });
  }

  completeStep(userId: string, input: { programId: string; stepId: string }) {
    requireUuid(input.stepId, "stepId");
    return this.rewardedAction(userId, input.programId, async (stores, enrollment) => {
      const step = findStep(snapshotForEnrollment(enrollment), input.stepId);
      assertStepCanComplete(
        step,
        new Set(enrollment.progressEvents.map((event) => event.eventKey)),
      );
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: step.id,
        entityType: "STEP",
        eventType: "COMPLETED",
        eventKey: progressEventKey("step", step.id, "completed"),
      });
      return recorded.created
        ? [this.rewardContext(userId, input.programId, step.id, "STEP_COMPLETED")]
        : [];
    });
  }

  mergeLocalProgress(userId: string, input: MergeLocalProgressInput) {
    requireUuid(input.programId, "programId");
    return this.transactions.run(async (stores) => {
      let enrollment = await stores.progress.findEnrollment(userId, input.programId);
      if (!enrollment) {
        const source = await stores.progress.findPublishedProgram(input.programId);
        if (!source) throw new NotFoundError("Published program", { programId: input.programId });
        enrollment = await stores.progress.getOrCreateEnrollment({
          userId,
          programId: input.programId,
          programVersionId: source.programVersionId,
          currentStepId: firstStepId(source),
        });
      }
      const snapshot = snapshotForEnrollment(enrollment);
      const marker = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: input.programId,
        entityType: "PROGRAM",
        eventType: "ANONYMOUS_MERGE",
        eventKey: `program:${input.programId}:anonymous-merge:v1`,
        metadata: { version: 1 },
      });
      if (!marker.created) {
        return this.transactionState(userId, input.programId, emptyRewardSummary(), stores);
      }

      const activeSteps = snapshot.steps.filter((step) => !step.archivedAt).slice().sort((a, b) => a.order - b.order);
      const activeLessons = activeSteps.flatMap((step) => step.lessons.filter((lesson) => !lesson.archivedAt));
      const activeBlocks = activeLessons.flatMap((lesson) => lesson.blocks.filter((block) => !block.archived));
      const stepIds = new Set(activeSteps.map((step) => step.id));
      const lessonIds = new Set(activeLessons.map((lesson) => lesson.id));
      const quizIds = new Set(activeBlocks.filter((block) => block.type === "QUIZ").map((block) => block.id));
      const scenarioIds = new Set(activeBlocks.filter((block) => block.type === "SCENARIO").map((block) => block.id));
      const exerciseIds = new Set(activeBlocks.filter((block) => ["EXERCISE", "REFLECTION", "PRACTICAL_TASK"].includes(block.type)).map((block) => block.id));
      const accepted = {
        steps: uniqueIds(input.completedStepIds).filter((id) => stepIds.has(id)),
        lessons: uniqueIds(input.completedLessonIds).filter((id) => lessonIds.has(id)),
        quizzes: uniqueIds(input.completedQuizIds).filter((id) => quizIds.has(id)),
        scenarios: uniqueIds(input.completedScenarioIds).filter((id) => scenarioIds.has(id)),
        exercises: uniqueIds(input.completedExerciseIds).filter((id) => exerciseIds.has(id)),
      };
      const candidates: Array<{
        entityId: string;
        entityType: string;
        eventType: string;
        eventKey: string;
        kind: ProgressRewardContext["kind"];
      }> = [
        ...accepted.steps.map((entityId) => ({ entityId, entityType: "STEP", eventType: "COMPLETED", eventKey: progressEventKey("step", entityId, "completed"), kind: "STEP_COMPLETED" as const })),
        ...accepted.lessons.map((entityId) => ({ entityId, entityType: "LESSON", eventType: "COMPLETED", eventKey: progressEventKey("lesson", entityId, "completed"), kind: "LESSON_COMPLETED" as const })),
        ...accepted.quizzes.map((entityId) => ({ entityId, entityType: "QUIZ", eventType: "SUBMITTED", eventKey: progressEventKey("quiz", entityId, "submitted"), kind: "QUIZ_COMPLETED" as const })),
        ...accepted.scenarios.map((entityId) => ({ entityId, entityType: "SCENARIO", eventType: "SUBMITTED", eventKey: progressEventKey("scenario", entityId, "submitted"), kind: "SCENARIO_COMPLETED" as const })),
        ...accepted.exercises.map((entityId) => ({ entityId, entityType: "EXERCISE", eventType: "COMPLETED", eventKey: progressEventKey("exercise", entityId, "completed"), kind: "EXERCISE_COMPLETED" as const })),
      ];
      const existingCompletedSteps = enrollment.progressEvents
        .filter((event) => event.eventKey.startsWith("step:") && event.eventKey.endsWith(":completed"))
        .map((event) => event.entityId);
      const allCompletedSteps = new Set([...existingCompletedSteps, ...accepted.steps]);
      const completeProgram = input.programCompleted && activeSteps.length > 0 && activeSteps.every((step) => allCompletedSteps.has(step.id));
      if (completeProgram) {
        candidates.push({
          entityId: input.programId,
          entityType: "PROGRAM",
          eventType: "COMPLETED",
          eventKey: progressEventKey("program", input.programId, "completed"),
          kind: "PROGRAM_COMPLETED",
        });
      }
      const contexts: ProgressRewardContext[] = [];
      for (const candidate of candidates) {
        const recorded = await this.recordEvent(stores.progress, enrollment, {
          userId,
          entityId: candidate.entityId,
          entityType: candidate.entityType,
          eventType: candidate.eventType,
          eventKey: candidate.eventKey,
        });
        if (recorded.created) contexts.push(this.rewardContext(userId, input.programId, candidate.entityId, candidate.kind));
      }
      const currentCandidates = uniqueIds([
        ...(enrollment.currentStepId ? [enrollment.currentStepId] : []),
        ...(input.currentStepId && stepIds.has(input.currentStepId) ? [input.currentStepId] : []),
        ...accepted.steps,
      ]);
      const currentStepId = activeSteps.filter((step) => currentCandidates.includes(step.id)).sort((a, b) => b.order - a.order)[0]?.id;
      if (currentStepId) {
        const updated = await stores.progress.setCurrentStep({ userId, programId: input.programId, enrollmentId: enrollment.id, currentStepId });
        if (!updated) throw new NotFoundError("Program enrollment");
      }
      if (completeProgram) {
        const completed = await stores.progress.completeEnrollment({ userId, programId: input.programId, enrollmentId: enrollment.id });
        if (!completed) throw new NotFoundError("Program enrollment");
      }
      const rewards = await this.applyRewards(userId, snapshot, contexts, stores);
      return this.transactionState(userId, input.programId, rewards, stores);
    });
  }

  completeProgram(userId: string, input: { programId: string }) {
    return this.transactions.run(async (stores) => {
      const enrollment = await this.requireEnrollment(stores.progress, userId, input.programId);
      if (enrollment.completedAt) {
        return this.transactionState(userId, input.programId, emptyRewardSummary(), stores);
      }
      const snapshot = snapshotForEnrollment(enrollment);
      const eventKeys = new Set(enrollment.progressEvents.map((event) => event.eventKey));
      const incompleteSteps = snapshot.steps
        .filter((step) => !step.archivedAt)
        .filter((step) => !eventKeys.has(progressEventKey("step", step.id, "completed")))
        .map((step) => step.id);
      if (incompleteSteps.length) {
        throw new ConflictError("Program steps are incomplete", { incompleteStepIds: incompleteSteps });
      }
      const recorded = await this.recordEvent(stores.progress, enrollment, {
        userId,
        entityId: input.programId,
        entityType: "PROGRAM",
        eventType: "COMPLETED",
        eventKey: progressEventKey("program", input.programId, "completed"),
      });
      const completed = await stores.progress.completeEnrollment({
        userId,
        programId: input.programId,
        enrollmentId: enrollment.id,
      });
      if (!completed) throw new NotFoundError("Program enrollment");
      const contexts = recorded.created
        ? [this.rewardContext(userId, input.programId, input.programId, "PROGRAM_COMPLETED")]
        : [];
      const rewards = await this.applyRewards(userId, snapshot, contexts, stores);
      return this.transactionState(userId, input.programId, rewards, stores);
    });
  }

  private rewardedAction(
    userId: string,
    programId: string,
    action: (
      stores: RewardTransactionStores,
      enrollment: UserProgressEnrollment,
    ) => Promise<ProgressRewardContext[]>,
  ) {
    return this.transactions.run(async (stores) => {
      const enrollment = await this.requireEnrollment(stores.progress, userId, programId);
      const snapshot = snapshotForEnrollment(enrollment);
      const contexts = await action(stores, enrollment);
      const rewards = await this.applyRewards(userId, snapshot, contexts, stores);
      return this.transactionState(userId, programId, rewards, stores);
    });
  }

  private async applyRewards(
    userId: string,
    snapshot: ProgramBuilderSnapshot,
    contexts: ProgressRewardContext[],
    stores: RewardTransactionStores,
  ) {
    const xp = new XpService(stores.xp);
    const achievements = new AchievementService(stores.achievements, xp);
    const rewards = emptyRewardSummary();
    for (const context of contexts) {
      rewards.xpAwardedNow += await xp.awardProgress(context, snapshot.xpRules);
      const result = await achievements.evaluate(userId, context);
      rewards.xpAwardedNow += result.xpAwardedNow;
      for (const achievement of result.newlyUnlocked) {
        if (!rewards.newlyUnlockedAchievements.some((item) => item.slug === achievement.slug)) {
          rewards.newlyUnlockedAchievements.push(achievement);
        }
      }
    }
    return rewards;
  }

  private rewardContext(
    userId: string,
    programId: string,
    entityId: string,
    kind: ProgressRewardContext["kind"],
  ): ProgressRewardContext {
    const eventTypes = {
      LESSON_COMPLETED: "LESSON_COMPLETION",
      STEP_COMPLETED: "STEP_COMPLETION",
      QUIZ_COMPLETED: "QUIZ_COMPLETION",
      QUIZ_PASSED: "QUIZ_PASSING",
      SCENARIO_COMPLETED: "SCENARIO_COMPLETION",
      EXERCISE_COMPLETED: "EXERCISE_COMPLETION",
      PROGRAM_COMPLETED: "PROGRAM_COMPLETION",
    } as const;
    return { userId, programId, entityId, kind, xpEventType: eventTypes[kind] };
  }

  private requireBlockFromEnrollment(
    enrollment: UserProgressEnrollment,
    blockId: string,
    allowedTypes: CmsBlock["type"][],
  ) {
    const result = findBlock(snapshotForEnrollment(enrollment), blockId);
    if (!allowedTypes.includes(result.block.type)) {
      throw new ValidationError("Block type does not match this progress action", {
        blockId,
        blockType: result.block.type,
      });
    }
    return result;
  }

  private async recordEvent(
    repository: UserProgressStore,
    enrollment: UserProgressEnrollment,
    input: {
      userId: string;
      entityId: string;
      entityType: string;
      eventType: string;
      eventKey: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const result = await repository.recordEvent({
      ...input,
      programId: enrollment.programId,
      enrollmentId: enrollment.id,
    });
    if (!result) throw new NotFoundError("Program enrollment");
    return result;
  }

  private async requireEnrollment(
    repository: UserProgressStore,
    userId: string,
    programId: string,
  ) {
    requireUuid(programId, "programId");
    const enrollment = await repository.findEnrollment(userId, programId);
    if (!enrollment) throw new NotFoundError("Program enrollment", { programId });
    return enrollment;
  }

  private async transactionState(
    userId: string,
    programId: string,
    rewards: RewardSummary,
    stores: RewardTransactionStores,
  ) {
    const enrollment = await stores.progress.findEnrollment(userId, programId);
    if (!enrollment) throw new NotFoundError("Program enrollment");
    const xp = new XpService(stores.xp);
    const achievements = new AchievementService(stores.achievements, xp);
    return this.serverState(userId, toResponse(enrollment), rewards, xp, achievements);
  }

  private async serverState(
    userId: string,
    progress: UserProgressResponse | null,
    rewards: RewardSummary,
    xp: XpService,
    achievements: AchievementService,
  ): Promise<ServerProgramState> {
    const [total, allUnlocked] = await Promise.all([
      xp.totalXp(userId),
      achievements.listUnlocked(userId),
    ]);
    return {
      progress,
      xp: { awardedNow: rewards.xpAwardedNow, total },
      achievements: {
        newlyUnlocked: rewards.newlyUnlockedAchievements,
        allUnlocked,
      },
      source: "server",
    };
  }
}

export const userProgressService = new UserProgressService();

export type {
  MergeLocalProgressInput,
  ServerProgramState,
  UserProgressResponse,
} from "@/lib/progress/types";

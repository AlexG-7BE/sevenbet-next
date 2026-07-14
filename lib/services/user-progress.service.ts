import type { Prisma } from "@prisma/client";

import type {
  CmsBlock,
  ProgramBuilderLesson,
  ProgramBuilderSnapshot,
  ProgramBuilderStep,
} from "@/lib/cms/types";
import type {
  MergeLocalProgressInput,
  UserProgressResponse,
} from "@/lib/progress/types";
import {
  userProgressRepository,
  type MergeUserProgressInput,
  type PublishedProgramProgressSource,
  type UserProgressEnrollment,
  type UserProgressStore,
} from "@/lib/repositories/user-progress.repository";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./service-error";

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
  ) {}

  async getCurrentProgress(userId: string, programId: string) {
    requireUuid(programId, "programId");
    const enrollment = await this.repository.findEnrollment(userId, programId);
    if (!enrollment) return null;
    snapshotForEnrollment(enrollment);
    return toResponse(enrollment);
  }

  async startProgram(userId: string, input: { programId: string }) {
    requireUuid(input.programId, "programId");
    const source = await this.repository.findPublishedProgram(input.programId);

    if (!source) {
      throw new NotFoundError("Published program", {
        programId: input.programId,
      });
    }

    const enrollment = await this.repository.getOrCreateEnrollment({
      userId,
      programId: source.programId,
      programVersionId: source.programVersionId,
      currentStepId: firstStepId(source),
    });

    return toResponse(enrollment);
  }

  async setCurrentStep(
    userId: string,
    input: { programId: string; stepId: string },
  ) {
    requireUuid(input.programId, "programId");
    requireUuid(input.stepId, "stepId");
    const enrollment = await this.requireEnrollment(userId, input.programId);
    const snapshot = snapshotForEnrollment(enrollment);
    const targetStep = findStep(snapshot, input.stepId);
    const currentStep = enrollment.currentStepId
      ? snapshot.steps.find((step) => step.id === enrollment.currentStepId)
      : undefined;

    if (currentStep && currentStep.order >= targetStep.order) {
      return toResponse(enrollment);
    }

    await this.recordEvent(enrollment, {
      userId,
      entityId: targetStep.id,
      entityType: "STEP",
      eventType: "CURRENT",
      eventKey: `step:${targetStep.id}:current`,
    });

    const updated = await this.repository.setCurrentStep({
      userId,
      programId: input.programId,
      enrollmentId: enrollment.id,
      currentStepId: targetStep.id,
    });

    if (!updated) throw new NotFoundError("Program enrollment");
    return toResponse(updated);
  }

  async completeLesson(
    userId: string,
    input: { programId: string; lessonId: string },
  ) {
    requireUuid(input.lessonId, "lessonId");
    const enrollment = await this.requireEnrollment(userId, input.programId);
    const { lesson } = findLesson(
      snapshotForEnrollment(enrollment),
      input.lessonId,
    );
    const eventKeys = new Set(
      enrollment.progressEvents.map((event) => event.eventKey),
    );
    assertRequiredBlocksCompleted(lesson, eventKeys);

    await this.recordEvent(enrollment, {
      userId,
      entityId: lesson.id,
      entityType: "LESSON",
      eventType: "COMPLETED",
      eventKey: progressEventKey("lesson", lesson.id, "completed"),
    });
    return this.refresh(userId, input.programId);
  }

  async saveQuizResult(
    userId: string,
    input: { programId: string; blockId: string; answerIndex: number },
  ) {
    const { enrollment, block } = await this.requireBlock(
      userId,
      input.programId,
      input.blockId,
      ["QUIZ"],
    );
    const { options, correctIndex } = quizConfiguration(block);
    if (
      !Number.isInteger(input.answerIndex) ||
      input.answerIndex < 0 ||
      (options.length > 0 && input.answerIndex >= options.length)
    ) {
      throw new ValidationError("answerIndex is outside the quiz options");
    }
    const metadata: Prisma.InputJsonValue = {
      answerIndex: input.answerIndex,
      ...(correctIndex >= 0
        ? { correct: input.answerIndex === correctIndex }
        : {}),
    };

    await this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: "QUIZ",
      eventType: "SUBMITTED",
      eventKey: progressEventKey("quiz", block.id, "submitted"),
      metadata,
    });
    return this.refresh(userId, input.programId);
  }

  async saveScenarioResult(
    userId: string,
    input: { programId: string; blockId: string; answerIndex: number },
  ) {
    const { enrollment, block } = await this.requireBlock(
      userId,
      input.programId,
      input.blockId,
      ["SCENARIO"],
    );
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

    await this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: "SCENARIO",
      eventType: "SUBMITTED",
      eventKey: progressEventKey("scenario", block.id, "submitted"),
      metadata: { answerIndex: input.answerIndex },
    });
    return this.refresh(userId, input.programId);
  }

  async saveExercise(
    userId: string,
    input: { programId: string; blockId: string; response: string },
  ) {
    const { enrollment, block } = await this.requireBlock(
      userId,
      input.programId,
      input.blockId,
      ["EXERCISE", "REFLECTION", "PRACTICAL_TASK"],
    );
    const response = input.response.trim();
    if (!response || response.length > 4000) {
      throw new ValidationError("Exercise response must contain 1-4000 characters");
    }

    await this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: block.type,
      eventType: "COMPLETED",
      eventKey: progressEventKey("exercise", block.id, "completed"),
      metadata: { response },
    });
    return this.refresh(userId, input.programId);
  }

  async completeStep(
    userId: string,
    input: { programId: string; stepId: string },
  ) {
    requireUuid(input.stepId, "stepId");
    const enrollment = await this.requireEnrollment(userId, input.programId);
    const step = findStep(snapshotForEnrollment(enrollment), input.stepId);
    assertStepCanComplete(
      step,
      new Set(enrollment.progressEvents.map((event) => event.eventKey)),
    );

    await this.recordEvent(enrollment, {
      userId,
      entityId: step.id,
      entityType: "STEP",
      eventType: "COMPLETED",
      eventKey: progressEventKey("step", step.id, "completed"),
    });
    return this.refresh(userId, input.programId);
  }

  async mergeLocalProgress(userId: string, input: MergeLocalProgressInput) {
    requireUuid(input.programId, "programId");
    let enrollment = await this.repository.findEnrollment(
      userId,
      input.programId,
    );

    if (!enrollment) {
      const source = await this.repository.findPublishedProgram(input.programId);
      if (!source) {
        throw new NotFoundError("Published program", {
          programId: input.programId,
        });
      }
      enrollment = await this.repository.getOrCreateEnrollment({
        userId,
        programId: input.programId,
        programVersionId: source.programVersionId,
        currentStepId: firstStepId(source),
      });
    }

    const snapshot = snapshotForEnrollment(enrollment);
    const activeSteps = snapshot.steps
      .filter((step) => !step.archivedAt)
      .slice()
      .sort((a, b) => a.order - b.order);
    const activeLessons = activeSteps.flatMap((step) =>
      step.lessons.filter((lesson) => !lesson.archivedAt),
    );
    const activeBlocks = activeLessons.flatMap((lesson) =>
      lesson.blocks.filter((block) => !block.archived),
    );
    const stepIds = new Set(activeSteps.map((step) => step.id));
    const lessonIds = new Set(activeLessons.map((lesson) => lesson.id));
    const quizIds = new Set(
      activeBlocks.filter((block) => block.type === "QUIZ").map((block) => block.id),
    );
    const scenarioIds = new Set(
      activeBlocks
        .filter((block) => block.type === "SCENARIO")
        .map((block) => block.id),
    );
    const exerciseIds = new Set(
      activeBlocks
        .filter((block) =>
          ["EXERCISE", "REFLECTION", "PRACTICAL_TASK"].includes(block.type),
        )
        .map((block) => block.id),
    );

    const accepted = {
      steps: uniqueIds(input.completedStepIds).filter((id) => stepIds.has(id)),
      lessons: uniqueIds(input.completedLessonIds).filter((id) =>
        lessonIds.has(id),
      ),
      quizzes: uniqueIds(input.completedQuizIds).filter((id) => quizIds.has(id)),
      scenarios: uniqueIds(input.completedScenarioIds).filter((id) =>
        scenarioIds.has(id),
      ),
      exercises: uniqueIds(input.completedExerciseIds).filter((id) =>
        exerciseIds.has(id),
      ),
    };
    const events: MergeUserProgressInput["events"] = [
      ...accepted.steps.map((id) => ({
        entityId: id,
        entityType: "STEP",
        eventType: "COMPLETED",
        eventKey: progressEventKey("step", id, "completed"),
      })),
      ...accepted.lessons.map((id) => ({
        entityId: id,
        entityType: "LESSON",
        eventType: "COMPLETED",
        eventKey: progressEventKey("lesson", id, "completed"),
      })),
      ...accepted.quizzes.map((id) => ({
        entityId: id,
        entityType: "QUIZ",
        eventType: "SUBMITTED",
        eventKey: progressEventKey("quiz", id, "submitted"),
      })),
      ...accepted.scenarios.map((id) => ({
        entityId: id,
        entityType: "SCENARIO",
        eventType: "SUBMITTED",
        eventKey: progressEventKey("scenario", id, "submitted"),
      })),
      ...accepted.exercises.map((id) => ({
        entityId: id,
        entityType: "EXERCISE",
        eventType: "COMPLETED",
        eventKey: progressEventKey("exercise", id, "completed"),
      })),
    ];

    const existingCompletedSteps = enrollment.progressEvents
      .filter(
        (event) =>
          event.eventKey.startsWith("step:") &&
          event.eventKey.endsWith(":completed"),
      )
      .map((event) => event.entityId);
    const allCompletedSteps = new Set([
      ...existingCompletedSteps,
      ...accepted.steps,
    ]);
    const currentCandidates = uniqueIds([
      ...(enrollment.currentStepId ? [enrollment.currentStepId] : []),
      ...(input.currentStepId && stepIds.has(input.currentStepId)
        ? [input.currentStepId]
        : []),
      ...accepted.steps,
    ]);
    const currentStepId = activeSteps
      .filter((step) => currentCandidates.includes(step.id))
      .sort((a, b) => b.order - a.order)[0]?.id;
    const completeProgram =
      input.programCompleted &&
      activeSteps.length > 0 &&
      activeSteps.every((step) => allCompletedSteps.has(step.id));

    if (completeProgram) {
      events.push({
        entityId: input.programId,
        entityType: "PROGRAM",
        eventType: "COMPLETED",
        eventKey: progressEventKey("program", input.programId, "completed"),
      });
    }

    const merged = await this.repository.mergeProgress({
      userId,
      programId: input.programId,
      enrollmentId: enrollment.id,
      markerEvent: {
        entityId: input.programId,
        entityType: "PROGRAM",
        eventType: "ANONYMOUS_MERGE",
        eventKey: `program:${input.programId}:anonymous-merge:v1`,
        metadata: { version: 1 },
      },
      events,
      currentStepId,
      completeProgram,
    });

    if (!merged) throw new NotFoundError("Program enrollment");
    return toResponse(merged);
  }

  async completeProgram(userId: string, input: { programId: string }) {
    const enrollment = await this.requireEnrollment(userId, input.programId);
    if (enrollment.completedAt) return toResponse(enrollment);

    const snapshot = snapshotForEnrollment(enrollment);
    const eventKeys = new Set(
      enrollment.progressEvents.map((event) => event.eventKey),
    );
    const incompleteSteps = snapshot.steps
      .filter((step) => !step.archivedAt)
      .filter(
        (step) =>
          !eventKeys.has(progressEventKey("step", step.id, "completed")),
      )
      .map((step) => step.id);

    if (incompleteSteps.length) {
      throw new ConflictError("Program steps are incomplete", {
        incompleteStepIds: incompleteSteps,
      });
    }

    await this.recordEvent(enrollment, {
      userId,
      entityId: input.programId,
      entityType: "PROGRAM",
      eventType: "COMPLETED",
      eventKey: progressEventKey("program", input.programId, "completed"),
    });

    const completed = await this.repository.completeEnrollment({
      userId,
      programId: input.programId,
      enrollmentId: enrollment.id,
    });
    if (!completed) throw new NotFoundError("Program enrollment");
    return toResponse(completed);
  }

  private async requireEnrollment(userId: string, programId: string) {
    requireUuid(programId, "programId");
    const enrollment = await this.repository.findEnrollment(userId, programId);
    if (!enrollment) {
      throw new NotFoundError("Program enrollment", { programId });
    }
    return enrollment;
  }

  private async requireBlock(
    userId: string,
    programId: string,
    blockId: string,
    allowedTypes: CmsBlock["type"][],
  ) {
    requireUuid(blockId, "blockId");
    const enrollment = await this.requireEnrollment(userId, programId);
    const { block } = findBlock(snapshotForEnrollment(enrollment), blockId);
    if (!allowedTypes.includes(block.type)) {
      throw new ValidationError("Block type does not match this progress action", {
        blockId,
        blockType: block.type,
      });
    }
    return { enrollment, block };
  }

  private async recordEvent(
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
    const event = await this.repository.recordEvent({
      ...input,
      programId: enrollment.programId,
      enrollmentId: enrollment.id,
    });
    if (!event) throw new NotFoundError("Program enrollment");
    return event;
  }

  private async refresh(userId: string, programId: string) {
    const enrollment = await this.repository.findEnrollment(userId, programId);
    if (!enrollment) throw new NotFoundError("Program enrollment");
    return toResponse(enrollment);
  }
}

export const userProgressService = new UserProgressService();

export type {
  MergeLocalProgressInput,
  UserProgressResponse,
} from "@/lib/progress/types";

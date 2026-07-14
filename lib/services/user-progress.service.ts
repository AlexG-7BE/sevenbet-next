import type { Prisma } from "@prisma/client";

import type {
  CmsBlock,
  ProgramBuilderLesson,
  ProgramBuilderSnapshot,
  ProgramBuilderStep,
} from "@/lib/cms/types";
import {
  userProgressRepository,
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

export type UserProgressResponse = {
  programId: string;
  programVersion: number;
  startedAt: string;
  completedAt: string | null;
  currentStepId: string | null;
  completedLessonIds: string[];
  completedStepIds: string[];
  submittedQuizIds: string[];
  submittedScenarioIds: string[];
  completedExerciseIds: string[];
  events: Array<{
    entityId: string;
    entityType: string;
    eventType: string;
    eventKey: string;
    metadata: Prisma.JsonValue | null;
    createdAt: string;
  }>;
};

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
  const step = snapshot.steps.find((candidate) => candidate.id === stepId);
  if (!step) {
    throw new ValidationError("Step does not belong to this program", {
      stepId,
    });
  }
  return step;
}

function findLesson(snapshot: ProgramBuilderSnapshot, lessonId: string) {
  for (const step of snapshot.steps) {
    const lesson = step.lessons.find((candidate) => candidate.id === lessonId);
    if (lesson) return { step, lesson };
  }

  throw new ValidationError("Lesson does not belong to this program", {
    lessonId,
  });
}

function findBlock(snapshot: ProgramBuilderSnapshot, blockId: string) {
  for (const step of snapshot.steps) {
    for (const lesson of step.lessons) {
      const block = lesson.blocks.find((candidate) => candidate.id === blockId);
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
  const keys = enrollment.progressEvents.map((event) => event.eventKey);
  const idsFor = (prefix: string, suffix: string) =>
    enrollment.progressEvents
      .filter(
        (event) =>
          event.eventKey.startsWith(`${prefix}:`) &&
          event.eventKey.endsWith(`:${suffix}`),
      )
      .map((event) => event.entityId);

  return {
    programId: enrollment.programId,
    programVersion: enrollment.programVersion.version,
    startedAt: enrollment.startedAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString() ?? null,
    currentStepId: enrollment.currentStepId,
    completedLessonIds: idsFor("lesson", "completed"),
    completedStepIds: idsFor("step", "completed"),
    submittedQuizIds: idsFor("quiz", "submitted"),
    submittedScenarioIds: idsFor("scenario", "submitted"),
    completedExerciseIds: idsFor("exercise", "completed"),
    events: enrollment.progressEvents.map((event) => ({
      entityId: event.entityId,
      entityType: event.entityType,
      eventType: event.eventType,
      eventKey: event.eventKey,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

function firstStepId(source: PublishedProgramProgressSource) {
  const snapshot = readPublishedSnapshot(source.snapshot, source.programId);
  return snapshot.steps.slice().sort((a, b) => a.order - b.order)[0]?.id;
}

export class UserProgressService {
  constructor(
    private readonly repository: UserProgressStore = userProgressRepository,
  ) {}

  async getCurrentProgress(userId: string, programId: string) {
    requireUuid(programId, "programId");
    const enrollment = await this.repository.findEnrollment(userId, programId);
    return enrollment ? toResponse(enrollment) : null;
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
    findStep(snapshotForEnrollment(enrollment), input.stepId);

    const updated = await this.repository.setCurrentStep({
      userId,
      programId: input.programId,
      enrollmentId: enrollment.id,
      currentStepId: input.stepId,
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

    return this.recordEvent(enrollment, {
      userId,
      entityId: lesson.id,
      entityType: "LESSON",
      eventType: "COMPLETED",
      eventKey: progressEventKey("lesson", lesson.id, "completed"),
    });
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
    const options = Array.isArray(block.data.options) ? block.data.options : [];
    if (
      !Number.isInteger(input.answerIndex) ||
      input.answerIndex < 0 ||
      (options.length > 0 && input.answerIndex >= options.length)
    ) {
      throw new ValidationError("answerIndex is outside the quiz options");
    }
    const correctIndex = block.data.correctIndex;
    const metadata: Prisma.InputJsonValue = {
      answerIndex: input.answerIndex,
      ...(typeof correctIndex === "number"
        ? { correct: input.answerIndex === correctIndex }
        : {}),
    };

    return this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: "QUIZ",
      eventType: "SUBMITTED",
      eventKey: progressEventKey("quiz", block.id, "submitted"),
      metadata,
    });
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
    const options = Array.isArray(block.data.options) ? block.data.options : [];
    if (
      !Number.isInteger(input.answerIndex) ||
      input.answerIndex < 0 ||
      (options.length > 0 && input.answerIndex >= options.length)
    ) {
      throw new ValidationError("answerIndex is outside the scenario options");
    }

    return this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: "SCENARIO",
      eventType: "SUBMITTED",
      eventKey: progressEventKey("scenario", block.id, "submitted"),
      metadata: { answerIndex: input.answerIndex },
    });
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

    return this.recordEvent(enrollment, {
      userId,
      entityId: block.id,
      entityType: block.type,
      eventType: "COMPLETED",
      eventKey: progressEventKey("exercise", block.id, "completed"),
      metadata: { response },
    });
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

    return this.recordEvent(enrollment, {
      userId,
      entityId: step.id,
      entityType: "STEP",
      eventType: "COMPLETED",
      eventKey: progressEventKey("step", step.id, "completed"),
    });
  }

  async completeProgram(userId: string, input: { programId: string }) {
    const enrollment = await this.requireEnrollment(userId, input.programId);
    if (enrollment.completedAt) return toResponse(enrollment);

    const snapshot = snapshotForEnrollment(enrollment);
    const eventKeys = new Set(
      enrollment.progressEvents.map((event) => event.eventKey),
    );
    const incompleteSteps = snapshot.steps
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
}

export const userProgressService = new UserProgressService();

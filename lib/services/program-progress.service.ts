import {
  Prisma,
  type ProgramEnrollment,
  type ProgramProgressEvent,
} from "@prisma/client";

import {
  programProgressRepository,
  programRepository,
  type EnrollmentWithProgress,
} from "@/lib/repositories";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./service-error";

export interface StartProgramInput {
  userId: string;
  programId: string;
}

export interface RecordProgressInput {
  userId: string;
  programId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  eventKey: string;
  metadata?: Prisma.InputJsonValue;
}

export class ProgramProgressService {
  async getProgress(
    userId: string,
    programId: string,
  ): Promise<EnrollmentWithProgress | null> {
    return programProgressRepository.findEnrollment(
      userId,
      programId,
    );
  }

  async startProgram(
    input: StartProgramInput,
  ): Promise<ProgramEnrollment> {
    if (!input.userId.trim()) {
      throw new ValidationError(
        "User ID is required",
      );
    }

    const program =
      await programRepository.findById(
        input.programId,
      );

    if (!program) {
      throw new NotFoundError("Program", {
        id: input.programId,
      });
    }

    const publishedVersion =
      program.versions.find(
        (version) =>
          version.status === "PUBLISHED",
      );

    if (!publishedVersion) {
      throw new ConflictError(
        "Program does not have a published version",
        {
          programId: input.programId,
        },
      );
    }

    const firstStep = program.steps[0];

    return programProgressRepository.getOrCreateEnrollment({
      userId: input.userId,
      programId: input.programId,
      programVersionId: publishedVersion.id,
      currentStepId: firstStep?.id,
    });
  }

  async setCurrentStep(
    input: {
      userId: string;
      programId: string;
      stepId: string;
    },
  ): Promise<ProgramEnrollment> {
    const program =
      await programRepository.findById(
        input.programId,
      );

    if (!program) {
      throw new NotFoundError("Program", {
        id: input.programId,
      });
    }

    const stepExists = program.steps.some(
      (step) => step.id === input.stepId,
    );

    if (!stepExists) {
      throw new ValidationError(
        "Step does not belong to this program",
        {
          programId: input.programId,
          stepId: input.stepId,
        },
      );
    }

    const enrollment =
      await programProgressRepository.findEnrollment(
        input.userId,
        input.programId,
      );

    if (!enrollment) {
      throw new NotFoundError(
        "Program enrollment",
        {
          userId: input.userId,
          programId: input.programId,
        },
      );
    }

    return programProgressRepository.setCurrentStep(
      enrollment.id,
      input.stepId,
    );
  }

  async recordProgress(
    input: RecordProgressInput,
  ): Promise<ProgramProgressEvent> {
    const enrollment =
      await programProgressRepository.findEnrollment(
        input.userId,
        input.programId,
      );

    if (!enrollment) {
      throw new NotFoundError(
        "Program enrollment",
        {
          userId: input.userId,
          programId: input.programId,
        },
      );
    }

    if (!input.eventKey.trim()) {
      throw new ValidationError(
        "Progress event key is required",
      );
    }

    return programProgressRepository.recordProgressEvent({
      enrollmentId: enrollment.id,
      entityId: input.entityId,
      entityType: input.entityType,
      eventType: input.eventType,
      eventKey: input.eventKey,
      metadata: input.metadata,
    });
  }

  async completeProgram(
    userId: string,
    programId: string,
  ): Promise<ProgramEnrollment> {
    const enrollment =
      await programProgressRepository.findEnrollment(
        userId,
        programId,
      );

    if (!enrollment) {
      throw new NotFoundError(
        "Program enrollment",
        {
          userId,
          programId,
        },
      );
    }

    if (enrollment.completedAt) {
      return enrollment;
    }

    return programProgressRepository.completeEnrollment(
      enrollment.id,
    );
  }
}

export const programProgressService =
  new ProgramProgressService();

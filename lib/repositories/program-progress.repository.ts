import {
  Prisma,
  type ProgramEnrollment,
  type ProgramProgressEvent,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type EnrollmentWithProgress =
  Prisma.ProgramEnrollmentGetPayload<{
    include: {
      program: true;
      programVersion: true;
      progressEvents: true;
    };
  }>;

export interface CreateProgressEventInput {
  enrollmentId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  eventKey: string;
  metadata?: Prisma.InputJsonValue;
}

export class ProgramProgressRepository {
  async findEnrollment(
    userId: string,
    programId: string,
  ): Promise<EnrollmentWithProgress | null> {
    return prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      include: {
        program: true,
        programVersion: true,
        progressEvents: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async createEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }): Promise<ProgramEnrollment> {
    return prisma.programEnrollment.create({
      data: {
        userId: input.userId,
        programId: input.programId,
        programVersionId: input.programVersionId,
        currentStepId: input.currentStepId,
      },
    });
  }

  async getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }): Promise<ProgramEnrollment> {
    return prisma.programEnrollment.upsert({
      where: {
        userId_programId: {
          userId: input.userId,
          programId: input.programId,
        },
      },
      update: {},
      create: {
        userId: input.userId,
        programId: input.programId,
        programVersionId: input.programVersionId,
        currentStepId: input.currentStepId,
      },
    });
  }

  async setCurrentStep(
    enrollmentId: string,
    currentStepId: string,
  ): Promise<ProgramEnrollment> {
    return prisma.programEnrollment.update({
      where: {
        id: enrollmentId,
      },
      data: {
        currentStepId,
      },
    });
  }

  async completeEnrollment(
    enrollmentId: string,
  ): Promise<ProgramEnrollment> {
    return prisma.programEnrollment.update({
      where: {
        id: enrollmentId,
      },
      data: {
        completedAt: new Date(),
      },
    });
  }

  async recordProgressEvent(
    input: CreateProgressEventInput,
  ): Promise<ProgramProgressEvent> {
    return prisma.programProgressEvent.upsert({
      where: {
        enrollmentId_eventKey: {
          enrollmentId: input.enrollmentId,
          eventKey: input.eventKey,
        },
      },
      update: {
        metadata: input.metadata,
      },
      create: {
        enrollmentId: input.enrollmentId,
        entityId: input.entityId,
        entityType: input.entityType,
        eventType: input.eventType,
        eventKey: input.eventKey,
        metadata: input.metadata,
      },
    });
  }

  async hasProgressEvent(
    enrollmentId: string,
    eventKey: string,
  ): Promise<boolean> {
    const event = await prisma.programProgressEvent.findUnique({
      where: {
        enrollmentId_eventKey: {
          enrollmentId,
          eventKey,
        },
      },
      select: {
        id: true,
      },
    });

    return event !== null;
  }

  async listProgressEvents(
    enrollmentId: string,
  ): Promise<ProgramProgressEvent[]> {
    return prisma.programProgressEvent.findMany({
      where: {
        enrollmentId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}

export const programProgressRepository =
  new ProgramProgressRepository();

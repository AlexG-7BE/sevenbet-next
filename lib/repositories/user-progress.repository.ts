import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type StoredProgressEvent = {
  id: string;
  enrollmentId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  eventKey: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

export type UserProgressEnrollment = {
  id: string;
  userId: string;
  programId: string;
  programVersionId: string;
  startedAt: Date;
  completedAt: Date | null;
  currentStepId: string | null;
  programVersion: {
    id: string;
    programId: string;
    version: number;
    status: string;
    snapshot: Prisma.JsonValue;
  };
  progressEvents: StoredProgressEvent[];
};

export type PublishedProgramProgressSource = {
  programId: string;
  programVersionId: string;
  version: number;
  snapshot: Prisma.JsonValue;
};

export type RecordUserProgressEventInput = {
  userId: string;
  programId: string;
  enrollmentId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  eventKey: string;
  metadata?: Prisma.InputJsonValue;
};

export type RecordUserProgressEventResult = {
  event: StoredProgressEvent;
  created: boolean;
};

export interface UserProgressStore {
  findPublishedProgram(
    programId: string,
  ): Promise<PublishedProgramProgressSource | null>;
  findEnrollment(
    userId: string,
    programId: string,
  ): Promise<UserProgressEnrollment | null>;
  getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }): Promise<UserProgressEnrollment>;
  setCurrentStep(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
    currentStepId: string;
  }): Promise<UserProgressEnrollment | null>;
  recordEvent(
    input: RecordUserProgressEventInput,
  ): Promise<RecordUserProgressEventResult | null>;
  completeEnrollment(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
  }): Promise<UserProgressEnrollment | null>;
}

const enrollmentInclude = {
  programVersion: {
    select: {
      id: true,
      programId: true,
      version: true,
      status: true,
      snapshot: true,
    },
  },
  progressEvents: {
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
  },
} satisfies Prisma.ProgramEnrollmentInclude;

export class UserProgressRepository implements UserProgressStore {
  constructor(
    private readonly database: Prisma.TransactionClient = prisma,
  ) {}

  async findPublishedProgram(
    programId: string,
  ): Promise<PublishedProgramProgressSource | null> {
    const program = await this.database.program.findFirst({
      where: {
        id: programId,
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        publishedVersion: { gt: 0 },
      },
      select: {
        id: true,
        publishedVersion: true,
      },
    });

    if (!program) return null;

    const version = await this.database.programVersion.findUnique({
      where: {
        programId_version: {
          programId: program.id,
          version: program.publishedVersion,
        },
      },
      select: {
        id: true,
        version: true,
        status: true,
        snapshot: true,
      },
    });

    if (!version || version.status !== "PUBLISHED") return null;

    return {
      programId: program.id,
      programVersionId: version.id,
      version: version.version,
      snapshot: version.snapshot,
    };
  }

  async findEnrollment(
    userId: string,
    programId: string,
  ): Promise<UserProgressEnrollment | null> {
    return this.database.programEnrollment.findUnique({
      where: {
        userId_programId: { userId, programId },
      },
      include: enrollmentInclude,
    });
  }

  async getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }): Promise<UserProgressEnrollment> {
    return this.database.programEnrollment.upsert({
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
      include: enrollmentInclude,
    });
  }

  async setCurrentStep(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
    currentStepId: string;
  }): Promise<UserProgressEnrollment | null> {
    const result = await this.database.programEnrollment.updateMany({
      where: {
        id: input.enrollmentId,
        userId: input.userId,
        programId: input.programId,
      },
      data: {
        currentStepId: input.currentStepId,
      },
    });

    if (result.count !== 1) return null;
    return this.findEnrollment(input.userId, input.programId);
  }

  async recordEvent(
    input: RecordUserProgressEventInput,
  ): Promise<RecordUserProgressEventResult | null> {
    const enrollment = await this.database.programEnrollment.findFirst({
      where: {
        id: input.enrollmentId,
        userId: input.userId,
        programId: input.programId,
      },
      select: { id: true },
    });

    if (!enrollment) return null;

    const result = await this.database.programProgressEvent.createMany({
      data: [{
        enrollmentId: enrollment.id,
        entityId: input.entityId,
        entityType: input.entityType,
        eventType: input.eventType,
        eventKey: input.eventKey,
        metadata: input.metadata,
      }],
      skipDuplicates: true,
    });
    const event = await this.database.programProgressEvent.findUnique({
      where: {
        enrollmentId_eventKey: {
          enrollmentId: enrollment.id,
          eventKey: input.eventKey,
        },
      },
    });
    return event ? { event, created: result.count === 1 } : null;
  }

  async completeEnrollment(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
  }): Promise<UserProgressEnrollment | null> {
    await this.database.programEnrollment.updateMany({
      where: {
        id: input.enrollmentId,
        userId: input.userId,
        programId: input.programId,
        completedAt: null,
      },
      data: {
        completedAt: new Date(),
      },
    });

    return this.findEnrollment(input.userId, input.programId);
  }

}

export const userProgressRepository = new UserProgressRepository();

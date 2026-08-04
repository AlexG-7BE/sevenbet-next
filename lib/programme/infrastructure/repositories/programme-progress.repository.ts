import {
  EditorialStatus,
  Prisma,
  type ProgrammeMissionStatus,
} from "@prisma/client";

import { CONTROL_PROGRAM_SLUG } from "@/lib/programme/contract";

export class ProgrammeProgressRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

  async findControlProgram() {
    const program = await this.database.program.findFirst({
      where: {
        slug: CONTROL_PROGRAM_SLUG,
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        publishedVersion: { gt: 0 },
      },
      include: {
        steps: {
          where: { archivedAt: null },
          orderBy: { order: "asc" },
        },
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
    });
    if (!version || version.status !== "PUBLISHED") return null;
    return { program, version };
  }

  findEnrollment(userId: string, programId: string) {
    return this.database.programEnrollment.findUnique({
      where: { userId_programId: { userId, programId } },
    });
  }

  getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId: string;
    timezone: string;
  }) {
    return this.database.programEnrollment.upsert({
      where: {
        userId_programId: { userId: input.userId, programId: input.programId },
      },
      update: {},
      create: input,
    });
  }

  setEnrollmentCurrentStep(enrollmentId: string, currentStepId: string) {
    return this.database.programEnrollment.update({
      where: { id: enrollmentId },
      data: { currentStepId },
    });
  }

  findMissionProgress(enrollmentId: string, missionNumber: number) {
    return this.database.programmeMissionProgress.findUnique({
      where: { enrollmentId_missionNumber: { enrollmentId, missionNumber } },
    });
  }

  upsertMissionProgress(input: {
    enrollmentId: string;
    missionNumber: number;
    status: ProgrammeMissionStatus;
    taskStates: string[];
    draft?: Record<string, unknown> | null;
    completedAt?: Date | null;
  }) {
    const { enrollmentId, missionNumber, draft, ...rest } = input;
    const data = {
      ...rest,
      ...(draft === undefined
        ? {}
        : { draft: draft === null ? Prisma.JsonNull : draft as Prisma.InputJsonObject }),
    };
    return this.database.programmeMissionProgress.upsert({
      where: { enrollmentId_missionNumber: { enrollmentId, missionNumber } },
      update: data,
      create: { enrollmentId, missionNumber, ...data },
    });
  }

  updateMissionDraftIfOpen(input: {
    enrollmentId: string;
    missionNumber: number;
    status: ProgrammeMissionStatus;
    taskStates: string[];
    draft: Record<string, unknown>;
  }) {
    return this.database.programmeMissionProgress.updateMany({
      where: {
        enrollmentId: input.enrollmentId,
        missionNumber: input.missionNumber,
        status: { not: "COMPLETED" },
      },
      data: {
        status: input.status,
        taskStates: input.taskStates,
        draft: input.draft as Prisma.InputJsonObject,
      },
    });
  }
}

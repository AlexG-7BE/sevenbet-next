import { Prisma } from "@prisma/client";

import type { ProgrammeStartingPointValue } from "@/lib/programme/program-ai/contracts";

export class ProgrammeAiMissionOneRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

  findActiveAnonymousAuthority(input: {
    anonymousSessionId: string;
    purposeVersion: string;
    statementVersion: string;
  }) {
    return this.database.programmeSensitiveInputAuthority.findFirst({
      where: { ...input, withdrawnAt: null },
      orderBy: { confirmedAt: "desc" },
    });
  }

  async confirmAnonymousAuthority(input: {
    anonymousSessionId: string;
    purposeVersion: string;
    statementVersion: string;
    confirmedAt: Date;
  }) {
    const current = await this.database.programmeSensitiveInputAuthority.findUnique({
      where: {
        anonymousSessionId_purposeVersion_statementVersion: {
          anonymousSessionId: input.anonymousSessionId,
          purposeVersion: input.purposeVersion,
          statementVersion: input.statementVersion,
        },
      },
    });
    if (current && !current.withdrawnAt) return current;
    return this.database.programmeSensitiveInputAuthority.upsert({
      where: {
        anonymousSessionId_purposeVersion_statementVersion: {
          anonymousSessionId: input.anonymousSessionId,
          purposeVersion: input.purposeVersion,
          statementVersion: input.statementVersion,
        },
      },
      update: { confirmedAt: input.confirmedAt, withdrawnAt: null },
      create: input,
    });
  }

  withdrawAnonymousAuthority(anonymousSessionId: string, withdrawnAt: Date) {
    return this.database.programmeSensitiveInputAuthority.updateMany({
      where: { anonymousSessionId, withdrawnAt: null },
      data: { withdrawnAt },
    });
  }

  async bindAnonymousAuthorityToUser(input: {
    anonymousSessionId: string;
    userId: string;
    purposeVersion: string;
    statementVersion: string;
  }) {
    const anonymous = await this.findActiveAnonymousAuthority({
      anonymousSessionId: input.anonymousSessionId,
      purposeVersion: input.purposeVersion,
      statementVersion: input.statementVersion,
    });
    if (!anonymous) return { count: 0 };
    const existing = await this.database.programmeSensitiveInputAuthority.findUnique({
      where: {
        userId_purposeVersion_statementVersion: {
          userId: input.userId,
          purposeVersion: input.purposeVersion,
          statementVersion: input.statementVersion,
        },
      },
    });
    if (existing) {
      await this.database.programmeSensitiveInputAuthority.update({
        where: { id: existing.id },
        data: { anonymousSessionId: null, confirmedAt: anonymous.confirmedAt, withdrawnAt: null },
      });
      await this.database.programmeSensitiveInputAuthority.delete({
        where: { id: anonymous.id },
      });
      return { count: 1 };
    }
    return this.database.programmeSensitiveInputAuthority.updateMany({
      where: {
        id: anonymous.id,
        anonymousSessionId: input.anonymousSessionId,
        userId: null,
        withdrawnAt: null,
      },
      data: { anonymousSessionId: null, userId: input.userId },
    });
  }

  findStartingPoint(userId: string) {
    return this.database.programmeStartingPoint.findUnique({ where: { userId } });
  }

  createStartingPoint(input: {
    userId: string;
    enrollmentId: string;
    value: ProgrammeStartingPointValue;
    confirmedAt: Date;
    version: string;
  }) {
    return this.database.programmeStartingPoint.create({
      data: {
        userId: input.userId,
        enrollmentId: input.enrollmentId,
        ...input.value,
        chosenBoundaryAction: input.value.chosenBoundaryAction || null,
        provenance: "USER_CONFIRMED",
        version: input.version,
        confirmedAt: input.confirmedAt,
      },
    });
  }

  findHigherMissionProgress(enrollmentId: string) {
    return this.database.programmeMissionProgress.findFirst({
      where: {
        enrollmentId,
        missionNumber: { gt: 1 },
        status: { not: "NOT_STARTED" },
      },
      orderBy: { missionNumber: "desc" },
    });
  }

  async home(userId: string, programId: string) {
    const enrollment = await this.database.programEnrollment.findUnique({
      where: { userId_programId: { userId, programId } },
      include: {
        missionProgress: { orderBy: { missionNumber: "asc" } },
        programmeStartingPoint: true,
      },
    });
    const xp = await this.database.userXpEvent.aggregate({
      where: { userId, programId },
      _sum: { xp: true },
    });
    return { enrollment, totalXp: xp._sum.xp ?? 0 };
  }
}

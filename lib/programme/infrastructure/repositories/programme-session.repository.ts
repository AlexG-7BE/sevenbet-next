import { Prisma, type ProgrammeMissionStatus } from "@prisma/client";

export class ProgrammeSessionRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

  createAnonymousSession(input: {
    tokenHash: string;
    missionVersion: string;
    evidenceVersion: string;
    expiresAt: Date;
  }) {
    return this.database.anonymousProgrammeSession.create({
      data: { ...input, taskStates: [] },
    });
  }

  findAnonymousSession(tokenHash: string) {
    return this.database.anonymousProgrammeSession.findUnique({
      where: { tokenHash },
      include: { pendingClaim: true },
    });
  }

  updateAnonymousSession(
    id: string,
    input: {
      missionState: ProgrammeMissionStatus;
      taskStates: string[];
      draft: Record<string, unknown>;
      expiresAt: Date;
      lastActivityAt: Date;
    },
  ) {
    return this.database.anonymousProgrammeSession.update({
      where: { id },
      data: { ...input, draft: input.draft as Prisma.InputJsonObject },
    });
  }

  transitionAnonymousSessionToRegistration(id: string, now: Date) {
    return this.database.anonymousProgrammeSession.updateMany({
      where: {
        id,
        missionState: "READY_TO_SAVE",
        deletedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        missionState: "REGISTRATION_REQUIRED",
        lastActivityAt: now,
      },
    });
  }

  upsertPendingClaim(input: {
    anonymousSessionId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.database.pendingProgrammeClaim.upsert({
      where: { anonymousSessionId: input.anonymousSessionId },
      update: {
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        consumedAt: null,
        consumedByUserId: null,
      },
      create: input,
    });
  }

  findClaim(tokenHash: string) {
    return this.database.pendingProgrammeClaim.findUnique({
      where: { tokenHash },
      include: { anonymousSession: true },
    });
  }

  consumeClaim(id: string, userId: string, now: Date) {
    return this.database.pendingProgrammeClaim.updateMany({
      where: { id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now, consumedByUserId: userId },
    });
  }

  completeAnonymousSession(id: string, now: Date) {
    return this.database.anonymousProgrammeSession.update({
      where: { id },
      data: {
        missionState: "COMPLETED",
        draft: Prisma.JsonNull,
        lastActivityAt: now,
        deletedAt: now,
      },
    });
  }
}

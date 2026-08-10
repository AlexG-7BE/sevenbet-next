import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ProgrammeArtefactRepository } from "@/lib/programme/infrastructure/repositories/programme-artefact.repository";
import { ProgrammeDashboardRepository } from "@/lib/programme/infrastructure/repositories/programme-dashboard.repository";
import { ProgrammeProgressRepository } from "@/lib/programme/infrastructure/repositories/programme-progress.repository";
import { ProgrammeRewardRepository } from "@/lib/programme/infrastructure/repositories/programme-reward.repository";
import { ProgrammeSessionRepository } from "@/lib/programme/infrastructure/repositories/programme-session.repository";
import { ProgrammeAiMissionOneRepository } from "@/lib/programme/infrastructure/repositories/programme-ai-mission-one.repository";

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export class ProgrammeUnitOfWork {
  readonly sessions: ProgrammeSessionRepository;
  readonly progress: ProgrammeProgressRepository;
  readonly artefacts: ProgrammeArtefactRepository;
  readonly rewards: ProgrammeRewardRepository;
  readonly dashboard: ProgrammeDashboardRepository;
  readonly programAiMissionOne: ProgrammeAiMissionOneRepository;

  constructor(private readonly database: Prisma.TransactionClient = prisma) {
    this.sessions = new ProgrammeSessionRepository(database);
    this.progress = new ProgrammeProgressRepository(database);
    this.artefacts = new ProgrammeArtefactRepository(database);
    this.rewards = new ProgrammeRewardRepository(database);
    this.dashboard = new ProgrammeDashboardRepository(database);
    this.programAiMissionOne = new ProgrammeAiMissionOneRepository(database);
  }

  async serializable<T>(operation: (unitOfWork: ProgrammeUnitOfWork) => Promise<T>) {
    if (this.database !== prisma) return operation(this);
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(
          (transaction) => operation(new ProgrammeUnitOfWork(transaction)),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 15_000,
          },
        );
      } catch (error) {
        lastError = error;
        if (!isRetryableTransactionError(error)) throw error;
      }
    }
    throw lastError;
  }

  snapshot<T>(operation: (unitOfWork: ProgrammeUnitOfWork) => Promise<T>) {
    if (this.database !== prisma) return operation(this);
    return prisma.$transaction(
      (transaction) => operation(new ProgrammeUnitOfWork(transaction)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 5_000,
        timeout: 10_000,
      },
    );
  }
}

export const programmeUnitOfWork = new ProgrammeUnitOfWork();

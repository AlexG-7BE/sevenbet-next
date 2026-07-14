import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type EligibleAchievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  xpReward: number;
  hidden: boolean;
  triggerType: string;
  triggerConfig: Prisma.JsonValue;
};

export type StoredUserAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  awardKey: string;
  awardedAt: Date;
};

export type AchievementProgressCounts = {
  lessons: number;
  steps: number;
  quizzes: number;
  passedQuizzes: number;
  programs: number;
};

export interface AchievementStore {
  findEligible(now: Date): Promise<EligibleAchievement[]>;
  createUnlock(input: {
    userId: string;
    achievementId: string;
    awardKey: string;
  }): Promise<{ achievement: StoredUserAchievement; created: boolean }>;
  listUnlocked(userId: string): Promise<Array<{
    awardedAt: Date;
    achievement: Omit<EligibleAchievement, "triggerType" | "triggerConfig" | "xpReward" | "hidden">;
  }>>;
  progressCounts(userId: string, programId?: string): Promise<AchievementProgressCounts>;
}

export class AchievementRepository implements AchievementStore {
  constructor(
    private readonly database: Prisma.TransactionClient = prisma,
  ) {}

  async findEligible(now: Date) {
    return this.database.achievement.findMany({
      where: {
        active: true,
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        AND: [
          { OR: [{ effectiveStart: null }, { effectiveStart: { lte: now } }] },
          { OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        icon: true,
        category: true,
        tier: true,
        xpReward: true,
        hidden: true,
        triggerType: true,
        triggerConfig: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createUnlock(input: {
    userId: string;
    achievementId: string;
    awardKey: string;
  }) {
    const result = await this.database.userAchievement.createMany({
      data: [input],
      skipDuplicates: true,
    });
    const achievement = await this.database.userAchievement.findUniqueOrThrow({
      where: {
        userId_awardKey: {
          userId: input.userId,
          awardKey: input.awardKey,
        },
      },
    });
    return { achievement, created: result.count === 1 };
  }

  async listUnlocked(userId: string) {
    return this.database.userAchievement.findMany({
      where: { userId },
      select: {
        awardedAt: true,
        achievement: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            icon: true,
            category: true,
            tier: true,
          },
        },
      },
      orderBy: { awardedAt: "asc" },
    });
  }

  async progressCounts(userId: string, programId?: string) {
    const enrollment = {
      userId,
      ...(programId ? { programId } : {}),
    };
    const [lessons, steps, quizzes, quizEvents, programs] = await Promise.all([
      this.database.programProgressEvent.count({
        where: { enrollment, entityType: "LESSON", eventType: "COMPLETED" },
      }),
      this.database.programProgressEvent.count({
        where: { enrollment, entityType: "STEP", eventType: "COMPLETED" },
      }),
      this.database.programProgressEvent.count({
        where: { enrollment, entityType: "QUIZ", eventType: "SUBMITTED" },
      }),
      this.database.programProgressEvent.findMany({
        where: { enrollment, entityType: "QUIZ", eventType: "SUBMITTED" },
        select: { metadata: true },
      }),
      this.database.programProgressEvent.count({
        where: { enrollment, entityType: "PROGRAM", eventType: "COMPLETED" },
      }),
    ]);
    const passedQuizzes = quizEvents.filter((event) => {
      const metadata = event.metadata;
      return Boolean(
        metadata &&
          typeof metadata === "object" &&
          !Array.isArray(metadata) &&
          metadata.correct === true,
      );
    }).length;
    return { lessons, steps, quizzes, passedQuizzes, programs };
  }
}

export const achievementRepository = new AchievementRepository();

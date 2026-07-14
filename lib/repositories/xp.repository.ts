import { EditorialStatus, Prisma, type XpEventType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type EligibleXpRule = {
  id: string;
  eventType: XpEventType;
  targetId: string | null;
  xp: number;
  awardKey: string;
};

export type StoredXpEvent = {
  id: string;
  userId: string;
  ruleId: string | null;
  achievementId: string | null;
  eventType: XpEventType;
  xp: number;
  createdAt: Date;
};

export type CreateXpAwardInput = {
  userId: string;
  ruleId?: string;
  achievementId?: string;
  awardKey: string;
  eventType: XpEventType;
  xp: number;
};

export type CreateXpAwardResult = {
  event: StoredXpEvent;
  created: boolean;
};

export interface XpStore {
  findEligibleRules(
    eventType: XpEventType,
    targetId: string,
    now: Date,
  ): Promise<EligibleXpRule[]>;
  createAward(input: CreateXpAwardInput): Promise<CreateXpAwardResult>;
  totalXp(userId: string): Promise<number>;
}

export class XpRepository implements XpStore {
  constructor(
    private readonly database: Prisma.TransactionClient = prisma,
  ) {}

  async findEligibleRules(
    eventType: XpEventType,
    targetId: string,
    now: Date,
  ) {
    return this.database.xpRule.findMany({
      where: {
        eventType,
        active: true,
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        AND: [
          { OR: [{ effectiveStart: null }, { effectiveStart: { lte: now } }] },
          { OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: now } }] },
          { OR: [{ targetId: null }, { targetId }] },
        ],
      },
      select: {
        id: true,
        eventType: true,
        targetId: true,
        xp: true,
        awardKey: true,
      },
      orderBy: [{ targetId: "desc" }, { createdAt: "asc" }],
    });
  }

  async createAward(input: CreateXpAwardInput) {
    const result = await this.database.userXpEvent.createMany({
      data: [{
        userId: input.userId,
        ruleId: input.ruleId,
        achievementId: input.achievementId,
        awardKey: input.awardKey,
        eventType: input.eventType,
        xp: input.xp,
      }],
      skipDuplicates: true,
    });
    const event = await this.database.userXpEvent.findUniqueOrThrow({
      where: {
        userId_awardKey: {
          userId: input.userId,
          awardKey: input.awardKey,
        },
      },
      select: {
        id: true,
        userId: true,
        ruleId: true,
        achievementId: true,
        eventType: true,
        xp: true,
        createdAt: true,
      },
    });
    return { event, created: result.count === 1 };
  }

  async totalXp(userId: string) {
    const result = await this.database.userXpEvent.aggregate({
      where: { userId },
      _sum: { xp: true },
    });
    return result._sum.xp ?? 0;
  }
}

export const xpRepository = new XpRepository();

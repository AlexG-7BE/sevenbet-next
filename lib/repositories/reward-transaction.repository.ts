import { prisma } from "@/lib/db/prisma";

import {
  AchievementRepository,
  type AchievementStore,
} from "./achievement.repository";
import {
  UserProgressRepository,
  type UserProgressStore,
} from "./user-progress.repository";
import { XpRepository, type XpStore } from "./xp.repository";

export type RewardTransactionStores = {
  progress: UserProgressStore;
  xp: XpStore;
  achievements: AchievementStore;
};

export interface RewardTransactionRunner {
  run<T>(
    operation: (stores: RewardTransactionStores) => Promise<T>,
  ): Promise<T>;
}

export class PrismaRewardTransactionRunner implements RewardTransactionRunner {
  run<T>(operation: (stores: RewardTransactionStores) => Promise<T>) {
    return prisma.$transaction(
      (transaction) =>
        operation({
          progress: new UserProgressRepository(transaction),
          xp: new XpRepository(transaction),
          achievements: new AchievementRepository(transaction),
        }),
      { maxWait: 5_000, timeout: 15_000 },
    );
  }
}

export const rewardTransactionRunner = new PrismaRewardTransactionRunner();

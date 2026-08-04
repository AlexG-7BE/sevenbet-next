import { Prisma } from "@prisma/client";

export class ProgrammeDashboardRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

  findDashboardData(userId: string, programId: string) {
    return Promise.all([
      this.database.programEnrollment.findUnique({
        where: { userId_programId: { userId, programId } },
        include: {
          missionProgress: { orderBy: { missionNumber: "asc" } },
          momentMap: true,
          currentGoal: true,
          urgeLearningRecord: true,
          activeBoundary: true,
          activeDays: {
            where: { voidedAt: null },
            orderBy: { localDate: "asc" },
          },
        },
      }),
      this.database.userXpEvent.findMany({
        where: { userId, programId },
        orderBy: { createdAt: "asc" },
      }),
      this.database.userAchievement.findMany({
        where: {
          userId,
          achievement: { slug: { in: ["first-plan", "boundary-built"] } },
        },
        include: { achievement: true },
        orderBy: { awardedAt: "asc" },
      }),
    ]);
  }
}

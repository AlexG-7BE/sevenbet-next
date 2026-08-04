import {
  ProgrammeDashboardService,
  programmeDashboardService,
} from "@/lib/programme/application/programme-dashboard.service";

export class ProgrammeRewardService {
  constructor(private readonly dashboardService: ProgrammeDashboardService) {}

  async getRewards(userId: string) {
    const dashboard = await this.dashboardService.getDashboard(userId);
    return {
      totalXp: dashboard.totalXp,
      ledger: dashboard.rewardLedger,
      achievements: dashboard.achievements,
      activeDays: dashboard.activeDays,
      currentStreak: dashboard.currentStreak,
    };
  }
}

export const programmeRewardService = new ProgrammeRewardService(
  programmeDashboardService,
);

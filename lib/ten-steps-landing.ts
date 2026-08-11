export type TenStepsLandingState =
  | { kind: "anonymous" }
  | { kind: "signed-in-fallback" }
  | {
      kind: "returning";
      totalXp: number;
      completedMissions: number;
      currentMission: number;
    }
  | {
      kind: "available-programme-complete";
      totalXp: number;
      completedMissions: number;
    };

type LandingSession = { user: { id: string } } | null;

type LandingDashboard = {
  totalXp: number;
  currentMission: number;
  missions: ReadonlyArray<{
    missionNumber: number;
    status: string;
  }>;
};

function isProgrammeMission(missionNumber: number) {
  return Number.isInteger(missionNumber) && missionNumber >= 1 && missionNumber <= 10;
}

export async function resolveTenStepsLandingState({
  getSession,
  getDashboard,
}: {
  getSession: () => Promise<LandingSession>;
  getDashboard: (userId: string) => Promise<LandingDashboard>;
}): Promise<TenStepsLandingState> {
  const session = await getSession();
  if (!session?.user) return { kind: "anonymous" };

  try {
    const dashboard = await getDashboard(session.user.id);
    const completedMissions = dashboard.missions.filter(
      (mission) => mission.status === "completed",
    ).length;

    if (!isProgrammeMission(dashboard.currentMission)) {
      return {
        kind: "available-programme-complete",
        totalXp: dashboard.totalXp,
        completedMissions,
      };
    }

    return {
      kind: "returning",
      totalXp: dashboard.totalXp,
      completedMissions,
      currentMission: dashboard.currentMission,
    };
  } catch {
    return { kind: "signed-in-fallback" };
  }
}

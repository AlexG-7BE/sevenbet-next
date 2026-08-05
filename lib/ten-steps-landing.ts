export type TenStepsLandingState =
  | { kind: "anonymous" }
  | { kind: "signed-in-fallback" }
  | {
      kind: "returning";
      totalXp: number;
      completedMissions: number;
      currentMission: number;
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
    return {
      kind: "returning",
      totalXp: dashboard.totalXp,
      completedMissions: dashboard.missions.filter((mission) => mission.status === "completed").length,
      currentMission: dashboard.currentMission,
    };
  } catch {
    return { kind: "signed-in-fallback" };
  }
}

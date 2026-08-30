import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";

export function programmeMissionProgressCopy(mission: ProgramAiHome["missions"][number]) {
  const guidance = mission.missionNumber === 1
    ? "Short Starting Point"
    : "About 5–8 min total";
  return `${mission.actionsCompleted} of ${mission.actionsTotal} actions complete · ${guidance}`;
}

export function programmeReviewStatusCopy(home: Pick<ProgramAiHome, "nextReview" | "reviews">) {
  const available = home.reviews.some((review) => review.status === "available");
  if (!home.nextReview) {
    return available
      ? "All scheduled personal reviews are ready when you are."
      : "Review timing will appear here as your Programme progresses.";
  }

  const missionLabel = home.nextReview.missionsRemaining === 1 ? "Mission" : "Missions";
  const next = `${home.nextReview.title} unlocks after Mission ${String(home.nextReview.unlockMission).padStart(2, "0")} · ${home.nextReview.missionsRemaining} ${missionLabel} and ${home.nextReview.xpRemaining} XP remaining.`;
  return available ? `A personal review is ready when you are. Next: ${next}` : next;
}

import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "@/lib/programme/presentation";

export function programmeMissionProgressCopy(mission: ProgramAiHome["missions"][number], locale: ProgrammeLocale) {
  const guidance = mission.missionNumber === 1
    ? programmeText(locale, "Short Starting Point")
    : programmeText(locale, "About 5–8 min total");
  return programmeText(locale, "{completed} of {total} actions complete · {guidance}", {
    completed: mission.actionsCompleted,
    total: mission.actionsTotal,
    guidance,
  });
}

function reviewTitle(locale: ProgrammeLocale, milestone: "first" | "mid" | "full") {
  const key: ProgrammeMessageKey = milestone === "first"
    ? "First Personal Review"
    : milestone === "mid"
      ? "Mid-Programme Personal Review"
      : "Full Programme Personal Review";
  return programmeText(locale, key);
}

export function programmeReviewStatusCopy(home: Pick<ProgramAiHome, "nextReview" | "reviews">, locale: ProgrammeLocale) {
  const available = home.reviews.some((review) => review.status === "available");
  if (!home.nextReview) {
    return available
      ? programmeText(locale, "All scheduled personal reviews are ready when you are.")
      : programmeText(locale, "Review timing will appear here as your Programme progresses.");
  }

  const missionLabel = programmeText(locale, home.nextReview.missionsRemaining === 1 ? "Mission" : "Missions");
  const next = programmeText(locale, "{title} unlocks after Mission {mission} · {missions} {missionLabel} and {xp} XP remaining.", {
    title: reviewTitle(locale, home.nextReview.milestone),
    mission: String(home.nextReview.unlockMission).padStart(2, "0"),
    missions: home.nextReview.missionsRemaining,
    missionLabel,
    xp: home.nextReview.xpRemaining,
  });
  return available ? programmeText(locale, "A personal review is ready when you are. Next: {next}", { next }) : next;
}

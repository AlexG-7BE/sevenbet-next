import {
  IncompleteMissionError,
  MissionLockedError,
} from "@/lib/programme/domain/programme-errors";

export function mergedMissionTasks(
  existing: readonly string[],
  incoming: readonly string[],
  required: readonly string[],
) {
  return required.filter((task) => existing.includes(task) || incoming.includes(task));
}

export function assertMissionTasksComplete(
  values: readonly string[],
  required: readonly string[],
) {
  const missing = required.filter((task) => !values.includes(task));
  if (missing.length) throw new IncompleteMissionError(missing);
}

export function assertMissionPrerequisite(
  prerequisiteStatus: string | null | undefined,
  prerequisite: number,
  missionNumber: number,
) {
  if (prerequisiteStatus !== "COMPLETED") {
    throw new MissionLockedError(prerequisite, missionNumber);
  }
}

export function currentMissionNumber(
  missions: readonly { missionNumber: number; status: string }[],
  totalMissions = 10,
) {
  const completed = new Set(
    missions
      .filter((mission) => mission.status === "COMPLETED")
      .map((mission) => mission.missionNumber),
  );
  return missions.find((mission) => mission.status !== "COMPLETED")?.missionNumber
    ?? Math.min(completed.size + 1, totalMissions);
}

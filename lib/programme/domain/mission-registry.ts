import {
  EVIDENCE_CONTENT_VERSION,
  MISSION_FOUR_EVIDENCE_VERSION,
  MISSION_FOUR_VERSION,
  MISSION_ONE_VERSION,
  MISSION_THREE_EVIDENCE_VERSION,
  MISSION_THREE_VERSION,
  MISSION_TWO_VERSION,
  controlProgrammePath,
  missionFourTaskStates,
  missionOneTaskStates,
  missionThreeTaskStates,
  missionTwoTaskStates,
} from "@/lib/programme/contract";

export type ImplementedMissionNumber = 1 | 2 | 3 | 4;

type AchievementPolicy = {
  slug: string;
  awardKey: string;
};

type CompletionPolicy = {
  version: string;
  evidenceVersion: string;
  taskStates: readonly string[];
  xp: number;
  awardKey: string;
  sourceArtifactType: string;
  achievement: AchievementPolicy | null;
};

export type MissionDefinition = {
  missionNumber: number;
  title: string;
  prerequisite: number | null;
  nextMission: number | null;
  completion: CompletionPolicy | null;
};

const implementedCompletion: Record<ImplementedMissionNumber, CompletionPolicy> = {
  1: {
    version: MISSION_ONE_VERSION,
    evidenceVersion: EVIDENCE_CONTENT_VERSION,
    taskStates: missionOneTaskStates,
    xp: 60,
    awardKey: "programme:mission:01:save:v1",
    sourceArtifactType: "MOMENT_MAP",
    achievement: null,
  },
  2: {
    version: MISSION_TWO_VERSION,
    evidenceVersion: EVIDENCE_CONTENT_VERSION,
    taskStates: missionTwoTaskStates,
    xp: 80,
    awardKey: "programme:mission:02:save:v1",
    sourceArtifactType: "CURRENT_GOAL",
    achievement: {
      slug: "first-plan",
      awardKey: "achievement:first-plan:mission-02:v1",
    },
  },
  3: {
    version: MISSION_THREE_VERSION,
    evidenceVersion: MISSION_THREE_EVIDENCE_VERSION,
    taskStates: missionThreeTaskStates,
    xp: 90,
    awardKey: "programme:mission:03:save:v1",
    sourceArtifactType: "URGE_LEARNING_RECORD",
    achievement: null,
  },
  4: {
    version: MISSION_FOUR_VERSION,
    evidenceVersion: MISSION_FOUR_EVIDENCE_VERSION,
    taskStates: missionFourTaskStates,
    xp: 100,
    awardKey: "programme:mission:04:save:v1",
    sourceArtifactType: "ACTIVE_BOUNDARY",
    achievement: {
      slug: "boundary-built",
      awardKey: "achievement:boundary-built:mission-04:v1",
    },
  },
};

export const missionRegistry: readonly MissionDefinition[] = controlProgrammePath.map(
  (title, index) => {
    const missionNumber = index + 1;
    return {
      missionNumber,
      title,
      prerequisite: missionNumber === 1 ? null : missionNumber - 1,
      nextMission: missionNumber === controlProgrammePath.length ? null : missionNumber + 1,
      completion: missionNumber <= 4
        ? implementedCompletion[missionNumber as ImplementedMissionNumber]
        : null,
    };
  },
);

export function missionDefinition(missionNumber: number) {
  const definition = missionRegistry.find(
    (candidate) => candidate.missionNumber === missionNumber,
  );
  if (!definition) throw new Error(`Mission ${missionNumber} is outside the Programme registry`);
  return definition;
}

export function implementedMissionDefinition(missionNumber: ImplementedMissionNumber) {
  const definition = missionDefinition(missionNumber);
  if (!definition.completion) {
    throw new Error(`Mission ${missionNumber} has no implemented completion policy`);
  }
  return definition as MissionDefinition & { completion: CompletionPolicy };
}

export function progressEventKey(stepId: string) {
  return `step:${stepId}:completed`;
}

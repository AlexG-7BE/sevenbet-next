import {
  implementedMissionDefinition,
  type ImplementedMissionNumber,
} from "@/lib/programme/domain/mission-registry";

export function rewardPolicyForMission(missionNumber: ImplementedMissionNumber) {
  const { completion } = implementedMissionDefinition(missionNumber);
  return {
    xp: completion.xp,
    awardKey: completion.awardKey,
    sourceArtifactType: completion.sourceArtifactType,
    achievement: completion.achievement,
  } as const;
}

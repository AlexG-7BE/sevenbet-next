export const programAiMissionOneRewardPolicy = {
  situationSubmitted: {
    action: "SITUATION_SUBMITTED",
    xp: 20,
    awardKey: "programme:m01:situation-submitted:program-ai-01:v1",
    sourceArtifactType: "PROGRAM_AI_M1_PROGRESS",
  },
  startingPointComplete: {
    action: "STARTING_POINT_COMPLETE",
    xp: 20,
    awardKey: "programme:m01:starting-point-complete:program-ai-01:v1",
    sourceArtifactType: "PROGRAMME_STARTING_POINT",
  },
  clarification: { action: "CLARIFICATION", xp: 0 },
  registration: { action: "REGISTRATION", xp: 0 },
  version: "program-ai-01:v1",
} as const;

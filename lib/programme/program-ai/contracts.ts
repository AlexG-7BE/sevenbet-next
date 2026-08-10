export const PROGRAM_AI_M1_VERSION = "program-ai-01:v1";
export const PROGRAM_AI_EVIDENCE_VERSION = "program-ai-m1-foundation:2026-08-10";
export const PROGRAM_AI_SENSITIVE_PURPOSE_VERSION = "programme-personalisation:program-ai-01:v1";
export const PROGRAM_AI_SENSITIVE_STATEMENT_VERSION = "article-9-authority:2026-08-10:v1";

export const programAiMissionOneActions = [
  "program_ai_situation_submitted",
  "program_ai_starting_point_complete",
] as const;

export type ProgramAiMissionOneAction = (typeof programAiMissionOneActions)[number];
export type ProgramAiInputMode = "text" | "voice";
export type ProgramAiSupportDisposition = "CONTINUE" | "SUPPORT_FIRST";
export type ProgramAiBroadContext =
  | "WORK"
  | "HOME"
  | "SOCIAL"
  | "FINANCIAL_PRESSURE"
  | "ONLINE_ACCESS"
  | "OTHER"
  | "NOT_SPECIFIED";

export type ProgrammeStartingPointValue = {
  startingPoint: string;
  desiredChange: string;
  broadContext: ProgramAiBroadContext;
  continuationCue: string;
  chosenBoundaryAction?: string;
};

export type ProgrammeAiTurn = {
  inputMode: ProgramAiInputMode;
  situation: string;
  clarificationAnswers: string[];
};

export type ProgrammeAiTurnResult =
  | {
      kind: "CLARIFICATION_REQUIRED";
      prompt: string;
      reason: "DESIRED_CHANGE_UNCLEAR" | "CONTEXT_UNCLEAR" | "CONTRADICTION";
      disposition: ProgramAiSupportDisposition;
    }
  | {
      kind: "STARTING_POINT_CANDIDATE";
      candidate: ProgrammeStartingPointValue;
      generation: "PROVIDER" | "USER_CONTROLLED_FALLBACK";
      disposition: ProgramAiSupportDisposition;
    };

export function anonymousProgramAiXp(taskStates: readonly string[]) {
  return (taskStates.includes(programAiMissionOneActions[0]) ? 20 : 0)
    + (taskStates.includes(programAiMissionOneActions[1]) ? 20 : 0);
}

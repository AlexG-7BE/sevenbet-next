import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";

export interface ProgrammeAiPort {
  createTurn(input: ProgrammeAiTurn): Promise<unknown>;
}

export type ValidatedProgrammeAiPort = {
  createTurn(input: ProgrammeAiTurn): Promise<ProgrammeAiTurnResult>;
};

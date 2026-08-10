import type { ProgrammeAiPort } from "@/lib/programme/program-ai/ports";
import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";
import {
  parseFallbackCandidate,
  parseProgrammeAiPortResult,
} from "@/lib/programme/program-ai/validation";

function userControlledFallback(input: ProgrammeAiTurn): ProgrammeAiTurnResult {
  const concise = input.situation.replace(/\s+/g, " ").trim().slice(0, 320);
  return {
    kind: "STARTING_POINT_CANDIDATE",
    candidate: parseFallbackCandidate({
      startingPoint: concise,
      desiredChange: "",
      broadContext: "NOT_SPECIFIED",
      continuationCue: "",
    }),
    generation: "USER_CONTROLLED_FALLBACK",
    disposition: "CONTINUE",
  };
}

export class ProgrammeAiOrchestrator {
  constructor(private readonly port: ProgrammeAiPort | null = null) {}

  async createTurn(input: ProgrammeAiTurn): Promise<ProgrammeAiTurnResult> {
    if (!this.port) return userControlledFallback(input);
    return parseProgrammeAiPortResult(await this.port.createTurn(input));
  }
}

export const programmeAiOrchestrator = new ProgrammeAiOrchestrator();

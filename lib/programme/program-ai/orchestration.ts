import type { ProgrammeAiPort } from "@/lib/programme/program-ai/ports";
import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";
import {
  parseFallbackCandidate,
  parseProgrammeAiPortResult,
} from "@/lib/programme/program-ai/validation";
import { programmeAiPortFromEnvironment } from "@/lib/programme/program-ai/openai-adapters";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";

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
  constructor(private readonly port?: ProgrammeAiPort | null) {}

  async createTurn(input: ProgrammeAiTurn): Promise<ProgrammeAiTurnResult> {
    try {
      const port = this.port === undefined ? programmeAiPortFromEnvironment() : this.port;
      if (!port) return userControlledFallback(input);
      return parseProgrammeAiPortResult(await port.createTurn(input));
    } catch (error) {
      if (error instanceof ProgrammeProviderError) return userControlledFallback(input);
      throw error;
    }
  }
}

export const programmeAiOrchestrator = new ProgrammeAiOrchestrator();

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

export type ProgrammeAiProviderOutcome =
  | "provider"
  | "fallback"
  | "rate_limited"
  | "timeout"
  | "invalid_output"
  | "provider_error";

function userControlledFallback(
  input: ProgrammeAiTurn,
  disposition: ProgrammeAiTurnResult["disposition"] = "CONTINUE",
): ProgrammeAiTurnResult {
  const concise = input.situation.replace(/\s+/g, " ").trim().slice(0, 320);
  return {
    kind: "STARTING_POINT_CANDIDATE",
    candidate: parseFallbackCandidate({
      startingPoint: concise,
      desiredChange: "Build more control around the situation described here.",
      broadContext: "NOT_SPECIFIED",
      continuationCue: "Continue from the situation described in Mission 01.",
    }),
    generation: "USER_CONTROLLED_FALLBACK",
    disposition,
  };
}

export class ProgrammeAiOrchestrator {
  constructor(private readonly port?: ProgrammeAiPort | null) {}

  async createTurn(input: ProgrammeAiTurn): Promise<ProgrammeAiTurnResult> {
    return (await this.createTurnWithOutcome(input)).result;
  }

  async createTurnWithOutcome(input: ProgrammeAiTurn): Promise<{
    result: ProgrammeAiTurnResult;
    providerOutcome: ProgrammeAiProviderOutcome;
  }> {
    try {
      const port = this.port === undefined ? programmeAiPortFromEnvironment() : this.port;
      if (!port) return { result: userControlledFallback(input), providerOutcome: "fallback" };
      const result = parseProgrammeAiPortResult(await port.createTurn(input));
      return {
        result: result.kind === "CLARIFICATION_REQUIRED"
          ? userControlledFallback(input, result.disposition)
          : result,
        providerOutcome: "provider",
      };
    } catch (error) {
      if (error instanceof ProgrammeProviderError) {
        const providerOutcome = error.providerCode === "PROVIDER_TIMEOUT"
          ? "timeout"
          : error.providerCode === "PROVIDER_INVALID_OUTPUT"
            ? "invalid_output"
            : error.providerCode === "PROVIDER_RATE_LIMIT"
              ? "rate_limited"
              : "provider_error";
        return { result: userControlledFallback(input), providerOutcome };
      }
      throw error;
    }
  }
}

export const programmeAiOrchestrator = new ProgrammeAiOrchestrator();

import { ServiceError } from "@/lib/services/service-error";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";

export const PROGRAM_AI_OPENAI_MODEL = "gpt-5.6-terra";
export const PROGRAM_AI_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";

export type ProgramAiOpenAiConfig = {
  provider: "openai";
  apiKey: string;
  programmeModel: typeof PROGRAM_AI_OPENAI_MODEL;
  transcriptionModel: typeof PROGRAM_AI_TRANSCRIPTION_MODEL;
};

export function isProgramAiV1Enabled(value = process.env.PROGRAM_AI_V1_ENABLED) {
  return value === "true";
}

export function assertProgramAiV1Enabled(value = process.env.PROGRAM_AI_V1_ENABLED) {
  if (!isProgramAiV1Enabled(value)) {
    throw new ServiceError("PROGRAM-AI is unavailable", "PROGRAM_AI_DISABLED", 404);
  }
}

export function isProgramAiRealProviderEnabled(
  value = process.env.PROGRAM_AI_REAL_PROVIDER_ENABLED,
) {
  return value === "true";
}

export function resolveProgramAiOpenAiConfig(
  environment: Record<string, string | undefined> = process.env,
): ProgramAiOpenAiConfig | null {
  if (
    !isProgramAiV1Enabled(environment.PROGRAM_AI_V1_ENABLED)
    || !isProgramAiRealProviderEnabled(environment.PROGRAM_AI_REAL_PROVIDER_ENABLED)
  ) {
    return null;
  }
  if (environment.PROGRAM_AI_PROVIDER !== "openai" || !environment.OPENAI_API_KEY?.trim()) {
    throw new ProgrammeProviderError("PROVIDER_UNAVAILABLE");
  }
  if (
    environment.PROGRAM_AI_OPENAI_MODEL
    && environment.PROGRAM_AI_OPENAI_MODEL !== PROGRAM_AI_OPENAI_MODEL
  ) {
    throw new ProgrammeProviderError("PROVIDER_UNAVAILABLE");
  }
  if (
    environment.PROGRAM_AI_TRANSCRIPTION_MODEL
    && environment.PROGRAM_AI_TRANSCRIPTION_MODEL !== PROGRAM_AI_TRANSCRIPTION_MODEL
  ) {
    throw new ProgrammeProviderError("PROVIDER_UNAVAILABLE");
  }
  return {
    provider: "openai",
    apiKey: environment.OPENAI_API_KEY.trim(),
    programmeModel: PROGRAM_AI_OPENAI_MODEL,
    transcriptionModel: PROGRAM_AI_TRANSCRIPTION_MODEL,
  };
}

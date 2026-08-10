import { ServiceError } from "@/lib/services/service-error";

export function isProgramAiV1Enabled(value = process.env.PROGRAM_AI_V1_ENABLED) {
  return value === "true";
}

export function assertProgramAiV1Enabled(value = process.env.PROGRAM_AI_V1_ENABLED) {
  if (!isProgramAiV1Enabled(value)) {
    throw new ServiceError("PROGRAM-AI is unavailable", "PROGRAM_AI_DISABLED", 404);
  }
}

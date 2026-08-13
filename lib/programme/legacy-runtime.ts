import { isProgramAiV1Enabled } from "@/lib/programme/program-ai/runtime-config";
import { ServiceError } from "@/lib/services/service-error";

export class LegacyProgrammeModeConflictError extends ServiceError {
  constructor() {
    super(
      "Legacy Programme mutations are unavailable while PROGRAM-AI is enabled",
      "PROGRAMME_RUNTIME_MODE_CONFLICT",
      409,
    );
    this.name = "LegacyProgrammeModeConflictError";
  }
}

export function assertLegacyProgrammeMutationAllowed(
  value = process.env.PROGRAM_AI_V1_ENABLED,
) {
  if (isProgramAiV1Enabled(value)) {
    throw new LegacyProgrammeModeConflictError();
  }
}

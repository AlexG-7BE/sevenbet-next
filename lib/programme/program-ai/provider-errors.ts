import { ServiceError } from "@/lib/services/service-error";

export const programmeProviderErrorCodes = [
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "PROVIDER_RATE_LIMIT",
  "PROVIDER_INVALID_OUTPUT",
  "TRANSCRIPTION_FAILED",
  "INPUT_TOO_LARGE",
] as const;

export type ProgrammeProviderErrorCode = (typeof programmeProviderErrorCodes)[number];

const safeMessages: Record<ProgrammeProviderErrorCode, string> = {
  PROVIDER_UNAVAILABLE: "Personalisation is temporarily unavailable. You can continue with the editable fallback.",
  PROVIDER_TIMEOUT: "Personalisation took too long. You can continue with the editable fallback.",
  PROVIDER_RATE_LIMIT: "Personalisation is busy right now. You can continue with the editable fallback.",
  PROVIDER_INVALID_OUTPUT: "Personalisation could not prepare a valid draft. You can continue with the editable fallback.",
  TRANSCRIPTION_FAILED: "Voice transcription could not be completed. Retry or type instead.",
  INPUT_TOO_LARGE: "This recording or text is too large. Shorten it and try again.",
};

const statusCodes: Record<ProgrammeProviderErrorCode, number> = {
  PROVIDER_UNAVAILABLE: 503,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_RATE_LIMIT: 429,
  PROVIDER_INVALID_OUTPUT: 502,
  TRANSCRIPTION_FAILED: 502,
  INPUT_TOO_LARGE: 413,
};

export class ProgrammeProviderError extends ServiceError {
  constructor(public readonly providerCode: ProgrammeProviderErrorCode) {
    super(safeMessages[providerCode], providerCode, statusCodes[providerCode]);
    this.name = "ProgrammeProviderError";
  }
}

export function providerErrorCode(error: unknown): ProgrammeProviderErrorCode {
  return error instanceof ProgrammeProviderError ? error.providerCode : "PROVIDER_UNAVAILABLE";
}

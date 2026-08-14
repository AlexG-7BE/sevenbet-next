export const PROGRAM_AI_MAX_AUDIO_BYTES = 4 * 1024 * 1024;
export const PROGRAM_AI_MAX_RECORDING_DURATION_MS = 90_000;
export const PROGRAM_AI_TRANSCRIPTION_FORM_OVERHEAD_BYTES = 64 * 1024;
export const PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES =
  PROGRAM_AI_MAX_AUDIO_BYTES + PROGRAM_AI_TRANSCRIPTION_FORM_OVERHEAD_BYTES;

export const PROGRAM_AI_AUDIO_TOO_LARGE_MESSAGE =
  "This recording is too large to upload. Record a shorter voice note or type instead.";

export function programmeAudioBlobFitsUploadLimit(size: number) {
  return Number.isSafeInteger(size) && size >= 0 && size <= PROGRAM_AI_MAX_AUDIO_BYTES;
}

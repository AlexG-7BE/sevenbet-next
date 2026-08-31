import { ProgrammeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import { transcriptionPortFromEnvironment } from "@/lib/programme/program-ai/openai-adapters";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import { assertProgramAiV1Enabled } from "@/lib/programme/program-ai/runtime-config";
import {
  PROGRAM_AI_MAX_AUDIO_BYTES,
  PROGRAM_AI_MAX_RECORDING_DURATION_MS,
} from "@/lib/programme/program-ai/transcription-limits";
import { ServiceError, ValidationError } from "@/lib/services/service-error";
import { isProgrammeLocale } from "@/lib/programme/presentation";

export {
  PROGRAM_AI_MAX_AUDIO_BYTES,
  PROGRAM_AI_MAX_RECORDING_DURATION_MS,
  PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES,
  PROGRAM_AI_TRANSCRIPTION_FORM_OVERHEAD_BYTES,
} from "@/lib/programme/program-ai/transcription-limits";

const audioFormats = new Map([
  ["audio/webm", "webm"],
  ["video/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/x-m4a", "m4a"],
  ["audio/mpeg", "mp3"],
  ["audio/mp3", "mp3"],
  ["audio/ogg", "ogg"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
]);

function plainMimeType(value: string) {
  return value.toLowerCase().split(";", 1)[0].trim();
}

function parseDuration(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{1,6}$/.test(value)) {
    throw new ValidationError("Recording duration is required");
  }
  const durationMs = Number(value);
  if (durationMs < 1 || durationMs > PROGRAM_AI_MAX_RECORDING_DURATION_MS) {
    throw new ProgrammeProviderError("INPUT_TOO_LARGE");
  }
  return durationMs;
}

function assertExactUploadFields(form: FormData) {
  const keys = Array.from(form.keys()).sort();
  if (keys.length !== 3 || keys[0] !== "audio" || keys[1] !== "durationMs" || keys[2] !== "locale") {
    throw new ValidationError("Voice transcription contains unexpected multipart fields");
  }
}

export class ProgrammeAiTranscriptionService {
  private readonly missionOneService: ProgrammeAiMissionOneService;

  constructor() {
    this.missionOneService = new ProgrammeAiMissionOneService(programmeUnitOfWork);
  }

  async transcribe(token: string, form: FormData) {
    assertProgramAiV1Enabled();
    const authority = await this.missionOneService.authorityStatus(token);
    if (!authority.active) {
      throw new ServiceError(
        "Confirm the narrow sensitive-input authority before sharing a recording",
        "SENSITIVE_INPUT_AUTHORITY_REQUIRED",
        403,
      );
    }
    const upload = await parseProgrammeAudioUpload(form);
    const result = await transcriptionPortFromEnvironment().transcribe(upload);
    if (result.transcript.length > 4_000) {
      throw new ProgrammeProviderError("INPUT_TOO_LARGE");
    }
    return result;
  }
}

export async function parseProgrammeAudioUpload(form: FormData) {
  assertExactUploadFields(form);
  const file = form.get("audio");
  if (!(file instanceof File)) throw new ValidationError("An audio file is required");
  if (file.size < 1) throw new ValidationError("The audio file is empty");
  if (file.size > PROGRAM_AI_MAX_AUDIO_BYTES) {
    throw new ProgrammeProviderError("INPUT_TOO_LARGE");
  }
  const durationMs = parseDuration(form.get("durationMs"));
  const locale = form.get("locale");
  if (!isProgrammeLocale(locale)) throw new ValidationError("Voice transcription locale is not supported");
  const mimeType = plainMimeType(file.type);
  const extension = audioFormats.get(mimeType);
  if (!extension) throw new ValidationError("This browser audio format is not supported");
  const audio = new Uint8Array(await file.arrayBuffer());
  return {
    audio,
    durationMs,
    locale,
    mimeType,
    fileName: `programme-m1.${extension}`,
  };
}

export const programmeAiTranscriptionService = new ProgrammeAiTranscriptionService();

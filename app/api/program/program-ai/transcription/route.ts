import {
  PROGRAM_AI_MAX_AUDIO_BYTES,
  PROGRAM_AI_TRANSCRIPTION_FORM_OVERHEAD_BYTES,
  programmeAiTranscriptionService,
} from "@/lib/programme/application/programme-ai-transcription.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  requestAddress,
  requestCookie,
} from "@/lib/programme/http";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { ValidationError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertProgrammeRateLimit("PROGRAMME_TRANSCRIPTION_SESSION", hashOpaqueToken(token));
    await assertProgrammeRateLimit("PROGRAMME_TRANSCRIPTION_IP", requestAddress(request));
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (
      Number.isFinite(contentLength)
      && contentLength > PROGRAM_AI_MAX_AUDIO_BYTES + PROGRAM_AI_TRANSCRIPTION_FORM_OVERHEAD_BYTES
    ) {
      throw new ProgrammeProviderError("INPUT_TOO_LARGE");
    }
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
      throw new ValidationError("Voice transcription requires a multipart audio upload");
    }
    const result = await programmeAiTranscriptionService.transcribe(token, await request.formData());
    return programmeResponse({
      ok: true,
      ...result,
      timing: { transcriptionRequestMs: Math.round(performance.now() - startedAt) },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

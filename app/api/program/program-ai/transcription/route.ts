import { programmeAiTranscriptionService } from "@/lib/programme/application/programme-ai-transcription.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  requestAddress,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { readBoundedProgrammeTranscriptionFormData } from "@/lib/programme/program-ai/transcription-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertProgrammeRateLimit("PROGRAMME_TRANSCRIPTION_SESSION", hashOpaqueToken(token));
    await assertProgrammeRateLimit("PROGRAMME_TRANSCRIPTION_IP", requestAddress(request));
    const form = await readBoundedProgrammeTranscriptionFormData(request);
    const result = await programmeAiTranscriptionService.transcribe(token, form);
    return programmeResponse({
      ok: true,
      ...result,
      timing: { transcriptionRequestMs: Math.round(performance.now() - startedAt) },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

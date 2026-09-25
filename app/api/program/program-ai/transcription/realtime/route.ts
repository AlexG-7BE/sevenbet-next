import { programmeAiTranscriptionService } from "@/lib/programme/application/programme-ai-transcription.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  requestAddress,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { isProgrammeLocale } from "@/lib/programme/presentation";
import { ValidationError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SDP_BYTES = 32_768;

async function readBoundedSdp(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/sdp")) {
    throw new ValidationError("Realtime transcription requires an SDP offer");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SDP_BYTES) {
    throw new ValidationError("Realtime transcription offer is too large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ValidationError("Realtime transcription offer is required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_SDP_BYTES) {
      await reader.cancel();
      throw new ValidationError("Realtime transcription offer is too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertProgrammeRateLimit(
      "PROGRAMME_TRANSCRIPTION_SESSION",
      hashOpaqueToken(token),
    );
    await assertProgrammeRateLimit(
      "PROGRAMME_TRANSCRIPTION_IP",
      requestAddress(request),
    );
    const locale = new URL(request.url).searchParams.get("locale");
    if (!isProgrammeLocale(locale)) {
      throw new ValidationError("Realtime transcription locale is not supported");
    }
    const answerSdp = await programmeAiTranscriptionService.createRealtimeSession(token, {
      locale,
      safetyIdentifier: hashOpaqueToken(token),
      sdp: await readBoundedSdp(request),
    });
    return new Response(answerSdp, {
      status: 201,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/sdp",
      },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

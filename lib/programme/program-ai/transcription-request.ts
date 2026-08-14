import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import { PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES } from "@/lib/programme/program-ai/transcription-limits";
import { ValidationError } from "@/lib/services/service-error";

function assertDeclaredContentLength(value: string | null) {
  if (value === null) return;
  if (!/^\d+$/.test(value)) {
    throw new ValidationError("Voice transcription Content-Length is invalid");
  }
  if (BigInt(value) > BigInt(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES)) {
    throw new ProgrammeProviderError("INPUT_TOO_LARGE");
  }
}

function assertMultipartContentType(value: string | null) {
  if (!value?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new ValidationError("Voice transcription requires a multipart audio upload");
  }
  return value;
}

export async function readBoundedProgrammeTranscriptionFormData(request: Request) {
  assertDeclaredContentLength(request.headers.get("content-length"));
  const contentType = assertMultipartContentType(request.headers.get("content-type"));
  if (!request.body) {
    throw new ValidationError("Voice transcription requires a multipart audio upload");
  }

  const reader = request.body.getReader();
  const boundedBody = new Uint8Array(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES);
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const nextTotal = totalBytes + value.byteLength;
      if (nextTotal > PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES) {
        await reader.cancel();
        throw new ProgrammeProviderError("INPUT_TOO_LARGE");
      }
      boundedBody.set(value, totalBytes);
      totalBytes = nextTotal;
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return await new Response(boundedBody.subarray(0, totalBytes), {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new ValidationError("Voice transcription requires a valid multipart audio upload");
  }
}

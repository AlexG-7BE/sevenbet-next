import { randomUUID } from "node:crypto";

import type { ContactTransport } from "@/lib/contact/contracts";
import { deliverContactSubmission } from "@/lib/contact/delivery";
import { validateContactPayload } from "@/lib/contact/validation";

const maxBodyBytes = 8_192;
const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export type ContactResultCategory = "delivered" | "rejected" | "unavailable" | "provider_error";
export type ContactLogMetadata = {
  contact_result: ContactResultCategory;
  duration_ms: number;
  provider_status_class: string;
  request_correlation_id: string;
};

type ContactHandlerOptions = {
  transport: ContactTransport;
  logger?: (metadata: ContactLogMetadata) => void;
  now?: () => number;
  requestId?: () => string;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readBoundedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) return { tooLarge: true } as const;
  if (!request.body) return { text: "" } as const;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBodyBytes) {
      await reader.cancel();
      return { tooLarge: true } as const;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(body) } as const;
  } catch {
    return { invalidEncoding: true } as const;
  }
}

export async function handleContactPost(request: Request, options: ContactHandlerOptions) {
  const startedAt = (options.now ?? Date.now)();
  const requestId = (options.requestId ?? randomUUID)();
  const log = (
    contact_result: ContactResultCategory,
    provider_status_class: string,
  ) => options.logger?.({
    contact_result,
    duration_ms: Math.max(0, (options.now ?? Date.now)() - startedAt),
    provider_status_class,
    request_correlation_id: requestId,
  });

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    log("rejected", "not_called");
    return json(415, { ok: false, code: "UNSUPPORTED_MEDIA_TYPE" });
  }
  if (!isSameOrigin(request)) {
    log("rejected", "not_called");
    return json(403, { ok: false, code: "REQUEST_REJECTED" });
  }

  const body = await readBoundedBody(request);
  if ("tooLarge" in body) {
    log("rejected", "not_called");
    return json(413, { ok: false, code: "REQUEST_TOO_LARGE" });
  }
  if ("invalidEncoding" in body) {
    log("rejected", "not_called");
    return json(400, { ok: false, code: "INVALID_REQUEST" });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.text);
  } catch {
    log("rejected", "not_called");
    return json(400, { ok: false, code: "INVALID_REQUEST" });
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    log("rejected", "not_called");
    return json(400, {
      ok: false,
      code: "VALIDATION_FAILED",
      fieldErrors: validation.fieldErrors,
    });
  }
  if (validation.honeypot) {
    log("rejected", "not_called");
    return json(200, { ok: true, code: "MESSAGE_ACCEPTED" });
  }

  try {
    const result = await deliverContactSubmission(options.transport, validation.value);
    if (result.status === "DELIVERED") {
      log("delivered", result.providerStatusClass);
      return json(200, { ok: true, code: "MESSAGE_ACCEPTED" });
    }
    if (result.status === "REJECTED") {
      log("rejected", result.providerStatusClass);
      return json(502, { ok: false, code: "DELIVERY_REJECTED" });
    }
    log("unavailable", result.providerStatusClass);
    return json(503, { ok: false, code: "DELIVERY_UNAVAILABLE" });
  } catch {
    log("provider_error", "exception");
    return json(503, { ok: false, code: "DELIVERY_UNAVAILABLE" });
  }
}

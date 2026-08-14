import assert from "node:assert/strict";
import test from "node:test";

import {
  programmeErrorResponse,
  programmePayloadLimit,
  readProgrammeJson,
} from "../lib/programme/http";
import { ServiceError } from "../lib/services/service-error";

function bodyRequest(chunks: Uint8Array[], headers: Record<string, string> = {}) {
  let index = 0;
  let cancelled = false;
  let pulls = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      const chunk = chunks[index++];
      if (chunk) controller.enqueue(chunk);
      else controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("http://localhost/api/program/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  return { request, pulls: () => pulls, cancelled: () => cancelled };
}

function errorCode(error: unknown) {
  return error instanceof ServiceError ? error.code : null;
}

test("Programme JSON rejects a truthful oversized declaration before consuming the body", async () => {
  const streamed = bodyRequest([new TextEncoder().encode("{}")], {
    "content-length": String(programmePayloadLimit + 1),
  });
  await assert.rejects(readProgrammeJson(streamed.request), (error) => errorCode(error) === "PAYLOAD_TOO_LARGE");
  assert.equal(streamed.request.bodyUsed, false);
});

test("Programme JSON cancels a chunked or lying request at the actual byte ceiling", async () => {
  const encoder = new TextEncoder();
  const streamed = bodyRequest([
    encoder.encode('{"value":"'),
    new Uint8Array(programmePayloadLimit),
    encoder.encode('"}'),
  ], { "content-length": "1" });
  await assert.rejects(readProgrammeJson(streamed.request), (error) => errorCode(error) === "PAYLOAD_TOO_LARGE");
  assert.equal(streamed.cancelled(), true);

  const response = programmeErrorResponse(new ServiceError("Request body is too large", "PAYLOAD_TOO_LARGE", 413));
  assert.equal(response.status, 413);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("Programme JSON accepts valid streamed UTF-8 within the byte limit and rejects malformed UTF-8", async () => {
  const valid = bodyRequest([
    new TextEncoder().encode('{"value":"one '),
    new TextEncoder().encode('step"}'),
  ]);
  assert.deepEqual(await readProgrammeJson(valid.request), { value: "one step" });

  const invalid = bodyRequest([new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d])]);
  await assert.rejects(readProgrammeJson(invalid.request), SyntaxError);
});

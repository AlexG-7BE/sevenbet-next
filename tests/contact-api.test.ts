import assert from "node:assert/strict";
import test from "node:test";

import type { ContactTransport } from "../lib/contact/contracts";
import { handleContactPost, type ContactLogMetadata } from "../lib/contact/http.server";
import { DisabledContactTransport, MemoryContactTransport } from "../lib/contact/transports";

const origin = "https://contact.example.invalid";
const validPayload = {
  name: "Alex Example",
  email: "Founder@Example.invalid",
  subject: "Editorial question",
  message: "This is a safe example enquiry.",
  company: "",
};

function request(payload: unknown, options: { contentType?: string; origin?: string | null; contentLength?: string } = {}) {
  const headers = new Headers();
  headers.set("content-type", options.contentType ?? "application/json");
  if (options.origin !== null) headers.set("origin", options.origin ?? origin);
  if (options.contentLength) headers.set("content-length", options.contentLength);
  return new Request(`${origin}/api/contact`, {
    method: "POST",
    headers,
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

async function body(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("one accepted submission creates exactly one plain-text envelope", async () => {
  const transport = new MemoryContactTransport();
  const logs: ContactLogMetadata[] = [];
  const response = await handleContactPost(request(validPayload), {
    transport,
    logger: (metadata) => logs.push(metadata),
    now: () => 100,
    requestId: () => "contact-request-1",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { ok: true, code: "MESSAGE_ACCEPTED" });
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(transport.deliveredMessages().length, 1);
  assert.deepEqual(transport.deliveredMessages()[0], {
    from: "B4GAMBLE <info@b4gamble.com>",
    to: "support@b4gamble.com",
    replyTo: "founder@example.invalid",
    subject: "[B4GAMBLE Contact] Editorial question",
    text: "Name: Alex Example\nEmail: founder@example.invalid\nSubject: Editorial question\n\nMessage:\nThis is a safe example enquiry.",
  });
  assert.deepEqual(logs, [{
    contact_result: "delivered",
    duration_ms: 0,
    provider_status_class: "memory",
    request_correlation_id: "contact-request-1",
  }]);
});

test("honeypot returns generic success and sends no envelope", async () => {
  const transport = new MemoryContactTransport();
  const response = await handleContactPost(request({ company: "https://bot.example.invalid" }), { transport });
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { ok: true, code: "MESSAGE_ACCEPTED" });
  assert.equal(transport.deliveredMessages().length, 0);
});

test("validation and strict request controls reject without delivery", async (t) => {
  const cases: Array<{ name: string; req: Request; status: number }> = [
    { name: "missing email", req: request({ ...validPayload, email: "" }), status: 400 },
    { name: "invalid email", req: request({ ...validPayload, email: "not-an-email" }), status: 400 },
    { name: "oversized name", req: request({ ...validPayload, name: "n".repeat(101) }), status: 400 },
    { name: "oversized subject", req: request({ ...validPayload, subject: "s".repeat(161) }), status: 400 },
    { name: "oversized message", req: request({ ...validPayload, message: "m".repeat(4001) }), status: 400 },
    { name: "too-short message", req: request({ ...validPayload, message: "too short" }), status: 400 },
    { name: "unexpected property", req: request({ ...validPayload, marketingConsent: true }), status: 400 },
    { name: "wrong content type", req: request(JSON.stringify(validPayload), { contentType: "text/plain" }), status: 415 },
    { name: "missing origin", req: request(validPayload, { origin: null }), status: 403 },
    { name: "cross-origin", req: request(validPayload, { origin: "https://attacker.example.invalid" }), status: 403 },
    { name: "subject CRLF", req: request({ ...validPayload, subject: "Hello\r\nBcc: attacker@example.invalid" }), status: 400 },
    { name: "email CRLF", req: request({ ...validPayload, email: "user@example.invalid\r\nBcc: attacker@example.invalid" }), status: 400 },
    { name: "declared oversized body", req: request(validPayload, { contentLength: "9000" }), status: 413 },
    { name: "actual oversized body", req: request(JSON.stringify({ message: "x".repeat(9000) })), status: 413 },
  ];

  for (const item of cases) {
    await t.test(item.name, async () => {
      const transport = new MemoryContactTransport();
      const response = await handleContactPost(item.req, { transport });
      assert.equal(response.status, item.status);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      assert.equal(transport.deliveredMessages().length, 0);
    });
  }
});

test("provider unavailable and failure return the same safe browser boundary", async () => {
  const unavailable = await handleContactPost(request(validPayload), { transport: new DisabledContactTransport() });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await body(unavailable), { ok: false, code: "DELIVERY_UNAVAILABLE" });

  const failing: ContactTransport = { async deliver() { throw new Error("provider-private-detail"); } };
  const failed = await handleContactPost(request(validPayload), { transport: failing });
  assert.equal(failed.status, 503);
  assert.deepEqual(await body(failed), { ok: false, code: "DELIVERY_UNAVAILABLE" });
});

test("operational logs contain no submitted contact data", async () => {
  const logs: ContactLogMetadata[] = [];
  const response = await handleContactPost(request(validPayload), {
    transport: new MemoryContactTransport(),
    logger: (metadata) => logs.push(metadata),
    requestId: () => "safe-random-correlation-id",
  });
  assert.equal(response.status, 200);
  const serialized = JSON.stringify(logs);
  for (const sentinel of [validPayload.name, validPayload.email, validPayload.subject, validPayload.message]) {
    assert.equal(serialized.includes(sentinel), false);
  }
  assert.doesNotMatch(serialized, /request.?body|raw.?ip/i);
});

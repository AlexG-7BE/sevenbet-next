import assert from "node:assert/strict";
import test from "node:test";

import { createContactEnvelope } from "../lib/contact/delivery";
import { ResendContactTransport } from "../lib/contact/resend.server";
import { resolveContactRuntimeConfig } from "../lib/contact/runtime-config";
import { DisabledContactTransport, MemoryContactTransport } from "../lib/contact/transports";

const approvedEnvironment = {
  CONTACT_EMAIL_DELIVERY_ENABLED: "true",
  RESEND_API_KEY: "test-only-contact-key-123456",
  CONTACT_EMAIL_FROM: "B4GAMBLE <info@b4gamble.com>",
  CONTACT_EMAIL_TO: "support@b4gamble.com",
};

test("Contact runtime config requires exact enable, sender and recipient", () => {
  assert.equal(resolveContactRuntimeConfig({}), null);
  assert.equal(resolveContactRuntimeConfig({ ...approvedEnvironment, CONTACT_EMAIL_DELIVERY_ENABLED: "TRUE" }), null);
  assert.equal(resolveContactRuntimeConfig({ ...approvedEnvironment, RESEND_API_KEY: "" }), null);
  assert.equal(resolveContactRuntimeConfig({ ...approvedEnvironment, CONTACT_EMAIL_FROM: "Support <support@b4gamble.com>" }), null);
  assert.equal(resolveContactRuntimeConfig({ ...approvedEnvironment, CONTACT_EMAIL_TO: "other@example.invalid" }), null);
  assert.deepEqual(resolveContactRuntimeConfig(approvedEnvironment), {
    apiKey: "test-only-contact-key-123456",
    from: "B4GAMBLE <info@b4gamble.com>",
    to: "support@b4gamble.com",
  });
});

test("envelope is plain text and never treats visitor content as HTML", () => {
  const envelope = createContactEnvelope({
    name: "<b>Example</b>",
    email: "visitor@example.invalid",
    subject: "Plain text subject",
    message: "<script>not executable</script>",
  });
  assert.equal(envelope.replyTo, "visitor@example.invalid");
  assert.match(envelope.text, /<script>not executable<\/script>/);
  assert.equal("html" in envelope, false);
});

test("memory and disabled transports remain deterministic", async () => {
  const envelope = createContactEnvelope({
    name: "",
    email: "visitor@example.invalid",
    subject: "Question",
    message: "A complete example message.",
  });
  const memory = new MemoryContactTransport();
  assert.deepEqual(await memory.deliver(envelope), { status: "DELIVERED", providerStatusClass: "memory" });
  assert.equal(memory.deliveredMessages().length, 1);
  assert.deepEqual(await new DisabledContactTransport().deliver(), { status: "UNAVAILABLE", providerStatusClass: "disabled" });
});

test("Resend adapter sends once with exact envelope and does not read a provider body", async () => {
  const config = resolveContactRuntimeConfig(approvedEnvironment);
  assert.ok(config);
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return new Response("provider-private-body", { status: 202 });
  };
  const transport = new ResendContactTransport(config, fetcher, 1_000);
  const result = await transport.deliver(createContactEnvelope({
    name: "Example",
    email: "visitor@example.invalid",
    subject: "Question",
    message: "A complete example message.",
  }));

  assert.deepEqual(result, { status: "DELIVERED", providerStatusClass: "2xx" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "https://api.resend.com/emails");
  const sent = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(sent, {
    from: "B4GAMBLE <info@b4gamble.com>",
    to: ["support@b4gamble.com"],
    reply_to: "visitor@example.invalid",
    subject: "[B4GAMBLE Contact] Question",
    text: "Name: Example\nEmail: visitor@example.invalid\nSubject: Question\n\nMessage:\nA complete example message.",
  });
  assert.equal("html" in sent, false);
});

test("Resend adapter never automatically retries rejected or unavailable outcomes", async () => {
  const config = resolveContactRuntimeConfig(approvedEnvironment);
  assert.ok(config);
  for (const status of [400, 503]) {
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls += 1;
      return new Response("ignored", { status });
    };
    const result = await new ResendContactTransport(config, fetcher).deliver(createContactEnvelope({
      name: "",
      email: "visitor@example.invalid",
      subject: "Question",
      message: "A complete example message.",
    }));
    assert.equal(calls, 1);
    assert.equal(result.status, status === 400 ? "REJECTED" : "UNAVAILABLE");
  }
});

import "server-only";

import type { LifecycleEmailRuntimeConfig } from "@/lib/email/runtime-config.server";

export type EmailProviderEnvelope = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type EmailProviderResult =
  | { status: "accepted"; provider: "resend" | "memory"; messageId: string }
  | { status: "unavailable"; code: "NOT_CONFIGURED" | "TIMEOUT" | "NETWORK" | "REJECTED" };

export interface LifecycleEmailProvider {
  send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult>;
}

export class DisabledLifecycleEmailProvider implements LifecycleEmailProvider {
  async send(): Promise<EmailProviderResult> {
    return { status: "unavailable", code: "NOT_CONFIGURED" };
  }
}

export class ResendLifecycleEmailProvider implements LifecycleEmailProvider {
  constructor(
    private readonly config: LifecycleEmailRuntimeConfig,
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 8_000,
  ) {}

  async send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult> {
    try {
      const response = await this.fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": envelope.idempotencyKey,
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [envelope.to],
          reply_to: this.config.replyTo,
          subject: envelope.subject,
          html: envelope.html,
          text: envelope.text,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) return { status: "unavailable", code: "REJECTED" };
      const body = await response.json().catch(() => null) as { id?: unknown } | null;
      return typeof body?.id === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(body.id)
        ? { status: "accepted", provider: "resend", messageId: body.id }
        : { status: "unavailable", code: "REJECTED" };
    } catch (error) {
      return error instanceof DOMException && error.name === "TimeoutError"
        ? { status: "unavailable", code: "TIMEOUT" }
        : { status: "unavailable", code: "NETWORK" };
    }
  }
}

export class MemoryLifecycleEmailProvider implements LifecycleEmailProvider {
  private readonly sent = new Map<string, EmailProviderEnvelope & { messageId: string }>();

  async send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult> {
    const existing = this.sent.get(envelope.idempotencyKey);
    if (existing) return { status: "accepted", provider: "memory", messageId: existing.messageId };
    const messageId = `memory-${this.sent.size + 1}`;
    this.sent.set(envelope.idempotencyKey, { ...envelope, messageId });
    return { status: "accepted", provider: "memory", messageId };
  }

  messages() { return [...this.sent.values()]; }
}

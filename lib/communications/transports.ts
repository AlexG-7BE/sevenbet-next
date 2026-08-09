import type {
  EmailEnvelope,
  EmailTransport,
  EmailTransportResult,
} from "@/lib/communications/contracts";

export class DisabledEmailTransport implements EmailTransport {
  async deliver(): Promise<EmailTransportResult> {
    return { status: "unavailable" };
  }
}

export class MemoryEmailTransport implements EmailTransport {
  private readonly messages = new Map<string, EmailEnvelope & { transportMessageId: string }>();

  async deliver(envelope: EmailEnvelope): Promise<EmailTransportResult> {
    const existing = this.messages.get(envelope.idempotencyKey);
    if (existing) return { status: "duplicate", transportMessageId: existing.transportMessageId };
    const transportMessageId = `memory-${this.messages.size + 1}`;
    this.messages.set(envelope.idempotencyKey, { ...envelope, transportMessageId });
    return { status: "delivered", transportMessageId };
  }

  deliveredMessages() {
    return [...this.messages.values()].map((message) => ({ ...message }));
  }
}

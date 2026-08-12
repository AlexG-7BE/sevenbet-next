import type {
  ContactEnvelope,
  ContactTransport,
  ContactTransportResult,
} from "@/lib/contact/contracts";

export class DisabledContactTransport implements ContactTransport {
  async deliver(): Promise<ContactTransportResult> {
    return { status: "UNAVAILABLE", providerStatusClass: "disabled" };
  }
}

export class MemoryContactTransport implements ContactTransport {
  private readonly messages: ContactEnvelope[] = [];

  async deliver(envelope: ContactEnvelope): Promise<ContactTransportResult> {
    this.messages.push({ ...envelope });
    return { status: "DELIVERED", providerStatusClass: "memory" };
  }

  deliveredMessages() {
    return this.messages.map((message) => ({ ...message }));
  }
}

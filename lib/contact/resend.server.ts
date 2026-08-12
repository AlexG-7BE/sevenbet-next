import type {
  ContactEnvelope,
  ContactTransport,
  ContactTransportResult,
} from "@/lib/contact/contracts";
import type { ContactRuntimeConfig } from "@/lib/contact/runtime-config";

const resendEndpoint = "https://api.resend.com/emails";

export class ResendContactTransport implements ContactTransport {
  constructor(
    private readonly config: ContactRuntimeConfig,
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 8_000,
  ) {}

  async deliver(envelope: ContactEnvelope): Promise<ContactTransportResult> {
    try {
      const response = await this.fetcher(resendEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [this.config.to],
          reply_to: envelope.replyTo,
          subject: envelope.subject,
          text: envelope.text,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (response.ok) return { status: "DELIVERED", providerStatusClass: "2xx" };
      if (response.status >= 400 && response.status < 500) {
        return { status: "REJECTED", providerStatusClass: "4xx" };
      }
      return { status: "UNAVAILABLE", providerStatusClass: "5xx" };
    } catch {
      return { status: "UNAVAILABLE", providerStatusClass: "network" };
    }
  }
}

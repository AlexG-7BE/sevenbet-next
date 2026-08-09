import type {
  CommunicationAccountDirectory,
  CommunicationDeliveryResult,
  EmailCommunicationRequest,
  EmailTransport,
} from "@/lib/communications/contracts";
import {
  assessCommunicationAuthority,
} from "@/lib/communications/purpose-policy";
import type { CommunicationRuntimeConfig } from "@/lib/communications/runtime-config";
import { renderCommunicationTemplate } from "@/lib/communications/templates";

const OPAQUE_USER_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const IDEMPOTENCY_KEY = /^[a-zA-Z0-9:_-]{16,160}$/;
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CommunicationService {
  constructor(
    private readonly accounts: CommunicationAccountDirectory,
    private readonly transport: EmailTransport,
    private readonly config: CommunicationRuntimeConfig | null,
  ) {}

  async deliver(request: EmailCommunicationRequest): Promise<CommunicationDeliveryResult> {
    if (!OPAQUE_USER_ID.test(request.userId) || !IDEMPOTENCY_KEY.test(request.idempotencyKey)) {
      return { status: "denied", code: "INVALID_REQUEST" };
    }
    const authority = assessCommunicationAuthority(request.purpose, request.authority);
    if (!authority.allowed) return { status: "denied", code: authority.code };
    if (!this.config) return { status: "unavailable", code: "SENDER_NOT_CONFIGURED" };

    const message = renderCommunicationTemplate(request.template, authority.purpose, this.config.siteUrl);
    if (!message) return { status: "denied", code: "TEMPLATE_NOT_ALLOWED" };

    let account: { email: string } | null;
    try {
      account = await this.accounts.resolveAccountEmail(request.userId);
    } catch {
      return { status: "failed", code: "DELIVERY_FAILED" };
    }
    if (!account || !EMAIL_ADDRESS.test(account.email)) {
      return { status: "unavailable", code: "ACCOUNT_NOT_FOUND" };
    }

    try {
      const result = await this.transport.deliver({
        ...message,
        idempotencyKey: request.idempotencyKey,
        to: account.email.trim().toLowerCase(),
        from: this.config.fromByCategory[message.senderCategory],
        replyTo: this.config.replyTo,
      });
      if (result.status === "unavailable") return { status: "unavailable", code: "TRANSPORT_NOT_CONFIGURED" };
      if (result.status === "duplicate") return { status: "duplicate", code: "DUPLICATE_SUPPRESSED" };
      return { status: "delivered", code: "DELIVERY_ACCEPTED" };
    } catch {
      return { status: "failed", code: "DELIVERY_FAILED" };
    }
  }
}

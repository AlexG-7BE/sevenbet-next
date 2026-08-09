import type {
  CommunicationAuthorityEvidence,
  CommunicationPurpose,
} from "@/lib/communications/purpose-policy";

export const communicationTemplates = [
  "ACCOUNT_SECURITY_GENERIC",
  "PROGRAMME_USER_REQUESTED_REMINDER",
  "PROGRAMME_ENGAGEMENT_REMINDER",
] as const;

export type CommunicationTemplate = (typeof communicationTemplates)[number];
export type CommunicationSenderCategory = "ACCOUNT" | "PROGRAMME";

export type EmailCommunicationRequest = {
  userId: string;
  purpose: unknown;
  authority: CommunicationAuthorityEvidence;
  template: unknown;
  idempotencyKey: string;
};

export type RenderedCommunication = {
  purpose: Exclude<CommunicationPurpose, "COMMERCIAL_MARKETING">;
  senderCategory: CommunicationSenderCategory;
  subject: string;
  text: string;
  html: string;
};

export type EmailEnvelope = RenderedCommunication & {
  idempotencyKey: string;
  to: string;
  from: string;
  replyTo: string;
};

export type EmailTransportResult =
  | { status: "delivered"; transportMessageId: string }
  | { status: "duplicate"; transportMessageId: string }
  | { status: "unavailable" };

export interface EmailTransport {
  deliver(envelope: EmailEnvelope): Promise<EmailTransportResult>;
}

export interface CommunicationAccountDirectory {
  resolveAccountEmail(userId: string): Promise<{ email: string } | null>;
}

export type CommunicationDeliveryResult =
  | { status: "delivered" | "duplicate"; code: "DELIVERY_ACCEPTED" | "DUPLICATE_SUPPRESSED" }
  | { status: "denied"; code: "UNKNOWN_PURPOSE" | "AUTHORITY_REQUIRED" | "COMMERCIAL_MARKETING_DISABLED" | "INVALID_REQUEST" | "TEMPLATE_NOT_ALLOWED" }
  | { status: "unavailable"; code: "TRANSPORT_NOT_CONFIGURED" | "ACCOUNT_NOT_FOUND" | "SENDER_NOT_CONFIGURED" }
  | { status: "failed"; code: "DELIVERY_FAILED" };

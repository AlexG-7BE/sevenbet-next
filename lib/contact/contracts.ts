export const SUPPORT_MAILBOX = "support@b4gamble.com";
export const CONTACT_FROM_IDENTITY = "B4GAMBLE Website <website@b4gamble.com>";

export const contactFieldNames = ["name", "email", "subject", "message"] as const;
export type ContactFieldName = (typeof contactFieldNames)[number];

export type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown;
};

export type ValidatedContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type ContactEnvelope = {
  from: typeof CONTACT_FROM_IDENTITY;
  to: typeof SUPPORT_MAILBOX;
  replyTo: string;
  subject: string;
  text: string;
};

export type ContactTransportResult =
  | { status: "DELIVERED"; providerStatusClass: "2xx" | "memory" }
  | { status: "REJECTED"; providerStatusClass: "4xx" }
  | { status: "UNAVAILABLE"; providerStatusClass: "5xx" | "network" | "disabled" };

export interface ContactTransport {
  deliver(envelope: ContactEnvelope): Promise<ContactTransportResult>;
}

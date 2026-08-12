import {
  CONTACT_FROM_IDENTITY,
  SUPPORT_MAILBOX,
  type ContactEnvelope,
  type ContactTransport,
  type ValidatedContactSubmission,
} from "@/lib/contact/contracts";

export function createContactEnvelope(submission: ValidatedContactSubmission): ContactEnvelope {
  return {
    from: CONTACT_FROM_IDENTITY,
    to: SUPPORT_MAILBOX,
    replyTo: submission.email,
    subject: `[B4GAMBLE Contact] ${submission.subject}`,
    text: [
      `Name: ${submission.name || "Not provided"}`,
      `Email: ${submission.email}`,
      `Subject: ${submission.subject}`,
      "",
      "Message:",
      submission.message,
    ].join("\n"),
  };
}

export async function deliverContactSubmission(
  transport: ContactTransport,
  submission: ValidatedContactSubmission,
) {
  return transport.deliver(createContactEnvelope(submission));
}

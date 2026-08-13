import {
  contactFieldNames,
  type ContactFieldErrors,
  type ValidatedContactSubmission,
} from "@/lib/contact/contracts";

const acceptedKeys = new Set(["name", "email", "subject", "message", "company"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const headerControlPattern = /[\u0000-\u001f\u007f]/;
const messageControlPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export type ContactValidationResult =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: ValidatedContactSubmission }
  | { ok: false; fieldErrors: ContactFieldErrors; formError?: string };

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

export function validateContactPayload(payload: unknown): ContactValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, fieldErrors: {}, formError: "Invalid form data." };
  }

  const record = payload as Record<string, unknown>;
  if (Object.keys(record).some((key) => !acceptedKeys.has(key))) {
    return { ok: false, fieldErrors: {}, formError: "Invalid form data." };
  }

  const company = stringValue(record.company ?? "");
  if (company === null) return { ok: false, fieldErrors: {}, formError: "Invalid form data." };
  if (company.length > 0) return { ok: true, honeypot: true };

  const values = Object.fromEntries(contactFieldNames.map((field) => [field, stringValue(record[field] ?? "")])) as Record<typeof contactFieldNames[number], string | null>;
  const fieldErrors: ContactFieldErrors = {};

  if (values.name === null) fieldErrors.name = "Enter a name as plain text, or leave this field empty.";
  else if (values.name.length > 100) fieldErrors.name = "Name must be 100 characters or fewer.";
  else if (headerControlPattern.test(values.name)) fieldErrors.name = "Name cannot contain line breaks or control characters.";

  if (values.email === null || values.email.length === 0) fieldErrors.email = "Enter your email address.";
  else if (values.email.length > 254) fieldErrors.email = "Email must be 254 characters or fewer.";
  else if (headerControlPattern.test(values.email) || !emailPattern.test(values.email)) fieldErrors.email = "Enter a valid email address.";

  if (values.subject === null || values.subject.length === 0) fieldErrors.subject = "Enter a subject.";
  else if (values.subject.length > 160) fieldErrors.subject = "Subject must be 160 characters or fewer.";
  else if (headerControlPattern.test(values.subject)) fieldErrors.subject = "Subject cannot contain line breaks or control characters.";

  if (values.message === null || values.message.length < 10) fieldErrors.message = "Enter at least 10 meaningful characters.";
  else if (values.message.length > 4000) fieldErrors.message = "Message must be 4,000 characters or fewer.";
  else if (messageControlPattern.test(values.message)) fieldErrors.message = "Message contains unsupported control characters.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    honeypot: false,
    value: {
      name: values.name as string,
      email: (values.email as string).toLowerCase(),
      subject: values.subject as string,
      message: values.message as string,
    },
  };
}

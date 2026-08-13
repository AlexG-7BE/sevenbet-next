import { CONTACT_FROM_IDENTITY, SUPPORT_MAILBOX } from "@/lib/contact/contracts";

type ContactEnvironment = {
  CONTACT_EMAIL_DELIVERY_ENABLED?: string;
  RESEND_API_KEY?: string;
  CONTACT_EMAIL_FROM?: string;
  CONTACT_EMAIL_TO?: string;
};

export type ContactRuntimeConfig = {
  apiKey: string;
  from: typeof CONTACT_FROM_IDENTITY;
  to: typeof SUPPORT_MAILBOX;
};

function validApiKey(value: string | undefined) {
  const key = value?.trim();
  return key && key.length >= 16 && key.length <= 512 && !/[\s\u0000-\u001f\u007f]/.test(key) ? key : null;
}

export function resolveContactRuntimeConfig(
  environment: ContactEnvironment = process.env as ContactEnvironment,
): ContactRuntimeConfig | null {
  if (environment.CONTACT_EMAIL_DELIVERY_ENABLED !== "true") return null;
  const apiKey = validApiKey(environment.RESEND_API_KEY);
  if (!apiKey) return null;
  if (environment.CONTACT_EMAIL_FROM?.trim() !== CONTACT_FROM_IDENTITY) return null;
  if (environment.CONTACT_EMAIL_TO?.trim().toLowerCase() !== SUPPORT_MAILBOX) return null;
  return { apiKey, from: CONTACT_FROM_IDENTITY, to: SUPPORT_MAILBOX };
}

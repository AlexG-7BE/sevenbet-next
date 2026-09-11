import "server-only";

import { analyticsEnvironment } from "@/lib/analytics/identity.server";

type EmailEnvironment = {
  LIFECYCLE_EMAIL_DELIVERY_ENABLED?: string;
  RESEND_API_KEY?: string;
  LIFECYCLE_EMAIL_FROM?: string;
  LIFECYCLE_EMAIL_REPLY_TO?: string;
  RESEND_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

export type LifecycleEmailRuntimeConfig = {
  apiKey: string;
  from: string;
  replyTo: string;
  webhookSecret: string;
  siteUrl: string;
  environment: ReturnType<typeof analyticsEnvironment>;
};

export function validatedResendApiKey(value: string | undefined) {
  const normalized = value?.trim();
  return normalized
    && normalized.length >= 11
    && normalized.length <= 256
    && /^re_[\x21-\x7e]+$/.test(normalized)
    ? normalized
    : null;
}

export function validatedResendWebhookSecret(value: string | undefined) {
  const normalized = value?.trim();
  return normalized
    && /^whsec_[A-Za-z0-9_+/=-]{8,256}$/.test(normalized)
    ? normalized
    : null;
}

function emailHeader(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized || /[\r\n]/.test(normalized) || normalized.length > 320) return null;
  const address = /<([^<>]+)>$/.exec(normalized)?.[1] ?? normalized;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
    && address.toLowerCase().endsWith("@b4gamble.com")
    ? normalized
    : null;
}

function siteUrl(value: string | undefined) {
  try {
    const url = new URL(value || "");
    if (url.protocol !== "https:" || url.hostname !== "b4gamble.com"
      || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}

export function resolveLifecycleEmailRuntimeConfig(
  environment: EmailEnvironment = process.env,
): LifecycleEmailRuntimeConfig | null {
  // Real customer delivery is deliberately impossible outside Production.
  if (environment.VERCEL_ENV !== "production"
    || environment.LIFECYCLE_EMAIL_DELIVERY_ENABLED !== "true") return null;
  const apiKey = validatedResendApiKey(environment.RESEND_API_KEY);
  const from = emailHeader(environment.LIFECYCLE_EMAIL_FROM);
  const replyTo = emailHeader(environment.LIFECYCLE_EMAIL_REPLY_TO);
  const webhookSecret = validatedResendWebhookSecret(environment.RESEND_WEBHOOK_SECRET);
  const url = siteUrl(environment.NEXT_PUBLIC_SITE_URL);
  if (!apiKey || !from || !replyTo || !url || !webhookSecret) return null;
  return {
    apiKey,
    from,
    replyTo,
    webhookSecret,
    siteUrl: url,
    environment: analyticsEnvironment(environment),
  };
}

import type { CommunicationSenderCategory } from "@/lib/communications/contracts";

type CommunicationEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SITE_URL?: string;
  SEVENBET_ACCOUNT_EMAIL_FROM?: string;
  SEVENBET_PROGRAMME_EMAIL_FROM?: string;
  SEVENBET_EMAIL_REPLY_TO?: string;
};

export type CommunicationRuntimeConfig = {
  siteUrl: string;
  fromByCategory: Record<CommunicationSenderCategory, string>;
  replyTo: string;
};

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validSiteUrl(value: string | undefined) {
  try {
    const url = new URL(value || "");
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function validEmail(value: string | undefined) {
  const address = value?.trim().toLowerCase();
  return address && EMAIL_ADDRESS.test(address) ? address : null;
}

export function resolveCommunicationRuntimeConfig(
  environment: CommunicationEnvironment = process.env,
): CommunicationRuntimeConfig | null {
  const siteUrl = validSiteUrl(environment.NEXT_PUBLIC_SITE_URL);
  const accountFrom = validEmail(environment.SEVENBET_ACCOUNT_EMAIL_FROM);
  const programmeFrom = validEmail(environment.SEVENBET_PROGRAMME_EMAIL_FROM);
  const replyTo = validEmail(environment.SEVENBET_EMAIL_REPLY_TO);
  if (!siteUrl || !accountFrom || !programmeFrom || !replyTo) return null;
  return {
    siteUrl,
    fromByCategory: {
      ACCOUNT: accountFrom,
      PROGRAMME: programmeFrom,
    },
    replyTo,
  };
}

import { HELP_CANONICAL_ORIGIN } from "@/lib/site/host-gate";

type SiteEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string;
};

export const PUBLIC_CANONICAL_ORIGIN = "https://b4gamble.com";

function validOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const origin = new URL(value.includes("://") ? value : `https://${value}`);
    if (origin.protocol !== "http:" && origin.protocol !== "https:") return null;
    return origin.origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(environment: SiteEnvironment = process.env as SiteEnvironment) {
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") return PUBLIC_CANONICAL_ORIGIN;
  return validOrigin(environment.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:4173";
}

export const siteUrl = resolveSiteUrl();

// Every route here goes into the sitemap, so noindex pages (Privacy, Terms) stay out.
export const coreRoutes = [
  "",
  "/10-steps",
  "/program",
  "/learn",
  "/responsible-gambling",
  "/help",
  "/methodology",
  "/affiliate-disclosure",
  "/about",
  "/contact",
  "/faq",
  "/bonus-guide",
  "/wagering-calculator",
  "/pause-plan",
  "/for-creators",
  "/beside",
  "/pause-statistics",
  "/gambling-control",
  "/control-without-quitting",
  "/gambling-control-tools",
  "/can-you-trust-b4gamble",
];

/**
 * RFC-057 §8: every absolute-URL producer that can run on the help host takes the site. The
 * default is the main origin, so every existing call site is unchanged; a server component on
 * the help host passes `await resolveServerSite()`. The help origin is a source constant in
 * `lib/site/host-gate.ts` — this module never reads an environment value for it.
 */
export function originForSite(site: "help" | "main" = "main") {
  return site === "help" ? HELP_CANONICAL_ORIGIN : siteUrl;
}

export function absoluteUrl(path: string, site: "help" | "main" = "main") {
  return `${originForSite(site)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function casinoOfficialUrl(domain: string) {
  const hostname = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname || /(?:^|\.)(?:example|invalid|localhost|test)$/.test(hostname)) return null;
  return `https://${hostname}`;
}

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
  "/privacy",
  "/terms",
];

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function casinoOfficialUrl(domain: string) {
  const hostname = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname || /(?:^|\.)(?:example|invalid|localhost|test)$/.test(hostname)) return null;
  return `https://${hostname}`;
}

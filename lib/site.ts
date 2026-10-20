import { HELP_CANONICAL_ORIGIN, type SiteClass } from "@/lib/site/host-gate";

type SiteEnvironment = {
  [key: string]: string | undefined;
  HELP_SITE_DEV_HOST?: string;
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

/**
 * RFC-057 §8. One module constant cannot give two sites their own canonical URLs, so `siteUrl`
 * keeps meaning the **main** origin and this one is the help site's.
 *
 * In Production and Preview it is the source constant `HELP_CANONICAL_ORIGIN`: no request value
 * and no environment value ever names an origin (§3). Only a local run can move it, and only to
 * the host `HELP_SITE_DEV_HOST` already names for the middleware gate, so a two-host local
 * production build builds help URLs on the host it actually serves them from.
 */
export function resolveHelpSiteUrl(environment: SiteEnvironment = process.env as SiteEnvironment) {
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") return HELP_CANONICAL_ORIGIN;
  const devHost = environment.HELP_SITE_DEV_HOST?.trim().toLowerCase().replace(/\.$/, "");
  if (!devHost || !/^[a-z0-9.-]+(?::\d{1,5})?$/.test(devHost)) return HELP_CANONICAL_ORIGIN;
  return `http://${devHost}`;
}

export const helpUrl = resolveHelpSiteUrl();

/**
 * The origin of one of the two sites. Every absolute-URL producer that can run on the help host
 * takes the site explicitly; a server component gets it from `resolveServerSite()`, which reads
 * the trusted header middleware set (§7.2). The default is `main`, which is what every main-site
 * surface already assumed, so an unconverted call site keeps today's behaviour exactly.
 */
export function originForSite(site: SiteClass = "main") {
  return site === "help" ? helpUrl : siteUrl;
}

/**
 * The **public canonical** origin of a site, which is the same everywhere: `siteUrl` follows
 * the environment (a local run is `http://localhost:4173`), and code that talks about the
 * published address of a page regardless of where it runs — the Learn tools, their URL
 * schemas and the stored-canonical rule of RFC-057 §14 — must not. Both values are source
 * constants, so no environment value ever names one.
 */
export function canonicalOriginForSite(site: SiteClass = "main") {
  return site === "help" ? HELP_CANONICAL_ORIGIN : PUBLIC_CANONICAL_ORIGIN;
}

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
  "/forum-study",
  "/gambling-control",
  "/control-without-quitting",
  "/gambling-control-tools",
  "/can-you-trust-b4gamble",
  // English and Uzbek only: the sitemap lists a language where the route is localizable.
  "/uzbekistan-licensed-operators",
];

export function absoluteUrl(path: string, site: SiteClass = "main") {
  return `${originForSite(site)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function casinoOfficialUrl(domain: string) {
  const hostname = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname || /(?:^|\.)(?:example|invalid|localhost|test)$/.test(hostname)) return null;
  return `https://${hostname}`;
}

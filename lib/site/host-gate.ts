import {
  resolveRuntimeCanonicalHost,
  type RuntimeCanonicalHostDecision,
} from "@/lib/auth/runtime-canonical-host";

/**
 * RFC-057 §3 and §7: the one Vercel project serves two exact Production hosts. The main host
 * is `PRODUCTION_CANONICAL_ORIGIN` (RFC-030, unchanged); the help host is the constant below.
 * Matching is exact on protocol and host — lower-cased, no port, no trailing dot — so a
 * look-alike host (`pauseplan.help.evil.test`, `evilpauseplan.help`) is never the help site.
 *
 * The origin is a source constant, not a variable: no request value and no environment value
 * can ever name an origin. Only the switches below decide whether the help host is served.
 */
export const HELP_CANONICAL_ORIGIN = "https://pauseplan.help";

/**
 * The help site's own name (Founder, Q2, 17 October 2026). It carries no B4GAMBLE wordmark and
 * no B4GAMBLE logo anywhere, because the whole point of the split is that the two sites are not
 * visibly one. Every surface that prints a site name on the help host reads this constant.
 */
export const HELP_SITE_NAME = "Pause Plan";

/** The trusted class header middleware sets for the page (§7.2). Never read from a client. */
export const SITE_CLASS_HEADER = "x-b4gamble-site";

export type SiteClass = "help" | "main";

export const DEFAULT_SITE_CLASS: SiteClass = "main";

export type HelpSiteSwitches = Readonly<{
  /** `HELP_SITE_SERVING`: Production treats the exact help host as the help site. */
  serving: boolean;
  /** `HELP_SITE_REDIRECTS`: the main host 301s HELP routes and the help host may be indexed. */
  redirects: boolean;
  /** `HELP_SITE_DEV_HOST`: a local or CI host that acts as the help site. Never in Preview or Production. */
  devHost: string | null;
}>;

export type HelpSiteEnvironment = {
  HELP_SITE_SERVING?: string;
  HELP_SITE_REDIRECTS?: string;
  HELP_SITE_DEV_HOST?: string;
};

export type SiteHostEnvironment = {
  [key: string]: string | undefined;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

export type SiteHostDecision =
  | { kind: "next"; site: SiteClass }
  | {
    kind: "redirect";
    location: string;
    status: 307 | 308;
    /**
     * Set when the help host is on either end of the redirect. A 308 is cacheable by default
     * (RFC 7538) and browsers keep it, so between attaching the domain in phase 2 and the
     * redeploy that turns `HELP_SITE_SERVING` on, every request to the help host answers a
     * sticky permanent redirect to `b4gamble.com`: the Founder testing the new domain in that
     * window would poison his own browser, and a crawler or a blocker sampling it would
     * record the help domain pointing at a gambling-affiliate site — exactly the
     * categorisation the second domain was bought to avoid.
     */
    noStore?: boolean;
  }
  | { kind: "reject"; reason: "host" | "metadata" };

function switchOn(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function normalizeDevHost(value: string | undefined) {
  const host = value?.trim().toLowerCase().replace(/\.$/, "") ?? "";
  // A host and an optional port, nothing that could carry a scheme, path or credentials.
  return /^[a-z0-9.-]+(?::\d{1,5})?$/.test(host) ? host : null;
}

export function helpSiteSwitches(environment: HelpSiteEnvironment): HelpSiteSwitches {
  return {
    serving: switchOn(environment.HELP_SITE_SERVING),
    redirects: switchOn(environment.HELP_SITE_REDIRECTS),
    devHost: normalizeDevHost(environment.HELP_SITE_DEV_HOST),
  };
}

/**
 * Named reads, so the edge bundle sees exactly which variables it needs. Vercel's edge runtime
 * exposes a custom variable only when the code reads it as a literal `process.env.NAME`
 * (§7.3), so passing `process.env` around would hide all three.
 */
export function helpSiteSwitchesFromProcessEnv(): HelpSiteSwitches {
  return helpSiteSwitches({
    HELP_SITE_SERVING: process.env.HELP_SITE_SERVING,
    HELP_SITE_REDIRECTS: process.env.HELP_SITE_REDIRECTS,
    HELP_SITE_DEV_HOST: process.env.HELP_SITE_DEV_HOST,
  });
}

export const HELP_CANONICAL_HOST = new URL(HELP_CANONICAL_ORIGIN).host;

function helpOriginRedirect(requested: URL): SiteHostDecision {
  const target = new URL(HELP_CANONICAL_ORIGIN);
  target.pathname = requested.pathname;
  target.search = requested.search;
  return { kind: "redirect", location: target.toString(), status: 308, noStore: true };
}

/** The help apex and its `www`, with a port or a trailing dot still counted as the help host. */
function requestNamesHelpHost(requestUrl: string) {
  let hostname: string;
  try {
    hostname = new URL(requestUrl).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return false;
  }
  return hostname === HELP_CANONICAL_HOST || hostname === `www.${HELP_CANONICAL_HOST}`;
}

/**
 * The help half of the host decision. Returns null when this request is not for the help
 * host, and the caller falls through to RFC-030's canonical-host rule: with
 * `HELP_SITE_SERVING` off the help host is "any other host" and 308s to `b4gamble.com`,
 * which is today's behaviour.
 */
function resolveHelpHost(
  requestUrl: string,
  environment: SiteHostEnvironment,
  switches: HelpSiteSwitches,
): SiteHostDecision | null {
  if (!switches.serving && !switches.devHost) return null;

  let requested: URL;
  try {
    requested = new URL(requestUrl);
  } catch {
    return null;
  }

  if (environment.VERCEL_ENV === "production") {
    if (!switches.serving) return null;
    if (requested.host !== HELP_CANONICAL_HOST) {
      return requested.host === `www.${HELP_CANONICAL_HOST}` ? helpOriginRedirect(requested) : null;
    }
    // The host is exact; an http request is upgraded to the help origin, never handed to the
    // commercial site.
    return requested.protocol === "https:"
      ? { kind: "next", site: "help" }
      : helpOriginRedirect(requested);
  }

  // Preview keeps one exact branch host (RFC-021), so it cannot serve two hosts: the
  // development host is ignored there and in Production.
  if (environment.VERCEL_ENV === "preview") return null;

  const devHost = switches.devHost;
  if (!devHost) return null;
  return requested.host.toLowerCase() === devHost || requested.hostname.toLowerCase() === devHost
    ? { kind: "next", site: "help" }
    : null;
}

/**
 * Step 1 of the middleware order (§7.1). Exact main host → `main`; exact help host with
 * `HELP_SITE_SERVING` on → `help`; `www.<help-domain>` → 308 to the help origin; cron paths
 * on generated hosts → continue; everything else → 308 to `b4gamble.com`.
 *
 * RFC-030's rule is untouched and still owns every decision this function does not make.
 */
export function resolveSiteHost(
  requestUrl: string,
  environment: SiteHostEnvironment = process.env,
  switches: HelpSiteSwitches = helpSiteSwitchesFromProcessEnv(),
): SiteHostDecision {
  const help = resolveHelpHost(requestUrl, environment, switches);
  if (help) return help;
  const canonical: RuntimeCanonicalHostDecision = resolveRuntimeCanonicalHost(requestUrl, environment);
  if (canonical.kind === "next") return { kind: "next", site: "main" };
  // RFC-030's own redirects are unchanged. The one addition is that a redirect whose request
  // named the help host may not be cached, whichever way it points.
  if (canonical.kind === "redirect" && requestNamesHelpHost(requestUrl)) {
    return { ...canonical, noStore: true };
  }
  return canonical;
}

export function siteClassFromHeaderValue(value: string | null | undefined): SiteClass {
  return value === "help" ? "help" : DEFAULT_SITE_CLASS;
}

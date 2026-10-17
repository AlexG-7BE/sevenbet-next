import {
  resolvePreviewCanonicalHost,
  type PreviewCanonicalHostDecision,
} from "@/lib/auth/preview-canonical-host";

type RuntimeCanonicalHostEnvironment = {
  [key: string]: string | undefined;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

export const PRODUCTION_CANONICAL_ORIGIN = "https://b4gamble.com";
export const PRODUCTION_CRON_PATH = "/api/internal/cron/programme-expiry-purge";
export const PRODUCTION_LIFECYCLE_CRON_PATH = "/api/internal/cron/customer-lifecycle";
export const PRODUCTION_LEARN_CONTENT_CRON_PATH = "/api/internal/cron/learn-content";
export const PRODUCTION_PAUSE_LETTERS_CRON_PATH = "/api/internal/cron/pause-letters";

// Every path scheduled under `crons` in vercel.json belongs here. The edge
// matcher cannot read vercel.json at runtime, so the list is a literal and
// tests/production-canonical-host.test.ts walks vercel.json to prove the two
// stay in step: a cron added to the schedule but forgotten here is redirected
// away from its own handler.
export const PRODUCTION_CRON_PATHS: readonly string[] = [
  PRODUCTION_CRON_PATH,
  PRODUCTION_LIFECYCLE_CRON_PATH,
  PRODUCTION_LEARN_CONTENT_CRON_PATH,
  PRODUCTION_PAUSE_LETTERS_CRON_PATH,
];

export type RuntimeCanonicalHostDecision =
  | { kind: "next" }
  | { kind: "redirect"; location: string; status: 307 | 308 }
  | { kind: "reject"; reason: "metadata" | "host" };

function withStatus(
  decision: PreviewCanonicalHostDecision,
): RuntimeCanonicalHostDecision {
  return decision.kind === "redirect"
    ? { ...decision, status: 307 }
    : decision;
}

function resolveProductionCanonicalHost(
  requestUrl: string,
): RuntimeCanonicalHostDecision {
  let requested: URL;
  try {
    requested = new URL(requestUrl);
  } catch {
    return { kind: "reject", reason: "host" };
  }

  // Vercel invokes project Cron Jobs on a generated Production deployment
  // hostname. Redirecting that authenticated request to the public canonical
  // host prevents the authenticated handler from running.
  if (PRODUCTION_CRON_PATHS.includes(requested.pathname)) {
    return { kind: "next" };
  }

  const canonical = new URL(PRODUCTION_CANONICAL_ORIGIN);
  if (
    requested.protocol === canonical.protocol
    && requested.host === canonical.host
  ) {
    return { kind: "next" };
  }

  canonical.pathname = requested.pathname;
  canonical.search = requested.search;
  return {
    kind: "redirect",
    location: canonical.toString(),
    status: 308,
  };
}

export function resolveRuntimeCanonicalHost(
  requestUrl: string,
  environment: RuntimeCanonicalHostEnvironment = process.env,
): RuntimeCanonicalHostDecision {
  if (environment.VERCEL_ENV === "preview") {
    return withStatus(resolvePreviewCanonicalHost(requestUrl, environment));
  }
  if (environment.VERCEL_ENV === "production") {
    return resolveProductionCanonicalHost(requestUrl);
  }
  return { kind: "next" };
}

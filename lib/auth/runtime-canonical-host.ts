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

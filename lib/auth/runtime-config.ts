import { isValidVercelBranchHost } from "@/lib/auth/preview-canonical-host";
import { PRODUCTION_CANONICAL_ORIGIN } from "@/lib/auth/runtime-canonical-host";
import { HELP_CANONICAL_ORIGIN, helpSiteSwitches } from "@/lib/site/host-gate";

type AuthRuntimeEnvironment = {
  [key: string]: string | undefined;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  HELP_SITE_SERVING?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

/** RFC-057 §9.2: exactly two Production hosts, both source constants, in a fixed order. */
export const PRODUCTION_AUTH_ORIGINS = [PRODUCTION_CANONICAL_ORIGIN, HELP_CANONICAL_ORIGIN] as const;
export const PRODUCTION_AUTH_HOSTS = PRODUCTION_AUTH_ORIGINS.map((origin) => new URL(origin).host);

type DynamicBaseURL = {
  allowedHosts: string[];
  protocol: "https";
};

export type BetterAuthRuntimeConfig = {
  baseURL?: string | DynamicBaseURL;
  trustedOrigins: string[];
};

function configuredOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function previewBranchHost(value: string | undefined) {
  const host = value?.trim();

  if (!isValidVercelBranchHost(host)) {
    throw new Error(
      "Preview Better Auth requires a valid Vercel branch host",
    );
  }

  return host;
}

export function resolveBetterAuthRuntimeConfig(
  environment: AuthRuntimeEnvironment = process.env,
): BetterAuthRuntimeConfig {
  const baseURL = environment.BETTER_AUTH_URL?.trim() || undefined;
  const trustedOrigins = configuredOrigins(
    environment.BETTER_AUTH_TRUSTED_ORIGINS,
  );

  if (environment.VERCEL_ENV === "production" && helpSiteSwitches(environment).serving) {
    // Two sites, one Better Auth (§9.2). A fixed `baseURL` would tie every sign-in, callback
    // and letter link to one host, so Production uses the dynamic form with exactly the two
    // source-constant hosts — the same shape Preview already uses for its one branch host.
    // A `BETTER_AUTH_URL` that is not one of the two is a configuration error, as a Preview
    // value that conflicts with the branch host already is; one that matches is accepted and
    // ignored, because the host of the request decides.
    if (baseURL && !(PRODUCTION_AUTH_ORIGINS as readonly string[]).includes(baseURL)) {
      throw new Error(
        "Production Better Auth base URL must be b4gamble.com or the help origin while the help site is served",
      );
    }
    const unknownOrigin = trustedOrigins.find((origin) => !(PRODUCTION_AUTH_ORIGINS as readonly string[]).includes(origin));
    if (unknownOrigin) {
      throw new Error(
        "Production Better Auth trusted origins must be the two site origins while the help site is served",
      );
    }
    return {
      baseURL: {
        allowedHosts: [...PRODUCTION_AUTH_HOSTS],
        protocol: "https",
      },
      trustedOrigins: [...PRODUCTION_AUTH_ORIGINS],
    };
  }

  if (environment.VERCEL_ENV !== "preview") {
    return {
      ...(baseURL ? { baseURL } : {}),
      trustedOrigins,
    };
  }

  const host = previewBranchHost(environment.VERCEL_BRANCH_URL);
  const origin = `https://${host}`;

  if (baseURL && baseURL !== origin) {
    throw new Error(
      "Preview Better Auth base URL conflicts with the Vercel branch host",
    );
  }

  if (trustedOrigins.some((trustedOrigin) => trustedOrigin !== origin)) {
    throw new Error(
      "Preview Better Auth trusted origins must match the Vercel branch origin",
    );
  }

  return {
    baseURL: {
      allowedHosts: [host],
      protocol: "https",
    },
    trustedOrigins: [origin],
  };
}

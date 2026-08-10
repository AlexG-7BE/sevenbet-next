import { isValidVercelBranchHost } from "@/lib/auth/preview-canonical-host";

type AuthRuntimeEnvironment = {
  [key: string]: string | undefined;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

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

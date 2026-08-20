import { createHash } from "@better-auth/utils/hash";
import type { StoreTokenType } from "@better-auth/oauth-provider";

import { COMMERCIAL_MCP_PATH } from "@/lib/mcp/commercial/config";

type CommercialMcpProviderEnvironment = Record<string, string | undefined> & {
  BETTER_AUTH_URL?: string;
  COMMERCIAL_MCP_PUBLIC_ORIGIN?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

/**
 * Uses the OAuth Provider's supported token-storage hook with the same
 * SHA-256/base64url-no-padding representation as its protected default.
 */
export async function hashCommercialMcpProviderToken(
  token: string,
  _type: StoreTokenType,
) {
  return createHash("SHA-256", "base64urlnopad").digest(token);
}

export const commercialMcpProviderTokenStorage = {
  hash: hashCommercialMcpProviderToken,
};

const PRESENTED_TOKEN_PREFIXES: Partial<Record<StoreTokenType, string>> = {
  access_token: "b4mcp_at_",
  refresh_token: "b4mcp_rt_",
};

export async function hashCommercialMcpPresentedToken(
  token: string,
  type: StoreTokenType,
) {
  const prefix = PRESENTED_TOKEN_PREFIXES[type];
  if (prefix && !token.startsWith(prefix)) return null;
  return hashCommercialMcpProviderToken(prefix ? token.slice(prefix.length) : token, type);
}

function providerOrigin(value: string) {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Commercial MCP OAuth Provider origin must contain only a scheme and host");
  }
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Commercial MCP OAuth Provider origin must use HTTPS");
  }
  return url.origin;
}

export function resolveCommercialMcpProviderResource(
  environment: CommercialMcpProviderEnvironment = process.env,
) {
  const commercialOrigin = environment.COMMERCIAL_MCP_PUBLIC_ORIGIN?.trim();
  const betterAuthOrigin = environment.BETTER_AUTH_URL?.trim();
  if (
    commercialOrigin
    && betterAuthOrigin
    && providerOrigin(commercialOrigin) !== providerOrigin(betterAuthOrigin)
  ) {
    throw new Error("Commercial MCP resource and Better Auth issuer must share one exact origin");
  }
  const configuredOrigin = commercialOrigin || betterAuthOrigin;
  if (configuredOrigin) return `${providerOrigin(configuredOrigin)}${COMMERCIAL_MCP_PATH}`;

  if (environment.VERCEL_ENV === "preview") {
    const host = environment.VERCEL_BRANCH_URL?.trim();
    if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) {
      throw new Error("Commercial MCP OAuth Provider requires a valid Preview branch host");
    }
    return `https://${host}${COMMERCIAL_MCP_PATH}`;
  }

  if (environment.VERCEL_ENV === "production") {
    return `https://b4gamble.com${COMMERCIAL_MCP_PATH}`;
  }

  return `http://localhost:3000${COMMERCIAL_MCP_PATH}`;
}

import type { CommercialMcpConfig } from "@/lib/mcp/commercial/config";

export const MEDIA_MCP_PATH = "/api/mcp/media";
export const MEDIA_MCP_SCOPES = ["media:read", "media:safe_write"] as const;
export const MEDIA_MCP_AUTHORIZATION_SCOPES = [...MEDIA_MCP_SCOPES, "offline_access"] as const;

type MediaMcpEnvironment = Record<string, string | undefined> & {
  MEDIA_OPERATIONS_MCP_ENABLED?: string;
  MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN?: string;
  COMMERCIAL_MCP_PUBLIC_ORIGIN?: string;
  COMMERCIAL_MCP_ENABLED?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

export type MediaMcpConfig = CommercialMcpConfig;

function originOnly(value: string) {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("Media Operations MCP public origin must contain only a scheme and host");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Media Operations MCP public origin must use HTTPS");
  return url.origin;
}

export function resolveMediaMcpConfig(requestUrl: string, environment: MediaMcpEnvironment = process.env): MediaMcpConfig | null {
  const explicit = environment.MEDIA_OPERATIONS_MCP_ENABLED?.trim();
  const enabled = explicit === "true"
    || (explicit !== "false" && (environment.COMMERCIAL_MCP_ENABLED?.trim() === "true" || environment.VERCEL_ENV === "production"));
  if (!enabled) return null;
  let origin: string;
  const configured = environment.MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN?.trim() || environment.COMMERCIAL_MCP_PUBLIC_ORIGIN?.trim();
  if (configured) origin = originOnly(configured);
  else if (environment.VERCEL_ENV === "preview") {
    const host = environment.VERCEL_BRANCH_URL?.trim();
    if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) throw new Error("Media Operations MCP Preview requires a valid Vercel branch host");
    origin = `https://${host}`;
  } else if (environment.VERCEL_ENV === "production") origin = "https://b4gamble.com";
  else origin = originOnly(new URL(requestUrl).origin);
  return {
    issuer: origin,
    resource: `${origin}${MEDIA_MCP_PATH}`,
    authorizationEndpoint: `${origin}/api/mcp/oauth/authorize`,
    tokenEndpoint: `${origin}/api/mcp/oauth/token`,
    registrationEndpoint: `${origin}/api/mcp/oauth/register`,
    revocationEndpoint: `${origin}/api/mcp/oauth/revoke`,
  };
}

export function mediaMcpDisabledResponse() {
  return Response.json({ error: "temporarily_unavailable", error_description: "Media Operations MCP is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

export function mediaMcpProtectedResourceMetadata(config: MediaMcpConfig) {
  return {
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: [...MEDIA_MCP_AUTHORIZATION_SCOPES],
    bearer_methods_supported: ["header"],
  };
}

export function mediaMcpAuthenticateHeader(config: MediaMcpConfig, scope?: string) {
  return `Bearer resource_metadata="${config.issuer}/.well-known/oauth-protected-resource/api/mcp/media"${scope ? `, scope="${scope}"` : ""}`;
}

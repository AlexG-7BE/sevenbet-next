export const COMMERCIAL_MCP_PATH = "/api/mcp/commercial";
export const COMMERCIAL_MCP_SCOPES = [
  "commercial:read",
  "commercial:safe_write",
] as const;
export const COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE = "offline_access";
export const COMMERCIAL_MCP_AUTHORIZATION_SCOPES = [
  ...COMMERCIAL_MCP_SCOPES,
  COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE,
] as const;
export const COMMERCIAL_MCP_INTERNAL_AUTH_SUFFIXES = [
  "/oauth2/authorize",
  "/oauth2/token",
  "/oauth2/register",
  "/oauth2/revoke",
  "/oauth2/introspect",
  "/oauth2/public-client-prelogin",
  "/oauth2/consent",
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
] as const;

export function isCommercialMcpInternalAuthPath(pathname: string) {
  return COMMERCIAL_MCP_INTERNAL_AUTH_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

type CommercialMcpEnvironment = Record<string, string | undefined> & {
  COMMERCIAL_MCP_ENABLED?: string;
  COMMERCIAL_MCP_PUBLIC_ORIGIN?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

export type CommercialMcpConfig = {
  issuer: string;
  resource: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string;
  revocationEndpoint: string;
};

function normalizedOrigin(value: string) {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Commercial MCP public origin must contain only a scheme and host");
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Commercial MCP public origin must use HTTPS");
  }
  return url.origin;
}

export function resolveCommercialMcpConfig(
  requestUrl: string,
  environment: CommercialMcpEnvironment = process.env,
): CommercialMcpConfig | null {
  const explicitEnabled = environment.COMMERCIAL_MCP_ENABLED?.trim();
  const enabled = explicitEnabled === "true"
    || (explicitEnabled !== "false" && environment.VERCEL_ENV === "production");
  if (!enabled) return null;

  let origin: string;
  if (environment.COMMERCIAL_MCP_PUBLIC_ORIGIN?.trim()) {
    origin = normalizedOrigin(environment.COMMERCIAL_MCP_PUBLIC_ORIGIN.trim());
  } else if (environment.VERCEL_ENV === "preview") {
    const host = environment.VERCEL_BRANCH_URL?.trim();
    if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) {
      throw new Error("Commercial MCP Preview requires a valid Vercel branch host");
    }
    origin = `https://${host}`;
  } else if (environment.VERCEL_ENV === "production") {
    origin = "https://b4gamble.com";
  } else {
    origin = normalizedOrigin(new URL(requestUrl).origin);
  }

  return {
    issuer: origin,
    resource: `${origin}${COMMERCIAL_MCP_PATH}`,
    authorizationEndpoint: `${origin}/api/mcp/oauth/authorize`,
    tokenEndpoint: `${origin}/api/mcp/oauth/token`,
    registrationEndpoint: `${origin}/api/mcp/oauth/register`,
    revocationEndpoint: `${origin}/api/mcp/oauth/revoke`,
  };
}

export function commercialMcpDisabledResponse() {
  return Response.json(
    {
      error: "temporarily_unavailable",
      error_description: "Commercial MCP is not configured",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function commercialMcpAuthorizationServerMetadata(config: CommercialMcpConfig, additionalScopes: readonly string[] = []) {
  return {
    issuer: config.issuer,
    authorization_endpoint: config.authorizationEndpoint,
    token_endpoint: config.tokenEndpoint,
    registration_endpoint: config.registrationEndpoint,
    revocation_endpoint: config.revocationEndpoint,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    authorization_response_iss_parameter_supported: true,
    scopes_supported: [...new Set([...COMMERCIAL_MCP_AUTHORIZATION_SCOPES, ...additionalScopes])],
    resource_parameter_supported: true,
  };
}

export function commercialMcpProtectedResourceMetadata(config: CommercialMcpConfig) {
  return {
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: [...COMMERCIAL_MCP_AUTHORIZATION_SCOPES],
    bearer_methods_supported: ["header"],
  };
}

export function commercialMcpAuthenticateHeader(config: CommercialMcpConfig, scope?: string) {
  const resourceMetadata = `${config.issuer}/.well-known/oauth-protected-resource/api/mcp/commercial`;
  return `Bearer resource_metadata="${resourceMetadata}"${scope ? `, scope="${scope}"` : ""}`;
}

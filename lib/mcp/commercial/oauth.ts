import { z } from "zod";

import { auth } from "@/lib/auth/server";
import prisma from "@/lib/db/prisma";
import {
  COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE,
  COMMERCIAL_MCP_SCOPES,
  commercialMcpAuthenticateHeader,
  type CommercialMcpConfig,
} from "@/lib/mcp/commercial/config";
import { privateNoStore, readBoundedBody } from "@/lib/mcp/commercial/http";
import {
  commercialMcpRateLimitKey,
  consumeCommercialMcpRateLimit,
} from "@/lib/mcp/commercial/rate-limit";
import {
  CommercialMcpAuthError,
  type CommercialMcpTokenContext,
  type DelegatedStaff,
  isAllowedChatGptRedirect,
  parseCommercialMcpClientMetadata,
  parseCommercialMcpScopes,
  validateCommercialMcpDelegatedStaff,
  validateCommercialMcpTokenRecord,
} from "@/lib/mcp/commercial/oauth-policy";

export {
  CommercialMcpAuthError,
  isAllowedChatGptRedirect,
  validateCommercialMcpTokenRecord,
} from "@/lib/mcp/commercial/oauth-policy";
export type { CommercialMcpTokenContext } from "@/lib/mcp/commercial/oauth-policy";

const DcrSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1).max(4),
  token_endpoint_auth_method: z.literal("none").default("none"),
  grant_types: z.array(z.enum(["authorization_code", "refresh_token"])).min(1).max(2).default(["authorization_code", "refresh_token"]),
  response_types: z.array(z.literal("code")).min(1).max(1).default(["code"]),
  client_name: z.string().min(1).max(120).default("ChatGPT Work"),
  client_uri: z.string().url().optional(),
  logo_uri: z.string().url().optional(),
  scope: z.string().max(200).optional(),
  contacts: z.array(z.string().email()).max(5).optional(),
  tos_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  software_id: z.string().max(200).optional(),
  software_version: z.string().max(80).optional(),
}).strict();

const AuthorizationQuerySchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1).max(200),
  redirect_uri: z.string().url(),
  scope: z.string().max(200).optional(),
  state: z.string().min(1).max(1_000),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  resource: z.string().url(),
  prompt: z.string().max(100).optional(),
  nonce: z.string().max(1_000).optional(),
  login_hint: z.string().max(320).optional(),
}).strict();

const TokenBodySchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  client_id: z.string().min(1).max(200),
  resource: z.string().url(),
  code: z.string().min(1).max(300).optional(),
  redirect_uri: z.string().url().optional(),
  code_verifier: z.string().min(43).max(128).optional(),
  refresh_token: z.string().min(1).max(300).optional(),
}).strict().superRefine((value, context) => {
  if (value.grant_type === "authorization_code") {
    for (const field of ["code", "redirect_uri", "code_verifier"] as const) {
      if (!value[field]) context.addIssue({ code: "custom", path: [field], message: `${field} is required` });
    }
  } else if (!value.refresh_token) {
    context.addIssue({ code: "custom", path: ["refresh_token"], message: "refresh_token is required" });
  }
});

async function requireRegisteredClient(clientId: string, config: CommercialMcpConfig) {
  const client = await prisma.oauthApplication.findUnique({ where: { clientId } });
  if (!client || client.disabled || client.type !== "public") {
    throw new CommercialMcpAuthError("OAuth client is invalid", 401, "invalid_client");
  }
  const metadata = parseCommercialMcpClientMetadata(client.metadata);
  if (metadata.b4gambleMcpResource !== config.resource) {
    throw new CommercialMcpAuthError("OAuth client resource does not match", 401, "invalid_target");
  }
  return client;
}

async function requireDelegatedStaff(userId: string | null | undefined): Promise<DelegatedStaff> {
  if (!userId) throw new CommercialMcpAuthError("OAuth token has no delegated user", 401, "invalid_token");
  const adminUser = await prisma.adminUser.findUnique({ where: { userId } });
  return validateCommercialMcpDelegatedStaff(userId, adminUser as DelegatedStaff | null);
}

function rewriteForInternalAuth(request: Request, path: string, body?: BodyInit, contentType?: string) {
  const url = new URL(request.url);
  url.pathname = `/api/auth${path}`;
  url.search = "";
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  if (contentType) headers.set("content-type", contentType);
  return new Request(url, {
    method: request.method,
    headers,
    ...(body === undefined ? {} : { body }),
    redirect: "manual",
  });
}

export async function registerCommercialMcpClient(request: Request, config: CommercialMcpConfig) {
  const rate = await consumeCommercialMcpRateLimit({
    bucket: "dcr",
    key: commercialMcpRateLimitKey(request),
    limit: 10,
    windowMs: 60 * 60 * 1_000,
  });
  if (!rate.allowed) throw new CommercialMcpAuthError("Client registration rate limit exceeded", 429, "rate_limit_exceeded");

  const raw = await readBoundedBody(request, 16 * 1_024);
  const input = DcrSchema.parse(JSON.parse(raw));
  if (!input.grant_types.includes("authorization_code") || input.redirect_uris.some((uri) => !isAllowedChatGptRedirect(uri))) {
    throw new CommercialMcpAuthError("Only ChatGPT public authorization-code clients are accepted", 400, "invalid_client_metadata");
  }
  const body = JSON.stringify({
    ...input,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: [...COMMERCIAL_MCP_SCOPES, COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE].join(" "),
    metadata: {
      integration: "CHATGPT_WORK",
      b4gambleMcpResource: config.resource,
    },
  });
  return privateNoStore(await auth.handler(rewriteForInternalAuth(request, "/mcp/register", body, "application/json")));
}

export async function authorizeCommercialMcpRequest(
  request: Request,
  config: CommercialMcpConfig,
  delegatedUserId: string,
) {
  const rawQuery = Object.fromEntries(new URL(request.url).searchParams.entries());
  const query = AuthorizationQuerySchema.parse(rawQuery);
  if (query.resource !== config.resource) {
    throw new CommercialMcpAuthError("OAuth resource does not match", 400, "invalid_target");
  }
  const client = await requireRegisteredClient(query.client_id, config);
  if (!client.redirectUrls.split(",").includes(query.redirect_uri)) {
    throw new CommercialMcpAuthError("OAuth redirect URI is not registered", 400, "invalid_redirect_uri");
  }
  const scopes = parseCommercialMcpScopes(query.scope);
  await requireDelegatedStaff(delegatedUserId);

  const url = new URL(request.url);
  url.pathname = "/api/auth/mcp/authorize";
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", [...scopes].join(" "));
  url.searchParams.delete("resource");
  return privateNoStore(await auth.handler(new Request(url, { headers: request.headers, redirect: "manual" })));
}

type ConsentVerification = {
  clientId: string;
  redirectURI: string;
  scope: string[];
  userId: string;
  requireConsent: boolean;
};

export async function getCommercialMcpConsent(
  consentCode: string,
  expectedUserId: string,
  config: CommercialMcpConfig,
) {
  const verification = await prisma.verification.findFirst({ where: { identifier: consentCode } });
  if (!verification || verification.expiresAt <= new Date()) {
    throw new CommercialMcpAuthError("OAuth consent request is invalid or expired", 400, "invalid_request");
  }
  let value: ConsentVerification;
  try {
    value = JSON.parse(verification.value) as ConsentVerification;
  } catch {
    throw new CommercialMcpAuthError("OAuth consent request is invalid", 400, "invalid_request");
  }
  if (!value.requireConsent || value.userId !== expectedUserId) {
    throw new CommercialMcpAuthError("OAuth consent request does not belong to this staff user", 403, "access_denied");
  }
  const client = await requireRegisteredClient(value.clientId, config);
  const scopes = parseCommercialMcpScopes(value.scope.join(" "));
  await requireDelegatedStaff(expectedUserId);
  return { client, scopes: [...scopes], verification: value };
}

export async function completeCommercialMcpConsent(
  request: Request,
  config: CommercialMcpConfig,
  expectedUserId: string,
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== config.issuer) {
    throw new CommercialMcpAuthError("OAuth consent origin is invalid", 403, "access_denied");
  }
  const raw = await readBoundedBody(request, 4 * 1_024);
  const form = new URLSearchParams(raw);
  const consentCode = z.string().min(1).max(300).parse(form.get("consent_code"));
  const decision = z.enum(["authorize", "deny"]).parse(form.get("decision"));
  const consent = await getCommercialMcpConsent(consentCode, expectedUserId, config);
  const body = JSON.stringify({ accept: decision === "authorize", consent_code: consentCode });
  const response = await auth.handler(rewriteForInternalAuth(request, "/oauth2/consent", body, "application/json"));
  if (!response.ok) return privateNoStore(response);
  const result = z.object({ redirectURI: z.string().url() }).parse(await response.json());
  const redirect = new URL(result.redirectURI);
  const registeredRedirect = new URL(consent.verification.redirectURI);
  if (redirect.origin !== registeredRedirect.origin || redirect.pathname !== registeredRedirect.pathname) {
    throw new CommercialMcpAuthError("OAuth consent produced an invalid redirect", 400, "server_error");
  }
  return privateNoStore(new Response(null, { status: 303, headers: { Location: redirect.toString() } }));
}

async function parseTokenBody(request: Request) {
  const raw = await readBoundedBody(request, 8 * 1_024);
  return TokenBodySchema.parse(Object.fromEntries(new URLSearchParams(raw).entries()));
}

export async function exchangeCommercialMcpToken(request: Request, config: CommercialMcpConfig) {
  const rate = await consumeCommercialMcpRateLimit({
    bucket: "token",
    key: commercialMcpRateLimitKey(request),
    limit: 60,
    windowMs: 10 * 60 * 1_000,
  });
  if (!rate.allowed) throw new CommercialMcpAuthError("Token endpoint rate limit exceeded", 429, "rate_limit_exceeded", undefined, 600);
  const body = await parseTokenBody(request);
  if (body.resource !== config.resource) {
    throw new CommercialMcpAuthError("OAuth resource does not match", 400, "invalid_target");
  }
  await requireRegisteredClient(body.client_id, config);
  let previousRefreshTokenId: string | null = null;

  if (body.grant_type === "authorization_code") {
    const verification = await prisma.verification.findFirst({ where: { identifier: body.code! } });
    if (!verification) throw new CommercialMcpAuthError("Authorization code is invalid", 401, "invalid_grant");
    const value = JSON.parse(verification.value) as ConsentVerification;
    if (value.clientId !== body.client_id || value.redirectURI !== body.redirect_uri || value.requireConsent) {
      throw new CommercialMcpAuthError("Authorization code binding is invalid", 401, "invalid_grant");
    }
    parseCommercialMcpScopes(value.scope.join(" "));
    await requireDelegatedStaff(value.userId);
  } else {
    const previous = await prisma.oauthAccessToken.findUnique({ where: { refreshToken: body.refresh_token! } });
    if (!previous || previous.clientId !== body.client_id || previous.refreshTokenExpiresAt <= new Date()) {
      throw new CommercialMcpAuthError("Refresh token is invalid", 401, "invalid_grant");
    }
    parseCommercialMcpScopes(previous.scopes);
    await requireDelegatedStaff(previous.userId);
    previousRefreshTokenId = previous.id;
  }

  const forwarded = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) if (value) forwarded.set(key, value);
  forwarded.delete("resource");
  const response = await auth.handler(rewriteForInternalAuth(
    request,
    "/mcp/token",
    forwarded.toString(),
    "application/x-www-form-urlencoded",
  ));
  if (response.ok && previousRefreshTokenId) {
    await prisma.oauthAccessToken.deleteMany({ where: { id: previousRefreshTokenId } });
  }
  return privateNoStore(response);
}

export async function validateCommercialMcpAccessToken(
  request: Request,
  config: CommercialMcpConfig,
  requiredScope?: (typeof COMMERCIAL_MCP_SCOPES)[number],
): Promise<CommercialMcpTokenContext> {
  const match = /^Bearer ([A-Za-z0-9]+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) throw new CommercialMcpAuthError("Bearer token is required", 401, "invalid_token", requiredScope);
  const token = await prisma.oauthAccessToken.findUnique({
    where: { accessToken: match[1] },
    include: { client: true },
  });
  const adminUser = token?.userId
    ? await prisma.adminUser.findUnique({ where: { userId: token.userId } })
    : null;
  return validateCommercialMcpTokenRecord(token, adminUser as DelegatedStaff | null, config, requiredScope);
}

export async function revokeCommercialMcpToken(request: Request, config: CommercialMcpConfig) {
  const rate = await consumeCommercialMcpRateLimit({
    bucket: "revoke",
    key: commercialMcpRateLimitKey(request),
    limit: 60,
    windowMs: 10 * 60 * 1_000,
  });
  if (!rate.allowed) throw new CommercialMcpAuthError("Revocation endpoint rate limit exceeded", 429, "rate_limit_exceeded", undefined, 600);
  const raw = await readBoundedBody(request, 4 * 1_024);
  const body = z.object({
    token: z.string().min(1).max(300),
    token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
    client_id: z.string().min(1).max(200),
    resource: z.string().url(),
  }).strict().parse(Object.fromEntries(new URLSearchParams(raw).entries()));
  if (body.resource !== config.resource) throw new CommercialMcpAuthError("OAuth resource does not match", 400, "invalid_target");
  await requireRegisteredClient(body.client_id, config);
  await prisma.oauthAccessToken.deleteMany({
    where: {
      clientId: body.client_id,
      OR: [{ accessToken: body.token }, { refreshToken: body.token }],
    },
  });
  return privateNoStore(new Response(null, { status: 200 }));
}

export function commercialMcpAuthErrorResponse(error: unknown, config: CommercialMcpConfig) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return privateNoStore(Response.json({ error: "invalid_request", error_description: "OAuth request is invalid" }, { status: 400 }));
  }
  if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
    return privateNoStore(Response.json({ error: "invalid_request", error_description: "OAuth request is too large" }, { status: 413 }));
  }
  if (error instanceof CommercialMcpAuthError) {
    const headers = new Headers();
    if (error.status === 401 || error.status === 403) {
      headers.set("WWW-Authenticate", commercialMcpAuthenticateHeader(config, error.requiredScope));
      headers.set("Access-Control-Expose-Headers", "WWW-Authenticate");
    }
    if (error.status === 429) headers.set("Retry-After", String(error.retryAfterSeconds));
    return privateNoStore(Response.json(
      { error: error.code, error_description: error.message },
      { status: error.status, headers },
    ));
  }
  return privateNoStore(Response.json({ error: "server_error", error_description: "OAuth request could not be completed" }, { status: 500 }));
}

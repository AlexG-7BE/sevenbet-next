import type { AdminRole } from "@prisma/client";

import { canPerformAction, permissionsForRole } from "@/lib/cms/permissions";
import {
  COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE,
  COMMERCIAL_MCP_SCOPES,
  type CommercialMcpConfig,
} from "@/lib/mcp/commercial/config";

const CHATGPT_PLATFORM_REDIRECT = "https://chatgpt.com/connector_platform_oauth_redirect";

export type DelegatedStaff = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  role: AdminRole;
};

export type CommercialMcpTokenContext = {
  tokenId: string;
  clientId: string;
  staff: DelegatedStaff;
  scopes: Set<string>;
};

export class CommercialMcpAuthError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 429,
    readonly code: string,
    readonly requiredScope?: string,
    readonly retryAfterSeconds = 3_600,
  ) {
    super(message);
    this.name = "CommercialMcpAuthError";
  }
}

export function isAllowedChatGptRedirect(value: string) {
  if (value === CHATGPT_PLATFORM_REDIRECT) return true;
  const url = new URL(value);
  if (url.origin !== "https://chatgpt.com" || url.search || url.hash) return false;
  return /^\/connector\/oauth\/[A-Za-z0-9_-]{8,200}$/.test(url.pathname);
}

export function parseCommercialMcpClientMetadata(metadata: string | null) {
  try {
    const value = JSON.parse(metadata ?? "null") as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    const record = value as Record<string, unknown>;
    if (record.integration !== "CHATGPT_WORK" || typeof record.b4gambleMcpResource !== "string") throw new Error("invalid");
    new URL(record.b4gambleMcpResource);
    if (Object.keys(record).some((key) => !["integration", "b4gambleMcpResource"].includes(key))) throw new Error("invalid");
    return { integration: "CHATGPT_WORK" as const, b4gambleMcpResource: record.b4gambleMcpResource };
  } catch {
    throw new CommercialMcpAuthError("OAuth client is not registered for this resource", 401, "invalid_client");
  }
}

export function parseCommercialMcpScopes(value: string | undefined) {
  const scopes = new Set((value ?? "commercial:read").split(/\s+/).filter(Boolean));
  const permitted = new Set<string>([...COMMERCIAL_MCP_SCOPES, COMMERCIAL_MCP_OPTIONAL_REFRESH_SCOPE]);
  if (!scopes.size || [...scopes].some((scope) => !permitted.has(scope))) {
    throw new CommercialMcpAuthError("Requested OAuth scope is not permitted", 400, "invalid_scope");
  }
  return scopes;
}

export function validateCommercialMcpDelegatedStaff(
  userId: string | null | undefined,
  adminUser: DelegatedStaff | null,
) {
  if (!userId || !adminUser || adminUser.userId !== userId) {
    throw new CommercialMcpAuthError("Delegated user is not B4GAMBLE staff", 403, "staff_required");
  }
  if (!canPerformAction({ role: adminUser.role, permissions: permissionsForRole(adminUser.role) }, "affiliate.manage")) {
    throw new CommercialMcpAuthError("Delegated staff lacks affiliate.manage", 403, "insufficient_permission");
  }
  return adminUser;
}

export function validateCommercialMcpTokenRecord(
  token: {
    id: string;
    clientId: string;
    userId: string | null;
    scopes: string;
    accessTokenExpiresAt: Date;
    client: { disabled: boolean; type: string; metadata: string | null };
  } | null,
  adminUser: DelegatedStaff | null,
  config: CommercialMcpConfig,
  requiredScope?: (typeof COMMERCIAL_MCP_SCOPES)[number],
  now = new Date(),
): CommercialMcpTokenContext {
  if (!token || token.accessTokenExpiresAt <= now) {
    throw new CommercialMcpAuthError("Bearer token is invalid or expired", 401, "invalid_token", requiredScope);
  }
  if (token.client.disabled || token.client.type !== "public") {
    throw new CommercialMcpAuthError("OAuth client is disabled", 401, "invalid_token", requiredScope);
  }
  const metadata = parseCommercialMcpClientMetadata(token.client.metadata);
  if (metadata.b4gambleMcpResource !== config.resource) {
    throw new CommercialMcpAuthError("Bearer token has the wrong resource", 401, "invalid_token", requiredScope);
  }
  const scopes = parseCommercialMcpScopes(token.scopes);
  if (requiredScope && !scopes.has(requiredScope)) {
    throw new CommercialMcpAuthError("Bearer token has insufficient scope", 403, "insufficient_scope", requiredScope);
  }
  const staff = validateCommercialMcpDelegatedStaff(token.userId, adminUser);
  return { tokenId: token.id, clientId: token.clientId, staff, scopes };
}

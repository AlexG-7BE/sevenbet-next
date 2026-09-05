import type { CmsPermission } from "@/lib/cms/types";
import { COMMERCIAL_MCP_AUTHORIZATION_SCOPES, COMMERCIAL_MCP_PATH } from "@/lib/mcp/commercial/config";
import { MEDIA_MCP_AUTHORIZATION_SCOPES, MEDIA_MCP_PATH } from "@/lib/mcp/media/config";
import type { CommercialMcpConfig } from "@/lib/mcp/commercial/config";

export function isMediaMcpConfig(config: CommercialMcpConfig) {
  return new URL(config.resource).pathname === MEDIA_MCP_PATH;
}

export function operationalMcpScopes(config: CommercialMcpConfig): readonly string[] {
  return isMediaMcpConfig(config) ? MEDIA_MCP_AUTHORIZATION_SCOPES : COMMERCIAL_MCP_AUTHORIZATION_SCOPES;
}

export function operationalMcpDefaultScope(config: CommercialMcpConfig) {
  return isMediaMcpConfig(config) ? "media:read" : "commercial:read";
}

export function operationalMcpPermission(config: CommercialMcpConfig): CmsPermission {
  return isMediaMcpConfig(config) ? "media.manage" : "affiliate.manage";
}

export function operationalMcpLabel(config: CommercialMcpConfig) {
  return isMediaMcpConfig(config) ? "Media Operations" : "Commercial Ops";
}

export function operationalMcpProtectedResourceUrl(config: CommercialMcpConfig) {
  const suffix = isMediaMcpConfig(config) ? MEDIA_MCP_PATH : COMMERCIAL_MCP_PATH;
  return `${config.issuer}/.well-known/oauth-protected-resource${suffix}`;
}

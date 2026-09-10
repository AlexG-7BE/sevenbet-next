import type { CmsPermission } from "@/lib/cms/types";
import { COMMERCIAL_MCP_AUTHORIZATION_SCOPES, COMMERCIAL_MCP_PATH } from "@/lib/mcp/commercial/config";
import type { CommercialMcpConfig } from "@/lib/mcp/commercial/config";

export function operationalMcpScopes(config: CommercialMcpConfig): readonly string[] {
  void config;
  return COMMERCIAL_MCP_AUTHORIZATION_SCOPES;
}

export function operationalMcpDefaultScope(config: CommercialMcpConfig) {
  void config;
  return "commercial:read";
}

export function operationalMcpPermission(config: CommercialMcpConfig): CmsPermission {
  void config;
  return "affiliate.manage";
}

export function operationalMcpLabel(config: CommercialMcpConfig) {
  void config;
  return "Commercial Ops";
}

export function operationalMcpProtectedResourceUrl(config: CommercialMcpConfig) {
  return `${config.issuer}/.well-known/oauth-protected-resource${COMMERCIAL_MCP_PATH}`;
}

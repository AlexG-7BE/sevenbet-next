import {
  COMMERCIAL_MCP_AUTHORIZATION_SCOPES,
  commercialMcpAuthorizationServerMetadata,
  commercialMcpDisabledResponse,
  resolveCommercialMcpConfig,
} from "@/lib/mcp/commercial/config";
import { noStoreJson } from "@/lib/mcp/commercial/http";
import { MEDIA_MCP_AUTHORIZATION_SCOPES, resolveMediaMcpConfig } from "@/lib/mcp/media/config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const commercialConfig = resolveCommercialMcpConfig(request.url);
    const mediaConfig = resolveMediaMcpConfig(request.url);
    const config = commercialConfig ?? mediaConfig;
    if (!config) return commercialMcpDisabledResponse();
    if (commercialConfig && mediaConfig && commercialConfig.issuer !== mediaConfig.issuer) return commercialMcpDisabledResponse();
    const scopes = [
      ...(commercialConfig ? COMMERCIAL_MCP_AUTHORIZATION_SCOPES : []),
      ...(mediaConfig ? MEDIA_MCP_AUTHORIZATION_SCOPES : []),
    ];
    return noStoreJson({ ...commercialMcpAuthorizationServerMetadata(config), scopes_supported: [...new Set(scopes)] }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return commercialMcpDisabledResponse();
  }
}

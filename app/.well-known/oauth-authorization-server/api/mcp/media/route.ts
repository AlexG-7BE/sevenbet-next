import { commercialMcpAuthorizationServerMetadata } from "@/lib/mcp/commercial/config";
import { noStoreJson } from "@/lib/mcp/commercial/http";
import {
  MEDIA_MCP_AUTHORIZATION_SCOPES,
  mediaMcpDisabledResponse,
  resolveMediaMcpConfig,
} from "@/lib/mcp/media/config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const config = resolveMediaMcpConfig(request.url);
    if (!config) return mediaMcpDisabledResponse();
    return noStoreJson({
      ...commercialMcpAuthorizationServerMetadata(config),
      scopes_supported: [...MEDIA_MCP_AUTHORIZATION_SCOPES],
    }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch {
    return mediaMcpDisabledResponse();
  }
}

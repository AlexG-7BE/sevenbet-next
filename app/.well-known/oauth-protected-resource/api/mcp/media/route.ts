import { noStoreJson } from "@/lib/mcp/commercial/http";
import { mediaMcpDisabledResponse, mediaMcpProtectedResourceMetadata, resolveMediaMcpConfig } from "@/lib/mcp/media/config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const config = resolveMediaMcpConfig(request.url);
    if (!config) return mediaMcpDisabledResponse();
    return noStoreJson(mediaMcpProtectedResourceMetadata(config), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch {
    return mediaMcpDisabledResponse();
  }
}

import {
  commercialMcpDisabledResponse,
  commercialMcpProtectedResourceMetadata,
  resolveCommercialMcpConfig,
} from "@/lib/mcp/commercial/config";
import { noStoreJson } from "@/lib/mcp/commercial/http";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const config = resolveCommercialMcpConfig(request.url);
    if (!config) return commercialMcpDisabledResponse();
    return noStoreJson(commercialMcpProtectedResourceMetadata(config), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return commercialMcpDisabledResponse();
  }
}

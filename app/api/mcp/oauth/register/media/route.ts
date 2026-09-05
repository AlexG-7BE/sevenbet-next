import { commercialMcpAuthErrorResponse, registerCommercialMcpClient } from "@/lib/mcp/commercial/oauth";
import { mediaMcpDisabledResponse, resolveMediaMcpConfig } from "@/lib/mcp/media/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config;
  try {
    config = resolveMediaMcpConfig(request.url);
  } catch {
    return mediaMcpDisabledResponse();
  }
  if (!config) return mediaMcpDisabledResponse();
  try {
    return await registerCommercialMcpClient(request, config);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

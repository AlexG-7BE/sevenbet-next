import { commercialMcpDisabledResponse, resolveCommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { commercialMcpAuthErrorResponse, exchangeCommercialMcpToken } from "@/lib/mcp/commercial/oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config;
  try {
    config = resolveCommercialMcpConfig(request.url);
  } catch {
    return commercialMcpDisabledResponse();
  }
  if (!config) return commercialMcpDisabledResponse();
  try {
    return await exchangeCommercialMcpToken(request, config);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

import { commercialMcpDisabledResponse } from "@/lib/mcp/commercial/config";
import { commercialMcpAuthErrorResponse, exchangeCommercialMcpToken } from "@/lib/mcp/commercial/oauth";
import { resolveOperationalMcpRequestConfig } from "@/lib/mcp/operational-routing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config;
  try {
    config = await resolveOperationalMcpRequestConfig(request, "token");
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

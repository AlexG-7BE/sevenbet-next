import { commercialMcpDisabledResponse } from "@/lib/mcp/commercial/config";
import { commercialMcpAuthErrorResponse, revokeCommercialMcpToken } from "@/lib/mcp/commercial/oauth";
import { resolveOperationalMcpRequestConfig } from "@/lib/mcp/operational-routing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config;
  try {
    config = await resolveOperationalMcpRequestConfig(request, "revoke");
  } catch {
    return commercialMcpDisabledResponse();
  }
  if (!config) return commercialMcpDisabledResponse();
  try {
    return await revokeCommercialMcpToken(request, config);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

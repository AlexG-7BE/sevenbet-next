import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { normalizeCommercialMcpAuthorizationRequest } from "@/lib/mcp/commercial/authorization-request";
import { commercialMcpDisabledResponse } from "@/lib/mcp/commercial/config";
import { authorizeCommercialMcpRequest, CommercialMcpAuthError, commercialMcpAuthErrorResponse } from "@/lib/mcp/commercial/oauth";
import { resolveOperationalMcpRequestConfig } from "@/lib/mcp/operational-routing";
import { operationalMcpLabel, operationalMcpPermission } from "@/lib/mcp/operational-policy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let config;
  try {
    config = await resolveOperationalMcpRequestConfig(request, "authorize");
  } catch {
    return commercialMcpDisabledResponse();
  }
  if (!config) return commercialMcpDisabledResponse();
  try {
    const session = await getServerSession(request.headers);
    if (!session) {
      const current = new URL(request.url);
      const returnTo = `${current.pathname}${current.search}`;
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/admin/integrations/chatgpt-work/login?returnTo=${encodeURIComponent(returnTo)}`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const staff = await getCurrentStaff(request.headers);
    if (!staff || !staff.permissions.includes(operationalMcpPermission(config))) {
      throw new CommercialMcpAuthError(`B4GAMBLE ${operationalMcpLabel(config)} staff access is required`, 403, "access_denied");
    }
    const normalizedRequest = normalizeCommercialMcpAuthorizationRequest(request);
    return await authorizeCommercialMcpRequest(normalizedRequest, config, session.user.id);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

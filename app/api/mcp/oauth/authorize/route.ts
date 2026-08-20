import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { normalizeCommercialMcpAuthorizationRequest } from "@/lib/mcp/commercial/authorization-request";
import { commercialMcpDisabledResponse, resolveCommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { authorizeCommercialMcpRequest, CommercialMcpAuthError, commercialMcpAuthErrorResponse } from "@/lib/mcp/commercial/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let config;
  try {
    config = resolveCommercialMcpConfig(request.url);
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
    if (!staff || !staff.permissions.includes("affiliate.manage")) {
      throw new CommercialMcpAuthError("B4GAMBLE commercial staff access is required", 403, "access_denied");
    }
    const normalizedRequest = normalizeCommercialMcpAuthorizationRequest(request);
    return await authorizeCommercialMcpRequest(normalizedRequest, config, session.user.id);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

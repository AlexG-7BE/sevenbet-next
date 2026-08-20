import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { commercialMcpDisabledResponse, resolveCommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { CommercialMcpAuthError, commercialMcpAuthErrorResponse, completeCommercialMcpConsent } from "@/lib/mcp/commercial/oauth";

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
    const session = await getServerSession(request.headers);
    const staff = await getCurrentStaff(request.headers);
    if (!session || !staff || !staff.permissions.includes("affiliate.manage")) {
      throw new CommercialMcpAuthError("B4GAMBLE commercial staff access is required", 403, "access_denied");
    }
    return await completeCommercialMcpConsent(request, config, session.user.id);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

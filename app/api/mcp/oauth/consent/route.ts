import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaffFromSession } from "@/lib/auth/staff";
import {
  commercialMcpInternalAuthHeaders,
  isAllowedCommercialMcpConsentOrigin,
} from "@/lib/mcp/commercial/consent-browser";
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
    if (!isAllowedCommercialMcpConsentOrigin(request.headers.get("origin"), config.issuer)) {
      throw new CommercialMcpAuthError("OAuth consent origin is invalid", 403, "access_denied");
    }
    const authHeaders = commercialMcpInternalAuthHeaders(request.headers, config.issuer);
    const session = await getServerSession(authHeaders);
    const staff = await getCurrentStaffFromSession(session);
    if (!session || !staff || !staff.permissions.includes("affiliate.manage")) {
      throw new CommercialMcpAuthError("B4GAMBLE commercial staff access is required", 403, "access_denied");
    }
    const consentRequest = new Request(request, { headers: authHeaders });
    return await completeCommercialMcpConsent(consentRequest, config, session.user.id);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

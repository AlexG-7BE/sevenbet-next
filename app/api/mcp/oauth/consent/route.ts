import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaffFromSession } from "@/lib/auth/staff";
import {
  areAllowedCommercialMcpConsentHeaders,
  commercialMcpInternalAuthHeaders,
} from "@/lib/mcp/commercial/consent-browser";
import { commercialMcpDisabledResponse } from "@/lib/mcp/commercial/config";
import { CommercialMcpAuthError, commercialMcpAuthErrorResponse, completeCommercialMcpConsent } from "@/lib/mcp/commercial/oauth";
import { resolveOperationalMcpRequestConfig } from "@/lib/mcp/operational-routing";
import { operationalMcpLabel, operationalMcpPermission } from "@/lib/mcp/operational-policy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config;
  try {
    config = await resolveOperationalMcpRequestConfig(request, "consent");
  } catch {
    return commercialMcpDisabledResponse();
  }
  if (!config) return commercialMcpDisabledResponse();
  try {
    if (!areAllowedCommercialMcpConsentHeaders(request.headers, config.issuer)) {
      throw new CommercialMcpAuthError("OAuth consent origin is invalid", 403, "access_denied");
    }
    const authHeaders = commercialMcpInternalAuthHeaders(request.headers, config.issuer);
    const session = await getServerSession(authHeaders);
    const staff = await getCurrentStaffFromSession(session);
    if (!session || !staff || !staff.permissions.includes(operationalMcpPermission(config))) {
      throw new CommercialMcpAuthError(`B4GAMBLE ${operationalMcpLabel(config)} staff access is required`, 403, "access_denied");
    }
    const consentRequest = new Request(request, { headers: authHeaders });
    return await completeCommercialMcpConsent(consentRequest, config, session.user.id);
  } catch (error) {
    return commercialMcpAuthErrorResponse(error, config);
  }
}

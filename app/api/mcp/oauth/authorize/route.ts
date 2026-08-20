import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { commercialMcpDisabledResponse, resolveCommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { authorizeCommercialMcpRequest, CommercialMcpAuthError, commercialMcpAuthErrorResponse } from "@/lib/mcp/commercial/oauth";

export const dynamic = "force-dynamic";

const COMMERCIAL_MCP_AUTHORIZATION_KEYS = new Set([
  "response_type",
  "client_id",
  "redirect_uri",
  "scope",
  "state",
  "code_challenge",
  "code_challenge_method",
  "resource",
  "prompt",
  "nonce",
  "login_hint",
]);

/**
 * ChatGPT may add non-authority OAuth/OIDC presentation extensions such as
 * ui_locales or response_mode. The Commercial MCP wrapper deliberately keeps
 * a strict security contract, so strip unknown extensions before validating
 * the exact client, redirect, resource, scope, state and PKCE bindings.
 */
export function normalizeCommercialMcpAuthorizationRequest(request: Request) {
  const url = new URL(request.url);
  const original = new URLSearchParams(url.search);
  url.search = "";

  for (const key of COMMERCIAL_MCP_AUTHORIZATION_KEYS) {
    for (const value of original.getAll(key)) url.searchParams.append(key, value);
  }

  return new Request(url, {
    method: request.method,
    headers: request.headers,
    redirect: "manual",
  });
}

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

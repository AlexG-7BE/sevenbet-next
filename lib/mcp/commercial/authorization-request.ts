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
 * ui_locales or response_mode. Keep the Commercial MCP authority surface
 * strict by forwarding only parameters that the bridge validates itself.
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

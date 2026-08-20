export const CHATGPT_WORK_BROWSER_ORIGIN = "https://chatgpt.com";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedCommercialMcpConsentOrigin(value: string | null, issuer: string) {
  if (!value) return true;
  const origin = normalizeOrigin(value);
  const issuerOrigin = normalizeOrigin(issuer);
  return Boolean(origin && issuerOrigin && (origin === issuerOrigin || origin === CHATGPT_WORK_BROWSER_ORIGIN));
}

export function areAllowedCommercialMcpConsentHeaders(input: Headers, issuer: string) {
  return isAllowedCommercialMcpConsentOrigin(input.get("origin"), issuer)
    && isAllowedCommercialMcpConsentOrigin(input.get("referer"), issuer);
}

export function commercialMcpInternalAuthHeaders(input: Headers, issuer: string) {
  if (!areAllowedCommercialMcpConsentHeaders(input, issuer)) {
    throw new Error("Untrusted Commercial MCP consent origin");
  }

  const headers = new Headers(input);
  const issuerOrigin = new URL(issuer).origin;
  if (headers.has("origin")) headers.set("origin", issuerOrigin);
  if (headers.has("referer")) headers.set("referer", `${issuerOrigin}/`);
  return headers;
}

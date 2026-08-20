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

export function commercialMcpInternalAuthHeaders(input: Headers, issuer: string) {
  const headers = new Headers(input);
  const origin = headers.get("origin");
  if (!origin) return headers;
  if (!isAllowedCommercialMcpConsentOrigin(origin, issuer)) {
    throw new Error("Untrusted Commercial MCP consent origin");
  }
  headers.set("origin", new URL(issuer).origin);
  return headers;
}

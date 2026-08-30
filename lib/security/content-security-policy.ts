export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";
export const CSP_NONCE_REQUEST_HEADER = "x-nonce";

export function createCspNonce() {
  return crypto.randomUUID();
}

function normalizeFormActionOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.origin !== value) {
    throw new Error("Invalid CSP form-action origin");
  }
  return url.origin;
}

export function buildContentSecurityPolicy(
  nonce: string,
  options: { development?: boolean; formActionOrigins?: readonly string[]; upgradeInsecureRequests?: boolean } = {},
) {
  if (!nonce || /[<>&'";\s]/.test(nonce)) throw new Error("Invalid CSP nonce");
  const development = options.development ?? false;
  const upgradeInsecureRequests = options.upgradeInsecureRequests ?? !development;
  const formActionOrigins = (options.formActionOrigins ?? []).map(normalizeFormActionOrigin);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "media-src 'self' blob:",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self'${formActionOrigins.length ? ` ${formActionOrigins.join(" ")}` : ""}`,
    "frame-ancestors 'none'",
    ...(upgradeInsecureRequests ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

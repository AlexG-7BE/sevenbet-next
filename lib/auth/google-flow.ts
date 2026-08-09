export const GOOGLE_AUTH_CALLBACK = "/program?auth=google-return";
export const GOOGLE_AUTH_ERROR_CALLBACK = "/program?auth=google-error";

const GOOGLE_SIGN_IN_KEYS = new Set([
  "provider",
  "callbackURL",
  "errorCallbackURL",
  "requestSignUp",
]);

export function isAllowedGoogleSignInRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !GOOGLE_SIGN_IN_KEYS.has(key))) return false;
  return body.provider === "google"
    && body.callbackURL === GOOGLE_AUTH_CALLBACK
    && body.errorCallbackURL === GOOGLE_AUTH_ERROR_CALLBACK
    && typeof body.requestSignUp === "boolean";
}

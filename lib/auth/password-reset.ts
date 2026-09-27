import { DEFAULT_AUTH_RETURN_TO, safeAuthReturnTo } from "@/lib/auth/return-to";

export const PASSWORD_RESET_PATH = "/reset-password";

/** Better Auth 1.7.1 defaults (`minPasswordLength`, `maxPasswordLength`); lib/auth/config.ts keeps them. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Better Auth issues 24 alphanumeric characters; anything else cannot be a live token.
const RESET_TOKEN = /^[A-Za-z0-9_-]{8,256}$/;

// Better Auth accepts a relative redirect only when its query holds [\w\-.+/=&%@].
// encodeURIComponent leaves !'()*~ unescaped, so escape them too.
function strictQueryValue(value: string) {
  return encodeURIComponent(value).replace(/[!'()*~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function withReturnTo(pathname: string, returnTo: unknown) {
  const safe = safeAuthReturnTo(returnTo);
  return safe === DEFAULT_AUTH_RETURN_TO ? pathname : `${pathname}?returnTo=${strictQueryValue(safe)}`;
}

/**
 * The page a visitor uses to ask for a reset link, and the relative `redirectTo`
 * Better Auth sends them back to (it appends `token` or `error=INVALID_TOKEN`).
 * `returnTo` only carries the Programme language and the eventual destination.
 */
export function passwordResetPath(returnTo: unknown) {
  return withReturnTo(PASSWORD_RESET_PATH, returnTo);
}

export function loginPath(returnTo: unknown) {
  return withReturnTo("/login", returnTo);
}

export type PasswordResetView =
  | Readonly<{ kind: "request" }>
  | Readonly<{ kind: "reset"; token: string }>
  | Readonly<{ kind: "invalid" }>;

/** Better Auth lands here with `?token=…` for a live link or `?error=INVALID_TOKEN` otherwise. */
export function passwordResetView({ token, error }: { token: string | null; error: string | null }): PasswordResetView {
  if (error) return { kind: "invalid" };
  if (token === null) return { kind: "request" };
  return RESET_TOKEN.test(token) ? { kind: "reset", token } : { kind: "invalid" };
}

type AuthClientError = Readonly<{ code?: string | null; status?: number | null }> | null | undefined;

export type PasswordResetRequestFailure = "INVALID_EMAIL" | "RATE_LIMITED" | "FAILED";

/**
 * Better Auth answers a reset request the same way whether or not an account
 * exists, and it swallows delivery failures, so only request-level problems
 * (bad address, rate limit, outage) can reach the visitor.
 */
export function passwordResetRequestFailure(error: AuthClientError): PasswordResetRequestFailure | null {
  if (!error) return null;
  if (error.status === 429) return "RATE_LIMITED";
  if (error.status === 400 && error.code === "VALIDATION_ERROR") return "INVALID_EMAIL";
  return "FAILED";
}

export type PasswordResetFailure = "INVALID_LINK" | "TOO_SHORT" | "TOO_LONG" | "RATE_LIMITED" | "FAILED";

export function passwordResetFailure(error: AuthClientError): PasswordResetFailure | null {
  if (!error) return null;
  if (error.status === 429) return "RATE_LIMITED";
  if (error.code === "INVALID_TOKEN" || error.code === "USER_NOT_FOUND") return "INVALID_LINK";
  if (error.code === "PASSWORD_TOO_SHORT") return "TOO_SHORT";
  if (error.code === "PASSWORD_TOO_LONG") return "TOO_LONG";
  return "FAILED";
}

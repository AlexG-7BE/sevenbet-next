import { getSessionCookie } from "better-auth/cookies";

export function hasBetterAuthSessionCookie(requestHeaders: Headers) {
  return Boolean(getSessionCookie(requestHeaders));
}

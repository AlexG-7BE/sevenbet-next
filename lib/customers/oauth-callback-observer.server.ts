import "server-only";

import { getServerSession } from "@/lib/auth/session";
import { observeSuccessfulAuthentication } from "@/lib/customers/auth-observer.server";

/**
 * Same window the registry hooks use to tell a brand-new account from a returning
 * one (`customerAuthDatabaseHooks.session.create.after`): an OAuth callback that
 * creates the user creates its first session within the same request.
 */
export const RECENTLY_CREATED_ACCOUNT_WINDOW_MS = 60_000;

const OAUTH_CALLBACK_PATH = /\/callback\/google$/;
const SESSION_COOKIE_NAME = /(?:^|[.-])session_token$/;

/**
 * A successful Google callback redirects and sets a new Better Auth session
 * cookie; an error or account-link callback sets none. Returns that cookie as a
 * Cookie header so the new session can be resolved exactly as the browser will.
 */
export function oauthCallbackSessionCookie(request: Request, response: Response) {
  let pathname: string;
  try { pathname = new URL(request.url).pathname; } catch { return null; }
  if (!OAUTH_CALLBACK_PATH.test(pathname) || response.status < 300 || response.status >= 400) return null;
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";", 1)[0] ?? "";
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (SESSION_COOKIE_NAME.test(name) && value) return `${name}=${value}`;
  }
  return null;
}

export function authenticationKindForAccount(createdAt: Date, observedAt: Date) {
  return Math.abs(observedAt.getTime() - createdAt.getTime()) <= RECENTLY_CREATED_ACCOUNT_WINDOW_MS
    ? "signup" as const
    : "login" as const;
}

type CallbackSession = { user: { id: string; email: string; createdAt: Date | string } } | null;

/**
 * Google sign-ups and logins get the same observation as email ones: signup
 * country, first-touch campaign and, only under the analytics grant, the
 * `signup_completed` / `login_completed` event.
 */
export async function observeOAuthCallbackAuthentication({
  request,
  sessionCookie,
  now = new Date(),
  resolveSession = getServerSession,
  observe = observeSuccessfulAuthentication,
}: {
  request: Request;
  sessionCookie: string;
  now?: Date;
  resolveSession?: (headers: Headers) => Promise<CallbackSession>;
  observe?: typeof observeSuccessfulAuthentication;
}) {
  const session = await resolveSession(new Headers({ cookie: sessionCookie }));
  if (!session?.user) return { observed: false } as const;
  const createdAt = new Date(session.user.createdAt);
  if (!Number.isFinite(createdAt.getTime())) return { observed: false } as const;
  return observe({
    request,
    responseBody: { user: { id: session.user.id, email: session.user.email } },
    kind: authenticationKindForAccount(createdAt, now),
  });
}

import "server-only";

import { headers } from "next/headers";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
import { withAuthDatabaseAvailabilityCapture } from "@/lib/auth/database-availability";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import type { AuthSession } from "@/lib/auth/server";

export async function getServerSession(requestHeaders?: Headers) {
  const resolvedHeaders = requestHeaders ?? (await headers());
  if (!hasBetterAuthSessionCookie(resolvedHeaders)) return null;
  const { getAuth } = await import("@/lib/auth/server");
  const auth = await getAuth();
  return withAuthDatabaseAvailabilityCapture(() => auth.api.getSession({
    headers: resolvedHeaders,
  }));
}

export async function requireServerSession(requestHeaders?: Headers) {
  const session = await getServerSession(requestHeaders);

  if (!session) {
    throw new AuthenticationRequiredError();
  }

  return session;
}

export async function requireCurrentUser(requestHeaders?: Headers) {
  const session = await requireServerSession(requestHeaders);
  return session.user;
}

export type ServerSession = AuthSession;

export { AuthenticationRequiredError } from "@/lib/auth/errors";

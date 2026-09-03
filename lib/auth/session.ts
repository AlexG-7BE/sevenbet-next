import "server-only";

import { headers } from "next/headers";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
import { auth } from "@/lib/auth/server";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";

export async function getServerSession(requestHeaders?: Headers) {
  const resolvedHeaders = requestHeaders ?? (await headers());
  if (!hasBetterAuthSessionCookie(resolvedHeaders)) return null;
  return auth.api.getSession({
    headers: resolvedHeaders,
  });
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

export type ServerSession = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>;

export { AuthenticationRequiredError } from "@/lib/auth/errors";

import "server-only";

import { headers } from "next/headers";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
import { auth } from "@/lib/auth/server";

export async function getServerSession(requestHeaders?: Headers) {
  return auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
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

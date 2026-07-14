import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";

export async function getServerSession(requestHeaders?: Headers) {
  return auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });
}

export async function requireServerSession(requestHeaders?: Headers) {
  const session = await getServerSession(requestHeaders);

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export type ServerSession = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>;

import { createSevenBetAuth } from "@/lib/auth/config";

export type SevenBetAuth = ReturnType<typeof createSevenBetAuth>;

let authPromise: Promise<SevenBetAuth> | null = null;

function initialiseAuth() {
  const instance = createSevenBetAuth();
  return instance.$context.then(() => instance);
}

export function getAuth() {
  if (authPromise) return authPromise;
  const pending = initialiseAuth().catch((error) => {
    authPromise = null;
    throw error;
  });
  authPromise = pending;
  return pending;
}

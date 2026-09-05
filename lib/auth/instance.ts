import { createSevenBetAuth } from "@/lib/auth/config";

export type SevenBetAuth = ReturnType<typeof createSevenBetAuth>;

let authPromise: Promise<SevenBetAuth> | null = null;
let operationalMcpAuthPromise: Promise<SevenBetAuth> | null = null;

function initialiseAuth(operationalMcpProvider: boolean) {
  const instance = createSevenBetAuth({ operationalMcpProvider });
  return instance.$context.then(() => instance);
}

function cachedAuth(
  current: Promise<SevenBetAuth> | null,
  assign: (value: Promise<SevenBetAuth> | null) => void,
  operationalMcpProvider: boolean,
) {
  if (current) return current;
  const pending = initialiseAuth(operationalMcpProvider).catch((error) => {
    assign(null);
    throw error;
  });
  assign(pending);
  return pending;
}

export function getAuth() {
  return cachedAuth(authPromise, (value) => { authPromise = value; }, false);
}

export function getOperationalMcpAuth() {
  return cachedAuth(operationalMcpAuthPromise, (value) => { operationalMcpAuthPromise = value; }, true);
}

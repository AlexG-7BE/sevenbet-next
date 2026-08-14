import { headers } from "next/headers";

import { CSP_NONCE_REQUEST_HEADER } from "@/lib/security/content-security-policy";

export async function NonceStyle({ children }: { children: string }) {
  const nonce = (await headers()).get(CSP_NONCE_REQUEST_HEADER) || undefined;
  return <style nonce={nonce}>{children}</style>;
}

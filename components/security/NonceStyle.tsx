import { headers } from "next/headers";

import { CSP_NONCE_REQUEST_HEADER } from "@/lib/security/content-security-policy";
import { DocumentNonceStyle } from "./DocumentNonceStyle";

/** An inline stylesheet the Content-Security-Policy accepts, on a document load and on a client transition. */
export async function NonceStyle({ children }: { children: string }) {
  const nonce = (await headers()).get(CSP_NONCE_REQUEST_HEADER) || undefined;
  return <DocumentNonceStyle css={children} nonce={nonce} />;
}

import { headers } from "next/headers";

import { CSP_NONCE_REQUEST_HEADER } from "@/lib/security/content-security-policy";

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get(CSP_NONCE_REQUEST_HEADER) || undefined;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      nonce={nonce}
      type="application/ld+json"
    />
  );
}

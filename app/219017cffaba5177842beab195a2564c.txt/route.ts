import { INDEXNOW_KEY } from "@/lib/seo/indexnow";
import { hostVaryingCacheControl } from "@/lib/site/host-cache";

// IndexNow key file: the folder name is the key (tests/crawler-ready-metadata.test.ts checks they match).
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // RFC-057 §7.4 and §12: each host serves only its own key, so this file must never be
      // served to the help host from a cache entry the two share. The help host answers 404
      // for this path (lib/site/host-routes.ts) and gets its own key file at its own path.
      "cache-control": hostVaryingCacheControl("public, max-age=86400"),
    },
  });
}

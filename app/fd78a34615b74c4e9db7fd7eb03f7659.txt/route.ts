import { HELP_INDEXNOW_KEY } from "@/lib/seo/indexnow";
import { hostVaryingCacheControl } from "@/lib/site/host-cache";

// The help site's IndexNow key file: the folder name is the key
// (tests/crawler-ready-metadata.test.ts checks they match).
export function GET() {
  return new Response(HELP_INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // RFC-057 §7.4 and §12: each host serves only its own key, so neither key file may be
      // served from a cache entry the two hosts share. This path is HELP, so the main host
      // answers 404 for it (lib/site/host-routes.ts), as the help host does for the other.
      "cache-control": hostVaryingCacheControl("public, max-age=86400"),
    },
  });
}

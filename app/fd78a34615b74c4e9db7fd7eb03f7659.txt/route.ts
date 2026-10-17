import { HELP_INDEXNOW_KEY } from "@/lib/seo/indexnow";
import { hostVaryingCacheControl } from "@/lib/site/host-cache";
import { resolveServerSite } from "@/lib/site/server-site";

// Metadata-shaped, but a route handler: it must read the site per request.
export const dynamic = "force-dynamic";

/**
 * The help site's IndexNow key file: the folder name is the key
 * (tests/crawler-ready-metadata.test.ts checks they match).
 *
 * RFC-057 §12: each host serves only its own key, because a key file answered by two domains
 * is a public marker anyone can use to join them — which is the one thing the second domain
 * exists to avoid. The route class (`HELP`) is what makes the **help** host serve it; this
 * check is what makes the **main** host refuse it, in every phase. A `HELP` route is served on
 * `b4gamble.com` until phase 3 and then answers a 301 to the help origin, and either of those
 * would be the marker. This path is therefore also kept out of the phase-3 301 list.
 */
export async function GET() {
  if (await resolveServerSite() !== "help") {
    return new Response(null, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  return new Response(HELP_INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Never from a cache entry the two hosts could share (§7.4).
      "cache-control": hostVaryingCacheControl("public, max-age=86400"),
    },
  });
}

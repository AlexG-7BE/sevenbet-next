import { YANDEX_VERIFICATION_HTML } from "@/lib/seo/yandex-webmaster";
import { hostVaryingCacheControl } from "@/lib/site/host-cache";

// Yandex Webmaster verification file: the folder name carries the code (tests/crawler-ready-metadata.test.ts checks they match).
export function GET() {
  return new Response(YANDEX_VERIFICATION_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Main host only (lib/site/host-routes.ts): never from a cache entry the help host shares.
      "cache-control": hostVaryingCacheControl("public, max-age=86400"),
    },
  });
}

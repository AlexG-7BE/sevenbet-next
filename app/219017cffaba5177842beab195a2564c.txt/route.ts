import { INDEXNOW_KEY } from "@/lib/seo/indexnow";

// IndexNow key file: the folder name is the key (tests/crawler-ready-metadata.test.ts checks they match).
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}

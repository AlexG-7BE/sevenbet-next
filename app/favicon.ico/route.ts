import { MAIN_FAVICON_ICO_BASE64 } from "@/app/_brand/favicon-ico";
import { resolveServerSite } from "@/lib/site/server-site";

/**
 * RFC-057 §12 and Q2. `app/favicon.ico` was a file, and a file makes Next write
 * `<link rel="icon" href="/favicon.ico">` into every document on both hosts. The help host
 * cannot have that link: the bytes are the B4GAMBLE mark, and the phase-2 Firewall rule denies
 * every `.ico` path there, so the help site would ask the browser for an icon the edge refuses.
 *
 * As a handler the address and the bytes on `b4gamble.com` are exactly what they were, the root
 * metadata names it on that host only, and the help host answers 404 here — the same answer the
 * route manifest gives for anything it does not serve, and what the Firewall rule would enforce
 * in Production anyway. The help site's own tab icon is `/icon.svg`, which is served on both
 * hosts with its own mark per host.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (await resolveServerSite() === "help") {
    return new Response(null, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  return new Response(Buffer.from(MAIN_FAVICON_ICO_BASE64, "base64"), {
    headers: {
      "content-type": "image/x-icon",
      "cache-control": "public, max-age=86400",
    },
  });
}

import { helpSiteSwitchesFromProcessEnv } from "@/lib/site/host-gate";
import { hostVaryingCacheControl } from "@/lib/site/host-cache";
import { resolveServerSite } from "@/lib/site/server-site";

/**
 * RFC-057 §12: "the help site's own icon, under the name Pause Plan; the current `icon.svg` is
 * the B4GAMBLE mark, so on the help host it is replaced, not shared."
 *
 * This was `app/icon.svg`, a file convention. A file makes Next write one `<link rel="icon">`
 * into every document on both hosts, and the file's own bytes are the B4GAMBLE mark — the one
 * thing the Founder took off this site (Q2, 17 October 2026). As a route handler the address
 * stays exactly what it was on `b4gamble.com`, the bytes are unchanged there, and the help host
 * gets a mark of its own at the same address. `.svg` is not one of the file endings the
 * middleware matcher skips, so the help gate sees this path and the manifest decides it
 * (`SHARED`); the phase-2 Firewall rule does not deny it either, so the help site has a tab
 * icon without widening that rule by a single path.
 *
 * The root metadata is what names the icon in the document (`app/layout.tsx`).
 */
export const dynamic = "force-dynamic";

/** Unchanged, byte for byte: `app/icon.svg` as it stood on 17 October 2026. */
const MAIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#ccff00"/>
  <path fill="#100f0f" d="M12 12h21c10 0 16 4 16 12 0 5-3 8-7 10 6 1 10 5 10 11 0 9-7 13-18 13H12V12Zm12 10v8h8c3 0 5-1 5-4s-2-4-5-4h-8Zm0 17v9h9c4 0 6-1 6-4s-2-5-6-5h-9Z"/>
  <path fill="#0b6f6f" d="M47 10h7v17h-7z"/>
</svg>
`;

/**
 * The help site's own mark: a pause, in the help palette, with nothing of the other brand in
 * it. No wordmark, because a 16-pixel tab is not a place for two words.
 */
const HELP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0b6f6f"/>
  <rect x="19" y="16" width="9" height="32" rx="3" fill="#fafaf7"/>
  <rect x="36" y="16" width="9" height="32" rx="3" fill="#fafaf7"/>
</svg>
`;

export async function GET() {
  const site = await resolveServerSite();
  return new Response(site === "help" ? HELP_ICON : MAIN_ICON, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // §7.4: the body differs by host, so the two hosts may not share one cache entry.
      "cache-control": hostVaryingCacheControl("public, max-age=86400", helpSiteSwitchesFromProcessEnv().serving),
    },
  });
}

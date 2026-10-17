import { helpSiteSwitchesFromProcessEnv } from "@/lib/site/host-gate";

/**
 * RFC-057 §7.4. Two routes send a shared `public` cache header although their body differs by
 * host once the help site is served: `app/llms.txt/route.ts` and the IndexNow key file.
 * `export const dynamic = "force-dynamic"` governs Next's render, not the CDN header, and
 * whether Vercel's CDN cache key includes the host is UNKNOWN, so any response whose body
 * differs by host must not be sent with a cache entry two hosts could share.
 *
 * While `HELP_SITE_SERVING` is off there is only one host — the help host is redirected away
 * before it reaches a handler — so the shared value stays exactly as it is today. The moment
 * the help host is served, the same response becomes private.
 *
 * **The price, written down rather than discovered later:** this keys off the switch, not off
 * the request's own site, so turning `HELP_SITE_SERVING` on makes these responses private on
 * `b4gamble.com` too. `llms.txt` runs a per-market sitemap snapshot and a 100-article query on
 * every hit, and AI crawlers hit it often. Keying off the request's site instead would be
 * cheaper and wrong while §7.4's UNKNOWN stands: if Vercel's CDN cache key does not include the
 * host, a `public` entry stored for one host can be served to the other, which is the exact
 * failure this exists to prevent. The phase-2 Production checks settle the UNKNOWN; if the host
 * is part of the key, this becomes a per-site decision and the main host keeps its cache.
 */
export function hostVaryingCacheControl(
  sharedValue: string,
  serving: boolean = helpSiteSwitchesFromProcessEnv().serving,
) {
  return serving ? "private, no-store" : sharedValue;
}

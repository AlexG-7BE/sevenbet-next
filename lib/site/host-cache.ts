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
 */
export function hostVaryingCacheControl(
  sharedValue: string,
  serving: boolean = helpSiteSwitchesFromProcessEnv().serving,
) {
  return serving ? "private, no-store" : sharedValue;
}

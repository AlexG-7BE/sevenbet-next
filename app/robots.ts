import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { helpSiteSwitchesFromProcessEnv, type SiteClass } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

// RFC-057 §7.4: robots has no dynamic API of its own, so Next would render one body at build
// and serve it on both hosts, pointing the help host at the main sitemap. It reads the site
// per request instead. With HELP_SITE_SERVING off every request is `main` and the body is
// byte-for-byte what it is today. The response's `Cache-Control` is set in middleware,
// because a metadata route cannot send one of its own (§7.4).
export const dynamic = "force-dynamic";

/**
 * Partner click redirects (`/r/`, `/go/`) and the outbound hand-off (`/outbound/`) are not
 * pages: a crawl only logs a false click. `/api/` stays open because Google's renderer may
 * need it. A crawler named in its own group ignores `*`, so the AI group repeats the rules.
 * The non-standard `Host:` line is gone (Google and Bing ignore it; canonical tags carry the host).
 */
export const CLICK_REDIRECT_DISALLOW = ["/r/", "/go/", "/outbound/"];

export const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
];

export function robotsForSite(site: SiteClass, helpIndexable: boolean): MetadataRoute.Robots {
  // Phase 2 is "help host live, not indexed, not linked" (§18). Until HELP_SITE_REDIRECTS is
  // on, every page the help host serves is also served by the main host, so the help host asks
  // every crawler to stay out and names no sitemap at all. `X-Robots-Tag: noindex` says the
  // same thing to a crawler that has already fetched a page; this says it before the fetch,
  // and it is what keeps a file on the help domain from listing b4gamble.com addresses to
  // anyone who looks — a crawler, a blocker's classifier or a journalist. The two switches
  // flip in one deployment, and from that deployment the help host is an ordinary allowed
  // site with its own sitemap.
  if (site === "help" && !helpIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: CLICK_REDIRECT_DISALLOW,
      },
      {
        userAgent: AI_CRAWLER_USER_AGENTS,
        allow: "/",
        disallow: CLICK_REDIRECT_DISALLOW,
      },
    ],
    // Each host names its own sitemap, never the other's. The help host serves no `/r/` or
    // `/go/` route at all, so the click-redirect rules are harmless there.
    sitemap: absoluteUrl("/sitemap.xml", site),
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsForSite(await resolveServerSite(), helpSiteSwitchesFromProcessEnv().redirects);
}

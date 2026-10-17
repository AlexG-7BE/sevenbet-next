import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { HELP_CANONICAL_ORIGIN, type SiteClass } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

// RFC-057 §7.4: robots has no dynamic API of its own, so Next would render one body at build
// and serve it on both hosts, pointing the help host at the main sitemap. It reads the site
// per request instead. With HELP_SITE_SERVING off every request is `main` and the body is
// byte-for-byte what it is today.
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

export function robotsForSite(site: SiteClass): MetadataRoute.Robots {
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
    sitemap: site === "help" ? `${HELP_CANONICAL_ORIGIN}/sitemap.xml` : absoluteUrl("/sitemap.xml"),
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsForSite(await resolveServerSite());
}

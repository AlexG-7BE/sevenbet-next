import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

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

export default function robots(): MetadataRoute.Robots {
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
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

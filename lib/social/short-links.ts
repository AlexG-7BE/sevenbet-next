import { NextResponse, type NextRequest } from "next/server";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { DEFAULT_MARKET_PROFILE, publicMarketPath } from "@/lib/market/registry";
import { isCrawlerUserAgent } from "@/lib/seo/crawler";

/**
 * Short branded links for social profiles and posts (Founder, 2 Oct 2026): `b4gamble.com/ig` instead
 * of a long UTM URL. Each answers a temporary (307) redirect to the homepage carrying the UTM tags
 * first-party analytics already reads, so per-network and per-post attribution keeps working.
 *
 * They are route handlers rather than `next.config.mjs` redirects (Founder, 3 Oct 2026) so that every
 * hit writes one `social_hit` line to the function log. A click from a social network is then
 * countable with `vercel logs --query social_hit` (scripts/local/social-hits.sh), including visitors
 * who never answer the cookie choice and so never reach first-party analytics. The line carries the
 * link, the Vercel country header and a crawler flag: no IP, no cookie, no user agent, no click id.
 *
 * Link previews are always English (Founder, 4 Oct 2026). People land on the unprefixed homepage,
 * which the middleware sends to the visitor's language. A link-preview crawler (Facebook, X,
 * Threads, Slack, WhatsApp…) fetches from wherever its servers sit, so under a British Reel the
 * Facebook card showed the Danish home (3 Oct). Crawlers, the same `bot=1` user agents the log
 * line flags, are sent to the English home instead: its title, description, image and `og:url`
 * are the English home's own metadata, so the card is English whichever country fetched it.
 */

type SocialSource = "instagram" | "facebook" | "x" | "threads" | "lana";
type SocialCampaign = "bio" | "post" | "story" | "text";

export type SocialShortLink = Readonly<{
  source: SocialSource;
  campaign: SocialCampaign;
  /** Becomes `utm_content`: the post code, or `link_in_bio` for the Instagram profile link. */
  content: string | null;
}>;

/** Profile (bio) links, one per account. */
export const SOCIAL_PROFILE_LINKS = {
  "/ig": { source: "instagram", campaign: "bio", content: "link_in_bio" },
  "/fb": { source: "facebook", campaign: "bio", content: null },
  "/x": { source: "x", campaign: "bio", content: null },
  "/threads": { source: "threads", campaign: "bio", content: null },
  "/lana": { source: "lana", campaign: "bio", content: null },
} as const satisfies Record<string, SocialShortLink>;

export type SocialProfilePath = keyof typeof SOCIAL_PROFILE_LINKS;

/**
 * Per-post links `/<prefix>/<code>`. Instagram captions carry no clickable link, so `/ig/<code>` is
 * the link sticker of a Story. Facebook's is the first comment under a Reel.
 */
export const SOCIAL_POST_LINKS = {
  x: { source: "x", campaign: "post" },
  t: { source: "threads", campaign: "post" },
  fb: { source: "facebook", campaign: "post" },
  ig: { source: "instagram", campaign: "story" },
} as const satisfies Record<string, Omit<SocialShortLink, "content">>;

export type SocialPostPrefix = keyof typeof SOCIAL_POST_LINKS;

/** A lower-case post code, one path segment: the video code (`n11`, `b4r1a`) or `txt-<slug>`. */
const POST_CODE = /^[a-z0-9-]{2,24}$/;
/** The SMM agents' own text posts: `/x/txt-poll1` is campaign `text`, content `poll1`. */
const TEXT_POST_PREFIX = "txt-";

export function socialPostLink(prefix: SocialPostPrefix, code: string): SocialShortLink | null {
  if (!POST_CODE.test(code)) return null;
  const { source, campaign } = SOCIAL_POST_LINKS[prefix];
  if (!code.startsWith(TEXT_POST_PREFIX)) return { source, campaign, content: code };
  const slug = code.slice(TEXT_POST_PREFIX.length);
  return slug ? { source, campaign: "text", content: slug } : null;
}

/** The English home (`/en`), whose metadata every link-preview card shows. */
export const SOCIAL_PREVIEW_HOME_PATH = publicMarketPath(DEFAULT_MARKET_PROFILE, "en-GB", "/");

/**
 * The homepage URL with the link's UTM tags, in the order the 2 Oct redirects used: the
 * unprefixed homepage for people, the English home for link-preview crawlers.
 */
export function socialShortLinkDestination(link: SocialShortLink, { crawler = false }: { crawler?: boolean } = {}) {
  const query = new URLSearchParams({ utm_source: link.source, utm_medium: "social", utm_campaign: link.campaign });
  if (link.content) query.set("utm_content", link.content);
  return `${crawler ? SOCIAL_PREVIEW_HOME_PATH : "/"}?${query}`;
}

/** The one log line a hit writes. `country` is the trusted Vercel country or null. */
export function socialHitLogLine(link: SocialShortLink, { country, crawler }: { country: string | null; crawler: boolean }) {
  return `social_hit src=${link.source} campaign=${link.campaign} content=${link.content ?? "-"} country=${country ?? "-"} bot=${crawler ? 1 : 0}`;
}

export function socialShortLinkResponse(
  request: NextRequest,
  link: SocialShortLink | null,
  environment: Parameters<typeof requestCountrySignalFromHeaders>[2] = process.env,
) {
  if (!link) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const crawler = isCrawlerUserAgent(request.headers.get("user-agent"));
  console.info(socialHitLogLine(link, {
    country: requestCountrySignalFromHeaders(request.headers, new Date(), environment)?.countryCode ?? null,
    crawler,
  }));

  // Like the framework redirect it replaces: the link's UTM tags win, any other query (fbclid) passes on.
  const destination = new URL(socialShortLinkDestination(link, { crawler }), "https://b4gamble.com");
  for (const [name, value] of request.nextUrl.searchParams) {
    if (!destination.searchParams.has(name)) destination.searchParams.append(name, value);
  }
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: `${destination.pathname}${destination.search}`,
      // Never served from the CDN: a cached redirect would skip the function and its log line.
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

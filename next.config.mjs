const PROGRAMME_MICROPHONE_ROUTES = [
  "/program",
  "/de/program",
  "/es/program",
  "/el/program",
  "/sv/program",
  "/da/program",
  "/it/program",
  "/pt/program",
  "/nl/program",
  "/fi/program",
  "/nb/program",
];

/**
 * Short branded links for social profiles and posts (Founder, 2 Oct 2026): `b4gamble.com/ig` instead
 * of a long UTM URL. Each is a temporary redirect to the homepage carrying the UTM tags that
 * first-party analytics already reads, so per-network and per-post attribution keeps working.
 * Post links take a short lower-case code (`/x/n11`) that lands in `utm_content`.
 */
const SOCIAL_SHORT_LINKS = [
  { source: "/ig", destination: "/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=link_in_bio" },
  { source: "/fb", destination: "/?utm_source=facebook&utm_medium=social&utm_campaign=bio" },
  { source: "/x", destination: "/?utm_source=x&utm_medium=social&utm_campaign=bio" },
  { source: "/threads", destination: "/?utm_source=threads&utm_medium=social&utm_campaign=bio" },
  { source: "/lana", destination: "/?utm_source=lana&utm_medium=social&utm_campaign=bio" },
  { source: "/x/:post([a-z0-9-]{2,24})", destination: "/?utm_source=x&utm_medium=social&utm_campaign=post&utm_content=:post" },
  { source: "/t/:post([a-z0-9-]{2,24})", destination: "/?utm_source=threads&utm_medium=social&utm_campaign=post&utm_content=:post" },
];

const deniedBrowserCapabilities ="camera=(), microphone=(), geolocation=(), payment=(), usb=()";
const programmeBrowserCapabilities = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";

/**
 * User agents that get page metadata (title, canonical, hreflang, description) in `<head>`
 * rather than streamed into `<body>` after it. Next 15 streams metadata for every agent outside
 * its own short list, which left Googlebot, GPTBot, ClaudeBot and PerplexityBot reading the
 * title and canonical inside a hidden div (audit, 27 Sep 2026).
 *
 * 1. Next's default list, verbatim (tests/crawler-ready-metadata.test.ts pins it to Next's own).
 * 2. The search, AI and link-preview crawlers of lib/seo/crawler.ts (Googlebot and Bingbot included).
 * 3. AI agents and plain HTTP libraries that fetch pages for a model without running JavaScript.
 */
const NEXT_DEFAULT_HTML_LIMITED_BOTS = String.raw`[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight`;
const SEARCH_AND_AI_CRAWLERS = String.raw`Googlebot|bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|embedly|quora link preview|vkshare|skypeuripreview|ia_archiver|perplexity|chatgpt|claude-|anthropic|bytespider|google-extended|google-inspectiontool|googleother|notebooklm|bingpreview|mistralai|meta-external|duckassist|cohere-ai`;
const AGENT_HTTP_CLIENTS = String.raw`ModelContextProtocol|python-requests|python-urllib|python-httpx|aiohttp|curl\/|wget|go-http-client|axios|node-fetch|undici|^node$|okhttp|java\/|libwww-perl|httpie|scrapy`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  htmlLimitedBots: new RegExp([NEXT_DEFAULT_HTML_LIMITED_BOTS, SEARCH_AND_AI_CRAWLERS, AGENT_HTTP_CLIENTS].join("|"), "i"),
  // Middleware owns canonical trailing-slash normalization for language,
  // protected and internal routes.
  skipTrailingSlashRedirect: true,
  async redirects() {
    // Temporary (307) so a link can be re-pointed later without browsers caching the old target.
    return SOCIAL_SHORT_LINKS.map((link) => ({ ...link, permanent: false }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: deniedBrowserCapabilities },
        ],
      },
      ...PROGRAMME_MICROPHONE_ROUTES.map((source) => ({
        // The default stays deny-all. Only the Programme recorder may ask the
        // browser for same-origin microphone permission; the user still owns
        // browser prompt. Keep this as an explicit canonical route list rather
        // than granting microphone authority to a broad localized wildcard.
        source,
        headers: [
          { key: "Permissions-Policy", value: programmeBrowserCapabilities },
        ],
      })),
    ];
  },
};

export default nextConfig;

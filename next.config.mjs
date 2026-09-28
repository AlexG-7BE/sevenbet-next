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

const deniedBrowserCapabilities = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
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

/**
 * Search, AI and link-preview crawlers that may read a page without running JavaScript.
 * Founder decision 25 Sep 2026: people get the instant route frame, while these user agents
 * get the complete page in the first response, as before, so no crawler ever reads a frame.
 * The frame decision itself lives in lib/seo/route-frame.ts: only a real browser that is not
 * one of these gets the frame. next.config.mjs mirrors this list in `htmlLimitedBots`.
 */
const CRAWLER_USER_AGENT = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|embedly|quora link preview|vkshare|skypeuripreview|ia_archiver|perplexity|chatgpt|claude-|anthropic|bytespider|google-extended|google-inspectiontool|googleother|notebooklm|bingpreview|mistralai|meta-external|duckassist|cohere-ai/i;

/** The pattern source, for the mirror check against next.config.mjs `htmlLimitedBots`. */
export const CRAWLER_USER_AGENT_PATTERN = CRAWLER_USER_AGENT.source;

export function isCrawlerUserAgent(userAgent: string | null | undefined) {
  return Boolean(userAgent && CRAWLER_USER_AGENT.test(userAgent));
}

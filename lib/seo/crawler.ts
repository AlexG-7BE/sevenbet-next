/**
 * Search, AI and link-preview crawlers that may read a page without running JavaScript.
 * Founder decision 25 Sep 2026: people get the instant route frame, while these user agents
 * get the complete page in the first response, as before, so no crawler ever reads a frame.
 */
const CRAWLER_USER_AGENT = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|embedly|quora link preview|vkshare|skypeuripreview|ia_archiver|perplexity|chatgpt|claude-|anthropic|bytespider|google-extended|google-inspectiontool|bingpreview/i;

export function isCrawlerUserAgent(userAgent: string | null | undefined) {
  return Boolean(userAgent && CRAWLER_USER_AGENT.test(userAgent));
}

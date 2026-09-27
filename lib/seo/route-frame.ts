import { isCrawlerUserAgent } from "./crawler";

type RequestHeaders = Pick<Headers, "get">;

/**
 * Every current browser (Chrome, Edge, Firefox, Safari 16.4+) sends Fetch Metadata
 * (`Sec-Fetch-Mode`, `Sec-Fetch-Dest`) on every navigation and every fetch, including the
 * RSC requests of a client-side navigation. HTTP libraries and most AI fetchers
 * (python-requests, curl, node fetch, Go, axios, MCP fetch) send neither.
 */
export function isBrowserRequest(requestHeaders: RequestHeaders) {
  return Boolean(requestHeaders.get("sec-fetch-mode") || requestHeaders.get("sec-fetch-dest"));
}

/**
 * Whether a route may stream its instant loading frame and send the real content later in
 * the same response (Founder decision 25 Sep 2026: people get the frame at once).
 *
 * Only a real browser that is not a crawler gets the frame. Everything else (search and AI
 * crawlers, link previews, agents, HTTP libraries, older browsers without Fetch Metadata)
 * gets the complete page in the first bytes, so no reader without JavaScript meets a frame
 * with its content hidden after the footer (audit 27 Sep 2026).
 */
export function shouldStreamRouteFrame(requestHeaders: RequestHeaders) {
  return isBrowserRequest(requestHeaders) && !isCrawlerUserAgent(requestHeaders.get("user-agent"));
}

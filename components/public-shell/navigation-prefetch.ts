/**
 * Instant navigation (Founder decision, 4 Oct 2026): a page change must take 0.1–0.3 s. With the
 * server in the United States, only a page already in the browser before the click can open that
 * fast, so the public shell fetches destinations ahead of the click. This supersedes the Navigation
 * Performance Stage 2 rule that primary navigation is never prefetched.
 */

/** Primary destinations (header and drawer) load in the background once the current page settles. */
export const PRIMARY_PREFETCH_SELECTOR = "a[data-navigation-href]";

/** Other links load when the visitor shows intent: a mouse resting on them, a touch, focus. */
export const INTENT_PREFETCH_SELECTOR = [
  "a[data-navigation-href]",
  "a[data-footer-navigation-href]",
  "a[data-learn-offer-bridge-link]",
  "a[data-learn-category]",
  "a[data-intent-prefetch]",
].join(", ");

// A prefetch is a GET of the destination: a tracked outbound redirect, short link or API would
// count it as a visit or a click, with or without a language prefix.
const NEVER_PREFETCH_PATH = /^\/(?:[a-z]{2}\/)?(?:r|go|t|x|ig|fb|threads|lana|api|admin|outbound|unsubscribe|partner-preview|partner-creatives|editorial-preview)(?:\/|$)/;

/** The path to fetch ahead of a click, or null when the link stays here, leaves the site or must never be prefetched. */
export function prefetchTarget(href: string, current: string) {
  try {
    const here = new URL(current);
    const destination = new URL(href, here);
    if (destination.origin !== here.origin || NEVER_PREFETCH_PATH.test(destination.pathname)) return null;
    if (destination.pathname === here.pathname && destination.search === here.search) return null;
    return `${destination.pathname}${destination.search}`;
  } catch {
    return null;
  }
}

/**
 * The current page comes first: nothing is prefetched while it is still loading, streaming its
 * frame or waiting on the commercial navigation, because a prefetch would compete with it for the
 * same connection and database.
 */
export function currentPageSettled(document: Document) {
  return document.readyState === "complete"
    && !document.querySelector("[data-route-loading], [data-commercial-navigation-pending], [data-commercial-navigation-timed-out]");
}

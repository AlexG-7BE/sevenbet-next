import { marketAccess } from "./access";
import { CASINO_MARKETS } from "./register";

/** The markets opened on Monday 28 September 2026. */
export const LAUNCH_MARKETS = ["GB", "SE", "DK", "DE"] as const;

/** Superfly's routes were registered as `<casino>-welcome`; every other route is `<casino>-casino`. */
const WELCOME_ROUTES = new Set(["21-prive", "diamond7", "gday-casino", "hello-casino", "skol-casino", "slotnite"]);

export function publicRouteSlug(casinoSlug: string) {
  return `${casinoSlug}-${WELCOME_ROUTES.has(casinoSlug) ? "welcome" : "casino"}`;
}

export type ClickOutcome = Readonly<{ statusCode: number; location: string | null }>;

export type ClickVerdict =
  /** Open by licence and the click reached the partner. */
  | "PASS"
  /** Closed by licence and the click was refused. */
  | "PASS_CLOSED"
  /** Closed by licence but the click reached the partner: must never happen. */
  | "VIOLATION"
  /** Open by licence but the click was refused: a missing or broken route, i.e. lost revenue. */
  | "NO_ROUTE"
  /** Anything else (5xx, a redirect back to B4GAMBLE other than the unavailable page). */
  | "UNEXPECTED";

const siteHosts = new Set(["b4gamble.com", "www.b4gamble.com"]);

/** Classifies one real click on `/r/{slug}` against the licence register at the moment it was made. */
export function clickVerdict(casinoSlug: string, market: string, at: Date, outcome: ClickOutcome): ClickVerdict {
  const open = marketAccess(casinoSlug, market, at).open;
  const location = outcome.location ? new URL(outcome.location, "https://b4gamble.com") : null;
  const partner = outcome.statusCode === 302 && location && !siteHosts.has(location.hostname);
  const refused = outcome.statusCode === 303 && location && siteHosts.has(location.hostname)
    && location.pathname.startsWith("/outbound/unavailable");
  if (partner) return open ? "PASS" : "VIOLATION";
  if (refused) return open ? "NO_ROUTE" : "PASS_CLOSED";
  return "UNEXPECTED";
}

export function launchCasinos() {
  return Object.keys(CASINO_MARKETS).sort();
}

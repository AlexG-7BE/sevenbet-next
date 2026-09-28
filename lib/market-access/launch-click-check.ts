import { PARTNER_ROUTE_PLACEHOLDER_HOST } from "@/lib/affiliate-routing/redirect-validation";

import { marketAccess } from "./access";
import { CASINO_MARKETS } from "./register";

/** The markets opened on Monday 28 September 2026, and Ireland (open grey zone, opened 27 September). */
export const LAUNCH_MARKETS = ["GB", "SE", "DK", "DE", "IE"] as const;

export type LaunchMarket = (typeof LAUNCH_MARKETS)[number];

/**
 * Casinos the register opens in a launch market that have no partner route
 * there yet: known gaps, not outages. Every other licence-open casino in a
 * launch market must reach its partner, so a refused click there is
 * `ROUTE_DOWN` and fails the check. Remove a casino when its route goes live.
 */
export const ROUTES_NOT_YET_LIVE: Readonly<Record<LaunchMarket, readonly string[]>> = Object.freeze({
  // DragonBet has sent no GB tracking link yet.
  GB: ["dragonbet"],
  // Licensed in Sweden, but no Swedish route is registered.
  SE: ["betsafe", "playuzu", "regencycasino"],
  DK: [],
  DE: [],
  // Ireland opened the six Superfly routes and eleven EGO brands only
  // (docs/07_Decisions/IRELAND-EGO-ROUTES-2026-09-27.md); GoldenPlay's
  // placeholder route is disabled on purpose.
  IE: [
    "betsafe", "betsson", "dragonbet", "goldenplay", "inkabet", "nordicbet",
    "playuzu", "regencycasino", "rizk", "starcasino", "supercasino",
  ],
});

function launchMarket(market: string): LaunchMarket | null {
  const key = market.trim().toUpperCase();
  return (LAUNCH_MARKETS as readonly string[]).includes(key) ? key as LaunchMarket : null;
}

/**
 * Whether a click on the casino's route from a launch market must reach the
 * partner at that moment: open by licence (Germany only inside its
 * advertising window) and not a known gap. Outside the launch markets
 * nothing is pinned.
 */
export function expectsPartnerRoute(casinoSlug: string, market: string, at: Date) {
  const pinned = launchMarket(market);
  return Boolean(pinned)
    && marketAccess(casinoSlug, market, at).open
    && !ROUTES_NOT_YET_LIVE[pinned!].includes(casinoSlug);
}

/** The casinos whose click from `market` must reach a partner at `at`. */
export function expectedPartnerRoutes(market: string, at: Date) {
  return launchCasinos().filter((casino) => expectsPartnerRoute(casino, market, at));
}

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
  /** Open by licence but the click was refused, on a route listed in ROUTES_NOT_YET_LIVE (or outside the launch markets). */
  | "NO_ROUTE"
  /** Open by licence, expected to reach the partner, and refused: a lost route, i.e. lost revenue. Fails the check. */
  | "ROUTE_DOWN"
  /** Anything else (5xx, a redirect back to B4GAMBLE other than the unavailable page, a placeholder link). */
  | "UNEXPECTED";

const siteHosts = new Set(["b4gamble.com", "www.b4gamble.com"]);

/** Classifies one real click on `/r/{slug}` against the licence register at the moment it was made. */
export function clickVerdict(casinoSlug: string, market: string, at: Date, outcome: ClickOutcome): ClickVerdict {
  const open = marketAccess(casinoSlug, market, at).open;
  const location = outcome.location ? new URL(outcome.location, "https://b4gamble.com") : null;
  const partner = outcome.statusCode === 302 && location && !siteHosts.has(location.hostname)
    && location.hostname !== PARTNER_ROUTE_PLACEHOLDER_HOST;
  const refused = outcome.statusCode === 303 && location && siteHosts.has(location.hostname)
    && location.pathname.startsWith("/outbound/unavailable");
  if (partner) return open ? "PASS" : "VIOLATION";
  if (refused) {
    if (!open) return "PASS_CLOSED";
    return expectsPartnerRoute(casinoSlug, market, at) ? "ROUTE_DOWN" : "NO_ROUTE";
  }
  return "UNEXPECTED";
}

/** A refusal in an open market may be a probe Vercel places in another country, and a probe may fail outright, so both are retried. */
export function retriesClick(verdict: ClickVerdict) {
  // UNEXPECTED includes a probe that never answered (NETWORK_ERROR): on 27 Sep one such Globalping
  // failure on a closed market opened a false alert (#420). A real fault repeats on fresh probes.
  return verdict === "NO_ROUTE" || verdict === "ROUTE_DOWN" || verdict === "UNEXPECTED";
}

/** Verdicts that fail the run and open the alert issue. */
export const FAILING_VERDICTS: ReadonlySet<ClickVerdict> = new Set(["VIOLATION", "UNEXPECTED", "ROUTE_DOWN"]);

export function clickCheckFails(verdicts: Iterable<ClickVerdict>) {
  for (const verdict of verdicts) if (FAILING_VERDICTS.has(verdict)) return true;
  return false;
}

export function launchCasinos() {
  return Object.keys(CASINO_MARKETS).sort();
}

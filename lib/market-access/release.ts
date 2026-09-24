import { createHash } from "node:crypto";

import { marketAccess, type MarketClosure } from "./access";

/**
 * MARKET-ACCESS-RELEASE-01: bring persisted MarketActivation rows in line
 * with the licence register (RFC-054). Disables every active row in a market
 * the register closes, and registers the licensed markets that have a
 * partner link but no route. Founder-run only, after explicit confirmation.
 */
export const MARKET_ACCESS_RELEASE = "MARKET-ACCESS-RELEASE-01";
export const MARKET_ACCESS_DECISION_REF = "FOUNDER-MARKET-ACCESS-2026-09-24";

export type PersistedActivation = Readonly<{
  id: string;
  casinoId: string;
  casinoSlug: string;
  marketCode: string;
  desiredState: "ACTIVE" | "DISABLED";
}>;

export type DisableCommand = Readonly<{ activation: PersistedActivation; closure: Exclude<MarketClosure, "OUTSIDE_ADVERTISING_WINDOW"> }>;

// A moment inside every advertising window: the German window is a runtime
// rule, never a reason to take a licensed route down.
const insideEveryWindow = new Date("2026-09-28T20:00:00Z");

export function planDisables(activations: readonly PersistedActivation[]): DisableCommand[] {
  return activations.flatMap((activation) => {
    if (activation.desiredState !== "ACTIVE") return [];
    const access = marketAccess(activation.casinoSlug, activation.marketCode, insideEveryWindow);
    if (access.open || access.closure === "OUTSIDE_ADVERTISING_WINDOW") return [];
    return [{ activation, closure: access.closure }];
  }).sort((left, right) => left.activation.marketCode.localeCompare(right.activation.marketCode)
    || left.activation.casinoSlug.localeCompare(right.activation.casinoSlug));
}

/**
 * A licensed market to open. The partner link is taken from the same casino's
 * route in `sourceMarket`, optionally with query overrides, so no raw partner
 * URL is kept in the repository. When a link for this market was staged
 * earlier, its stored hash must match the derived URL.
 */
export type EnableTarget = Readonly<{
  casinoSlug: string;
  market: string;
  partner: string;
  /** The same casino's market whose link is reused; null when only EGO's link sheet has it. */
  sourceMarket: string | null;
  query?: Readonly<Record<string, string>>;
  note: string;
}>;

const EGO = "ego";
const SUPERFLY = "superfly-partners";

export const ENABLE_TARGETS: readonly EnableTarget[] = Object.freeze([
  // Germany: GGL whitelist; EGO's German campaign links, staged 22 Sep and verified from a German exit on 24 Sep.
  { casinoSlug: "drueckglueck", market: "DE", partner: EGO, sourceMarket: "GB", query: { cg: "german" }, note: "GGL whitelist drueckglueck.de" },
  { casinoSlug: "turbonino", market: "DE", partner: EGO, sourceMarket: "GB", query: { cg: "german" }, note: "GGL whitelist turbonino.de" },
  // Sweden and Denmark: MegawaysCasino is on both registers; EGO's brand link is reused (Founder choice, 24 Sep).
  { casinoSlug: "megawayscasino", market: "SE", partner: EGO, sourceMarket: "GB", note: "Spelinspektionen megawayscasino.com/se" },
  { casinoSlug: "megawayscasino", market: "DK", partner: EGO, sourceMarket: "GB", note: "Spillemyndigheden megawayscasino.com/dk" },
  // Denmark: EUcasino's Danish link was staged on 22 Sep but failed a check made outside Denmark; it lives in EGO's sheet.
  { casinoSlug: "eucasino", market: "DK", partner: EGO, sourceMarket: null, note: "Spillemyndigheden eucasino.com" },
  // Sweden, register only: Regency and PlayUZU; the brand links are reused.
  { casinoSlug: "regencycasino", market: "SE", partner: EGO, sourceMarket: "GB", note: "Spelinspektionen regencycasino.se" },
  { casinoSlug: "playuzu", market: "SE", partner: EGO, sourceMarket: "DK", note: "Spelinspektionen playuzu.com/se" },
  // Great Britain: the six White Hat Gaming brands, UKGC account 52894; the Superfly canonical link is reused.
  ...["21-prive", "diamond7", "gday-casino", "hello-casino", "skol-casino", "slotnite"].map((casinoSlug) => ({
    casinoSlug, market: "GB", partner: SUPERFLY, sourceMarket: "IE", note: "UKGC 52894",
  })),
]);

/** Licensed markets that cannot open yet, and why. */
export const BLOCKED_TARGETS = Object.freeze([
  { casinoSlug: "betsafe", market: "SE", reason: "No Swedish Betsafe link from Betsson Group Affiliates." },
  { casinoSlug: "dragonbet", market: "GB", reason: "No DragonBet link from Brothers Bet; the account was disabled." },
]);

export function derivedTrackingUrl(sourceUrl: string, query: EnableTarget["query"]) {
  const url = new URL(sourceUrl);
  for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
  return url.href;
}

export function linkHash(url: string) {
  return createHash("sha256").update(url).digest("hex");
}

export function targetKey(target: Pick<EnableTarget, "casinoSlug" | "market">) {
  return `${target.casinoSlug}:${target.market}`;
}

export type ApplyGuardInput = Readonly<{
  confirm: string | undefined;
  decisionRef: string | undefined;
  actorEmail: string | undefined;
  expectedDatabase: string | undefined;
  actualDatabase: string;
  env: Readonly<Record<string, string | undefined>>;
}>;

/** Apply is a manual, Founder-confirmed command: never from CI or a Vercel build. */
export function assertMarketAccessApplyAuthority(input: ApplyGuardInput) {
  if (input.env.CI === "true" || input.env.CI === "1") throw new Error("MARKET_ACCESS_RELEASE_FORBIDDEN_IN_CI");
  if (input.env.VERCEL === "1" || input.env.VERCEL_ENV) throw new Error("MARKET_ACCESS_RELEASE_FORBIDDEN_IN_VERCEL_BUILD");
  if (input.confirm !== MARKET_ACCESS_RELEASE) throw new Error(`MARKET_ACCESS_RELEASE_REQUIRES --confirm=${MARKET_ACCESS_RELEASE}`);
  if (input.decisionRef !== MARKET_ACCESS_DECISION_REF) throw new Error(`MARKET_ACCESS_RELEASE_REQUIRES --decision-ref=${MARKET_ACCESS_DECISION_REF}`);
  if (!input.actorEmail?.includes("@")) throw new Error("MARKET_ACCESS_RELEASE_REQUIRES --actor-email=<admin email>");
  if (!input.expectedDatabase || input.expectedDatabase !== input.actualDatabase) {
    throw new Error(`MARKET_ACCESS_RELEASE_DATABASE_MISMATCH: pass --expected-database=${input.actualDatabase} only after confirming DATABASE_URL is the intended target`);
  }
}

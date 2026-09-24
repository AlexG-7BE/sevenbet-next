import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";

import { CASINO_MARKETS, MARKET_RULES, type AdvertisingWindow } from "./register";

/** Why a casino may not be promoted in a market. */
export type MarketClosure =
  | "PROHIBITED_BY_LAW"
  | "OPERATOR_BLOCKS"
  | "NO_LOCAL_LICENCE"
  | "GREY_ZONE_CLOSED"
  | "OUTSIDE_ADVERTISING_WINDOW";

export type MarketAccess = Readonly<{ open: true }> | Readonly<{ open: false; closure: MarketClosure }>;

const OPEN: MarketAccess = Object.freeze({ open: true });
const closures = new Map<MarketClosure, MarketAccess>();

function closed(closure: MarketClosure): MarketAccess {
  let access = closures.get(closure);
  if (!access) closures.set(closure, access = Object.freeze({ open: false, closure }));
  return access;
}

function marketKey(value: string | null | undefined) {
  const key = value?.trim().toUpperCase();
  return key && /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(key) ? key : null;
}

const hourFormats = new Map<string, Intl.DateTimeFormat>();

function localHour(timeZone: string, now: Date) {
  let format = hourFormats.get(timeZone);
  if (!format) hourFormats.set(timeZone, format = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }));
  return Number(format.format(now));
}

export function withinAdvertisingWindow(window: AdvertisingWindow, now: Date) {
  const hour = localHour(window.timeZone, now);
  return window.opensAt < window.closesAt
    ? hour >= window.opensAt && hour < window.closesAt
    : hour >= window.opensAt || hour < window.closesAt;
}

/**
 * Whether a casino may be promoted — its offers shown and its partner button
 * and `/r/` route used — in one market at one moment.
 *
 * `market` is the trusted market code: a country, or a subdivision such as
 * CA-ON. The exact market's rule wins over its country's. A market without a
 * rule stays open: the partner route and jurisdiction gates still decide.
 */
export function marketAccess(casinoSlug: string, market: string | null | undefined, now: Date): MarketAccess {
  const key = marketKey(market);
  if (!key) return OPEN;
  const country = key.slice(0, 2);
  if (!offersMayBePresented(country)) return closed("PROHIBITED_BY_LAW");

  const casino = CASINO_MARKETS[casinoSlug.trim().toLowerCase()];
  if (casino?.operatorBlocks?.[key] ?? casino?.operatorBlocks?.[country]) return closed("OPERATOR_BLOCKS");

  const rule = MARKET_RULES[key] ?? MARKET_RULES[country];
  if (!rule) return OPEN;
  if (rule.regime === "GREY_ZONE") return rule.open ? OPEN : closed("GREY_ZONE_CLOSED");
  if (!(casino?.licensed[key] ?? casino?.licensed[country])) return closed("NO_LOCAL_LICENCE");
  if (rule.advertisingWindow && !withinAdvertisingWindow(rule.advertisingWindow, now)) {
    return closed("OUTSIDE_ADVERTISING_WINDOW");
  }
  return OPEN;
}

function marketRule(market: string | null | undefined) {
  const key = marketKey(market);
  return key ? MARKET_RULES[key] ?? MARKET_RULES[key.slice(0, 2)] ?? null : null;
}

/**
 * Where a local licence is required, only the casino's offer for that market
 * may be shown: an offer published for another market carries another
 * market's terms (and licence), so it is not an offer this visitor can take.
 */
export function offerFitsMarket(relation: string | null | undefined, market: string | null | undefined) {
  return !relation || relation === "EXACT" || relation === "NONE" || marketRule(market)?.regime !== "LICENCE_REQUIRED";
}

/** The casino with no offer: the review stays, because publication is not promotion (RFC-039). */
export function withoutOffers<T extends PublicCasinoDTO>(casino: T): T {
  return {
    ...casino,
    bonuses: [],
    ...(casino.offerPresentation
      ? {
          offerPresentation: {
            ...casino.offerPresentation,
            selectedOffer: null,
            relation: "NONE" as const,
            sourceCountryCode: null,
            currentMarketVerified: false,
          },
        }
      : {}),
  };
}

/**
 * The casino as a visitor from `market` may see it now: no offer where the
 * market is closed or the offer belongs to another licensed market, and no
 * game category the market forbids. Runs per request, after the editorial cache.
 */
export function presentInMarket<T extends PublicCasinoDTO>(casino: T, market: string | null | undefined, now: Date): T {
  const rule = marketRule(market);
  const hidden = rule?.regime === "LICENCE_REQUIRED" ? rule.hiddenGameCategories ?? [] : [];
  const visible = hidden.length
    ? { ...casino, categories: casino.categories.filter((category) => !hidden.includes(category.key.toLowerCase())) }
    : casino;
  const offerAllowed = marketAccess(casino.slug, market, now).open && offerFitsMarket(casino.offerPresentation?.relation, market);
  return offerAllowed ? visible : withoutOffers(visible);
}

import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { formatCommercialMoney, offersForBonusView, structuredOfferHeadline } from "@/lib/commercial/commercial-presentation";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { withinAdvertisingWindow } from "@/lib/market-access/access";
import { MARKET_RULES } from "@/lib/market-access/register";
import { languageRouteByLocale, type MarketProfile } from "@/lib/market/registry";
import { offerPresentationProhibitionReason, offersMayBePresented } from "@/lib/public-offer/offer-visibility";
import type { PublicOfferDTO, PublicOfferSearchResult } from "@/lib/public-offer/public-offer.types";
import { parsePublicOfferQuery } from "@/lib/public-offer/query";

import type { LlmsFullMarket, LlmsFullOffer } from "./llms";

export type LlmsFullDependencies = {
  /** The market's commercial authority, resolved from a trusted signal for that market's country. */
  resolveAuthority: (countryCode: string, now: Date) => Promise<CommercialJurisdictionAuthority | null>;
  searchOffers: (
    authority: CommercialJurisdictionAuthority | null,
    options: { defaultEditorialCountry: string; commercialMarketCode: string; presentationLanguage: string },
  ) => Promise<PublicOfferSearchResult>;
};

const english = commercialUxMessages("en-GB");

function bonusTypeLabel(type: string) {
  const label = type.replaceAll("_", " ").toLowerCase();
  return `${label[0]?.toUpperCase() ?? ""}${label.slice(1)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/** The terms of one offer, in plain English; unknown terms are left out rather than guessed. */
export function llmsOfferTerms(bonus: PublicOfferDTO["bonus"]) {
  const money = (value: number | null | undefined) => (value === null || value === undefined ? null : formatCommercialMoney(value, bonus.currency, "en-GB", "") || null);
  const wagering = bonus.wageringMultiplier !== null && bonus.wageringMultiplier !== undefined
    ? `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(bonus.wageringMultiplier)}×${bonus.wageringText ? ` (${bonus.wageringText.trim()})` : ""}`
    : bonus.wageringText?.trim() || null;
  const expiry = formatDate(bonus.expiresAt);
  return [
    wagering ? `Wagering: ${wagering}` : null,
    money(bonus.minimumDeposit) ? `Minimum deposit: ${money(bonus.minimumDeposit)}` : null,
    money(bonus.maximumBet) ? `Maximum bet: ${money(bonus.maximumBet)}` : null,
    money(bonus.maximumBonus) ? `Maximum bonus: ${money(bonus.maximumBonus)}` : null,
    bonus.freeSpins ? `Free spins: ${bonus.freeSpins}` : null,
    expiry ? `Offer ends: ${expiry}` : null,
    bonus.eligibility?.trim() ? `Eligibility: ${bonus.eligibility.trim()}` : null,
    ...bonus.importantConditions.filter((condition) => condition.trim()).slice(0, 4).map((condition) => `Condition: ${condition.trim()}`),
  ].filter((term): term is string => Boolean(term));
}

export function llmsFullOffer(offer: PublicOfferDTO): LlmsFullOffer {
  return {
    casinoName: offer.casino.name,
    casinoSlug: offer.casino.slug,
    editorScore: offer.casino.editorScore,
    headline: structuredOfferHeadline(offer.bonus, "en-GB", english),
    bonusType: bonusTypeLabel(offer.bonus.type),
    terms: llmsOfferTerms(offer.bonus),
  };
}

/**
 * What the market's own Bonuses page (`/{language}/bonuses`, visited from that country)
 * presents at `now`: the same offer query, the same market-access rules (licence, operator
 * blocks, Germany's 21:00–06:00 window), the same order ("all" view). Resolved from the
 * market, never from whoever requests the file.
 */
export async function loadLlmsFullMarket(market: MarketProfile, now: Date, dependencies: LlmsFullDependencies): Promise<LlmsFullMarket> {
  const country = market.countryCode;
  if (!offersMayBePresented(country)) {
    return { market, state: "PROHIBITED", note: offerPresentationProhibitionReason(country) ?? "Offers may not be presented in this market.", offers: [] };
  }
  let result: PublicOfferSearchResult;
  try {
    const authority = await dependencies.resolveAuthority(country, now).catch(() => null);
    result = await dependencies.searchOffers(authority, {
      defaultEditorialCountry: country,
      commercialMarketCode: country,
      presentationLanguage: languageRouteByLocale(market.defaultLocale).language,
    });
  } catch {
    return { market, state: "UNAVAILABLE", note: "The offer list could not be loaded just now; try again shortly.", offers: [] };
  }
  if (result.inventoryMode === "UNAVAILABLE") {
    return { market, state: "UNAVAILABLE", note: "The offer list could not be loaded just now; try again shortly.", offers: [] };
  }
  const offers = offersForBonusView(result.records.filter((offer) => offer.dataClassification === "PUBLISHED_RECORD"), "all");
  if (offers.length) return { market, state: "OFFERS", offers: offers.map(llmsFullOffer) };
  const rule = MARKET_RULES[country];
  const window = rule?.regime === "LICENCE_REQUIRED" ? rule.advertisingWindow : undefined;
  if (window && !withinAdvertisingWindow(window, now)) {
    return {
      market,
      state: "OUTSIDE_ADVERTISING_WINDOW",
      note: `No offers are shown right now: in this market offers may be shown only between ${String(window.opensAt).padStart(2, "0")}:00 and ${String(window.closesAt).padStart(2, "0")}:00 (${window.timeZone}). The reviews stay available.`,
      offers: [],
    };
  }
  return { market, state: "NO_OFFERS", note: "No published offer is available for this market right now. The reviews stay available.", offers: [] };
}

export const LLMS_FULL_OFFER_QUERY = parsePublicOfferQuery({}, 100);

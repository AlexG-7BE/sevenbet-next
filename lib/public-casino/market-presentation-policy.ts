import type { MarketCode } from "@/lib/market/registry";

export type CasinoMarketPresentationPolicy = Readonly<{
  market: MarketCode;
  reviewedAt: "2026-09-03";
  neutralGlobalIdentityAllowed: boolean;
  unknownExactMarketInformationAllowed: boolean;
  explicitUnavailableInformationAllowed: boolean;
}>;

/**
 * Public-presentation authority only. This does not assert CasinoCountry facts,
 * legalise promotion, or grant partner/route permission. Markets without
 * sufficient current authority fail closed for missing or uncertain profiles.
 */
export const CASINO_MARKET_PRESENTATION_POLICIES = {
  GB: { market: "GB", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  DE: { market: "DE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  ES: { market: "ES", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  PE: { market: "PE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  GR: { market: "GR", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  SE: { market: "SE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  DK: { market: "DK", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  IT: { market: "IT", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  PT: { market: "PT", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  NL: { market: "NL", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  FI: { market: "FI", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  NO: { market: "NO", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
  CA: { market: "CA", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: false, unknownExactMarketInformationAllowed: false, explicitUnavailableInformationAllowed: false },
} as const satisfies Record<MarketCode, CasinoMarketPresentationPolicy>;

export function casinoMarketPresentationPolicy(market: MarketCode) {
  return CASINO_MARKET_PRESENTATION_POLICIES[market];
}

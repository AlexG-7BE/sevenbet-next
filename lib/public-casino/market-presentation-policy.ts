import type { MarketCode } from "@/lib/market/registry";

export type CasinoMarketPresentationPolicy = Readonly<{
  market: MarketCode;
  reviewedAt: "2026-09-03";
  neutralGlobalIdentityAllowed: boolean;
  unknownExactMarketInformationAllowed: boolean;
  explicitUnavailableInformationAllowed: boolean;
}>;

/**
 * Public-content authority only. UNKNOWN is not a prohibition: every reviewed
 * market may present the global editorial record when an exact local profile is
 * missing or uncertain. This does not grant partner/route permission.
 */
export const CASINO_MARKET_PRESENTATION_POLICIES = {
  GB: { market: "GB", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  DE: { market: "DE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  ES: { market: "ES", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  PE: { market: "PE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  GR: { market: "GR", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  SE: { market: "SE", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  DK: { market: "DK", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  IT: { market: "IT", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  PT: { market: "PT", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  NL: { market: "NL", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  FI: { market: "FI", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  NO: { market: "NO", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
  CA: { market: "CA", reviewedAt: "2026-09-03", neutralGlobalIdentityAllowed: true, unknownExactMarketInformationAllowed: true, explicitUnavailableInformationAllowed: true },
} as const satisfies Record<MarketCode, CasinoMarketPresentationPolicy>;

export function casinoMarketPresentationPolicy(market: MarketCode) {
  return CASINO_MARKET_PRESENTATION_POLICIES[market];
}

import "server-only";

import { cache } from "react";

import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { marketActivationRuntime } from "@/lib/market-activation/runtime";
import { resolveCommercialProductState } from "./commercial-product-state";
import { resolveServerPresentationContext } from "./server";

export const resolveServerCommercialProductState = cache(async function resolveServerCommercialProductState() {
  const [presentation, jurisdiction] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
  ]);
  const marketCode = presentation.marketCode ?? presentation.marketCountryCode;
  const canonicalRouteAvailable = marketCode
    ? await marketActivationRuntime.hasActiveRouteForMarket(marketCode).catch(() => false)
    : false;
  return resolveCommercialProductState({ presentation, jurisdiction, canonicalRouteAvailable });
});

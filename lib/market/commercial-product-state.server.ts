import "server-only";

import { cache } from "react";

import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { publicCasinoService } from "@/lib/services/public-casino.service";
import { resolveCommercialProductState } from "./commercial-product-state";
import { navigationStage2CommercialStateRejectionEnabled } from "./navigation-stage2-test-safety";
import { resolveServerPresentationContext } from "./server";

export const resolveServerCommercialProductState = cache(async function resolveServerCommercialProductState() {
  if (navigationStage2CommercialStateRejectionEnabled()) {
    throw new Error("Isolated Navigation Stage 2 commercial-state rejection");
  }
  const [presentation, jurisdiction] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
  ]);
  const canonicalActionAvailable = presentation.marketCountryCode
    ? await publicCasinoService.hasCanonicalAction(
        jurisdiction,
        presentation.marketCountryCode,
        presentation.marketCode,
      )
    : false;
  return resolveCommercialProductState({ canonicalActionAvailable });
});

import type { JurisdictionDecision } from "@/lib/jurisdiction/types";
import type { PresentationResolution } from "./presentation-resolver";

export type CommercialProductState = "SUPPORTED_COMMERCIAL" | "EDITORIAL_ONLY";

export function resolveCommercialProductState(input: {
  presentation: Pick<PresentationResolution, "marketCountryCode">;
  jurisdiction: Pick<JurisdictionDecision, "countryCode" | "editorialAllowed" | "commercialAllowed" | "referralAllowed"> | null;
  canonicalRouteAvailable: boolean;
}): CommercialProductState {
  const country = input.presentation.marketCountryCode;
  const authorityMatches = Boolean(country && input.jurisdiction?.countryCode === country);
  return authorityMatches
    && input.jurisdiction?.editorialAllowed === true
    && input.jurisdiction.commercialAllowed === true
    && input.jurisdiction.referralAllowed === true
    && input.canonicalRouteAvailable
    ? "SUPPORTED_COMMERCIAL"
    : "EDITORIAL_ONLY";
}

export function commercialProductsAvailable(state: CommercialProductState) {
  return state === "SUPPORTED_COMMERCIAL";
}

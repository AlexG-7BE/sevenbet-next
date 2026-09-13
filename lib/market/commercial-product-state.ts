export type CommercialProductState = "SUPPORTED_COMMERCIAL" | "EDITORIAL_ONLY";

export function resolveCommercialProductState(input: {
  canonicalActionAvailable: boolean;
}): CommercialProductState {
  return input.canonicalActionAvailable
    ? "SUPPORTED_COMMERCIAL"
    : "EDITORIAL_ONLY";
}

export function commercialProductsAvailable(state: CommercialProductState) {
  return state === "SUPPORTED_COMMERCIAL";
}

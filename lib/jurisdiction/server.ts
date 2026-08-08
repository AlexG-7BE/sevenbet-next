import "server-only";

import { headers } from "next/headers";

import { requestCountrySignalFromHeaders } from "./request-country";
import { jurisdictionResolver } from "./resolver";
import type { ResolutionInput } from "./types";

export async function resolveServerJurisdiction(
  input: Pick<ResolutionInput, "userSelectedCountry" | "routeCountryOrMarketSlug" | "administrativeOverride"> = {},
) {
  const now = new Date();
  return jurisdictionResolver.resolve({
    ...input,
    accountCountry: null,
    requestCountrySignal: requestCountrySignalFromHeaders(await headers(), now),
    now,
  });
}

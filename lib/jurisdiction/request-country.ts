import { isIsoCountryCode } from "./country-code";
import { navigationStage2LocalTrustedGeoEnabled } from "@/lib/market/navigation-stage2-test-safety";

import type { CountrySignal } from "./types";

type VercelRuntimeEnvironment = Record<string, string | undefined> & { VERCEL?: string; VERCEL_ENV?: string };

function isTrustedVercelRuntime(environment: VercelRuntimeEnvironment) {
  return (environment.VERCEL === "1"
    && (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview"))
    || navigationStage2LocalTrustedGeoEnabled(environment);
}

export function requestCountrySignalFromHeaders(
  requestHeaders: Pick<Headers, "get">,
  observedAt = new Date(),
  environment: VercelRuntimeEnvironment = process.env,
): CountrySignal | null {
  if (!isTrustedVercelRuntime(environment)) return null;
  const value = requestHeaders.get("x-vercel-ip-country")?.trim().toUpperCase();
  if (!value || !isIsoCountryCode(value)) return null;
  const rawRegion = requestHeaders.get("x-vercel-ip-country-region");
  const region = rawRegion?.trim().toUpperCase();
  // A malformed supplied region must not broaden into country authority.
  if (rawRegion !== null && (!region || !/^[A-Z0-9]{1,3}$/.test(region))) return null;
  const marketCode = region ? `${value}-${region}` : value;
  return { countryCode: value, marketCode, trust: "TRUSTED", observedAt };
}

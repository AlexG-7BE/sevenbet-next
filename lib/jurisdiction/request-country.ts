import { isIsoCountryCode } from "./country-code";

import type { CountrySignal } from "./types";

type VercelRuntimeEnvironment = { VERCEL?: string; VERCEL_ENV?: string };

function isTrustedVercelRuntime(environment: VercelRuntimeEnvironment) {
  return environment.VERCEL === "1"
    && (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview");
}

export function requestCountrySignalFromHeaders(
  requestHeaders: Pick<Headers, "get">,
  observedAt = new Date(),
  environment: VercelRuntimeEnvironment = { VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV },
): CountrySignal | null {
  if (!isTrustedVercelRuntime(environment)) return null;
  const value = requestHeaders.get("x-vercel-ip-country")?.trim().toUpperCase();
  if (!value || !isIsoCountryCode(value)) return null;
  return { countryCode: value, trust: "TRUSTED", observedAt };
}

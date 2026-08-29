import { NextResponse, type NextRequest } from "next/server";

import {
  parsePresentationPreference,
  PRESENTATION_PREFERENCE_COOKIE,
  serializePresentationPreference,
} from "@/lib/market/presentation-preference";
import { isLocalizedPublicDestination, localizePublicPath, parsePublicMarketRoute } from "@/lib/market/routing";
import { marketProfileByCountry, type SupportedLocale } from "@/lib/market/registry";

const oneYearInSeconds = 365 * 24 * 60 * 60;
const maximumReturnPathLength = 2_048;

function invalidPreference() {
  return NextResponse.json(
    { ok: false, code: "INVALID_PRESENTATION_PREFERENCE" },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidPreference();
  }

  const choice = formData.get("choice");
  const requestedReturnPath = formData.get("returnTo");
  if (typeof choice !== "string") return invalidPreference();

  const automatic = choice === "automatic";
  let destinationMarket = "GB";
  let preferenceValue: string | null = null;
  let destinationProfile = marketProfileByCountry("GB");
  let destinationLocale: SupportedLocale = "en-GB";

  if (!automatic) {
    const [countryCode, locale, ...unexpected] = choice.split("|");
    if (!countryCode || !locale || unexpected.length > 0) return invalidPreference();
    const profile = marketProfileByCountry(countryCode);
    if (!profile) return invalidPreference();
    try {
      preferenceValue = serializePresentationPreference(profile, locale as SupportedLocale);
    } catch {
      return invalidPreference();
    }
    const preference = parsePresentationPreference(preferenceValue);
    if (!preference?.locale) return invalidPreference();
    destinationMarket = profile.countryCode;
    destinationProfile = profile;
    destinationLocale = preference.locale;
  }

  if (!destinationProfile) return invalidPreference();
  const rawReturnPath = typeof requestedReturnPath === "string" ? requestedReturnPath : "/";
  if (
    rawReturnPath.length > maximumReturnPathLength
    || !rawReturnPath.startsWith("/")
    || rawReturnPath.startsWith("//")
    || rawReturnPath.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(rawReturnPath)
  ) return invalidPreference();
  let returnUrl: URL;
  try {
    returnUrl = new URL(rawReturnPath, request.nextUrl.origin);
  } catch {
    return invalidPreference();
  }
  const parsedReturnPath = parsePublicMarketRoute(returnUrl.pathname);
  if (parsedReturnPath.kind === "INVALID" && parsedReturnPath.reason === "ENCODED_SEPARATOR") {
    return invalidPreference();
  }
  const equivalentPathname = parsedReturnPath.kind === "INVALID" ? "/" : parsedReturnPath.pathname;
  const returnPath = isLocalizedPublicDestination(equivalentPathname) ? equivalentPathname : "/";
  const countryFilter = returnUrl.searchParams.get("country");
  if (countryFilter && countryFilter.trim().toUpperCase() !== destinationMarket) {
    returnUrl.searchParams.delete("country");
  }
  const safeQuery = returnUrl.searchParams.toString();
  const equivalentReturnPath = `${returnPath}${safeQuery ? `?${safeQuery}` : ""}`;
  const destination = automatic
    ? equivalentReturnPath
    : localizePublicPath(destinationProfile, destinationLocale, equivalentReturnPath);

  const response = new NextResponse(null, {
    status: 303,
    headers: { "Cache-Control": "no-store", Location: destination },
  });
  response.cookies.set(PRESENTATION_PREFERENCE_COOKIE, preferenceValue ?? "", {
    httpOnly: true,
    maxAge: automatic ? 0 : oneYearInSeconds,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

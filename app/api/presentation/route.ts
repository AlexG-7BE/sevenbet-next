import { NextResponse, type NextRequest } from "next/server";

import {
  parsePresentationPreference,
  PRESENTATION_PREFERENCE_COOKIE,
  serializePresentationPreference,
} from "@/lib/market/presentation-preference";
import { isLocalizedPublicDestination, localizePublicPath, stripLocalizedPublicPrefix } from "@/lib/market/routing";
import { marketProfileByCountry, type SupportedLocale } from "@/lib/market/registry";

const oneYearInSeconds = 365 * 24 * 60 * 60;

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

  const unprefixedReturnPath = stripLocalizedPublicPrefix(
    typeof requestedReturnPath === "string" ? requestedReturnPath : "/",
  );
  const returnPath = isLocalizedPublicDestination(unprefixedReturnPath) ? unprefixedReturnPath : "/";
  const automatic = choice === "automatic";
  let destination = returnPath;
  let preferenceValue: string | null = null;

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
    destination = localizePublicPath(profile, preference.locale, returnPath);
  }

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

import { NextRequest, NextResponse } from "next/server";

import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { parsePublicComparisonQuery } from "@/lib/public-comparison/query";
import { publicComparisonService } from "@/lib/services/public-comparison.service";
import { isLocalHandoffVisualDataFixture, withHandoffComparisonData } from "@/lib/final-handoff/visual-data-fixture";
import { MARKET_PROFILES, type SupportedLocale } from "@/lib/market/registry";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";

export const dynamic = "force-dynamic";

function comparisonFixtureLocale(value: string | null): SupportedLocale {
  const candidate = value?.trim() as SupportedLocale | undefined;
  return candidate && MARKET_PROFILES.some((profile) => profile.supportedLocales.includes(candidate))
    ? candidate
    : "en-GB";
}

export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Vary": "X-Vercel-IP-Country",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const requestCountry = requestCountrySignalFromHeaders(request.headers)?.countryCode ?? "ZZ";
    const query = parsePublicComparisonQuery(request.nextUrl.searchParams, requestCountry);
    const authority = await resolveServerJurisdiction();
    const result = withHandoffComparisonData(
      await publicComparisonService.compare(query, authority),
      isLocalHandoffVisualDataFixture(request.nextUrl.searchParams.get("visualFixture") ?? undefined),
      comparisonFixtureLocale(request.nextUrl.searchParams.get("presentationLocale")),
    );
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json({ error: "COMPARISON_UNAVAILABLE" }, { status: 503, headers });
  }
}

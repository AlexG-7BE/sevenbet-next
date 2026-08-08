import { NextResponse, type NextRequest } from "next/server";

import { affiliateRedirectHeaders } from "@/lib/affiliate-routing/redirect-response";
import { logJurisdictionDecision } from "@/lib/jurisdiction/decision-log";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { jurisdictionResolver } from "@/lib/jurisdiction/resolver";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await params;
  const now = new Date();
  const decision = await jurisdictionResolver.resolve({
    requestCountrySignal: requestCountrySignalFromHeaders(request.headers, now),
    accountCountry: null,
    now,
  });
  logJurisdictionDecision("LEGACY_AFFILIATE_REDIRECT", decision);
  const response = NextResponse.redirect(new URL("/outbound/unavailable", request.url), 303);
  for (const [name, value] of Object.entries(affiliateRedirectHeaders)) response.headers.set(name, value);
  return response;
}

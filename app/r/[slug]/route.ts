import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { affiliateRedirectHeaders, safeAffiliateRedirectResponse } from "@/lib/affiliate-routing/redirect-response";
import { isAffiliateRedirectEnabled, preferenceHintsFromRequest } from "@/lib/affiliate-routing/redirect-validation";
import { logJurisdictionDecision } from "@/lib/jurisdiction/decision-log";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";
import { recordOutboundClickBestEffort } from "@/lib/services/outbound-click.service";

export const dynamic = "force-dynamic";

function safeDiagnostic(reason: string, metadata: { slugId?: string; casinoId?: string; countryCode?: string | null; currencyCode?: string | null; language?: string | null } = {}) {
  console.warn("affiliate_redirect_unavailable", { reason, ...metadata });
}

function recoveryResponse(request: NextRequest) {
  const recoveryUrl = request.nextUrl.clone();
  recoveryUrl.pathname = "/outbound/unavailable";
  recoveryUrl.search = "";
  recoveryUrl.hash = "";
  const response = NextResponse.redirect(recoveryUrl, 303);
  for (const [name, value] of Object.entries(affiliateRedirectHeaders)) response.headers.set(name, value);
  return response;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAffiliateRedirectEnabled()) return recoveryResponse(request);
  const { slug } = await params;
  let hints: ReturnType<typeof preferenceHintsFromRequest>;
  try {
    hints = preferenceHintsFromRequest(request);
  } catch {
    safeDiagnostic("INVALID_PREFERENCE_HINT");
    return recoveryResponse(request);
  }
  const now = new Date();
  const requestCountrySignal = requestCountrySignalFromHeaders(request.headers, now);
  const creativeId = request.nextUrl.searchParams.get("creative");
  if (creativeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creativeId)) {
    safeDiagnostic("INVALID_CREATIVE_IDENTIFIER", { countryCode: requestCountrySignal?.countryCode, ...hints });
    return recoveryResponse(request);
  }
  try {
    const result = await affiliateRedirectService.resolve(slug, { requestCountrySignal, ...hints, now, creativeId });
    if (result.jurisdictionDecision) logJurisdictionDecision("AFFILIATE_REDIRECT", result.jurisdictionDecision);
    if (!result.ok) {
      safeDiagnostic(result.reason, { slugId: result.slugId, casinoId: result.casinoId, countryCode: result.jurisdictionDecision?.countryCode, ...hints });
      return recoveryResponse(request);
    }
    const response = safeAffiliateRedirectResponse(result.destination);
    if (response.status !== 302) return recoveryResponse(request);
    await recordOutboundClickBestEffort({
      clickedAt: now,
      casinoId: result.casinoId,
      countryCode: result.jurisdictionDecision.countryCode!,
      redirectSlugId: result.slugId,
      affiliateOfferId: result.offerId,
      trackingLinkId: result.trackingLinkId,
    });
    return response;
  } catch {
    safeDiagnostic("RESOLUTION_ERROR", { countryCode: requestCountrySignal?.countryCode, ...hints });
    return recoveryResponse(request);
  }
}

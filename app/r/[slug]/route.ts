import { randomUUID } from "node:crypto";
import { after } from "next/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { affiliateRedirectHeaders, safeAffiliateRedirectResponse } from "@/lib/affiliate-routing/redirect-response";
import { isAffiliateRedirectEnabled, preferenceHintsFromRequest } from "@/lib/affiliate-routing/redirect-validation";
import { recordOutboundAttributionBestEffort, type OutboundAttributionInput } from "@/lib/analytics/outbound-attribution.server";
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

function scheduleObservation(input: OutboundAttributionInput, aggregate?: {
  casinoId: string;
  countryCode: string;
  redirectSlugId: string;
  affiliateOfferId: string;
  trackingLinkId: string;
}) {
  const work = async () => {
    await Promise.all([
      recordOutboundAttributionBestEffort(input),
      ...(aggregate ? [recordOutboundClickBestEffort({ clickedAt: input.attemptedAt, ...aggregate })] : []),
    ]);
  };
  try { after(work); } catch { void work(); }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const attemptedAt = new Date();
  const clickId = randomUUID();
  const { slug } = await params;
  const requestCountrySignal = requestCountrySignalFromHeaders(request.headers, attemptedAt);
  const blocked = (reason: string, extra: Partial<OutboundAttributionInput> = {}) => {
    scheduleObservation({
      clickId,
      request,
      requestedSlug: slug,
      attemptedAt,
      resolvedAt: new Date(),
      state: "BLOCKED",
      blockedReason: reason,
      countryCode: requestCountrySignal?.countryCode,
      ...extra,
    });
    return recoveryResponse(request);
  };

  if (!isAffiliateRedirectEnabled()) return blocked("ROUTING_DISABLED");
  let hints: ReturnType<typeof preferenceHintsFromRequest>;
  try {
    hints = preferenceHintsFromRequest(request);
  } catch {
    safeDiagnostic("INVALID_PREFERENCE_HINT");
    return blocked("INVALID_PREFERENCE_HINT");
  }

  try {
    const result = await affiliateRedirectService.resolve(slug, { requestCountrySignal, ...hints, now: attemptedAt });
    if (result.jurisdictionDecision) logJurisdictionDecision("AFFILIATE_REDIRECT", result.jurisdictionDecision);
    if (!result.ok) {
      safeDiagnostic(result.reason, { slugId: result.slugId, casinoId: result.casinoId, countryCode: result.jurisdictionDecision?.countryCode, ...hints });
      return blocked(result.reason, {
        casinoId: result.casinoId,
        redirectSlugId: result.slugId,
        countryCode: result.jurisdictionDecision?.countryCode,
        locale: hints.language,
      });
    }
    const response = safeAffiliateRedirectResponse(result.destination);
    if (response.status !== 302) {
      return blocked("UNSAFE_REDIRECT_RESPONSE", {
        casinoId: result.casinoId,
        affiliateOfferId: result.offerId,
        redirectSlugId: result.slugId,
        trackingLinkId: result.trackingLinkId,
        countryCode: result.jurisdictionDecision.countryCode,
        locale: hints.language,
      });
    }
    const observation = {
      clickId,
      request,
      requestedSlug: slug,
      attemptedAt,
      resolvedAt: new Date(),
      state: "SUCCEEDED" as const,
      countryCode: result.jurisdictionDecision.countryCode,
      locale: hints.language,
      casinoId: result.casinoId,
      affiliateOfferId: result.offerId,
      redirectSlugId: result.slugId,
      trackingLinkId: result.trackingLinkId,
    };
    scheduleObservation(observation, {
      casinoId: result.casinoId,
      countryCode: result.jurisdictionDecision.countryCode!,
      redirectSlugId: result.slugId,
      affiliateOfferId: result.offerId,
      trackingLinkId: result.trackingLinkId,
    });
    return response;
  } catch {
    safeDiagnostic("RESOLUTION_ERROR", { countryCode: requestCountrySignal?.countryCode, ...hints });
    return blocked("RESOLUTION_ERROR", { locale: hints.language });
  }
}

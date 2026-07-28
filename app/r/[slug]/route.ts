import type { NextRequest } from "next/server";

import { safeAffiliateRedirectResponse, unavailableRedirectResponse } from "@/lib/affiliate-routing/redirect-response";
import { countryFromRequest, isAffiliateRedirectEnabled, preferenceHintsFromRequest } from "@/lib/affiliate-routing/redirect-validation";
import { evaluateJurisdictionShadow } from "@/lib/jurisdiction/shadow";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";

export const dynamic = "force-dynamic";

function safeDiagnostic(reason: string, metadata: { slugId?: string; casinoId?: string; countryCode?: string | null; currencyCode?: string | null; language?: string | null } = {}) {
  console.warn("affiliate_redirect_unavailable", { reason, ...metadata });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAffiliateRedirectEnabled()) return unavailableRedirectResponse();
  const { slug } = await params;
  let hints: ReturnType<typeof preferenceHintsFromRequest>;
  try {
    hints = preferenceHintsFromRequest(request);
  } catch {
    safeDiagnostic("INVALID_PREFERENCE_HINT");
    return unavailableRedirectResponse(400);
  }
  const countryCode = countryFromRequest(request);
  try {
    const result = await affiliateRedirectService.resolve(slug, { countryCode, ...hints });
    await evaluateJurisdictionShadow("AFFILIATE_REDIRECT", {
      // Existing recognised headers are not yet proven to originate at a configured trusted boundary.
      requestCountrySignal: countryCode ? { countryCode, trust: "UNTRUSTED", observedAt: new Date() } : null,
      now: new Date(),
    }, { commercialAllowed: result.ok, referralAllowed: result.ok });
    if (!result.ok) {
      safeDiagnostic(result.reason, { slugId: result.slugId, casinoId: result.casinoId, countryCode, ...hints });
      return unavailableRedirectResponse();
    }
    return safeAffiliateRedirectResponse(result.destination);
  } catch {
    safeDiagnostic("RESOLUTION_ERROR", { countryCode, ...hints });
    return unavailableRedirectResponse();
  }
}

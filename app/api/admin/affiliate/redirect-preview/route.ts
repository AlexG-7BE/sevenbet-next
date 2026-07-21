import { NextResponse, type NextRequest } from "next/server";

import { normalizeCountryHint, normalizeCurrencyHint, normalizeLanguageHint } from "@/lib/affiliate-routing/redirect-validation";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";
import { ValidationError } from "@/lib/services/service-error";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) throw new ValidationError("slug is required");
    const result = await affiliateRedirectService.resolve(slug, {
      countryCode: normalizeCountryHint(request.nextUrl.searchParams.get("country")),
      currencyCode: normalizeCurrencyHint(request.nextUrl.searchParams.get("currency")),
      language: normalizeLanguageHint(request.nextUrl.searchParams.get("language")),
    });
    const candidates = result.candidates.map(({ destinationUrl: _destinationUrl, trackingUrl: _trackingUrl, ...candidate }) => candidate);
    return NextResponse.json({
      ok: result.ok,
      reason: result.ok ? null : result.reason,
      winner: candidates.find((candidate) => candidate.chosen) ?? null,
      candidates,
      previewOnly: true,
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to preview affiliate redirect");
  }
}

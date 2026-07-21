import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { rankRoutingCandidates } from "@/lib/affiliate/routing-preview";
import { isIsoCountryCode, isIsoCurrency } from "@/lib/affiliate/validation";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateOfferService, ValidationError } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const body = await readAffiliateJson(request);
    const casinoId = typeof body.casinoId === "string" ? body.casinoId : "";
    const casinoBonusId = typeof body.casinoBonusId === "string" ? body.casinoBonusId : undefined;
    const countryCode = typeof body.countryCode === "string" && body.countryCode ? body.countryCode.toUpperCase() : undefined;
    const currencyCode = typeof body.currencyCode === "string" && body.currencyCode ? body.currencyCode.toUpperCase() : undefined;
    if (!casinoId) throw new ValidationError("casinoId is required");
    if (countryCode && !isIsoCountryCode(countryCode)) throw new ValidationError("countryCode must be ISO 3166-1 alpha-2");
    if (currencyCode && !isIsoCurrency(currencyCode)) throw new ValidationError("currencyCode must be ISO 4217");
    const offers = await affiliateOfferService.activeCandidates({ casinoId, casinoBonusId, countryCode, currencyCode });
    const candidates = rankRoutingCandidates(offers, { casinoId, casinoBonusId, countryCode, currencyCode });
    return NextResponse.json({ ok: true, candidates, winner: candidates[0] ?? null, previewOnly: true });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to preview affiliate routing");
  }
}

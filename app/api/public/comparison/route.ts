import { NextRequest, NextResponse } from "next/server";

import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { parsePublicComparisonQuery } from "@/lib/public-comparison/query";
import { publicComparisonService } from "@/lib/services/public-comparison.service";
import { isLocalHandoffVisualDataFixture, withHandoffComparisonData } from "@/lib/final-handoff/visual-data-fixture";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const query = parsePublicComparisonQuery(request.nextUrl.searchParams);
    const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country });
    const result = withHandoffComparisonData(
      await publicComparisonService.compare(query, authority),
      isLocalHandoffVisualDataFixture(request.nextUrl.searchParams.get("visualFixture") ?? undefined),
    );
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json({ error: "COMPARISON_UNAVAILABLE" }, { status: 503, headers });
  }
}

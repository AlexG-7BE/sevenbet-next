import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { assertSameOriginMutation } from "@/lib/http/mutation-request";
import { applyAnalyticsInternalCookie, hasAnalyticsInternalMarker } from "@/lib/analytics/identity.server";
import { internalTrafficOwners, reclassifyStaffActivityAsInternal } from "@/lib/analytics/internal-traffic.server";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET(request: Request) {
  try {
    await requireAdminAccess(request);
    return NextResponse.json({ ok: true, internal: hasAnalyticsInternalMarker(request.headers) }, { headers: privateHeaders });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to read this device's analytics marker");
  }
}

/**
 * Marks the calling staff browser as internal traffic. Any signed-in admin may
 * mark their own browser; the marker is a measurement label, never an authority.
 */
export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const staff = await requireAdminAccess(request);
    let reclassified: Awaited<ReturnType<typeof reclassifyStaffActivityAsInternal>> | null = null;
    try {
      reclassified = await reclassifyStaffActivityAsInternal(internalTrafficOwners(request.headers, staff.user.id));
    } catch {
      console.warn("[analytics] internal traffic reclassification failed", {
        analytics_failure_category: "database",
      });
    }
    const response = NextResponse.json({ ok: true, internal: true, reclassified }, { headers: privateHeaders });
    applyAnalyticsInternalCookie(response);
    return response;
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to mark this device as internal");
  }
}

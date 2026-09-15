import { NextResponse, type NextRequest } from "next/server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";

async function retiredGenericCmsRecordResponse(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    return NextResponse.json({
      ok: false,
      error: "The legacy generic CMS record API is retired. Use a dedicated PostgreSQL domain API.",
      code: "LEGACY_CMS_RETIRED",
    }, {
      status: 410,
      headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to authorize retired CMS record route");
  }
}

export const GET = retiredGenericCmsRecordResponse;
export const PATCH = retiredGenericCmsRecordResponse;
export const DELETE = retiredGenericCmsRecordResponse;

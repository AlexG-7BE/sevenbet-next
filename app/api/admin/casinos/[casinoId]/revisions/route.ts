import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { casinoService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ casinoId: string }> },
) {
  const { casinoId } = await params;

  try {
    await requireAdminPermission(request, "casino.edit");
    const [revisions, versions] = await Promise.all([
      casinoService.getRevisionHistory(casinoId),
      casinoService.listVersions(casinoId),
    ]);

    return NextResponse.json({
      ok: true,
      revisions,
      versions,
      source: "postgresql",
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load casino history");
  }
}

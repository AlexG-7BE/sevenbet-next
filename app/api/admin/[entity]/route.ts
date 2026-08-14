import { NextResponse, type NextRequest } from "next/server";
import { isCmsEntity, isProgramManagedEntity, permissionForEntity, permissionsForEntity } from "@/lib/cms/entities";
import { createCmsRecord, listCmsRecords } from "@/lib/cms/repository";
import type { CmsRecord } from "@/lib/cms/types";
import {
  requireAdminAnyPermission,
  requireAdminPermission,
} from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";

function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity: entityParam } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    await requireAdminAnyPermission(request, permissionsForEntity(entityParam, "read"));
    const status = request.nextUrl.searchParams.get("status");
    const records = listCmsRecords(entityParam).filter((record) => !status || record.status === status);
    return NextResponse.json({ ok: true, entity: entityParam, count: records.length, records });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list CMS records");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity: entityParam } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    const actor = await requireAdminPermission(request, permissionForEntity(entityParam, "create"));
    const input = (await request.json()) as CmsRecord;
    if (input.entity !== entityParam) return apiError("Payload entity does not match URL entity");

    const record = createCmsRecord(entityParam, input, actor);
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create CMS record");
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { isCmsEntity, isProgramManagedEntity, permissionForEntity, permissionsForEntity } from "@/lib/cms/entities";
import { archiveCmsRecord, getCmsRecord, listRevisions, updateCmsRecord } from "@/lib/cms/repository";
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    await requireAdminAnyPermission(request, permissionsForEntity(entityParam, "read"));
    const record = getCmsRecord(entityParam, id);
    if (!record) return apiError("CMS record not found", 404);

    return NextResponse.json({
      ok: true,
      record,
      revisions: listRevisions(entityParam, id),
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load CMS record");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    const actor = await requireAdminPermission(request, permissionForEntity(entityParam, "update"));
    const input = (await request.json()) as Partial<CmsRecord>;
    const record = updateCmsRecord(entityParam, id, input, actor);
    return NextResponse.json({ ok: true, record, revisions: listRevisions(entityParam, id) });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update CMS record");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    const actor = await requireAdminPermission(request, permissionForEntity(entityParam, "delete"));
    const record = archiveCmsRecord(entityParam, id, actor);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to archive CMS record");
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { isCmsEntity, permissionForEntity } from "@/lib/cms/entities";
import { archiveCmsRecord, getCmsRecord, listRevisions, updateCmsRecord } from "@/lib/cms/repository";
import type { CmsRecord } from "@/lib/cms/types";
import { requireAdminPermission } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);

  try {
    requireAdminPermission(request, permissionForEntity(entityParam, "read"));
    const record = getCmsRecord(entityParam, id);
    if (!record) return apiError("CMS record not found", 404);

    return NextResponse.json({
      ok: true,
      record,
      revisions: listRevisions(entityParam, id),
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unauthorized", 401);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);

  try {
    const actor = requireAdminPermission(request, permissionForEntity(entityParam, "update"));
    const input = (await request.json()) as Partial<CmsRecord>;
    const record = updateCmsRecord(entityParam, id, input, actor);
    return NextResponse.json({ ok: true, record, revisions: listRevisions(entityParam, id) });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to update CMS record", 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: entityParam, id } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);

  try {
    const actor = requireAdminPermission(request, permissionForEntity(entityParam, "delete"));
    const record = archiveCmsRecord(entityParam, id, actor);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to archive CMS record", 400);
  }
}

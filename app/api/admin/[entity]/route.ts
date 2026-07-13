import { NextResponse, type NextRequest } from "next/server";
import { isCmsEntity, isProgramManagedEntity, permissionForEntity } from "@/lib/cms/entities";
import { createCmsRecord, listCmsRecords } from "@/lib/cms/repository";
import type { CmsRecord } from "@/lib/cms/types";
import { requireAdminPermission } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity: entityParam } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    requireAdminPermission(request, permissionForEntity(entityParam, "read"));
    const status = request.nextUrl.searchParams.get("status");
    const records = listCmsRecords(entityParam).filter((record) => !status || record.status === status);
    return NextResponse.json({ ok: true, entity: entityParam, count: records.length, records });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unauthorized", 401);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity: entityParam } = await params;
  if (!isCmsEntity(entityParam)) return apiError("Unknown CMS entity", 404);
  if (isProgramManagedEntity(entityParam)) return apiError("Use the PostgreSQL Program Builder API for this entity", 410);

  try {
    const actor = requireAdminPermission(request, permissionForEntity(entityParam, "create"));
    const input = (await request.json()) as CmsRecord;
    if (input.entity !== entityParam) return apiError("Payload entity does not match URL entity");

    const record = createCmsRecord(entityParam, input, actor);
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to create CMS record", 400);
  }
}

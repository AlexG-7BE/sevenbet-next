import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import { editorialReviewService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ casinoId: string }> };

function document(value: unknown): CasinoEditorialDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Editorial document must be an object.");
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || typeof record.title !== "string" || typeof record.summary !== "string" || typeof record.author !== "string" || !Array.isArray(record.sections) || !record.seo || typeof record.seo !== "object" || Array.isArray(record.seo)) throw new ValidationError("Editorial document has an invalid structure.");
  if (!record.sections.every((section) => section && typeof section === "object" && !Array.isArray(section) && Array.isArray((section as Record<string, unknown>).blocks))) throw new ValidationError("Each editorial section must contain structured blocks.");
  return value as CasinoEditorialDocument;
}

export async function GET(request: NextRequest, { params }: Context) {
  try { await requireAdminPermission(request, "casino.edit"); return NextResponse.json({ ok: true, review: await editorialReviewService.getByCasinoId((await params).casinoId) }); }
  catch (error) { return adminServiceErrorResponse(error, "Unable to load editorial review"); }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "casino.edit"); const body = await request.json() as { content?: unknown; summary?: unknown };
    const review = await editorialReviewService.saveDraft((await params).casinoId, document(body.content), typeof body.summary === "string" ? body.summary : "Editorial update", actor.id);
    return NextResponse.json({ ok: true, review });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to save editorial review"); }
}

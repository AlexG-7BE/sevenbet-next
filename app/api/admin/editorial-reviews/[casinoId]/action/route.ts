import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import type { EditorialReviewStatus } from "@/lib/editorial-review/types";
import { revalidatePublicCasino } from "@/lib/public-casino/cache";
import { editorialReviewService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ casinoId: string }> };
const states = new Set<EditorialReviewStatus>(["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED", "SUSPENDED"]);

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "casino.edit"); const casinoId = (await params).casinoId;
    const review = await editorialReviewService.getByCasinoId(casinoId); if (!review) throw new ValidationError("Save an editorial draft before changing workflow.");
    const body = await request.json() as { action?: string; revisionId?: string; scheduledAt?: string; expiresInMinutes?: number };
    if (body.action === "preview") return NextResponse.json({ ok: true, preview: await editorialReviewService.createPreview(review.id, actor.id, body.expiresInMinutes) });
    if (body.action === "publish") { const published = await editorialReviewService.publish(review.id, body.revisionId, actor.id); revalidatePublicCasino(); return NextResponse.json({ ok: true, review: published }); }
    if (!body.action || !states.has(body.action as EditorialReviewStatus)) throw new ValidationError("Unknown editorial workflow action.");
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null; if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new ValidationError("scheduledAt must be an ISO date.");
    return NextResponse.json({ ok: true, review: await editorialReviewService.transition(review.id, body.action as EditorialReviewStatus, actor.id, scheduledAt) });
  } catch (error) { return adminServiceErrorResponse(error, "Editorial action failed"); }
}

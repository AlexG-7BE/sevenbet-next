import { EditorialStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { casinoService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ casinoId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { casinoId } = await params;

  try {
    const actor = await requireAdminPermission(request, "casino.edit");
    const body = (await request.json()) as {
      action?: "request-review" | "request-changes" | "approve" | "schedule" | "publish" | "archive";
      publishAt?: string;
    };

    if (body.action === "request-review") {
      const casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.IN_REVIEW, actor.id);
      return NextResponse.json({ ok: true, casino, source: "postgresql" });
    }
    if (body.action === "request-changes") {
      const casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actor.id);
      return NextResponse.json({ ok: true, casino, source: "postgresql" });
    }
    if (body.action === "approve") {
      const casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.APPROVED, actor.id);
      return NextResponse.json({ ok: true, casino, source: "postgresql" });
    }
    if (body.action === "schedule") {
      if (!body.publishAt) throw new ValidationError("publishAt is required for scheduling");
      const casino = await casinoService.scheduleCasino(casinoId, new Date(body.publishAt), actor.id);
      return NextResponse.json({ ok: true, casino, source: "postgresql" });
    }
    if (body.action === "publish") {
      const result = await casinoService.publishCasino(casinoId, actor.id);
      return NextResponse.json({ ok: true, ...result, source: "postgresql" });
    }
    if (body.action === "archive") {
      const casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.ARCHIVED, actor.id);
      return NextResponse.json({ ok: true, casino, source: "postgresql" });
    }

    throw new ValidationError("Unknown casino action");
  } catch (error) {
    return adminServiceErrorResponse(error, "Casino action failed");
  }
}

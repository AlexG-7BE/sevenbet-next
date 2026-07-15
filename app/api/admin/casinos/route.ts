import { EditorialStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { casinoService } from "@/lib/services";

export const dynamic = "force-dynamic";

function parseStatus(value: string | null) {
  if (!value) return undefined;
  return Object.values(EditorialStatus).includes(value as EditorialStatus)
    ? (value as EditorialStatus)
    : undefined;
}

function parseInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "casino.edit");

    const result = await casinoService.listCasinos({
      status: parseStatus(request.nextUrl.searchParams.get("status")),
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      skip: parseInteger(request.nextUrl.searchParams.get("skip"), 0),
      take: parseInteger(request.nextUrl.searchParams.get("take"), 50),
    });

    return NextResponse.json({ ok: true, ...result, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list casinos");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "casino.edit");
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      domain?: string;
      internalName?: string;
      websiteUrl?: string;
      operator?: string;
      summary?: string;
      language?: string;
    };

    const title = body.title?.trim() || "Untitled Casino";
    const casino = await casinoService.createDraft({
      slug: body.slug?.trim() || `${title}-${crypto.randomUUID().slice(0, 8)}`,
      title,
      domain: body.domain ?? "",
      internalName: body.internalName,
      websiteUrl: body.websiteUrl,
      operator: body.operator,
      summary: body.summary,
      language: body.language,
      createdBy: actor.id,
    });

    return NextResponse.json(
      { ok: true, casino, source: "postgresql" },
      { status: 201 },
    );
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create casino");
  }
}

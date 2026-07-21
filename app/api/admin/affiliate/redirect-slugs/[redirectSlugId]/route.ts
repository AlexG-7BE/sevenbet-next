import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateMutation } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ redirectSlugId: string }> }) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const redirect = await affiliateRedirectService.get((await params).redirectSlugId);
    return NextResponse.json({ ok: true, redirect, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate redirect slug");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ redirectSlugId: string }> }) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const mutation = await readAffiliateMutation(request);
    const redirect = await affiliateRedirectService.update((await params).redirectSlugId, mutation.data, actor.id, mutation.expectedUpdatedAt);
    return NextResponse.json({ ok: true, redirect, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update affiliate redirect slug");
  }
}

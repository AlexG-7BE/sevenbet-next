import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { affiliateRouteHealthService } from "@/lib/services/affiliate-route-health.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function productionCommitSha() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase();
  return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function authorized(request: NextRequest) {
  const expected = process.env.AFFILIATE_HEALTH_MONITOR_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const report = await affiliateRouteHealthService.run();
    return NextResponse.json(
      { ok: true, productionCommitSha: productionCommitSha(), ...report },
      { status: report.healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, code: "HEALTH_CHECK_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

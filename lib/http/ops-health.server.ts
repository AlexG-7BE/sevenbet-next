import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { runOpsHealthChecks, type OpsHealthReport } from "@/lib/services/ops-health.service";

const noStore = { "Cache-Control": "no-store" } as const;

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time bearer comparison over fixed-length digests, so the token length is not observable either. */
export function opsHealthBearerMatches(authorization: string | null, expected: string) {
  const match = /^Bearer (\S+)$/.exec(authorization ?? "");
  return timingSafeEqual(digest(match?.[1] ?? "\u0000invalid-ops-health-credential"), digest(expected)) && Boolean(match);
}

function productionCommitSha(environment: Record<string, string | undefined>) {
  const sha = environment.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase();
  return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

export function createOpsHealthHandler({
  environment = process.env,
  runChecks = () => runOpsHealthChecks(),
}: {
  environment?: Record<string, string | undefined>;
  runChecks?: () => Promise<OpsHealthReport>;
} = {}) {
  return async function opsHealthHandler(request: Request) {
    const token = environment.AFFILIATE_HEALTH_MONITOR_TOKEN?.trim();
    // Without a configured monitor token the endpoint does not exist.
    if (!token) return Response.json({ ok: false, code: "NOT_FOUND" }, { status: 404, headers: noStore });
    if (!opsHealthBearerMatches(request.headers.get("authorization"), token)) {
      return Response.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401, headers: noStore });
    }
    try {
      const report = await runChecks();
      return Response.json(
        { ...report, productionCommitSha: productionCommitSha(environment) },
        { status: report.ok ? 200 : 503, headers: noStore },
      );
    } catch {
      return Response.json({ ok: false, code: "OPS_HEALTH_CHECK_FAILED" }, { status: 503, headers: noStore });
    }
  };
}

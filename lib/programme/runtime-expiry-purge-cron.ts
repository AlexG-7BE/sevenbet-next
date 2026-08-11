import { timingSafeEqual } from "node:crypto";

import { purgeExpiredProgrammeRuntime } from "@/lib/programme/runtime-expiry-purge";

function authorized(request: Request, secret: string) {
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const suppliedBytes = Buffer.from(supplied, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return suppliedBytes.length === expectedBytes.length
    && timingSafeEqual(suppliedBytes, expectedBytes);
}

export function createProgrammeExpiryPurgeCronHandler({
  environment = process.env as { CRON_SECRET?: string },
  purge = purgeExpiredProgrammeRuntime,
}: {
  environment?: { CRON_SECRET?: string };
  purge?: typeof purgeExpiredProgrammeRuntime;
} = {}) {
  return async function programmeExpiryPurgeCronHandler(request: Request) {
    const secret = environment.CRON_SECRET?.trim();
    if (!secret) {
      return Response.json(
        { code: "CRON_UNAVAILABLE" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!authorized(request, secret)) {
      return Response.json(
        { code: "UNAUTHORIZED" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    const startedAt = performance.now();
    try {
      const result = await purge({ dryRun: false });
      const durationMs = Math.round(performance.now() - startedAt);
      console.info("[programme-expiry-purge] completed", {
        cron_result: "success",
        purge_counts: {
          anonymous_sessions: result.expiredAnonymousSessions,
          pending_claims: result.expiredPendingClaims,
          rate_limit_buckets: result.expiredRateLimitBuckets,
        },
        purge_duration_ms: durationMs,
      });
      return Response.json(
        { ok: true, ...result, durationMs },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      console.error("[programme-expiry-purge] failed", { cron_result: "failed" });
      return Response.json(
        { code: "PURGE_FAILED" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}

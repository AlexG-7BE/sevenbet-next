import { analyticsRequestSource } from "@/lib/analytics/rate-limit.server";
import { subscribePauseReminder } from "@/lib/email/pause-letters/reminders.server";
import { isSameOriginMutation, readBoundedJson } from "@/lib/http/mutation-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

/** The email field of the tool on /pause-plan. The rules live in the service; this only answers. */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ code: "CROSS_ORIGIN_DENIED" }, 403);
  let body: unknown;
  try { body = await readBoundedJson(request, 2048); } catch { return json({ code: "INVALID_REQUEST" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ code: "INVALID_REQUEST" }, 400);
  const { email, register, endsOn, locale } = body as Record<string, unknown>;
  const result = await subscribePauseReminder({ email, register, endsOn, locale }, analyticsRequestSource(request.headers))
    .catch(() => ({ status: "failed" as const }));
  const status = result.status === "accepted" ? 200
    : result.status === "invalid" ? 400
      : result.status === "rate-limited" ? 429
        : result.status === "disabled" ? 404
          : 500;
  return json({ status: result.status }, status);
}

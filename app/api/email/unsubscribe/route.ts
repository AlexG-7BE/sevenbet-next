import { unsubscribeWithToken } from "@/lib/email/unsubscribe.server";
import { isSameOriginMutation } from "@/lib/http/mutation-request";
import { readBoundedRequestText } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ code: "CROSS_ORIGIN_DENIED" }, 403);
  let token = "";
  try {
    const text = await readBoundedRequestText(request, 2048);
    if (request.headers.get("content-type")?.startsWith("application/json")) {
      const value = JSON.parse(text) as { token?: unknown };
      token = typeof value.token === "string" ? value.token : "";
    } else {
      token = new URLSearchParams(text).get("token") ?? "";
    }
  } catch { return json({ code: "INVALID_REQUEST" }, 400); }
  const result = await unsubscribeWithToken(token).catch(() => ({ status: "failed" as const }));
  if (request.headers.get("content-type")?.startsWith("application/json")) {
    return json(result, result.status === "invalid" ? 400 : result.status === "failed" ? 500 : 200);
  }
  const destination = new URL("/unsubscribe", request.url);
  destination.searchParams.set("status", result.status === "unsubscribed" || result.status === "already-unsubscribed" ? "confirmed" : "invalid");
  return new Response(null, {
    status: 303,
    headers: {
      Location: destination.toString(),
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

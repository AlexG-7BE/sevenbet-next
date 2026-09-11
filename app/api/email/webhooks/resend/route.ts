import { Webhook } from "svix";

import { validatedResendWebhookSecret } from "@/lib/email/runtime-config.server";
import { readBoundedRequestText } from "@/lib/programme/http";
import { normalizeResendWebhook, processResendWebhook } from "@/lib/email/webhook.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "production") {
    return json({ code: "NOT_FOUND" }, 404);
  }
  const secret = validatedResendWebhookSecret(process.env.RESEND_WEBHOOK_SECRET);
  if (!secret) {
    console.error("[email-webhook] verification unavailable", { webhook_failure_category: "configuration" });
    return json({ code: "WEBHOOK_UNAVAILABLE" }, 503);
  }
  const providerEventId = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signature = request.headers.get("svix-signature") ?? "";
  if (!providerEventId || !timestamp || !signature) return json({ code: "INVALID_SIGNATURE" }, 401);
  let rawBody: string;
  try { rawBody = await readBoundedRequestText(request, 64 * 1024); }
  catch { return json({ code: "INVALID_PAYLOAD" }, 400); }
  let verified: unknown;
  try {
    verified = new Webhook(secret).verify(rawBody, {
      "svix-id": providerEventId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    });
  } catch {
    console.warn("[email-webhook] signature rejected", { webhook_failure_category: "verification" });
    return json({ code: "INVALID_SIGNATURE" }, 401);
  }
  try {
    const result = await processResendWebhook(normalizeResendWebhook(providerEventId, verified));
    return json(result, result.status === "ignored" ? 202 : 200);
  } catch {
    console.error("[email-webhook] processing failed", { webhook_failure_category: "processing" });
    return json({ code: "WEBHOOK_PROCESSING_FAILED" }, 500);
  }
}

import "server-only";

import { timingSafeEqual } from "node:crypto";

import { refreshCampaignStates } from "@/lib/email/campaigns.server";
import { processQueuedEmailBatch, queueProgrammeReminders } from "@/lib/email/service.server";
import { purgeCustomerDataRetention } from "@/lib/privacy/customer-data-retention.server";

function exactBearer(request: Request, secret: string) {
  const supplied = Buffer.from(request.headers.get("authorization") ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createLifecycleQueueCronHandler({
  environment = process.env as { CRON_SECRET?: string },
  queueReminders = queueProgrammeReminders,
  processMessages = processQueuedEmailBatch,
  refreshCampaigns = refreshCampaignStates,
  purgeRetention = purgeCustomerDataRetention,
}: {
  environment?: { CRON_SECRET?: string };
  queueReminders?: typeof queueProgrammeReminders;
  processMessages?: typeof processQueuedEmailBatch;
  refreshCampaigns?: typeof refreshCampaignStates;
  purgeRetention?: typeof purgeCustomerDataRetention;
} = {}) {
  return async function lifecycleQueueCronHandler(request: Request) {
    const secret = environment.CRON_SECRET?.trim();
    if (!secret) return Response.json({ code: "CRON_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    if (!exactBearer(request, secret)) return Response.json({ code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const startedAt = performance.now();
    try {
      const [reminders, retention] = await Promise.all([queueReminders(), purgeRetention()]);
      const delivery = await processMessages(50);
      const campaignsRefreshed = await refreshCampaigns();
      const result = {
        reminderEligible: reminders.eligible,
        reminderQueued: reminders.queued,
        delivery,
        campaignsRefreshed,
        retention: {
          analyticsEvents: retention.analyticsEvents,
          outboundClicks: retention.outboundClicks,
          analyticsSessions: retention.analyticsSessions,
          anonymousConsentEvents: retention.anonymousConsentEvents,
          emailMessages: retention.emailMessages,
          expiredRateLimitBuckets: retention.expiredRateLimitBuckets,
          limited: retention.limited,
        },
        durationMs: Math.round(performance.now() - startedAt),
      };
      console.info("[customer-lifecycle] queue, delivery and retention completed", {
        cron_result: "success",
        reminder_eligible: result.reminderEligible,
        reminder_queued: result.reminderQueued,
        delivery_counts: result.delivery,
        campaigns_refreshed: result.campaignsRefreshed,
        retention_counts: result.retention,
        cron_duration_ms: result.durationMs,
      });
      return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      console.error("[customer-lifecycle] queue, delivery or retention failed", { cron_result: "failed" });
      return Response.json({ code: "LIFECYCLE_CRON_FAILED" }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  };
}

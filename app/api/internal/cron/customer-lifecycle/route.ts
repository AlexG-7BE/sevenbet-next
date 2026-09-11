import { createLifecycleQueueCronHandler } from "@/lib/email/lifecycle-queue-cron.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = createLifecycleQueueCronHandler();

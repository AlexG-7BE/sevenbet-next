import { createProgrammeExpiryPurgeCronHandler } from "@/lib/programme/runtime-expiry-purge-cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = createProgrammeExpiryPurgeCronHandler();

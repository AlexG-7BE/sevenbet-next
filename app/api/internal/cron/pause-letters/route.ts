import { createPauseLettersCronHandler } from "@/lib/email/pause-letters/cron.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = createPauseLettersCronHandler();

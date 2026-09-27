import { createOpsHealthHandler } from "@/lib/http/ops-health.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 20;

export const GET = createOpsHealthHandler();

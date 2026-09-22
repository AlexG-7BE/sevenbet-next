import { createLearnContentCronHandler } from "@/lib/learn-content-orchestrator/service.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export const GET = createLearnContentCronHandler();

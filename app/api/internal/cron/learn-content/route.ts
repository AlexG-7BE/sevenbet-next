/**
 * Retired 30 September 2026 (LEARN-CHATGPT-SCHEDULER-2026-09-30). Vercel no
 * longer schedules this path and it imports nothing: it cannot start or inspect
 * a managed AI session, read or write orchestrator state, or publish. Editorial
 * cycles belong to the ChatGPT scheduled task, which reads the Learn MCP
 * `learn_context` tool and publishes only through `learn_apply`.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { result: "NO_OP", code: "CHATGPT_SCHEDULER_OWNS_EXECUTION" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

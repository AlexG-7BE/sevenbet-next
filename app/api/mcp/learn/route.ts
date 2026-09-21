import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = handleLearnMcpPost;

function methodNotAllowed() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32600, message: "Use POST for stateless Learn MCP requests" }, id: null },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const PUT = methodNotAllowed;

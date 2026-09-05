import { mcpMethodNotAllowedResponse, runMcpPostBoundary } from "@/lib/mcp/reliability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request) {
  return runMcpPostBoundary(async () => {
    const { handleMediaMcpPost } = await import("@/lib/mcp/media/post-handler");
    return handleMediaMcpPost(request);
  });
}

export const GET = mcpMethodNotAllowedResponse;
export const DELETE = mcpMethodNotAllowedResponse;
export const PATCH = mcpMethodNotAllowedResponse;
export const PUT = mcpMethodNotAllowedResponse;
export const OPTIONS = mcpMethodNotAllowedResponse;

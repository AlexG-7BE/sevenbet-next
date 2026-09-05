import { mcpMethodNotAllowedResponse, runMcpPostBoundary } from "@/lib/mcp/reliability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request) {
  return runMcpPostBoundary(async () => {
    const { handleCommercialMcpPost } = await import("@/lib/mcp/commercial/post-handler");
    return handleCommercialMcpPost(request);
  });
}

export const GET = mcpMethodNotAllowedResponse;
export const DELETE = mcpMethodNotAllowedResponse;
export const PATCH = mcpMethodNotAllowedResponse;
export const PUT = mcpMethodNotAllowedResponse;
export const OPTIONS = mcpMethodNotAllowedResponse;

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { privateNoStore, readBoundedBody } from "@/lib/mcp/commercial/http";
import { CommercialMcpAuthError, validateCommercialMcpAccessToken } from "@/lib/mcp/commercial/oauth";
import { commercialMcpRateLimitKey, consumeCommercialMcpRateLimit } from "@/lib/mcp/commercial/rate-limit";
import { mediaMcpAuthenticateHeader, mediaMcpDisabledResponse, resolveMediaMcpConfig } from "@/lib/mcp/media/config";
import { createMediaMcpServer } from "@/lib/mcp/media/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let config;
  try { config = resolveMediaMcpConfig(request.url); } catch { return mediaMcpDisabledResponse(); }
  if (!config) return mediaMcpDisabledResponse();
  const rate = await consumeCommercialMcpRateLimit({ bucket: "media-resource-auth", key: commercialMcpRateLimitKey(request), limit: 180, windowMs: 10 * 60 * 1_000 });
  if (!rate.allowed) return privateNoStore(Response.json({ jsonrpc: "2.0", error: { code: -32002, message: "Media Operations authentication rate limit exceeded" }, id: null }, { status: 429, headers: { "Retry-After": "600", "WWW-Authenticate": mediaMcpAuthenticateHeader(config) } }));
  let token;
  try { token = await validateCommercialMcpAccessToken(request, config); }
  catch (error) {
    const message = error instanceof CommercialMcpAuthError ? error.message : "Authentication required";
    return Response.json({ jsonrpc: "2.0", error: { code: -32001, message }, id: null }, { status: error instanceof CommercialMcpAuthError ? error.status : 401, headers: { "Cache-Control": "no-store", "WWW-Authenticate": mediaMcpAuthenticateHeader(config), "Access-Control-Expose-Headers": "WWW-Authenticate" } });
  }
  let downstream: Request;
  try {
    const body = await readBoundedBody(request, 256 * 1024);
    downstream = new Request(request.url, { method: "POST", headers: request.headers, body });
  } catch { return privateNoStore(Response.json({ jsonrpc: "2.0", error: { code: -32600, message: "MCP request is too large" }, id: null }, { status: 413 })); }
  const server = createMediaMcpServer(token, config);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(downstream);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } finally { await server.close(); }
}

export function GET() { return privateNoStore(Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } })); }
export function DELETE() { return privateNoStore(Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } })); }

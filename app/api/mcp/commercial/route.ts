import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import {
  commercialMcpAuthenticateHeader,
  commercialMcpDisabledResponse,
  resolveCommercialMcpConfig,
} from "@/lib/mcp/commercial/config";
import { privateNoStore, readBoundedBody } from "@/lib/mcp/commercial/http";
import {
  CommercialMcpAuthError,
  validateCommercialMcpAccessToken,
} from "@/lib/mcp/commercial/oauth";
import { commercialMcpRateLimitKey, consumeCommercialMcpRateLimit } from "@/lib/mcp/commercial/rate-limit";
import { createCommercialMcpServer } from "@/lib/mcp/commercial/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let config;
  try {
    config = resolveCommercialMcpConfig(request.url);
  } catch {
    return commercialMcpDisabledResponse();
  }
  if (!config) return commercialMcpDisabledResponse();

  const authenticationRate = await consumeCommercialMcpRateLimit({
    bucket: "resource-auth",
    key: commercialMcpRateLimitKey(request),
    limit: 240,
    windowMs: 10 * 60 * 1_000,
  });
  if (!authenticationRate.allowed) {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Commercial MCP authentication rate limit exceeded" }, id: null },
      {
        status: 429,
        headers: {
          "Retry-After": "600",
          "WWW-Authenticate": commercialMcpAuthenticateHeader(config),
        },
      },
    ));
  }

  let token;
  try {
    token = await validateCommercialMcpAccessToken(request, config);
  } catch (error) {
    const message = error instanceof CommercialMcpAuthError ? error.message : "Authentication required";
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32001, message }, id: null },
      {
        status: error instanceof CommercialMcpAuthError ? error.status : 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": commercialMcpAuthenticateHeader(config),
          "Access-Control-Expose-Headers": "WWW-Authenticate",
        },
      },
    );
  }

  let downstreamRequest: Request;
  try {
    const body = await readBoundedBody(request, 256 * 1_024);
    downstreamRequest = new Request(request.url, { method: "POST", headers: request.headers, body });
  } catch {
    return privateNoStore(Response.json({ jsonrpc: "2.0", error: { code: -32600, message: "MCP request is too large" }, id: null }, { status: 413 }));
  }

  const server = createCommercialMcpServer(token, config);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(downstreamRequest);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } finally {
    await server.close();
  }
}

export function GET() {
  return privateNoStore(Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } }));
}

export function DELETE() {
  return privateNoStore(Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } }));
}

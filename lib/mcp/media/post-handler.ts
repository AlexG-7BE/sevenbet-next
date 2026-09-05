import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { privateNoStore, readBoundedBody } from "@/lib/mcp/commercial/http";
import { CommercialMcpAuthError, validateCommercialMcpAccessToken } from "@/lib/mcp/commercial/oauth";
import { commercialMcpRateLimitKey, consumeCommercialMcpRateLimit } from "@/lib/mcp/commercial/rate-limit";
import { mediaMcpAuthenticateHeader, mediaMcpDisabledResponse, resolveMediaMcpConfig } from "@/lib/mcp/media/config";
import { createMediaMcpServer } from "@/lib/mcp/media/server";
import { mcpDatabaseUnavailableResponse } from "@/lib/mcp/reliability";

export async function handleMediaMcpPost(request: Request) {
  let config;
  try {
    config = resolveMediaMcpConfig(request.url);
  } catch {
    return mediaMcpDisabledResponse();
  }
  if (!config) return mediaMcpDisabledResponse();

  const rate = await consumeCommercialMcpRateLimit({
    bucket: "media-resource-auth",
    key: commercialMcpRateLimitKey(request),
    limit: 180,
    windowMs: 10 * 60 * 1_000,
  });
  if (!rate.allowed) {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Media Operations authentication rate limit exceeded" }, id: null },
      { status: 429, headers: { "Retry-After": "600", "WWW-Authenticate": mediaMcpAuthenticateHeader(config) } },
    ));
  }

  let token;
  try {
    token = await validateCommercialMcpAccessToken(request, config);
  } catch (error) {
    if (!(error instanceof CommercialMcpAuthError)) throw error;
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32001, message: error.message }, id: null },
      {
        status: error.status,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": mediaMcpAuthenticateHeader(config),
          "Access-Control-Expose-Headers": "WWW-Authenticate",
        },
      },
    );
  }

  let downstream: Request;
  try {
    const body = await readBoundedBody(request, 256 * 1_024);
    downstream = new Request(request.url, { method: "POST", headers: request.headers, body });
  } catch {
    return privateNoStore(Response.json({ jsonrpc: "2.0", error: { code: -32600, message: "MCP request is too large" }, id: null }, { status: 413 }));
  }

  let transientDatabaseFailure = false;
  const server = createMediaMcpServer(
    token,
    config,
    undefined,
    undefined,
    () => { transientDatabaseFailure = true; },
  );
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(downstream);
    if (transientDatabaseFailure) return mcpDatabaseUnavailableResponse();
    response.headers.set("Cache-Control", "no-store");
    return response;
  } finally {
    await server.close();
  }
}

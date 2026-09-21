import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { LEARN_APPLY_MAX_BODY_BYTES } from "@/lib/learn-apply/contract";
import {
  authenticateLearnMcpRequest,
  learnMcpUnauthorizedResponse,
  learnMcpUnavailableResponse,
  resolveLearnMcpConfig,
} from "@/lib/mcp/learn/config";
import { consumeLearnMcpRateLimit, learnMcpRequestKey } from "@/lib/mcp/learn/rate-limit";
import { createLearnMcpServer } from "@/lib/mcp/learn/server";

function privateNoStore(response: Response) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

async function boundedBody(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > LEARN_APPLY_MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > LEARN_APPLY_MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  return body;
}

export async function handleLearnMcpPost(request: Request) {
  let config;
  try {
    config = resolveLearnMcpConfig();
  } catch {
    return learnMcpUnavailableResponse();
  }
  if (!config) return learnMcpUnavailableResponse();

  const key = learnMcpRequestKey(request);
  const authenticationRate = consumeLearnMcpRateLimit(`auth:${key}`, 60, 10 * 60 * 1_000);
  if (!authenticationRate.allowed) {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Learn MCP authentication rate limit exceeded" }, id: null },
      { status: 429, headers: { "Retry-After": String(authenticationRate.retryAfterSeconds) } },
    ));
  }
  if (!authenticateLearnMcpRequest(request, config)) return learnMcpUnauthorizedResponse();

  const mutationRate = consumeLearnMcpRateLimit(`mutation:${key}`, 20, 10 * 60 * 1_000);
  if (!mutationRate.allowed) {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Learn MCP mutation rate limit exceeded" }, id: null },
      { status: 429, headers: { "Retry-After": String(mutationRate.retryAfterSeconds) } },
    ));
  }

  let body: string;
  try {
    body = await boundedBody(request);
  } catch {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "Learn MCP request is too large" }, id: null },
      { status: 413 },
    ));
  }
  const downstream = new Request(request.url, { method: "POST", headers: request.headers, body });
  const server = createLearnMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    return privateNoStore(await transport.handleRequest(downstream));
  } finally {
    await server.close();
  }
}

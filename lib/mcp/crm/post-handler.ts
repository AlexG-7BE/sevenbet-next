import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import {
  authenticateCrmMcpRequest,
  crmMcpUnauthorizedResponse,
  crmMcpUnavailableResponse,
  resolveCrmMcpConfig,
} from "@/lib/mcp/crm/config";
import { createCrmMcpServer } from "@/lib/mcp/crm/server";
import { createMcpRateLimiter, mcpRequestKey } from "@/lib/mcp/rate-limit";

export const CRM_MCP_MAX_BODY_BYTES = 1_048_576;

const WINDOW_MS = 10 * 60 * 1_000;
const rateLimiter = createMcpRateLimiter();

export function clearCrmMcpRateLimitsForTests() {
  rateLimiter.clear();
}

function privateNoStore(response: Response) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function rateLimited(message: string, retryAfterSeconds: number) {
  return privateNoStore(Response.json(
    { jsonrpc: "2.0", error: { code: -32002, message }, id: null },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  ));
}

async function boundedBody(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > CRM_MCP_MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > CRM_MCP_MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  return body;
}

export async function handleCrmMcpPost(request: Request) {
  let config;
  try {
    config = resolveCrmMcpConfig();
  } catch {
    return crmMcpUnavailableResponse();
  }
  if (!config) return crmMcpUnavailableResponse();

  const key = mcpRequestKey(request);
  const authenticationRate = rateLimiter.consume(`auth:${key}`, 1_200, WINDOW_MS);
  if (!authenticationRate.allowed) {
    return rateLimited("CRM MCP authentication rate limit exceeded", authenticationRate.retryAfterSeconds);
  }
  if (!authenticateCrmMcpRequest(request, config)) return crmMcpUnauthorizedResponse();

  const requestRate = rateLimiter.consume(`request:${key}`, 600, WINDOW_MS);
  if (!requestRate.allowed) {
    return rateLimited("CRM MCP request rate limit exceeded", requestRate.retryAfterSeconds);
  }

  let body: string;
  try {
    body = await boundedBody(request);
  } catch {
    return privateNoStore(Response.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "CRM MCP request is too large" }, id: null },
      { status: 413 },
    ));
  }
  const downstream = new Request(request.url, { method: "POST", headers: request.headers, body });
  const server = createCrmMcpServer({ actorId: config.actorId });
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

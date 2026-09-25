import { createHash, timingSafeEqual } from "node:crypto";

export const CRM_MCP_PATH = "/api/mcp/crm";

type CrmMcpEnvironment = Record<string, string | undefined> & {
  CRM_MCP_ENABLED?: string;
  CRM_MCP_SERVICE_TOKEN?: string;
  CRM_MCP_ACTOR_ID?: string;
};

export type CrmMcpConfig = {
  serviceToken: string;
  actorId: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveCrmMcpConfig(environment: CrmMcpEnvironment = process.env): CrmMcpConfig | null {
  if (environment.CRM_MCP_ENABLED?.trim() !== "true") return null;
  const serviceToken = environment.CRM_MCP_SERVICE_TOKEN?.trim();
  if (!serviceToken || Buffer.byteLength(serviceToken) < 32) {
    throw new Error("CRM_MCP_SERVICE_TOKEN must contain at least 32 bytes");
  }
  const actorId = environment.CRM_MCP_ACTOR_ID?.trim() ?? "";
  if (!uuidPattern.test(actorId)) throw new Error("CRM_MCP_ACTOR_ID must be an AdminUser UUID");
  return { serviceToken, actorId };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authenticateCrmMcpRequest(request: Request, config: CrmMcpConfig) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([^\s]+)$/);
  const presented = digest(match?.[1] ?? "invalid-crm-mcp-credential");
  const expected = digest(config.serviceToken);
  return Boolean(match) && timingSafeEqual(presented, expected);
}

export function crmMcpUnavailableResponse() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "CRM MCP is not configured" }, id: null },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function crmMcpUnauthorizedResponse() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message: "Valid CRM MCP service credentials are required" }, id: null },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": "Bearer realm=\"B4GAMBLE CRM MCP\"",
      },
    },
  );
}

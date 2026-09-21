import { createHash, timingSafeEqual } from "node:crypto";

export const LEARN_MCP_PATH = "/api/mcp/learn";

type LearnMcpEnvironment = Record<string, string | undefined> & {
  LEARN_MCP_ENABLED?: string;
  LEARN_MCP_SERVICE_TOKEN?: string;
  LEARN_MCP_ACTOR_ID?: string;
};

export type LearnMcpConfig = {
  serviceToken: string;
};

export function resolveLearnMcpConfig(environment: LearnMcpEnvironment = process.env) : LearnMcpConfig | null {
  if (environment.LEARN_MCP_ENABLED?.trim() !== "true") return null;
  const serviceToken = environment.LEARN_MCP_SERVICE_TOKEN?.trim();
  if (!serviceToken || Buffer.byteLength(serviceToken) < 32) {
    throw new Error("LEARN_MCP_SERVICE_TOKEN must contain at least 32 bytes");
  }
  if (!environment.LEARN_MCP_ACTOR_ID?.trim()) throw new Error("LEARN_MCP_ACTOR_ID is required");
  return { serviceToken };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authenticateLearnMcpRequest(request: Request, config: LearnMcpConfig) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([^\s]+)$/);
  const presented = digest(match?.[1] ?? "invalid-learn-mcp-credential");
  const expected = digest(config.serviceToken);
  return Boolean(match) && timingSafeEqual(presented, expected);
}

export function learnMcpUnavailableResponse() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Learn MCP is not configured" }, id: null },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function learnMcpUnauthorizedResponse() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message: "Valid Learn MCP service credentials are required" }, id: null },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": "Bearer realm=\"B4GAMBLE Learn MCP\"",
      },
    },
  );
}

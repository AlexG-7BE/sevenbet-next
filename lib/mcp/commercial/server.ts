import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  CommercialMcpDuplicateSchema,
  CommercialMcpGetSchema,
  CommercialMcpListSchema,
  CommercialMcpResearchBundleSchema,
} from "@/lib/commercial/commercial-mcp-contract";
import { commercialMcpService } from "@/lib/commercial/commercial-mcp-service";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import { commercialMcpAuthenticateHeader, type CommercialMcpConfig } from "@/lib/mcp/commercial/config";
import type { CommercialMcpTokenContext } from "@/lib/mcp/commercial/oauth";
import { consumeCommercialMcpRateLimit } from "@/lib/mcp/commercial/rate-limit";
import { ServiceError } from "@/lib/services/service-error";

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  securitySchemes: Array<{ type: "oauth2"; scopes: string[] }>;
  _meta: { securitySchemes: Array<{ type: "oauth2"; scopes: string[] }> };
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
};

type CommercialMcpServiceAdapter = {
  list(value: unknown): Promise<Record<string, unknown>>;
  get(value: unknown): Promise<Record<string, unknown>>;
  findPossibleDuplicates(value: unknown): Promise<Record<string, unknown>>;
  upsertResearchBundle(value: unknown, context: { actorId: string; clientId: string }): Promise<Record<string, unknown>>;
};

type CommercialMcpRateLimiter = typeof consumeCommercialMcpRateLimit;

const readSecurity = [{ type: "oauth2" as const, scopes: ["commercial:read"] }];
const writeSecurity = [{ type: "oauth2" as const, scopes: ["commercial:safe_write"] }];

export const commercialMcpTools: ToolDefinition[] = [
  {
    name: "commercial_list_opportunities",
    title: "List commercial opportunities",
    description: "List a bounded page of B4GAMBLE Commercial CRM opportunities. Use this to orient research and avoid creating duplicate prospects.",
    inputSchema: z.toJSONSchema(CommercialMcpListSchema) as Record<string, unknown>,
    securitySchemes: readSecurity,
    _meta: { securitySchemes: readSecurity },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "commercial_get_opportunity",
    title: "Get a commercial opportunity",
    description: "Read the bounded operating record for one Commercial CRM opportunity, including provenance, B2B contacts, tasks, drafts, terms, and review proposals.",
    inputSchema: z.toJSONSchema(CommercialMcpGetSchema) as Record<string, unknown>,
    securitySchemes: readSecurity,
    _meta: { securitySchemes: readSecurity },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "commercial_find_possible_duplicates",
    title: "Find possible commercial duplicates",
    description: "Check bounded identity candidates before creating a prospect. Treat possible matches as a review signal; never silently merge uncertain organisations.",
    inputSchema: z.toJSONSchema(CommercialMcpDuplicateSchema) as Record<string, unknown>,
    securitySchemes: readSecurity,
    _meta: { securitySchemes: readSecurity },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "commercial_upsert_research_bundle",
    title: "Upsert a commercial research bundle",
    description: "Use this after researching one prospect and collecting source evidence. It transactionally creates or updates only bounded CRM research, contacts, notes, tasks, next actions, drafts, evidenced received/proposed terms, qualification/application-readiness proposals, and at most a founder-review activation packet. It cannot approve, activate, send, submit, accept terms, or mutate Production runtime authority.",
    inputSchema: z.toJSONSchema(CommercialMcpResearchBundleSchema) as Record<string, unknown>,
    securitySchemes: writeSecurity,
    _meta: { securitySchemes: writeSecurity },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

function toolResult(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function toolError(error: unknown) {
  const message = error instanceof ServiceError ? error.message : "Commercial MCP tool call failed";
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function insufficientScope(config: CommercialMcpConfig, scope: string) {
  return {
    content: [{ type: "text" as const, text: `OAuth scope ${scope} is required` }],
    isError: true,
    _meta: { "mcp/www_authenticate": [commercialMcpAuthenticateHeader(config, scope)] },
  };
}

export function createCommercialMcpServer(
  token: CommercialMcpTokenContext,
  config: CommercialMcpConfig,
  service: CommercialMcpServiceAdapter = commercialMcpService,
  rateLimiter: CommercialMcpRateLimiter = consumeCommercialMcpRateLimit,
  onTransientDatabaseFailure: (error: unknown) => void = () => {},
) {
  const server = new Server(
    { name: "b4gamble-commercial-ops", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: commercialMcpTools,
  } as never));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = commercialMcpTools.find((item) => item.name === request.params.name);
    if (!tool) throw new McpError(ErrorCode.MethodNotFound, "Unknown Commercial MCP tool");
    const write = tool.name === "commercial_upsert_research_bundle";
    const requiredScope = write ? "commercial:safe_write" : "commercial:read";
    if (!token.scopes.has(requiredScope)) return insufficientScope(config, requiredScope) as never;

    try {
      const rate = await rateLimiter({
        bucket: write ? "write" : "read",
        key: `${token.staff.id}:${token.clientId}`,
        limit: write ? 20 : 120,
        windowMs: 10 * 60 * 1_000,
      });
      if (!rate.allowed) {
        return {
          content: [{ type: "text" as const, text: "Commercial MCP tool rate limit exceeded" }],
          isError: true,
        };
      }

      const args = request.params.arguments ?? {};
      switch (tool.name) {
        case "commercial_list_opportunities": return toolResult(await service.list(args));
        case "commercial_get_opportunity": return toolResult(await service.get(args));
        case "commercial_find_possible_duplicates": return toolResult(await service.findPossibleDuplicates(args));
        case "commercial_upsert_research_bundle": return toolResult(await service.upsertResearchBundle(args, { actorId: token.staff.id, clientId: token.clientId }));
        default: throw new McpError(ErrorCode.MethodNotFound, "Unknown Commercial MCP tool");
      }
    } catch (error) {
      if (isTransientDatabaseAvailabilityError(error)) onTransientDatabaseFailure(error);
      return toolError(error);
    }
  });

  return server;
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  mediaAnalyzeAndPlanInputSchema,
  mediaApplyDraftPlanInputSchema,
  mediaGetPlanInputSchema,
  mediaIngestPartnerSnippetInputSchema,
  mediaListRecentIngestionsInputSchema,
} from "@/lib/media-operations/contracts";
import { mediaOperationsService } from "@/lib/media-operations/service";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import type { CommercialMcpTokenContext } from "@/lib/mcp/commercial/oauth";
import { consumeCommercialMcpRateLimit } from "@/lib/mcp/commercial/rate-limit";
import { mediaMcpAuthenticateHeader, type MediaMcpConfig } from "@/lib/mcp/media/config";
import { ServiceError } from "@/lib/services/service-error";

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  securitySchemes: Array<{ type: "oauth2"; scopes: string[] }>;
  _meta: { securitySchemes: Array<{ type: "oauth2"; scopes: string[] }> };
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
};

const readSecurity = [{ type: "oauth2" as const, scopes: ["media:read"] }];
const writeSecurity = [{ type: "oauth2" as const, scopes: ["media:safe_write"] }];

export const mediaMcpTools: ToolDefinition[] = [
  { name: "media_ingest_partner_snippet", title: "Ingest a partner creative snippet", description: "Parse untrusted partner HTML or HTTPS image URLs without execution, perform SSRF-safe raster retrieval, and create or reuse validated first-party MediaAssets plus a durable ingestion plan. It never creates a CTA, route, publication, or tracking activation.", inputSchema: z.toJSONSchema(mediaIngestPartnerSnippetInputSchema) as Record<string, unknown>, securitySchemes: writeSecurity, _meta: { securitySchemes: writeSecurity }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } },
  { name: "media_analyze_and_plan", title: "Analyze media and build a placement plan", description: "Run deterministic analysis and, when approved runtime is available, bounded visual classification; then create scored draft-only placement recommendations. Semantic output is advisory and never publishes.", inputSchema: z.toJSONSchema(mediaAnalyzeAndPlanInputSchema) as Record<string, unknown>, securitySchemes: writeSecurity, _meta: { securitySchemes: writeSecurity }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
  { name: "media_apply_draft_plan", title: "Apply or roll back a draft media plan", description: "Apply only eligible recommendations to draft media assignments, or remove only assignments owned by this plan. Existing assignments are protected unless replacement is explicitly requested. Assets are never deleted and nothing is published.", inputSchema: z.toJSONSchema(mediaApplyDraftPlanInputSchema) as Record<string, unknown>, securitySchemes: writeSecurity, _meta: { securitySchemes: writeSecurity }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: "media_get_plan", title: "Get a media ingestion plan", description: "Read one audit-safe Media Operations plan, including extracted evidence, first-party previews, semantic results, draft recommendations, and operations. Raw tracking URLs and pasted HTML are never returned.", inputSchema: z.toJSONSchema(mediaGetPlanInputSchema) as Record<string, unknown>, securitySchemes: readSecurity, _meta: { securitySchemes: readSecurity }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: "media_list_recent_ingestions", title: "List recent media ingestions", description: "List a bounded set of recent audit-safe Media Operations plans for orientation and follow-up.", inputSchema: z.toJSONSchema(mediaListRecentIngestionsInputSchema) as Record<string, unknown>, securitySchemes: readSecurity, _meta: { securitySchemes: readSecurity }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
];

type Adapter = Pick<typeof mediaOperationsService, "ingest" | "analyze" | "apply" | "get" | "listRecent">;
type RateLimiter = typeof consumeCommercialMcpRateLimit;

function result(value: unknown) {
  const structuredContent = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : { result: value };
  return { content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }], structuredContent };
}

function failure(error: unknown) {
  return { content: [{ type: "text" as const, text: error instanceof ServiceError ? error.message : "Media Operations MCP tool call failed" }], isError: true };
}

export function createMediaMcpServer(
  token: CommercialMcpTokenContext,
  config: MediaMcpConfig,
  service: Adapter = mediaOperationsService,
  rateLimiter: RateLimiter = consumeCommercialMcpRateLimit,
  onTransientDatabaseFailure: (error: unknown) => void = () => {},
) {
  const server = new Server({ name: "b4gamble-media-operations", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: mediaMcpTools } as never));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = mediaMcpTools.find((item) => item.name === request.params.name);
    if (!tool) throw new McpError(ErrorCode.MethodNotFound, "Unknown Media Operations MCP tool");
    const write = !["media_get_plan", "media_list_recent_ingestions"].includes(tool.name);
    const requiredScope = write ? "media:safe_write" : "media:read";
    if (!token.scopes.has(requiredScope)) return { content: [{ type: "text" as const, text: `OAuth scope ${requiredScope} is required` }], isError: true, _meta: { "mcp/www_authenticate": [mediaMcpAuthenticateHeader(config, requiredScope)] } } as never;
    try {
      const rate = await rateLimiter({ bucket: write ? "media-write" : "media-read", key: `${token.staff.id}:${token.clientId}`, limit: write ? 20 : 120, windowMs: 10 * 60 * 1_000 });
      if (!rate.allowed) return { content: [{ type: "text" as const, text: "Media Operations MCP tool rate limit exceeded" }], isError: true };
      const args = request.params.arguments ?? {};
      const actor = { actorId: token.staff.id, source: "CHATGPT_WORK" as const };
      switch (tool.name) {
        case "media_ingest_partner_snippet": return result(await service.ingest(args, actor));
        case "media_analyze_and_plan": return result(await service.analyze(args, actor));
        case "media_apply_draft_plan": return result(await service.apply(args, actor));
        case "media_get_plan": return result(await service.get(args));
        case "media_list_recent_ingestions": return result({ plans: await service.listRecent(args) });
        default: throw new McpError(ErrorCode.MethodNotFound, "Unknown Media Operations MCP tool");
      }
    } catch (error) {
      if (isTransientDatabaseAvailabilityError(error)) onTransientDatabaseFailure(error);
      return failure(error);
    }
  });
  return server;
}

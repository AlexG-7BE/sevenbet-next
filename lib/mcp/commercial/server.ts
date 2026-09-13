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
import { PartnerTrackingRegistrationSchema } from "@/lib/commercial/partner-tracking-registration-contract";
import { commercialMcpService } from "@/lib/commercial/commercial-mcp-service";
import { isTransientDatabaseAvailabilityError } from "@/lib/db/transient-availability";
import { commercialMcpAuthenticateHeader, type CommercialMcpConfig } from "@/lib/mcp/commercial/config";
import type { CommercialMcpTokenContext } from "@/lib/mcp/commercial/oauth";
import {
  consumeCommercialMcpRateLimit,
  recordPartnerTrackingRegistrationMetric,
  type PartnerTrackingRegistrationMetric,
} from "@/lib/mcp/commercial/rate-limit";
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
  registerPartnerTrackingLink(value: unknown, context: { actorId: string; clientId: string }): Promise<Record<string, unknown>>;
};

type CommercialMcpRateLimiter = typeof consumeCommercialMcpRateLimit;
type PartnerTrackingObserver = (input: {
  metric: PartnerTrackingRegistrationMetric;
  increment?: number;
}) => Promise<void>;

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
  {
    name: "commercial_register_partner_tracking_link",
    title: "Register partner tracking link",
    description: "Delegate an explicit Partner × Casino tracking command to the canonical commercial application service. Optional geo adds one exact market; optional supportedGeos adds a bounded set for generic-link reuse. The service confirms the canonical relationship, validates the route once, normalizes transitional tracking and offer records, and reconciles legally eligible MarketActivations. MCP does not derive permission from CRM, partner lifecycle flags, or static support evidence; it never creates partners or casinos or bypasses legal and regulatory blocks.",
    inputSchema: z.toJSONSchema(PartnerTrackingRegistrationSchema) as Record<string, unknown>,
    securitySchemes: writeSecurity,
    _meta: { securitySchemes: writeSecurity },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
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

function registrationToolError(error: unknown) {
  if (!(error instanceof ServiceError) || !error.details || typeof error.details !== "object") return toolError(error);
  const details = error.details as Record<string, unknown>;
  const reason = typeof details.reason === "string" && /^[A-Z0-9_]+$/.test(details.reason)
    ? details.reason
    : "PARTNER_TRACKING_REGISTRATION_FAILED";
  const candidates = Array.isArray(details.candidates)
    ? details.candidates.slice(0, 10).flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const record = candidate as Record<string, unknown>;
        const id = typeof record.id === "string" ? record.id : null;
        const name = typeof record.name === "string" ? record.name.slice(0, 200) : null;
        const slug = typeof record.slug === "string" ? record.slug.slice(0, 200) : null;
        return id && name ? [{ id, name, ...(slug ? { slug } : {}) }] : [];
      })
    : [];
  const value = {
    status: "ERROR",
    code: error.code,
    reason,
    message: error.message,
    candidates,
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
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

async function observeRegistrationResult(
  observer: PartnerTrackingObserver,
  result: Record<string, unknown>,
) {
  const metrics: Array<{ metric: PartnerTrackingRegistrationMetric; increment?: number }> = [];
  const verification = result.verification;
  if (verification === "HEALTHY" || verification === "ALREADY_REGISTERED") metrics.push({ metric: "HEALTHY_VERIFICATION" });
  if (verification === "BROKEN") metrics.push({ metric: "BROKEN_VERIFICATION" });
  if (verification === "INCONCLUSIVE") metrics.push({ metric: "INCONCLUSIVE_VERIFICATION" });
  const rows = Array.isArray(result.results) ? result.results : [];
  const count = (finalState: string) => rows.filter((row) => row && typeof row === "object" && "finalState" in row && row.finalState === finalState).length;
  const activated = count("ACTIVE_HEALTHY");
  const blocked = count("BLOCKED_BY_LAW");
  const regulatory = count("ACTION_REQUIRED_REGULATORY");
  if (activated) metrics.push({ metric: "ACTIVATED_GEO", increment: activated });
  if (blocked) metrics.push({ metric: "BLOCKED_LEGAL_GEO", increment: blocked });
  if (regulatory) metrics.push({ metric: "REGULATORY_ACTION_GEO", increment: regulatory });
  await Promise.allSettled(metrics.map((metric) => observer(metric)));
}

function isResolutionFailure(error: unknown) {
  if (!(error instanceof ServiceError) || !error.details || typeof error.details !== "object") return false;
  const reason = "reason" in error.details && typeof error.details.reason === "string" ? error.details.reason : "";
  return /^(CURRENT_PARTNER|PARTNER_NETWORK|CASINO|PARTNER_CASINO)/.test(reason);
}

export function createCommercialMcpServer(
  token: CommercialMcpTokenContext,
  config: CommercialMcpConfig,
  service: CommercialMcpServiceAdapter = commercialMcpService,
  rateLimiter: CommercialMcpRateLimiter = consumeCommercialMcpRateLimit,
  onTransientDatabaseFailure: (error: unknown) => void = () => {},
  partnerTrackingObserver: PartnerTrackingObserver = recordPartnerTrackingRegistrationMetric,
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
    const write = tool.name === "commercial_upsert_research_bundle"
      || tool.name === "commercial_register_partner_tracking_link";
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
        case "commercial_register_partner_tracking_link": {
          await Promise.allSettled([partnerTrackingObserver({ metric: "REQUEST" })]);
          const result = await service.registerPartnerTrackingLink(args, { actorId: token.staff.id, clientId: token.clientId });
          await observeRegistrationResult(partnerTrackingObserver, result);
          return toolResult(result);
        }
        default: throw new McpError(ErrorCode.MethodNotFound, "Unknown Commercial MCP tool");
      }
    } catch (error) {
      if (isTransientDatabaseAvailabilityError(error)) onTransientDatabaseFailure(error);
      if (tool.name === "commercial_register_partner_tracking_link" && isResolutionFailure(error)) {
        await Promise.allSettled([partnerTrackingObserver({ metric: "RESOLUTION_FAILURE" })]);
      }
      return tool.name === "commercial_register_partner_tracking_link"
        ? registrationToolError(error)
        : toolError(error);
    }
  });

  return server;
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  CommercialOpportunityCatalogLinkSchema,
  CommercialOpportunityDuplicateSchema,
  CommercialOpportunityGetSchema,
  CommercialOpportunityListSchema,
  CommercialOpportunityStageTransitionSchema,
  CommercialResearchBundleSchema,
} from "@/lib/commercial/commercial-opportunity-research-contract";
import { commercialOpportunityResearchService } from "@/lib/commercial/commercial-opportunity-research-service";
import { ServiceError } from "@/lib/services/service-error";

// Every write through this endpoint is attributed to this channel. Research
// bundles use one constant source reference so child idempotency keys stay
// stable across bundles for the same opportunity.
export const CRM_MCP_CHANNEL = "crm-mcp";
export const CRM_MCP_SOURCE_REFERENCE = "crm-mcp";

function inputSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
}

const readAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const writeAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const crmMcpTools = [
  {
    name: "crm_list_opportunities",
    title: "List Commercial CRM opportunities",
    description: "List partner opportunities in the B4GAMBLE Commercial CRM, newest first, optionally filtered by name, stages and priorities.",
    inputSchema: inputSchema(CommercialOpportunityListSchema),
    annotations: readAnnotations,
  },
  {
    name: "crm_get_opportunity",
    title: "Get one Commercial CRM opportunity",
    description: "Return one opportunity with its evidence, contacts, activities, applications, terms, tasks and activation packets.",
    inputSchema: inputSchema(CommercialOpportunityGetSchema),
    annotations: readAnnotations,
  },
  {
    name: "crm_find_possible_duplicates",
    title: "Find possible duplicate opportunities",
    description: "Find existing opportunities whose display or legal name may identify the same organisation. Nothing is merged.",
    inputSchema: inputSchema(CommercialOpportunityDuplicateSchema),
    annotations: readAnnotations,
  },
  {
    name: "crm_upsert_research_bundle",
    title: "Record a Commercial research bundle",
    description: "Create or update one opportunity with evidence, contacts, notes, tasks, next action, drafts, evidenced terms, proposals and an activation packet in one transaction. An uncertain identity returns POSSIBLE_DUPLICATE without writing unless possibleDuplicateOfId is given. Replaying the same bundle idempotencyKey returns IDEMPOTENT_REPLAY. Child idempotency keys are stable per opportunity across bundles: reuse a key to avoid duplicating the same evidence, and use a new key to record a newer profile or next action. Drafts are never sent.",
    inputSchema: inputSchema(CommercialResearchBundleSchema),
    annotations: writeAnnotations,
  },
  {
    name: "crm_transition_stage",
    title: "Move an opportunity to a new CRM stage",
    description: "Change one opportunity's CRM stage under the staff evidence rules: QUALIFIED needs a rationale and QUALIFICATION evidence; APPLICATION_READY needs a draft or prepared application and a next action; APPLIED needs EXTERNAL_ACTION evidence and a submitted or sent record; DUE_DILIGENCE, NEGOTIATING, APPROVED and REJECTED need evidence of that category; ON_HOLD needs a reason. evidenceIds must belong to the opportunity. ACTIVE is derived from live routes and can be neither set nor cleared. A CRM stage never changes public offers, buttons or routes. Replaying the same idempotencyKey returns IDEMPOTENT_REPLAY.",
    inputSchema: inputSchema(CommercialOpportunityStageTransitionSchema),
    annotations: writeAnnotations,
  },
  {
    name: "crm_link_catalog",
    title: "Link an opportunity to catalog identities",
    description: "Set or clear (null) the opportunity's references to an existing Casino, AffiliateNetwork, AffiliateProgram, CasinoOperator or CasinoBrand. Each referenced record must already exist and is only referenced: no catalog record, partner relationship, market activation, tracking, routing or offer is created or changed. Replaying the same idempotencyKey returns IDEMPOTENT_REPLAY.",
    inputSchema: inputSchema(CommercialOpportunityCatalogLinkSchema),
    annotations: writeAnnotations,
  },
] as const;

type CrmService = Pick<
  typeof commercialOpportunityResearchService,
  "list" | "get" | "findPossibleDuplicates" | "upsertResearchBundle" | "resolveDelegatingActor" | "transitionStage" | "linkCatalog"
>;

const nonRetryableConfigurationCodes = new Set(["SERVICE_ACTOR_NOT_CONFIGURED", "SERVICE_ACTOR_INVALID"]);

function success(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function failure(error: unknown) {
  const details = error instanceof ServiceError && error.details && typeof error.details === "object" && !Array.isArray(error.details)
    ? error.details as Record<string, unknown>
    : null;
  const safe = error instanceof ServiceError
    ? {
        result: "ERROR",
        error: {
          code: error.code,
          message: error.message,
          persistence: "NOT_COMMITTED",
          retryable: error.statusCode >= 500 && !nonRetryableConfigurationCodes.has(error.code),
          ...(details ? { details } : {}),
        },
      }
    : {
        result: "ERROR",
        error: {
          code: "CRM_OPERATION_FAILED",
          message: "The CRM operation failed before it completed.",
          persistence: "UNKNOWN",
          retryable: true,
        },
      };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(safe) }],
    structuredContent: safe,
    isError: true,
  };
}

export function createCrmMcpServer(options: { actorId: string; service?: CrmService }) {
  const service = options.service ?? commercialOpportunityResearchService;
  const context = { actorId: options.actorId, channel: CRM_MCP_CHANNEL };
  const handlers: Record<string, (args: Record<string, unknown>) => Promise<Record<string, unknown>>> = {
    crm_list_opportunities: (args) => service.list(args),
    crm_get_opportunity: (args) => service.get(args),
    crm_find_possible_duplicates: (args) => service.findPossibleDuplicates(args),
    crm_upsert_research_bundle: async (args) => {
      await service.resolveDelegatingActor(options.actorId);
      return service.upsertResearchBundle(args, { actorId: options.actorId, sourceReference: CRM_MCP_SOURCE_REFERENCE });
    },
    crm_transition_stage: async (args) => {
      await service.resolveDelegatingActor(options.actorId);
      return service.transitionStage(args, context);
    },
    crm_link_catalog: async (args) => {
      await service.resolveDelegatingActor(options.actorId);
      return service.linkCatalog(args, context);
    },
  };

  const server = new Server(
    { name: "b4gamble-commercial-crm", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: crmMcpTools } as never));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const handler = Object.hasOwn(handlers, request.params.name) ? handlers[request.params.name] : undefined;
    if (!handler) throw new McpError(ErrorCode.MethodNotFound, "Unknown CRM MCP tool");
    try {
      return success(await handler(request.params.arguments ?? {})) as never;
    } catch (error) {
      return failure(error) as never;
    }
  });
  return server;
}

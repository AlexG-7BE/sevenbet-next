import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  readSocialTraffic,
  SocialTrafficError,
  socialTrafficErrorResultSchema,
  socialTrafficInputSchema,
  socialTrafficResultSchema,
  type SocialTrafficReader,
} from "@/lib/analytics/social-traffic.server";
import {
  learnApplyErrorResultSchema,
  learnApplyInputSchema,
  learnApplyResultSchema,
} from "@/lib/learn-apply/contract";
import { learnApplyService } from "@/lib/learn-apply/service";
import {
  LearnContextError,
  learnContextErrorResultSchema,
  learnContextInputSchema,
  learnContextResultSchema,
  readLearnContext,
  type LearnContextReader,
} from "@/lib/learn-content-orchestrator/learn-context.server";
import {
  LearnSourceError,
  learnSourceErrorResultSchema,
  learnSourceInputSchema,
  learnSourceResultSchema,
  readLearnSource,
  type LearnSourceReader,
} from "@/lib/learn-content-orchestrator/learn-source.server";
import { ServiceError } from "@/lib/services/service-error";

function withoutSchemaDeclaration(schema: Record<string, unknown>) {
  const { $schema: _schema, ...rest } = schema;
  return rest;
}

/**
 * Read-only companion of learn_apply for MCP clients that run editorial work,
 * today the Founder's Claude Code (LEARN-SERVER-SWITCH-2026-10-01). It never
 * writes and returns only public editorial metadata.
 */
export const learnContextTool = {
  name: "learn_context",
  title: "Read the public Learn editorial context",
  description: "Read-only. Returns the bounded public editorial context for one configured launch language: metadata of published Articles (no prose) in the target locale plus the en-GB source guides, the registered categories, the ordered launch languages, the public Programme routes and the protected Help routes. It never creates, updates or publishes anything and returns no private data.",
  inputSchema: z.toJSONSchema(learnContextInputSchema) as Record<string, unknown>,
  outputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    oneOf: [
      withoutSchemaDeclaration(z.toJSONSchema(learnContextResultSchema) as Record<string, unknown>),
      withoutSchemaDeclaration(z.toJSONSchema(learnContextErrorResultSchema) as Record<string, unknown>),
    ],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/** Read-only text of one published Article, the source a localization starts from. */
export const learnSourceTool = {
  name: "learn_source",
  title: "Read a published Learn Article",
  description: "Read-only. Returns the public content of one published Learn Article by slug (title, excerpt, tags, SEO fields, hero alt text and body blocks), the source a localization is written from. Drafts and unpublished Articles are not returned, and nothing is written.",
  inputSchema: z.toJSONSchema(learnSourceInputSchema) as Record<string, unknown>,
  outputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    oneOf: [
      withoutSchemaDeclaration(z.toJSONSchema(learnSourceResultSchema) as Record<string, unknown>),
      withoutSchemaDeclaration(z.toJSONSchema(learnSourceErrorResultSchema) as Record<string, unknown>),
    ],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/**
 * Read-only site analytics for the Founder's Claude SMM agents (Founder, 3 Oct
 * 2026, SOCIAL-TRAFFIC-MCP-2026-10-03): aggregate counts of consented visits
 * and partner clicks per UTM source, campaign and post. No per-person data.
 */
export const socialTrafficTool = {
  name: "social_traffic",
  title: "Read social traffic to b4gamble.com",
  description: "Read-only aggregates. For a UTC date range (default the last 7 days, at most 92) returns, per UTM source, campaign and content (the post), all Production visits (every arrival, counted without cookies), consented visits (analytics sessions), partner-button clicks and clicks that reached the partner casino, with the top visitor countries; untagged visits from social-network referrers are grouped by network. Also returns site-wide totals. Counts only: no visitor, session, user, IP or email data, and nothing is written.",
  inputSchema: z.toJSONSchema(socialTrafficInputSchema) as Record<string, unknown>,
  outputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    oneOf: [
      withoutSchemaDeclaration(z.toJSONSchema(socialTrafficResultSchema) as Record<string, unknown>),
      withoutSchemaDeclaration(z.toJSONSchema(socialTrafficErrorResultSchema) as Record<string, unknown>),
    ],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const learnApplyTool = {
  name: "learn_apply",
  title: "Apply and publish a Learn Article",
  description: "Atomically create and publish one new canonical B4GAMBLE Learn Article, prepare first-party images, invalidate public caches, and verify the public projection. Existing Article slugs are rejected. An exact retry of the same CREATE requestId and intent may return NO_CHANGE; updates are not supported.",
  inputSchema: z.toJSONSchema(learnApplyInputSchema) as Record<string, unknown>,
  outputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    oneOf: [
      withoutSchemaDeclaration(z.toJSONSchema(learnApplyResultSchema) as Record<string, unknown>),
      withoutSchemaDeclaration(z.toJSONSchema(learnApplyErrorResultSchema) as Record<string, unknown>),
    ],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};

type LearnApplyAdapter = Pick<typeof learnApplyService, "apply">;

const nonRetryableConfigurationCodes = new Set([
  "SERVICE_ACTOR_NOT_CONFIGURED",
  "SERVICE_ACTOR_INVALID",
  "IMAGE_GENERATION_DISABLED",
  "IMAGE_GENERATION_NOT_CONFIGURED",
  "IMAGE_GENERATION_CONFIGURATION_INVALID",
  "IMAGE_STORAGE_NOT_CONFIGURED",
]);

function retryableFailure(error: unknown, persistence: "NOT_COMMITTED" | "COMMITTED" | "UNKNOWN") {
  if (persistence === "COMMITTED") return true;
  if (!(error instanceof ServiceError)) return true;
  if (error.statusCode < 500) return false;
  return !nonRetryableConfigurationCodes.has(error.code);
}

function success(value: Awaited<ReturnType<LearnApplyAdapter["apply"]>>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
    ...(value.result === "PERSISTED_NOT_VERIFIED" ? { isError: true } : {}),
  };
}

function contextFailure(error: unknown) {
  const safe = error instanceof LearnContextError
    ? { result: "ERROR", error: { code: error.code, message: error.message, retryable: error.retryable } }
    : { result: "ERROR", error: { code: "CONTEXT_UNAVAILABLE", message: "The Learn editorial context could not be read. Retry later.", retryable: true } };
  const validated = learnContextErrorResultSchema.parse(safe);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(validated) }],
    structuredContent: validated,
    isError: true,
  };
}

function sourceFailure(error: unknown) {
  const safe = error instanceof LearnSourceError
    ? { result: "ERROR", error: { code: error.code, message: error.message, retryable: error.retryable } }
    : { result: "ERROR", error: { code: "SOURCE_UNAVAILABLE", message: "The Learn source could not be read. Retry later.", retryable: true } };
  const validated = learnSourceErrorResultSchema.parse(safe);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(validated) }],
    structuredContent: validated,
    isError: true,
  };
}

function trafficFailure(error: unknown) {
  const safe = error instanceof SocialTrafficError
    ? { result: "ERROR", error: { code: error.code, message: error.message, retryable: error.retryable } }
    : { result: "ERROR", error: { code: "TRAFFIC_UNAVAILABLE", message: "Site traffic could not be read. Retry later.", retryable: true } };
  const validated = socialTrafficErrorResultSchema.parse(safe);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(validated) }],
    structuredContent: validated,
    isError: true,
  };
}

function failure(error: unknown) {
  const details = error instanceof ServiceError && error.details && typeof error.details === "object" && !Array.isArray(error.details)
    ? error.details as Record<string, unknown>
    : null;
  const declaredPersistence = details?.persistence;
  const persistence = declaredPersistence === "COMMITTED" || declaredPersistence === "UNKNOWN"
    ? declaredPersistence
    : "NOT_COMMITTED";
  const safe = error instanceof ServiceError
    ? {
        result: "ERROR",
        error: {
          code: error.code,
          message: error.message,
          persistence,
          retryable: retryableFailure(error, persistence),
          ...(details ? { details } : {}),
        },
      }
    : {
        result: "ERROR",
        error: {
          code: "LEARN_APPLY_FAILED",
          message: "learn_apply failed before publication completed.",
          persistence: "UNKNOWN",
          retryable: true,
        },
      };
  const validated = learnApplyErrorResultSchema.parse(safe);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(validated) }],
    structuredContent: validated,
    isError: true,
  };
}

export function createLearnMcpServer(
  service: LearnApplyAdapter = learnApplyService,
  readContext: LearnContextReader = readLearnContext,
  readSource: LearnSourceReader = readLearnSource,
  readTraffic: SocialTrafficReader = readSocialTraffic,
) {
  const server = new Server(
    { name: "b4gamble-learn-publication", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [learnContextTool, learnSourceTool, socialTrafficTool, learnApplyTool] } as never));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === learnContextTool.name) {
      try {
        const value = await readContext(request.params.arguments ?? {});
        return { content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value } as never;
      } catch (error) {
        return contextFailure(error) as never;
      }
    }
    if (request.params.name === learnSourceTool.name) {
      try {
        const value = await readSource(request.params.arguments ?? {});
        return { content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value } as never;
      } catch (error) {
        return sourceFailure(error) as never;
      }
    }
    if (request.params.name === socialTrafficTool.name) {
      try {
        const value = await readTraffic(request.params.arguments ?? {});
        return { content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value } as never;
      } catch (error) {
        return trafficFailure(error) as never;
      }
    }
    if (request.params.name !== learnApplyTool.name) {
      throw new McpError(ErrorCode.MethodNotFound, "Unknown Learn MCP tool");
    }
    try {
      return success(await service.apply(request.params.arguments ?? {})) as never;
    } catch (error) {
      return failure(error) as never;
    }
  });
  return server;
}

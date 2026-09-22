import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import {
  learnApplyErrorResultSchema,
  learnApplyInputSchema,
  learnApplyResultSchema,
} from "@/lib/learn-apply/contract";
import { learnApplyService } from "@/lib/learn-apply/service";
import { ServiceError } from "@/lib/services/service-error";

function withoutSchemaDeclaration(schema: Record<string, unknown>) {
  const { $schema: _schema, ...rest } = schema;
  return rest;
}

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
          persistence: details?.persistence === "COMMITTED" ? "COMMITTED" as const : "NOT_COMMITTED" as const,
          retryable: retryableFailure(error, details?.persistence === "COMMITTED" ? "COMMITTED" : "NOT_COMMITTED"),
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

export function createLearnMcpServer(service: LearnApplyAdapter = learnApplyService) {
  const server = new Server(
    { name: "b4gamble-learn-publication", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [learnApplyTool] } as never));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

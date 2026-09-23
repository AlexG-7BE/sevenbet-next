import "server-only";

import OpenAI from "openai";

import { LEARN_CONTENT_ROLE_NAMES } from "./contracts";
import { LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA } from "./model-output-schema";
import {
  LEARN_CONTENT_ROLE_MARKERS,
  LEARN_CONTENT_ROLE_TASK_NAMES,
  LEARN_CONTENT_ROOT_INSTRUCTIONS,
  buildLearnContentSessionInput,
} from "./prompts";
import type { LearnContentSafeContext } from "./safe-context.server";

const MAX_MODEL_OUTPUT_BYTES = 5_000_000;
const MAX_PROVIDER_ERROR_FIELD_BYTES = 240;

function boundedProviderErrorField(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, "[REDACTED]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[REDACTED]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROVIDER_ERROR_FIELD_BYTES);
}

export function describeLearnContentProviderError(error: unknown) {
  const candidate = error && typeof error === "object" ? error as {
    status?: unknown;
    code?: unknown;
    type?: unknown;
    param?: unknown;
    message?: unknown;
  } : {};
  return {
    providerStatus: typeof candidate.status === "number" && Number.isSafeInteger(candidate.status) ? candidate.status : null,
    providerCode: boundedProviderErrorField(candidate.code, "UNKNOWN"),
    providerType: boundedProviderErrorField(candidate.type, error instanceof Error ? error.name : "UNKNOWN"),
    providerParam: candidate.param === null ? "NONE" : boundedProviderErrorField(candidate.param, "UNKNOWN"),
    providerMessage: boundedProviderErrorField(candidate.message, "Provider request failed without a message"),
  };
}

export type LearnContentSessionTrace = {
  roles: Array<{ name: string; webSearchCalls: number }>;
  subagentConfigurationValid: boolean;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number } | null;
};

export type LearnContentSessionState =
  | { status: "in_progress" }
  | { status: "requires_action" }
  | { status: "failed"; code: "MANAGED_SESSION_FAILED" }
  | { status: "idle"; output: unknown; trace: LearnContentSessionTrace };

export type LearnContentSessionStart = {
  sessionId: string;
  status: "idle" | "in_progress" | "requires_action" | "failed";
};

export interface LearnContentManagedSessionProvider {
  start(input: {
    apiKey: string;
    runId: string;
    requestId: string;
    model: string;
    locale: string;
    context: LearnContentSafeContext;
  }): Promise<LearnContentSessionStart>;
  inspect(input: { apiKey: string; sessionId: string }): Promise<LearnContentSessionState>;
}

const ROLE_TRACE_DEFINITIONS: ReadonlyArray<{
  roleName: string;
  marker: string;
  taskNames: ReadonlySet<string>;
}> = [
  {
    roleName: LEARN_CONTENT_ROLE_NAMES[0],
    marker: LEARN_CONTENT_ROLE_MARKERS.seo,
    taskNames: new Set([LEARN_CONTENT_ROLE_TASK_NAMES.seo]),
  },
  {
    roleName: LEARN_CONTENT_ROLE_NAMES[1],
    marker: LEARN_CONTENT_ROLE_MARKERS.research,
    taskNames: new Set([LEARN_CONTENT_ROLE_TASK_NAMES.research]),
  },
  {
    roleName: LEARN_CONTENT_ROLE_NAMES[2],
    marker: LEARN_CONTENT_ROLE_MARKERS.editor,
    taskNames: new Set([LEARN_CONTENT_ROLE_TASK_NAMES.editor]),
  },
];

function normalizedRunnerTaskName(value: string | null) {
  if (!value) return "";
  const leaf = value.split("/").filter(Boolean).at(-1) ?? value;
  return leaf.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function outputText(item: unknown) {
  if (!item || typeof item !== "object") return null;
  const message = item as {
    type?: unknown;
    role?: unknown;
    phase?: unknown;
    status?: unknown;
    content?: unknown;
  };
  if (message.type !== "message" || message.role !== "assistant" || message.phase !== "final_answer" || message.status !== "completed" || !Array.isArray(message.content)) return null;
  const text = message.content.flatMap((part) => {
    if (!part || typeof part !== "object") return [];
    const content = part as { type?: unknown; text?: unknown };
    return content.type === "output_text" && typeof content.text === "string" ? [content.text] : [];
  }).join("");
  return text || null;
}

function parseBoundedJson(value: string) {
  if (Buffer.byteLength(value) > MAX_MODEL_OUTPUT_BYTES) throw new Error("Managed session output exceeds the bounded Learn contract");
  return JSON.parse(value) as unknown;
}

export function resolveLearnContentSubagentRoleName(subagent: {
  name: string | null;
  instructions: Array<{ type: string; text?: string }> | null;
}) {
  const task = (subagent.instructions ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
  const normalizedName = normalizedRunnerTaskName(subagent.name);
  const assigned = ROLE_TRACE_DEFINITIONS.filter((definition) => (
    definition.taskNames.has(normalizedName)
    || normalizedName === normalizedRunnerTaskName(definition.roleName)
    || task.includes(definition.marker)
    || task.includes(`You are ${definition.roleName}.`)
  ));
  return assigned.length === 1 ? assigned[0].roleName : "";
}

export class OpenAiLearnContentManagedSessionProvider implements LearnContentManagedSessionProvider {
  private client(apiKey: string) {
    return new OpenAI({ apiKey, maxRetries: 2, timeout: 30_000 });
  }

  async start(input: {
    apiKey: string;
    runId: string;
    requestId: string;
    model: string;
    locale: string;
    context: LearnContentSafeContext;
  }): Promise<LearnContentSessionStart> {
    const session = await this.client(input.apiKey).beta.agents.sessions.create({
      environment: { type: "none" },
      agent: {
        model: input.model,
        instructions: LEARN_CONTENT_ROOT_INSTRUCTIONS,
        multi_agent: { enabled: true, max_concurrent_subagents: 3 },
        reasoning: { effort: "high", summary: "concise" },
        service_tier: "auto",
        text: {
          verbosity: "medium",
          format: { type: "json_schema", schema: LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA },
        },
        tools: [
          { type: "programmatic_tool_calling", enabled: true },
          { type: "web_search", mode: "live", context_size: "high" },
        ],
      },
      input: buildLearnContentSessionInput(input),
      metadata: {
        pipeline: "learn-content-orchestrator-v1",
        run_id: input.runId,
        locale: input.locale,
      },
      stream: false,
    }, { idempotencyKey: `learn-content-session:${input.runId}` });
    return { sessionId: session.id, status: session.status };
  }

  async inspect(input: { apiKey: string; sessionId: string }): Promise<LearnContentSessionState> {
    const client = this.client(input.apiKey);
    const session = await client.beta.agents.sessions.retrieve(input.sessionId);
    if (session.status === "in_progress") return { status: "in_progress" };
    if (session.status === "requires_action") return { status: "requires_action" };
    if (session.status === "failed") return { status: "failed", code: "MANAGED_SESSION_FAILED" };

    const rootItems = await client.beta.agents.sessions.items.list(input.sessionId, { order: "desc", limit: 100 });
    const finalText = rootItems.data.map(outputText).find((value): value is string => Boolean(value));
    if (!finalText) throw new Error("Managed session completed without a final structured output");
    const allowedReasoningEfforts = new Set(["high", "xhigh", "max", "ultra"]);
    const subagentConfigurationValid = rootItems.data.every((item) => item.type !== "create_subagent_call" || (
      item.status === "completed"
      && (item.model === null || item.model === session.agent.model)
      && (item.reasoning_effort === null || allowedReasoningEfforts.has(item.reasoning_effort))
    ));

    const subagents = await client.beta.agents.sessions.subagents.list(input.sessionId, { order: "asc", limit: 100 });
    const roles = await Promise.all(subagents.data.map(async (subagent) => {
      const items = await client.beta.agents.sessions.subagents.items.list(subagent.id, {
        session_id: input.sessionId,
        order: "asc",
        limit: 100,
      });
      return {
        name: resolveLearnContentSubagentRoleName(subagent),
        webSearchCalls: items.data.filter((item) => item.type === "web_search_call" && item.status === "completed").length,
      };
    }));
    return {
      status: "idle",
      output: parseBoundedJson(finalText),
      trace: {
        roles,
        subagentConfigurationValid,
        usage: session.usage ? {
          inputTokens: session.usage.input_tokens,
          outputTokens: session.usage.output_tokens,
          totalTokens: session.usage.total_tokens,
        } : null,
      },
    };
  }
}

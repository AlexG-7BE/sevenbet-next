import "server-only";

import OpenAI from "openai";

import { LEARN_CONTENT_ROLE_NAMES } from "./contracts";
import { LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA } from "./model-output-schema";
import { LEARN_CONTENT_ROOT_INSTRUCTIONS, buildLearnContentSessionInput } from "./prompts";
import type { LearnContentSafeContext } from "./safe-context.server";

const MAX_MODEL_OUTPUT_BYTES = 5_000_000;

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
  const named = LEARN_CONTENT_ROLE_NAMES.find((roleName) => subagent.name === roleName);
  if (named) return named;
  const task = (subagent.instructions ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
  const assigned = LEARN_CONTENT_ROLE_NAMES.filter((roleName) => task.includes(`You are ${roleName}.`));
  return assigned.length === 1 ? assigned[0] : "";
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

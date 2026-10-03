import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport, StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import {
  learnApplyToolResultSchema,
  type LearnApplyInput,
} from "@/lib/learn-apply/contract";
import { LEARN_MCP_PATH } from "@/lib/mcp/learn/config";
import { siteUrl } from "@/lib/site";

export interface LearnContentPublisher {
  publish(input: { payload: LearnApplyInput; serviceToken: string }): Promise<ReturnType<typeof learnApplyToolResultSchema.parse>>;
}

export class LearnContentPublisherError extends Error {
  constructor(readonly code: "MCP_AUTH_FAILED" | "MCP_TRANSPORT_FAILED") {
    super(code);
    this.name = "LearnContentPublisherError";
  }
}

/**
 * The Learn MCP surface the publisher accepts: the one mutation plus the
 * read-only learn_context and learn_source (LEARN-SERVER-SWITCH-2026-10-01)
 * and the read-only social_traffic aggregates (SOCIAL-TRAFFIC-MCP-2026-10-03).
 * The publisher calls only learn_apply; anything else listed fails closed.
 */
const EXPECTED_LEARN_MCP_TOOLS: ReadonlySet<string> = new Set(["learn_apply", "learn_context", "learn_source", "social_traffic"]);

/**
 * A learn_apply call that generates a hero image took 108 s in Production on
 * 30 Sep 2026; the SDK's 60 s default abandoned it and cost an hourly retry.
 * The cron route has 300 s, so the call may use up to 240 s.
 */
export const LEARN_APPLY_CALL_TIMEOUT_MS = 240_000;

export function learnMcpToolSurfaceIsExpected(names: readonly string[]) {
  return names.includes("learn_apply") && names.every((name) => EXPECTED_LEARN_MCP_TOOLS.has(name)) && new Set(names).size === names.length;
}

export class McpLearnContentPublisher implements LearnContentPublisher {
  constructor(private readonly endpoint = new URL(LEARN_MCP_PATH, siteUrl)) {}

  async publish(input: { payload: LearnApplyInput; serviceToken: string }) {
    const client = new Client({ name: "b4gamble-learn-content-orchestrator", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(this.endpoint, {
      requestInit: {
        headers: {
          Authorization: `Bearer ${input.serviceToken}`,
        },
      },
    });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      if (!learnMcpToolSurfaceIsExpected(tools.tools.map((tool) => tool.name))) {
        throw new Error("Learn MCP tool surface is not the expected learn_apply plus read-only learn_context, learn_source and social_traffic");
      }
      const result = await client.callTool({
        name: "learn_apply",
        arguments: input.payload,
      }, undefined, { timeout: LEARN_APPLY_CALL_TIMEOUT_MS });
      return learnApplyToolResultSchema.parse(result.structuredContent);
    } catch (error) {
      if (error instanceof StreamableHTTPError && (error.code === 401 || error.code === 403)) {
        throw new LearnContentPublisherError("MCP_AUTH_FAILED");
      }
      if (error instanceof LearnContentPublisherError) throw error;
      throw new LearnContentPublisherError("MCP_TRANSPORT_FAILED");
    } finally {
      await client.close().catch(() => undefined);
    }
  }
}

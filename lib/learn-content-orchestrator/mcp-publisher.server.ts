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
      if (tools.tools.length !== 1 || tools.tools[0]?.name !== "learn_apply") {
        throw new Error("Learn MCP tool surface is not the expected single learn_apply capability");
      }
      const result = await client.callTool({
        name: "learn_apply",
        arguments: input.payload,
      });
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

import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createCommercialMcpServer, commercialMcpTools } from "../lib/mcp/commercial/server";

const config = {
  issuer: "https://b4gamble.com",
  resource: "https://b4gamble.com/api/mcp/commercial",
  authorizationEndpoint: "https://b4gamble.com/api/mcp/oauth/authorize",
  tokenEndpoint: "https://b4gamble.com/api/mcp/oauth/token",
  registrationEndpoint: "https://b4gamble.com/api/mcp/oauth/register",
  revocationEndpoint: "https://b4gamble.com/api/mcp/oauth/revoke",
};
const token = {
  tokenId: "token-row-id",
  clientId: "chatgpt-client-id",
  staff: { id: "staff-id", userId: "user-id", email: "staff@example.com", name: "Staff", role: "AFFILIATE_MANAGER" as const },
  scopes: new Set(["commercial:read", "commercial:safe_write"]),
};

async function connectedClient(scopes = token.scopes) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const calls: string[] = [];
  const service = {
    async list() { calls.push("list"); return { opportunities: [], count: 0, limit: 25, offset: 0 }; },
    async get() { calls.push("get"); return { opportunity: { id: "11111111-1111-4111-8111-111111111111" } }; },
    async findPossibleDuplicates() { calls.push("duplicates"); return { candidates: [], count: 0 }; },
    async upsertResearchBundle() { calls.push("upsert"); return { status: "CREATED", opportunityId: "11111111-1111-4111-8111-111111111111" }; },
  };
  const server = createCommercialMcpServer(
    { ...token, scopes },
    config,
    service,
    async () => ({ allowed: true, remaining: 100, resetAt: Date.now() + 60_000 }),
  );
  const client = new Client({ name: "commercial-mcp-test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server, calls };
}

test("official MCP client discovers exactly four accurately annotated tools", async () => {
  const { client, server } = await connectedClient();
  try {
    const result = await client.listTools();
    assert.deepEqual(result.tools.map((tool) => tool.name), commercialMcpTools.map((tool) => tool.name));
    assert.equal(result.tools.length, 4);
    assert.equal(commercialMcpTools[0].annotations.readOnlyHint, true);
    assert.equal(commercialMcpTools[3].annotations.readOnlyHint, false);
    assert.equal(commercialMcpTools[3].annotations.destructiveHint, false);
    assert.equal(commercialMcpTools[3].annotations.idempotentHint, true);
    assert.deepEqual(commercialMcpTools[3].securitySchemes[0].scopes, ["commercial:safe_write"]);
    assert.deepEqual(commercialMcpTools[3]._meta.securitySchemes, commercialMcpTools[3].securitySchemes);
  } finally {
    await client.close();
    await server.close();
  }
});

test("official MCP client can call authenticated read and safe-write tools", async () => {
  const { client, server, calls } = await connectedClient();
  try {
    const read = await client.callTool({ name: "commercial_list_opportunities", arguments: {} });
    const write = await client.callTool({ name: "commercial_upsert_research_bundle", arguments: {} });
    assert.equal(read.isError, undefined);
    assert.equal(write.isError, undefined);
    assert.deepEqual(calls, ["list", "upsert"]);
  } finally {
    await client.close();
    await server.close();
  }
});

test("read-only OAuth scope cannot call the write tool", async () => {
  const { client, server, calls } = await connectedClient(new Set(["commercial:read"]));
  try {
    const result = await client.callTool({ name: "commercial_upsert_research_bundle", arguments: {} });
    assert.equal(result.isError, true);
    assert.deepEqual(calls, []);
  } finally {
    await client.close();
    await server.close();
  }
});

test("unknown MCP tools are protocol errors", async () => {
  const { client, server } = await connectedClient();
  try {
    await assert.rejects(() => client.callTool({ name: "execute_any_operation", arguments: {} }), /Unknown Commercial MCP tool/);
  } finally {
    await client.close();
    await server.close();
  }
});

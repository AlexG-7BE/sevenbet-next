import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createCommercialMcpServer, commercialMcpTools } from "../lib/mcp/commercial/server";
import { ValidationError } from "../lib/services/service-error";

const config = {
  issuer: "https://b4gamble.com",
  authorizationServer: "https://b4gamble.com",
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

async function connectedClient(scopes = token.scopes, registrationError?: Error) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const calls: string[] = [];
  const observations: Array<{ metric: string; increment?: number }> = [];
  const service = {
    async list() { calls.push("list"); return { opportunities: [], count: 0, limit: 25, offset: 0 }; },
    async get() { calls.push("get"); return { opportunity: { id: "11111111-1111-4111-8111-111111111111" } }; },
    async findPossibleDuplicates() { calls.push("duplicates"); return { candidates: [], count: 0 }; },
    async upsertResearchBundle() { calls.push("upsert"); return { status: "CREATED", opportunityId: "11111111-1111-4111-8111-111111111111" }; },
    async registerPartnerTrackingLink() {
      calls.push("register-tracking");
      if (registrationError) throw registrationError;
      return { status: "REGISTERED" };
    },
  };
  const server = createCommercialMcpServer(
    { ...token, scopes },
    config,
    service,
    async () => ({ allowed: true, remaining: 100, resetAt: Date.now() + 60_000 }),
    () => {},
    async (observation) => { observations.push(observation); },
  );
  const client = new Client({ name: "commercial-mcp-test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server, calls, observations };
}

test("official MCP client discovers the bounded Commercial tools including tracking registration", async () => {
  const { client, server } = await connectedClient();
  try {
    const result = await client.listTools();
    assert.deepEqual(result.tools.map((tool) => tool.name), commercialMcpTools.map((tool) => tool.name));
    assert.equal(result.tools.length, 5);
    assert.equal(commercialMcpTools[0].annotations.readOnlyHint, true);
    const registration = commercialMcpTools.find((tool) => tool.name === "commercial_register_partner_tracking_link")!;
    assert.equal(registration.annotations.readOnlyHint, false);
    assert.equal(registration.annotations.destructiveHint, false);
    assert.equal(registration.annotations.idempotentHint, true);
    assert.equal(registration.annotations.openWorldHint, true);
    assert.deepEqual(registration.securitySchemes[0].scopes, ["commercial:safe_write"]);
    assert.deepEqual(registration._meta.securitySchemes, registration.securitySchemes);
    assert.deepEqual(Object.keys(registration.inputSchema.properties as object).sort(), ["casino", "geo", "partner", "supportedGeos", "trackingUrl"]);
    assert.deepEqual(registration.inputSchema.required, ["partner", "casino", "trackingUrl"]);
  } finally {
    await client.close();
    await server.close();
  }
});

test("official MCP client can call authenticated read and safe-write tools", async () => {
  const { client, server, calls, observations } = await connectedClient();
  try {
    const read = await client.callTool({ name: "commercial_list_opportunities", arguments: {} });
    const write = await client.callTool({ name: "commercial_upsert_research_bundle", arguments: {} });
    const registration = await client.callTool({ name: "commercial_register_partner_tracking_link", arguments: {} });
    assert.equal(read.isError, undefined);
    assert.equal(write.isError, undefined);
    assert.equal(registration.isError, undefined);
    assert.deepEqual(calls, ["list", "upsert", "register-tracking"]);
    assert.deepEqual(observations, [{ metric: "REQUEST" }]);
  } finally {
    await client.close();
    await server.close();
  }
});

test("tracking registration captures a bounded resolution-failure metric", async () => {
  const error = new ValidationError("Partner cannot be resolved", {
    reason: "CURRENT_PARTNER_AMBIGUOUS",
    candidates: [{ id: "partner-1", name: "Bounded Partner" }],
  });
  const { client, server, observations } = await connectedClient(token.scopes, error);
  try {
    const result = await client.callTool({ name: "commercial_register_partner_tracking_link", arguments: {} });
    assert.equal(result.isError, true);
    assert.deepEqual(result.structuredContent, {
      status: "ERROR",
      code: "VALIDATION_ERROR",
      reason: "CURRENT_PARTNER_AMBIGUOUS",
      message: "Partner cannot be resolved",
      candidates: [{ id: "partner-1", name: "Bounded Partner" }],
    });
    assert.deepEqual(observations, [{ metric: "REQUEST" }, { metric: "RESOLUTION_FAILURE" }]);
  } finally {
    await client.close();
    await server.close();
  }
});

test("safe-write scope surfaces canonical Founder-authority denial without inventing approval", async () => {
  const error = new ValidationError("Explicit Founder commercial authority is required", {
    reason: "PARTNER_TRACKING_COMMERCIAL_AUTHORITY_REQUIRED",
  });
  const { client, server, calls, observations } = await connectedClient(token.scopes, error);
  try {
    const result = await client.callTool({ name: "commercial_register_partner_tracking_link", arguments: {} });
    assert.equal(result.isError, true);
    assert.deepEqual(result.structuredContent, {
      status: "ERROR",
      code: "VALIDATION_ERROR",
      reason: "PARTNER_TRACKING_COMMERCIAL_AUTHORITY_REQUIRED",
      message: "Explicit Founder commercial authority is required",
      candidates: [],
    });
    assert.deepEqual(calls, ["register-tracking"]);
    assert.deepEqual(observations, [{ metric: "REQUEST" }]);
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

test("read-only OAuth scope cannot register a tracking link", async () => {
  const { client, server, calls } = await connectedClient(new Set(["commercial:read"]));
  try {
    const result = await client.callTool({ name: "commercial_register_partner_tracking_link", arguments: {} });
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

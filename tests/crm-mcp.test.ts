import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

import * as crmRoute from "../app/api/mcp/crm/route";
import { createCommercialOpportunityResearchService } from "../lib/commercial/commercial-opportunity-research-service";
import { authenticateCrmMcpRequest, resolveCrmMcpConfig } from "../lib/mcp/crm/config";
import { clearCrmMcpRateLimitsForTests, handleCrmMcpPost } from "../lib/mcp/crm/post-handler";
import { CRM_MCP_CHANNEL, CRM_MCP_SOURCE_REFERENCE, createCrmMcpServer, crmMcpTools } from "../lib/mcp/crm/server";
import type { DelegatedCommercialStageFacts } from "../lib/repositories/commercial.repository";

const ENDPOINT = "https://b4gamble.com/api/mcp/crm";
const TOKEN = "crm-mcp-service-token-with-more-than-32-bytes";
const ACTOR_ID = "33333333-3333-4333-8333-333333333333";
const OPPORTUNITY_ID = "44444444-4444-4444-8444-444444444444";
const QUALIFICATION_EVIDENCE = "55555555-5555-4555-8555-555555555551";
const APPROVAL_EVIDENCE = "55555555-5555-4555-8555-555555555552";
const REJECTION_EVIDENCE = "55555555-5555-4555-8555-555555555553";
const FOREIGN_EVIDENCE = "66666666-6666-4666-8666-666666666666";
const UNKNOWN_CASINO = "77777777-7777-4777-8777-777777777777";

const EXPECTED_TOOLS = [
  "crm_list_opportunities",
  "crm_get_opportunity",
  "crm_find_possible_duplicates",
  "crm_upsert_research_bundle",
  "crm_transition_stage",
  "crm_link_catalog",
];

type Calls = { writes: string[]; contexts: unknown[] };

function fakeRepositories(options: { stage?: DelegatedCommercialStageFacts["currentStage"]; actorRole?: string | null } = {}) {
  const calls: Calls = { writes: [], contexts: [] };
  const facts: DelegatedCommercialStageFacts = {
    currentStage: options.stage ?? "NEGOTIATING",
    qualificationRationale: "Evidenced fit.",
    nextActionSummary: "Follow up with the partner manager.",
    evidence: [
      { id: QUALIFICATION_EVIDENCE, category: "QUALIFICATION" },
      { id: APPROVAL_EVIDENCE, category: "APPROVAL" },
      { id: REJECTION_EVIDENCE, category: "REJECTION" },
    ],
    applicationStates: ["SUBMITTED"],
  };
  const research = {
    listOpportunities: async () => [],
    getOpportunity: async () => null,
    findPossibleDuplicates: async () => [],
    upsertResearchBundle: async (_input: unknown, context: unknown) => {
      calls.writes.push("upsertResearchBundle");
      calls.contexts.push(context);
      return { status: "CREATED", opportunityId: OPPORTUNITY_ID, runId: "run" };
    },
  };
  const delegated = {
    findDelegatingActor: async (id: string) => (options.actorRole === null ? null : { id, role: options.actorRole ?? "AFFILIATE_MANAGER" }),
    transitionStage: async (
      input: { opportunityId: string; targetStage: string },
      context: unknown,
      assertAllowed: (value: DelegatedCommercialStageFacts) => void,
    ) => {
      assertAllowed(facts);
      calls.writes.push(`transitionStage:${input.targetStage}`);
      calls.contexts.push(context);
      return {
        status: "TRANSITIONED" as const,
        opportunityId: input.opportunityId,
        previousStage: facts.currentStage,
        newStage: input.targetStage,
        activityId: "activity",
      };
    },
    linkCatalog: async (input: { opportunityId: string; casinoId?: string | null }, context: unknown) => {
      calls.contexts.push(context);
      if (input.casinoId === UNKNOWN_CASINO) return { status: "UNKNOWN_REFERENCE" as const, field: "casinoId" as const, id: UNKNOWN_CASINO };
      calls.writes.push("linkCatalog");
      return { status: "LINKED" as const, opportunityId: input.opportunityId, links: { casinoId: input.casinoId ?? null }, changed: ["casinoId"], activityId: "activity" };
    },
  };
  const service = createCommercialOpportunityResearchService(research as never, delegated as never);
  return { service, calls };
}

async function connected(service: ReturnType<typeof fakeRepositories>["service"]) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createCrmMcpServer({ actorId: ACTOR_ID, service });
  const client = new Client({ name: "crm-mcp-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    async close() {
      await client.close();
      await server.close();
    },
  };
}

type ToolError = { result: string; error: { code: string; message: string; retryable: boolean; persistence: string } };

function errorOf(result: Awaited<ReturnType<Client["callTool"]>>) {
  assert.equal(result.isError, true);
  return result.structuredContent as ToolError;
}

function transition(overrides: Record<string, unknown> = {}) {
  return {
    opportunityId: OPPORTUNITY_ID,
    targetStage: "APPROVED",
    reason: "The partner manager confirmed approval by email.",
    evidenceIds: [APPROVAL_EVIDENCE],
    idempotencyKey: "crm-stage-approved-0001",
    ...overrides,
  };
}

const ENV_KEYS = ["CRM_MCP_ENABLED", "CRM_MCP_SERVICE_TOKEN", "CRM_MCP_ACTOR_ID"] as const;

function assign(values: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function isolatedEnvironment(context: test.TestContext) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  context.after(() => {
    assign(previous);
    clearCrmMcpRateLimitsForTests();
  });
  return assign;
}

function post(body: string, headers: Record<string, string> = {}) {
  return handleCrmMcpPost(new Request(ENDPOINT, { method: "POST", headers, body }));
}

test("service bearer configuration is fail-closed", () => {
  assert.equal(resolveCrmMcpConfig({}), null);
  assert.equal(resolveCrmMcpConfig({ CRM_MCP_ENABLED: "false", CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: ACTOR_ID }), null);
  assert.throws(() => resolveCrmMcpConfig({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: "short", CRM_MCP_ACTOR_ID: ACTOR_ID }), /32 bytes/);
  assert.throws(() => resolveCrmMcpConfig({ CRM_MCP_ENABLED: "true", CRM_MCP_ACTOR_ID: ACTOR_ID }), /32 bytes/);
  assert.throws(() => resolveCrmMcpConfig({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: TOKEN }), /AdminUser UUID/);
  assert.throws(() => resolveCrmMcpConfig({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: "founder" }), /AdminUser UUID/);
  const config = resolveCrmMcpConfig({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: ACTOR_ID })!;
  assert.deepEqual(config, { serviceToken: TOKEN, actorId: ACTOR_ID });
  assert.equal(authenticateCrmMcpRequest(new Request(ENDPOINT, { headers: { authorization: `Bearer ${TOKEN}` } }), config), true);
  assert.equal(authenticateCrmMcpRequest(new Request(ENDPOINT, { headers: { authorization: "Bearer wrong" } }), config), false);
  assert.equal(authenticateCrmMcpRequest(new Request(ENDPOINT, { headers: { cookie: "better-auth.session=founder" } }), config), false);
  assert.equal(authenticateCrmMcpRequest(new Request(`${ENDPOINT}?token=${TOKEN}`), config), false);
});

test("disabled or misconfigured endpoint returns 503 before any parsing", async (context) => {
  const environment = isolatedEnvironment(context);
  environment({ CRM_MCP_ENABLED: undefined, CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: ACTOR_ID });
  assert.equal((await post("not-json", { authorization: `Bearer ${TOKEN}` })).status, 503);

  environment({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: "too-short", CRM_MCP_ACTOR_ID: ACTOR_ID });
  assert.equal((await post("not-json", { authorization: "Bearer too-short" })).status, 503);

  environment({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: undefined, CRM_MCP_ACTOR_ID: ACTOR_ID });
  assert.equal((await post("not-json")).status, 503);

  environment({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: undefined });
  assert.equal((await post("not-json", { authorization: `Bearer ${TOKEN}` })).status, 503);
});

test("stateless HTTP transport authenticates, bounds the body and lists exactly six tools", async (context) => {
  isolatedEnvironment(context)({ CRM_MCP_ENABLED: "true", CRM_MCP_SERVICE_TOKEN: TOKEN, CRM_MCP_ACTOR_ID: ACTOR_ID });

  const missing = await post("not-json-and-never-parsed");
  assert.equal(missing.status, 401);
  assert.match(missing.headers.get("www-authenticate") ?? "", /Bearer/);
  assert.equal((await post("not-json-and-never-parsed", { authorization: `Bearer ${TOKEN}x` })).status, 401);

  const oversized = await post("{}", { authorization: `Bearer ${TOKEN}`, "content-length": "1048577" });
  assert.equal(oversized.status, 413);

  const listed = await post(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }), {
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${TOKEN}`,
    "content-type": "application/json",
  });
  assert.equal(listed.status, 200);
  assert.match(listed.headers.get("cache-control") ?? "", /no-store/);
  const payload = await listed.json() as { result?: { tools?: Array<{ name?: string }> } };
  assert.deepEqual(payload.result?.tools?.map((tool) => tool.name), EXPECTED_TOOLS);
});

test("only POST is served; GET, DELETE, PATCH and PUT return 405", async () => {
  for (const method of ["GET", "DELETE", "PATCH", "PUT"] as const) {
    const response = crmRoute[method]();
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  }
  assert.equal(crmRoute.POST, handleCrmMcpPost);
});

test("official MCP client discovers exactly six tools with strict input schemas", async () => {
  const { service } = fakeRepositories();
  const session = await connected(service);
  try {
    const discovered = await session.client.listTools();
    assert.deepEqual(discovered.tools.map((tool) => tool.name), EXPECTED_TOOLS);
    for (const tool of discovered.tools) {
      assert.equal(tool.inputSchema.type, "object");
      assert.equal((tool.inputSchema as { additionalProperties?: unknown }).additionalProperties, false, tool.name);
    }
    const transitionTool = discovered.tools.find((tool) => tool.name === "crm_transition_stage")!;
    const stages = (transitionTool.inputSchema.properties as { targetStage: { enum: string[] } }).targetStage.enum;
    assert.equal(stages.includes("ACTIVE"), false);
    assert.equal(stages.includes("APPROVED"), true);
    assert.deepEqual(crmMcpTools.filter((tool) => tool.annotations.readOnlyHint).map((tool) => tool.name), EXPECTED_TOOLS.slice(0, 3));
  } finally {
    await session.close();
  }
});

test("an unknown tool is MethodNotFound", async () => {
  const { service } = fakeRepositories();
  const session = await connected(service);
  try {
    await assert.rejects(
      session.client.callTool({ name: "crm_activate_route", arguments: {} }),
      (error: unknown) => error instanceof McpError && error.code === ErrorCode.MethodNotFound,
    );
  } finally {
    await session.close();
  }
});

test("strict schemas reject extra fields before any repository call", async () => {
  const { service, calls } = fakeRepositories();
  const session = await connected(service);
  try {
    const listed = errorOf(await session.client.callTool({ name: "crm_list_opportunities", arguments: { limit: 5, customerId: "x" } }));
    assert.equal(listed.error.code, "VALIDATION_ERROR");
    assert.equal(listed.error.retryable, false);
    const moved = errorOf(await session.client.callTool({ name: "crm_transition_stage", arguments: transition({ marketActivationId: "x" }) }));
    assert.equal(moved.error.code, "VALIDATION_ERROR");
    const linked = errorOf(await session.client.callTool({
      name: "crm_link_catalog",
      arguments: { opportunityId: OPPORTUNITY_ID, idempotencyKey: "crm-link-0001", trackingLinkId: UNKNOWN_CASINO },
    }));
    assert.equal(linked.error.code, "VALIDATION_ERROR");
    const empty = errorOf(await session.client.callTool({
      name: "crm_link_catalog",
      arguments: { opportunityId: OPPORTUNITY_ID, idempotencyKey: "crm-link-0001" },
    }));
    assert.equal(empty.error.code, "VALIDATION_ERROR");
    assert.deepEqual(calls.writes, []);
  } finally {
    await session.close();
  }
});

test("ACTIVE can be neither set nor cleared through a delegated transition", async () => {
  const { service, calls } = fakeRepositories();
  const session = await connected(service);
  try {
    const toActive = errorOf(await session.client.callTool({ name: "crm_transition_stage", arguments: transition({ targetStage: "ACTIVE" }) }));
    assert.equal(toActive.error.code, "VALIDATION_ERROR");
    assert.deepEqual(calls.writes, []);
  } finally {
    await session.close();
  }

  const fromActive = fakeRepositories({ stage: "ACTIVE" });
  const activeSession = await connected(fromActive.service);
  try {
    const cleared = errorOf(await activeSession.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ targetStage: "ON_HOLD", evidenceIds: [] }),
    }));
    assert.equal(cleared.error.code, "VALIDATION_ERROR");
    assert.match(cleared.error.message, /ACTIVE is derived from governed live routes/);
    assert.deepEqual(fromActive.calls.writes, []);
  } finally {
    await activeSession.close();
  }
});

test("stage transitions apply the staff evidence rules to cited evidence of the same opportunity", async () => {
  const { service, calls } = fakeRepositories();
  const session = await connected(service);
  try {
    const approvedWithoutApproval = errorOf(await session.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ evidenceIds: [QUALIFICATION_EVIDENCE] }),
    }));
    assert.equal(approvedWithoutApproval.error.code, "VALIDATION_ERROR");
    assert.match(approvedWithoutApproval.error.message, /APPROVED requires/);

    const rejectedWithoutRejection = errorOf(await session.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ targetStage: "REJECTED", evidenceIds: [APPROVAL_EVIDENCE] }),
    }));
    assert.match(rejectedWithoutRejection.error.message, /REJECTED requires/);

    const foreign = errorOf(await session.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ evidenceIds: [FOREIGN_EVIDENCE] }),
    }));
    assert.match(foreign.error.message, /must belong to this commercial opportunity/);

    const blankReason = errorOf(await session.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ targetStage: "ON_HOLD", reason: "   ", evidenceIds: [] }),
    }));
    assert.match(blankReason.error.message, /reason is required/);
    assert.deepEqual(calls.writes, []);

    const approved = await session.client.callTool({ name: "crm_transition_stage", arguments: transition() });
    assert.equal(approved.isError, undefined);
    assert.deepEqual(approved.structuredContent, {
      status: "TRANSITIONED",
      opportunityId: OPPORTUNITY_ID,
      previousStage: "NEGOTIATING",
      newStage: "APPROVED",
      activityId: "activity",
    });
    const onHold = await session.client.callTool({
      name: "crm_transition_stage",
      arguments: transition({ targetStage: "ON_HOLD", evidenceIds: [], idempotencyKey: "crm-stage-hold-0001" }),
    });
    assert.equal(onHold.isError, undefined);
    assert.deepEqual(calls.writes, ["transitionStage:APPROVED", "transitionStage:ON_HOLD"]);
    assert.deepEqual(calls.contexts, [
      { actorId: ACTOR_ID, channel: CRM_MCP_CHANNEL },
      { actorId: ACTOR_ID, channel: CRM_MCP_CHANNEL },
    ]);
  } finally {
    await session.close();
  }
});

test("catalog links reject unknown references and research bundles use the delegating actor", async () => {
  const { service, calls } = fakeRepositories();
  const session = await connected(service);
  try {
    const unknown = errorOf(await session.client.callTool({
      name: "crm_link_catalog",
      arguments: { opportunityId: OPPORTUNITY_ID, idempotencyKey: "crm-link-0001", casinoId: UNKNOWN_CASINO },
    }));
    assert.equal(unknown.error.code, "VALIDATION_ERROR");
    assert.match(unknown.error.message, /casinoId does not identify an existing catalog record/);
    assert.deepEqual(calls.writes, []);

    const unlinked = await session.client.callTool({
      name: "crm_link_catalog",
      arguments: { opportunityId: OPPORTUNITY_ID, idempotencyKey: "crm-link-0002", casinoId: null },
    });
    assert.equal(unlinked.isError, undefined);

    const bundle = await session.client.callTool({
      name: "crm_upsert_research_bundle",
      arguments: { idempotencyKey: "crm-bundle-0001", opportunity: { displayName: "Example Partners" } },
    });
    assert.equal(bundle.isError, undefined);
    assert.deepEqual(calls.writes, ["linkCatalog", "upsertResearchBundle"]);
    assert.deepEqual(calls.contexts.at(-1), { actorId: ACTOR_ID, sourceReference: CRM_MCP_SOURCE_REFERENCE });
  } finally {
    await session.close();
  }
});

test("a missing or unauthorised delegating actor fails closed, non-retryable and without writes", async () => {
  for (const actorRole of [null, "ANALYST"]) {
    const { service, calls } = fakeRepositories({ actorRole });
    const session = await connected(service);
    try {
      for (const [name, args] of [
        ["crm_transition_stage", transition()],
        ["crm_link_catalog", { opportunityId: OPPORTUNITY_ID, idempotencyKey: "crm-link-0001", casinoId: null }],
        ["crm_upsert_research_bundle", { idempotencyKey: "crm-bundle-0001", opportunity: { displayName: "Example Partners" } }],
      ] as const) {
        const failed = errorOf(await session.client.callTool({ name, arguments: args }));
        assert.equal(failed.error.code, "SERVICE_ACTOR_INVALID");
        assert.equal(failed.error.retryable, false);
        assert.equal(failed.error.persistence, "NOT_COMMITTED");
      }
      assert.deepEqual(calls.writes, []);
      const listed = await session.client.callTool({ name: "crm_list_opportunities", arguments: {} });
      assert.equal(listed.isError, undefined);
    } finally {
      await session.close();
    }
  }
});

test("unexpected failures are generic and disclose no stack or internals", async () => {
  const { service } = fakeRepositories();
  const failing = {
    ...service,
    list: async () => {
      throw new Error("connect ECONNREFUSED postgres://secret@db/prod");
    },
  };
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createCrmMcpServer({ actorId: ACTOR_ID, service: failing });
  const client = new Client({ name: "crm-mcp-error-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name: "crm_list_opportunities", arguments: {} });
    assert.deepEqual(result.structuredContent, {
      result: "ERROR",
      error: { code: "CRM_OPERATION_FAILED", message: "The CRM operation failed before it completed.", persistence: "UNKNOWN", retryable: true },
    });
    assert.doesNotMatch(JSON.stringify(result), /stack|ECONNREFUSED|secret|crm-mcp\.test\.ts/);
  } finally {
    await client.close();
    await server.close();
  }
});

function filesBelow(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesBelow(child) : [child];
  });
}

function importsOf(source: string) {
  return [...source.matchAll(/^import[\s\S]*?from ["']([^"']+)["'];?$/gm)].map((match) => match[1]);
}

function functionBody(source: string, name: string) {
  const start = source.indexOf(`async function ${name}(`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = source.indexOf("\n}\n", start);
  return source.slice(start, end + 2);
}

test("the CRM MCP surface imports only its CRM capability and no protected, tracking or public-runtime domain", () => {
  const transportFiles = ["app/api/mcp/crm/route.ts", ...filesBelow("lib/mcp/crm")].sort();
  assert.deepEqual(transportFiles, [
    "app/api/mcp/crm/route.ts",
    "lib/mcp/crm/config.ts",
    "lib/mcp/crm/post-handler.ts",
    "lib/mcp/crm/server.ts",
  ]);
  const allowedImports = new Set([
    "node:crypto",
    "zod",
    "@modelcontextprotocol/sdk/server/index.js",
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js",
    "@modelcontextprotocol/sdk/types.js",
    "@/lib/commercial/commercial-opportunity-research-contract",
    "@/lib/commercial/commercial-opportunity-research-service",
    "@/lib/mcp/crm/config",
    "@/lib/mcp/crm/post-handler",
    "@/lib/mcp/crm/server",
    "@/lib/mcp/rate-limit",
    "@/lib/services/service-error",
  ]);
  for (const path of transportFiles) {
    const source = readFileSync(path, "utf8");
    for (const specifier of importsOf(source)) assert.ok(allowedImports.has(specifier), `${path} imports ${specifier}`);
    assert.doesNotMatch(source, /@prisma\/client|prisma\.|oauth|clientId|commercial:(?:read|safe_write)|chatgpt/i);
  }

  const service = readFileSync("lib/commercial/commercial-opportunity-research-service.ts", "utf8");
  const serviceImports = importsOf(service);
  assert.deepEqual(serviceImports.filter((specifier) => !new Set([
    "zod",
    "@/lib/commercial/commercial-opportunity-research-contract",
    "@/lib/commercial/stage-policy",
    "@/lib/cms/permissions",
    "@/lib/repositories/commercial.repository",
    "@/lib/services/service-error",
  ]).has(specifier)), []);

  const forbiddenDomains = /customer|analytics|lifecycle|email|programme|program-ai|marketActivation|market-activation|partnerCasinoRelationship|partner-tracking|trackingLink|affiliateOffer|redirect|public-commercial-action|outboundClick|\buser\b|\.user\./i;
  const repository = readFileSync("lib/repositories/commercial.repository.ts", "utf8");
  const delegated = [
    "lockOpportunityForDelegatedWrite",
    "transitionDelegatedCommercialStage",
    "catalogRecordExists",
    "linkDelegatedCommercialCatalog",
  ].map((name) => functionBody(repository, name)).join("\n");
  const delegatedRepository = repository.slice(repository.indexOf("export const delegatedCommercialRepository"));
  const delegatedObject = delegatedRepository.slice(0, delegatedRepository.indexOf("\n};\n") + 3);
  for (const source of [delegated, delegatedObject, ...transportFiles.map((path) => readFileSync(path, "utf8"))]) {
    assert.doesNotMatch(source, forbiddenDomains);
  }
  const catalogAccess = [...delegated.matchAll(/tx\.(casino|affiliateNetwork|affiliateProgram|casinoOperator|casinoBrand)\.(\w+)\(/g)];
  assert.equal(catalogAccess.length, 5);
  assert.deepEqual([...new Set(catalogAccess.map((match) => match[2]))], ["findUnique"]);
  const writes = [...delegated.matchAll(/tx\.(\w+)\.(create|update|upsert|delete|createMany|updateMany|deleteMany)\(/g)].map((match) => `${match[1]}.${match[2]}`);
  assert.deepEqual([...new Set(writes)].sort(), ["commercialActivity.create", "commercialOpportunity.update"]);
  assert.match(delegated, /await audit\(\s*tx,\s*context\.actorId,\s*"commercial_delegated_stage_changed"/);
  assert.match(delegated, /await audit\(\s*tx,\s*context\.actorId,\s*"commercial_delegated_catalog_linked"/);
  assert.match(delegated, /channel: context\.channel/);
  assert.match(delegated, /actorKind: "PARTNER_OPERATIONS_AGENT"/);
  assert.match(delegatedObject, /prisma\.adminUser\.findUnique\(\{ where: \{ id \}, select: \{ id: true, role: true \} \}\)/);
});

test("public runtime and canonical tracking stay independent of the CRM MCP", () => {
  const independent = [
    "lib/commercial/partner-tracking-registration-service.ts",
    "lib/commercial/public-commercial-action-resolver.ts",
    "lib/services/affiliate-redirect.service.ts",
    "lib/market-activation/runtime.ts",
    "lib/market-activation/repository.ts",
    "lib/services/public-casino-discovery.service.ts",
    "middleware.ts",
  ];
  for (const path of independent) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /mcp\/crm|crm-mcp|CRM_MCP|createCrmMcpServer|delegatedCommercialRepository|commercialOpportunityResearchService/, path);
  }
});

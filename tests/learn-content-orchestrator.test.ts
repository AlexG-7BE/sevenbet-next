import assert from "node:assert/strict";
import test from "node:test";

import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import {
  LEARN_CONTENT_DEFAULT_MIN_INTERVAL_HOURS,
  LEARN_CONTENT_DEFAULT_MODEL,
  LEARN_CONTENT_MAX_STATE_BYTES,
  authenticateLearnContentCron,
  resolveLearnContentConfig,
} from "@/lib/learn-content-orchestrator/config";
import {
  LEARN_CONTENT_ROLE_NAMES,
  parseLearnContentModelOutput,
} from "@/lib/learn-content-orchestrator/contracts";
import { LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA } from "@/lib/learn-content-orchestrator/model-output-schema";
import {
  describeLearnContentProviderError,
  resolveLearnContentSubagentRoleName,
  type LearnContentManagedSessionProvider,
  type LearnContentSessionStart,
  type LearnContentSessionState,
} from "@/lib/learn-content-orchestrator/openai-managed-session.server";
import {
  validateLearnContentPublication,
  validateLearnContentRoleTrace,
} from "@/lib/learn-content-orchestrator/publication-validation";
import type { LearnContentSafeContext } from "@/lib/learn-content-orchestrator/safe-context.server";
import { createLearnContentCronHandler } from "@/lib/learn-content-orchestrator/service.server";
import {
  assertBoundedLearnContentState,
  PrismaLearnContentStateRepository,
  type LearnContentActiveRun,
  type LearnContentClaim,
  type LearnContentOperationalState,
  type LearnContentStateRepository,
} from "@/lib/learn-content-orchestrator/state-repository.server";
import {
  LearnContentPublisherError,
  type LearnContentPublisher,
} from "@/lib/learn-content-orchestrator/mcp-publisher.server";

const NOW = new Date("2026-09-22T12:00:00.000Z");
const RUN_ID = "00000000-0000-4000-8000-000000000001";
const ARTICLE_ID = "00000000-0000-4000-8000-000000000002";
const REQUEST_ID = `learn-content:${RUN_ID}`;
const SECRET = "c".repeat(40);

function stateClaimInput() {
  return {
    now: NOW,
    minIntervalHours: 24,
    locales: [{ language: "en", locale: "en-GB" }],
    model: "gpt-6-astra",
  };
}

const validEnvironment = {
  CRON_SECRET: SECRET,
  LEARN_CONTENT_AUTONOMY_ENABLED: "true",
  LEARN_CONTENT_LOCALES: "en",
  LEARN_CONTENT_MIN_INTERVAL_HOURS: "24",
  LEARN_CONTENT_OPENAI_MODEL: "gpt-6-astra",
  LEARN_MCP_ENABLED: "true",
  LEARN_MCP_ACTOR_ID: "00000000-0000-4000-8000-000000000052",
  LEARN_MCP_SERVICE_TOKEN: "m".repeat(40),
  OPENAI_API_KEY: "o".repeat(40),
};

function run(overrides: Partial<LearnContentActiveRun> = {}): LearnContentActiveRun {
  return {
    runId: RUN_ID,
    requestId: REQUEST_ID,
    sessionId: "session_123",
    language: "en",
    locale: "en-GB",
    model: "gpt-6-astra",
    startedAt: "2026-09-22T11:00:00.000Z",
    leaseUntil: "2026-09-22T23:00:00.000Z",
    publicationAttempts: 0,
    ...overrides,
  };
}

function safeContext(articles: LearnContentSafeContext["articles"] = []): LearnContentSafeContext {
  return {
    generatedAt: NOW.toISOString(),
    articles,
    categories: [{ slug: "casino-safety", title: "Casino Safety", description: "Safety education." }],
    locales: [{ language: "en", locale: "en-GB", publicPathPrefix: "/en" }],
    publicProgramme: {
      route: "/10-steps",
      applicationRoute: "/program",
      missionCount: 10,
      description: "Public structure only.",
    },
    protectedRoutes: ["/help", "/responsible-gambling"],
  };
}

function metadata() {
  return {
    runId: RUN_ID,
    generatedAt: NOW.toISOString(),
    model: "gpt-6-astra",
    locale: "en-GB",
    rewriteRounds: 0,
    agentNames: [...LEARN_CONTENT_ROLE_NAMES],
  };
}

function seoNoOp(decision: "MERGE" | "HOLD" | "DROP" = "HOLD") {
  return {
    decision,
    searchIntent: "Understand regulator checks",
    primaryKeyword: "gambling regulator check",
    secondaryKeywords: [],
    audienceNeed: "Verify public licensing facts.",
    rationale: "The current inventory already covers this need.",
    targetArticleId: null,
    targetSlug: null,
  };
}

function noOpEnvelope(decision: "MERGE" | "HOLD" | "DROP" = "HOLD") {
  return {
    resultClass: "NO_OP",
    seoHandoff: seoNoOp(decision),
    contentPackage: null,
    editorReview: null,
    learnApply: null,
    blocker: null,
    evidence: [],
    runMetadata: metadata(),
  };
}

function publishEnvelope(options: { update?: boolean; expectedUpdatedAt?: string; crisis?: boolean } = {}) {
  const update = options.update ?? false;
  const expectedUpdatedAt = options.expectedUpdatedAt ?? "2026-09-22T10:00:00.000Z";
  const claimText = "A public regulator register can help verify an operator licence claim.";
  return {
    resultClass: "PUBLISH",
    seoHandoff: {
      decision: update ? "UPDATE" : "CREATE",
      searchIntent: "Learn how to verify licensing claims",
      primaryKeyword: "verify gambling licence",
      secondaryKeywords: ["regulator register"],
      audienceNeed: "Check a claim against an authoritative source.",
      rationale: "The topic provides a concrete public-safety skill.",
      targetArticleId: update ? ARTICLE_ID : null,
      targetSlug: "verify-a-gambling-licence",
    },
    contentPackage: {
      claims: [{ id: "claim-1", text: claimText, sourceIds: ["source-1"], material: true }],
      sourceIds: ["source-1"],
      editorialSummary: "A source-led guide to checking public claims.",
      publicBenefit: "Readers can verify a licensing statement before making a decision.",
      wordCount: 650,
      rewriteRounds: 0,
      crisisSafetyReviewed: true,
      commercialSeparationReviewed: true,
    },
    editorReview: {
      decision: "QA_PASS",
      verifiedClaimIds: ["claim-1"],
      independentlyCheckedSourceIds: ["source-1"],
      issues: [],
      rewriteRounds: 0,
      safetyPassed: true,
      publicationIntegrityPassed: true,
    },
    learnApply: {
      requestId: REQUEST_ID,
      article: {
        articleId: update ? ARTICLE_ID : null,
        expectedUpdatedAt: update ? expectedUpdatedAt : null,
        locale: "en-GB",
        category: "casino-safety",
        slug: "verify-a-gambling-licence",
        title: "How to verify a gambling licence",
        excerpt: "A practical, source-led way to check licensing claims against a public regulator register.",
        tags: ["Licensing", "Security"],
        bodyBlocks: [
          { id: "intro", type: "paragraph", text: options.crisis ? `${claimText} If you face a debt crisis, pause and seek support.` : claimText },
          { id: "source", type: "link", label: "Read the regulator guidance", url: "https://www.gamblingcommission.gov.uk/public-and-players/guide/page/how-to-check-if-a-business-is-licensed", description: "Official public guidance." },
          ...(options.crisis ? [] : [{ id: "help", type: "link", label: "B4GAMBLE Help", url: "/help", description: "Protected support routes." }]),
        ],
        heroImage: null,
        seo: {
          title: "How to verify a gambling licence",
          description: "Check licensing claims against a public regulator register before relying on them.",
          canonicalUrl: "/en/learn/casino-safety/verify-a-gambling-licence",
        },
        readingTime: "4 min read",
        difficulty: "Beginner",
      },
    },
    blocker: null,
    evidence: [{
      id: "source-1",
      url: "https://www.gamblingcommission.gov.uk/public-and-players/guide/page/how-to-check-if-a-business-is-licensed",
      title: "How to check if a business is licensed",
      publisher: "Gambling Commission",
      accessedAt: NOW.toISOString(),
      supportsClaimIds: ["claim-1"],
    }],
    runMetadata: metadata(),
  };
}

function blockedEnvelope() {
  return {
    resultClass: "BLOCKED",
    seoHandoff: null,
    contentPackage: null,
    editorReview: null,
    learnApply: null,
    blocker: { code: "INSUFFICIENT_EVIDENCE", retryable: true },
    evidence: [],
    runMetadata: metadata(),
  };
}

const allRoleTrace = {
  roles: [
    { name: LEARN_CONTENT_ROLE_NAMES[0], webSearchCalls: 0 },
    { name: LEARN_CONTENT_ROLE_NAMES[1], webSearchCalls: 2 },
    { name: LEARN_CONTENT_ROLE_NAMES[2], webSearchCalls: 1 },
  ],
  subagentConfigurationValid: true,
  usage: null,
};

class MemoryState implements LearnContentStateRepository {
  finishCalls: Array<Record<string, unknown>> = [];
  attachCalls = 0;
  touchCalls = 0;
  publicationAttempts: number;

  constructor(public nextClaim: LearnContentClaim, attempts = 0) {
    this.publicationAttempts = attempts;
  }

  async claim() { return this.nextClaim; }
  async attachSession() { this.attachCalls += 1; return true; }
  async touch() { this.touchCalls += 1; return true; }
  async recordPublicationAttempt() { this.publicationAttempts += 1; return this.publicationAttempts; }
  async finish(input: Record<string, unknown>) { this.finishCalls.push(input); return true; }
  async read(): Promise<LearnContentOperationalState> {
    return { version: 1, nextEligibleAt: null, localeCursor: 0, consecutiveFailures: 0, haltedCode: null, active: null, last: null };
  }
}

class FakeSessions implements LearnContentManagedSessionProvider {
  starts = 0;
  inspects = 0;

  constructor(
    private readonly startValue: LearnContentSessionStart = { sessionId: "session_123", status: "in_progress" },
    private readonly inspectValue: LearnContentSessionState = { status: "in_progress" },
    private readonly throwAt: "start" | "inspect" | null = null,
  ) {}

  async start() {
    this.starts += 1;
    if (this.throwAt === "start") throw new Error("redacted provider failure");
    return this.startValue;
  }

  async inspect() {
    this.inspects += 1;
    if (this.throwAt === "inspect") throw new Error("redacted provider failure");
    return this.inspectValue;
  }
}

class FakePublisher implements LearnContentPublisher {
  calls = 0;
  lastPayload: unknown = null;

  constructor(private readonly value: unknown = {
    result: "LIVE",
    operation: "CREATED",
    persistence: "COMMITTED",
    articleId: "00000000-0000-4000-8000-000000000099",
    status: "PUBLISHED",
    url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence",
    publishedAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    verified: true,
    images: [],
    verification: { checks: ["route"], attempts: 1, failureCode: null },
  }, private readonly shouldThrow = false) {}

  async publish(input: Parameters<LearnContentPublisher["publish"]>[0]) {
    this.calls += 1;
    this.lastPayload = input.payload;
    if (this.shouldThrow) throw new Error("redacted MCP transport failure");
    return this.value as Awaited<ReturnType<LearnContentPublisher["publish"]>>;
  }
}

function cronRequest(secret = SECRET) {
  return new Request("https://b4gamble.com/api/internal/cron/learn-content", {
    headers: { Authorization: `Bearer ${secret}` },
  });
}

async function runHandler(options: {
  state: MemoryState;
  sessions?: FakeSessions;
  publisher?: LearnContentPublisher;
  environment?: Record<string, string | undefined>;
  context?: LearnContentSafeContext;
  log?: (entry: Record<string, string | number | boolean | null>) => void;
}) {
  const handler = createLearnContentCronHandler({
    environment: options.environment ?? validEnvironment,
    now: () => NOW,
    state: options.state,
    sessions: options.sessions ?? new FakeSessions(),
    publisher: options.publisher ?? new FakePublisher(),
    collectContext: async () => options.context ?? safeContext(),
    log: options.log ?? (() => undefined),
  });
  const result = await handler(cronRequest());
  return { status: result.status, body: await result.json() as Record<string, unknown> };
}

test("config is fail-closed unless the autonomy switch is exactly true", () => {
  assert.equal(resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_AUTONOMY_ENABLED: "TRUE" }), null);
  assert.equal(resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_AUTONOMY_ENABLED: "false" }), null);
});

test("config defaults to English and a 24-hour minimum interval", () => {
  const config = resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_LOCALES: undefined, LEARN_CONTENT_MIN_INTERVAL_HOURS: undefined });
  assert.equal(config?.minIntervalHours, LEARN_CONTENT_DEFAULT_MIN_INTERVAL_HOURS);
  assert.deepEqual(config?.locales, [{ language: "en", locale: "en-GB" }]);
  assert.equal(config?.model, LEARN_CONTENT_DEFAULT_MODEL);
});

test("config rejects an unapproved model override instead of silently downgrading roles", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_OPENAI_MODEL: "gpt-5.4" }), /must be one of/);
});

test("config rejects a minimum interval below one day", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_MIN_INTERVAL_HOURS: "23" }), /24 through 720/);
});

test("config rejects unpublished locales", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_LOCALES: "fr" }), /unpublished language/);
});

test("config rejects duplicate locale entries", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_CONTENT_LOCALES: "en,en" }), /unique published/);
});

test("config requires Learn MCP to remain independently enabled", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_MCP_ENABLED: "false" }), /LEARN_MCP_ENABLED/);
});

test("config requires both provider and MCP secrets", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, OPENAI_API_KEY: "" }), /OPENAI_API_KEY/);
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_MCP_SERVICE_TOKEN: "" }), /LEARN_MCP_SERVICE_TOKEN/);
});

test("config requires the existing RFC-052 service actor", () => {
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_MCP_ACTOR_ID: "" }), /LEARN_MCP_ACTOR_ID/);
  assert.throws(() => resolveLearnContentConfig({ ...validEnvironment, LEARN_MCP_ACTOR_ID: "not-an-actor-id" }), /exact UUID/);
});

test("cron authentication accepts only an exact bearer secret", () => {
  assert.equal(authenticateLearnContentCron(cronRequest(), validEnvironment), true);
  assert.equal(authenticateLearnContentCron(cronRequest("x".repeat(40)), validEnvironment), false);
  assert.equal(authenticateLearnContentCron(new Request("https://b4gamble.com"), validEnvironment), false);
});

test("bounded operational state accepts metadata-only state", () => {
  const value = assertBoundedLearnContentState({ version: 1, nextEligibleAt: null, localeCursor: 0, consecutiveFailures: 0, haltedCode: null, active: run(), last: null });
  assert.ok(Buffer.byteLength(JSON.stringify(value)) < LEARN_CONTENT_MAX_STATE_BYTES);
  assert.doesNotMatch(JSON.stringify(value), /article|prompt|reasoning|contentPackage/i);
});

test("bounded operational state rejects prose-sized or unknown fields", () => {
  assert.throws(() => assertBoundedLearnContentState({
    version: 1, nextEligibleAt: null, localeCursor: 0, consecutiveFailures: 0, haltedCode: null, active: run(), last: null,
    rawReasoning: "x".repeat(5_000),
  } as never));
});

test("state repository retries a transient PostgreSQL Serializable conflict", async () => {
  let attempts = 0;
  const database = {
    $transaction: async (work: (transaction: { $queryRaw: () => Promise<Array<{ locked: boolean }>> }) => Promise<unknown>) => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error("transient Serializable conflict"), { code: "P2034" });
      return work({ $queryRaw: async () => [{ locked: false }] });
    },
  } as unknown as PrismaClient;
  const repository = new PrismaLearnContentStateRepository(database);

  assert.deepEqual(await repository.claim(stateClaimInput()), {
    action: "BUSY",
    code: "ORCHESTRATOR_LOCK_BUSY",
  });
  assert.equal(attempts, 2);
});

test("state repository bounds repeated PostgreSQL Serializable retries", async () => {
  let attempts = 0;
  const database = {
    $transaction: async () => {
      attempts += 1;
      throw Object.assign(new Error("persistent Serializable conflict"), { code: "P2034" });
    },
  } as unknown as PrismaClient;
  const repository = new PrismaLearnContentStateRepository(database);

  await assert.rejects(repository.claim(stateClaimInput()), /persistent Serializable conflict/);
  assert.equal(attempts, 3);
});

test("provider diagnostics are bounded and redact credential-like values", () => {
  const details = describeLearnContentProviderError(Object.assign(
    new Error("Provider rejected sk-do-not-log-this-secret-token for Bearer another-secret-token-value"),
    { status: 400, code: "invalid_request_error", type: "invalid_request_error", param: "agent.model" },
  ));
  assert.deepEqual({
    providerStatus: details.providerStatus,
    providerCode: details.providerCode,
    providerType: details.providerType,
    providerParam: details.providerParam,
  }, {
    providerStatus: 400,
    providerCode: "invalid_request_error",
    providerType: "invalid_request_error",
    providerParam: "agent.model",
  });
  assert.doesNotMatch(details.providerMessage, /do-not-log|another-secret/);
  assert.match(details.providerMessage, /\[REDACTED\]/);
});

test("model envelope parses a healthy SEO HOLD as NO_OP", () => {
  const parsed = parseLearnContentModelOutput(noOpEnvelope());
  assert.equal(parsed.resultClass, "NO_OP");
  assert.equal(parsed.seoHandoff.decision, "HOLD");
});

test("model envelope rejects branch field omission", () => {
  const malformed = { ...noOpEnvelope() } as Record<string, unknown>;
  delete malformed.editorReview;
  assert.throws(() => parseLearnContentModelOutput(malformed), z.ZodError);
});

test("NO_OP cannot smuggle a learn_apply payload", () => {
  const malformed = { ...noOpEnvelope(), learnApply: publishEnvelope().learnApply };
  assert.throws(() => parseLearnContentModelOutput(malformed), /NO_OP must not include/);
});

test("PUBLISH cannot carry REWRITE_REQUIRED", () => {
  const malformed = publishEnvelope();
  malformed.editorReview.decision = "REWRITE_REQUIRED";
  assert.throws(() => parseLearnContentModelOutput(malformed), /Only QA_PASS/);
});

test("PUBLISH rejects more than two rewrite rounds", () => {
  const malformed = publishEnvelope();
  malformed.contentPackage.rewriteRounds = 3;
  malformed.editorReview.rewriteRounds = 3;
  malformed.runMetadata.rewriteRounds = 3;
  assert.throws(() => parseLearnContentModelOutput(malformed));
});

test("Editor REWRITE_REQUIRED can be revised once and end in QA_PASS", () => {
  const revised = publishEnvelope();
  revised.contentPackage.rewriteRounds = 1;
  revised.editorReview.rewriteRounds = 1;
  revised.runMetadata.rewriteRounds = 1;
  revised.editorReview.issues = [];
  const parsed = parseLearnContentModelOutput(revised);
  assert.equal(parsed.resultClass, "PUBLISH");
  assert.equal(parsed.editorReview.decision, "QA_PASS");
  assert.equal(parsed.editorReview.rewriteRounds, 1);
});

test("Managed Agents JSON schema is strict-compatible and requires every envelope property", () => {
  const required = LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA.required as string[];
  assert.deepEqual(required.sort(), ["blocker", "contentPackage", "editorReview", "evidence", "learnApply", "resultClass", "runMetadata", "seoHandoff"].sort());
  assert.equal(LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA.additionalProperties, false);
  const serialized = JSON.stringify(LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA);
  assert.doesNotMatch(serialized, /"oneOf":/);
  assert.doesNotMatch(serialized, /"format":/);
  assert.doesNotMatch(serialized, /"prefixItems":/);
  assert.match(serialized, /"anyOf":/);
  const agentNames = ((LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA.properties as Record<string, unknown>).runMetadata as { properties: Record<string, unknown> }).properties.agentNames as { items: { anyOf: unknown[] }; minItems: number; maxItems: number };
  assert.equal(agentNames.items.anyOf.length, 3);
  assert.equal(agentNames.minItems, 3);
  assert.equal(agentNames.maxItems, 3);
});

test("subagent role evidence accepts an exact nickname or one unambiguous exact role assignment", () => {
  assert.equal(resolveLearnContentSubagentRoleName({ name: LEARN_CONTENT_ROLE_NAMES[0], instructions: null }), LEARN_CONTENT_ROLE_NAMES[0]);
  assert.equal(resolveLearnContentSubagentRoleName({ name: null, instructions: [{ type: "output_text", text: `You are ${LEARN_CONTENT_ROLE_NAMES[1]}. Research the handoff.` }] }), LEARN_CONTENT_ROLE_NAMES[1]);
  assert.equal(resolveLearnContentSubagentRoleName({ name: null, instructions: [{ type: "output_text", text: LEARN_CONTENT_ROLE_NAMES.join(" and ") }] }), "");
});

test("NO_OP requires the separated SEO role", () => {
  const result = parseLearnContentModelOutput(noOpEnvelope());
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: [], subagentConfigurationValid: true, usage: null }), { ok: false, code: "SEO_ROLE_MISSING" });
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: [{ name: LEARN_CONTENT_ROLE_NAMES[0], webSearchCalls: 0 }], subagentConfigurationValid: true, usage: null }), { ok: true });
});

test("all editorial results reject a downgraded subagent configuration", () => {
  const result = parseLearnContentModelOutput(noOpEnvelope());
  assert.deepEqual(validateLearnContentRoleTrace(result, {
    roles: [{ name: LEARN_CONTENT_ROLE_NAMES[0], webSearchCalls: 0 }],
    subagentConfigurationValid: false,
    usage: null,
  }), { ok: false, code: "SUBAGENT_CONFIGURATION_INVALID" });
});

test("PUBLISH requires Research and Editor role traces", () => {
  const result = parseLearnContentModelOutput(publishEnvelope());
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: [{ name: LEARN_CONTENT_ROLE_NAMES[0], webSearchCalls: 0 }], subagentConfigurationValid: true, usage: null }), { ok: false, code: "RESEARCH_ROLE_MISSING" });
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: [allRoleTrace.roles[0], allRoleTrace.roles[1]], subagentConfigurationValid: true, usage: null }), { ok: false, code: "EDITOR_ROLE_MISSING" });
});

test("PUBLISH requires live research evidence from both research and editor roles", () => {
  const result = parseLearnContentModelOutput(publishEnvelope());
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: allRoleTrace.roles.map((item) => ({ ...item, webSearchCalls: item.name === LEARN_CONTENT_ROLE_NAMES[1] ? 0 : item.webSearchCalls })), subagentConfigurationValid: true, usage: null }), { ok: false, code: "RESEARCH_WEB_SEARCH_MISSING" });
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: allRoleTrace.roles.map((item) => ({ ...item, webSearchCalls: item.name === LEARN_CONTENT_ROLE_NAMES[2] ? 0 : item.webSearchCalls })), subagentConfigurationValid: true, usage: null }), { ok: false, code: "EDITOR_WEB_SEARCH_MISSING" });
});

test("BLOCKED after editorial work still requires all separated role and live-search traces", () => {
  const result = parseLearnContentModelOutput(blockedEnvelope());
  assert.deepEqual(validateLearnContentRoleTrace(result, { roles: [allRoleTrace.roles[0]], subagentConfigurationValid: true, usage: null }), { ok: false, code: "RESEARCH_ROLE_MISSING" });
  assert.deepEqual(validateLearnContentRoleTrace(result, allRoleTrace), { ok: true });
});

test("CREATE payload passes deterministic publication validation", () => {
  const result = parseLearnContentModelOutput(publishEnvelope());
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: true });
});

test("UPDATE requires the exact Article id and expectedUpdatedAt from the current snapshot", () => {
  const result = parseLearnContentModelOutput(publishEnvelope({ update: true }));
  const context = safeContext([{ id: ARTICLE_ID, slug: "old-slug", title: "Old", category: "casino-safety", locale: "en-GB", publishedAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-22T10:00:00.000Z", url: "https://b4gamble.com/en/learn/casino-safety/old-slug" }]);
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context, allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: true });
  const stale = parseLearnContentModelOutput(publishEnvelope({ update: true, expectedUpdatedAt: "2026-09-22T09:00:00.000Z" }));
  assert.deepEqual(validateLearnContentPublication({ result: stale as Extract<typeof stale, { resultClass: "PUBLISH" }>, run: run(), context, allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "UPDATE_VERSION_STALE" });
});

test("CREATE refuses a slug that appeared before publication", () => {
  const result = parseLearnContentModelOutput(publishEnvelope());
  const context = safeContext([{ id: ARTICLE_ID, slug: "verify-a-gambling-licence", title: "Existing", category: "casino-safety", locale: "en-GB", publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence" }]);
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context, allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "CREATE_SLUG_ALREADY_EXISTS" });
});

test("canonical URL must exactly match the candidate public Article route", () => {
  const envelope = publishEnvelope();
  envelope.learnApply.article.seo.canonicalUrl = "/en/learn/casino-safety/a-different-article";
  const result = parseLearnContentModelOutput(envelope);
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "CANONICAL_URL_NOT_ALLOWED" });
});

test("material claims require Editor verification and source mapping", () => {
  const unverified = publishEnvelope();
  unverified.editorReview.verifiedClaimIds = [];
  const parsed = parseLearnContentModelOutput(unverified);
  assert.deepEqual(validateLearnContentPublication({ result: parsed as Extract<typeof parsed, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "MATERIAL_CLAIM_NOT_VERIFIED" });
});

test("Editor verification cannot cite phantom claims or sources", () => {
  const phantomClaim = publishEnvelope();
  phantomClaim.editorReview.verifiedClaimIds.push("claim-phantom");
  const claimResult = parseLearnContentModelOutput(phantomClaim);
  assert.deepEqual(validateLearnContentPublication({ result: claimResult as Extract<typeof claimResult, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "EDITOR_CLAIM_VERIFICATION_INVALID" });

  const phantomSource = publishEnvelope();
  phantomSource.editorReview.independentlyCheckedSourceIds.push("source-phantom");
  const sourceResult = parseLearnContentModelOutput(phantomSource);
  assert.deepEqual(validateLearnContentPublication({ result: sourceResult as Extract<typeof sourceResult, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "EDITOR_SOURCE_VERIFICATION_INVALID" });
});

test("public evidence must have been accessed within the active live-research window", () => {
  const envelope = publishEnvelope();
  envelope.evidence[0].accessedAt = "2026-09-22T10:59:59.999Z";
  const result = parseLearnContentModelOutput(envelope);
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "EVIDENCE_TIMESTAMP_INVALID" });
});

test("commercial Article routes and ranking language fail the safety firewall", () => {
  const routeEnvelope = publishEnvelope();
  routeEnvelope.learnApply.article.bodyBlocks.push({ id: "casino", type: "link", label: "Casino", url: "/casino/example", description: "Commercial route." });
  const routeResult = parseLearnContentModelOutput(routeEnvelope);
  assert.deepEqual(validateLearnContentPublication({ result: routeResult as Extract<typeof routeResult, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "ARTICLE_LINK_NOT_ALLOWED" });

  const rankingEnvelope = publishEnvelope();
  rankingEnvelope.learnApply.article.title = "Top online casinos";
  const rankingResult = parseLearnContentModelOutput(rankingEnvelope);
  assert.deepEqual(validateLearnContentPublication({ result: rankingResult as Extract<typeof rankingResult, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "COMMERCIAL_SAFETY_FIREWALL" });
});

test("crisis material requires a protected help route", () => {
  const parsed = parseLearnContentModelOutput(publishEnvelope({ crisis: true }));
  assert.deepEqual(validateLearnContentPublication({ result: parsed as Extract<typeof parsed, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: false, code: "CRISIS_HELP_ROUTE_REQUIRED" });
});

test("localized protected Help routes satisfy addiction safety material", () => {
  const envelope = publishEnvelope();
  envelope.learnApply.article.bodyBlocks[0] = { id: "intro", type: "paragraph", text: "Gambling addiction can involve loss of control." };
  const help = envelope.learnApply.article.bodyBlocks.find((block) => block.id === "help");
  if (help?.type === "link") help.url = "/en/help";
  const result = parseLearnContentModelOutput(envelope);
  assert.deepEqual(validateLearnContentPublication({ result: result as Extract<typeof result, { resultClass: "PUBLISH" }>, run: run(), context: safeContext(), allowedLocales: new Set(["en-GB"]), now: NOW }), { ok: true });
});

test("unauthorized cron does not touch state or providers", async () => {
  const state = new MemoryState({ action: "LAUNCH", run: run({ sessionId: null }) });
  const sessions = new FakeSessions();
  const handler = createLearnContentCronHandler({ environment: validEnvironment, state, sessions, log: () => undefined });
  const result = await handler(cronRequest("x".repeat(40)));
  assert.equal(result.status, 401);
  assert.equal(sessions.starts, 0);
});

test("missing CRON_SECRET is unavailable rather than treated as a credential mismatch", async () => {
  const handler = createLearnContentCronHandler({ environment: { ...validEnvironment, CRON_SECRET: "" }, log: () => undefined });
  const result = await handler(cronRequest());
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, "CRON_UNAVAILABLE");
});

test("disabled cron is a healthy NO_OP without state access", async () => {
  let claimed = false;
  const state = new MemoryState({ action: "BUSY", code: "never" });
  state.claim = async () => { claimed = true; return { action: "BUSY", code: "never" }; };
  const handler = createLearnContentCronHandler({ environment: { ...validEnvironment, LEARN_CONTENT_AUTONOMY_ENABLED: "false" }, state, log: () => undefined });
  const result = await handler(cronRequest());
  assert.equal((await result.json()).code, "AUTONOMY_DISABLED");
  assert.equal(claimed, false);
});

test("concurrency BUSY is a healthy NO_OP", async () => {
  const result = await runHandler({ state: new MemoryState({ action: "BUSY", code: "ORCHESTRATOR_LOCK_BUSY" }) });
  assert.deepEqual(result.body, { result: "NO_OP", code: "ORCHESTRATOR_LOCK_BUSY" });
});

test("minimum interval suppression is a healthy NO_OP", async () => {
  const result = await runHandler({ state: new MemoryState({ action: "NOT_DUE", code: "MINIMUM_INTERVAL_ACTIVE" }) });
  assert.equal(result.body.code, "MINIMUM_INTERVAL_ACTIVE");
});

test("halted state blocks all new cycles", async () => {
  const result = await runHandler({ state: new MemoryState({ action: "HALTED", code: "PERSISTED_NOT_VERIFIED_LIMIT" }) });
  assert.equal(result.body.result, "BLOCKED");
});

test("launch creates one managed session and records its id", async () => {
  const state = new MemoryState({ action: "LAUNCH", run: run({ sessionId: null }) });
  const sessions = new FakeSessions();
  const result = await runHandler({ state, sessions });
  assert.equal(result.body.result, "STARTED");
  assert.equal(sessions.starts, 1);
  assert.equal(sessions.inspects, 0);
  assert.equal(state.attachCalls, 1);
});

test("managed session start failure remains retryable without closing the daily cycle", async () => {
  const state = new MemoryState({ action: "LAUNCH", run: run({ sessionId: null }) });
  const entries: Array<Record<string, string | number | boolean | null>> = [];
  const result = await runHandler({
    state,
    sessions: new FakeSessions(undefined, undefined, "start"),
    log: (entry) => entries.push(entry),
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.result, "RETRY_PENDING");
  assert.equal(result.body.code, "SESSION_START_FAILED");
  assert.equal(state.finishCalls.length, 0);
  assert.equal(entries.at(-1)?.event, "run_retry_pending");
  assert.equal(entries.at(-1)?.providerType, "Error");
});

test("in-progress reconciliation touches the lease and does not publish", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "in_progress" }), publisher });
  assert.equal(result.body.code, "SESSION_IN_PROGRESS");
  assert.equal(state.touchCalls, 1);
  assert.equal(publisher.calls, 0);
});

test("requires_action fails closed and halts the run", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "requires_action" }) });
  assert.equal(result.body.code, "UNEXPECTED_REQUIRED_ACTION");
  assert.equal(state.finishCalls.at(-1)?.halt, true);
});

test("failed managed session never calls the publisher", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "failed", code: "MANAGED_SESSION_FAILED" }), publisher });
  assert.equal(result.body.code, "MANAGED_SESSION_FAILED");
  assert.equal(publisher.calls, 0);
});

test("malformed model output is blocked before publication", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: { resultClass: "PUBLISH" }, trace: allRoleTrace }), publisher });
  assert.equal(result.body.code, "OUTPUT_CONTRACT_FAILURE");
  assert.equal(publisher.calls, 0);
});

test("SEO HOLD completes as healthy NO_OP and skips Research, Editor, and MCP", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: noOpEnvelope("HOLD"), trace: { roles: [{ name: LEARN_CONTENT_ROLE_NAMES[0], webSearchCalls: 0 }], subagentConfigurationValid: true, usage: null } }), publisher });
  assert.equal(result.body.result, "NO_OP");
  assert.equal(result.body.code, "HOLD");
  assert.equal(publisher.calls, 0);
});

test("model BLOCKED completes without publication", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: blockedEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.code, "INSUFFICIENT_EVIDENCE");
  assert.equal(publisher.calls, 0);
});

test("rewrite limit reached returns BLOCKED and cannot publish", async () => {
  const limited = blockedEnvelope();
  limited.blocker.code = "EDITOR_REWRITE_LIMIT";
  limited.runMetadata.rewriteRounds = 2;
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: limited, trace: allRoleTrace }), publisher });
  assert.equal(result.body.code, "EDITOR_REWRITE_LIMIT");
  assert.equal(publisher.calls, 0);
});

test("valid CREATE publishes once and completes only after verified LIVE", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher();
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.result, "PUBLISHED");
  assert.equal(result.body.verified, true);
  assert.equal(publisher.calls, 1);
  assert.deepEqual(publisher.lastPayload, publishEnvelope().learnApply);
});

test("valid UPDATE preserves exact id and expectedUpdatedAt through MCP", async () => {
  const article = { id: ARTICLE_ID, slug: "old", title: "Old", category: "casino-safety", locale: "en-GB", publishedAt: NOW.toISOString(), updatedAt: "2026-09-22T10:00:00.000Z", url: "https://b4gamble.com/en/learn/casino-safety/old" };
  const live = new FakePublisher({
    result: "LIVE", operation: "UPDATED", persistence: "COMMITTED", articleId: ARTICLE_ID, status: "PUBLISHED",
    url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence", publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: true,
    images: [], verification: { checks: ["route"], attempts: 1, failureCode: null },
  });
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope({ update: true }), trace: allRoleTrace }), publisher: live, context: safeContext([article]) });
  assert.equal(result.body.code, "UPDATED");
  assert.equal((live.lastPayload as ReturnType<typeof publishEnvelope>["learnApply"]).article.articleId, ARTICLE_ID);
  assert.equal((live.lastPayload as ReturnType<typeof publishEnvelope>["learnApply"]).article.expectedUpdatedAt, article.updatedAt);
});

test("MCP transport failure remains retryable with the same session payload", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher: new FakePublisher(undefined, true) });
  assert.equal(result.body.result, "RETRY_PENDING");
  assert.equal(state.finishCalls.length, 0);
});

test("MCP authentication failure halts without exposing credential detail", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher: LearnContentPublisher = {
    async publish() { throw new LearnContentPublisherError("MCP_AUTH_FAILED"); },
  };
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.code, "MCP_AUTH_FAILED");
  assert.equal(state.finishCalls.at(-1)?.halt, true);
});

test("MCP NOT_COMMITTED application failure retries and is not success", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher({ result: "ERROR", error: { code: "APPLY_FAILED", message: "Safe failure", persistence: "NOT_COMMITTED" } });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.result, "RETRY_PENDING");
  assert.equal(result.body.code, "MCP_NOT_COMMITTED_RETRY_PENDING");
});

test("PERSISTED_NOT_VERIFIED is not success and retries", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher({
    result: "PERSISTED_NOT_VERIFIED", operation: "CREATED", persistence: "COMMITTED",
    articleId: ARTICLE_ID, status: "PUBLISHED", url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence",
    publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: false, images: [],
    verification: { checks: ["database"], attempts: 3, failureCode: "PUBLIC_ROUTE_FAILED" },
  });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.result, "RETRY_PENDING");
  assert.equal(result.body.code, "PERSISTED_NOT_VERIFIED");
});

test("third PERSISTED_NOT_VERIFIED halts future autonomous cycles", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run({ publicationAttempts: 2 }) }, 2);
  const publisher = new FakePublisher({
    result: "PERSISTED_NOT_VERIFIED", operation: "CREATED", persistence: "COMMITTED",
    articleId: ARTICLE_ID, status: "PUBLISHED", url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence",
    publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: false, images: [],
    verification: { checks: ["database"], attempts: 3, failureCode: "PUBLIC_ROUTE_FAILED" },
  });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.code, "PERSISTED_NOT_VERIFIED_LIMIT");
  assert.equal(state.finishCalls.at(-1)?.halt, true);
});

test("LIVE with an unverified projection is never reported as success", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const liveButUnverified = new FakePublisher({
    result: "LIVE", operation: "CREATED", persistence: "COMMITTED", articleId: ARTICLE_ID, status: "PUBLISHED",
    url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence", publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: false,
    images: [], verification: { checks: ["database"], attempts: 1, failureCode: "PUBLIC_ROUTE_FAILED" },
  });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher: liveButUnverified });
  assert.notEqual(result.body.result, "PUBLISHED");
});

test("LIVE with the wrong public route or operation is never reported as success", async () => {
  for (const override of [
    { url: "https://b4gamble.com/en/learn/casino-safety/a-different-article" },
    { operation: "UPDATED" as const },
  ]) {
    const state = new MemoryState({ action: "RECONCILE", run: run() });
    const publisher = new FakePublisher({
      result: "LIVE", operation: "CREATED", persistence: "COMMITTED", articleId: ARTICLE_ID, status: "PUBLISHED",
      url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence", publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: true,
      images: [], verification: { checks: ["route"], attempts: 1, failureCode: null }, ...override,
    });
    const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
    assert.notEqual(result.body.result, "PUBLISHED");
  }
});

test("NO_CHANGE/LIVE is a successful idempotent completion", async () => {
  const state = new MemoryState({ action: "RECONCILE", run: run() });
  const publisher = new FakePublisher({
    result: "LIVE", operation: "NO_CHANGE", persistence: "COMMITTED", articleId: ARTICLE_ID, status: "PUBLISHED",
    url: "https://b4gamble.com/en/learn/casino-safety/verify-a-gambling-licence", publishedAt: NOW.toISOString(), updatedAt: NOW.toISOString(), verified: true,
    images: [], verification: { checks: ["route"], attempts: 1, failureCode: null },
  });
  const result = await runHandler({ state, sessions: new FakeSessions(undefined, { status: "idle", output: publishEnvelope(), trace: allRoleTrace }), publisher });
  assert.equal(result.body.result, "PUBLISHED");
  assert.equal(result.body.code, "NO_CHANGE");
});

import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import {
  LEARN_CONTENT_SOURCE_LOCALE,
  learnContentInventoryLocales,
  resolveLearnContentLaunchLocales,
} from "@/lib/learn-content-orchestrator/config";
import {
  LearnContextError,
  learnContextResultSchema,
  readLearnContext,
  type LearnContextResult,
} from "@/lib/learn-content-orchestrator/learn-context.server";
import {
  collectLearnContentSafeContext,
  LEARN_CONTENT_MAX_ARTICLE_INVENTORY,
  LearnContentInventoryLimitError,
  type LearnContentSafeContext,
} from "@/lib/learn-content-orchestrator/safe-context.server";
import {
  LearnSourceError,
  learnSourceResultSchema,
  readLearnSource,
} from "@/lib/learn-content-orchestrator/learn-source.server";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";
import { createLearnMcpServer, learnApplyTool, learnContextTool } from "@/lib/mcp/learn/server";

const NOW = new Date("2026-09-30T12:00:00.000Z");
const LAUNCH = { LEARN_CONTENT_LOCALES: "en,sv,da,de" };

type InventoryRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  locale: string;
  publishedAt: Date | null;
  updatedAt: Date;
};

function row(index: number, locale: string, extra: Record<string, unknown> = {}): InventoryRow {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    slug: `guide-${locale.toLowerCase()}-${index}`,
    title: `Guide ${index}`,
    category: "casino-bonuses",
    locale,
    publishedAt: new Date("2026-09-20T10:00:00.000Z"),
    updatedAt: new Date("2026-09-21T10:00:00.000Z"),
    ...extra,
  };
}

/** A fake Article reader that answers the way Prisma would for the captured where clause. */
function inventory(rows: InventoryRow[]) {
  const calls: unknown[] = [];
  return {
    calls,
    database: {
      article: {
        async findMany(args: unknown) {
          calls.push(args);
          const where = (args as { where: { locale: { in: string[] } } }).where;
          return rows.filter((candidate) => where.locale.in.includes(candidate.locale));
        },
      },
    },
  };
}

function reader(rows: InventoryRow[], environment: Record<string, string | undefined> = LAUNCH) {
  const fake = inventory(rows);
  const collected: Array<readonly string[]> = [];
  return {
    calls: fake.calls,
    collected,
    read: (input: unknown) => readLearnContext(input, {
      environment,
      now: () => NOW,
      collect: (locales, now) => {
        collected.push(locales);
        return collectLearnContentSafeContext(locales, fake.database, now);
      },
    }),
  };
}

async function contextError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof LearnContextError);
    return error;
  }
  assert.fail("expected a LearnContextError");
}

const seeded = [
  row(1, "en-GB"),
  row(2, "en-GB", { category: "responsible-gambling" }),
  row(3, "sv-SE"),
  row(4, "da-DK"),
  row(5, "de-DE"),
];

// Launch locales keep the hosted order.

test("launch locales default to English and keep the configured order", () => {
  assert.deepEqual(resolveLearnContentLaunchLocales({}), [{ language: "en", locale: "en-GB", publicPathPrefix: "/en" }]);
  assert.deepEqual(resolveLearnContentLaunchLocales(LAUNCH), [
    { language: "en", locale: "en-GB", publicPathPrefix: "/en" },
    { language: "sv", locale: "sv-SE", publicPathPrefix: "/sv" },
    { language: "da", locale: "da-DK", publicPathPrefix: "/da" },
    { language: "de", locale: "de-DE", publicPathPrefix: "/de" },
  ]);
  assert.deepEqual(resolveLearnContentLaunchLocales({ LEARN_CONTENT_LOCALES: "de, EN" }).map((locale) => locale.language), ["de", "en"]);
});

test("launch locales reject unpublished and duplicate languages", () => {
  assert.throws(() => resolveLearnContentLaunchLocales({ LEARN_CONTENT_LOCALES: "en,fr" }), /unpublished language: fr/);
  assert.throws(() => resolveLearnContentLaunchLocales({ LEARN_CONTENT_LOCALES: "en,sv,en" }), /unique published language slugs/);
});

test("a non-English cycle sees its own locale plus the English source guides", () => {
  assert.equal(LEARN_CONTENT_SOURCE_LOCALE, "en-GB");
  assert.deepEqual(learnContentInventoryLocales("en-GB"), ["en-GB"]);
  assert.deepEqual(learnContentInventoryLocales("sv-SE"), ["sv-SE", "en-GB"]);
});

// The collector reads published metadata only.

test("the collector asks only for PUBLISHED Article metadata and never prose", async () => {
  const fake = inventory(seeded);
  await collectLearnContentSafeContext(["sv-SE", "en-GB"], fake.database, NOW);
  assert.deepEqual(fake.calls, [{
    where: { status: "PUBLISHED", locale: { in: ["sv-SE", "en-GB"] } },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: LEARN_CONTENT_MAX_ARTICLE_INVENTORY + 1,
    select: { id: true, slug: true, title: true, category: true, locale: true, publishedAt: true, updatedAt: true },
  }]);
});

test("the collector keeps the 500-Article ceiling", async () => {
  const atLimit = Array.from({ length: LEARN_CONTENT_MAX_ARTICLE_INVENTORY }, (_, index) => row(index + 1, "en-GB"));
  const context = await collectLearnContentSafeContext(["en-GB"], inventory(atLimit).database, NOW);
  assert.equal(context.articles.length, LEARN_CONTENT_MAX_ARTICLE_INVENTORY);
  await assert.rejects(
    () => collectLearnContentSafeContext(["en-GB"], inventory([...atLimit, row(501, "en-GB")]).database, NOW),
    LearnContentInventoryLimitError,
  );
});

// learn_context scope.

test("English context contains only English guides and no duplicated source scope", async () => {
  const context = reader(seeded);
  const result = await context.read({ targetLanguage: "en" });
  assert.deepEqual(context.collected, [["en-GB"]]);
  assert.deepEqual(result.target, { language: "en", locale: "en-GB", publicPathPrefix: "/en" });
  assert.equal(result.sourceLocale, "en-GB");
  assert.deepEqual(result.articles.map((article) => article.slug), ["guide-en-gb-1", "guide-en-gb-2"]);
});

test("Swedish, Danish and German context contain the target locale plus the English source guides", async () => {
  for (const [language, locale, prefix] of [["sv", "sv-SE", "/sv"], ["da", "da-DK", "/da"], ["de", "de-DE", "/de"]] as const) {
    const context = reader(seeded);
    const result = await context.read({ targetLanguage: language });
    assert.deepEqual(context.collected, [[locale, "en-GB"]]);
    assert.deepEqual(result.target, { language, locale, publicPathPrefix: prefix });
    assert.deepEqual(new Set(result.articles.map((article) => article.locale)), new Set([locale, "en-GB"]));
  }
});

test("context exposes the ordered launch locales, categories, Programme and protected routes", async () => {
  const result = await reader(seeded).read({ targetLanguage: "da" });
  assert.deepEqual(result.launchLocales.map((locale) => locale.language), ["en", "sv", "da", "de"]);
  assert.ok(result.categories.some((category) => category.slug === "responsible-gambling"));
  assert.ok(result.categories.some((category) => category.slug === "casino-bonuses"));
  assert.ok(result.categories.every((category) => category.title && category.description));
  assert.deepEqual(
    { ...result.publicProgramme, description: typeof result.publicProgramme.description },
    { route: "/10-steps", applicationRoute: "/program", missionCount: 10, description: "string" },
  );
  assert.deepEqual(result.protectedRoutes, ["/help", "/responsible-gambling"]);
  assert.equal(result.generatedAt, NOW.toISOString());
  assert.equal(result.articles.find((article) => article.slug === "guide-da-dk-4")?.url, "https://b4gamble.com/da/learn/casino-bonuses/guide-da-dk-4");
});

test("context returns only allowlisted public fields even when the reader over-returns", async () => {
  const leaky = seeded.map((candidate) => ({
    ...candidate,
    excerpt: "private excerpt prose",
    bodyBlocks: [{ type: "paragraph", text: "ARTICLE BODY PROSE" }],
    createdBy: "service-actor",
    status: "PUBLISHED",
  }));
  const result = await reader(leaky).read({ targetLanguage: "sv" });
  assert.deepEqual(Object.keys(result).sort(), [
    "articles", "categories", "generatedAt", "launchLocales", "protectedRoutes", "publicProgramme", "sourceLocale", "target",
  ]);
  for (const article of result.articles) {
    assert.deepEqual(Object.keys(article).sort(), ["category", "id", "locale", "publishedAt", "slug", "title", "updatedAt", "url"]);
  }
  assert.doesNotMatch(JSON.stringify(result), /ARTICLE BODY PROSE|private excerpt|service-actor|bodyBlocks|excerpt|createdBy/);
  assert.equal(learnContextResultSchema.safeParse({ ...result, users: [] }).success, false);
  assert.equal(learnContextResultSchema.safeParse({ ...result, articles: [{ ...result.articles[0], bodyBlocks: [] }] }).success, false);
});

test("any published language is a context target, whatever the server rotates", async () => {
  const englishOnlyServer = reader(seeded, { LEARN_CONTENT_LOCALES: "en" });
  const swedish = await englishOnlyServer.read({ targetLanguage: "sv" });
  assert.deepEqual(swedish.target, { language: "sv", locale: "sv-SE", publicPathPrefix: "/sv" });
  assert.deepEqual(swedish.launchLocales.map((locale) => locale.language), ["en"]);
  assert.deepEqual(englishOnlyServer.collected, [["sv-SE", "en-GB"]]);
  assert.equal((await reader(seeded).read({ targetLanguage: "es" })).target.locale, "es-ES");
});

test("context rejects unpublished languages and malformed input", async () => {
  const context = reader(seeded);
  assert.equal((await contextError(context.read({ targetLanguage: "fr" }))).code, "TARGET_LANGUAGE_NOT_ALLOWED");
  assert.equal((await contextError(context.read({ targetLanguage: "xx" }))).code, "TARGET_LANGUAGE_NOT_ALLOWED");
  assert.equal((await contextError(context.read({ targetLanguage: "EN" }))).code, "INVALID_INPUT");
  assert.equal((await contextError(context.read({ targetLanguage: "en-GB" }))).code, "INVALID_INPUT");
  assert.equal((await contextError(context.read({}))).code, "INVALID_INPUT");
  assert.equal((await contextError(context.read({ targetLanguage: "en", articleId: "x" }))).code, "INVALID_INPUT");
  assert.equal((await contextError(reader(seeded, { LEARN_CONTENT_LOCALES: "en,fr" }).read({ targetLanguage: "en" }))).code, "LAUNCH_LOCALES_INVALID");
  assert.deepEqual(context.collected, []);
});

test("context maps the inventory ceiling and read failures to safe codes", async () => {
  const tooMany = Array.from({ length: LEARN_CONTENT_MAX_ARTICLE_INVENTORY + 1 }, (_, index) => row(index + 1, "en-GB"));
  const limit = await contextError(reader(tooMany).read({ targetLanguage: "en" }));
  assert.deepEqual([limit.code, limit.retryable], ["CONTEXT_INVENTORY_LIMIT", false]);
  const unavailable = await contextError(readLearnContext({ targetLanguage: "en" }, {
    environment: LAUNCH,
    collect: async () => {
      throw new Error("connection refused at postgres://secret@host");
    },
  }));
  assert.deepEqual([unavailable.code, unavailable.retryable], ["CONTEXT_UNAVAILABLE", true]);
  assert.doesNotMatch(unavailable.message, /secret|postgres/);
});

// MCP surface.

async function connected(readContext: (input: unknown) => Promise<LearnContextResult>) {
  let applyCalls = 0;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLearnMcpServer({
    apply: async () => {
      applyCalls += 1;
      throw new Error("learn_context must never reach learn_apply");
    },
  }, readContext);
  const client = new Client({ name: "learn-context-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    applyCalls: () => applyCalls,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

test("MCP discovery exposes learn_context, learn_source and learn_apply, and only learn_apply writes", async () => {
  const session = await connected(reader(seeded).read);
  try {
    const discovered = await session.client.listTools();
    assert.deepEqual(discovered.tools.map((tool) => tool.name), ["learn_context", "learn_source", "learn_apply"]);
    const byName = Object.fromEntries(discovered.tools.map((tool) => [tool.name, tool]));
    assert.deepEqual(byName.learn_context?.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.deepEqual(byName.learn_source?.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.deepEqual(discovered.tools.filter((tool) => tool.annotations?.readOnlyHint !== true).map((tool) => tool.name), ["learn_apply"]);
    assert.deepEqual(byName.learn_apply?.annotations, learnApplyTool.annotations);
    assert.equal(learnApplyTool.annotations.readOnlyHint, false);
    assert.deepEqual(learnContextTool.inputSchema.required, ["targetLanguage"]);
    assert.equal(learnContextTool.inputSchema.additionalProperties, false);
  } finally {
    await session.close();
  }
});

test("MCP learn_context returns schema-valid context and never calls learn_apply", async () => {
  const session = await connected(reader(seeded).read);
  try {
    const result = await session.client.callTool({ name: "learn_context", arguments: { targetLanguage: "de" } });
    assert.equal(result.isError, undefined);
    const structured = learnContextResultSchema.parse(result.structuredContent);
    assert.equal(structured.target.locale, "de-DE");
    assert.deepEqual(new Set(structured.articles.map((article) => article.locale)), new Set(["de-DE", "en-GB"]));
    assert.equal(session.applyCalls(), 0);
  } finally {
    await session.close();
  }
});

test("MCP learn_context reports an invalid language as a structured, schema-declared error", async () => {
  const session = await connected(reader(seeded).read);
  try {
    const result = await session.client.callTool({ name: "learn_context", arguments: { targetLanguage: "fr" } });
    assert.equal(result.isError, true);
    assert.deepEqual(result.structuredContent, {
      result: "ERROR",
      error: {
        code: "TARGET_LANGUAGE_NOT_ALLOWED",
        message: "targetLanguage must be a published language: en, de, es, el, sv, da, it, pt, nl, fi, nb.",
        retryable: false,
      },
    });
    assert.equal(session.applyCalls(), 0);
  } finally {
    await session.close();
  }
});

test("HTTP learn_context requires the Learn service bearer and answers private, no-store", async (context) => {
  const keys = ["LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID", "LEARN_CONTENT_LOCALES"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const token = "learn-context-service-token-with-more-than-32-bytes";
  Object.assign(process.env, {
    LEARN_MCP_ENABLED: "true",
    LEARN_MCP_SERVICE_TOKEN: token,
    LEARN_MCP_ACTOR_ID: "22222222-2222-4222-8222-222222222222",
    LEARN_CONTENT_LOCALES: "en,sv,da,de",
  });
  const call = (headers: Record<string, string>) => handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { accept: "application/json, text/event-stream", "content-type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "learn_context", arguments: { targetLanguage: "fr" } } }),
  }));

  assert.equal((await call({})).status, 401);
  assert.equal((await call({ authorization: "Bearer wrong-token-with-more-than-thirty-two-bytes" })).status, 401);

  const authorized = await call({ authorization: `Bearer ${token}` });
  assert.equal(authorized.status, 200);
  assert.match(authorized.headers.get("cache-control") ?? "", /private, no-store/);
  const payload = await authorized.json() as { result?: { isError?: boolean; structuredContent?: { error?: { code?: string } } } };
  assert.equal(payload.result?.isError, true);
  assert.equal(payload.result?.structuredContent?.error?.code, "TARGET_LANGUAGE_NOT_ALLOWED");

  const listed = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { accept: "application/json, text/event-stream", "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  }));
  const tools = await listed.json() as { result?: { tools?: Array<{ name?: string }> } };
  assert.deepEqual(tools.result?.tools?.map((tool) => tool.name), ["learn_context", "learn_source", "learn_apply"]);
});

test("context generatedAt, Programme and routes come from the shared public collector", async () => {
  const collected: LearnContentSafeContext = await collectLearnContentSafeContext(["en-GB"], inventory(seeded).database, NOW);
  const result = await readLearnContext({ targetLanguage: "en" }, { environment: LAUNCH, now: () => NOW, collect: async () => collected });
  assert.equal(result.generatedAt, collected.generatedAt);
  assert.deepEqual(result.publicProgramme, collected.publicProgramme);
  assert.deepEqual(result.protectedRoutes, [...collected.protectedRoutes]);
  assert.deepEqual(result.categories, collected.categories);
});

// learn_source: the published text a localization starts from.

function sourceRow(extra: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "wagering-requirements",
    locale: "en-GB",
    category: "casino-bonuses",
    title: "Wagering Requirements Explained",
    excerpt: "How the multiplier works.",
    tags: ["Bonuses"],
    readingTime: "8 min",
    difficulty: null,
    seoTitle: "Wagering requirements explained",
    seoDescription: "Calculate the turnover.",
    heroImageAlt: "A calculator on a desk",
    bodyBlocks: [{ id: "intro", type: "paragraph", text: "The answer first." }],
    publishedAt: new Date("2026-09-20T10:00:00.000Z"),
    updatedAt: new Date("2026-09-21T10:00:00.000Z"),
    ...extra,
  };
}

function sourceDatabase(row: Record<string, unknown> | null) {
  const calls: unknown[] = [];
  return {
    calls,
    database: { article: { async findFirst(args: unknown) { calls.push(args); return row as never; } } },
  };
}

test("learn_source reads only a PUBLISHED Article and returns its public fields", async () => {
  const fake = sourceDatabase(sourceRow({ createdBy: "actor", updatedBy: "actor", status: "PUBLISHED", lastReviewedAt: new Date() }));
  const result = await readLearnSource({ slug: "wagering-requirements" }, fake.database);
  const call = fake.calls[0] as { where: unknown; select: Record<string, boolean> };
  assert.deepEqual(call.where, { slug: "wagering-requirements", status: "PUBLISHED" });
  assert.equal(call.select.createdBy, undefined);
  assert.equal(result.url, "https://b4gamble.com/en/learn/casino-bonuses/wagering-requirements");
  assert.deepEqual(result.bodyBlocks, [{ id: "intro", type: "paragraph", text: "The answer first." }]);
  assert.doesNotMatch(JSON.stringify(result), /createdBy|updatedBy|lastReviewedAt|"status"/);
  assert.equal(learnSourceResultSchema.safeParse({ ...result, createdBy: "x" }).success, false);
});

test("learn_source rejects malformed slugs and unknown or unpublished Articles", async () => {
  const missing = sourceDatabase(null);
  await assert.rejects(() => readLearnSource({ slug: "draft-only" }, missing.database), (error: unknown) => error instanceof LearnSourceError && error.code === "ARTICLE_NOT_FOUND");
  await assert.rejects(() => readLearnSource({ slug: "Bad Slug" }, missing.database), (error: unknown) => error instanceof LearnSourceError && error.code === "INVALID_INPUT");
  await assert.rejects(() => readLearnSource({ slug: "x", locale: "en" }, missing.database), (error: unknown) => error instanceof LearnSourceError && error.code === "INVALID_INPUT");
  const broken = { article: { async findFirst() { throw new Error("connection reset by postgres://secret"); } } };
  await assert.rejects(() => readLearnSource({ slug: "x" }, broken), (error: unknown) => error instanceof LearnSourceError && error.code === "SOURCE_UNAVAILABLE" && error.retryable && !/secret/.test(error.message));
});

test("MCP learn_source returns schema-valid text and never calls learn_apply", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  let applyCalls = 0;
  const fake = sourceDatabase(sourceRow());
  const server = createLearnMcpServer(
    { apply: async () => { applyCalls += 1; throw new Error("never"); } },
    reader(seeded).read,
    (input) => readLearnSource(input, fake.database),
  );
  const client = new Client({ name: "learn-source-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const ok = await client.callTool({ name: "learn_source", arguments: { slug: "wagering-requirements" } });
    assert.equal(ok.isError, undefined);
    assert.equal(learnSourceResultSchema.parse(ok.structuredContent).slug, "wagering-requirements");
    const missing = await client.callTool({ name: "learn_source", arguments: { slug: "Bad Slug" } });
    assert.equal(missing.isError, true);
    assert.equal((missing.structuredContent as { error: { code: string } }).error.code, "INVALID_INPUT");
    assert.equal(applyCalls, 0);
  } finally {
    await client.close();
    await server.close();
  }
});

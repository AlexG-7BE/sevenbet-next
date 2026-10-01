import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { LEARN_CONTENT_STATE_KEY } from "@/lib/learn-content-orchestrator/config";
import { learnContextResultSchema } from "@/lib/learn-content-orchestrator/learn-context.server";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";

const actorId = "00000000-0000-4000-8000-000000000953";
const token = "learn-context-postgres-token-with-more-than-32-bytes";
const bodyMarker = "LEARN-CONTEXT-POSTGRES-BODY-PROSE";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !/(?:_ci|test|disposable)$/i.test(url.pathname.slice(1))) {
    throw new Error("Learn context PostgreSQL test requires a disposable loopback database");
  }
}

const seeds = [
  { slug: "learn-context-pg-en-published", locale: "en-GB", status: EditorialStatus.PUBLISHED },
  { slug: "learn-context-pg-en-draft", locale: "en-GB", status: EditorialStatus.DRAFT },
  { slug: "learn-context-pg-en-archived", locale: "en-GB", status: EditorialStatus.ARCHIVED },
  { slug: "learn-context-pg-sv-published", locale: "sv-SE", status: EditorialStatus.PUBLISHED },
  { slug: "learn-context-pg-da-published", locale: "da-DK", status: EditorialStatus.PUBLISHED },
  { slug: "learn-context-pg-de-scheduled", locale: "de-DE", status: EditorialStatus.SCHEDULED },
] as const;

async function seed() {
  await prisma.article.deleteMany({ where: { createdBy: actorId } });
  for (const [index, candidate] of seeds.entries()) {
    await prisma.article.create({
      data: {
        slug: candidate.slug,
        locale: candidate.locale,
        title: `Learn context guide ${index}`,
        excerpt: `${bodyMarker} excerpt`,
        category: index % 2 ? "responsible-gambling" : "casino-bonuses",
        tags: ["Learning"],
        status: candidate.status,
        bodyBlocks: [{ id: "intro", type: "paragraph", text: `${bodyMarker} body` }],
        publishedAt: candidate.status === EditorialStatus.PUBLISHED ? new Date("2026-09-20T10:00:00.000Z") : null,
        archivedAt: candidate.status === EditorialStatus.ARCHIVED ? new Date("2026-09-21T10:00:00.000Z") : null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }
}

async function databaseDigest() {
  const [articles, settings, revisions, audits] = await Promise.all([
    prisma.article.findMany({ orderBy: { id: "asc" } }),
    prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.contentRevision.count(),
    prisma.auditLog.count(),
  ]);
  return createHash("sha256").update(JSON.stringify({ articles, settings, revisions, audits })).digest("hex");
}

async function learnContext(targetLanguage: string) {
  const response = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "learn_context", arguments: { targetLanguage } } }),
  }));
  assert.equal(response.status, 200);
  const payload = await response.json() as { result?: { isError?: boolean; structuredContent?: unknown; content?: unknown } };
  assert.equal(payload.result?.isError, undefined);
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(bodyMarker));
  return learnContextResultSchema.parse(payload.result?.structuredContent);
}

test("learn_context reads published PostgreSQL inventory per launch language and writes nothing", async (context) => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const keys = ["LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID", "LEARN_CONTENT_LOCALES"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    LEARN_MCP_ENABLED: "true",
    LEARN_MCP_SERVICE_TOKEN: token,
    LEARN_MCP_ACTOR_ID: actorId,
    LEARN_CONTENT_LOCALES: "en,sv,da,de",
  });
  const historicalState = {
    version: 1,
    nextEligibleAt: "2026-09-30T19:13:22.724Z",
    localeCursor: 1,
    consecutiveFailures: 0,
    haltedCode: null,
    active: null,
    last: { runId: "eda24cf7-5eed-46d8-a0d8-7e28618f377f", completedAt: "2026-09-29T12:13:22.539Z", result: "PUBLISHED", code: "CREATED" },
  };
  context.after(async () => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await prisma.article.deleteMany({ where: { createdBy: actorId } });
    await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
    await prisma.$disconnect();
  });

  await seed();
  await prisma.siteSetting.upsert({
    where: { key: LEARN_CONTENT_STATE_KEY },
    create: { key: LEARN_CONTENT_STATE_KEY, value: historicalState },
    update: { value: historicalState },
  });
  const before = await databaseDigest();

  const published = await prisma.article.findMany({ where: { status: EditorialStatus.PUBLISHED }, select: { id: true, locale: true } });
  const expected = (locales: string[]) => new Set(published.filter((article) => locales.includes(article.locale)).map((article) => article.id));
  const seededSlugs = (result: Awaited<ReturnType<typeof learnContext>>) => result.articles.map((article) => article.slug).filter((slug) => slug.startsWith("learn-context-pg-")).sort();

  const english = await learnContext("en");
  assert.deepEqual(english.target, { language: "en", locale: "en-GB", publicPathPrefix: "/en" });
  assert.deepEqual(new Set(english.articles.map((article) => article.id)), expected(["en-GB"]));
  assert.deepEqual(seededSlugs(english), ["learn-context-pg-en-published"]);

  const swedish = await learnContext("sv");
  assert.deepEqual(new Set(swedish.articles.map((article) => article.id)), expected(["sv-SE", "en-GB"]));
  assert.deepEqual(seededSlugs(swedish), ["learn-context-pg-en-published", "learn-context-pg-sv-published"]);

  const danish = await learnContext("da");
  assert.deepEqual(new Set(danish.articles.map((article) => article.id)), expected(["da-DK", "en-GB"]));
  assert.deepEqual(seededSlugs(danish), ["learn-context-pg-da-published", "learn-context-pg-en-published"]);

  const german = await learnContext("de");
  assert.deepEqual(german.target.locale, "de-DE");
  assert.deepEqual(seededSlugs(german), ["learn-context-pg-en-published"]);

  for (const result of [english, swedish, danish, german]) {
    assert.deepEqual(result.launchLocales.map((locale) => locale.language), ["en", "sv", "da", "de"]);
    assert.equal(result.sourceLocale, "en-GB");
    assert.ok(result.articles.length <= 500);
    assert.deepEqual(result.protectedRoutes, ["/help", "/responsible-gambling"]);
  }

  const callSource = async (slug: string) => {
    const response = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
      method: "POST",
      headers: { accept: "application/json, text/event-stream", authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "learn_source", arguments: { slug } } }),
    }));
    assert.equal(response.status, 200);
    return await response.json() as { result?: { isError?: boolean; structuredContent?: { slug?: string; bodyBlocks?: unknown[]; error?: { code?: string } } } };
  };
  const source = await callSource("learn-context-pg-en-published");
  assert.equal(source.result?.isError, undefined);
  assert.equal(source.result?.structuredContent?.slug, "learn-context-pg-en-published");
  assert.match(JSON.stringify(source.result?.structuredContent?.bodyBlocks), new RegExp(bodyMarker));
  assert.doesNotMatch(JSON.stringify(source), new RegExp(actorId));
  const draft = await callSource("learn-context-pg-en-draft");
  assert.equal(draft.result?.isError, true);
  assert.equal(draft.result?.structuredContent?.error?.code, "ARTICLE_NOT_FOUND");

  assert.equal(await databaseDigest(), before, "learn_context and learn_source must not change any Article, SiteSetting, revision or audit row");
});

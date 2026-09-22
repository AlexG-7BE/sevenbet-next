import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deflateSync } from "node:zlib";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import type { AdminArticle, ArticleDocumentInput } from "../lib/articles/article-types";
import { publicationIssues, validateArticleDocument } from "../lib/articles/article-validation";
import { learnApplyInputSchema, type LearnApplyInput } from "../lib/learn-apply/contract";
import { LearnApplyError } from "../lib/learn-apply/errors";
import { learnApplyIntentFingerprint } from "../lib/learn-apply/fingerprint";
import { LearnImageService } from "../lib/learn-apply/image-service";
import { LearnPublicVerifier, publicLearnArticlePath } from "../lib/learn-apply/public-verification";
import { LearnApplyService } from "../lib/learn-apply/service";
import { resolveLearnServiceActor } from "../lib/learn-apply/service-actor";
import { authenticateLearnMcpRequest, resolveLearnMcpConfig } from "../lib/mcp/learn/config";
import { handleLearnMcpPost } from "../lib/mcp/learn/post-handler";
import { createLearnMcpServer, learnApplyTool } from "../lib/mcp/learn/server";
import type { StorageObjectMetadata, StorageProvider, StorageUploadInput } from "../lib/media/storage/storage-provider";
import { absoluteUrl } from "../lib/site";

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 4, "ascii");
  Buffer.from(data).copy(output, 8);
  output.writeUInt32BE(crc32(output.subarray(4, 8 + data.length)), 8 + data.length);
  return output;
}

function png(width = 64, height = 64) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function input(overrides: Partial<LearnApplyInput["article"]> = {}): LearnApplyInput {
  return {
    requestId: "request-2026-09-21-0001",
    article: {
      articleId: null,
      expectedUpdatedAt: null,
      locale: "en-GB",
      category: "casino-basics",
      slug: "autonomous-learn-guide",
      title: "Autonomous Learn Guide",
      excerpt: "A complete educational summary that is suitable for public readers.",
      tags: ["Safety", "Learning"],
      bodyBlocks: [{ id: "intro", type: "paragraph", text: "A complete and readable introduction." }],
      heroImage: null,
      seo: { title: "Autonomous Learn Guide", description: "A precise autonomous Learn publication test description.", canonicalUrl: null },
      readingTime: "4 min read",
      difficulty: "Beginner",
      ...overrides,
    },
  };
}

function article(document: ArticleDocumentInput, overrides: Partial<AdminArticle> = {}): AdminArticle {
  return {
    ...document,
    id: "11111111-1111-4111-8111-111111111111",
    status: "PUBLISHED",
    publishedAt: "2026-09-21T10:00:00.000Z",
    lastReviewedAt: "2026-09-21T10:00:00.000Z",
    archivedAt: null,
    createdAt: "2026-09-21T10:00:00.000Z",
    updatedAt: "2026-09-21T10:00:00.000Z",
    createdBy: "22222222-2222-4222-8222-222222222222",
    updatedBy: "22222222-2222-4222-8222-222222222222",
    ...overrides,
  };
}

function canonicalInputDocument(value = input()) {
  const parsed = validateArticleDocument({
    ...value.article,
    bodyBlocks: value.article.bodyBlocks,
    heroImageUrl: null,
    heroImageAlt: null,
    seoTitle: value.article.seo.title,
    seoDescription: value.article.seo.description,
    canonicalUrl: value.article.seo.canonicalUrl,
  });
  assert.deepEqual(parsed.issues, []);
  return parsed.document;
}

test("learn_apply schema covers the complete canonical block set and bounded image sources", () => {
  const parsed = learnApplyInputSchema.safeParse(input({
    bodyBlocks: [
      { id: "p", type: "paragraph", text: "Paragraph" },
      { id: "h", type: "heading", level: 2, text: "Heading" },
      { id: "l", type: "list", style: "numbered", items: ["One"] },
      { id: "q", type: "quote", text: "Quote", citation: null },
      { id: "c", type: "callout", title: "Note", text: "Callout" },
      { id: "i", type: "image", source: { type: "url", url: "https://images.example.com/guide.png" }, alt: "Guide", caption: null },
      { id: "r", type: "link", label: "Methodology", url: "/methodology", description: null },
    ],
    heroImage: {
      source: { type: "generate", prompt: "Editorial illustration of a calm learning desk", aspectRatio: "16:9", quality: "medium", background: "opaque" },
      alt: "A calm learning desk",
    },
  }));
  assert.equal(parsed.success, true);
  assert.equal(learnApplyTool.name, "learn_apply");
  assert.deepEqual(learnApplyTool.annotations, {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  });
  assert.match(learnApplyTool.description, /create and publish one new/i);
  assert.match(learnApplyTool.description, /updates are not supported/i);
  assert.doesNotMatch(learnApplyTool.description, /return CREATED, UPDATED|replace the complete desired state/i);
});

test("learn_apply contract is create-only and exposes publication-ready fields", () => {
  const valid = input();
  assert.equal(learnApplyInputSchema.safeParse({ ...valid, article: { ...valid.article, articleId: "11111111-1111-4111-8111-111111111111" } }).success, false);
  assert.equal(learnApplyInputSchema.safeParse({ ...valid, article: { ...valid.article, expectedUpdatedAt: "2026-09-21T10:00:00Z" } }).success, false);
  assert.equal(learnApplyInputSchema.safeParse(input({ title: "Bad" })).success, false);
  assert.equal(learnApplyInputSchema.safeParse(input({ excerpt: "Too short" })).success, false);
  assert.equal(learnApplyInputSchema.safeParse(input({ readingTime: "sometime later" as never })).success, false);
  assert.equal(learnApplyInputSchema.safeParse(input({ bodyBlocks: [{ id: "heading", type: "heading", level: 2, text: "Only a heading" }] })).success, false);
});

test("contract and publication validation fail closed for malformed base64, locale, category, and canonical URL", () => {
  assert.equal(learnApplyInputSchema.safeParse(input({
    heroImage: { source: { type: "base64", data: "not-base64", mimeType: "image/png", filename: "guide.png" }, alt: "Guide" },
  })).success, false);
  const invalidLocale = validateArticleDocument({ ...canonicalInputDocument(), locale: "fr-CA" });
  assert.ok(invalidLocale.issues.some((issue) => issue.path === "locale"));
  const invalidCanonical = validateArticleDocument({ ...canonicalInputDocument(), canonicalUrl: "https://example.com/not-b4gamble" });
  assert.ok(invalidCanonical.issues.some((issue) => issue.path === "canonicalUrl"));
  assert.ok(publicationIssues({ ...canonicalInputDocument(), category: "invented-category" }).some((issue) => issue.path === "category"));
});

test("orchestration creates LIVE without images and invalidates the canonical surfaces", async () => {
  const desired = canonicalInputDocument();
  const calls: string[] = [];
  const service = new LearnApplyService({
    articles: {
      inspectPublishedApply: async () => ({ article: null, requestAudit: null, reusableAudit: null }),
      applyPublishedDocument: async (value) => {
        calls.push("persist");
        return { operation: "CREATED", article: article(value.document), previousPath: null };
      },
      isImageUrlReferenced: async () => false,
    },
    images: {
      prepare: async (images) => { calls.push(`images:${images.length}`); return { images: [], createdObjects: [], recoveryObjects: [] }; },
      cleanupCreated: async () => { calls.push("cleanup"); },
    },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    revalidate: (category, slug) => { calls.push(`revalidate:${category}/${slug}`); },
    verifier: { verify: async () => ({ verified: true, checks: ["article_http_and_identity"], attempts: 1, failureCode: null, publicUrl: "https://b4gamble.com/en/learn/casino-basics/autonomous-learn-guide" }) },
    logger: () => undefined,
  });
  const result = await service.apply(input());
  assert.equal(result.result, "LIVE");
  assert.equal(result.operation, "CREATED");
  assert.deepEqual(calls, ["images:0", "persist", "revalidate:casino-basics/autonomous-learn-guide"]);
  assert.equal(result.articleId, article(desired).id);
});

test("NO_CHANGE writes nothing but revalidates and verifies for post-commit recovery", async () => {
  const replayInput = input();
  const desired = canonicalInputDocument(replayInput);
  const current = article(desired);
  const intentFingerprint = learnApplyIntentFingerprint(replayInput);
  const invalidated: string[] = [];
  let applied = 0;
  const service = new LearnApplyService({
    articles: {
      inspectPublishedApply: async () => ({
          article: current,
          requestAudit: { entityId: current.id, metadata: { intentFingerprint }, timestamp: current.updatedAt },
          reusableAudit: null,
      }),
      applyPublishedDocument: async () => {
        applied += 1;
        return { operation: "NO_CHANGE", article: current, previousPath: null };
      },
      isImageUrlReferenced: async () => false,
    },
    images: { prepare: async () => ({ images: [], createdObjects: [], recoveryObjects: [] }), cleanupCreated: async () => undefined },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    revalidate: (category, slug) => { invalidated.push(`${category}/${slug}`); },
    verifier: { verify: async () => ({ verified: true, checks: ["article_http_and_identity"], attempts: 1, failureCode: null, publicUrl: "https://b4gamble.com/en/learn/casino-basics/autonomous-learn-guide" }) },
    logger: () => undefined,
  });
  const result = await service.apply(replayInput);
  assert.equal(applied, 1);
  assert.equal(result.operation, "NO_CHANGE");
  assert.equal(result.updatedAt, current.updatedAt);
  assert.deepEqual(invalidated, ["casino-basics/autonomous-learn-guide"]);
});

test("preparation failures perform zero Article mutation and DB failures compensate only newly-created image objects", async () => {
  let persisted = 0;
  const generated = input({
    heroImage: { source: { type: "generate", prompt: "A calm editorial illustration for Learn", aspectRatio: "16:9", quality: "medium", background: "opaque" }, alt: "Calm illustration" },
  });
  const baseArticles = {
    inspectPublishedApply: async () => ({ article: null, requestAudit: null, reusableAudit: null }),
    applyPublishedDocument: async () => { persisted += 1; throw new Error("database unavailable"); },
    isImageUrlReferenced: async () => false,
  };
  const generationFailure = new LearnApplyService({
    articles: baseArticles,
    images: {
      prepare: async () => { throw new LearnApplyError("generation failed", "IMAGE_GENERATION_UNAVAILABLE", 502); },
      cleanupCreated: async () => undefined,
    },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    verifier: { verify: async () => { throw new Error("unreachable"); } },
    logger: () => undefined,
  });
  await assert.rejects(() => generationFailure.apply(generated), (error: unknown) => error instanceof LearnApplyError && error.code === "IMAGE_GENERATION_UNAVAILABLE");
  assert.equal(persisted, 0);

  const cleaned: string[] = [];
  const databaseFailure = new LearnApplyService({
    articles: baseArticles,
    images: {
      prepare: async () => ({
        images: [{ slot: "hero", sourceFingerprint: "f".repeat(64), sourceType: "generate", key: `content/learn/${"a".repeat(64)}.webp`, url: "https://media.example.com/image.webp", checksum: "a".repeat(64), mimeType: "image/webp", width: 1536, height: 1024, sizeBytes: 100 }],
        createdObjects: [{ key: `content/learn/${"a".repeat(64)}.webp`, url: "https://media.example.com/image.webp" }],
        recoveryObjects: [],
      }),
      cleanupCreated: async (objects) => { cleaned.push(...objects.map((item) => item.key)); },
    },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    verifier: { verify: async () => { throw new Error("unreachable"); } },
    logger: () => undefined,
  });
  await assert.rejects(() => databaseFailure.apply(generated), /failed before publication/i);
  assert.equal(persisted, 1);
  assert.deepEqual(cleaned, [`content/learn/${"a".repeat(64)}.webp`]);
});

test("post-commit verification failure is truthful and never rolls back the published Article", async () => {
  const generated = input({
    heroImage: { source: { type: "generate", prompt: "A calm editorial illustration for Learn", aspectRatio: "16:9", quality: "medium", background: "opaque" }, alt: "Calm illustration" },
  });
  const key = `content/learn/${"d".repeat(64)}.webp`;
  let ensured = 0;
  const service = new LearnApplyService({
    articles: {
      inspectPublishedApply: async () => ({ article: null, requestAudit: null, reusableAudit: null }),
      applyPublishedDocument: async (value) => ({ operation: "CREATED", article: article(value.document), previousPath: null }),
      isImageUrlReferenced: async () => false,
    },
    images: {
      prepare: async () => ({
        images: [{ slot: "hero", sourceFingerprint: "f".repeat(64), sourceType: "generate", key, url: `https://media.example.com/${key}`, checksum: "d".repeat(64), mimeType: "image/webp", width: 1536, height: 1024, sizeBytes: 4 }],
        createdObjects: [{ key, url: `https://media.example.com/${key}` }],
        recoveryObjects: [{ key, url: `https://media.example.com/${key}`, data: Buffer.from("webp"), contentType: "image/webp", sizeBytes: 4 }],
      }),
      ensureStored: async (objects) => { ensured += objects.length; },
      cleanupCreated: async () => assert.fail("committed Article must not compensate"),
    },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    revalidate: () => undefined,
    verifier: { verify: async () => ({ verified: false, checks: ["seo_metadata"], attempts: 3, failureCode: "SITEMAP_MISSING_ARTICLE", publicUrl: "https://b4gamble.com/en/learn/casino-basics/autonomous-learn-guide" }) },
    logger: () => undefined,
  });
  const result = await service.apply(generated);
  assert.equal(result.result, "PERSISTED_NOT_VERIFIED");
  assert.equal(result.persistence, "COMMITTED");
  assert.equal(result.status, "PUBLISHED");
  assert.equal(result.verified, false);
  assert.equal(ensured, 1);
});

test("an existing slug from another request is rejected before images or persistence", async () => {
  const current = article(canonicalInputDocument());
  let prepared = 0;
  let persisted = 0;
  const service = new LearnApplyService({
    articles: {
      inspectPublishedApply: async () => ({ article: current, requestAudit: null, reusableAudit: null }),
      applyPublishedDocument: async () => {
        persisted += 1;
        return { operation: "NO_CHANGE", article: current, previousPath: null };
      },
      isImageUrlReferenced: async () => false,
    },
    images: {
      prepare: async () => {
        prepared += 1;
        return { images: [], createdObjects: [], recoveryObjects: [] };
      },
      cleanupCreated: async () => undefined,
    },
    actorResolver: async () => ({ id: "22222222-2222-4222-8222-222222222222", name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }),
    verifier: { verify: async () => assert.fail("verification must not run") },
    logger: () => undefined,
  });
  await assert.rejects(() => service.apply(input()), (error: unknown) => error instanceof LearnApplyError && error.code === "CREATE_SLUG_EXISTS");
  assert.equal(prepared, 0);
  assert.equal(persisted, 0);
});

class MemoryStorage implements StorageProvider {
  readonly name = "S3" as const;
  readonly objects = new Map<string, { data: Uint8Array; contentType: string }>();
  uploads = 0;
  deletes = 0;
  async validate() {}
  async upload(value: StorageUploadInput) {
    this.uploads += 1;
    const created = !this.objects.has(value.key);
    if (created) this.objects.set(value.key, { data: value.data, contentType: value.contentType });
    return { key: value.key, publicUrl: this.getPublicUrl(value.key), created };
  }
  async delete(key: string) { this.deletes += 1; this.objects.delete(key); }
  getPublicUrl(key: string) { return `https://media.example.com/${key}`; }
  async exists(key: string) { return this.objects.has(key); }
  async metadata(key: string): Promise<StorageObjectMetadata | null> {
    const object = this.objects.get(key);
    return object ? { sizeBytes: object.data.byteLength, contentType: object.contentType, etag: null, lastModified: null } : null;
  }
}

test("generated hero and inline images share one content-addressed object and a retry reuses it", async () => {
  const storage = new MemoryStorage();
  const fixture = readFileSync("public/home/responsive/hero-plan-1280.webp");
  let generations = 0;
  const source = { type: "generate" as const, prompt: "A calm editorial illustration for Learn", aspectRatio: "16:9" as const, quality: "medium" as const, background: "opaque" as const };
  const service = new LearnImageService({
    storage,
    generatorFactory: () => ({
      generate: async () => { generations += 1; return { data: fixture, filename: "generated.webp", mimeType: "image/webp", model: "gpt-image-2" }; },
    }),
    logger: () => undefined,
  });
  const first = await service.prepare([
    { slot: "hero", source, kind: "hero" },
    { slot: "body:diagram", source, kind: "inline" },
  ]);
  assert.equal(generations, 1);
  assert.equal(storage.uploads, 1);
  assert.equal(first.createdObjects.length, 1);
  assert.equal(first.images[0].url, first.images[1].url);
  assert.match(first.images[0].key, /^content\/learn\/[a-f0-9]{64}\.webp$/);

  const second = await service.prepare([
    { slot: "hero", source, kind: "hero" },
    { slot: "body:diagram", source, kind: "inline" },
  ], first.images);
  assert.equal(generations, 1);
  assert.equal(storage.uploads, 1);
  assert.deepEqual(second.createdObjects, []);

  storage.objects.delete(first.images[0].key);
  await service.ensureStored(first.recoveryObjects);
  assert.equal(storage.uploads, 2);
  assert.equal(await storage.exists(first.images[0].key), true);
});

test("supplied base64 and remote URLs are validated, copied, and deduplicated in first-party storage", async () => {
  const storage = new MemoryStorage();
  const fixture = png();
  const remote = {
    data: fixture,
    finalUrl: new URL("https://images.example.com/logo.png"),
    redirects: [],
    mimeType: "image/png" as const,
    width: 512,
    height: 512,
    animated: false,
    sizeBytes: fixture.byteLength,
    checksum: "unused",
    extension: "png",
  };
  const service = new LearnImageService({
    storage,
    remoteFetcher: async () => remote,
    logger: () => undefined,
  });
  const prepared = await service.prepare([
    { slot: "body:supplied", kind: "inline", source: { type: "base64", data: fixture.toString("base64"), mimeType: "image/png", filename: "supplied.png" } },
    { slot: "body:remote", kind: "inline", source: { type: "url", url: "https://images.example.com/logo.png" } },
  ]);
  assert.equal(prepared.images.length, 2);
  assert.equal(prepared.images[0].url, prepared.images[1].url);
  assert.equal(prepared.createdObjects.length, 1);
  assert.equal(storage.objects.size, 1);
  assert.ok(prepared.images.every((image) => image.url.startsWith("https://media.example.com/content/learn/")));
});

test("invalid supplied image bytes and storage failures cannot reach Article persistence", async () => {
  const storage = new MemoryStorage();
  const service = new LearnImageService({ storage, logger: () => undefined });
  await assert.rejects(() => service.prepare([{
    slot: "body:invalid",
    kind: "inline",
    source: { type: "base64", data: Buffer.from("not an image").toString("base64"), mimeType: "image/png", filename: "invalid.png" },
  }]), (error: unknown) => error instanceof LearnApplyError && error.code === "IMAGE_UNSUPPORTED_MIME");
  assert.equal(storage.uploads, 0);

  const failingStorage = new MemoryStorage();
  failingStorage.upload = async () => { throw new Error("storage unavailable"); };
  const fixture = png();
  const failing = new LearnImageService({ storage: failingStorage, logger: () => undefined });
  await assert.rejects(() => failing.prepare([{
    slot: "body:valid",
    kind: "inline",
    source: { type: "base64", data: fixture.toString("base64"), mimeType: "image/png", filename: "valid.png" },
  }]), (error: unknown) => error instanceof LearnApplyError && error.code === "IMAGE_PREPARATION_FAILED");
  assert.equal(failingStorage.objects.size, 0);
});

test("compensation preserves pre-existing deduplicated objects and referenced newly-created objects", async () => {
  const storage = new MemoryStorage();
  const key = `content/learn/${"b".repeat(64)}.webp`;
  storage.objects.set(key, { data: Buffer.from("existing"), contentType: "image/webp" });
  const service = new LearnImageService({ storage, isReferenced: async (url) => url.endsWith("referenced.webp"), logger: () => undefined });
  await service.cleanupCreated([]);
  assert.equal(storage.deletes, 0);
  await service.cleanupCreated([{ key: "content/learn/referenced.webp", url: "https://media.example.com/referenced.webp" }]);
  assert.equal(storage.deletes, 0);

  let coordinated = 0;
  const guarded = new LearnImageService({
    storage,
    cleanupIfUnreferenced: async (_object, cleanup) => {
      coordinated += 1;
      if (coordinated === 1) return false;
      await cleanup();
      return true;
    },
    logger: () => undefined,
  });
  const guardedKey = `content/learn/${"c".repeat(64)}.webp`;
  storage.objects.set(guardedKey, { data: Buffer.from("guarded"), contentType: "image/webp" });
  const guardedObject = { key: guardedKey, url: storage.getPublicUrl(guardedKey) };
  await guarded.cleanupCreated([guardedObject]);
  assert.equal(await storage.exists(guardedKey), true);
  await guarded.cleanupCreated([guardedObject]);
  assert.equal(await storage.exists(guardedKey), false);
});

test("public verification checks Article identity, SEO, schemas, Learn collection, sitemap, and images", async () => {
  const document: ArticleDocumentInput = {
    ...canonicalInputDocument(),
    heroImageUrl: "https://media.example.com/content/learn/hero.webp",
    heroImageAlt: "Learn hero",
  };
  const record = article(document);
  const path = publicLearnArticlePath(record.locale, record.category, record.slug);
  const page = `<!doctype html><html><head>
    <title>${document.seoTitle}</title>
    <meta name="description" content="${document.seoDescription}">
    <link rel="canonical" href="${absoluteUrl(path)}">
    <meta property="og:image" content="${document.heroImageUrl}">
    <script type="application/ld+json">${JSON.stringify({ "@type": "Article", headline: document.title, mainEntityOfPage: absoluteUrl(path) })}</script>
    <script type="application/ld+json">${JSON.stringify({ "@type": "BreadcrumbList", itemListElement: [{}, {}, {}, { name: document.title }] })}</script>
    </head><body><article data-article-id="${record.id}" data-article-updated-at="${record.updatedAt}"><h1>${document.title}</h1></article></body></html>`;
  const verifier = new LearnPublicVerifier({
    origin: "https://public.example.com",
    attempts: 1,
    fetchImpl: async (url) => {
      const target = String(url);
      if (target === `https://public.example.com${path}`) return new Response(page, { status: 200, headers: { "content-type": "text/html" } });
      if (target === "https://public.example.com/en/learn") return new Response(`<a href="${path}">Article</a>`, { status: 200 });
      if (target === "https://public.example.com/sitemap.xml") return new Response(`<url><loc>${absoluteUrl(path)}</loc></url>`, { status: 200 });
      if (target === document.heroImageUrl) return new Response(Buffer.from("image"), { status: 200, headers: { "content-type": "image/webp" } });
      return new Response("missing", { status: 404 });
    },
    wait: async () => undefined,
  });
  const result = await verifier.verify(record, document);
  assert.equal(result.verified, true);
  assert.deepEqual(result.checks, [
    "article_http_and_identity",
    "seo_metadata",
    "indexable_robots",
    "article_and_breadcrumb_json_ld",
    "open_graph",
    "learn_collection",
    "sitemap",
    "public_images",
  ]);
});

test("service bearer auth is fail-closed and independent of browser sessions", () => {
  assert.equal(resolveLearnMcpConfig({ LEARN_MCP_ENABLED: "false" }), null);
  assert.throws(() => resolveLearnMcpConfig({ LEARN_MCP_ENABLED: "true", LEARN_MCP_SERVICE_TOKEN: "short", LEARN_MCP_ACTOR_ID: "actor" }), /32 bytes/);
  const token = "a-secure-service-token-with-more-than-32-bytes";
  const config = resolveLearnMcpConfig({ LEARN_MCP_ENABLED: "true", LEARN_MCP_SERVICE_TOKEN: token, LEARN_MCP_ACTOR_ID: "actor" })!;
  assert.equal(authenticateLearnMcpRequest(new Request("https://b4gamble.com/api/mcp/learn", { headers: { authorization: `Bearer ${token}` } }), config), true);
  assert.equal(authenticateLearnMcpRequest(new Request("https://b4gamble.com/api/mcp/learn", { headers: { cookie: "better-auth.session=founder", authorization: "Bearer wrong" } }), config), false);
});

test("stateless HTTP transport authenticates before parsing and exposes exactly one tool", async (context) => {
  const keys = ["LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const token = "http-transport-service-token-with-more-than-32-bytes";
  Object.assign(process.env, {
    LEARN_MCP_ENABLED: "true",
    LEARN_MCP_SERVICE_TOKEN: token,
    LEARN_MCP_ACTOR_ID: "22222222-2222-4222-8222-222222222222",
  });

  const unauthorized = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    body: "not-json-and-never-parsed",
  }));
  assert.equal(unauthorized.status, 401);

  const oversized = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-length": "4000001" },
    body: "{}",
  }));
  assert.equal(oversized.status, 413);

  const listed = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  }));
  assert.equal(listed.status, 200);
  assert.match(listed.headers.get("cache-control") ?? "", /no-store/);
  const payload = await listed.json() as { result?: { tools?: Array<{ name?: string }> } };
  assert.deepEqual(payload.result?.tools?.map((tool) => tool.name), ["learn_apply"]);
});

test("service actor must be the exact unlinked AUTHOR and is never inferred from a session", async () => {
  const actorId = "22222222-2222-4222-8222-222222222222";
  const actor = await resolveLearnServiceActor(
    { LEARN_MCP_ACTOR_ID: actorId },
    { findById: async () => ({ id: actorId, name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null }) },
  );
  assert.equal(actor.id, actorId);
  await assert.rejects(() => resolveLearnServiceActor(
    { LEARN_MCP_ACTOR_ID: actorId },
    { findById: async () => ({ id: actorId, name: "Founder", role: "SUPER_ADMIN", userId: "browser-user" }) },
  ), (error: unknown) => error instanceof LearnApplyError && error.code === "SERVICE_ACTOR_INVALID");
});

test("official MCP client discovers and calls exactly one Learn mutation tool", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const expected = {
    result: "LIVE" as const,
    operation: "NO_CHANGE" as const,
    persistence: "COMMITTED" as const,
    articleId: "11111111-1111-4111-8111-111111111111",
    status: "PUBLISHED" as const,
    url: "https://b4gamble.com/en/learn/casino-basics/autonomous-learn-guide",
    publishedAt: "2026-09-21T10:00:00.000Z",
    updatedAt: "2026-09-21T10:00:00.000Z",
    verified: true,
    images: [],
    verification: { checks: ["article_http_and_identity"], attempts: 1, failureCode: null },
  };
  const server = createLearnMcpServer({ apply: async () => expected });
  const client = new Client({ name: "learn-apply-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const discovered = await client.listTools();
    assert.deepEqual(discovered.tools.map((tool) => tool.name), ["learn_apply"]);
    const result = await client.callTool({ name: "learn_apply", arguments: input() });
    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, expected);
  } finally {
    await client.close();
    await server.close();
  }
});

test("MCP failures are schema-declared, structured, and disclose no stack", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLearnMcpServer({
    apply: async () => {
      throw new LearnApplyError("Article changed during autonomous publication.", "CONFLICT", 409, {
        articleId: "11111111-1111-4111-8111-111111111111",
      });
    },
  });
  const client = new Client({ name: "learn-apply-error-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name: "learn_apply", arguments: input() });
    assert.equal(result.isError, true);
    assert.deepEqual(result.structuredContent, {
      result: "ERROR",
      error: {
        code: "CONFLICT",
        message: "Article changed during autonomous publication.",
        persistence: "NOT_COMMITTED",
        retryable: false,
        details: { articleId: "11111111-1111-4111-8111-111111111111" },
      },
    });
    assert.doesNotMatch(JSON.stringify(result), /stack|learn-apply\.test\.ts/);
    assert.equal((learnApplyTool.outputSchema as { type?: string }).type, "object");
    assert.equal((learnApplyTool.outputSchema as { oneOf?: unknown[] }).oneOf?.length, 2);
  } finally {
    await client.close();
    await server.close();
  }
});

test("MCP marks a transient serializable conflict for safe same-request retry", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLearnMcpServer({
    apply: async () => {
      throw new LearnApplyError(
        "A concurrent Learn create changed the same target. Retry the same requestId.",
        "SERIALIZABLE_CONFLICT",
        503,
      );
    },
  });
  const client = new Client({ name: "learn-apply-retryable-error-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name: "learn_apply", arguments: input() });
    assert.deepEqual(result.structuredContent, {
      result: "ERROR",
      error: {
        code: "SERIALIZABLE_CONFLICT",
        message: "A concurrent Learn create changed the same target. Retry the same requestId.",
        persistence: "NOT_COMMITTED",
        retryable: true,
      },
    });
  } finally {
    await client.close();
    await server.close();
  }
});

test("structural guard preserves one Article authority and responsive protected rendering", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const forbidden of ["ArticleImage", "LearnImage", "ContentMedia", "LearnPublication", "ArticlePublication", "McpRequest", "PublicationJob", "ContentJob", "ArticleSource", "LearnEntry", "MCPArticle"]) {
    assert.doesNotMatch(schema, new RegExp(`model\\s+${forbidden}\\b`));
  }
  assert.equal((schema.match(/model Article\s*\{/g) ?? []).length, 1);
  assert.equal((schema.match(/model ContentRevision\s*\{/g) ?? []).length, 1);
  assert.equal((schema.match(/model AuditLog\s*\{/g) ?? []).length, 1);
  const route = readFileSync("app/api/mcp/learn/route.ts", "utf8");
  assert.doesNotMatch(route, /@prisma\/client|prisma\./);
  const server = readFileSync("lib/mcp/learn/server.ts", "utf8");
  assert.equal((server.match(/name: "learn_apply"/g) ?? []).length, 1);
  assert.doesNotMatch(server, /learn_(?:create|update|publish|upload|generate|attach)_/);
  const css = readFileSync("app/(public)/learn/[category]/[slug]/article.module.css", "utf8");
  assert.match(css, /\.articleImage img \{[^}]*width: 100%;[^}]*height: auto;/s);
  assert.match(css, /@media \(max-width: 800px\)/);
  const view = readFileSync("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx", "utf8");
  assert.match(view, /protectedCategory = article\.category === "responsible-gambling"/);
  assert.match(view, /data-article-id=\{article\.id\}/);
  assert.match(view, /data-article-updated-at=\{article\.updatedAt\}/);
});

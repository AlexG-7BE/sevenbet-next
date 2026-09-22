import assert from "node:assert/strict";
import test from "node:test";

import type { ArticleDocumentInput } from "../lib/articles/article-types";
import { articleDocumentFingerprint, sha256 } from "../lib/learn-apply/fingerprint";
import { prisma } from "../lib/db/prisma";
import { articleService } from "../lib/services/article.service";

const actorId = "00000000-0000-4000-8000-000000000944";
const actorEmail = "learn-apply-postgres@invalid.example";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("learn_apply PostgreSQL test requires a loopback _ci database");
  }
}

function document(overrides: Partial<ArticleDocumentInput> = {}): ArticleDocumentInput {
  return {
    slug: "learn-apply-postgres-guide",
    locale: "en-GB",
    title: "Learn Apply PostgreSQL Guide",
    excerpt: "A complete educational summary for autonomous publication acceptance.",
    category: "casino-basics",
    tags: ["Learning", "Safety"],
    bodyBlocks: [{ id: "intro", type: "paragraph", text: "The canonical Article is published atomically." }],
    heroImageUrl: null,
    heroImageAlt: null,
    seoTitle: "Learn Apply PostgreSQL Guide",
    seoDescription: "PostgreSQL acceptance for atomic autonomous Learn publication.",
    canonicalUrl: null,
    readingTime: "4 min read",
    difficulty: "Beginner",
    ...overrides,
  };
}

async function apply({
  desired,
  requestId,
}: {
  desired: ArticleDocumentInput;
  requestId: string;
}) {
  const documentFingerprint = articleDocumentFingerprint(desired);
  const intentFingerprint = sha256(`intent:${documentFingerprint}`);
  return articleService.applyPublishedDocument({
    document: desired,
    actorId,
    requestIdHash: sha256(requestId),
    intentFingerprint,
    documentFingerprint,
    auditMetadata: {
      schemaVersion: 1,
      images: desired.heroImageUrl ? [{ key: `content/learn/${"a".repeat(64)}.webp` }] : [],
    },
  });
}

test("learn_apply ArticleService is create-only, idempotent, audited, and concurrency-safe", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  await prisma.auditLog.deleteMany({ where: { actorId } });
  const staleArticles = await prisma.article.findMany({ where: { createdBy: actorId }, select: { id: true } });
  await prisma.contentRevision.deleteMany({ where: { entityType: "article", entityId: { in: staleArticles.map((item) => item.id) } } });
  await prisma.article.deleteMany({ where: { createdBy: actorId } });
  await prisma.adminUser.deleteMany({ where: { id: actorId } });
  await prisma.adminUser.create({
    data: { id: actorId, email: actorEmail, name: "B4GAMBLE Content Agent", role: "AUTHOR", userId: null },
  });

  try {
    const initial = document();
    const created = await apply({ desired: initial, requestId: "postgres-create-0001" });
    assert.equal(created.operation, "CREATED");
    assert.equal(created.article.status, "PUBLISHED");
    assert.equal(created.article.createdBy, actorId);
    assert.equal(created.article.updatedBy, actorId);
    assert.ok(created.article.publishedAt);
    assert.ok(created.article.lastReviewedAt);
    assert.equal((await articleService.getPublished(initial.category, initial.slug, initial.locale))?.id, created.article.id);

    const createInspection = await articleService.inspectPublishedApply({
      slug: initial.slug,
      requestIdHash: sha256("postgres-create-0001"),
      intentFingerprint: sha256(`intent:${articleDocumentFingerprint(initial)}`),
    });
    assert.equal(createInspection.article?.id, created.article.id);
    assert.equal(createInspection.requestAudit?.entityId, created.article.id);
    const retry = await apply({
      desired: initial,
      requestId: "postgres-create-0001",
    });
    assert.equal(retry.operation, "NO_CHANGE");
    assert.equal(retry.article.updatedAt, created.article.updatedAt);
    assert.equal(await prisma.article.count({ where: { slug: initial.slug } }), 1);
    assert.equal(await prisma.auditLog.count({ where: { actorId, action: "learn_apply", entityId: created.article.id } }), 1);
    assert.equal(await prisma.contentRevision.count({ where: { entityType: "article", entityId: created.article.id } }), 0);

    await assert.rejects(() => apply({
      desired: initial,
      requestId: "postgres-duplicate-same-document-0002",
    }), /identity appeared|already exists/i);
    await assert.rejects(() => apply({
      desired: { ...initial, title: "Forbidden autonomous replacement" },
      requestId: "postgres-update-forbidden-0003",
    }), /identity appeared|already exists/i);
    assert.equal((await articleService.getAdminArticle(created.article.id)).title, initial.title);
    assert.equal(await prisma.auditLog.count({ where: { actorId, action: "learn_apply", entityId: created.article.id } }), 1);
    assert.equal(await prisma.contentRevision.count({ where: { entityType: "article", entityId: created.article.id } }), 0);

    await assert.rejects(() => apply({
      desired: document({ slug: "learn-apply-postgres-reused-request" }),
      requestId: "postgres-create-0001",
    }), /different Learn apply intent/i);

    const imageDocument = document({
      slug: "learn-apply-postgres-image",
      title: "Learn Apply PostgreSQL Image Guide",
      heroImageUrl: `https://old-media.example.com/content/learn/${"a".repeat(64)}.webp`,
      heroImageAlt: "An editorial learning illustration",
    });
    const imageCreated = await apply({ desired: imageDocument, requestId: "postgres-image-create-0004" });
    assert.equal(imageCreated.operation, "CREATED");
    let cleanupCalls = 0;
    const referencedImageKey = `content/learn/${"a".repeat(64)}.webp`;
    assert.equal(await articleService.cleanupUnreferencedImage(
      referencedImageKey,
      `https://new-media.example.com/content/learn/${"a".repeat(64)}.webp`,
      async () => { cleanupCalls += 1; },
    ), false);
    assert.equal(cleanupCalls, 0);
    assert.equal(await articleService.cleanupUnreferencedImage(
      `content/learn/${"b".repeat(64)}.webp`,
      "https://media.example.com/content/learn/unreferenced.webp",
      async () => { cleanupCalls += 1; },
    ), true);
    assert.equal(cleanupCalls, 1);

    const concurrentA = document({ slug: "learn-apply-postgres-concurrent", title: "Concurrent new Article A" });
    const concurrentB = document({ slug: "learn-apply-postgres-concurrent", title: "Concurrent new Article B" });
    const concurrent = await Promise.allSettled([
      apply({ desired: concurrentA, requestId: "postgres-concurrent-a-0005" }),
      apply({ desired: concurrentB, requestId: "postgres-concurrent-b-0006" }),
    ]);
    assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(concurrent.filter((result) => result.status === "rejected").length, 1);
    const final = await articleService.getPublished("casino-basics", "learn-apply-postgres-concurrent", "en-GB");
    assert.ok(final);
    assert.ok([concurrentA.title, concurrentB.title].includes(final.title));

    const audits = await prisma.auditLog.findMany({ where: { actorId, action: "learn_apply" } });
    assert.equal(audits.length, 3);
    assert.ok(audits.every((audit) => audit.actorId === actorId));
    assert.ok(audits.every((audit) => (audit.metadata as { operation?: string } | null)?.operation === "CREATED"));
    const autonomousArticleIds = (await prisma.article.findMany({ where: { createdBy: actorId }, select: { id: true } })).map((item) => item.id);
    assert.equal(await prisma.contentRevision.count({ where: { entityType: "article", entityId: { in: autonomousArticleIds } } }), 0);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId } });
    const articles = await prisma.article.findMany({ where: { createdBy: actorId }, select: { id: true } });
    await prisma.contentRevision.deleteMany({ where: { entityType: "article", entityId: { in: articles.map((item) => item.id) } } });
    await prisma.article.deleteMany({ where: { createdBy: actorId } });
    await prisma.adminUser.deleteMany({ where: { id: actorId } });
    await prisma.$disconnect();
  }
});

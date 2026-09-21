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
  articleId = null,
  observedArticleId = null,
  observedUpdatedAt = null,
  expectedUpdatedAt = null,
}: {
  desired: ArticleDocumentInput;
  requestId: string;
  articleId?: string | null;
  observedArticleId?: string | null;
  observedUpdatedAt?: string | null;
  expectedUpdatedAt?: string | null;
}) {
  const intentFingerprint = sha256(`intent:${requestId}`);
  return articleService.applyPublishedDocument({
    articleId,
    document: desired,
    actorId,
    requestIdHash: sha256(requestId),
    intentFingerprint,
    documentFingerprint: articleDocumentFingerprint(desired),
    expectedUpdatedAt,
    observedArticleId,
    observedUpdatedAt,
    auditMetadata: {
      schemaVersion: 1,
      images: desired.heroImageUrl ? [{ key: `content/learn/${"a".repeat(64)}.webp` }] : [],
    },
  });
}

test("learn_apply ArticleService create, retry, update, move, audit, revision, and concurrency are atomic", async () => {
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
      articleId: null,
      slug: initial.slug,
      requestIdHash: sha256("postgres-create-0001"),
      intentFingerprint: sha256("intent:postgres-create-0001"),
    });
    assert.equal(createInspection.article?.id, created.article.id);
    assert.equal(createInspection.requestAudit?.entityId, created.article.id);
    const retry = await apply({
      desired: initial,
      requestId: "postgres-create-0001",
      observedArticleId: created.article.id,
      observedUpdatedAt: created.article.updatedAt,
    });
    assert.equal(retry.operation, "NO_CHANGE");
    assert.equal(retry.article.updatedAt, created.article.updatedAt);
    assert.equal(await prisma.article.count({ where: { slug: initial.slug } }), 1);
    assert.equal(await prisma.auditLog.count({ where: { actorId, action: "learn_apply", entityId: created.article.id } }), 1);
    assert.equal(await prisma.contentRevision.count({ where: { entityType: "article", entityId: created.article.id } }), 0);

    const replacement = document({
      title: "Learn Apply PostgreSQL Guide Updated",
      bodyBlocks: [
        { id: "intro", type: "paragraph", text: "The previous public version remains available until this replacement commits." },
        { id: "source", type: "link", label: "Methodology", url: "/methodology", description: "Canonical editorial method." },
      ],
      heroImageUrl: `https://old-media.example.com/content/learn/${"a".repeat(64)}.webp`,
      heroImageAlt: "An editorial learning illustration",
    });
    const updated = await apply({
      desired: replacement,
      requestId: "postgres-update-0002",
      articleId: created.article.id,
      observedArticleId: created.article.id,
      observedUpdatedAt: created.article.updatedAt,
      expectedUpdatedAt: created.article.updatedAt,
    });
    assert.equal(updated.operation, "UPDATED");
    assert.equal(updated.article.status, "PUBLISHED");
    assert.equal(updated.article.publishedAt, created.article.publishedAt);
    assert.equal((await articleService.getPublished(replacement.category, replacement.slug, replacement.locale))?.title, replacement.title);
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
    const revisions = await prisma.contentRevision.findMany({
      where: { entityType: "article", entityId: created.article.id },
      orderBy: { revisionNumber: "asc" },
    });
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0].createdBy, actorId);
    assert.equal((revisions[0].snapshot as { article: { title: string } }).article.title, initial.title);
    const updateRetryInspection = await articleService.inspectPublishedApply({
      articleId: created.article.id,
      slug: replacement.slug,
      requestIdHash: sha256("postgres-update-0002"),
      intentFingerprint: sha256("intent:postgres-update-0002"),
      expectedUpdatedAt: created.article.updatedAt,
    });
    assert.equal(updateRetryInspection.requestAudit?.entityId, created.article.id);
    const updateRetry = await apply({
      desired: replacement,
      requestId: "postgres-update-0002",
      articleId: created.article.id,
      observedArticleId: created.article.id,
      observedUpdatedAt: updated.article.updatedAt,
      expectedUpdatedAt: created.article.updatedAt,
    });
    assert.equal(updateRetry.operation, "NO_CHANGE");
    assert.equal(updateRetry.article.updatedAt, updated.article.updatedAt);
    assert.equal(await prisma.contentRevision.count({ where: { entityType: "article", entityId: created.article.id } }), 1);

    const movedDocument = { ...replacement, slug: "learn-apply-postgres-moved", category: "casino-safety" };
    const moved = await apply({
      desired: movedDocument,
      requestId: "postgres-move-0003",
      articleId: created.article.id,
      observedArticleId: created.article.id,
      observedUpdatedAt: updated.article.updatedAt,
      expectedUpdatedAt: updated.article.updatedAt,
    });
    assert.equal(moved.operation, "UPDATED");
    assert.deepEqual(moved.previousPath, { category: initial.category, slug: initial.slug });
    assert.equal(await articleService.getPublished(initial.category, initial.slug, initial.locale), null);
    assert.equal((await articleService.getPublished(movedDocument.category, movedDocument.slug, movedDocument.locale))?.id, created.article.id);

    const duplicate = await apply({
      desired: document({ slug: "learn-apply-postgres-duplicate", title: "A separate duplicate target" }),
      requestId: "postgres-duplicate-create-0004",
    });
    await assert.rejects(() => apply({
      desired: { ...movedDocument, slug: duplicate.article.slug },
      requestId: "postgres-duplicate-conflict-0005",
      articleId: created.article.id,
      observedArticleId: created.article.id,
      observedUpdatedAt: moved.article.updatedAt,
      expectedUpdatedAt: moved.article.updatedAt,
    }), /already exists/i);
    assert.equal((await articleService.getAdminArticle(created.article.id)).slug, movedDocument.slug);

    const concurrentA = { ...movedDocument, title: "Concurrent replacement A" };
    const concurrentB = { ...movedDocument, title: "Concurrent replacement B" };
    const concurrent = await Promise.allSettled([
      apply({ desired: concurrentA, requestId: "postgres-concurrent-a-0006", articleId: created.article.id, observedArticleId: created.article.id, observedUpdatedAt: moved.article.updatedAt, expectedUpdatedAt: moved.article.updatedAt }),
      apply({ desired: concurrentB, requestId: "postgres-concurrent-b-0007", articleId: created.article.id, observedArticleId: created.article.id, observedUpdatedAt: moved.article.updatedAt, expectedUpdatedAt: moved.article.updatedAt }),
    ]);
    assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(concurrent.filter((result) => result.status === "rejected").length, 1);
    const final = await articleService.getAdminArticle(created.article.id);
    assert.equal(final.status, "PUBLISHED");
    assert.ok([concurrentA.title, concurrentB.title].includes(final.title));

    const audits = await prisma.auditLog.findMany({ where: { actorId, action: "learn_apply" } });
    assert.ok(audits.length >= 4);
    assert.ok(audits.every((audit) => audit.actorId === actorId));
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId } });
    const articles = await prisma.article.findMany({ where: { createdBy: actorId }, select: { id: true } });
    await prisma.contentRevision.deleteMany({ where: { entityType: "article", entityId: { in: articles.map((item) => item.id) } } });
    await prisma.article.deleteMany({ where: { createdBy: actorId } });
    await prisma.adminUser.deleteMany({ where: { id: actorId } });
    await prisma.$disconnect();
  }
});

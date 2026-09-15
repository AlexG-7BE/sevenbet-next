import assert from "node:assert/strict";
import test from "node:test";

import type { CmsUser } from "../lib/cms/types";
import { permissionsForRole } from "../lib/cms/permissions";
import { prisma } from "../lib/db/prisma";
import { articleService } from "../lib/services/article.service";

const actorId = "00000000-0000-4000-8000-000000000843";
const userId = "article-learning-postgres-user";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Article PostgreSQL test requires a loopback _ci database");
  }
}

const actor: CmsUser = {
  id: actorId,
  email: "article-learning-postgres@invalid.example",
  name: "Article PostgreSQL fixture",
  role: "SUPER_ADMIN",
  permissions: permissionsForRole("SUPER_ADMIN"),
  authProvider: "email",
  createdAt: "2026-09-15T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
};

test("canonical Article lifecycle is durable, revised and locale fail-closed", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  await prisma.auditLog.deleteMany({ where: { actorId } });
  await prisma.article.deleteMany({ where: { createdBy: actorId } });
  await prisma.adminUser.deleteMany({ where: { id: actorId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.user.create({ data: { id: userId, name: actor.name, email: actor.email, emailVerified: true } });
  await prisma.adminUser.create({ data: { id: actorId, userId, name: actor.name, email: actor.email, role: "SUPER_ADMIN" } });
  try {
    const created = await articleService.createDraft({ title: "Durable Learning Guide", slug: "durable-learning-guide", locale: "en-GB", category: "casino-basics", actorId });
    assert.equal(created.status, "DRAFT");
    assert.deepEqual(await articleService.listPublished("en-GB"), []);
    await assert.rejects(() => articleService.createDraft({ title: "Duplicate slug", slug: "durable-learning-guide", locale: "en-GB", category: "licensing", actorId }), /already exists/i);
    await assert.rejects(() => articleService.transition(created.id, "request-review", actor, created.updatedAt), /not ready/i);

    const saved = await articleService.updateDraft(created.id, {
      ...created,
      excerpt: "A complete explanatory summary that is safe to publish.",
      bodyBlocks: [
        { id: "intro", type: "paragraph", text: "This body is stored in the canonical PostgreSQL Article record." },
        { id: "method", type: "link", label: "Methodology", url: "/methodology", description: "How B4GAMBLE reviews editorial content." },
      ],
      readingTime: "4 min read",
      difficulty: "Beginner",
    }, actorId, created.updatedAt);
    assert.equal((await articleService.listAdminArticles({ locale: "en-GB", category: "casino-basics" })).total, 1);
    assert.equal((await articleService.listAdminArticles({ locale: "de-DE" })).total, 0);
    assert.equal((await articleService.listRevisions(created.id)).length, 1);

    const review = await articleService.transition(created.id, "request-review", actor, saved.updatedAt);
    const approved = await articleService.transition(created.id, "approve", actor, review.updatedAt);
    assert.ok(approved.lastReviewedAt);
    const published = await articleService.transition(created.id, "publish", actor, approved.updatedAt);
    assert.ok(published.publishedAt);
    assert.equal((await articleService.listPublished("en-GB")).length, 1);
    assert.equal((await articleService.listPublished("de-DE")).length, 0);
    assert.equal((await articleService.getPublished("casino-basics", "durable-learning-guide", "en-GB"))?.id, created.id);

    const revised = await articleService.transition(created.id, "revise", actor, published.updatedAt);
    assert.equal(revised.status, "DRAFT");
    assert.equal((await articleService.listPublished("en-GB")).length, 0);
    const revisions = await articleService.listRevisions(created.id);
    const restored = await articleService.restoreRevision(created.id, revisions.at(-1)!.id, actorId, revised.updatedAt);
    assert.equal(restored.status, "DRAFT");
    assert.ok((await articleService.listRevisions(created.id)).length > revisions.length);
    const archived = await articleService.transition(created.id, "archive", actor, restored.updatedAt);
    assert.equal(archived.status, "ARCHIVED");
    assert.ok(archived.archivedAt);
    assert.equal((await articleService.listPublished("en-GB")).length, 0);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId } });
    const articles = await prisma.article.findMany({ where: { createdBy: actorId }, select: { id: true } });
    await prisma.contentRevision.deleteMany({ where: { entityType: "article", entityId: { in: articles.map((article) => article.id) } } });
    await prisma.article.deleteMany({ where: { createdBy: actorId } });
    await prisma.adminUser.deleteMany({ where: { id: actorId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});

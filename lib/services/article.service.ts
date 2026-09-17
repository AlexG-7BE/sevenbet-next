import "server-only";

import { EditorialStatus, Prisma, type Article } from "@prisma/client";

import type { CmsUser } from "@/lib/cms/types";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG, publicEditorialCache } from "@/lib/public-editorial-cache";
import type {
  AdminArticle,
  ArticleDocumentInput,
  ArticleRevisionSummary,
  PublicArticle,
} from "@/lib/articles/article-types";
import {
  isPublishedArticleLocale,
  isSafeArticleRoutePart,
  publicationIssues,
  validateArticleDocument,
} from "@/lib/articles/article-validation";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

const ARTICLE_ENTITY = "article";

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

function mapArticle(article: Article): AdminArticle {
  const parsed = validateArticleDocument({
    ...article,
    bodyBlocks: article.bodyBlocks,
  });
  return {
    ...parsed.document,
    id: article.id,
    status: article.status,
    publishedAt: iso(article.publishedAt),
    lastReviewedAt: iso(article.lastReviewedAt),
    archivedAt: iso(article.archivedAt),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    createdBy: article.createdBy,
    updatedBy: article.updatedBy,
  };
}

function mapPublishedArticle(article: Article): PublicArticle | null {
  const parsed = validateArticleDocument({
    ...article,
    bodyBlocks: article.bodyBlocks,
  });
  if (parsed.issues.length || publicationIssues(parsed.document).length || !article.publishedAt) return null;
  const mapped = mapArticle(article);
  return {
    ...mapped,
    status: "PUBLISHED",
    publishedAt: article.publishedAt.toISOString(),
  };
}

function inputData(document: ArticleDocumentInput) {
  return {
    ...document,
    bodyBlocks: document.bodyBlocks as unknown as Prisma.InputJsonValue,
  };
}

function snapshot(article: Article) {
  return {
    schemaVersion: 1,
    article: mapArticle(article),
  } as Prisma.InputJsonValue;
}

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function assertExpected(article: Article, expectedUpdatedAt?: string) {
  if (expectedUpdatedAt && article.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new ConflictError("Article changed after this editor was opened. Reload before saving.", {
      currentUpdatedAt: article.updatedAt.toISOString(),
      expectedUpdatedAt,
    });
  }
}

function assertPublicationReady(article: Article) {
  const parsed = validateArticleDocument({ ...article, bodyBlocks: article.bodyBlocks });
  const issues = [...parsed.issues, ...publicationIssues(parsed.document)];
  if (issues.length) throw new ValidationError("Article is not ready for editorial review or publication.", { issues });
}

const cachedPublishedArticles = publicEditorialCache(
  async (locale: string, category: string | null, take: number, excludeId: string | null) => (
    await prisma.article.findMany({
      where: {
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        locale,
        publishedAt: { lte: new Date() },
        ...(category ? { category } : {}),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take,
    })
  ).flatMap((record) => {
    const article = mapPublishedArticle(record);
    return article ? [article] : [];
  }),
  ["public-article-list-v1"],
  [PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG],
);

const cachedPublishedArticle = publicEditorialCache(
  async (category: string, slug: string, locale: string) => {
    const record = await prisma.article.findFirst({
      where: { category, slug, locale, status: EditorialStatus.PUBLISHED, archivedAt: null, publishedAt: { lte: new Date() } },
    });
    return record ? mapPublishedArticle(record) : null;
  },
  ["public-article-detail-v1"],
  [PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG],
);

export class ArticleService {
  async listAdminArticles(input: { search?: string; status?: string; locale?: string; category?: string; take?: number } = {}) {
    const where: Prisma.ArticleWhereInput = {
      ...(input.search?.trim() ? {
        OR: ["title", "slug", "excerpt"].map((field) => ({ [field]: { contains: input.search!.trim(), mode: "insensitive" } })),
      } : {}),
      ...(Object.values(EditorialStatus).includes(input.status as EditorialStatus) ? { status: input.status as EditorialStatus } : {}),
      ...(input.locale?.trim() ? { locale: input.locale.trim() } : {}),
      ...(input.category?.trim() ? { category: input.category.trim() } : {}),
    };
    const [records, total] = await prisma.$transaction([
      prisma.article.findMany({ where, orderBy: { updatedAt: "desc" }, take: Math.min(100, Math.max(1, input.take ?? 100)) }),
      prisma.article.count({ where }),
    ]);
    return { records: records.map(mapArticle), total };
  }

  async getAdminArticle(id: string) {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundError("Article", { id });
    return mapArticle(article);
  }

  async createDraft(input: { title: string; slug: string; locale: string; category: string; actorId: string }) {
    const parsed = validateArticleDocument({
      title: input.title,
      slug: input.slug,
      locale: input.locale,
      category: input.category,
      excerpt: "",
      tags: [],
      bodyBlocks: [],
    });
    if (parsed.issues.length) throw new ValidationError("Draft identity is invalid.", { issues: parsed.issues });
    try {
      const article = await prisma.$transaction(async (tx) => {
        const created = await tx.article.create({
          data: { ...inputData(parsed.document), status: EditorialStatus.DRAFT, createdBy: input.actorId, updatedBy: input.actorId },
        });
        await tx.auditLog.create({
          data: { actorId: input.actorId, action: "create", entityType: ARTICLE_ENTITY, entityId: created.id, summary: "Created private Article draft" },
        });
        return created;
      });
      return mapArticle(article);
    } catch (error) {
      if (isUniqueConstraint(error)) throw new ConflictError("Article slug already exists.", { slug: parsed.document.slug });
      throw error;
    }
  }

  async updateDraft(id: string, value: unknown, actorId: string, expectedUpdatedAt?: string) {
    const parsed = validateArticleDocument(value);
    if (parsed.issues.length) throw new ValidationError("Article draft contains invalid fields.", { issues: parsed.issues });
    try {
      return await prisma.$transaction(async (tx) => {
        const current = await tx.article.findUnique({ where: { id } });
        if (!current) throw new NotFoundError("Article", { id });
        if (current.status !== EditorialStatus.DRAFT) throw new ConflictError("Only a DRAFT Article can be edited. Return it to draft first.", { status: current.status });
        assertExpected(current, expectedUpdatedAt);
        const latest = await tx.contentRevision.aggregate({ where: { entityType: ARTICLE_ENTITY, entityId: id }, _max: { revisionNumber: true } });
        await tx.contentRevision.create({
          data: { entityType: ARTICLE_ENTITY, entityId: id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, snapshot: snapshot(current), summary: "Before draft update", createdBy: actorId },
        });
        const updated = await tx.article.update({ where: { id }, data: { ...inputData(parsed.document), updatedBy: actorId } });
        await tx.auditLog.create({
          data: { actorId, action: "update", entityType: ARTICLE_ENTITY, entityId: id, summary: "Updated Article draft" },
        });
        return mapArticle(updated);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isUniqueConstraint(error)) throw new ConflictError("Article slug already exists.", { slug: parsed.document.slug });
      throw error;
    }
  }

  async transition(id: string, action: string, actor: CmsUser, expectedUpdatedAt?: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.article.findUnique({ where: { id } });
      if (!current) throw new NotFoundError("Article", { id });
      assertExpected(current, expectedUpdatedAt);

      const transitions: Record<string, { from: EditorialStatus[]; to: EditorialStatus; reviewed?: boolean; published?: boolean; archived?: boolean }> = {
        "request-review": { from: [EditorialStatus.DRAFT], to: EditorialStatus.IN_REVIEW },
        "request-changes": { from: [EditorialStatus.IN_REVIEW, EditorialStatus.APPROVED], to: EditorialStatus.DRAFT },
        approve: { from: [EditorialStatus.IN_REVIEW], to: EditorialStatus.APPROVED, reviewed: true },
        publish: { from: [EditorialStatus.APPROVED], to: EditorialStatus.PUBLISHED, published: true },
        revise: { from: [EditorialStatus.PUBLISHED], to: EditorialStatus.DRAFT },
        archive: { from: [EditorialStatus.DRAFT, EditorialStatus.IN_REVIEW, EditorialStatus.APPROVED, EditorialStatus.PUBLISHED], to: EditorialStatus.ARCHIVED, archived: true },
        restore: { from: [EditorialStatus.ARCHIVED], to: EditorialStatus.DRAFT },
      };
      const transition = transitions[action];
      if (!transition) throw new ValidationError("Unknown Article workflow action.", { action });
      if (!transition.from.includes(current.status)) throw new ConflictError(`Cannot ${action} an Article in ${current.status}.`, { status: current.status, action });
      if (["request-review", "approve", "publish"].includes(action)) assertPublicationReady(current);

      const latest = await tx.contentRevision.aggregate({ where: { entityType: ARTICLE_ENTITY, entityId: id }, _max: { revisionNumber: true } });
      await tx.contentRevision.create({
        data: { entityType: ARTICLE_ENTITY, entityId: id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, snapshot: snapshot(current), summary: `Before workflow action: ${action}`, createdBy: actor.id },
      });
      const now = new Date();
      const updated = await tx.article.update({
        where: { id },
        data: {
          status: transition.to,
          updatedBy: actor.id,
          archivedAt: transition.archived ? now : null,
          ...(transition.reviewed ? { lastReviewedAt: now } : {}),
          ...(action === "request-changes" || action === "revise" || action === "restore" ? { lastReviewedAt: null } : {}),
          ...(transition.published ? { publishedAt: now } : {}),
        },
      });
      await tx.auditLog.create({
        data: { actorId: actor.id, action, entityType: ARTICLE_ENTITY, entityId: id, summary: `Article workflow changed from ${current.status} to ${transition.to}` },
      });
      return mapArticle(updated);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listRevisions(id: string): Promise<ArticleRevisionSummary[]> {
    await this.getAdminArticle(id);
    const revisions = await prisma.contentRevision.findMany({
      where: { entityType: ARTICLE_ENTITY, entityId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, revisionNumber: true, summary: true, createdBy: true, createdAt: true },
    });
    return revisions.map((revision) => ({ ...revision, createdAt: revision.createdAt.toISOString() }));
  }

  async restoreRevision(id: string, revisionId: string, actorId: string, expectedUpdatedAt?: string) {
    return prisma.$transaction(async (tx) => {
      const [current, revision] = await Promise.all([
        tx.article.findUnique({ where: { id } }),
        tx.contentRevision.findFirst({ where: { id: revisionId, entityType: ARTICLE_ENTITY, entityId: id } }),
      ]);
      if (!current) throw new NotFoundError("Article", { id });
      if (!revision) throw new NotFoundError("Article revision", { id, revisionId });
      if (current.status !== EditorialStatus.DRAFT) throw new ConflictError("Return the Article to DRAFT before restoring a revision.", { status: current.status });
      assertExpected(current, expectedUpdatedAt);
      const stored = revision.snapshot as { schemaVersion?: number; article?: unknown };
      const parsed = validateArticleDocument(stored.article);
      if (stored.schemaVersion !== 1 || parsed.issues.length) throw new ConflictError("Revision snapshot is not compatible with the current Article schema.", { revisionId, issues: parsed.issues });
      const latest = await tx.contentRevision.aggregate({ where: { entityType: ARTICLE_ENTITY, entityId: id }, _max: { revisionNumber: true } });
      await tx.contentRevision.create({
        data: { entityType: ARTICLE_ENTITY, entityId: id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, snapshot: snapshot(current), summary: `Before restoring revision ${revision.revisionNumber}`, createdBy: actorId },
      });
      const updated = await tx.article.update({ where: { id }, data: { ...inputData(parsed.document), updatedBy: actorId } });
      await tx.auditLog.create({
        data: { actorId, action: "restore_revision", entityType: ARTICLE_ENTITY, entityId: id, summary: `Restored Article revision ${revision.revisionNumber}` },
      });
      return mapArticle(updated);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listPublished(locale: string, input: { category?: string; take?: number; excludeId?: string } = {}): Promise<PublicArticle[]> {
    if (!isPublishedArticleLocale(locale)) return [];
    const category = input.category?.trim() || null;
    if (category && !isSafeArticleRoutePart(category)) return [];
    const records = await cachedPublishedArticles(
      locale,
      category,
      Math.min(500, Math.max(1, input.take ?? 100)),
      input.excludeId ?? null,
    );
    return records;
  }

  async getPublished(category: string, slug: string, locale: string) {
    if (!isSafeArticleRoutePart(category) || !isSafeArticleRoutePart(slug) || !isPublishedArticleLocale(locale)) return null;
    const record = await cachedPublishedArticle(category, slug, locale);
    if (!record) return null;
    return record;
  }
}

export const articleService = new ArticleService();

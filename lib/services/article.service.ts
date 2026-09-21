import "server-only";

import { EditorialStatus, Prisma, type Article } from "@prisma/client";

import type { CmsUser } from "@/lib/cms/types";
import { runPublicDatabaseRead } from "@/lib/db/public-database-read-coordinator";
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
export const LEARN_APPLY_AUDIT_ACTION = "learn_apply";

export type LearnApplyAuditRecord = {
  entityId: string;
  metadata: Prisma.JsonValue | null;
  timestamp: string;
};

export type PublishedApplyInspection = {
  article: AdminArticle | null;
  requestAudit: LearnApplyAuditRecord | null;
  reusableAudit: LearnApplyAuditRecord | null;
};

export type ApplyPublishedDocumentInput = {
  articleId: string | null;
  document: ArticleDocumentInput;
  actorId: string;
  requestIdHash: string;
  intentFingerprint: string;
  documentFingerprint: string;
  expectedUpdatedAt: string | null;
  observedArticleId: string | null;
  observedUpdatedAt: string | null;
  auditMetadata: Prisma.InputJsonObject;
};

export type ApplyPublishedDocumentResult = {
  operation: "CREATED" | "UPDATED" | "NO_CHANGE";
  article: AdminArticle;
  previousPath: { category: string; slug: string } | null;
};

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

function articleDocument(article: Article) {
  return validateArticleDocument({ ...article, bodyBlocks: article.bodyBlocks }).document;
}

function documentsEqual(left: ArticleDocumentInput, right: ArticleDocumentInput) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function auditRecord(value: { entityId: string; metadata: Prisma.JsonValue | null; timestamp: Date } | null): LearnApplyAuditRecord | null {
  return value ? { ...value, timestamp: value.timestamp.toISOString() } : null;
}

function auditMetadataRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function learnImageKeys(value: Prisma.InputJsonObject) {
  const images = value.images;
  if (!Array.isArray(images)) return [];
  return images.flatMap((image) => {
    if (!image || typeof image !== "object" || Array.isArray(image)) return [];
    const key = (image as Record<string, unknown>).key;
    return typeof key === "string" && /^content\/learn\/[a-f0-9]{64}\.(?:jpg|png|webp|avif|gif)$/.test(key)
      ? [key]
      : [];
  });
}

function imageReferenceMatches(value: unknown, url: string, key?: string) {
  if (value === url) return true;
  if (typeof value !== "string" || !key) return false;
  try {
    return decodeURIComponent(new URL(value).pathname).endsWith(`/${key}`);
  } catch {
    return value.endsWith(`/${key}`);
  }
}

function bodyReferencesImage(value: unknown, url: string, key?: string) {
  if (!Array.isArray(value)) return false;
  return value.some((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return false;
    const candidate = block as Record<string, unknown>;
    return candidate.type === "image" && imageReferenceMatches(candidate.url, url, key);
  });
}

function revisionReferencesImage(value: Prisma.JsonValue, url: string, key?: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const article = (value as Record<string, unknown>).article;
  if (!article || typeof article !== "object" || Array.isArray(article)) return false;
  const record = article as Record<string, unknown>;
  return imageReferenceMatches(record.heroImageUrl, url, key)
    || bodyReferencesImage(record.bodyBlocks, url, key);
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

function isSerializableConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
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
    await runPublicDatabaseRead(() => prisma.article.findMany({
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
    }))
  ).flatMap((record) => {
    const article = mapPublishedArticle(record);
    return article ? [article] : [];
  }),
  ["public-article-list-v1"],
  [PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG],
);

const cachedPublishedArticle = publicEditorialCache(
  async (category: string, slug: string, locale: string) => {
    const record = await runPublicDatabaseRead(() => prisma.article.findFirst({
      where: { category, slug, locale, status: EditorialStatus.PUBLISHED, archivedAt: null, publishedAt: { lte: new Date() } },
    }));
    return record ? mapPublishedArticle(record) : null;
  },
  ["public-article-detail-v1"],
  [PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG],
);

export class ArticleService {
  async inspectPublishedApply(input: {
    articleId: string | null;
    slug: string;
    requestIdHash: string;
    intentFingerprint: string;
    expectedUpdatedAt?: string | null;
  }): Promise<PublishedApplyInspection> {
    const current = input.articleId
      ? await prisma.article.findUnique({ where: { id: input.articleId } })
      : await prisma.article.findUnique({ where: { slug: input.slug } });
    if (input.articleId && !current) throw new NotFoundError("Article", { id: input.articleId });
    const [requestAuditValue, reusableAuditValue] = await Promise.all([
      prisma.auditLog.findFirst({
        where: {
          action: LEARN_APPLY_AUDIT_ACTION,
          entityType: ARTICLE_ENTITY,
          metadata: { path: ["requestIdHash"], equals: input.requestIdHash },
        },
        orderBy: { timestamp: "desc" },
        select: { entityId: true, metadata: true, timestamp: true },
      }),
      current ? prisma.auditLog.findFirst({
        where: {
          action: LEARN_APPLY_AUDIT_ACTION,
          entityType: ARTICLE_ENTITY,
          entityId: current.id,
          metadata: { path: ["intentFingerprint"], equals: input.intentFingerprint },
        },
        orderBy: { timestamp: "desc" },
        select: { entityId: true, metadata: true, timestamp: true },
      }) : Promise.resolve(null),
    ]);
    if (input.expectedUpdatedAt && current?.updatedAt.toISOString() !== input.expectedUpdatedAt && !requestAuditValue) {
      throw new ConflictError("Article changed before autonomous publication began.", {
        currentUpdatedAt: current?.updatedAt.toISOString() ?? null,
        expectedUpdatedAt: input.expectedUpdatedAt,
      });
    }
    return {
      article: current ? mapArticle(current) : null,
      requestAudit: auditRecord(requestAuditValue),
      reusableAudit: auditRecord(reusableAuditValue),
    };
  }

  async applyPublishedDocument(input: ApplyPublishedDocumentInput): Promise<ApplyPublishedDocumentResult> {
    const parsed = validateArticleDocument(input.document);
    const issues = [...parsed.issues, ...publicationIssues(parsed.document)];
    if (issues.length) throw new ValidationError("Article is not ready for autonomous publication.", { issues });

    try {
      return await prisma.$transaction(async (tx) => {
        const lockKeys = [...new Set([
          `learn-request:${input.requestIdHash}`,
          `learn-slug:${parsed.document.slug}`,
          `learn-article:${input.articleId ?? input.observedArticleId ?? parsed.document.slug}`,
          ...learnImageKeys(input.auditMetadata).map((key) => `learn-image:${key}`),
        ])].sort();
        for (const key of lockKeys) {
          await tx.$queryRaw`SELECT 1::integer AS "locked" FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
        }

        const existingRequest = await tx.auditLog.findFirst({
          where: {
            action: LEARN_APPLY_AUDIT_ACTION,
            entityType: ARTICLE_ENTITY,
            metadata: { path: ["requestIdHash"], equals: input.requestIdHash },
          },
          orderBy: { timestamp: "desc" },
          select: { entityId: true, metadata: true },
        });
        const current = input.articleId
          ? await tx.article.findUnique({ where: { id: input.articleId } })
          : await tx.article.findUnique({ where: { slug: parsed.document.slug } });
        if (input.articleId && !current) throw new NotFoundError("Article", { id: input.articleId });

        if (existingRequest) {
          const metadata = auditMetadataRecord(existingRequest.metadata);
          if (metadata?.intentFingerprint !== input.intentFingerprint) {
            throw new ConflictError("requestId was already used for a different Learn apply intent.", {
              articleId: existingRequest.entityId,
            });
          }
          if (
            current
            && current.id === existingRequest.entityId
            && current.status === EditorialStatus.PUBLISHED
            && documentsEqual(articleDocument(current), parsed.document)
          ) {
            return { operation: "NO_CHANGE", article: mapArticle(current), previousPath: null };
          }
          throw new ConflictError("This requestId was already applied, but the Article has since changed.", {
            articleId: existingRequest.entityId,
          });
        }

        if (!input.observedArticleId && current) {
          if (current.status === EditorialStatus.PUBLISHED && documentsEqual(articleDocument(current), parsed.document)) {
            return { operation: "NO_CHANGE", article: mapArticle(current), previousPath: null };
          }
          throw new ConflictError("Article identity appeared while publication dependencies were being prepared.", {
            articleId: current.id,
            currentUpdatedAt: current.updatedAt.toISOString(),
          });
        }
        if (input.observedArticleId && (!current || current.id !== input.observedArticleId)) {
          throw new ConflictError("Article identity changed while publication dependencies were being prepared.", {
            observedArticleId: input.observedArticleId,
            currentArticleId: current?.id ?? null,
          });
        }
        if (current && input.observedUpdatedAt && current.updatedAt.toISOString() !== input.observedUpdatedAt) {
          if (current.status === EditorialStatus.PUBLISHED && documentsEqual(articleDocument(current), parsed.document)) {
            return { operation: "NO_CHANGE", article: mapArticle(current), previousPath: null };
          }
          throw new ConflictError("Article changed during autonomous publication.", {
            currentUpdatedAt: current.updatedAt.toISOString(),
            observedUpdatedAt: input.observedUpdatedAt,
          });
        }
        if (current && input.expectedUpdatedAt && current.updatedAt.toISOString() !== input.expectedUpdatedAt) {
          if (current.status === EditorialStatus.PUBLISHED && documentsEqual(articleDocument(current), parsed.document)) {
            return { operation: "NO_CHANGE", article: mapArticle(current), previousPath: null };
          }
          throw new ConflictError("Article no longer matches expectedUpdatedAt.", {
            currentUpdatedAt: current.updatedAt.toISOString(),
            expectedUpdatedAt: input.expectedUpdatedAt,
          });
        }
        if (current?.status === EditorialStatus.ARCHIVED) {
          throw new ConflictError("Archived Articles must be restored through the human editorial workflow before autonomous apply.", {
            articleId: current.id,
          });
        }
        if (current?.status === EditorialStatus.PUBLISHED && documentsEqual(articleDocument(current), parsed.document)) {
          return { operation: "NO_CHANGE", article: mapArticle(current), previousPath: null };
        }

        const now = new Date();
        let saved: Article;
        let operation: "CREATED" | "UPDATED";
        let previousPath: { category: string; slug: string } | null = null;
        if (!current) {
          saved = await tx.article.create({
            data: {
              ...inputData(parsed.document),
              status: EditorialStatus.PUBLISHED,
              publishedAt: now,
              lastReviewedAt: now,
              archivedAt: null,
              createdBy: input.actorId,
              updatedBy: input.actorId,
            },
          });
          operation = "CREATED";
        } else {
          previousPath = { category: current.category, slug: current.slug };
          const latest = await tx.contentRevision.aggregate({
            where: { entityType: ARTICLE_ENTITY, entityId: current.id },
            _max: { revisionNumber: true },
          });
          await tx.contentRevision.create({
            data: {
              entityType: ARTICLE_ENTITY,
              entityId: current.id,
              revisionNumber: (latest._max.revisionNumber ?? 0) + 1,
              snapshot: snapshot(current),
              summary: "Before autonomous Learn publication replacement",
              createdBy: input.actorId,
            },
          });
          saved = await tx.article.update({
            where: { id: current.id },
            data: {
              ...inputData(parsed.document),
              status: EditorialStatus.PUBLISHED,
              publishedAt: current.publishedAt ?? now,
              lastReviewedAt: now,
              archivedAt: null,
              updatedBy: input.actorId,
            },
          });
          operation = "UPDATED";
        }
        await tx.auditLog.create({
          data: {
            actorId: input.actorId,
            action: LEARN_APPLY_AUDIT_ACTION,
            entityType: ARTICLE_ENTITY,
            entityId: saved.id,
            summary: operation === "CREATED"
              ? "Autonomous Learn Article created and published"
              : "Autonomous Learn Article atomically replaced while published",
            metadata: {
              ...input.auditMetadata,
              operation,
              requestIdHash: input.requestIdHash,
              intentFingerprint: input.intentFingerprint,
              documentFingerprint: input.documentFingerprint,
            },
          },
        });
        return { operation, article: mapArticle(saved), previousPath };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isUniqueConstraint(error)) throw new ConflictError("Article slug already exists.", { slug: parsed.document.slug });
      if (isSerializableConflict(error)) throw new ConflictError("A concurrent Learn publication changed the same Article. Retry with a new requestId.");
      throw error;
    }
  }

  async isImageUrlReferenced(url: string) {
    return this.isImageUrlReferencedWith(prisma, url);
  }

  private async isImageUrlReferencedWith(
    client: Prisma.TransactionClient | typeof prisma,
    url: string,
    key?: string,
  ) {
    const records = await client.article.findMany({ select: { heroImageUrl: true, bodyBlocks: true } });
    if (records.some((record) => imageReferenceMatches(record.heroImageUrl, url, key)
      || bodyReferencesImage(record.bodyBlocks, url, key))) return true;
    const revisions = await client.contentRevision.findMany({
      where: { entityType: ARTICLE_ENTITY },
      select: { snapshot: true },
    });
    return revisions.some((revision) => revisionReferencesImage(revision.snapshot, url, key));
  }

  async cleanupUnreferencedImage(key: string, url: string, cleanup: () => Promise<void>) {
    if (!/^content\/learn\/[a-f0-9]{64}\.(?:jpg|png|webp|avif|gif)$/.test(key)) {
      throw new ValidationError("Learn image cleanup key is invalid.");
    }
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::integer AS "locked" FROM pg_advisory_xact_lock(hashtextextended(${`learn-image:${key}`}, 0))`;
      if (await this.isImageUrlReferencedWith(tx, url, key)) return false;
      await cleanup();
      return true;
    });
  }

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

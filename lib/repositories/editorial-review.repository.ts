import { createHash } from "node:crypto";
import { EditorialReviewStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { CasinoEditorialDocument, EditorialReview, EditorialRevision } from "@/lib/editorial-review/types";

function json(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
function document(value: Prisma.JsonValue): CasinoEditorialDocument { return value as unknown as CasinoEditorialDocument; }
function revision(value: { id: string; reviewId: string; revisionNumber: number; content: Prisma.JsonValue; summary: string; createdBy: string; createdAt: Date; promotedAt: Date | null }): EditorialRevision {
  return { ...value, content: document(value.content) };
}
function review(value: { id: string; casinoId: string; status: EditorialReviewStatus; draftRevisionNumber: number; publishedRevisionId: string | null; scheduledPublishAt: Date | null; publishedAt: Date | null; archivedAt: Date | null; revisions: Array<{ id: string; reviewId: string; revisionNumber: number; content: Prisma.JsonValue; summary: string; createdBy: string; createdAt: Date; promotedAt: Date | null }> }): EditorialReview {
  return { ...value, status: value.status, revisions: value.revisions.map(revision) };
}

const include = { revisions: { orderBy: { revisionNumber: "desc" } } } satisfies Prisma.EditorialReviewInclude;
export interface EditorialReviewStore {
  findById(id: string): Promise<EditorialReview | null>;
  findByCasinoId(casinoId: string): Promise<EditorialReview | null>;
  findPublishedBySlug(slug: string): Promise<{ review: EditorialReview; casino: { id: string; slug: string; title: string } } | null>;
  saveRevision(casinoId: string, content: CasinoEditorialDocument, summary: string, actorId: string): Promise<EditorialReview>;
  transition(reviewId: string, status: EditorialReviewStatus, actorId: string, scheduleAt?: Date | null): Promise<EditorialReview>;
  promote(reviewId: string, revisionId: string, actorId: string): Promise<EditorialReview>;
  createPreviewToken(reviewId: string, revisionId: string, tokenHash: string, expiresAt: Date, actorId: string): Promise<void>;
  findPreviewToken(tokenHash: string): Promise<{ review: EditorialReview; revisionId: string } | null>;
}

export class EditorialReviewRepository implements EditorialReviewStore {
  async findById(id: string) {
    const value = await prisma.editorialReview.findUnique({ where: { id }, include });
    return value ? review(value) : null;
  }
  async findByCasinoId(casinoId: string) {
    const value = await prisma.editorialReview.findUnique({ where: { casinoId }, include });
    return value ? review(value) : null;
  }
  async findPublishedBySlug(slug: string) {
    const value = await prisma.editorialReview.findFirst({ where: { status: "PUBLISHED", archivedAt: null, casino: { slug } }, include: { ...include, casino: { select: { id: true, slug: true, title: true } } } });
    return value ? { review: review(value), casino: value.casino } : null;
  }
  async saveRevision(casinoId: string, content: CasinoEditorialDocument, summary: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.editorialReview.findUnique({ where: { casinoId }, include: { revisions: { select: { revisionNumber: true } } } });
      const next = Math.max(0, ...(current?.revisions.map((item) => item.revisionNumber) ?? [])) + 1;
      const record = current
        ? await tx.editorialReview.update({ where: { id: current.id }, data: { draftRevisionNumber: next, updatedBy: actorId, status: current.status === "ARCHIVED" ? "DRAFT" : current.status, revisions: { create: { revisionNumber: next, content: json(content), summary, createdBy: actorId } } }, include })
        : await tx.editorialReview.create({ data: { casinoId, createdBy: actorId, updatedBy: actorId, draftRevisionNumber: next, revisions: { create: { revisionNumber: next, content: json(content), summary, createdBy: actorId } } }, include });
      await tx.auditLog.create({ data: { actorId, action: "editorial_revision_saved", entityType: "editorial-review", entityId: record.id, summary: "Saved a structured editorial revision" } });
      return review(record);
    });
  }
  async transition(reviewId: string, status: EditorialReviewStatus, actorId: string, scheduleAt: Date | null = null) {
    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.editorialReview.update({ where: { id: reviewId }, data: { status, scheduledPublishAt: scheduleAt, archivedAt: status === "ARCHIVED" ? new Date() : null, updatedBy: actorId }, include });
      await tx.auditLog.create({ data: { actorId, action: `editorial_${status.toLowerCase()}`, entityType: "editorial-review", entityId: reviewId, summary: `Editorial review moved to ${status}` } });
      return updated;
    });
    return review(record);
  }
  async promote(reviewId: string, revisionId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const candidate = await tx.editorialReviewRevision.findFirst({ where: { id: revisionId, reviewId } });
      if (!candidate) throw new Error("EDITORIAL_REVISION_NOT_FOUND");
      const updated = await tx.editorialReview.update({ where: { id: reviewId }, data: { status: "PUBLISHED", publishedRevisionId: revisionId, publishedAt: new Date(), archivedAt: null, updatedBy: actorId, revisions: { update: { where: { id: revisionId }, data: { promotedAt: new Date() } } } }, include });
      await tx.auditLog.create({ data: { actorId, action: "editorial_published", entityType: "editorial-review", entityId: reviewId, summary: `Published editorial revision ${candidate.revisionNumber}` } });
      return review(updated);
    });
  }
  async createPreviewToken(reviewId: string, revisionId: string, tokenHash: string, expiresAt: Date, actorId: string) {
    await prisma.editorialPreviewToken.create({ data: { reviewId, revisionId, tokenHash, expiresAt, createdBy: actorId } });
  }
  async findPreviewToken(tokenHash: string) {
    const token = await prisma.editorialPreviewToken.findFirst({ where: { tokenHash, expiresAt: { gt: new Date() } }, include: { review: { include }, revision: true } });
    return token ? { review: review(token.review), revisionId: token.revisionId } : null;
  }
}

export function hashPreviewToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export const editorialReviewRepository = new EditorialReviewRepository();

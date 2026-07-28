import { randomBytes } from "node:crypto";

import { validateEditorialDocument } from "@/lib/editorial-review/validation";
import type { CasinoEditorialDocument, EditorialReviewStatus } from "@/lib/editorial-review/types";
import { editorialReviewRepository, hashPreviewToken, type EditorialReviewStore } from "@/lib/repositories/editorial-review.repository";
import { ConflictError, NotFoundError, ValidationError } from "./service-error";

const transitions: Record<EditorialReviewStatus, EditorialReviewStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"], IN_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"], APPROVED: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  SCHEDULED: ["DRAFT", "PUBLISHED", "ARCHIVED"], PUBLISHED: ["DRAFT", "ARCHIVED", "SUSPENDED"], ARCHIVED: ["DRAFT"], SUSPENDED: ["DRAFT", "ARCHIVED"],
};

export class EditorialReviewService {
  constructor(private readonly repository: EditorialReviewStore = editorialReviewRepository) {}
  async getByCasinoId(casinoId: string) { return this.repository.findByCasinoId(casinoId); }
  async getPublishedBySlug(slug: string) { return this.repository.findPublishedBySlug(slug); }
  async saveDraft(casinoId: string, content: CasinoEditorialDocument, summary: string, actorId: string) {
    const issues = validateEditorialDocument(content);
    if (issues.length) throw new ValidationError("Editorial review has validation errors", issues);
    return this.repository.saveRevision(casinoId, content, summary.trim() || "Editorial update", actorId);
  }
  async transition(reviewId: string, target: EditorialReviewStatus, actorId: string, scheduledAt?: Date | null) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw new NotFoundError("Editorial review", { reviewId });
    if (!transitions[review.status].includes(target)) throw new ConflictError(`Cannot move editorial review from ${review.status} to ${target}.`);
    if (target === "SCHEDULED" && (!scheduledAt || scheduledAt <= new Date())) throw new ValidationError("A future publication time is required.");
    return this.repository.transition(reviewId, target, actorId, scheduledAt ?? null);
  }
  async publish(reviewId: string, revisionId: string | undefined, actorId: string) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw new NotFoundError("Editorial review", { reviewId });
    if (!transitions[review.status].includes("PUBLISHED")) throw new ConflictError("Editorial review must be approved before publication.");
    const candidate = revisionId ? review.revisions.find((item) => item.id === revisionId) : review.revisions.find((item) => item.revisionNumber === review.draftRevisionNumber);
    if (!candidate) throw new NotFoundError("Editorial revision", { revisionId });
    const issues = validateEditorialDocument(candidate.content); if (issues.length) throw new ValidationError("Editorial revision cannot be published", issues);
    return this.repository.promote(review.id, candidate.id, actorId);
  }
  async createPreview(reviewId: string, actorId: string, expiresInMinutes = 30) {
    const review = await this.repository.findById(reviewId);
    const revision = review?.revisions.find((item) => item.revisionNumber === review.draftRevisionNumber);
    if (!review || !revision) throw new NotFoundError("Editorial draft", { reviewId });
    const token = randomBytes(32).toString("base64url"); const expiresAt = new Date(Date.now() + Math.min(Math.max(expiresInMinutes, 1), 60) * 60_000);
    await this.repository.createPreviewToken(review.id, revision.id, hashPreviewToken(token), expiresAt, actorId);
    return { token, expiresAt, revisionId: revision.id };
  }
  async resolvePreview(token: string) {
    if (!/^[A-Za-z0-9_-]{40,}$/.test(token)) return null;
    const result = await this.repository.findPreviewToken(hashPreviewToken(token));
    if (!result) return null;
    const revision = result.review.revisions.find((item) => item.id === result.revisionId);
    return revision ? { review: result.review, revision } : null;
  }
}
export const editorialReviewService = new EditorialReviewService();

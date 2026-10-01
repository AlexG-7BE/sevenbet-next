import { z } from "zod";

import type { ArticleBlock, ArticleDocumentInput } from "@/lib/articles/article-types";
import { publicationIssues, validateArticleDocument } from "@/lib/articles/article-validation";
import { revalidatePublicArticles } from "@/lib/articles/cache";
import {
  learnApplyInputSchema,
  type LearnApplyInput,
  type LearnApplyResult,
} from "@/lib/learn-apply/contract";
import { LearnApplyError } from "@/lib/learn-apply/errors";
import {
  LearnImageService,
  reusableLearnImagesFromAuditMetadata,
  type LearnImageSlotInput,
  type PreparedLearnImage,
} from "@/lib/learn-apply/image-service";
import {
  articleDocumentFingerprint,
  imageSourceFingerprint,
  learnApplyIntentFingerprint,
  sha256,
} from "@/lib/learn-apply/fingerprint";
import {
  LearnPublicVerifier,
  publicLearnArticlePath,
  type LearnPublicVerification,
} from "@/lib/learn-apply/public-verification";
import { resolveLearnServiceActor } from "@/lib/learn-apply/service-actor";
import {
  articleService,
  type ApplyPublishedDocumentInput,
  type ApplyPublishedDocumentResult,
  type PublishedApplyInspection,
} from "@/lib/services/article.service";
import { ServiceError, ValidationError } from "@/lib/services/service-error";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

type ArticleApplyPort = {
  inspectPublishedApply(input: {
    slug: string;
    requestIdHash: string;
    intentFingerprint: string;
  }): Promise<PublishedApplyInspection>;
  applyPublishedDocument(input: ApplyPublishedDocumentInput): Promise<ApplyPublishedDocumentResult>;
  isImageUrlReferenced(url: string): Promise<boolean>;
  cleanupUnreferencedImage?(
    key: string,
    url: string,
    cleanup: () => Promise<void>,
  ): Promise<boolean>;
};

type LearnApplyDependencies = {
  articles?: ArticleApplyPort;
  images?: Pick<LearnImageService, "prepare" | "cleanupCreated"> & Partial<Pick<LearnImageService, "ensureStored">>;
  verifier?: Pick<LearnPublicVerifier, "verify">;
  actorResolver?: typeof resolveLearnServiceActor;
  revalidate?: typeof revalidatePublicArticles;
  logger?: (entry: Record<string, unknown>) => void;
  sleep?: (milliseconds: number) => Promise<void>;
};

/**
 * Concurrent creates on Production (1 Oct 2026) failed after the hero image was
 * already generated and paid: Serializable write conflicts, a full connection
 * pool and transactions that could not start in time. These are retried here,
 * against the same prepared images, before the call fails. The transaction is
 * idempotent by requestId, so a retry after an unseen commit returns NO_CHANGE.
 */
export const LEARN_APPLY_PERSISTENCE_ATTEMPTS = 3;
const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2028", "P2034"]);

function errorCode(error: unknown) {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  return typeof code === "string" && /^[A-Z0-9_]{1,40}$/.test(code) ? code : null;
}

function transientPersistenceReason(error: unknown) {
  if (error instanceof ServiceError) return error.code === "SERIALIZABLE_CONFLICT" ? error.code : null;
  const code = errorCode(error);
  return code && TRANSIENT_PRISMA_CODES.has(code) ? code : null;
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function placeholderUrl(source: LearnImageSlotInput["source"]) {
  return `/learn-apply/validated-image-${imageSourceFingerprint(source)}.webp`;
}

function blockDocument(
  block: LearnApplyInput["article"]["bodyBlocks"][number],
  imageUrls: Map<string, string> | null,
): ArticleBlock {
  if (block.type === "paragraph") return block;
  if (block.type === "heading") return block;
  if (block.type === "list") return block;
  if (block.type === "quote") return {
    id: block.id,
    type: block.type,
    text: block.text,
    ...(block.citation ? { citation: block.citation } : {}),
  };
  if (block.type === "callout") return {
    id: block.id,
    type: block.type,
    text: block.text,
    ...(block.title ? { title: block.title } : {}),
  };
  if (block.type === "link") return {
    id: block.id,
    type: block.type,
    label: block.label,
    url: block.url,
    ...(block.description ? { description: block.description } : {}),
  };
  return {
    id: block.id,
    type: "image",
    url: imageUrls?.get(`body:${block.id}`) ?? placeholderUrl(block.source),
    alt: block.alt,
    ...(block.caption ? { caption: block.caption } : {}),
  };
}

function desiredDocument(input: LearnApplyInput, images: PreparedLearnImage[] | null): ArticleDocumentInput {
  const imageUrls = images ? new Map(images.map((image) => [image.slot, image.url])) : null;
  return {
    slug: input.article.slug,
    locale: input.article.locale,
    title: input.article.title,
    excerpt: input.article.excerpt,
    category: input.article.category,
    tags: input.article.tags,
    bodyBlocks: input.article.bodyBlocks.map((block) => blockDocument(block, imageUrls)),
    heroImageUrl: input.article.heroImage
      ? imageUrls?.get("hero") ?? placeholderUrl(input.article.heroImage.source)
      : null,
    heroImageAlt: input.article.heroImage?.alt ?? null,
    seoTitle: input.article.seo.title,
    seoDescription: input.article.seo.description,
    canonicalUrl: input.article.seo.canonicalUrl,
    readingTime: input.article.readingTime,
    difficulty: input.article.difficulty,
  };
}

function imageInputs(input: LearnApplyInput): LearnImageSlotInput[] {
  return [
    ...(input.article.heroImage ? [{ slot: "hero", source: input.article.heroImage.source, kind: "hero" as const }] : []),
    ...input.article.bodyBlocks.flatMap((block) => block.type === "image"
      ? [{ slot: `body:${block.id}`, source: block.source, kind: "inline" as const }]
      : []),
  ];
}

function currentArticleImageUrls(article: PublishedApplyInspection["article"]) {
  if (!article) return new Set<string>();
  return new Set([
    ...(article.heroImageUrl ? [article.heroImageUrl] : []),
    ...article.bodyBlocks.flatMap((block) => block.type === "image" ? [block.url] : []),
  ]);
}

function canonicalDocument(value: ArticleDocumentInput) {
  const parsed = validateArticleDocument(value);
  const issues = [...parsed.issues, ...publicationIssues(parsed.document)];
  if (issues.length) throw new ValidationError("Article is not ready for autonomous publication.", { issues });
  return parsed.document;
}

function safeValidationError(error: z.ZodError) {
  return new ValidationError("learn_apply input is invalid.", {
    issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
}

function verificationFailure(publicUrl: string, code: string): LearnPublicVerification {
  return { verified: false, checks: [], attempts: 1, failureCode: code, publicUrl };
}

export class LearnApplyService {
  private readonly articles: ArticleApplyPort;
  private readonly images: Pick<LearnImageService, "prepare" | "cleanupCreated"> & Partial<Pick<LearnImageService, "ensureStored">>;
  private readonly verifier: Pick<LearnPublicVerifier, "verify">;
  private readonly actorResolver: typeof resolveLearnServiceActor;
  private readonly revalidate: typeof revalidatePublicArticles;
  private readonly logger: (entry: Record<string, unknown>) => void;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(dependencies: LearnApplyDependencies = {}) {
    this.articles = dependencies.articles ?? articleService;
    this.images = dependencies.images ?? new LearnImageService({
      isReferenced: (url) => this.articles.isImageUrlReferenced(url),
      cleanupIfUnreferenced: this.articles.cleanupUnreferencedImage
        ? (object, cleanup) => this.articles.cleanupUnreferencedImage!(object.key, object.url, cleanup)
        : undefined,
    });
    this.verifier = dependencies.verifier ?? new LearnPublicVerifier();
    this.actorResolver = dependencies.actorResolver ?? resolveLearnServiceActor;
    this.revalidate = dependencies.revalidate ?? revalidatePublicArticles;
    this.logger = dependencies.logger ?? ((entry) => console.info(JSON.stringify(entry)));
    this.sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  private async withTransientRetry<T>(stage: string, requestIdHash: string, work: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await work();
      } catch (error) {
        const reason = transientPersistenceReason(error);
        if (!reason || attempt >= LEARN_APPLY_PERSISTENCE_ATTEMPTS) throw error;
        this.logger({ event: "learn_apply_transient_retry", requestIdHash, stage, attempt, reason });
        await this.sleep(attempt * 1_000);
      }
    }
  }

  async apply(value: unknown): Promise<LearnApplyResult> {
    const parsedInput = learnApplyInputSchema.safeParse(value);
    if (!parsedInput.success) throw safeValidationError(parsedInput.error);
    const input = parsedInput.data;
    const requestIdHash = sha256(input.requestId);
    const intentFingerprint = learnApplyIntentFingerprint(input);
    const startedAt = performance.now();
    let preparedImages: Awaited<ReturnType<LearnImageService["prepare"]>> | null = null;
    let persisted = false;
    let persistenceStarted = false;
    let articleId: string | null = null;
    this.logger({
      event: "learn_apply_started",
      requestIdHash,
      articleId,
      slug: input.article.slug,
      imageCount: imageInputs(input).length,
    });
    try {
      canonicalDocument(desiredDocument(input, null));
      const actor = await this.withTransientRetry("actor", requestIdHash, () => this.actorResolver());
      const inspection = await this.articles.inspectPublishedApply({
        slug: input.article.slug,
        requestIdHash,
        intentFingerprint,
      });
      articleId = inspection.article?.id ?? articleId;
      const requestMetadata = metadataRecord(inspection.requestAudit?.metadata);
      if (inspection.requestAudit && requestMetadata?.intentFingerprint !== intentFingerprint) {
        throw new LearnApplyError("requestId was already used for a different Learn apply intent.", "REQUEST_ID_CONFLICT", 409, {
          articleId: inspection.requestAudit?.entityId,
        });
      }
      if (inspection.requestAudit && (!inspection.article || inspection.requestAudit.entityId !== inspection.article.id)) {
        throw new LearnApplyError("requestId belongs to a different Article.", "REQUEST_ID_CONFLICT", 409, {
          articleId: inspection.requestAudit.entityId,
        });
      }
      if (inspection.article && !inspection.requestAudit) {
        throw new LearnApplyError("A Learn Article already uses this slug.", "CREATE_SLUG_EXISTS", 409, {
          articleId: inspection.article.id,
        });
      }
      const reuseMetadata = inspection.requestAudit?.metadata ?? inspection.reusableAudit?.metadata;
      const currentlyReferencedImages = currentArticleImageUrls(inspection.article);
      preparedImages = await this.images.prepare(
        imageInputs(input),
        reusableLearnImagesFromAuditMetadata(reuseMetadata)
          .filter((image) => currentlyReferencedImages.has(image.url)),
      );
      const document = canonicalDocument(desiredDocument(input, preparedImages.images));
      const documentFingerprint = articleDocumentFingerprint(document);
      const preparedImageList = preparedImages.images;
      persistenceStarted = true;
      const applied = await this.withTransientRetry("persistence", requestIdHash, () => this.articles.applyPublishedDocument({
        document,
        actorId: actor.id,
        requestIdHash,
        intentFingerprint,
        documentFingerprint,
        auditMetadata: {
          schemaVersion: 1,
          images: preparedImageList,
        },
      }));
      persisted = true;
      articleId = applied.article.id;
      if (!applied.article.publishedAt || applied.article.status !== "PUBLISHED") {
        throw new LearnApplyError("Article persistence returned an invalid publication state.", "PERSISTENCE_STATE_INVALID", 500);
      }
      if (preparedImages.recoveryObjects.length && this.images.ensureStored) {
        await this.images.ensureStored(preparedImages.recoveryObjects);
      }

      let cacheFailure = false;
      try {
        this.revalidate(applied.article.category, applied.article.slug);
      } catch (error) {
        cacheFailure = true;
        this.logger({
          event: "learn_apply_cache_invalidation_failed",
          articleId: applied.article.id,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }

      let verification: LearnPublicVerification;
      try {
        verification = await this.verifier.verify(applied.article, document);
      } catch (error) {
        this.logger({
          event: "learn_apply_public_verification_failed",
          articleId: applied.article.id,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
        verification = verificationFailure(
          `${PUBLIC_CANONICAL_ORIGIN}${publicLearnArticlePath(applied.article.locale, applied.article.category, applied.article.slug)}`,
          "PUBLIC_VERIFICATION_FAILED",
        );
      }
      if (cacheFailure) verification = { ...verification, verified: false, failureCode: "CACHE_INVALIDATION_FAILED" };
      const result: LearnApplyResult = {
        result: verification.verified ? "LIVE" : "PERSISTED_NOT_VERIFIED",
        operation: applied.operation,
        persistence: "COMMITTED",
        articleId: applied.article.id,
        status: "PUBLISHED",
        url: verification.publicUrl,
        publishedAt: applied.article.publishedAt,
        updatedAt: applied.article.updatedAt,
        verified: verification.verified,
        images: preparedImages.images.map((image) => ({
          slot: image.slot,
          url: image.url,
          checksum: image.checksum,
          mimeType: image.mimeType,
          width: image.width,
          height: image.height,
          sizeBytes: image.sizeBytes,
        })),
        verification: {
          checks: verification.checks,
          attempts: verification.attempts,
          failureCode: verification.failureCode,
        },
      };
      this.logger({
        event: "learn_apply_finished",
        requestIdHash,
        articleId: applied.article.id,
        operation: applied.operation,
        result: result.result,
        verified: result.verified,
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      });
      return result;
    } catch (error) {
      if (preparedImages && !persisted) await this.images.cleanupCreated(preparedImages.createdObjects);
      // A non-service failure during the Article transaction may hide a commit the
      // caller never saw, so it is reported as UNKNOWN: retry the same requestId.
      const original = error instanceof ServiceError
        ? error
        : new LearnApplyError(
            "learn_apply failed before publication completed.",
            "LEARN_APPLY_FAILED",
            500,
            persistenceStarted ? { persistence: "UNKNOWN" } : undefined,
          );
      const safeError = persisted
        ? new LearnApplyError(
            original.message,
            original.code === "LEARN_APPLY_FAILED" ? "LEARN_APPLY_POST_COMMIT_FAILED" : original.code,
            original.statusCode,
            {
              ...(metadataRecord(original.details) ?? {}),
              persistence: "COMMITTED",
              articleId,
            },
          )
        : original;
      this.logger({
        event: "learn_apply_failed",
        requestIdHash,
        articleId,
        persisted,
        persistenceStarted,
        errorCode: safeError.code,
        causeName: error instanceof Error ? error.name.slice(0, 80) : typeof error,
        causeCode: errorCode(error),
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      });
      throw safeError;
    }
  }
}

export const learnApplyService = new LearnApplyService();

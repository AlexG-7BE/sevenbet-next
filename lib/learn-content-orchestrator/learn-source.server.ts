import "server-only";

import { EditorialStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { publicLearnArticlePath } from "@/lib/learn-apply/public-verification";
import { rfc3339UtcTimestampSchema } from "@/lib/learn-apply/contract";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

/**
 * Read-only source text for localization (Founder, 1 Oct 2026,
 * LEARN-SERVER-SWITCH-2026-10-01): the server writes English guides and the
 * Founder's Claude Code localizes them the same day. It returns exactly what a
 * published Article already shows the public, and nothing for drafts.
 */
export const LEARN_SOURCE_MAX_BODY_BYTES = 400_000;

export const learnSourceInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200).describe("The slug of a published Learn Article."),
}).strict();

export const learnSourceResultSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(200),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
  category: z.string().min(1).max(80),
  title: z.string().min(1).max(500),
  excerpt: z.string().max(2_000),
  tags: z.array(z.string().max(200)).max(50),
  readingTime: z.string().max(40).nullable(),
  difficulty: z.string().max(40).nullable(),
  seoTitle: z.string().max(300).nullable(),
  seoDescription: z.string().max(1_000).nullable(),
  heroImageAlt: z.string().max(1_000).nullable(),
  bodyBlocks: z.array(z.record(z.string(), z.unknown())).max(300),
  publishedAt: rfc3339UtcTimestampSchema,
  updatedAt: rfc3339UtcTimestampSchema,
  url: z.string().max(2_000).refine((value) => value.startsWith(`${PUBLIC_CANONICAL_ORIGIN}/`), "Expected a canonical public B4GAMBLE URL."),
}).strict();

export const LEARN_SOURCE_ERROR_CODES = ["INVALID_INPUT", "ARTICLE_NOT_FOUND", "SOURCE_TOO_LARGE", "SOURCE_UNAVAILABLE"] as const;

export const learnSourceErrorResultSchema = z.object({
  result: z.literal("ERROR"),
  error: z.object({
    code: z.enum(LEARN_SOURCE_ERROR_CODES),
    message: z.string().min(1).max(300),
    retryable: z.boolean(),
  }).strict(),
}).strict();

export type LearnSourceResult = z.infer<typeof learnSourceResultSchema>;

export class LearnSourceError extends Error {
  constructor(
    readonly code: (typeof LEARN_SOURCE_ERROR_CODES)[number],
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "LearnSourceError";
  }
}

type PublishedArticleReader = {
  article: {
    findFirst(args: unknown): Promise<{
      id: string;
      slug: string;
      locale: string;
      category: string;
      title: string;
      excerpt: string;
      tags: string[];
      readingTime: string | null;
      difficulty: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      heroImageAlt: string | null;
      bodyBlocks: unknown;
      publishedAt: Date | null;
      updatedAt: Date;
    } | null>;
  };
};

export type LearnSourceReader = (input: unknown) => Promise<LearnSourceResult>;

export async function readLearnSource(input: unknown, database: PublishedArticleReader = prisma): Promise<LearnSourceResult> {
  const parsed = learnSourceInputSchema.safeParse(input);
  if (!parsed.success) throw new LearnSourceError("INVALID_INPUT", "learn_source accepts exactly { slug } with a lowercase URL slug.");

  let article: Awaited<ReturnType<PublishedArticleReader["article"]["findFirst"]>>;
  try {
    article = await database.article.findFirst({
      where: { slug: parsed.data.slug, status: EditorialStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        locale: true,
        category: true,
        title: true,
        excerpt: true,
        tags: true,
        readingTime: true,
        difficulty: true,
        seoTitle: true,
        seoDescription: true,
        heroImageAlt: true,
        bodyBlocks: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  } catch {
    throw new LearnSourceError("SOURCE_UNAVAILABLE", "The Learn source could not be read. Retry later.", true);
  }
  if (!article) throw new LearnSourceError("ARTICLE_NOT_FOUND", "No published Learn Article has this slug.");
  if (Buffer.byteLength(JSON.stringify(article.bodyBlocks ?? [])) > LEARN_SOURCE_MAX_BODY_BYTES) {
    throw new LearnSourceError("SOURCE_TOO_LARGE", "The Article body exceeds the bounded learn_source size.");
  }

  // Fields are copied one by one so authorship, review and lifecycle data never leave the server.
  return learnSourceResultSchema.parse({
    id: article.id,
    slug: article.slug,
    locale: article.locale,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    tags: article.tags,
    readingTime: article.readingTime,
    difficulty: article.difficulty,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    heroImageAlt: article.heroImageAlt,
    bodyBlocks: Array.isArray(article.bodyBlocks) ? article.bodyBlocks : [],
    publishedAt: (article.publishedAt ?? article.updatedAt).toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    url: `${PUBLIC_CANONICAL_ORIGIN}${publicLearnArticlePath(article.locale, article.category, article.slug)}`,
  });
}

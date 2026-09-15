import type { EditorialStatus } from "@prisma/client";

export const ARTICLE_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "list",
  "quote",
  "callout",
  "image",
  "link",
] as const;

export type ArticleBlockType = (typeof ARTICLE_BLOCK_TYPES)[number];

export type ArticleBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "list"; style: "bullet" | "numbered"; items: string[] }
  | { id: string; type: "quote"; text: string; citation?: string }
  | { id: string; type: "callout"; title?: string; text: string }
  | { id: string; type: "image"; url: string; alt: string; caption?: string }
  | { id: string; type: "link"; label: string; url: string; description?: string };

export type ArticleDocumentInput = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  bodyBlocks: ArticleBlock[];
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  readingTime: string | null;
  difficulty: string | null;
};

export type AdminArticle = ArticleDocumentInput & {
  id: string;
  status: EditorialStatus;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type PublicArticle = AdminArticle & {
  status: "PUBLISHED";
  publishedAt: string;
};

export type ArticleValidationIssue = {
  path: string;
  message: string;
};

export type ArticleRevisionSummary = {
  id: string;
  revisionNumber: number;
  summary: string;
  createdBy: string;
  createdAt: string;
};

export function articlePath(article: Pick<ArticleDocumentInput, "category" | "slug">) {
  return `/learn/${article.category}/${article.slug}`;
}

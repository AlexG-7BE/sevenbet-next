import assert from "node:assert/strict";
import test from "node:test";

import type { PublicArticle } from "../lib/articles/article-types";
import { publicationIssues, validateArticleDocument } from "../lib/articles/article-validation";
import { relatedReadingListInput, relatedReadingSelection } from "../lib/articles/related-reading";

function document(overrides: Record<string, unknown> = {}) {
  return {
    slug: "safe-guide",
    locale: "en-GB",
    title: "A safe guide",
    excerpt: "A complete educational summary for the public Article page.",
    category: "casino-basics",
    tags: ["Safety", "Safety"],
    readingTime: "5 min read",
    bodyBlocks: [{ id: "intro", type: "paragraph", text: "A visible paragraph." }],
    ...overrides,
  };
}

test("Article validation accepts the bounded structured block schema", () => {
  const parsed = validateArticleDocument(document({
    bodyBlocks: [
      { id: "intro", type: "paragraph", text: "Plain content." },
      { id: "heading", type: "heading", level: 2, text: "Read this" },
      { id: "list", type: "list", style: "numbered", items: ["One", "Two"] },
      { id: "quote", type: "quote", text: "Quoted text", citation: "Source" },
      { id: "notice", type: "callout", title: "Note", text: "Current terms remain authoritative." },
      { id: "image", type: "image", url: "/editorial/guide.webp", alt: "An explanatory diagram" },
      { id: "link", type: "link", label: "Methodology", url: "/methodology" },
    ],
  }));
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.document.tags.length, 1);
  assert.deepEqual(publicationIssues(parsed.document), []);
});

test("Article validation rejects executable, credentialed and unsafe URL payloads", () => {
  const parsed = validateArticleDocument(document({
    heroImageUrl: "javascript:alert(1)",
    canonicalUrl: "https://example.com/imposter",
    bodyBlocks: [
      { id: "html", type: "html", html: "<script>alert(1)</script>" },
      { id: "image", type: "image", url: "data:text/html,<script>alert(1)</script>", alt: "unsafe" },
      { id: "link", type: "link", label: "Bad", url: "https://user:password@example.com" },
    ],
  }));
  assert.ok(parsed.issues.some((issue) => issue.message === "Unsupported block type."));
  assert.ok(parsed.issues.some((issue) => issue.path === "heroImageUrl"));
  assert.ok(parsed.issues.some((issue) => issue.path === "canonicalUrl"));
  assert.ok(parsed.issues.filter((issue) => issue.path.endsWith(".url")).length >= 2);
});

test("locale and lifecycle publication requirements fail closed", () => {
  const parsed = validateArticleDocument(document({ locale: "fr-CA", excerpt: "", bodyBlocks: [], readingTime: "tomorrow" }));
  assert.ok(parsed.issues.some((issue) => issue.path === "locale"));
  assert.ok(publicationIssues(parsed.document).some((issue) => issue.path === "excerpt"));
  assert.ok(publicationIssues(parsed.document).some((issue) => issue.path === "bodyBlocks"));
  assert.ok(publicationIssues(parsed.document).some((issue) => issue.path === "readingTime"));
});

function publishedArticle(overrides: Partial<PublicArticle> = {}): PublicArticle {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "safe-guide",
    locale: "en-GB",
    title: "A safe guide",
    excerpt: "A complete educational summary for the public Article page.",
    category: "responsible-gambling",
    tags: ["Responsible Gambling"],
    bodyBlocks: [{ id: "intro", type: "paragraph", text: "A visible paragraph." }],
    heroImageUrl: null,
    heroImageAlt: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    readingTime: "5 min read",
    difficulty: "Beginner",
    status: "PUBLISHED",
    publishedAt: "2026-09-17T00:00:00.000Z",
    lastReviewedAt: "2026-09-17T00:00:00.000Z",
    archivedAt: null,
    createdAt: "2026-09-17T00:00:00.000Z",
    updatedAt: "2026-09-17T00:00:00.000Z",
    createdBy: "00000000-0000-4000-8000-000000000002",
    updatedBy: "00000000-0000-4000-8000-000000000002",
    ...overrides,
  };
}

test("protected related reading constrains the query and rendered selection without commercial fallback", () => {
  const protectedArticle = publishedArticle();
  assert.deepEqual(relatedReadingListInput(protectedArticle), {
    take: 3,
    excludeId: protectedArticle.id,
    category: "responsible-gambling",
  });

  const protectedCandidate = publishedArticle({
    id: "00000000-0000-4000-8000-000000000003",
    slug: "another-safe-guide",
  });
  const commercialCandidate = publishedArticle({
    id: "00000000-0000-4000-8000-000000000004",
    slug: "bonus-guide",
    category: "casino-bonuses",
  });
  assert.deepEqual(
    relatedReadingSelection(protectedArticle, [protectedCandidate, commercialCandidate]),
    [protectedCandidate],
  );
  assert.deepEqual(relatedReadingSelection(protectedArticle, [commercialCandidate]), []);

  const generalArticle = publishedArticle({ category: "casino-safety" });
  assert.deepEqual(relatedReadingListInput(generalArticle), {
    take: 3,
    excludeId: generalArticle.id,
  });
  assert.deepEqual(
    relatedReadingSelection(generalArticle, [protectedCandidate, commercialCandidate]),
    [protectedCandidate, commercialCandidate],
  );
});

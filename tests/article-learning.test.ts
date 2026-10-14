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

test("related reading links each guide to its neighbours, same-tag guides first, not the three newest", () => {
  const guides = Array.from({ length: 8 }, (_, index) => publishedArticle({
    id: `00000000-0000-4000-8000-00000000010${index}`,
    slug: `guide-${index}`,
    tags: index === 1 || index === 6 ? ["Spelpaus"] : ["Responsible Gambling"],
  }));
  const ids = (articles: PublicArticle[]) => articles.map((article) => article.slug);
  // Newest first: guide-4 sits between guide-3 and guide-5.
  assert.deepEqual(ids(relatedReadingSelection(guides[4], guides)), ["guide-5", "guide-3", "guide-6"]);
  // A pause guide links to the other pause guide first, then to its own neighbours.
  assert.deepEqual(ids(relatedReadingSelection(guides[1], guides)), ["guide-6", "guide-2", "guide-0"]);
  // The oldest guide wraps round to the newest one.
  assert.deepEqual(ids(relatedReadingSelection(guides[7], guides)), ["guide-0", "guide-5", "guide-6"]);
  // Every guide is linked from at least two others.
  const linksIn = new Map<string, number>();
  for (const guide of guides) {
    for (const related of relatedReadingSelection(guide, guides)) linksIn.set(related.slug, (linksIn.get(related.slug) ?? 0) + 1);
  }
  assert.ok(guides.every((guide) => (linksIn.get(guide.slug) ?? 0) >= 2), JSON.stringify([...linksIn]));
});

test("protected related reading constrains the query and rendered selection without commercial fallback", () => {
  const protectedArticle = publishedArticle();
  assert.deepEqual(relatedReadingListInput(protectedArticle), {
    take: 100,
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
    take: 100,
  });
  assert.deepEqual(
    relatedReadingSelection(generalArticle, [protectedCandidate, commercialCandidate]),
    [protectedCandidate, commercialCandidate],
  );
});

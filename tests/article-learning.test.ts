import assert from "node:assert/strict";
import test from "node:test";

import { publicationIssues, validateArticleDocument } from "../lib/articles/article-validation";

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

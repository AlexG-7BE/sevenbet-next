import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicArticle } from "../lib/articles/article-types";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformLearnHandoff } from "../lib/final-handoff/transforms";
import { learningCategories } from "../lib/learning-center";

const read = (path: string) => readFileSync(path, "utf8");

const fixture: PublicArticle = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "clear-guide",
  locale: "en-GB",
  title: "A clear published guide",
  excerpt: "A sufficiently complete excerpt for a published Learning Center guide.",
  category: "casino-basics",
  tags: ["Security"],
  status: "PUBLISHED",
  bodyBlocks: [{ id: "intro", type: "paragraph", text: "Visible body." }],
  heroImageUrl: null,
  heroImageAlt: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  readingTime: "4 min read",
  difficulty: "Beginner",
  publishedAt: "2026-09-15T00:00:00.000Z",
  lastReviewedAt: "2026-09-15T00:00:00.000Z",
  archivedAt: null,
  createdAt: "2026-09-15T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000002",
  updatedBy: "00000000-0000-4000-8000-000000000002",
};

test("Prisma Article is the only production Article content authority", () => {
  const schema = read("prisma/schema.prisma");
  const taxonomy = read("lib/learning-center.ts");
  const service = read("lib/services/article.service.ts");
  const legacySeed = read("lib/cms/seed.ts");
  const genericApi = read("app/api/admin/[entity]/route.ts");
  assert.match(schema, /model Article \{/);
  for (const field of ["locale", "bodyBlocks", "heroImageUrl", "heroImageAlt", "publishedAt", "lastReviewedAt", "archivedAt"]) assert.match(schema, new RegExp(`\\b${field}\\b`));
  assert.match(service, /prisma\.article/);
  assert.match(service, /status: EditorialStatus\.PUBLISHED/);
  assert.match(service, /entityType: ARTICLE_ENTITY/);
  assert.doesNotMatch(taxonomy, /learningArticleManifest|articleTemplate|publishedLearningArticles|learningArticles\s*=/);
  assert.doesNotMatch(legacySeed, /entity:\s*"article"|cmsArticles/);
  assert.match(genericApi, /entityParam === "article"[\s\S]*canonical PostgreSQL Article API/);
  assert.equal(learningCategories.length, 13);
});

test("the hub projects only supplied PostgreSQL records and has a truthful empty state", () => {
  const empty = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, []);
  assert.match(empty, /data-learn-empty=""/);
  assert.equal((empty.match(/data-learn-category=/g) ?? []).length, 0);
  const populated = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => `/en${href}`, [fixture]);
  assert.match(populated, /href="\/en\/learn\/casino-basics\/clear-guide"/);
  assert.match(populated, />A clear published guide</);
  assert.doesNotMatch(populated, /data-learn-empty=""/);
});

test("public routes are database, locale and publication-state owned", () => {
  const hub = read("app/(public)/learn/page.tsx");
  const category = read("app/(public)/learn/[category]/page.tsx");
  const article = read("app/(public)/learn/[category]/[slug]/page.tsx");
  const publicApi = read("app/api/public/[resource]/route.ts");
  assert.match(hub, /articleService\.listPublished\(articleLocale/);
  assert.match(category, /articleService\.listPublished\(locale, \{ category, take: 1 \}\)/);
  assert.match(article, /articleService\s*\.\s*getPublished/);
  assert.match(article, /languageRouteByLocale\(presentation\.locale\)\.defaultLocale/);
  assert.match(publicApi, /articleService\.listPublished\(locale/);
  assert.doesNotMatch(`${hub}${category}${article}${publicApi}`, /learningArticles|localizedLearningArticles/);
});

test("Article rendering is safe, structured and keeps protected Help non-commercial", () => {
  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  const validation = read("lib/articles/article-validation.ts");
  assert.match(view, /block\.type === "paragraph"/);
  assert.match(view, /block\.type === "image"/);
  assert.doesNotMatch(view, /dangerouslySetInnerHTML|sanitizeHtml|iframe|<script/);
  assert.match(validation, /Unsupported block type/);
  assert.match(validation, /safePublicUrl/);
  assert.match(view, /article\.category === "responsible-gambling"/);
  assert.match(view, /hrefFor\("\/help"\)/);
  assert.doesNotMatch(view, /href="\/(?:r|go)\//);
});

test("Admin exposes explicit draft, review, publish, archive, preview and revision workflows", () => {
  const editor = read("components/admin/ArticleEditor.tsx");
  const action = read("app/api/admin/articles/[articleId]/action/route.ts");
  const revisions = read("app/api/admin/articles/[articleId]/revisions/route.ts");
  for (const label of ["Request review", "Return to draft", "Approve", "Publish", "Start new draft", "Archive", "Restore to draft"]) assert.ok(editor.includes(label), label);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /expectedUpdatedAt/);
  assert.match(action, /article\.publish/);
  assert.match(revisions, /restoreRevision/);
  assert.match(editor, /Raw HTML, scripts, iframes and embedded code are not accepted/);
});

test("metadata, JSON-LD and sitemap use visible canonical Article fields", () => {
  const route = read("app/(public)/learn/[category]/[slug]/page.tsx");
  const sitemap = read("app/sitemap.ts");
  assert.match(route, /"@type": "Article"/);
  assert.match(route, /datePublished: article\.publishedAt/);
  assert.match(route, /dateModified: article\.updatedAt/);
  assert.doesNotMatch(route, /FAQPage|structuredData/);
  assert.match(sitemap, /articleService\.listPublished/);
  assert.match(sitemap, /articlePath\(article\)/);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  const genericApi = read("app/api/admin/[entity]/route.ts");
  assert.match(schema, /model Article \{/);
  for (const field of ["locale", "bodyBlocks", "heroImageUrl", "heroImageAlt", "publishedAt", "lastReviewedAt", "archivedAt"]) assert.match(schema, new RegExp(`\\b${field}\\b`));
  assert.match(service, /prisma\.article/);
  assert.match(service, /status: EditorialStatus\.PUBLISHED/);
  assert.match(service, /entityType: ARTICLE_ENTITY/);
  assert.doesNotMatch(taxonomy, /learningArticleManifest|articleTemplate|publishedLearningArticles|learningArticles\s*=/);
  assert.equal(existsSync("lib/cms/seed.ts"), false);
  assert.equal(existsSync("lib/cms/repository.ts"), false);
  assert.match(genericApi, /legacy generic CMS API is retired/i);
  assert.doesNotMatch(genericApi, /createCmsRecord|listCmsRecords/);
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
  assert.match(article, /getPublished\(category, slug, languageRouteByLocale\(locale\)\.defaultLocale\)/);
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
  assert.match(route, /new URL\(article\.canonicalUrl, siteUrl\)\.href/);
  assert.doesNotMatch(route, /FAQPage|structuredData/);
  assert.match(sitemap, /articleService\.listPublished/);
  assert.match(sitemap, /articlePath\(article\)/);
});

test("Founder next steps: a Programme card after six guides, a mid-guide Programme block and gated offer bridges", async () => {
  const many = Array.from({ length: 8 }, (_, index) => ({ ...fixture, id: `00000000-0000-4000-8000-00000000010${index}`, slug: `guide-${index}`, title: `Guide ${index}` }));
  const hub = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, many);
  assert.equal((hub.match(/data-learn-programme-bridge="inline"/g) ?? []).length, 1);
  const guideSlugs = [...hub.matchAll(/href="\/learn\/casino-basics\/(guide-\d)"|data-learn-programme-bridge="inline"/g)].map((match) => match[1] ?? "bridge");
  // The four "Start here" cards come first; in the full list the card follows the sixth guide.
  assert.deepEqual(guideSlugs.slice(4), ["guide-0", "guide-1", "guide-2", "guide-3", "guide-4", "guide-5", "bridge", "guide-6", "guide-7"]);
  assert.match(hub, /data-learn-programme-bridge="inline"[\s\S]*?href="\/program\?entry=start"[^>]*>Start Programme<\/a>/);
  const german = transformLearnHandoff(generatedPages.learn.html, "de-DE", (href) => href, many);
  assert.match(german, /data-learn-programme-bridge="inline"[\s\S]*?Kostenlos nutzbar/);
  const few = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, many.slice(0, 6));
  assert.doesNotMatch(few, /data-learn-programme-bridge="inline"/);
  const interactions = read("components/final-handoff/HandoffInteractions.tsx");
  assert.match(interactions, /learnProgrammeBridge\.hidden = filtered/);

  const { midArticleBridgeIndex } = await import("../lib/articles/article-bridges");
  const heading = (id: string) => ({ id, type: "heading" as const, level: 2 as const, text: id });
  const paragraph = (id: string) => ({ id, type: "paragraph" as const, text: id });
  assert.equal(midArticleBridgeIndex([paragraph("a"), heading("b"), paragraph("c"), paragraph("d"), heading("e"), paragraph("f")]), 4);
  assert.equal(midArticleBridgeIndex([paragraph("a"), paragraph("b")]), -1);

  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  const article = read("app/(public)/learn/[category]/[slug]/page.tsx");
  assert.match(view, /const programmeBridgeAt = protectedCategory \|\| offerBridge \? -1 : midArticleBridgeIndex\(article\.bodyBlocks\);/);
  assert.match(view, /\{offerBridge && !protectedCategory \? <OfferBridge bridge=\{offerBridge\} \/> : null\}/);
  assert.match(article, /if \(article\.category !== "casino-bonuses" \|\| !offersMayBePresented\(presentation\.marketCountryCode\)\) return null;/);
  assert.match(article, /disclosure: learning\.ui\.commercialDisclosure/);
});

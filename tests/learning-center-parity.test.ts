import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getArticlePath,
  getArticlesByCategory,
  learningArticles,
  learningCategories,
  learningPaths,
  learningTags,
} from "../lib/learning-center";

const hubRoute = readFileSync("app/(public)/learn/page.tsx", "utf8");
const handoffPages = JSON.parse(readFileSync("lib/final-handoff/generated-pages.json", "utf8")) as Record<string, { html: string }>;
const hubView = readFileSync("app/(public)/learn/LearningCenterPage.tsx", "utf8");
const searchView = readFileSync("components/learning/LearningSearchAndFilter.tsx", "utf8");
const handoffTransforms = readFileSync("lib/final-handoff/transforms.ts", "utf8");
const handoffInteractions = readFileSync("components/final-handoff/HandoffInteractions.tsx", "utf8");
const categoryRoute = readFileSync("app/(public)/learn/[category]/page.tsx", "utf8");
const categoryView = readFileSync("app/(public)/learn/[category]/LearningCategoryView.tsx", "utf8");
const articleRoute = readFileSync("app/(public)/learn/[category]/[slug]/page.tsx", "utf8");
const articleView = readFileSync("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx", "utf8");
const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");

test("the Learning route family is server owned and uses the unchanged Public Shell", () => {
  for (const source of [hubRoute, hubView, categoryRoute, categoryView, articleRoute, articleView]) {
    assert.doesNotMatch(source, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  }
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(`${hubView}${categoryView}${articleView}`, /<footer|PublicHeader|PublicFooter/);
  assert.equal((hubView.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((categoryView.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((articleView.match(/<h1\b/g) ?? []).length, 1);
  assert.match(hubView, /data-figma-authority="835:6356"/);
  assert.match(categoryView, /data-figma-authority="632:4360"/);
  assert.match(articleView, /data-figma-authority="633:4341"/);
});

test("hub renders the locked handoff catalogue while current taxonomy remains authoritative", () => {
  assert.equal(learningCategories.length, 13);
  assert.equal(learningArticles.length, 13);
  assert.equal(learningPaths.length, 6);
  assert.match(hubRoute, /<HandoffPage name="learn" transform=\{transformLearnHandoff\} \/>/);
  for (const title of ["Wagering requirements, explained with real numbers", "How casino payouts really work — and why they stall", "How to judge a casino in ten minutes", "Session limits that actually hold"]) {
    assert.ok(handoffPages.learn.html.includes(title), title);
  }
  assert.match(searchView, /article\.title, article\.summary, categoryTitle, \.\.\.article\.tags/);
  assert.doesNotMatch(searchView, /plannedTopics|500\+|future article/);

  const currentTags = new Set(learningArticles.flatMap((article) => article.tags));
  for (const tag of currentTags) assert.ok(learningTags.includes(tag));
  for (const article of learningArticles) assert.equal(getArticlePath(article), `/learn/${article.categorySlug}/${article.slug}`);
});

test("category pages publish current article records and fail closed when empty", () => {
  for (const category of learningCategories) {
    const articles = getArticlesByCategory(category.slug);
    assert.ok(articles.length > 0, `${category.slug} should currently resolve a published article`);
    assert.ok(articles.every((article) => article.categorySlug === category.slug));
  }
  assert.match(categoryView, /articles\.length > 0/);
  assert.match(categoryView, /NO PUBLISHED GUIDES YET/);
  assert.doesNotMatch(categoryView, /plannedTopics|Browse Casinos|Browse Bonuses|Claim|Play now/iu);
  assert.match(categoryRoute, /if \(!getLearningCategory\(category\)\) notFound\(\)/);
  assert.match(categoryRoute, /permanentRedirect\(`\/learn\?category=/);
});

test("article template is truthful about missing evidence and preserves the protected boundary", () => {
  assert.match(articleView, /SOURCE STATUS: UNAVAILABLE/);
  assert.match(articleView, /does not provide source links, a source owner, a review-due date or a compliance-review status/);
  assert.doesNotMatch(articleView, /SOURCE STATUS: VERIFIED|Compliance reviewed|Review due:/i);
  assert.match(articleView, /article\.categorySlug !== "responsible-gambling"/);
  assert.match(articleView, /href="\/casinos"/);
  assert.doesNotMatch(articleView, /href="\/compare"/);
  assert.match(articleView, /href="\/responsible-gambling"/);
  assert.match(articleView, /href="\/help"/);
  assert.doesNotMatch(articleView, /href="\/(?:r|go)\//);
  assert.match(articleRoute, /if \(!article\) notFound\(\)/);
});

test("metadata and structured data remain aligned with visible content", () => {
  assert.match(hubRoute, /canonical: absoluteUrl\("\/learn"\)/);
  assert.match(categoryRoute, /permanentRedirect\(`\/learn\?category=/);
  assert.doesNotMatch(categoryRoute, /BreadcrumbList|FAQPage/);
  assert.match(articleRoute, /BreadcrumbList/);
  assert.match(articleRoute, /"@type": "Article"/);
  assert.match(articleRoute, /FAQPage/);
  assert.match(articleView, /article\.faq\.map/);
  assert.match(articleView, /author\.name/);
  assert.match(articleView, /editor\.name/);
});

test("the live handoff has one accessible search beside All guides with dynamic category recovery", () => {
  assert.match(handoffTransforms, /replace\(\/<input placeholder="Search guides[^\n]+, ""\)/);
  assert.match(handoffTransforms, /data-learn-discovery-search/);
  assert.match(handoffTransforms, /type="search" aria-label="Search guides"/);
  assert.match(handoffInteractions, /dataset\.learnResultsStatus/);
  assert.match(handoffInteractions, /aria-live/);
  assert.match(handoffInteractions, /data-learn-category/);
  assert.match(handoffInteractions, /requestedCategory/);
});

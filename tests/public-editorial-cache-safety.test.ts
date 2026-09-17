import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isPublishedArticleLocale, isSafeArticleRoutePart } from "../lib/articles/article-validation";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("public editorial caches are short-lived, tagged and identity-free", () => {
  const policy = source("lib/public-editorial-cache.ts");
  assert.match(policy, /PUBLIC_EDITORIAL_CACHE_REVALIDATE_SECONDS = 60/);
  assert.match(policy, /tags,/);
  assert.doesNotMatch(policy, /from ["'](?:next\/headers|@\/lib\/(?:auth|programme))|cookies\(|headers\(/i);

  const casino = source("lib/repositories/public-casino.repository.ts");
  const offers = source("lib/repositories/public-offer.repository.ts");
  const articles = source("lib/services/article.service.ts");
  assert.match(casino, /cachedPublished\(countryCode\?\.trim\(\)\.toUpperCase\(\) \|\| null\)/);
  assert.match(casino, /cachedPublishedBySlug\(slug, countryCode\?\.trim\(\)\.toUpperCase\(\) \|\| null\)/);
  assert.match(offers, /cachedEditorialOffers\([\s\S]*options\.countryCode[\s\S]*options\.presentationLanguage/);
  assert.match(articles, /const category = input\.category\?\.trim\(\) \|\| null/);
  assert.match(articles, /if \(category && !isSafeArticleRoutePart\(category\)\) return \[\]/);
  assert.match(articles, /cachedPublishedArticles\(\s*locale,\s*category,/);
  assert.match(articles, /cachedPublishedArticle\(category, slug, locale\)/);
});

test("public Article cache keys accept only bounded published route identities", () => {
  assert.equal(isSafeArticleRoutePart("casino-basics"), true);
  assert.equal(isSafeArticleRoutePart("a".repeat(121)), false);
  assert.equal(isSafeArticleRoutePart("../casino-basics"), false);
  assert.equal(isPublishedArticleLocale("en-GB"), true);
  assert.equal(isPublishedArticleLocale("invented-locale"), false);
});

test("reusable editorial projections cannot authorize commercial actions", () => {
  const casinoService = source("lib/services/public-casino.service.ts");
  const offerRepository = source("lib/repositories/public-offer.repository.ts");
  const actionResolver = source("lib/commercial/public-commercial-action-resolver.ts");

  assert.match(casinoService, /return \{ \.\.\.projected, action: decisions\.get\(projected\.id\)\?\.action \?\? null \}/);
  assert.match(casinoService, /return \{ \.\.\.projected, action: null \}/);
  assert.doesNotMatch(offerRepository, /actionAuthority|resolveMany|trackingUrl|destinationUrl/);
  assert.doesNotMatch(actionResolver, /unstable_cache|publicEditorialCache|revalidateTag/);
  assert.match(actionResolver, /private readonly resolveRequestScoped = cache/);
});

test("request-specific primary and Casino-detail links disable client-router prefetch", () => {
  const primary = source("components/public-shell/PublicNavigationClient.tsx");
  const trackedReview = source("components/analytics/TrackedReviewLink.tsx");
  const casinoCard = source("components/casino-discovery/CasinoDiscoveryCard.tsx");
  assert.match(primary, /<Link[\s\S]*?data-navigation-href=\{baseHref\}[\s\S]*?prefetch=\{false\}/);
  assert.match(trackedReview, /<Link[\s\S]*?prefetch=\{false\}/);
  assert.match(casinoCard, /reviewHref[\s\S]*?<Link[\s\S]*?prefetch=\{false\}/);
});

test("publication and archive paths invalidate the bounded editorial caches", () => {
  const casinoInvalidation = source("lib/public-casino/cache.ts");
  const articleInvalidation = source("lib/articles/cache.ts");
  const articleAction = source("app/api/admin/articles/[articleId]/action/route.ts");
  const reviewAction = source("app/api/admin/editorial-reviews/[casinoId]/action/route.ts");
  const casinoAction = source("app/api/admin/casinos/[casinoId]/action/route.ts");

  assert.match(casinoInvalidation, /revalidateTag\(PUBLIC_CASINO_EDITORIAL_CACHE_TAG\)/);
  assert.match(articleInvalidation, /revalidateTag\(PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG\)/);
  assert.match(articleAction, /\["publish", "revise", "archive"\]\.includes\(body\.action\)/);
  assert.match(articleAction, /revalidatePublicArticles\(article\.category, article\.slug\)/);
  assert.ok((reviewAction.match(/revalidatePublicCasino\(\)/g) ?? []).length >= 2);
  assert.match(
    casinoAction,
    /if \(body\.action === "request-changes"\) \{[\s\S]*?transitionWorkflow\([\s\S]*?EditorialStatus\.DRAFT[\s\S]*?revalidatePublicCasino\(casino\.slug\)/,
  );
});

test("the exact commercial route stays dynamic and uses one joined runtime projection", () => {
  const runtime = source("lib/market-activation/runtime.ts");
  assert.match(runtime, /SELECT to_jsonb\(ma\) AS activation/);
  assert.match(runtime, /INNER JOIN "Casino" c/);
  assert.match(runtime, /LEFT JOIN "AffiliateOffer" ao/);
  assert.match(runtime, /LEFT JOIN "AffiliateTrackingLink" atl/);
  assert.match(runtime, /LEFT JOIN "AffiliateRedirectSlug" ars/);
  assert.match(runtime, /safeActivationDestination\(record\.primaryTrackingLink\.trackingUrl\)/);
  assert.match(runtime, /safeActivationDestination\(record\.primaryTrackingLink\.destinationUrl\)/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isPublishedArticleLocale, isSafeArticleRoutePart } from "../lib/articles/article-validation";
import { runPublicDatabaseRead } from "../lib/db/public-database-read-coordinator";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("public editorial caches are short-lived, tagged and identity-free", () => {
  const policy = source("lib/public-editorial-cache.ts");
  const coordinator = source("lib/db/public-database-read-coordinator.ts");
  assert.match(policy, /PUBLIC_EDITORIAL_CACHE_REVALIDATE_SECONDS = 60/);
  assert.match(policy, /tags,/);
  assert.match(coordinator, /connection_limit/);
  assert.doesNotMatch(policy, /inFlight|invocationKey|runPublicDatabaseRead/);
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

test("one-connection leaf database reads serialize and release after rejection", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://release-user:redacted@127.0.0.1:54329/sevenbet_ci?connection_limit=1";
  type PendingFill = {
    key: string;
    reject: (error: Error) => void;
    resolve: (value: string) => void;
  };
  const fills: PendingFill[] = [];
  let activeFills = 0;
  let maximumActiveFills = 0;
  const read = (key: string) => runPublicDatabaseRead(() => new Promise<string>((resolve, reject) => {
      activeFills += 1;
      maximumActiveFills = Math.max(maximumActiveFills, activeFills);
      fills.push({
        key,
        reject: (error) => { activeFills -= 1; reject(error); },
        resolve: (value) => { activeFills -= 1; resolve(value); },
      });
    }));

  try {
    const kzFirst = read("KZ");
    const kzSecond = read("KZ");
    const gb = read("GB");
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(fills.map(({ key }) => key), ["KZ"]);
    fills[0].resolve("KZ first ready");
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(fills.map(({ key }) => key), ["KZ", "KZ"]);
    fills[1].resolve("KZ second ready");
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(fills.map(({ key }) => key), ["KZ", "KZ", "GB"]);
    fills[2].resolve("GB ready");
    assert.deepEqual(await Promise.all([kzFirst, kzSecond, gb]), ["KZ first ready", "KZ second ready", "GB ready"]);
    assert.equal(maximumActiveFills, 1);

    const rejected = read("DE");
    const rejectionCheck = assert.rejects(rejected, /simulated fill rejection/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    fills[3].reject(new Error("simulated fill rejection"));
    await rejectionCheck;

    const deRetry = read("DE");
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(fills.map(({ key }) => key), ["KZ", "KZ", "GB", "DE", "DE"]);
    fills[4].resolve("DE retry ready");
    assert.equal(await deRetry, "DE retry ready");
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
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

  assert.match(casinoService, /return \{ \.\.\.presented, action: decisions\.get\(projected\.id\)\?\.action \?\? null \}/);
  assert.match(casinoService, /return \{ \.\.\.projected, action: null \}/);
  assert.doesNotMatch(offerRepository, /actionAuthority|resolveMany|trackingUrl|destinationUrl/);
  assert.doesNotMatch(actionResolver, /unstable_cache|publicEditorialCache|revalidateTag/);
  assert.match(actionResolver, /private readonly resolveRequestScoped = cache/);
});

test("request-specific primary and Casino-detail links disable client-router prefetch", () => {
  const primary = source("components/public-shell/PublicNavigationClient.tsx");
  const trackedReview = source("components/analytics/TrackedReviewLink.tsx");
  const collection = source("components/casino-discovery/CasinoCollection.tsx");
  assert.match(primary, /<Link[\s\S]*?data-navigation-href=\{baseHref\}[\s\S]*?prefetch=\{false\}/);
  assert.match(trackedReview, /<Link[\s\S]*?prefetch=\{false\}/);
  // The directory card no longer owns a Link of its own: every review hop goes through the
  // tracked link asserted above, so the prefetch contract holds in one place.
  assert.match(collection, /card\.reviewHref \? <TrackedReviewLink/);
  assert.doesNotMatch(collection, /<Link\b/);
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
  assert.match(runtime, /c\.status = 'PUBLISHED'::"EditorialStatus"/);
  assert.match(runtime, /c\."archivedAt" IS NULL/);
});

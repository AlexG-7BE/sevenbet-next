import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CPO_COMMERCIAL_PREVIEW_BRANCH, isCpoCommercialPreviewEnabled, previewOutboundHref } from "../lib/cpo-commercial-preview";

const read = (path: string) => readFileSync(path, "utf8");

test("the CPO surface is fail-closed outside its exact branch Preview", () => {
  assert.equal(isCpoCommercialPreviewEnabled({ VERCEL_ENV: "production", CPO_COMMERCIAL_PREVIEW: "true" }), false);
  assert.equal(isCpoCommercialPreviewEnabled({ VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "main" }), false);
  assert.equal(isCpoCommercialPreviewEnabled({ VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: CPO_COMMERCIAL_PREVIEW_BRANCH }), true);
  assert.equal(isCpoCommercialPreviewEnabled({ CPO_COMMERCIAL_PREVIEW: "true" }), true);
  assert.equal(isCpoCommercialPreviewEnabled({}), false);
});

test("preview outbound links are one-click internal terminals with closed context", () => {
  const href = previewOutboundHref({ slug: "demo-northstar", sourceRoute: "best_casinos", rank: 1, placement: "shortlist" });
  assert.equal(href, "/preview/outbound/demo-northstar?source=best_casinos&placement=shortlist&rank=1");
  assert.doesNotMatch(href, /^https?:|\/r\//);
  const terminal = read("app/(public)/preview/outbound/[slug]/page.tsx");
  assert.match(terminal, /No external visit occurred/);
  assert.match(terminal, /isSafePublicSlug/);
  assert.doesNotMatch(terminal, /destinationUrl|affiliate\.href|window\.open/);
  assert.doesNotMatch(read("app/r/[slug]/route.ts"), /cpo-commercial|preview\/outbound/i);
});

test("Best Casinos is a three-record decision layer with strict action hierarchy", () => {
  const page = read("app/(public)/best-casinos/page.tsx");
  const layer = read("components/commercial-decision/BestCasinoDecisionLayer.tsx");
  assert.match(page, /limit: 3/);
  assert.match(page, /isCpoCommercialPreviewEnabled\(\)/);
  assert.match(page, /index: false, follow: false/);
  assert.match(layer, /records\.slice\(0, 3\)/);
  assert.ok(layer.indexOf("Visit Casino") < layer.indexOf("Read full review"));
  assert.ok(layer.indexOf("Read full review") < layer.indexOf(">Compare<"));
  assert.match(layer, /recommendationRank: rank/);
  assert.match(read("components/commercial-decision/CommercialAnalytics.tsx"), /commercialRecommendationClicked/);
  assert.match(layer, /Keep in view:/);
  assert.match(layer, /Programme answers, limits, Help activity/);
});

test("public and Programme paths have one primary commercial decision route", () => {
  const shell = read("lib/public-shell.ts");
  const home = read("components/programme/ProgramAiHome.tsx");
  const missions = read("components/programme/ProgramAiMissionExperience.tsx");
  assert.match(shell, /Best Casinos/);
  assert.doesNotMatch(shell, /Best offers/);
  assert.doesNotMatch(home, /EXPLORE B4GAMBLE|Explore B4GAMBLE/);
  assert.match(missions, /See B4GAMBLE Picks/);
  assert.match(missions, /same for everyone/);
  assert.match(missions, /Your Programme is complete without a commercial action/);
  assert.doesNotMatch(missions.slice(missions.indexOf("function CommercialNext")), /Compare casinos|Best offers|Explore bonuses/);
});

test("directory, offers and Learn preserve research while reducing first-step friction", () => {
  assert.match(read("app/(public)/casinos/page.tsx"), /Want the decision first\?/);
  assert.doesNotMatch(read("app/(public)/casinos/page.tsx"), /styles\.readingGuide|Review anatomy/);
  assert.match(read("app/(public)/bonuses/page.tsx"), /Top 3/);
  assert.match(read("app/(public)/bonuses/page.tsx"), /browse-all-offers/);
  assert.match(read("app/(public)/best-offers/page.tsx"), /redirect\("\/bonuses#top-offers"\)/);
  const learn = read("app/(public)/learn/LearningCenterPage.tsx");
  assert.match(learn, /FIVE SUBJECTS/);
  assert.match(learn, /NOT YET · CONTENT DEPTH REQUIRED/);
  const article = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  assert.doesNotMatch(article, /href="\/compare"/);
  assert.match(article, /See Top Offers/);
  assert.match(article, /See B4GAMBLE Picks/);
});

test("protected surfaces remain outside commercial composition", () => {
  const protectedFiles = [
    "app/(public)/responsible-gambling/page.tsx",
    "app/(public)/self-check/page.tsx",
    "app/help/layout.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(protectedFiles, /BestCasinoDecisionLayer|CommercialAnalyticsLink|previewOutboundHref|\/preview\/outbound/);
});

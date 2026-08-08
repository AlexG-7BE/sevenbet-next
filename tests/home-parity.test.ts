import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/page.tsx", "utf8");
const layout = readFileSync("app/(public)/layout.tsx", "utf8");
const home = readFileSync("components/home/TiltHome.tsx", "utf8");
const carousel = readFileSync("components/home/HomeProgrammeCarousel.tsx", "utf8");
const css = readFileSync("components/home/TiltHome.module.css", "utf8");

const homeAssets = [
  "public/home/hero-creator.jpg",
  "public/home/hero-confidence.jpg",
  "public/home/hero-plan.jpg",
  "public/home/hero-outcome.jpg",
  "public/home/chapter-apply.jpg",
  "public/home/tool-trigger-map.svg",
  "public/home/tool-pause-rule.svg",
];

test("Home route renders TiltHome with the approved metadata and canonical", () => {
  assert.match(page, /import \{ TiltHome \}/);
  assert.match(page, /<TiltHome \/>/);
  assert.match(page, /title: "SevenBet \| Start with more control"/);
  assert.match(page, /alternates: \{ canonical: absoluteUrl\("\/"\) \}/);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
});

test("Home records every approved canonical and responsive Figma authority", () => {
  for (const nodeId of ["289:946", "661:7551", "661:7554", "661:7607", "657:2545", "657:2548", "661:2635", "661:2686", "661:2711"]) {
    assert.match(home, new RegExp(nodeId.replace(":", "\\:")));
  }
  assert.match(home, /data-home-contract="figma-289-946"/);
});

test("Home keeps the approved nine body sections in order inside one Public Shell", () => {
  const expectedBodyOrder = [
    "hero",
    "programme-theatre",
    "self-recognition",
    "programme-tools",
    "evidence",
    "final-programme-cta",
  ];
  let cursor = -1;
  for (const section of expectedBodyOrder) {
    const index = home.indexOf(`data-home-section="${section}"`, cursor + 1);
    assert.ok(index > cursor, `${section} must follow the previous approved section`);
    cursor = index;
  }
  assert.match(home, /section="recognise"[\s\S]*section="build"[\s\S]*section="apply"/);
  assert.match(layout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(home, /<header|<footer|PublicHeader|PublicFooter|Need support now|helpPanel/iu);
});

test("Home is server rendered with the carousel as its only client island", () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(home, /["']use client["']|useEffect|IntersectionObserver|data-seven-reveal|opacity:\s*0/);
  assert.match(carousel, /^"use client";/);
  assert.doesNotMatch(css, /data-seven-reveal|data-seven-visible/);
});

test("Home uses exact bounded local Figma assets and no remote production URL", () => {
  for (const asset of homeAssets) assert.equal(existsSync(asset), true, `${asset} must exist`);
  assert.match(home, /from "next\/image"/);
  assert.match(home, /priority=\{photo\.priority\}/);
  assert.match(home, /loading="lazy"/);
  assert.doesNotMatch(home + carousel + css, /images\.pexels\.com|figma\.com\/api\/mcp\/asset|images\.unsplash|randomuser|placehold/iu);
  assert.match(home, /alt=""[\s\S]*fill/);
});

test("Home Programme entry stays internal and commercial acquisition stays outside its narrative", () => {
  assert.equal((home.match(/href="\/program"/g) ?? []).length, 2);
  assert.doesNotMatch(home, /href="\/(?:r|go)\//);
  assert.doesNotMatch(home, /casino card|bonus card|best offers|affiliate cta/iu);
  assert.match(layout, /getServerSession/);
  assert.match(layout, /accountNavigationFor\(\{ authenticated \}\)/);
});

test("Home does not invent authenticated XP or client-side progress", () => {
  assert.doesNotMatch(home + carousel, /330 XP|hardcoded authenticated|localStorage|sessionStorage|Prisma|programmeDashboardService/iu);
  assert.doesNotMatch(home + carousel, /completed missions|saved to your plan|rules active|1 of 10 complete/iu);
  assert.match(carousel, /data-presentational-progress="true"/);
  assert.match(carousel, /Illustrative layout · not your progress/);
  assert.match(carousel, /Preview only · no visitor data/);
});

test("Home carousel has exactly three truthful previews and accessible 44px controls", () => {
  assert.equal((carousel.match(/\n\s+key: "/g) ?? []).length, 3);
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Previous programme preview"/);
  assert.match(carousel, /aria-label="Next programme preview"/);
  assert.match(carousel, /aria-live="polite" aria-atomic="true"/);
  assert.match(carousel, /event\.key === "ArrowLeft"/);
  assert.match(carousel, /event\.key === "ArrowRight"/);
  assert.match(css, /\.carouselControls button \{ width: 44px; height: 44px;/);
  assert.doesNotMatch(carousel, /setInterval|setTimeout|autoplay|01 \/ 10/iu);
});

test("Self Recognition remains static language rather than a diagnostic form", () => {
  const recognition = home.slice(home.indexOf("data-home-section=\"self-recognition\""), home.indexOf("<HumanChapter"));
  assert.match(home, /spend or risk more than you planned/iu);
  assert.match(home, /win back what you lost/iu);
  assert.match(home, /guilt, stress, money or relationship problems/iu);
  assert.doesNotMatch(recognition, /<form|<input|<select|<button|score|diagnos|addicted|risk level/iu);
});

test("Programme availability and evidence limitations remain truthful", () => {
  assert.match(home + carousel, /Missions 01–04 are implemented; later missions remain planned\./);
  assert.match(home, /public NHS and NICE guidance/);
  assert.match(home, /The complete Programme has not yet been clinically evaluated\./);
  assert.doesNotMatch(home, /clinically effective|clinical effectiveness|medical endorsement|NHS endorsement|NICE endorsement|treatment efficacy/iu);
  assert.doesNotMatch(home, /Every mission saves|Each mission produces/);
});

test("Public Shell behavior and prohibited implementation boundaries remain unchanged", () => {
  const protectedPaths = [
    "components/public-shell/PublicHeader.tsx",
    "components/public-shell/PublicFooter.tsx",
    "components/public-shell/PublicNavigation.tsx",
    "lib/public-shell.ts",
    "app/(public)/layout.tsx",
  ];
  execFileSync("git", ["diff", "--quiet", "origin/main", "--", ...protectedPaths]);

  const changed = execFileSync("git", ["diff", "--name-only", "origin/main"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  const allowedMarketApiChanges = new Set(["app/api/admin/affiliate/redirect-preview/route.ts"]);
  assert.deepEqual(changed.filter((file) => /^(prisma\/|app\/api\/|lib\/programme\/)/.test(file) && !allowedMarketApiChanges.has(file)), []);
  assert.deepEqual(changed.filter((file) => /^components\/programme\/.*\.tsx?$/.test(file)), []);
});

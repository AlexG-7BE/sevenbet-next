import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/(public)/page.tsx", "utf8");
const layout = readFileSync("app/(public)/layout.tsx", "utf8");
const home = readFileSync("components/home/TiltHome.tsx", "utf8");
const carousel = readFileSync("components/home/HomeProgrammeCarousel.tsx", "utf8");
const css = readFileSync("components/home/TiltHome.module.css", "utf8");

test("Home keeps the approved ten-section narrative inside the Public Shell", () => {
  const expectedBodyOrder = [
    "hero",
    "programme-theatre",
    "self-recognition",
    "recognise",
    "build",
    "apply",
    "programme-tools",
    "evidence",
    "final-programme-cta",
  ];
  let cursor = -1;
  for (const section of expectedBodyOrder) {
    const index = home.indexOf(`data-home-section=${section === "recognise" || section === "build" || section === "apply" ? "{section}" : `\"${section}\"`}`, cursor + 1);
    if (["recognise", "build", "apply"].includes(section)) continue;
    assert.ok(index > cursor, `${section} must follow the previous approved section`);
    cursor = index;
  }
  assert.match(home, /section="recognise"[\s\S]*section="build"[\s\S]*section="apply"/);
  assert.match(layout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(home, /<header|<footer|Need support now|helpPanel/iu);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
});

test("Home is server rendered by default with one bounded carousel client island", () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(home, /["']use client["']|useEffect|IntersectionObserver|data-seven-reveal|opacity:\s*0/);
  assert.match(carousel, /^"use client";/);
  assert.doesNotMatch(css, /data-seven-reveal|data-seven-visible/);
  assert.match(home, /Ten practical missions turn difficult moments into a plan you wrote yourself\./);
});

test("Home Programme entry and returning state preserve server authority and separation", () => {
  const programmeLinks = home.match(/href="\/program"/g) ?? [];
  assert.equal(programmeLinks.length, 2);
  assert.match(layout, /getServerSession/);
  assert.match(layout, /accountNavigationFor\(\{ authenticated \}\)/);
  assert.doesNotMatch(home, /localStorage|sessionStorage|programmeDashboardService|Prisma|affiliate|casino|bonus/iu);
  assert.doesNotMatch(carousel, /localStorage|sessionStorage|fetch\(|Prisma|affiliate/iu);
});

test("Home imagery has stable dimensions and an explicit decorative alt strategy", () => {
  assert.match(home, /fetchPriority=\{index === 0 \? "high" : undefined\}/);
  assert.match(home, /loading=\{index === 0 \? "eager" : "lazy"\}/);
  assert.match(home, /alt=""[\s\S]*height="1200"[\s\S]*width="2000"/);
  assert.doesNotMatch(home, /images\.unsplash|randomuser|placehold/iu);
});

test("Home carousel exposes labelled 44px controls and truthful three-card state", () => {
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Previous programme preview"/);
  assert.match(carousel, /aria-label="Next programme preview"/);
  assert.match(carousel, /aria-live="polite" aria-atomic="true"/);
  assert.match(carousel, /event\.key === "ArrowLeft"/);
  assert.match(carousel, /event\.key === "ArrowRight"/);
  assert.match(css, /\.carouselControls button \{ width: 44px; height: 44px;/);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformHomeHandoff, transformHomeHandoffCss, transformLearnHandoff } from "../lib/final-handoff/transforms";

const source = (path: string) => readFileSync(path, "utf8");

test("Home uses only the bounded adjacent wheel fallback and no perpetual layout loop", () => {
  const interactions = source("components/final-handoff/HandoffInteractions.tsx");
  const homeInteractions = interactions.slice(
    interactions.indexOf("function setupHomeInteractions"),
    interactions.indexOf("export function HandoffInteractions"),
  );
  assert.match(interactions, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/);
  assert.match(interactions, /const onWheel[\s\S]*event\.preventDefault\(\)[\s\S]*window\.scrollTo\(\{ behavior: "smooth", top: canonicalDestinations\[nextIndex\] \}\)/);
  assert.doesNotMatch(homeInteractions, /wheelAccumulator|snapLockedUntil|scrollTweenFrame|setTimeout|setInterval|scroll-snap-stop:\s*always/);
  assert.doesNotMatch(homeInteractions, /requestAnimationFrame\(tick\)|requestAnimationFrame\(runFrame\)[\s\S]*requestAnimationFrame\(runFrame\)/);
  assert.match(interactions, /addEventListener\("scroll", onScroll, \{ passive: true \}\)/);
  assert.match(interactions, /new window\.ResizeObserver\(onResize\)/);
  assert.match(interactions, /geometryDirty[\s\S]*measureStack\(\)/);
  assert.match(interactions, /measureCanonicalDestinations\(\)/);
  assert.match(interactions, /quietFor < 140 \|\| !activeReached/);
  assert.match(interactions, /const reversing[\s\S]*direction !== lastWheelDirection/);
  assert.match(interactions, /if \(springsAreMoving\(\)\) scheduleFrame\(\)/);
});

test("Home media transform provides responsive modern formats and truthful loading priority", () => {
  const html = transformHomeHandoff(generatedPages.home.html);
  assert.equal((html.match(/<picture data-home-media="opening"/g) ?? []).length, 4);
  assert.equal((html.match(/<picture data-home-media="chapter"/g) ?? []).length, 3);
  assert.equal((html.match(/loading="eager"/g) ?? []).length, 4);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 3);
  assert.equal((html.match(/type="image\/avif"/g) ?? []).length, 7);
  assert.equal((html.match(/type="image\/webp"/g) ?? []).length, 7);
  assert.match(html, /alt="Applying the plan" loading="lazy"[^>]*height="4000"[^>]*width="6000"/);
  assert.match(html, /alt="Creator at work" loading="eager"[^>]*fetchpriority="high"[^>]*height="3844"[^>]*width="2563"/);
  assert.doesNotMatch(html, /alt="(?:Noticing the moment|Writing the rule|Applying the plan)" loading="eager"/);
});

test("Learn and 10 Steps open on the responsive photo set, never a multi-megabyte original", () => {
  // 4 Oct 2026: Learn shipped the 6000×4000 chapter photo (2.9 MB); on a phone it held the connection
  // for about 15 s and every link tapped meanwhile seemed dead. 10 Steps shipped hero-plan.jpg (626 KB).
  for (const locale of ["en-GB", "de-DE", "sv-SE"] as const) {
    const html = transformLearnHandoff(generatedPages.learn.html, locale);
    assert.equal((html.match(/<picture data-learn-hero-media=""/g) ?? []).length, 1, locale);
    assert.match(html, /<source type="image\/avif" sizes="\(max-width: 900px\) 100vw, 54vw" srcset="\/home\/responsive\/chapter-apply-320\.avif 320w, [^"]*chapter-apply-1920\.avif 1920w">/);
    assert.match(html, /<source type="image\/webp" sizes="\(max-width: 900px\) 100vw, 54vw" srcset="[^"]*chapter-apply-640\.webp 640w[^"]*">/);
    assert.match(html, /<img alt="Editorial desk" loading="eager" decoding="async" height="4000" sizes="[^"]+" width="6000" src="\/home\/chapter-apply\.jpg"[^>]*><\/picture>/);
  }
  const tenSteps = readFileSync("app/(public)/10-steps/TenStepsPage.tsx", "utf8");
  assert.match(tenSteps, /<picture><source sizes=\{ART_SIZES\} srcSet=\{artCandidates\("avif"\)\} type="image\/avif" \/><source sizes=\{ART_SIZES\} srcSet=\{artCandidates\("webp"\)\} type="image\/webp" \/><img [^>]*src="\/home\/hero-plan\.jpg"/);
  assert.match(tenSteps, /`\/home\/responsive\/hero-plan-\$\{width\}\.\$\{format\} \$\{width\}w`/);
  assert.match(readFileSync("app/(public)/10-steps/TenStepsPage.module.css", "utf8"), /\.artMotion picture \{ display: block; width: 100%; height: 100%; \}/);
});

test("responsive image outputs exist and keep the opening AVIF payload below one megabyte", () => {
  const images = ["hero-creator", "hero-confidence", "hero-plan", "hero-outcome", "chapter-apply"];
  for (const image of images) {
    for (const width of [320, 640, 1280, 1920]) {
      for (const format of ["avif", "webp"]) {
        const path = `public/home/responsive/${image}-${width}.${format}`;
        assert.equal(existsSync(path), true, path);
        assert.ok(statSync(path).size > 0, path);
      }
    }
  }
  const opening640Bytes = ["hero-creator", "hero-confidence", "hero-plan", "hero-outcome"]
    .reduce((total, image) => total + statSync(`public/home/responsive/${image}-640.avif`).size, 0);
  assert.ok(opening640Bytes < 1_000_000, `opening 640px AVIF payload was ${opening640Bytes} bytes`);
});

test("Home-only motion uses native mandatory desktop and proximity coarse-pointer snap", () => {
  const interactions = source("components/final-handoff/HandoffInteractions.tsx");
  const globals = source("app/globals.css");
  const html = transformHomeHandoff(generatedPages.home.html);
  const css = transformHomeHandoffCss(generatedPages.home.css);
  assert.match(interactions, /index \* 60/);
  assert.match(globals, /data-home-interactions="ready"[\s\S]*460ms cubic-bezier/);
  assert.match(css, /scroll-snap-type: y proximity/);
  assert.match(css, /\(pointer: fine\)[\s\S]*scroll-snap-type: y mandatory/);
  assert.match(css, /scroll-snap-stop: normal !important/);
  assert.match(css, /data-public-shell="footer"[\s\S]*scroll-snap-align: end/);
  // A fresh visit must open at the top: no snapping while the streamed page waits behind its frame.
  const unguardedSnap = css.replace(/html:not\(:has\(\[data-route-loading\]\)\) (?:\{|\[data-public-shell="footer"\]|\[data-public-footer-bottom\])/g, "");
  assert.doesNotMatch(unguardedSnap, /html \{ scroll-snap-type: y (?:proximity|mandatory)/);
  assert.doesNotMatch(unguardedSnap, /\[data-public-shell="footer"\],[\s\S]*?\{\s*scroll-snap-align: end/);
  assert.doesNotMatch(css, /scroll-snap-stop: always/);
  assert.doesNotMatch(css, /scrollbar-width:\s*none|::-webkit-scrollbar[^{}]*\{[^}]*display:\s*none/);
  assert.doesNotMatch(css, /\[data-snap\] \{ scroll-snap-align:start/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*scroll-snap-type: none !important/);

  const targets = Array.from(html.matchAll(/data-home-snap-label="([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(targets, [
    "Hero",
    "Recognition",
    "A plan you can see",
    "Missions 01-03",
    "Missions 04-07",
    "Missions 08-10",
    "Built from evidence",
    "Why trust",
    "Final CTA",
  ]);
  assert.equal((html.match(/data-home-snap=""/g) ?? []).length, 9);
  assert.equal((html.match(/data-home-snap-anchor=""/g) ?? []).length, 4);
  assert.doesNotMatch(globals, /scrollbar-width:\s*none|::-webkit-scrollbar[^{}]*\{[^}]*display:\s*none/);
  assert.match(source("playwright.public-ia.config.ts"), /name: "webkit"[\s\S]*browserName: "webkit"/);
});

test("the closing Start Programme block is compact on phones and unchanged on desktop", () => {
  // Founder, 25 Sep 2026: on phones the "Start with one situation" block no longer fills a whole screen.
  const css = transformHomeHandoffCss(generatedPages.home.css);
  const phone = css.slice(css.lastIndexOf("@media (max-width: 760px)"));
  assert.match(phone, /\[data-handoff-page="home"\] \[data-home-final-composition\] \{ min-height: 0 !important; \}/);
  assert.match(phone, /\[data-home-final-composition\] > div:has\(> h2\) \{ padding: 56px 24px 64px !important; \}/);
  const desktop = css.slice(0, css.lastIndexOf("@media (max-width: 760px)"));
  assert.doesNotMatch(desktop, /data-home-final-composition/, "desktop keeps the full-screen closing composition");
});

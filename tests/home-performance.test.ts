import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import { createHomeWheelIntent, HOME_WHEEL_INTENT_PX } from "../components/final-handoff/homeWheelIntent";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformHomeHandoff, transformHomeHandoffCss, transformLearnHandoff } from "../lib/final-handoff/transforms";

const source = (path: string) => readFileSync(path, "utf8");

test("Home reads the wheel gesture, lands with the browser's own smooth scroll and runs no perpetual layout loop", () => {
  const interactions = source("components/final-handoff/HandoffInteractions.tsx");
  const homeInteractions = interactions.slice(
    interactions.indexOf("function setupHomeInteractions"),
    interactions.indexOf("export function HandoffInteractions"),
  );
  assert.match(interactions, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/);
  assert.match(homeInteractions, /const onWheel[\s\S]*event\.preventDefault\(\)[\s\S]*readWheelIntent\(event, now\)[\s\S]*beginTravel\(direction\)/);
  // Founder, 11 Oct 2026: the landing has to be perfectly smooth. A page moved from the main
  // thread frame by frame froze whenever that thread was busy; the browser's own smooth
  // scroll does not. So nothing here animates the scroll position or holds snapping off.
  assert.match(homeInteractions, /window\.scrollTo\(\{ behavior: "smooth", top: to \}\)/);
  assert.doesNotMatch(homeInteractions, /window\.scrollTo\(0,|setProperty\("scroll-(?:snap-type|behavior)"|advanceTravel/);
  assert.match(homeInteractions, /addEventListener\("scroll", settleTravel, \{ passive: true \}\)/);
  assert.doesNotMatch(homeInteractions, /setTimeout|setInterval|scroll-snap-stop:\s*always/);
  assert.doesNotMatch(homeInteractions, /requestAnimationFrame\(tick\)|requestAnimationFrame\(runFrame\)[\s\S]*requestAnimationFrame\(runFrame\)/);
  assert.match(interactions, /addEventListener\("scroll", onScroll, \{ passive: true \}\)/);
  assert.match(interactions, /new window\.ResizeObserver\(onResize\)/);
  assert.match(interactions, /geometryDirty[\s\S]*measureStack\(\)/);
  assert.match(interactions, /measureCanonicalDestinations\(\)/);
  assert.match(interactions, /if \(springsAreMoving\(\)\) scheduleFrame\(\)/);
  // The first chapter is held by sticky positioning while it opens, so the script scales it
  // and never has to chase the browser's scroll with a translate.
  assert.match(homeInteractions, /open: anchorTop \?\? stackTop \+ flow \+ marginTop,\s*pinned: marginTop < 0/);
  assert.match(homeInteractions, /\$\{pinned \? "" : `translateY\(\$\{-raw\}px\) `\}scale\(\$\{\(0\.24 \+ 0\.76 \* progress\)\.toFixed\(4\)\}\)/);
  // Founder, 11 Oct 2026: the chapters have to move exactly as the other screens do. A chapter
  // is one layer and nothing inside it changes while the page moves: no moving dot, no fading
  // words, and its corners change only while the page rests or the chapter is out of sight.
  assert.doesNotMatch(homeInteractions, /dot\.style\.(?:transform|willChange)|contentVisible|dotTracks/);
  assert.match(homeInteractions, /if \(dot\) dot\.style\.left = `calc\(\$\{nextLayouts\.length > 1 \? \(index \/ \(nextLayouts\.length - 1\)\) \* 100 : 0\}% - 4\.5px\)`/);
  assert.match(homeInteractions, /if \(resting >= 0\) squared\[resting\] = true;\s*if \(resting >= 1\) squared\[resting - 1\] = true;/);
  assert.match(homeInteractions, /if \(raw >= away - 2\) squared\[panelIndex\] = false;\s*const corners = squared\[panelIndex\] \? "0" : first \? "28px" : "28px 28px 0 0";/);
  assert.match(interactions, /const HOME_CHAPTER_WAITING_OPACITY = 0\.001;/);
  // A sheet at rest over another is a thousandth short of opaque, so the one beneath stays
  // rasterised for the way back up; it is opaque again before the page moves.
  assert.match(interactions, /const HOME_CHAPTER_RESTING_OPACITY = 0\.999;/);
  assert.match(homeInteractions, /panelIndex === restingPanel \? String\(HOME_CHAPTER_RESTING_OPACITY\) : "1"/);
  assert.match(homeInteractions, /if \(restingPanel > 0\) panelLayouts\[restingPanel\]\?\.element\.style\.setProperty\("opacity", "1", "important"\);\s*restingPanel = -1;\s*window\.scrollTo/);
  assert.match(homeInteractions, /addEventListener\("scrollend", noteRest, \{ passive: true \}\)/);
  // The chapters' photos are fetched and decoded ahead, not on arrival.
  assert.match(homeInteractions, /image\.loading = "eager";\s*image\.decode\(\)\.catch/);
  // Where the browser can tie an animation to the scroll, it scales the chapter too, with the
  // script's own curve; the script then leaves the transform alone.
  assert.match(homeInteractions, /if \(pinned && scrollDrivenChapter\) \{[^}]*removeProperty\("transform"\)/);
  const css = transformHomeHandoffCss(generatedPages.home.css);
  assert.match(css, /@media \(min-width: 761px\) \{\s*\[data-handoff-page="home"\]\[data-home-interactions="ready"\] \[data-home-chapter="01-03"\] \{\s*margin-top: calc\(-100svh - 1px\) !important;\s*margin-bottom: 100svh !important;/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\) \{\s*@media \(min-width: 761px\) and \(prefers-reduced-motion: no-preference\)[\s\S]*view-timeline: --home-chapters block;[\s\S]*animation-timeline: --home-chapters;\s*animation-range: contain 0% contain 33\.3333%;/);
  // It grows in step with the scroll, with no curve of its own on top of the scroll's.
  assert.match(css, /@keyframes home-chapter-grow \{\s*from \{ scale: 0\.24; \}\s*to \{ scale: 1; \}/);
  assert.match(css, /\[data-stackpanel\] \[data-home-media="chapter"\] img \{\s*backface-visibility: visible;/);
  assert.match(css, /\[data-stackpanel\] \[data-stackind\] \{\s*transition: none !important;/);
});

// Wheel streams as a browser reports them: a swipe ramps up under the fingers, then macOS
// inertia decays frame by frame for a second or two after they lift.
type Wheel = { deltaMode: number; deltaY: number; timeStamp: number };
const FRAME_MS = 1000 / 60;

function swipe({ decay = 0.95, fingerFrames = 9, peak = 30, sign = 1, liftAfterInertiaFrames = Number.POSITIVE_INFINITY } = {}) {
  const deltas: number[] = [];
  for (let frame = 0; frame < fingerFrames; frame += 1) deltas.push(Math.max(1, Math.round(peak * Math.sin(((frame + 1) / fingerFrames) * Math.PI / 2))));
  for (let velocity = peak * decay, frames = 0; Math.round(velocity) >= 1 && frames < liftAfterInertiaFrames; velocity *= decay, frames += 1) deltas.push(Math.round(velocity));
  return deltas.map((delta) => ({ deltaY: delta * sign, gap: FRAME_MS }));
}

// `late` is how long the event waited for a busy main thread before the page handled it.
function gestures(stream: Array<{ deltaMode?: number; deltaY: number; gap: number; late?: number }>) {
  const read = createHomeWheelIntent(() => 900);
  let timeStamp = 10_000;
  const moves: number[] = [];
  for (const { deltaMode = 0, deltaY, gap, late = 1 } of stream) {
    timeStamp += gap;
    const event: Wheel = { deltaMode, deltaY, timeStamp };
    const direction = read(event, timeStamp + late);
    if (direction) moves.push(direction);
  }
  return moves;
}

const after = (gap: number, stream: ReturnType<typeof swipe>) => stream.map((event, index) => (index ? event : { ...event, gap }));

test("a trackpad swipe is one gesture however long its inertia runs", () => {
  assert.deepEqual(gestures(swipe()), [1]);
  assert.deepEqual(gestures(swipe({ decay: 0.965, peak: 90 })), [1]);
  assert.deepEqual(gestures(swipe({ decay: 0.98, peak: 140 })), [1]);
  assert.deepEqual(gestures(swipe({ sign: -1 })), [-1]);
  // 120Hz reports half the travel per event.
  assert.deepEqual(gestures(swipe({ fingerFrames: 18, peak: 15, decay: 0.975 }).map((event) => ({ ...event, gap: FRAME_MS / 2 }))), [1]);
});

test("a new swipe is heard while the previous one's inertia is still arriving", () => {
  // Founder, 11 Oct 2026: the second and third swipe were swallowed with their own inertia.
  assert.deepEqual(gestures([...swipe({ liftAfterInertiaFrames: 21 }), ...swipe()]), [1, 1]);
  assert.deepEqual(gestures([...swipe({ liftAfterInertiaFrames: 21 }), ...swipe({ liftAfterInertiaFrames: 21 }), ...swipe()]), [1, 1, 1]);
  assert.deepEqual(gestures([...swipe(), ...after(400, swipe())]), [1, 1]);
  assert.deepEqual(gestures([...swipe({ liftAfterInertiaFrames: 11 }), ...swipe({ sign: -1 })]), [1, -1]);
});

test("fast flicks one after another are each heard, with the previous one's inertia still strong", () => {
  // Founder, 11 Oct 2026: "you scroll too slowly; scroll faster and you will see". A flick
  // every 180-280ms leaves the previous inertia at 60-85% of its peak when the next one starts.
  const flicks = (count: number, everyMs: number, decay: number) => {
    const stream: Array<{ deltaY: number; gap: number }> = [];
    const perFlick = Math.round(everyMs / FRAME_MS);
    for (let n = 0; n < count; n += 1) {
      const deltas: number[] = [];
      for (let frame = 0; frame < 7; frame += 1) deltas.push(Math.max(2, Math.round(70 * Math.sin(((frame + 1) / 7) * Math.PI / 2))));
      for (let velocity = 70 * decay; Math.round(velocity) >= 1 && (n === count - 1 || deltas.length < perFlick); velocity *= decay) deltas.push(Math.round(velocity));
      stream.push(...deltas.map((deltaY) => ({ deltaY, gap: FRAME_MS })));
    }
    return stream;
  };
  for (const everyMs of [180, 220, 280, 340]) {
    for (const decay of [0.95, 0.97, 0.985]) {
      assert.deepEqual(gestures(flicks(5, everyMs, decay)), [1, 1, 1, 1, 1], `every ${everyMs}ms, decay ${decay}`);
    }
  }
});

test("a brush of the trackpad is not a gesture, and slow travel has to add up", () => {
  assert.deepEqual(gestures([{ deltaY: 1, gap: 0 }, { deltaY: 2, gap: FRAME_MS }]), []);
  assert.deepEqual(gestures(Array.from({ length: 12 }, () => ({ deltaY: 1, gap: 150 }))), []);
  // Sparse 1px events at the very end of inertia are neither a new gesture nor travel worth a screen.
  assert.deepEqual(gestures([...swipe(), ...Array.from({ length: 6 }, () => ({ deltaY: 1, gap: 140 }))]), [1]);
  const slowDrag = Array.from({ length: 150 }, () => ({ deltaY: 2, gap: FRAME_MS }));
  assert.deepEqual(gestures(slowDrag), [1]);
  assert.equal(HOME_WHEEL_INTENT_PX, 40);
});

test("a busy main thread in the middle of inertia does not read as silence or as a new swipe", () => {
  // While the page is busy the browser holds the next event back and merges the ones behind it:
  // one event is handled late, the next carries the travel of all the frames that were missed.
  const stalled = (stream: ReturnType<typeof swipe>, at: number, frames: number) => [
    ...stream.slice(0, at),
    { ...stream[at], late: (frames - 1) * FRAME_MS },
    { deltaY: stream.slice(at + 1, at + frames).reduce((sum, event) => sum + event.deltaY, 0), gap: (frames - 1) * FRAME_MS },
    ...stream.slice(at + frames),
  ];
  const inertia = swipe({ decay: 0.965, peak: 90 });
  assert.deepEqual(gestures(stalled(inertia, 30, 10)), [1]);
  assert.deepEqual(gestures(stalled(inertia, 60, 20)), [1]);
  assert.deepEqual(gestures(stalled(stalled(inertia, 30, 10), 34, 10)), [1]);
  // The same gap with nothing held back is a real pause, and what follows it is a new gesture.
  assert.deepEqual(gestures([...inertia.slice(0, 31), { deltaY: 100, gap: 9 * FRAME_MS }]), [1, 1]);
  // Held back upstream as well: a gap in the timestamps themselves, then the backlog in a burst
  // of merged events, each handled later than the one before.
  const backlog = [
    ...inertia.slice(0, 5),
    { ...inertia[5], late: 160 },
    { deltaY: inertia[6].deltaY, gap: 153, late: 66 },
    ...[7, 9, 11, 13].map((at, index) => ({ deltaY: inertia[at].deltaY + inertia[at + 1].deltaY, gap: 5, late: 90 + index * 10 })),
    ...inertia.slice(15),
  ];
  assert.deepEqual(gestures(backlog), [1]);
  // A main thread falling further behind with every event: each delivery merges more frames
  // than the one before, so the events grow three times in a row, and each is handled late.
  const fallingBehind = [
    ...inertia.slice(0, 40),
    ...[2, 3, 4, 5].map((frames, index) => ({ deltaY: inertia[40].deltaY * frames, gap: frames * FRAME_MS, late: 60 + index * 20 })),
    ...inertia.slice(54),
  ];
  assert.deepEqual(gestures(fallingBehind), [1]);
});

test("uneven event timing in the middle of inertia does not read as a new swipe", () => {
  const inertia = swipe({ decay: 0.965, peak: 90 });
  // Delivered in pairs: the same travel, 2ms and 31ms apart in turn.
  assert.deepEqual(gestures(inertia.map((event, index) => ({ ...event, gap: index % 2 ? 2 : 2 * FRAME_MS - 2 }))), [1]);
  // Timestamps a third of a frame early or late, from a fixed sequence.
  let seed = 7;
  const jitter = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return (seed / 2_147_483_648 - 0.5) * 11;
  };
  for (let run = 0; run < 25; run += 1) {
    assert.deepEqual(gestures(inertia.map((event, index) => ({ ...event, gap: index ? FRAME_MS + jitter() : 0 }))), [1], `run ${run}`);
    assert.deepEqual(gestures([...swipe({ liftAfterInertiaFrames: 21 }), ...swipe()].map((event, index) => ({ ...event, gap: index ? FRAME_MS + jitter() : 0 }))), [1, 1], `run ${run}`);
  }
});

test("a mouse wheel moves one screen per detent or per spin", () => {
  assert.deepEqual(gestures([{ deltaY: 100, gap: 0 }]), [1]);
  // macOS reports a slow detent of an ordinary mouse as about 4px.
  assert.deepEqual(gestures([{ deltaY: 4.000244140625, gap: 0 }]), [1]);
  assert.deepEqual(gestures([{ deltaMode: 1, deltaY: 3, gap: 0 }]), [1]);
  assert.deepEqual(gestures(Array.from({ length: 4 }, () => ({ deltaY: 100, gap: 60 }))), [1]);
  assert.deepEqual(gestures([4, 12, 40, 90, 120].map((deltaY) => ({ deltaY, gap: 40 }))), [1]);
  assert.deepEqual(gestures(Array.from({ length: 3 }, () => ({ deltaY: 100, gap: 700 }))), [1, 1, 1]);
  assert.deepEqual(gestures([{ deltaY: 300, gap: 0 }, { deltaY: -300, gap: 20 }]), [1, -1]);
  assert.deepEqual(gestures(Array.from({ length: 12 }, () => ({ deltaY: 900, gap: 16 }))), [1]);
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
  // 17 Oct 2026: the same responsive set, with an `art` prop the help host passes. There the
  // photograph is the hashed copy under /_next/static/, because the help-host Firewall rule
  // denies /home/ (RFC-057 §4.2); unset, which is every request to b4gamble.com, nothing moves.
  assert.match(tenSteps, /<picture><source sizes=\{ART_SIZES\} srcSet=\{art \? art\.avifSrcSet : artCandidates\("avif"\)\} type="image\/avif" \/><source sizes=\{ART_SIZES\} srcSet=\{art \? art\.webpSrcSet : artCandidates\("webp"\)\} type="image\/webp" \/><img [^>]*src=\{art \? art\.fallbackSrc : "\/home\/hero-plan\.jpg"\}/);
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

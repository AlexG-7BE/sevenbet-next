# HOME-PERFORMANCE-MOTION-POLISH-01 — Implementation Evidence

## Boundary

RFC-035 governs this Preview-only workstream. RFC-034 remains the presentation authority. Production, Programme, commercial, data, auth and nonce-CSP architecture are unchanged.

## Baseline — 2026-08-18

| Measure | Detected before change |
| --- | ---: |
| Exact main/base SHA | `381624c410222b7bb56f65b755d562b284ff08fa` |
| Unique Home JPEG requests before scroll | 5 |
| Home JPEG bytes before scroll | 7,453,085 |
| Visible opening-source bytes | 4,551,142 |
| Idle RAF callbacks / second | 60 |
| Idle geometry reads / second | 60 |
| Idle computed-style reads / second | 240 |
| Idle height reads / second | 240 |
| Desktop wheel policy | cancelled; accumulated; 600ms locked section tween |
| Coarse-pointer snap policy | mandatory |
| Home rise timing | 700ms transition; 130ms/item stagger |

The localhost browser baseline used a fresh 1440×900 Chromium context after hydration and network idle. Layout instrumentation was reset before a settled one-second sample. Network byte counts are response-body bytes for `/home/*` image requests.

## Implemented evidence

- **Detected:** the original accumulator, 600ms input lock and custom wheel tween were removed. The final Founder correction adds only the authorised fine-pointer adjacent-destination wheel handler; keyboard, touch, scrollbar, coarse pointer and reduced-motion scrolling remain browser-controlled.
- **Detected:** chapter geometry is cached. It is measured at initialisation and invalidated by window resize or `ResizeObserver`; steady-state scroll frames reuse the cached values.
- **Detected:** the Home RAF scheduler is event-driven. It runs for pending scroll work or unsettled pointer springs and stops when settled.
- **Detected:** a settled one-second localhost sample recorded zero Home RAF callbacks, geometry reads, computed-style reads and height reads.
- **Detected:** 40 static AVIF/WebP candidates cover five source images at 320, 640, 1280 and 1920 pixels. The renderer supplies `srcset`, `sizes`, intrinsic dimensions and JPEG fallback.
- **Detected:** the four opening-photo cards are eager because they are visible in the desktop opening composition; only `Creator at work` has high fetch priority. All three chapter images are `loading="lazy"` with low fetch priority.
- **Detected:** a fresh 1440×900 Chromium run transferred 41,469 bytes for the four visible opening AVIFs. The same run transferred 254,921 Home-image bytes across six AVIF requests after Chromium also natively prefetched two lazy chapter candidates; `chapter-apply` and all JPEG fallbacks remained unfetched.
- **Detected:** observed initial Home image transfer fell 96.6% from 7,453,085 bytes to 254,921 bytes. The visible opening-source comparison fell 99.1% from 4,551,142 bytes to 41,469 bytes.
- **Detected:** Home rise timing is 460ms with a 60ms stagger. Coarse-pointer CSS snapping is `proximity`, not `mandatory`.

## Founder soft-snap refinement baseline — 2026-08-19

This section records the intermediate Preview and is superseded by the final sequential-wheel correction below.

- **Detected:** existing Draft PR #77 head before refinement is `e14e2ac61a9f480e4a7a01a0f0e9ececd41f799d`; the PR is Open, Draft, cleanly mergeable and all hosted checks are green.
- **Detected:** the generated Home snap rule remains inside `@media (pointer: coarse)`. The first Preview therefore reports computed root snap type `none` at a 1280px fine-pointer viewport even though the source transform changed the captured coarse-pointer value to `proximity`.
- **Detected:** the handoff contains nine major labelled compositions plus four prototype percentage markers inside the sticky story wrapper. Applying the captured `[data-snap]` selector on desktop would make those internal markers unintended snap targets and would omit the labelled plan and three chapter sheets.
- **Detected:** the current Tilt homepage reports no native root scroll-snap declaration and uses a constrained presentation surface. Its exact library/algorithm is not established and is not an implementation authority.
- **Inferred:** the Founder-described characteristic and Refero motion guidance support the smallest standards-based change: CSS-only proximity settling that remains interruptible, stops frames while idle and adds no high-frequency input controller.
- **Detected:** Home now applies CSS-only native `y proximity` when reduced motion is not requested. Exactly Hero, Recognition, A plan you can see, the three Mission sheets, Built from evidence, Why trust and the final CTA/PublicFooter composition are marked as targets; each uses `scroll-snap-stop: normal`.
- **Detected:** every marked composition computes to start alignment. The PublicFooter bottom anchor is the final composition's end safety point at every viewport, so the CTA cannot trap access to the last pixels of the footer.
- **Detected:** the four internal percentage markers remain non-targets, reduced motion computes to `scroll-snap-type: none`, and no JavaScript input listener, accumulator, tween, timer, lock or settling controller was added.
- **Detected:** Chromium and WebKit accepted small, repeated, large, reverse and keyboard input. Both reached the document bottom and visible PublicFooter at 1440×900, 1024×768 and 390×844 without a viewport trap or console error.

## Founder mandatory desktop correction baseline — 2026-08-19

This section records the intermediate mandatory-snap Preview and is superseded by the final sequential-wheel correction below.

- **Detected:** existing Draft PR #77 head before this correction is `4e3f45a6d43cca2f3da39a54bba4a3482316cae1`; local and origin branch heads match and the worktree is clean.
- **Detected:** at 1440×900 under current `y proximity`, a 120px fine-pointer wheel input settled at 120px and three 60px inputs settled at 269px. Medium 420px and large 1200px inputs happened to settle at valid 900px and 1800px boundaries. Proximity therefore does not guarantee the requested small-gesture fixation.
- **Detected:** `PublicHeader` is `position: fixed`, measures 81px at both required desktop viewports and overlays deliberately clear composition space. Root scroll padding is `auto` and target scroll margin is `0px`; no visible target content is obscured at start alignment.
- **Detected:** Hero through Why trust each measure 900px at 1440×900 and 768px at 1024×768. Final CTA measures 573px and 442px. No target exceeds its scrollport; all nine remain eligible for mandatory snapping.
- **Inferred:** applying an 81px snap offset would reduce the effective snapport below the eight full-screen target heights and create the oversized-target condition the audit is intended to prevent. The correct existing shell dimension is therefore inspected but not applied as snap padding/margin.
- **Detected:** fine-pointer Home uses `y mandatory`; coarse pointer remains `y proximity`; reduced motion remains `none`. Every composition and the real PublicFooter use `scroll-snap-stop: normal`. The footer is an end-aligned snap area in the Home-injected stylesheet, which makes the true document bottom reachable in WebKit as well as Chromium.

| Target | 1440×900 height | 1024×768 height | Mandatory | Reason |
| --- | ---: | ---: | --- | --- |
| Hero | 900px | 768px | Enabled | Exactly one scrollport; designed clear of the fixed overlay header |
| Recognition | 900px | 768px | Enabled | Exactly one scrollport |
| A plan you can see | 900px | 768px | Enabled | Exactly one scrollport |
| Missions 01–03 | 900px | 768px | Enabled | Exactly one scrollport |
| Missions 04–07 | 900px | 768px | Enabled | Exactly one scrollport |
| Missions 08–10 | 900px | 768px | Enabled | Exactly one scrollport |
| Built from evidence | 900px | 768px | Enabled | Exactly one scrollport |
| Why trust | 900px | 768px | Enabled | Exactly one scrollport |
| Final CTA | 573px | 442px | Enabled | Shorter than one scrollport; real footer supplies the end safety target |

### Mandatory landing evidence

The values below are final `window.scrollY` positions after settling. All are exact runtime target positions; engine-specific document offsets are compared against positions measured in that engine rather than hard-coded to zero.

| Engine / viewport | Small | Repeated small | Medium | Large | Immediate reverse | PageDown / PageUp | End / Home |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chromium 1440×900 | 0 | 0 | 0 | 900 | 0 | 900 / 0 | 7200 / 0 |
| Chromium 1024×768 | 0 | 0 | 768 | 1536 | 0 | 768 / 0 | 6163 / 0 |
| WebKit 1440×900 | 991 | 991 | 991 | 1891 | 91 | 991 / 91 | 7655 / 91 |
| WebKit 1024×768 | 859 | 859 | 859 | 1627 | 91 | 859 / 91 | 6599 / 91 |

- **Detected:** a 300px downward input followed 20ms later by a 300px upward input decreased the active position immediately in both engines and returned to the previous valid target. No input was cancelled.
- **Detected:** Chromium may retain the current screen for a small input while WebKit advances one screen; both visibly settle to valid targets. Large input may skip because stop behaviour remains `normal`.
- **Detected:** `End` reaches the complete PublicFooter and exact document bottom in both engines. The redundant footer-bottom marker remains end-aligned.
- **Detected:** manual 120px comparison showed Production progress gradually from 0→18→56→416→716px over 900ms, the previous proximity Preview stop at an arbitrary 120px, and the new mandatory build move immediately then settle 0→99→755→899→900px. The current Tilt homepage exposed a constrained full-screen carousel and no root scroll-snap declaration in this review; its implementation is not inferred and is not an authority.

## Founder sequential-wheel, native-scrollbar and fully-open Mission correction — 2026-08-19

- **Detected:** existing Draft PR #77 head before this correction is `e664401f0fbaebffc00634dabcff9cbc43496d45`; local and origin branch heads matched and the worktree was clean.
- **Detected:** the captured Home CSS and shared public-shell CSS both suppressed the desktop scrollbar. The Home transform now removes the captured rule and the shared selector explicitly excludes Home. Computed Home root `scrollbar-width` is not `none`, both WebKit scrollbar pseudo-elements are not `display:none`, the document is scrollable, and an in-app Chromium inspection measured a 15px native scrollbar gutter with a visible thumb.
- **Detected:** CSS-only was tested first with `y mandatory` plus canonical `scroll-snap-stop: always`. A 120px delta stayed at `0`; a 600px delta reached the adjacent target; a 5,000px delta skipped to `5,400` (`Built from evidence`) at 1440×900 and `5,376` (`Why trust`) at 1024×768. CSS-only therefore failed the sequential contract and was reverted to normal stops.
- **Detected:** the selected correction-authorised controller listens only for vertical fine-pointer `wheel` events. Canonical destinations are cached during existing geometry measurement. One momentum stream is grouped by a 140ms quiet threshold and can resolve only to the adjacent destination. Same-direction events are ignored until that target is reached; opposite direction aborts the in-flight native smooth scroll and retargets immediately. There is no wheel accumulator, timer, long lock, custom tween, continuous frame loop, dependency or generic scrollbar/pointer/scroll ownership.
- **Detected:** the runtime canonical order is Hero, Recognition, A plan you can see, Missions 01–03, Missions 04–07, Missions 08–10, Built from evidence, Why trust, Final CTA and real footer/end. The four prototype percentage markers remain non-targets.
- **Detected:** four invisible one-pixel, negative-margin anchors mark the plan and three Mission open coordinates without changing visible geometry. Each Mission landed with anchor `raw = 0`, chapter opacity `1`, stack-indicator opacity `1`, transform `none`, border radius `0px` and panel height equal to the viewport in Chromium and actual WebKit at 1440×900 and 1024×768.
- **Detected:** Playwright's previous project labels did not explicitly set `browserName`, so both projects inherited the CI Chromium default. The public-IA config now explicitly runs Chromium and WebKit. Local production HTTP is bridged to WebKit only inside the test harness because the unchanged production CSP upgrades local subresources to HTTPS; hosted Preview uses normal HTTPS and requires no bridge.

### Strict adjacent-landing evidence

All final positions were compared with engine-measured destinations rather than hard-coded document offsets.

| Engine / viewport | Full forward sequence | 12×900px / 16ms burst | 5,000px input | Immediate reverse | Mission 01–03 / 04–07 / 08–10 |
| --- | --- | --- | --- | --- | --- |
| Chromium 1440×900 | Every adjacent destination through footer | Hero → Recognition only | One adjacent target per input | Returned to Hero | Fully open at `raw = 0` |
| Chromium 1024×768 | Every adjacent destination through footer | Hero → Recognition only | One adjacent target per input | Returned to Hero | Fully open at `raw = 0` |
| WebKit 1440×900 | Every adjacent destination through footer | Hero → Recognition only | One adjacent target per input | Returned to Hero | Fully open at `raw = 0` |
| WebKit 1024×768 | Every adjacent destination through footer | Hero → Recognition only | One adjacent target per input | Returned to Hero | Fully open at `raw = 0` |

- **Detected:** the 12-test strict production-build matrix passed in 1.7 minutes across actual Chromium and WebKit. It also covered native PageDown/PageUp/Home/End, footer visibility, coarse-pointer proximity, reduced-motion fail-visible behaviour, route cleanup, responsive media and zero settled idle work.
- **Detected:** headless browser chrome does not expose a draggable native thumb. A headed Chromium probe did move directly across multiple screens. Headed WebKit and DOM automation could not target browser chrome, so direct WebKit thumb-drag automation is **Not detected**. The engine-independent structural/runtime evidence proves the bar is not hidden and the correction owns no generic scroll/pointer event, but a physical WebKit thumb drag remains a manual release check rather than an automated claim.

## Verification — local production build

| Gate | Result |
| --- | --- |
| `npm run ci:quality` | Passed |
| `npm run build` | Passed; existing local direct-Prisma endpoint warning only |
| Focused structural performance tests | 8 passed, including shared-shell scrollbar ownership |
| Founder correction Chromium + actual WebKit matrix | 12 passed in 1.7 minutes: 1440×900 and 1024×768 full adjacent sequence; small/5,000px/burst/immediate-reverse/PageDown/PageUp/Home/End; all Mission open states; coarse proximity; reduced motion; footer; images and idle work |
| Existing affected Chromium Home/systemic regressions | 82 passed: visibility, hydration, history, responsive layout, accessibility, final CTA/footer and interaction contracts; the local authenticated-header fixture was excluded because its unrelated origin configuration returns `403 INVALID_ORIGIN` |
| Locked Home ending/footer regressions | 8 passed at 1440, 1280, 1024, 430, 412, 390, 375 and 360px |
| Browser states | no JavaScript, reduced motion, wheel, keyboard, resize, history, mobile navigation, footer reachability and interaction cleanup passed |
| Idle instrumentation | 0 RAF, 0 rect, 0 style and 0 height reads after settling |
| `git diff --check` | Passed |
| Draft PR CI | Agent Core, Quality, Database / Migration Verification and Build / Browser passed |
| Vercel | Preview deployment Ready; Production untouched |

## Visual regression status

**Detected:** local production-build review at 1440×900, 1024×768 and 390×844 preserved the current merged Home composition, crop positions, typography, copy, section order, sticky chapter treatment and public shell. Opening and chapter states remained recognisable with no overflow or broken media. The only intentional perceptual differences are native scroll control and the tighter reveal timing. RFC-034 and its merged QA evidence remain the reference lock; Refero review introduced no new visual direction.

**Detected:** authenticated side-by-side deployment inspection found the same title, Home content and 6,575px document composition height on Production and Preview. Production selected seven eager raw JPEGs without intrinsic dimensions. Preview selected four responsive opening AVIFs with intrinsic dimensions and left all three lazy chapter images unloaded at the top of the page.

## Architectural follow-up, not implemented

**Inferred:** public-shell TTFB and cacheability may merit a separate RFC that evaluates auth/session isolation around nonce CSP and dynamic rendering. This PR intentionally leaves `force-dynamic`, `connection()`, the nonce and security headers unchanged; no caching conclusion is asserted here.

## Release state

**Ready for Founder review as Draft PR #77.** Vercel Preview and all required PR checks are green. The PR remains unmerged and Production is untouched; the exact final head and deployment URLs are reported from the live PR/deployment records rather than embedded here, so a documentation-only commit cannot make them stale.

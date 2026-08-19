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

- **Detected:** the Home interaction module no longer registers a wheel listener, calls `preventDefault()`, accumulates wheel input, locks input or runs a programmatic scroll tween. Wheel, repeated wheel and keyboard scrolling are browser-controlled.
- **Detected:** chapter geometry is cached. It is measured at initialisation and invalidated by window resize or `ResizeObserver`; steady-state scroll frames reuse the cached values.
- **Detected:** the Home RAF scheduler is event-driven. It runs for pending scroll work or unsettled pointer springs and stops when settled.
- **Detected:** a settled one-second localhost sample recorded zero Home RAF callbacks, geometry reads, computed-style reads and height reads.
- **Detected:** 40 static AVIF/WebP candidates cover five source images at 320, 640, 1280 and 1920 pixels. The renderer supplies `srcset`, `sizes`, intrinsic dimensions and JPEG fallback.
- **Detected:** the four opening-photo cards are eager because they are visible in the desktop opening composition; only `Creator at work` has high fetch priority. All three chapter images are `loading="lazy"` with low fetch priority.
- **Detected:** a fresh 1440×900 Chromium run transferred 41,469 bytes for the four visible opening AVIFs. The same run transferred 254,921 Home-image bytes across six AVIF requests after Chromium also natively prefetched two lazy chapter candidates; `chapter-apply` and all JPEG fallbacks remained unfetched.
- **Detected:** observed initial Home image transfer fell 96.6% from 7,453,085 bytes to 254,921 bytes. The visible opening-source comparison fell 99.1% from 4,551,142 bytes to 41,469 bytes.
- **Detected:** Home rise timing is 460ms with a 60ms stagger. Coarse-pointer CSS snapping is `proximity`, not `mandatory`.

## Founder soft-snap refinement baseline — 2026-08-19

- **Detected:** existing Draft PR #77 head before refinement is `e14e2ac61a9f480e4a7a01a0f0e9ececd41f799d`; the PR is Open, Draft, cleanly mergeable and all hosted checks are green.
- **Detected:** the generated Home snap rule remains inside `@media (pointer: coarse)`. The first Preview therefore reports computed root snap type `none` at a 1280px fine-pointer viewport even though the source transform changed the captured coarse-pointer value to `proximity`.
- **Detected:** the handoff contains nine major labelled compositions plus four prototype percentage markers inside the sticky story wrapper. Applying the captured `[data-snap]` selector on desktop would make those internal markers unintended snap targets and would omit the labelled plan and three chapter sheets.
- **Detected:** the current Tilt homepage reports no native root scroll-snap declaration and uses a constrained presentation surface. Its exact library/algorithm is not established and is not an implementation authority.
- **Inferred:** the Founder-described characteristic and Refero motion guidance support the smallest standards-based change: CSS-only proximity settling that remains interruptible, stops frames while idle and adds no high-frequency input controller.
- **Detected:** Home now applies CSS-only native `y proximity` when reduced motion is not requested. Exactly Hero, Recognition, A plan you can see, the three Mission sheets, Built from evidence, Why trust and the final CTA/PublicFooter composition are marked as targets; each uses `scroll-snap-stop: normal`.
- **Detected:** the four internal percentage markers remain non-targets, reduced motion computes to `scroll-snap-type: none`, and no JavaScript input listener, accumulator, tween, timer, lock or settling controller was added.
- **Detected:** Chromium and WebKit accepted small, repeated, large, reverse and keyboard input. Both reached the document bottom and visible PublicFooter at 1440×900, 1024×768 and 390×844 without a viewport trap or console error.

## Verification — local production build

| Gate | Result |
| --- | --- |
| `npm run ci:quality` | Passed |
| `npm run build` | Passed; existing local direct-Prisma endpoint warning only |
| Focused structural performance tests | 4 passed |
| Founder refinement Chromium + WebKit matrix | 10 passed: target policy, small/repeated/large/reverse/keyboard input, exact viewports, footer, reduced motion, images and idle work |
| Existing Chromium + WebKit Home/systemic regressions | 66 passed: visibility, hydration, history, layout, accessibility and interaction contracts |
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

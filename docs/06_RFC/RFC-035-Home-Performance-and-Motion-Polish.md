# RFC-035 — Home Performance and Motion Polish

## Status

**Approved for bounded Draft-PR and Preview implementation on 2026-08-18; Founder native-snap refinements approved on 2026-08-19.** Authority is the supplied `HOME-PERFORMANCE-MOTION-POLISH-01` Founder workstream instruction and its continuations for existing Draft PR #77. This RFC authorises no merge, Production deployment, Production configuration or data change.

## Decision

Preserve the RFC-034 final Home composition while replacing its input-intercepting and continuously layout-reading interaction implementation with native scrolling and event-driven work. Deliver responsive Home-only image variants and shorten Home reveal timing without changing content, information architecture, commercial logic, Programme logic or security architecture.

The bounded implementation will:

- remove the fine-pointer `wheel` cancellation, accumulator, input lock and 600ms programmatic section tween;
- retain the sticky chapter composition while allowing the browser to own wheel, trackpad, keyboard and touch scrolling;
- measure chapter geometry at initialisation and after resize/content-size changes, then reuse cached values during scroll updates;
- request animation frames only for pending scroll work or an unsettled pointer spring;
- preserve fail-visible and reduced-motion behaviour;
- deliver responsive AVIF/WebP candidates with intrinsic dimensions while keeping original JPEGs as fallbacks;
- eagerly load only the four visible opening-photo cards and lazily load all three below-fold chapter images; and
- change Home rise timing from 700ms/130ms to 460ms/60ms.

Native coarse-pointer snapping is reduced from `mandatory` to `proximity`. This keeps the optional chapter alignment cue without forcing a user away from an intermediate scroll position.

### Founder refinement — native soft section fixation

The first PR #77 Preview proved the performance architecture but left desktop fine-pointer scrolling without active snap fixation. The continuation keeps browser-owned physical scrolling and applies Home-only native `scroll-snap-type: y proximity` to fine and coarse pointers when reduced motion is not requested.

Only these major compositions are snap targets: Hero, Recognition, A plan you can see, Missions 01–03, Missions 04–07, Missions 08–10, Built from evidence, Why trust and the final CTA/PublicFooter composition. Prototype-only percentage markers are not snap targets. Every target uses `scroll-snap-stop: normal`, so stronger input may pass more than one target and direction reversal remains browser-controlled. Reduced-motion disables page snapping. No JavaScript scroll-settle controller, timer, wheel/touch cancellation or new animation loop is authorised.

### Founder correction — perceptible desktop fixation

Measured browser evidence shows that `proximity` remains discretionary: at 1440×900, a 120px fine-pointer wheel input settled at 120px and three small inputs settled at 269px rather than an intended composition. Fine-pointer Home therefore uses browser-native `scroll-snap-type: y mandatory`; coarse pointer retains `y proximity`; reduced motion retains `none`. `scroll-snap-stop` remains `normal` and no input interception, lock, timer, accumulator, custom tween or smooth-scroll dependency is authorised.

At both required desktop viewports, Hero through Why trust are exactly one scrollport tall (900px at 1440×900; 768px at 1024×768). Final CTA is shorter (573px and 442px). None is taller than the scrollport, so all nine remain eligible. The actual `PublicHeader` is a fixed 81px overlay and the compositions already reserve unobscured visual space beneath it. Adding an 81px snap padding/margin would shrink the snapport and make the eight full-screen targets effectively oversized, so Home uses no snap offset.

## Evidence baseline

- **Detected:** active repository root is `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`; 1,773 active paths were scanned excluding dependencies, generated build output, caches, reports and `tsconfig.tsbuildinfo`.
- **Detected:** the branch starts from current `origin/main` `381624c410222b7bb56f65b755d562b284ff08fa`, the merge of PR #76.
- **Detected:** Home uses `HandoffPage`, the RFC-034 generated Home markup and one `HandoffInteractions` client effect. Root `force-dynamic`, `connection()`, nonce CSP and the shared public shell remain separate authorities.
- **Detected:** desktop fine-pointer Home registers a non-passive `wheel` handler, calls `preventDefault()`, accumulates input, locks further input and animates to a calculated stop over 600ms.
- **Detected:** the Home loop schedules itself continuously. A settled localhost desktop sample recorded 60 RAF callbacks, 60 `getBoundingClientRect()` reads, 240 `getComputedStyle()` reads and 240 `offsetHeight` reads in one idle second.
- **Detected:** generated Home markup contains seven raw `<img>` elements, all `loading="eager"`, without responsive candidates or intrinsic dimensions.
- **Detected:** the five unique JPEGs fetched before scroll total 7,453,085 bytes across five requests. The visible opening sources total 4,551,142 bytes; the below-fold `chapter-apply.jpg` is 2,901,943 bytes.
- **Detected:** original Home assets are 2,563–6,000 pixels wide. Their current display ranges from 130px mobile photo cards to full-viewport chapter media.
- **Detected:** RFC-034 and `FINAL-DESIGN-MOTION-CONTRACT.md` currently record the 600ms wheel tween and 700ms/130ms Home rise behaviour. This RFC supersedes only those Home interaction rows.

## Reference lock and decision ledger

| Decision | Source | Reason |
| --- | --- | --- |
| Preserve composition, crops, typography, copy and section order | RFC-034, final handoff evidence, current Production | This is a performance workstream, not a redesign |
| Native scroll owns user input | Founder workstream instruction | Direct control removes input delay and section pagination |
| Native Home `y mandatory` for fine pointer, `y proximity` for coarse pointer, nine major targets and normal stop behaviour | 2026-08-19 Founder correction; measured Chromium baseline; Refero motion restraint/interruptibility guidance | Produces perceptible desktop fixation while retaining direct, reversible browser-owned input and the less aggressive mobile policy |
| Cache geometry outside steady-state scroll frames | Browser performance evidence | Eliminates repeated layout reads and read/write thrashing |
| Event-driven RAF with spring-settle continuation only | Browser performance evidence | Stops idle animation work while preserving the photo depth effect |
| Static responsive AVIF/WebP candidates plus JPEG fallback | Existing first-party source assets and handoff renderer boundary | Avoids a renderer rewrite while reducing transfer cost and mobile overfetch |
| 460ms reveal with 60ms stagger | Founder requested 400–500ms / 50–70ms range; existing easing retained | Keeps the approved premium reveal language with faster response |
| Keep nonce CSP and dynamic root unchanged | Security boundary and RFC-033/RFC-034 | Rendering/security changes are outside scope |

## Boundaries

This RFC does not authorise:

- a Home redesign, copy change, route or navigation change;
- a Programme, reward, commercial, casino, offer, comparison or protected Help change;
- a schema, migration, database, provider, environment, auth or analytics change;
- removal of `force-dynamic`, `connection()`, nonce CSP or security headers;
- a new smooth-scroll dependency; or
- merge or Production deployment.

## Verification and release gates

The branch must pass focused structural/browser regressions, lint, typecheck, production build, existing Home/public browser coverage, affected CI suites and `git diff --check`. Browser verification must cover Chromium desktop, WebKit desktop, mobile, reduced motion, small, repeated small, medium and large wheel input, immediate direction reversal, PageDown/PageUp, Home/End, resize, footer reachability and navigation cleanup. It must assert final landing near a valid intended target, fine-pointer `y mandatory`, coarse-pointer `y proximity`, exactly the approved major targets, normal stop behaviour, no wheel cancellation/input lock and zero settled idle RAF/layout work. Visual comparison uses the merged RFC-034 Home evidence and Production as the locked references.

Delivery remains a Draft PR with an isolated Vercel Preview. Founder approval is required for any merge or Production action.

# RFC-035 — Home Performance and Motion Polish

## Status

**Approved for bounded Draft-PR and Preview implementation on 2026-08-18.** Authority is the supplied `HOME-PERFORMANCE-MOTION-POLISH-01` Founder workstream instruction. This RFC authorises no merge, Production deployment, Production configuration or data change.

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

The branch must pass focused structural/browser regressions, lint, typecheck, production build, existing Home/public browser coverage, affected CI suites and `git diff --check`. Browser verification must cover Chromium desktop, WebKit desktop, mobile, reduced motion, repeated wheel input, keyboard scroll, resize and navigation cleanup. Visual comparison uses the merged RFC-034 Home evidence and Production as the locked references.

Delivery remains a Draft PR with an isolated Vercel Preview. Founder approval is required for any merge or Production action.

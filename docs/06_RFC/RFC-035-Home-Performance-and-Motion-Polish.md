# RFC-035 — Home Performance and Motion Polish

## Status

**Approved for bounded Draft-PR and Preview implementation on 2026-08-18; Founder native-snap refinements, sequential-input correction and final public-site polish addendum approved on 2026-08-19.** Authority is the supplied `HOME-PERFORMANCE-MOTION-POLISH-01` and `B4GAMBLE — FINAL SITE POLISH / PRODUCT FREEZE` Founder workstream instructions for existing Draft PR #77. This RFC authorises no merge, Production deployment, Production configuration or data change.

## Decision

Preserve the RFC-034 final Home composition while replacing its input-intercepting and continuously layout-reading interaction implementation with native scrolling and event-driven work. Deliver responsive Home-only image variants and shorten Home reveal timing without changing content, information architecture, commercial logic, Programme logic or security architecture.

The bounded implementation will:

- remove the fine-pointer `wheel` cancellation, accumulator, input lock and 600ms programmatic section tween;
- retain the sticky chapter composition while keeping keyboard, touch, scrollbar and non-Home scrolling browser-native, with only the correction-authorised adjacent Home wheel fallback on fine pointers;
- measure chapter geometry at initialisation and after resize/content-size changes, then reuse cached values during scroll updates;
- request animation frames only for pending scroll work or an unsettled pointer spring;
- preserve fail-visible and reduced-motion behaviour;
- deliver responsive AVIF/WebP candidates with intrinsic dimensions while keeping original JPEGs as fallbacks;
- eagerly load only the four visible opening-photo cards and lazily load all three below-fold chapter images; and
- change Home rise timing from 700ms/130ms to 460ms/60ms.

### Founder addendum — final public-site polish / product-freeze candidate

The accepted Home implementation at `74625daa2c51b582e0df0c55d314711cbb845fa1` is the locked baseline and must not regress. The same Draft PR may apply exactly four additional presentation/interaction corrections without redesigning the public system:

- `/casinos` keeps the existing server-owned query/facet model, but each empty filter option names its real field and JavaScript-enabled select changes navigate through the existing client router immediately; no visible Apply/Show Results control is required;
- `/bonuses` keeps the existing server-owned query/deep-link model, but JavaScript-enabled select/number changes update immediately, the visible Show Results/Reset pair is removed and the active-filter area owns the one `Clear All` action;
- `/learn` removes the search-like Hero affordance and places the existing live client-side search beside the `All guides` discovery heading, preserving category/tag/difficulty composition, live result state and narrow-width stacking; and
- `/program` presents the existing Programme personalisation statement as the third unchecked required confirmation on the access screen. After the existing RFC-021 signed access proof creates the exact anonymous Programme session, the client confirms the existing RFC-022 `ProgrammeSensitiveInputAuthority` for that session and enters Mission 01 only when both server operations succeed. Mission 01 removes its duplicate checkbox. Transcription and Programme-personalisation services retain their current server-side active-authority checks. Withdrawal invalidates that same authority and returns to the three-confirmation access screen; a new explicit access action is required to reconfirm.

The three Programme concepts remain separate: adult self-attestation, Terms agreement/Privacy Notice acknowledgement and narrow Programme-personalisation authority. The personalisation wording, purpose/statement versions, database model, anonymous-to-user claim transition, expiry/session behaviour, provider boundary and commercial firewall remain unchanged. The RFC-021 proof is not repurposed as sensitive-input evidence, Google is not age verification, and no new consent model, migration or durable raw-content storage is authorised. This addendum supersedes RFC-022 only where it placed the narrow authority checkbox on the Mission 01 intake surface; all RFC-022 server authority, withdrawal and privacy requirements remain in force.

Native coarse-pointer snapping is reduced from `mandatory` to `proximity`. This keeps the optional chapter alignment cue without forcing a user away from an intermediate scroll position.

### Founder refinement — native soft section fixation

This intermediate disposition is retained for audit history and is superseded by the sequential-wheel correction below.

The first PR #77 Preview proved the performance architecture but left desktop fine-pointer scrolling without active snap fixation. The continuation keeps browser-owned physical scrolling and applies Home-only native `scroll-snap-type: y proximity` to fine and coarse pointers when reduced motion is not requested.

Only these major compositions are snap targets: Hero, Recognition, A plan you can see, Missions 01–03, Missions 04–07, Missions 08–10, Built from evidence, Why trust and the final CTA/PublicFooter composition. Prototype-only percentage markers are not snap targets. Every target uses `scroll-snap-stop: normal`, so stronger input may pass more than one target and direction reversal remains browser-controlled. Reduced-motion disables page snapping. No JavaScript scroll-settle controller, timer, wheel/touch cancellation or new animation loop is authorised.

### Founder correction — perceptible desktop fixation

This intermediate disposition is retained for audit history and is superseded by the sequential-wheel correction below.

Measured browser evidence shows that `proximity` remains discretionary: at 1440×900, a 120px fine-pointer wheel input settled at 120px and three small inputs settled at 269px rather than an intended composition. Fine-pointer Home therefore uses browser-native `scroll-snap-type: y mandatory`; coarse pointer retains `y proximity`; reduced motion retains `none`. `scroll-snap-stop` remains `normal` and no input interception, lock, timer, accumulator, custom tween or smooth-scroll dependency is authorised.

At both required desktop viewports, Hero through Why trust are exactly one scrollport tall (900px at 1440×900; 768px at 1024×768). Final CTA is shorter (573px and 442px). None is taller than the scrollport, so all nine remain eligible. The actual `PublicHeader` is a fixed 81px overlay and the compositions already reserve unobscured visual space beneath it. Adding an 81px snap padding/margin would shrink the snapport and make the eight full-screen targets effectively oversized, so Home uses no snap offset.

### Founder correction — native scrollbar, sequential wheel and fully-open chapters

Home must expose the browser-native desktop scrollbar. The scrollbar thumb is the intentional non-sequential escape hatch: direct thumb dragging may cross several canonical compositions and is not intercepted, animated or forced through intermediate screens.

Fine-pointer wheel and trackpad navigation have a different contract. The exact runtime order is Hero, Recognition, A plan you can see, Missions 01–03, Missions 04–07, Missions 08–10, Built from evidence, Why trust, Final CTA and the real footer/end. A wheel or trackpad gesture may advance or reverse by at most one adjacent canonical destination; stronger deltas may not skip an intermediate composition. Direction reversal must remain responsive and must not inherit the removed 600ms lock.

The first implementation to verify is CSS-only: retain fine-pointer `y mandatory` and set `scroll-snap-stop: always` only on the canonical major Home sequence. The four prototype percentage markers and any internal reveal coordinates remain non-targets. CSS-only is retained only if Chromium and WebKit prove both sequential wheel/trackpad landing and unrestricted multi-screen native scrollbar-thumb dragging.

If either engine cannot satisfy both behaviours natively, the authorised fallback is limited to a fine-pointer vertical `wheel` controller. It may resolve one completed wheel intent to only the adjacent measured canonical destination. It must not attach to generic `scroll`, pointer or scrollbar events; must not prevent native thumb dragging; must not use a continuous frame loop, accumulator-driven multi-step consumption, 600ms lock, long suppression interval or smooth-scroll dependency; and must permit immediate reversal. Geometry is measured and cached outside steady-state wheel handling. Keyboard navigation stays browser-native.

Each Mission destination represents the panel's true fully-open coordinate, not its entrance-preview position. At rest the panel is a full viewport with final transform and border-radius state, and its chapter copy and stack indicator are visible under the existing runtime threshold (`raw <= 4px`). A non-visible stable snap anchor at the measured open coordinate is permitted; visible composition and entrance reveal are not changed. Equivalent landing correctness applies to all three Mission panels.

### Correction implementation disposition

The CSS-only candidate was tested first and rejected on measured behaviour. With canonical targets set to `scroll-snap-stop: always`, a single 5,000px wheel delta skipped from Hero to Built from evidence at 1440×900 and from Hero to Why trust at 1024×768. A 120px wheel delta also remained on Hero in both viewports. CSS alone therefore did not provide the required one-intent/one-adjacent-destination contract.

The authorised fine-pointer wheel-only fallback is selected. It caches the canonical destinations during existing geometry measurement, groups a momentum stream for 140ms, and sends one stream only to the adjacent destination using the browser's native smooth scroll. It has no accumulator, timer, long lock, continuous frame loop or generic `scroll`/pointer interception. Opposite-direction input immediately aborts an in-flight native smooth scroll and retargets the adjacent destination. Scrollbar dragging, keyboard, touch, coarse pointer and reduced-motion scrolling remain native.

Four stable one-pixel, negative-margin anchors identify the true open coordinates of the plan and Mission panels without changing visible layout. All three Mission destinations were measured in Chromium and WebKit at both required desktop viewports with `raw = 0`, chapter and indicator opacity `1`, transform `none`, border radius `0px` and full-viewport panel height.

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
| Native Home `y mandatory` plus the bounded adjacent fine-pointer wheel fallback; `y proximity` for coarse pointer; normal stops on canonical targets | 2026-08-19 Founder sequential-input correction; failed CSS-only `always` measurement; Chromium/WebKit evidence; Refero motion restraint/interruptibility guidance | Guarantees adjacent wheel/trackpad landings while preserving unrestricted native scrollbar-thumb travel and the less aggressive mobile policy |
| Mission destinations use the true cached panel-open coordinates | Founder full-open correction; existing `raw <= 4px` runtime authority | Preserves the approved photo entrance while guaranteeing complete copy and indicator visibility at rest |
| Native Home scrollbar remains visible | Founder correction; browser-native input model | Keeps direct multi-screen navigation available without a custom scrollbar or generic scroll interception |
| Cache geometry outside steady-state scroll frames | Browser performance evidence | Eliminates repeated layout reads and read/write thrashing |
| Event-driven RAF with spring-settle continuation only | Browser performance evidence | Stops idle animation work while preserving the photo depth effect |
| Static responsive AVIF/WebP candidates plus JPEG fallback | Existing first-party source assets and handoff renderer boundary | Avoids a renderer rewrite while reducing transfer cost and mobile overfetch |
| 460ms reveal with 60ms stagger | Founder requested 400–500ms / 50–70ms range; existing easing retained | Keeps the approved premium reveal language with faster response |
| Keep nonce CSP and dynamic root unchanged | Security boundary and RFC-033/RFC-034 | Rendering/security changes are outside scope |
| Keep public polish inside existing router/query components | Founder final-site polish instruction; detected `InstantDiscoveryForm` and Learn client filter | Preserves deep links and server classification without a new routing or state framework |
| Confirm existing sensitive authority immediately after signed access-session creation | Founder consent-flow instruction; RFC-021 purpose separation; RFC-022 `ProgrammeSensitiveInputAuthority` | Moves one existing affirmative action without weakening server evidence, withdrawal or claim semantics and requires no schema change |

## Boundaries

Except for the exact four-item Founder addendum above, this RFC does not authorise:

- a Home redesign, copy change, route or navigation change;
- a Programme content/reward/progression change, casino/offer data-model change, commercial change, comparison change or protected Help change;
- a schema, migration, database, provider, environment, auth or analytics change;
- removal of `force-dynamic`, `connection()`, nonce CSP or security headers;
- a new smooth-scroll dependency; or
- merge or Production deployment.

## Verification and release gates

The branch must pass focused structural/browser regressions, lint, typecheck, production build, existing Home/public browser coverage, affected CI suites and `git diff --check`. Browser verification must cover Chromium and WebKit at 1440×900 and 1024×768, mobile, reduced motion, visible native scrollbar structure/manual presence, sequential small/large/repeated trackpad-like wheel input, immediate direction reversal, PageDown/PageUp, Home/End, direct multi-screen scrollbar-thumb dragging, exact full-open Mission state, resize, footer reachability and navigation cleanup. It must assert fine-pointer `y mandatory`, coarse-pointer `y proximity`, exactly the approved canonical sequence, no generic scroll interception or long input lock and zero settled idle RAF/layout work. Visual comparison uses the merged RFC-034 Home evidence and Production as the locked references.

Delivery remains a Draft PR with an isolated Vercel Preview. Founder approval is required for any merge or Production action.

### Final public-site polish verification disposition

- **Detected:** focused Program AI, public-IA and Bonus directory suites pass `60/60`, `33/33` and `26/26`; typecheck and the production build pass.
- **Detected:** the scoped cross-engine matrix passes `14/14` in actual Chromium and WebKit. It covers enhanced/no-submit filtering, URL/history/deep-link state, single-action recovery, Learn combined live filtering, all eight three-check combinations, access-proof → session → sensitive-authority ordering, reload, withdrawal, no horizontal overflow and the locked Home composition at 1440×900, 1024×768 and 390×844.
- **Detected:** no Prisma schema or migration changed; an isolated local database successfully replayed all 19 existing migrations.
- **Not detected:** final hosted Preview and remote PR checks for this addendum. Local evidence does not authorise a product-freeze, merge or Production declaration; Founder acceptance remains mandatory.

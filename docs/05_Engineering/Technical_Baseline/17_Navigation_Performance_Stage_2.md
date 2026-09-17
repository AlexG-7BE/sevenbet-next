# Navigation Performance Stage 2 Evidence

## Evidence scope

| Field | Value |
| --- | --- |
| Evidence date | 2026-09-17 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Stage 1 baseline revision | `2bd71c8af2f5d96d9a97d990f8bc5442ef4f6a5b` |
| Stage 1 Production deployment | `dpl_GJPuS34GHk61m6XQHzXa3CxQYf2D` |
| Prior Stage 2 candidate | `44114cf4ef0ad06be5566e3a5579a8526ee88f3e` |
| Final implementation revision | `b493fbf4714002f4f5883fd3ca46f0ef77eb6492` |
| Candidate branch | `codex/navigation-performance-stage2` |
| Release state | Candidate only; not merged, promoted, or deployed to Production |

The Founder-supplied Stage 1 repository-wide source scan and live Production evidence were reused as instructed. Stage 2 re-verified the governing documents, every changed source/test surface, the exact archived Stage 1 source, and the matched candidate build. Dependencies, generated output, build artefacts, caches, test output, and `tsconfig.tsbuildinfo` are excluded from implementation claims.

## Implemented baseline

**DETECTED:** The public Header, mobile disclosure, ordinary Casinos/Learn links, account chrome, language control, and Footer now have stable server-rendered identity outside the commercial suspension boundary. Only Best Offers/Bonuses visibility and the corresponding Footer links stream from the existing canonical `resolveServerCommercialProductState` result. The whole Header/menu is no longer replaced when that result settles.

**DETECTED:** Mobile navigation is one styled native `<details>`/`<summary>` disclosure. It opens with pointer or keyboard input before hydration and with JavaScript disabled. The hydrated enhancement preserves that node, then adds Escape, focus restoration, ordinary-link close, desktop-resize cleanup, truthful `dialog`/`aria-modal` semantics, outside-content inerting, and bidirectional Tab containment. It does not create another menu, router, React root, or parallel state source. Native open state survives hydration because the same disclosure is enhanced rather than replaced.

**DETECTED:** Public and Programme language selectors have native disclosure baselines. Public choices are real server POST buttons and Programme choices are real localized anchors; JavaScript adds keyboard/outside-click conveniences but is not the only usable path.

**DETECTED:** Commercial resolution remains request-scoped and server-authoritative. Pending, rejected, and timed-out states expose no unverified commercial link or outbound action. A shared 1.5-second bound prevents an indefinitely held commercial read from keeping the initial streamed document open; the mobile commercial slot makes at most one path-scoped `router.refresh()` recovery attempt per unresolved episode, then resets after settlement or path departure. The isolated rejection and local trusted-GEO seams require explicit CI opt-in plus matching disposable loopback PostgreSQL `_ci` URLs and reject deployed Vercel metadata.

**DETECTED:** Best Offers, Casinos, Bonuses, and Learn now have the same canonical source/DOM, keyboard, assistive-technology, and visual order in desktop navigation, mobile navigation, and the Explore Footer group. The former CSS-only `order` correction was removed.

**DETECTED:** The stable Footer initially made its ordinary Next links eligible for automatic speculative requests. Matched measurement exposed the changed boundary (13 versus 1 RSC attempts). `prefetch={false}` is now explicit on every Footer link, restoring 1 versus 1 while preserving normal native/App Router navigation.

**DETECTED:** Best Offers/Bonuses parallel reads, request-scoped Article reuse, scoped content streaming, neutral navigation feedback, and disabled automatic primary-route prefetch remain unchanged. There is no schema, migration, dependency, commercial-policy, trusted-GEO policy, ranking, action-authority, authentication, consent, Programme-logic, analytics-event, provider, or Production configuration change.

## Matched performance evidence

The original Stage 1 comparison remains valid historical evidence for the overall improvement: against `2bd71c8a…`, the earlier Stage 2 candidate added painted feedback and lowered B/C medians for all four primary destinations under its documented one-Casino/one-Article desktop condition. The final-hardening comparison below does not mix that baseline with the new experiment.

### Final hardening: 44114cf → final candidate

Conditions: Chromium 149 headless; 390×844 mobile; trusted PE in two localhost production runtimes; identical isolated PostgreSQL data with 15 synthetic published Casinos, varied active/draft/paused/expired/future/no-offer states, five synthetic published Articles, and one exact governed PE action route; guaranteed-unprefetched primary links; seven alternating samples per version/condition. Normal has no CPU/network throttle. Constrained uses 4× CPU slowdown, 100 ms RTT, 1.6 Mbps download, and 0.75 Mbps upload. A is input to first painted navigation feedback, B is meaningful destination identity, and C is actual useful cards/article content. Values are median milliseconds with observed range, not field percentiles. Because 44114cf predates the committed local trusted-GEO seam, its build received the same guarded CI + loopback `_ci` harness adapter as the final build; that build-only adapter was removed from the archived source worktree immediately after compilation and made no Header/client behavior change.

| Normal mobile | A: 44114cf → final | B: 44114cf → final | C: 44114cf → final |
| --- | ---: | ---: | ---: |
| Best Offers | 26.8 [25.3–28.6] → **42.4** [39.4–47.2] | 93.5 [87.7–99.5] → **90.3** [89.7–107.1] | 93.8 [88.4–99.8] → **90.5** [89.9–107.3] |
| Casinos | 27.4 [25.2–28.8] → **43.7** [41.9–46.4] | 97.2 [94.7–103.5] → **100.4** [94.2–108.2] | 97.4 [94.8–103.7] → **100.5** [94.3–108.3] |
| Bonuses | 26.7 [19.7–27.6] → **42.0** [39.6–53.2] | 125.0 [119.5–128.9] → **125.4** [119.1–131.9] | 125.1 [119.6–129.9] → **125.6** [119.2–132.0] |
| Learn | 28.3 [27.1–30.1] → **54.0** [43.2–56.3] | 61.2 [60.1–69.6] → **62.4** [60.4–76.0] | 61.6 [60.3–70.0] → **62.6** [60.5–76.1] |

| Constrained mobile | A: 44114cf → final | B: 44114cf → final | C: 44114cf → final |
| --- | ---: | ---: | ---: |
| Best Offers | 50.4 [48.8–56.5] → **64.5** [60.3–83.7] | 1,086.9 [1,066.1–1,109.0] → **1,102.0** [1,088.9–1,107.4] | 1,087.0 [1,066.3–1,109.2] → **1,102.8** [1,089.4–1,107.9] |
| Casinos | 50.1 [47.8–56.3] → **63.6** [60.9–70.4] | 1,168.8 [1,150.8–1,174.7] → **1,145.2** [1,117.6–1,152.0] | 1,169.3 [1,151.1–1,174.9] → **1,145.4** [1,117.8–1,152.1] |
| Bonuses | 49.2 [48.4–57.4] → **64.8** [62.0–79.0] | 1,252.9 [1,233.7–1,276.1] → **1,226.2** [1,215.7–1,232.4] | 1,253.2 [1,233.8–1,276.2] → **1,226.7** [1,215.8–1,232.6] |
| Learn | 45.9 [44.2–48.1] → **65.3** [62.6–69.4] | 382.5 [367.0–401.2] → **376.8** [370.1–399.9] | 382.9 [367.9–401.7] → **377.2** [370.6–400.6] |

**DETECTED:** Every final A sample is below the declared 200 ms target; the slowest observed final A was 83.7 ms. Final B/C medians differ from 44114cf by −3.3 to +3.2 ms normally and −26.7 to +15.8 ms constrained. No repeatable material B/C regression remains.

### M: first usable menu while commercial data is held

The real canonical commercial read was kept unresolved by an `ACCESS EXCLUSIVE` `CasinoVersion` lock acquired before the request. Navigation began with `waitUntil: "commit"`; the browser did not wait for document completion or `networkidle`, used a real pointer click, and verified the lock transaction was still unresolved after the result.

| Condition | 44114cf | Final candidate |
| --- | ---: | ---: |
| Normal mobile | **0/7 succeeded within 1 s**; visible control remained unusable | **7/7 succeeded**; painted-open median **129.1 ms** [105.3–140.4] |
| Constrained mobile | **0/7 succeeded within 1 s**; visible control remained unusable | **7/7 succeeded**; painted-open median **154.1 ms** [146.5–163.9] |

Every final sample had exactly one Header and one mobile menu at input time, opened while the dependency remained held, and exposed both ordinary Casinos and Learn links.

### Initial Home resources

| Metric | 44114cf median | Final median | Delta |
| --- | ---: | ---: | ---: |
| Encoded resource bytes | 403,544 | 404,314 | +770 (+0.19%) |
| Transfer bytes | 412,544 | 413,314 | +770 (+0.19%) |
| JavaScript encoded bytes | 150,364 | 150,883 | +519 (+0.35%) |
| Resource count | 31 | 31 | 0 |
| RSC request count | 1 | 1 | 0 |
| Long tasks / duration | 0 / 0 ms | 0 / 0 ms | 0 |

## Correctness and regression evidence

**DETECTED:** The old held-read regression now requires desired behavior. In restricted KZ and supported PE, a real click opens the native menu and a pointer click on Casinos initiates either the native document request or hydrated RSC request while the lock remains held. The test releases the database only after that proof. Three repeated targeted WebKit runs passed before the broader engine matrix.

**DETECTED:** Separate release-order tests cover JavaScript/hydration before commercial completion and commercial completion before JavaScript/hydration. An open German menu retains the same marked Header/disclosure nodes, focus on Casinos, meaningful menu scroll, selected language, and open state while commercial links stream. A timeout-specific test keeps the menu open past 1.5 seconds, proves one non-prefetch recovery refresh rather than a loop, releases the real read, and verifies commercial links insert without node/focus/scroll replacement.

**DETECTED:** JavaScript-disabled browser input opens the actual native mobile menu and activates the real language POST control. The suite also covers pointer/keyboard open-close-reopen, nested-disclosure Escape order, outer dialog semantics, background inerting, forward/backward Tab containment, focus restoration, scroll-lock cleanup, desktop resize, modifier/new-tab/hash behavior, rapid transitions, cancellation/failure, Back/Forward, neutral feedback cleanup, no commercial-link/action flash, canonical DOM order, localized German navigation, KZ/PE isolation, Home and all four primary routes, casino detail, populated Learn category/article, truthful missing/empty states, and no forced full-document reload after hydration.

**DETECTED:** The representative repository/service test returns 15 unique Casinos and five Articles, exercises mixed offer states, exactly one governed action, deterministic repeated selection/ranking/localization, and verifies concurrent identical discovery work collapses to one published read, one offer read, and one context read on a single-connection path. Browser projections for one Best Offer, all 15 Casino cards, eight eligible Bonus cards, and the representative Article are byte-for-byte equivalent between 44114cf and final after both streamed article sections settle.

**DETECTED:** Final-tree local verification completed: production build, lint, typecheck, `git diff --check`, public-IA structural 36/36, Stage 2 structural/safety 7/7, representative PostgreSQL 2/2, Programme 154/154, auth/communications 56/56, internationalisation 65/65, commercial UX 15/15, public-integrity 65/65, shared Header/auth/geometry browser 8/8, Chromium Stage 2 12/12 applicable plus one intentional rejection-only skip, targeted WebKit 7/7, and isolated rejected-state Chromium 1/1 passed. Protected-Help/public-IA browser coverage passed 22 applicable checks; its one clean-empty-Article assertion was not applicable to the intentionally populated five-Article representative database and is exercised by clean-database CI. The focused independent reviewer found four material issues—DOM order, modal focus containment, nested Programme Escape propagation, and retry lifetime/CI coverage—which were corrected and re-reviewed; final disposition is no remaining blocking/material implementation finding. Required GitHub CI and exact Preview identity are recorded in the PR description after the final push.

## Limitations, rollback, and release boundary

- **UNKNOWN:** Production field INP, user-network latency, provider latency, database tail latency, and high-percentile behavior cannot be established by this localhost lab.
- **INFERRED:** Fifteen Casinos and five Articles are comparable to the Stage 1 observed card count and materially stronger than the continuity fixture, but still do not establish Production-scale or tail-latency behavior.
- **DETECTED:** Programme routes retain their pre-existing layout-level commercial-state await; the stable streamed public-layout result must not be generalized to Programme routes.
- **DETECTED:** The timeout does not cancel the underlying Prisma read, so it can briefly overlap the single recovery refresh. The registry prevents a same-episode refresh loop and resets after settlement or path departure.
- **DETECTED:** With JavaScript disabled, the native disclosure and language controls remain usable, but hydrated dialog semantics, inerting, and focus containment are necessarily absent.
- **DETECTED:** The 1.5-second bound is fail closed. If the canonical state stays unavailable, basic editorial navigation remains usable, commercial links remain absent, and the client makes at most one same-path recovery refresh; it does not poll or cache commercial permission across users.
- **DETECTED:** Rollback is code-only: revert the final hardening commit(s) or redeploy the previously approved candidate. There is no migration, data rewrite, provider change, or feature-flag dependency to reverse.
- **DETECTED:** The candidate is not released to Production. Founder review and explicit approval remain required before merge or promotion.

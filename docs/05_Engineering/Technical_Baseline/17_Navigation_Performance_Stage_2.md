# Navigation Performance Stage 2 Evidence

## Evidence scope

| Field | Value |
| --- | --- |
| Evidence date | 2026-09-17 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Stage 1 baseline revision | `2bd71c8af2f5d96d9a97d990f8bc5442ef4f6a5b` |
| Stage 1 Production deployment | `dpl_GJPuS34GHk61m6XQHzXa3CxQYf2D` |
| Stage 2 implementation revision | `03649c8ceb0f61d0318e85942b411f7dd2a59867` |
| Candidate branch | `codex/navigation-performance-stage2` |
| Release state | Candidate only; not merged, promoted, or deployed to Production |

The Founder-supplied Stage 1 repository-wide source scan and live Production evidence were reused as instructed. Stage 2 re-verified the governing documents, every changed source/test surface, the exact archived Stage 1 source, and the matched candidate build. Dependencies, generated output, build artefacts, caches, test output, and `tsconfig.tsbuildinfo` are excluded from implementation claims.

## Implemented baseline

**DETECTED:** The public shell starts commercial availability resolution without blocking initial shell output, then streams fail-closed editorial-only Header and Footer fallbacks until the canonical state resolves. The availability query retains the existing published Casino projection and canonical action authority but does not construct the full offer-presentation corpus merely to answer the shell's existence question.

**DETECTED:** Best Offers and Bonuses start the canonical commercial-state promise before their route data work and await independent work concurrently. Learning article metadata/page reads use one request-scoped cached Article lookup, while related Article data streams in a separate Suspense boundary.

**DETECTED:** The public shell owns one neutral live-region feedback element. Native Next Link transitions report through `useLinkStatus`; captured Home/Learn HTML retains real server-rendered `href` values and receives a bounded hydrated App Router enhancement. Modifier keys, external links, downloads, same-document links, no-JavaScript navigation, error cleanup, rapid transitions, focus, Escape, and reduced motion remain covered.

**DETECTED:** Automatic prefetch is disabled on the four primary navigation destinations. A measured intent-prefetch prototype was rejected because it produced no navigation benefit in the matched fixture. Route-level primary loading files were also rejected because they delayed already-fast real content by about 300 ms in this Next.js route shape. The retained Home Suspense frame and global feedback preserve truthful, design-compatible progress without that penalty.

**DETECTED:** There is no schema, migration, dependency, canonical routing, commercial authority, analytics-event, or provider change.

## Matched performance evidence

Conditions: Chromium 149 headless, 1365×900, no CPU/network throttling, seven samples per condition, exact archived base versus the exact candidate production build, trusted PE inside an isolated Preview-shaped localhost runtime, and the same disposable one-Casino/one-Article PostgreSQL fixture. A is click/input to first painted explicit feedback; B is destination-content identity; C is real destination content. Values are median milliseconds with observed range in brackets. They are controlled lab timings, not field INP percentiles.

### New-context, guaranteed-unprefetched navigation

| Destination | A: base → candidate | B: base → candidate | C: base → candidate |
| --- | ---: | ---: | ---: |
| Best Offers | none → **50.8** [41.0–58.2] | 151.9 [105.1–186.0] → **88.2** [81.5–95.0] | 152.1 [105.3–186.1] → **88.8** [82.1–95.2] |
| Casinos | none → **52.3** [43.4–55.5] | 152.9 [99.2–258.8] → **86.1** [73.9–88.4] | 153.1 [99.4–260.3] → **86.2** [74.1–88.5] |
| Bonuses | none → **47.7** [41.0–52.4] | 148.8 [101.4–159.6] → **100.0** [95.0–102.5] | 148.9 [101.6–159.8] → **100.2** [95.2–103.2] |
| Learn | none → **58.2** [45.5–59.8] | 123.4 [98.3–145.4] → **58.4** [52.4–60.0] | 123.6 [98.6–145.6] → **59.2** [53.1–60.2] |

All four destinations meet the declared A target of a first painted response below 200 ms in every observed sample. Candidate B/C medians are lower for all four destinations.

### Repeat navigation in one tab

| Destination | A: base → candidate | B: base → candidate | C: base → candidate |
| --- | ---: | ---: | ---: |
| Best Offers | none → **43.9** [42.9–68.1] | 64.3 [59.9–126.5] → **44.1** [43.1–126.6] | 64.5 [60.1–126.8] → **44.2** [43.2–126.8] |
| Casinos | none → **44.8** [43.3–73.8] | 60.4 [59.5–117.2] → **45.0** [43.8–113.5] | 60.6 [60.0–117.4] → **45.3** [44.0–113.7] |
| Bonuses | none → **45.4** [43.0–70.2] | 61.0 [59.4–122.8] → **45.6** [43.1–136.5] | 61.2 [59.6–123.5] → **46.6** [43.3–137.1] |
| Learn | none → **45.4** [42.9–70.5] | 61.9 [59.5–95.9] → **45.7** [43.1–107.7] | 62.2 [59.7–96.1] → **45.9** [43.2–107.9] |

**DETECTED:** A separate prefetched final state is not applicable because primary-route prefetch is intentionally disabled after measurement. The rejected intent-prefetch experiment remains non-product test evidence and is not part of the candidate.

### Initial Home resource sample

| Metric | Base median | Candidate median | Delta |
| --- | ---: | ---: | ---: |
| Encoded resource bytes | 554,924 | 557,252 | +2,328 (+0.42%) |
| Transfer bytes | 565,124 | 566,552 | +1,428 (+0.25%) |
| JavaScript encoded bytes | 148,884 | 150,581 | +1,697 (+1.14%) |
| Resource count | 34 | 31 | −3 |
| Speculative RSC requests / bytes | 6 / 838 | 2 / 284 | −4 / −554 |
| Long tasks / duration | 1 / 54 ms | 0 / 0 ms | median improved |

The observed long-task ranges were base 0–1 task / 0–57 ms and candidate 0–1 task / 0–60 ms.

## Correctness and regression evidence

- **DETECTED:** Exact-base/candidate browser projections were identical for visible text and internal links on Best Offers, Casinos, Bonuses, and the real seeded Article.
- **DETECTED:** `npm run ci:quality` passed under the repository CI major version, Node 24; the separate full Programme suite passed 154/154.
- **DETECTED:** The full disposable migration gate passed all 43 migrations and compatibility checks; Prisma schema validation passed.
- **DETECTED:** The exact Preview-shaped production build passed its database-connection-shape preflight, compilation, lint/type validity, static generation, and trace collection.
- **DETECTED:** The focused Chromium suite passed 5/5 on the exact build. It covers all primary links, Best Offers explicitly, Home, both detail entry points, a real populated category redirect and Article, category filtering, valid/missing category and missing Article status, back/forward, no document reloads, supported/restricted GEO isolation, mobile menu closure, exact feedback colors, first-painted mobile feedback below 200 ms, a 1.2-second delayed RSC response, reduced motion, Escape/focus, rapid links, failed RSC cleanup, language-query preservation, empty localized data, and no-JavaScript href/Article behavior.
- **DETECTED:** Commercial/domain tests passed 124/124; deterministic structural tests passed 347/347 plus six legal/product-boundary tests; Article/Learn, Public IA, Home, canonical-host, presentation, branding, and service-equivalence suites passed.
- **DETECTED:** Two captured-handoff inline-style CSP violations were reproduced byte-for-byte against the exact Stage 1 base and filtered narrowly in this focused suite. No new console, hydration, or CSP error was accepted.
- **DETECTED:** Independent read-only review found a candidate CSS custom-property scope defect and populated Learn journey/status coverage gaps. The token scope and exact computed-color assertions were corrected, the missing journeys/status checks were added, and the exact build, focused browser suite, and matched n=7 measurements were rerun after correction. No blocking review finding remains.

## Limitations, rollback, and release boundary

- **UNKNOWN:** Production field INP, user-network latency, provider latency, database tail latency, and high-percentile behavior cannot be established by this localhost lab.
- **INFERRED:** The one-record fixture is sufficient to compare the governed route mechanics and output equivalence, but it does not establish performance under the full Production catalogue cardinality.
- **INFERRED:** The bounded shell query reduces work while keeping the same canonical authority; Production impact still requires read-only observation after an approved release.
- **INFERRED:** On an unusually slow commercial-state read, Suspense replaces fail-closed Header/Footer fallback subtrees after hydration. An open mobile menu could reset, and Home's initial footer resize observer could remain attached to the fallback footer. This was not observed in the delayed-route coverage and does not change data or authority, but it remains a post-release observation point.
- **DETECTED:** Rollback is code-only: revert the Stage 2 commits or redeploy the previously approved `2bd71c8af2f5d96d9a97d990f8bc5442ef4f6a5b` build. There is no migration, data rewrite, provider change, or feature-flag dependency to reverse.
- **DETECTED:** The candidate is not released to Production. Founder review and explicit approval remain required before merge or promotion.

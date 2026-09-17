# Navigation Performance Stage 2 Evidence

## Evidence scope

| Field | Value |
| --- | --- |
| Evidence date | 2026-09-17 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Stage 1 baseline revision | `2bd71c8af2f5d96d9a97d990f8bc5442ef4f6a5b` |
| Stage 1 Production deployment | `dpl_GJPuS34GHk61m6XQHzXa3CxQYf2D` |
| Stage 2 implementation revisions | `03649c8ceb0f61d0318e85942b411f7dd2a59867`, `4c94fac358c377be53ae71f0c29db6417b756c91` |
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
| Best Offers | none → **45.4** [38.8–51.3] | 136.4 [100.2–154.6] → **87.1** [84.0–95.4] | 136.9 [100.5–154.8] → **87.8** [84.1–95.6] |
| Casinos | none → **50.1** [41.8–54.7] | 146.0 [100.7–163.6] → **84.8** [75.1–89.0] | 146.2 [100.8–163.8] → **85.0** [75.3–89.2] |
| Bonuses | none → **51.0** [44.3–55.0] | 112.3 [100.9–163.9] → **103.1** [100.0–105.0] | 112.6 [101.1–164.2] → **103.3** [100.7–105.2] |
| Learn | none → **56.3** [44.9–61.5] | 140.4 [125.3–165.3] → **57.6** [53.7–62.5] | 140.6 [125.5–165.5] → **58.1** [53.8–62.7] |

All four destinations meet the declared A target of a first painted response below 200 ms in every observed sample. Candidate B/C medians are lower for all four destinations.

### Repeat navigation in one tab

| Destination | A: base → candidate | B: base → candidate | C: base → candidate |
| --- | ---: | ---: | ---: |
| Best Offers | none → **45.0** [43.5–70.5] | 63.4 [60.0–119.4] → **45.2** [43.7–129.0] | 63.5 [60.4–119.6] → **45.6** [43.8–129.2] |
| Casinos | none → **45.9** [42.5–72.8] | 60.8 [59.6–123.4] → **46.1** [42.7–141.2] | 61.0 [59.8–123.5] → **46.7** [42.9–141.4] |
| Bonuses | none → **45.2** [43.1–67.2] | 59.7 [59.4–121.1] → **45.4** [43.3–132.9] | 59.9 [59.6–121.3] → **45.5** [43.5–133.6] |
| Learn | none → **45.2** [43.6–92.5] | 62.5 [45.6–115.9] → **47.7** [43.8–93.0] | 62.7 [45.7–116.1] → **47.9** [44.0–93.1] |

**DETECTED:** A separate prefetched final state is not applicable because primary-route prefetch is intentionally disabled after measurement. The rejected intent-prefetch experiment remains non-product test evidence and is not part of the candidate.

### Initial Home resource sample

| Metric | Base median | Candidate median | Delta |
| --- | ---: | ---: | ---: |
| Encoded resource bytes | 554,924 | 557,411 | +2,487 (+0.45%) |
| Transfer bytes | 565,124 | 566,711 | +1,587 (+0.28%) |
| JavaScript encoded bytes | 148,884 | 150,707 | +1,823 (+1.22%) |
| Resource count | 34 | 31 | −3 |
| Speculative RSC requests / bytes | 6 / 838 | 2 / 288 | −4 / −550 |
| Long tasks / duration | 1 / 52 ms | 1 / 54 ms | +0 / +2 ms |

The observed long-task ranges were base 0–1 task / 0–58 ms and candidate 0–1 task / 0–56 ms.

## Correctness and regression evidence

### Streamed Header pre-release closure

**NOT REPRODUCED UNDER THE CONTROLLED TEST:** The documented already-open-menu reset could not be reached in the installed Next.js 15.5.24 / React runtime. The focused browser test acquires an `ACCESS EXCLUSIVE` transaction lock on `CasinoVersion` in the disposable localhost `_ci` database before navigation, which holds the real server-side canonical-action read. Chromium then starts `/en` with `waitUntil: "commit"`, without waiting for the streamed document to finish. In both trusted KZ and trusted PE, the fail-closed Header was visible with one Header, one menu trigger, no Best Offers/Bonuses links, no `/r/` action, and the correct localized Home href while the transaction remained locked.

**DETECTED:** The held fallback did not receive React's click props, and a real DOM click left `aria-expanded="false"` and the dialog closed. Releasing the database transaction completed the real commercial-state calculation; a test marker on the fallback Header disappeared, directly demonstrating replacement at the intended Suspense boundary. Only the replacement Header then received the click handler. Therefore an already-open *hydrated fallback* menu was not possible under this controlled runtime, even though the actual replacement occurred. This is evidence that the issue was not reproduced under test, not proof that a future runtime can never hydrate the fallback.

**DETECTED:** After release, the KZ result remained editorial-only without a commercial-link/action flash. The isolated PE canonical route produced the supported Header links only after authority resolved. Both final Headers passed open, focus, Escape, close, reopen, scroll-lock, `aria-expanded`, dialog visibility, single-Header/menu, language-control, localized-href, and delayed destination-feedback checks. The two boundary cases passed 2/2 and the complete focused Stage 2 Chromium suite passed 7/7. No application behavior changed; the retained regression and documentation are the only repository changes for this closure.

- **DETECTED:** Exact-base/candidate browser projections were identical for visible text and internal links on Best Offers, Casinos, Bonuses, and the real seeded Article.
- **DETECTED:** `npm run ci:quality` passed under the repository CI major version, Node 24; the separate full Programme suite passed 154/154.
- **DETECTED:** The full disposable migration gate passed all 43 migrations and compatibility checks; Prisma schema validation passed.
- **DETECTED:** The exact Preview-shaped production build passed its database-connection-shape preflight, compilation, lint/type validity, static generation, and trace collection.
- **DETECTED:** The focused Chromium suite passed 7/7 on the exact build. It covers the two controlled streamed-Header cases plus all primary links, Best Offers explicitly, Home, both detail entry points, a real populated category redirect and Article, category filtering, valid/missing category and missing Article status, back/forward, no document reloads, supported/restricted GEO isolation, mobile menu closure, exact feedback colors, first-painted mobile feedback below 200 ms, delayed RSC responses, reduced motion, Escape/focus, rapid links, failed RSC cleanup, language-query preservation, empty localized data, and no-JavaScript href/Article behavior.
- **DETECTED:** The first PR browser run exposed fallback-width overflow and a stale fallback-Footer measurement in the streamed Home shell. After correction, all three implicated browser files passed 32/32, including the five mobile Footer widths, the full public-route geometry matrix, and localized responsive geometry.
- **DETECTED:** Commercial/domain tests passed 124/124; deterministic structural tests passed 347/347 plus six legal/product-boundary tests; Article/Learn, Public IA, Home, canonical-host, presentation, branding, and service-equivalence suites passed.
- **DETECTED:** Two captured-handoff inline-style CSP violations were reproduced byte-for-byte against the exact Stage 1 base and filtered narrowly in this focused suite. No new console, hydration, or CSP error was accepted.
- **DETECTED:** Independent read-only review found a candidate CSS custom-property scope defect, populated Learn journey/status coverage gaps, and a possible stale fallback-Footer observer. The token scope and exact computed-color assertions were corrected, the missing journeys/status checks were added, the observer now rebinds after streamed replacement, and the exact build, focused browser suite, affected CI files, and matched n=7 measurements were rerun after correction. No blocking review finding remains.

## Limitations, rollback, and release boundary

- **UNKNOWN:** Production field INP, user-network latency, provider latency, database tail latency, and high-percentile behavior cannot be established by this localhost lab.
- **INFERRED:** The one-record fixture is sufficient to compare the governed route mechanics and output equivalence, but it does not establish performance under the full Production catalogue cardinality.
- **INFERRED:** The bounded shell query reduces work while keeping the same canonical authority; Production impact still requires read-only observation after an approved release.
- **DETECTED:** Under an explicitly held commercial-state read, the installed runtime leaves the visible Header fallback unhydrated and replaces it before the mobile trigger becomes interactive, so the documented already-open-menu reset was not reproduced. The retained regression will expose a future runtime change that makes fallback hydration reachable; the remaining limitation is that the fallback itself is not interactive during the held interval.
- **DETECTED:** Rollback is code-only: revert the Stage 2 commits or redeploy the previously approved `2bd71c8af2f5d96d9a97d990f8bc5442ef4f6a5b` build. There is no migration, data rewrite, provider change, or feature-flag dependency to reverse.
- **DETECTED:** The candidate is not released to Production. Founder review and explicit approval remain required before merge or promotion.

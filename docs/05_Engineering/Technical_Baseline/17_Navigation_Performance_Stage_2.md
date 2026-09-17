# Navigation Performance Stage 2 Evidence

## Evidence identity and release boundary

| Field | Value |
| --- | --- |
| Evidence date | 2026-09-17 |
| Repository | `AlexG-7BE/sevenbet-next` |
| Active evidence checkout | `/private/tmp/sevenbet-nav-stage2` |
| Candidate branch | `codex/navigation-performance-stage2` |
| Approved pre-hardening head | `85391bfc4bdc5ac80eb629caca4ffe454848e531` |
| Final implementation commit | `dc235990106ecaeb908a97a416679d5c796b2a00` |
| Pull request | `#302` |
| Release state | Candidate only; not merged or deployed to Production |

The governing documents, relevant active RFCs, changed source and tests, and the exact `85391bfc…` comparison worktree were inspected. Generated directories, dependencies, caches, build artefacts, raw browser traces, and database files are excluded from implementation claims and from the outgoing diff. GitHub CI, Preview identity, and live Preview verification are **UNKNOWN** until the final candidate is pushed and those systems report results for its exact head.

## Corrected behavior and root cause

**DETECTED:** The `85391bfc…` candidate made the Header and mobile disclosure usable before commercial state settled. The remaining route-opening delay came from repeated public editorial/activation database work on every navigation, serial discovery reads, relation-shaped market-activation queries, and product-catalog imports in compact route error boundaries. Casino detail also produced two RSC requests because an eligible primary detail link could be prefetched and then activated.

**DETECTED:** Final implementation moves reusable published editorial projections behind country-, locale-, language-, slug-, and presentation-aware Next Data Cache keys with a 60-second fallback TTL. Casino and Article publication workflows invalidate their corresponding tags, including the PUBLISHED-to-DRAFT request-changes path. Request-specific commercial authorization, trusted GEO resolution, identity/session data, Programme state, and outbound actions are never stored in that cache.

**DETECTED:** Public discovery now resolves offers and slug aliases in parallel. Market activation uses one parameterized joined query instead of approximately six relation round trips. Casino detail caches only the published editorial DTO and resolves the exact request-specific action afterward. Best Offers, Casinos, Bonuses, Learn, Casino detail, and Article detail retain the same canonical eligibility, ranking, localization, fail-closed destination, and commercial-state rules.

**DETECTED:** Primary navigation remains deliberately unprefetched. `TrackedReviewLink` and Casino-card detail links also disable automatic prefetch, preventing request-specific GEO/action RSC reuse across a later activation. Each measured activation issues one destination RSC request. The small transition feedback is link-local, appears on eligible ordinary activation, and ignores modified clicks, new-tab/download links, same-page hashes, and cancelled transitions.

**DETECTED:** Compact route error boundaries no longer import the 155 KB product catalog. Primary commercial transitions load about 25 KB of encoded post-activation JavaScript rather than about 85 KB at the approved baseline. Learn remains about 0.2 KB. Initial Home resources are effectively unchanged.

## Cache, safety, and invalidation boundaries

- Published Casino snapshots are partitioned by exact country; projected offers and editorial DTOs also include the presentation language or slug required by their output.
- Published Article lists and detail records are partitioned by validated locale, category, slug, limit, and exclusion inputs. Dynamic cache-key inputs are length- and character-bounded before use.
- Request-scoped React cache keys contain the full serialized action-authority inputs. Concurrent PE and KZ requests cannot share an action result.
- Administrative publish, revise, archive, and request-changes mutations invalidate the relevant Casino or Article tags. The TTL is a bounded fallback, not the primary freshness mechanism.
- The guarded cache-bypass seam used by database-lock tests requires CI mode, an explicit opt-in, a loopback PostgreSQL database ending in `_ci`, and absence of Vercel/Production metadata.
- A timed-out Prisma query is not cancelled by the driver and can overlap one later refresh. The existing same-episode refresh bound remains fail closed and prevents a retry loop.

## Controlled measurement method

Measurements used Chromium 149 headless, a production Next build, a disposable local PostgreSQL cluster, 15 published Casino fixtures, five published Articles, and one exact governed PE action. Each result below is 20 valid samples with a fresh browser context and one actual pointer activation per sample. A is input to first painted feedback; B is painted meaningful destination identity; C is painted useful destination content after two animation frames. Values are median / p95 milliseconds unless a range is shown. RSC counts come from Resource Timing entries containing `_rsc`; post-activation JavaScript is encoded bytes. No primary-route prefetch was allowed.

Normal mobile is 390×844 with no artificial CPU or network throttling. Normal desktop is 1440×900. Constrained mobile uses 4× CPU slowdown, 100 ms RTT, approximately 1.6 Mbps download, and 0.75 Mbps upload. Warm/repeat measurements reuse a visited route and its already-loaded chunks. Cache-bypass runs use the guarded local seam and approximate an editorial cache miss without altering application behavior.

## Primary navigation: exact baseline versus final

### Normal mobile, cold context

| Destination | `85391bfc…` A | Final A | `85391bfc…` C | Final B / C | Final C observed range | Final RSC / JS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Best Offers | 96.4 / 101.5 | **58.5 / 59.8** | 144.9 / 158.1 | **124.6 / 126.6** | 123.5–141.2 | 1 / 24,819 B |
| Casinos | 95.8 / 98.7 | **58.1 / 61.3** | 148.2 / 152.3 | **128.2 / 142.6** | 125.8–144.9 | 1 / 25,320 B |
| Bonuses | 98.3 / 103.4 | **57.4 / 63.1** | 151.8 / 165.2 | **129.8 / 141.6** | 127.1–142.4 | 1 / 25,682 B |
| Learn | 105.2 / 110.8 | **61.3 / 66.2** | 111.8 / 115.2 | **108.2 / 109.5** | 96.2–110.7 | 1 / 196 B |

All final normal-mobile A, B, and C medians are inside the Founder's 100–300 ms route-opening target where applicable; feedback A is below 100 ms. Every sample produced useful content, one destination RSC request, and zero long tasks.

### Normal desktop, cold context

| Destination | Final A | Final C |
| --- | ---: | ---: |
| Best Offers | 67.0 / 69.1 | **124.7 / 126.9** |
| Casinos | 67.2 / 68.5 | **124.6 / 141.3** |
| Bonuses | 66.7 / 67.8 | **129.1 / 141.8** |
| Learn | 64.9 / 68.0 | **97.2 / 109.7** |

### Warm/repeat

| Destination | Mobile A | Mobile C | Desktop A | Desktop C |
| --- | ---: | ---: | ---: | ---: |
| Best Offers | 31.9 / 33.1 | 44.2 / 46.2 | 30.4 / 32.3 | 45.4 / 46.7 |
| Casinos | 41.4 / 45.4 | 49.4 / 61.8 | 37.4 / 42.6 | 45.5 / 61.6 |
| Bonuses | 37.0 / 41.6 | 45.6 / 61.4 | 34.4 / 40.1 | 45.0 / 47.0 |
| Learn | 36.8 / 40.4 | 45.2 / 61.4 | 31.6 / 37.9 | 46.4 / 47.9 |

Warm activations still issue one RSC request, load zero additional JavaScript bytes after resource-timing reset, and preserve actual route execution rather than substituting a local view switch.

### Constrained mobile

| Destination | Final A | Final C |
| --- | ---: | ---: |
| Best Offers | 96.1 / 115.8 | 727.6 / 743.5 |
| Casinos | 96.6 / 114.8 | 766.1 / 784.1 |
| Bonuses | 97.5 / 115.1 | 808.9 / 883.5 |
| Learn | 97.7 / 114.5 | 405.3 / 428.0 |

**DETECTED:** Immediate feedback remains below 200 ms at p95 under the declared throttle. Useful content honestly exceeds 300 ms because the artificial RTT/bandwidth/CPU dominates the RSC transfer and render; these results are not represented as meeting the normal-condition target.

## Secondary routes and cache-miss resilience

| Route, normal mobile | Final A | Final B / C | RSC / JS |
| --- | ---: | ---: | ---: |
| Casino detail | 59.5 / 60.3 | 106.2 / 108.6 | 1 / 8,065 B |
| Article detail | 67.1 / 68.7 | 108.2 / 114.3 | 1 / 1,754 B |

The approved baseline Casino-detail activation was 92.3 / 118.7 ms A and 133.1 / 136.3 ms C with two RSC requests. The final route is faster and produces one RSC request. Under constrained mobile, final Casino detail C is 537.1 / 545.9 ms and Article C is 515.7 / 535.2 ms.

| Cache-bypass route, normal mobile | A | C |
| --- | ---: | ---: |
| Best Offers | 64.9 / 76.0 | 136.8 / 149.5 |
| Casinos | 65.9 / 72.2 | 144.5 / 170.2 |
| Bonuses | 63.7 / 67.7 | 146.8 / 154.8 |
| Learn | 64.9 / 68.1 | 110.9 / 118.5 |
| Casino detail | 64.4 / 67.2 | 116.4 / 127.3 |
| Article detail | 68.1 / 71.9 | 108.7 / 113.6 |

All normal cache-bypass medians remain inside 100–300 ms for useful content, so the result does not depend solely on a persistent cache hit.

## Database and resource evidence

| Route | Baseline queries / SQL / TTFB | Final cache miss queries / SQL / TTFB | Final cache hit queries / SQL / TTFB |
| --- | ---: | ---: | ---: |
| Best Offers | 15 / 3.864 / 36.684 ms | 6 / 4.840 / 274.168 ms¹ | 2 / 0.322 / 27.060 ms |
| Casinos | 16 / 3.856 / 44.991 ms | 6 / 4.188 / 71.482 ms | 3 / 1.573 / 32.609 ms |
| Bonuses | 15 / 3.915 / 45.049 ms | 5 / 4.061 / 56.494 ms | 2 / 0.322 / 37.319 ms |
| Learn | 8 / 1.351 / 36.658 ms | 3 / 1.387 / 44.474 ms | 1 / 0.153 / 29.744 ms |
| Casino detail | 16 / 1.862 / 32.777 ms | 6 / 2.152 / 49.446 ms | 2 / 0.284 / 29.577 ms |
| Article detail | 9 / 1.548 / 22.936 ms | 4 / 1.690 / 31.744 ms | 1 / 0.144 / 24.141 ms |

¹The first Best Offers cache-miss request also paid cold-process initialization. Its browser C median remained 136.8 ms across 20 fresh-context samples.

Initial Home encoded resources changed from a 403,892-byte median at `85391bfc…` to 404,969 bytes final; transfer bytes changed from 412,892 to 413,969; JavaScript from 150,472 to 151,538; resource count stayed 31; RSC count stayed one. Baseline had zero initial long tasks; final median was zero and p95 was one 74 ms task.

## Usability before data and hydration continuity

**DETECTED:** The server-rendered native mobile disclosure remains usable while the real commercial read is held by an `ACCESS EXCLUSIVE` database lock. Pointer input opens it and ordinary Casinos/Learn links activate before commercial data resolves. The test releases the lock only after observing activation, and it never writes a lock or fixture to Preview or Production.

**DETECTED:** JavaScript-disabled browser coverage opens the same menu and exercises the real server language control. Separate release-order tests cover hydration-before-commercial-data and commercial-data-before-hydration. An open localized menu keeps the same Header and disclosure nodes, open state, focused link, meaningful scroll position, and selected language as commercial links arrive. Pointer/keyboard open-close, nested Escape, focus restoration, forward/backward focus containment, inert background, scroll-lock cleanup, desktop resize, Back/Forward, rapid/cancelled transitions, modifier/new-tab/hash behavior, and feedback cleanup are covered.

**DETECTED:** Restricted KZ never gains PE commercial links/actions; supported PE retains canonical offer eligibility, ranking, localized presentation, and the exact governed outbound action. Cache-on browser coverage mutates only the disposable local database to prove PE/KZ and EN/PT partitions, actual cache reuse, request-specific action isolation, and PUBLISHED-to-DRAFT invalidation. Fixtures and original statuses are restored by the suite.

## Verification and independent review

**DETECTED:** Local verification completed before documentation finalization: production build, lint/typecheck through the build, representative PostgreSQL discovery 2/2, market activation PostgreSQL 2/2, cache-on production browser 1/1, Chromium navigation hardening 12/12 applicable with one rejection-only skip, WebKit 7/7, isolated rejection 1/1, and focused safety/action/cache tests 15/15. A clean disposable database accepted the full migration chain and Programme seed.

**DETECTED:** The independent architecture review approved the implementation after the request-changes invalidation gap and unsafe primary intent-prefetch proposal were corrected. It found no blocking implementation issue: commercial/action resolution stays request scoped, country/language cache partitioning is explicit, the joined activation query is parameterized and fail closed, the public layout root does not await commercial data, and no unbounded N+1 query path was introduced.

**UNKNOWN:** The final full local clean-database quality/browser gates, GitHub required checks, exact-head Vercel Preview deployment identity, and read-only live Preview inspection remain pending at this document revision. A candidate must not be called ready if any of them fails or remains incomplete.

## Limitations and rollback

- **UNKNOWN:** Production field INP, real-user network/provider latency, database tail latency, and Production cache hit ratios cannot be established by this local lab.
- **INFERRED:** Fifteen Casinos and five Articles exercise substantially broader states than continuity fixtures, but do not prove Production-scale tail behavior.
- **DETECTED:** Cache freshness has a 60-second fallback window when administrative invalidation is unavailable.
- **DETECTED:** A timed-out Prisma query cannot be cancelled and may overlap one bounded refresh.
- **DETECTED:** Some shell/page action reads remain separate when their subject sets differ; they are bounded and preserve exact authority.
- **DETECTED:** Rollback is code-only: revert the two final candidate commits or redeploy the previously approved head. There is no migration, schema change, data rewrite, provider change, or Production configuration to reverse.
- **DETECTED:** Merge, auto-merge, Production deployment/promotion, alias changes, and shared/Production database mutations remain outside this workstream.

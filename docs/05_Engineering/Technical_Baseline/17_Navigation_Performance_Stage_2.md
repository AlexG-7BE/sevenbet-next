# Navigation Performance Stage 2 Evidence

## Evidence identity and release boundary

| Field | Value |
| --- | --- |
| Evidence date | 2026-09-17 |
| Repository | `AlexG-7BE/sevenbet-next` |
| Active evidence checkout | `/private/tmp/sevenbet-nav-stage2` |
| Candidate branch | `codex/navigation-performance-stage2` |
| Approved pre-hardening head | `85391bfc4bdc5ac80eb629caca4ffe454848e531` |
| Core implementation commit | `dc235990106ecaeb908a97a416679d5c796b2a00` |
| Final code head before this evidence-only commit | `ceb6b4019495e88b14d7f89f6fa0f556f20eabd5` |
| Reviewed pull-request head | `c0e1ffbb7b310069a83bcdfb38ea0fb6a83d2518` |
| Pull request | [#302](https://github.com/AlexG-7BE/sevenbet-next/pull/302) |
| Merge/main source | `c515ddb0e9442063d8fb51c4f69f37d55035adc4` |
| Final Preview | `dpl_6kYBdAatuARKHqRga7D89eJQNwk8` — Ready, exact reviewed head |
| Production | `dpl_6LFpCzv2tib5GuC6WVa4JdUD7Q9G` — Ready/promoted, exact merge |
| Application rollback | `dpl_GJPuS34GHk61m6XQHzXa3CxQYf2D` — Ready, prior main `2bd71c8…` |
| Release state | **RELEASED + VERIFIED** |

The governing documents, relevant active RFCs, changed source and tests, and
the exact `85391bfc…` comparison worktree were inspected during candidate
development. Generated directories, dependencies, caches, build artefacts,
raw browser traces and database files were excluded from implementation claims
and from the outgoing diff. This record preserves that candidate/local
evidence and distinguishes it from the later exact-head Preview and Production
verification below.

## Release closure

**DETECTED:** Required PR CI run
[`35233234884`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/35233234884)
passed Agent Core, Quality, Database / Migration Verification, Build / Browser
and Vercel on reviewed head `c0e1ffbb…`. Ready Preview
`dpl_6kYBdAatuARKHqRga7D89eJQNwk8` at
`https://sevenbet-next-ofl7tddyo-alexg-7bes-projects.vercel.app/` identifies
that exact source SHA. Read-only Preview verification found one Header, a
usable mobile menu, ordinary Casinos/Learn navigation, truthful unavailable
Best Offers/Bonuses for KZ, localized navigation, review-only Casino detail,
no outbound action and no observed browser/runtime error.

**DETECTED:** PR #302 merged normally as `c515ddb0…`. Post-main CI run
[`35238394196`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/35238394196)
passed all four GitHub CI jobs on that exact merge. Vercel deployment
`dpl_6LFpCzv2tib5GuC6WVa4JdUD7Q9G` is Ready, promoted and source-bound to the
same merge; its immutable URL is
`https://sevenbet-next-jk2g4ckyw-alexg-7bes-projects.vercel.app/`. The Ready
application rollback deployment is `dpl_GJPuS34GHk61m6XQHzXa3CxQYf2D`,
source-bound to prior main `2bd71c8…` at
`https://sevenbet-next-a7snjaopt-alexg-7bes-projects.vercel.app/`.

**DETECTED:** Production route smoke and KZ mobile acceptance passed with no
observed 5xx/runtime error or outbound action. Trusted KZ remained KZ;
commercial and editorial unavailability remained fail closed. No schema,
migration, data, environment, secret, provider, billing, DNS, GEO, ranking,
publication or commercial-policy mutation accompanied the application
release. The repository's `delete_branch_on_merge=true` setting automatically
removed the feature branch; live GitHub branch lookup returns absent, and no
recreation is required.

## Corrected behavior and root cause

**DETECTED:** The `85391bfc…` candidate made the Header and mobile disclosure usable before commercial state settled. The remaining route-opening delay came from repeated public editorial/activation database work on every navigation, serial discovery reads, relation-shaped market-activation queries, and product-catalog imports in compact route error boundaries. Casino detail also produced two RSC requests because an eligible primary detail link could be prefetched and then activated.

**DETECTED:** Final implementation moves reusable published editorial projections behind country-, locale-, language-, slug-, and presentation-aware Next Data Cache keys with a 60-second fallback TTL. Casino and Article publication workflows invalidate their corresponding tags, including the PUBLISHED-to-DRAFT request-changes path. Request-specific commercial authorization, trusted GEO resolution, identity/session data, Programme state, and outbound actions are never stored in that cache.

**DETECTED:** Public discovery resolves offers and slug aliases in parallel on normal connection pools, but a process-local FIFO serializes the leaf Prisma reads implicated in the Preview timeout when `connection_limit=1`. Composite cache callbacks never acquire that queue, and queued operations are not coalesced or given another operation's in-flight result, avoiding recursive queue deadlock. Market activation uses one parameterized joined query instead of approximately six relation round trips and independently requires the current Casino to remain PUBLISHED and unarchived before returning an action. Casino detail caches only the published editorial DTO and resolves the exact request-specific action afterward. Best Offers, Casinos, Bonuses, Learn, Casino detail, and Article detail retain the same canonical eligibility, ranking, localization, fail-closed destination, and commercial-state rules.

**DETECTED:** Primary navigation remains deliberately unprefetched. `TrackedReviewLink` and Casino-card detail links also disable automatic prefetch, preventing request-specific GEO/action RSC reuse across a later activation. Each measured activation issues one destination RSC request. The small transition feedback is link-local, appears on eligible ordinary activation, and ignores modified clicks, new-tab/download links, same-page hashes, and cancelled transitions.

**DETECTED:** Compact route error boundaries no longer import the 155 KB product catalog. Primary commercial transitions load about 25 KB of encoded post-activation JavaScript rather than about 85 KB at the approved baseline. Learn remains about 0.2 KB. Initial Home resources are effectively unchanged.

**DETECTED:** The prior remote `8ac506d…` CI run exposed one unrelated required-check failure after the navigation suites completed: dynamically inserted Learn guide category labels were functional text rendered at 11 px. The final candidate raises only those labels to the enforced 12 px minimum. The exact typography browser suite then passed all three checks across the eight Founder viewports.

## Cache, safety, and invalidation boundaries

- Published Casino snapshots are partitioned by exact country; projected offers and editorial DTOs also include the presentation language or slug required by their output.
- Normal pools retain their existing parallelism. A configured one-connection pool uses one process-local FIFO for leaf published, offer, alias, Article, editorial-review, and MarketActivation reads; a failed read releases the next queued operation.
- Identical leaf operations waiting in the FIFO do not share in-flight results; a cache miss that reaches the queue while an older fill runs performs its own ordered read. Normal Next Data Cache reuse and the declared 60-second residual freshness window remain.
- Published Article lists and detail records are partitioned by validated locale, category, slug, limit, and exclusion inputs. Dynamic cache-key inputs are length- and character-bounded before use.
- Request-scoped React cache keys contain the full serialized action-authority inputs. Concurrent PE and KZ requests cannot share an action result.
- Administrative publish, revise, archive, and request-changes mutations invalidate the relevant Casino or Article tags. The TTL is a bounded fallback, not the primary freshness mechanism.
- The guarded cache-bypass seam used by database-lock tests requires CI mode, an explicit opt-in, a loopback PostgreSQL database ending in `_ci`, and absence of Vercel/Production metadata.
- A timed-out Prisma query is not cancelled by the driver and can overlap one later refresh. The existing same-episode refresh bound remains fail closed and prevents a retry loop.

## Controlled measurement method

Measurements used Chromium 149 headless, a production Next build, a disposable local PostgreSQL cluster, 15 published Casino fixtures, five published Articles, and one exact governed PE action. Each result below is 20 valid samples with a fresh browser context and one actual pointer activation per sample. A is input to first painted feedback; B is painted meaningful destination identity; C is painted useful destination content after two animation frames. Values are median / p95 milliseconds unless a range is shown. RSC counts come from Resource Timing entries containing `_rsc`; post-activation JavaScript is encoded bytes. No primary-route prefetch was allowed. The normal mobile, normal desktop, warm/repeat, and constrained tables were rerun on exact code head `88ab63d…`; the separately labelled secondary, cache-bypass, database, and initial-resource observations were recorded on core implementation `dc235990…`.

Normal mobile is 390×844 with no artificial CPU or network throttling. Normal desktop is 1365×900. Constrained mobile uses 4× CPU slowdown, 100 ms RTT, approximately 1.6 Mbps download, and 0.75 Mbps upload. Warm/repeat measurements reuse a visited route and its already-loaded chunks. Cache-bypass runs use the guarded local seam and approximate an editorial cache miss without altering application behavior.

The controlled final release summary is 144.5 ms Best Offers, 151.7 ms
Casinos, 154.0 ms Bonuses and 117.8 ms Learn useful-content C median; warm
primary routes are 44–45 ms, Casino detail approximately 112 ms and Learn
Article detail 112.7 ms (113 ms rounded). These figures are local controlled
production-build measurements, not Production field measurements and not INP.

## Primary navigation: exact baseline versus final

### Normal mobile, cold context

| Destination | `85391bfc…` A | Final A | `85391bfc…` C | Final B med/p95; C med/p95 | Final C observed range | Final RSC / JS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Best Offers | 96.4 / 101.5 | **67.2 / 69.6** | 144.9 / 158.1 | **144.5 / 154.3; 144.5 / 154.3** | 139.9–157.3 | 1 / 24,819 B |
| Casinos | 95.8 / 98.7 | **67.7 / 71.6** | 148.2 / 152.3 | **151.7 / 158.2; 151.7 / 158.2** | 142.7–162.5 | 1 / 25,320 B |
| Bonuses | 98.3 / 103.4 | **67.0 / 72.6** | 151.8 / 165.2 | **154.0 / 163.7; 154.0 / 163.7** | 148.0–208.9 | 1 / 25,682 B |
| Learn | 105.2 / 110.8 | **66.7 / 70.2** | 111.8 / 115.2 | **117.8 / 125.8; 117.8 / 125.8** | 113.8–125.9 | 1 / 196 B |

All final normal-mobile A, B, and C medians are inside the Founder's 100–300 ms route-opening target where applicable; feedback A is below 100 ms. Every sample produced useful content, one destination RSC request, and zero long tasks.

## Production navigation observation

The Production comparison used KZ, 390×844 mobile, five samples, actual
pointer activation and no artificial network or CPU throttle. It is a bounded
observational comparison, not RUM or a claim about population-wide latency.

| Destination | Baseline C median | Released C median | Change |
| --- | ---: | ---: | ---: |
| Casinos | 954 ms | 541 ms | `-413 ms` / `-43.3%` |
| Learn | 522 ms | 436 ms | `-86 ms` / `-16.5%` |

**DETECTED:** Both measured Production routes improved, but absolute C remained
above 300 ms. Best Offers and Bonuses were truthfully absent for the KZ
request, so no synthetic route, fixture or click measurement was manufactured.
Architecture and functional release closure are complete; actual Production
C ≤300 ms remains an **OPEN** bounded follow-up, not a blocker to the released
Stage 2 architecture and not a reason to reopen it.

### Normal desktop, cold context

| Destination | Final A | Final B med/p95; C med/p95 |
| --- | ---: | ---: |
| Best Offers | 65.2 / 69.8 | **141.9 / 152.7; 141.9 / 152.7** |
| Casinos | 66.7 / 71.8 | **148.5 / 163.6; 148.5 / 163.6** |
| Bonuses | 66.8 / 70.7 | **154.1 / 164.4; 154.1 / 164.5** |
| Learn | 66.6 / 69.5 | **118.0 / 125.9; 118.0 / 125.9** |

### Warm/repeat

These warm/repeat observations were rerun on exact code head `88ab63d…`.

| Destination | Mobile A | Mobile C | Desktop A | Desktop C |
| --- | ---: | ---: | ---: | ---: |
| Best Offers | 28.6 / 31.4 | 44.5 / 46.9 | 29.5 / 31.8 | 45.6 / 47.2 |
| Casinos | 36.9 / 39.4 | 44.5 / 48.9 | 33.3 / 34.3 | 44.7 / 47.4 |
| Bonuses | 33.6 / 35.9 | 44.1 / 46.1 | 30.4 / 33.5 | 44.8 / 47.1 |
| Learn | 30.4 / 33.7 | 44.7 / 48.4 | 30.5 / 32.6 | 46.9 / 47.6 |

Warm activations still issue one RSC request, load zero additional JavaScript bytes after resource-timing reset, and preserve actual route execution rather than substituting a local view switch.

### Constrained mobile

These constrained observations were rerun on exact code head `88ab63d…` with the declared artificial throttle.

| Destination | Final A | Final C |
| --- | ---: | ---: |
| Best Offers | 89.6 / 115.4 | 689.4 / 745.9 |
| Casinos | 86.9 / 92.5 | 714.6 / 723.3 |
| Bonuses | 88.0 / 93.8 | 747.6 / 820.9 |
| Learn | 86.8 / 93.8 | 383.8 / 401.5 |

**DETECTED:** Immediate feedback remains below 200 ms at p95 under the declared throttle. Useful content honestly exceeds 300 ms because the artificial RTT/bandwidth/CPU dominates the RSC transfer and render; these results are not represented as meeting the normal-condition target.

## Secondary routes and cache-miss resilience

These secondary and guarded cache-bypass observations were recorded on `dc235990…`.

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

**DETECTED:** The exact `8ac506d…` Preview (`dpl_1vaAmhwLTPxJabiPhezuGEGDX7Xr`) exposed a real cold-cache defect that the local normal measurements did not: the first Casinos request failed when concurrent published-projection revalidation and alias discovery contended for a Prisma pool configured with one connection, producing `P2024`. The `88ab63d…` code head serializes the implicated leaf public reads only for that pool configuration, without sharing results, and rechecks current Casino publication inside MarketActivation. The old Preview is therefore evidence of the discovered defect, not release approval; exact-head Preview confirmation of the closure remains required after push.

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

**DETECTED:** Local verification completed before documentation finalization: production build; lint and typecheck; representative PostgreSQL discovery 2/2; market activation PostgreSQL 2/2; cache-on production browser 1/1; Chromium navigation hardening 13/13 applicable with one intentional rejection-only skip; WebKit 7/7; isolated rejection 1/1; exact typography browser 3/3 across eight Founder viewports; the broader public browser suite 278 passed with five intentional skips; Programme browser 19/19; Programme unit 154/154; and the final focused discovery/cache/action suite 61/61. A clean disposable database accepted the full migration chain and Programme seed, and the full local quality and migration gates completed successfully.

**DETECTED:** The independent architecture review approved the core implementation after the request-changes invalidation gap and unsafe primary intent-prefetch proposal were corrected. Its focused closure review rejected two intermediate designs before push—result sharing because of an invalidation race, then composite-callback queueing because of recursive deadlock. It approved the final leaf-only FIFO: no result or identity/GEO state is shared, failures release the queue, normal pools retain parallelism, and current Casino publication is independently required for governed actions. Residual non-blocking risks are process-local coordination, head-of-line latency on one-connection pools, and queued work waiting for a hung database read to settle.

**DETECTED:** Exact-head GitHub checks, final Preview identity and safe read-only
Preview inspection all completed successfully before merge. Post-main CI,
exact-source Production deployment identity, Production smoke and bounded KZ
mobile observation then completed successfully. The independent architecture
review remains approved with the residual risks described above.

**CONTRADICTION RESOLVED:** Release verification observed that Production
remained up to date at 21/21 applied migrations in its then-active, older
checkout. That output is preserved as a historical observation, not the
current repository inventory. On 17 September, a fresh read-only status check
using released source enumerated 43 migrations through
`0043_article_learning_center` and reported Production up to date. Neither
command applied a migration or wrote application data.

## Limitations and rollback

- **UNKNOWN:** Production RUM/field INP, population-wide network/provider and
  database-tail distributions, cache-hit distribution, and compute/cost impact
  are not established by this release evidence.
- **INFERRED:** Fifteen Casinos and five Articles exercise substantially broader states than continuity fixtures, but do not prove Production-scale tail behavior.
- **DETECTED:** Cache freshness has a 60-second fallback window when administrative invalidation is unavailable.
- **DETECTED:** A timed-out Prisma query cannot be cancelled and may overlap one bounded refresh.
- **DETECTED:** Some shell/page action reads remain separate when their subject sets differ; they are bounded and preserve exact authority.
- **DETECTED:** The one-connection FIFO is process-local. It can add
  head-of-line latency, and a hung database read retains its connection while
  queued work waits for the operation to settle.
- **DETECTED:** Rollback is code-only: redeploy the verified rollback deployment
  or deliver a reviewed revert. There is no Stage 2 migration, schema change,
  data rewrite, provider change or Production configuration to reverse.
- **OPEN:** Absolute actual Production useful-content C ≤300 ms was not reached
  in the bounded KZ observation and remains a separate measurement/optimization
  follow-up.

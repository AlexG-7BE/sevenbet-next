# B4GAMBLE Current State

**Status:** CURRENT AUTHORITATIVE CHECKPOINT  
**Evidence date:** 5 September 2026
**Owner:** 7BE Inc. / B4GAMBLE Founder Office  
**Production:** `https://b4gamble.com`  
**Current Production application SHA (live provider evidence):** `aedfaee48cefea34ac9b1fac71315ba7c8c3df19`
**Verified post-release runtime baseline SHA:** `aedfaee48cefea34ac9b1fac71315ba7c8c3df19`
**Verified post-release runtime deployment:** Ready; `dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu`

Documentation-only commits may advance `main` and trigger equivalent Vercel rebuilds after this runtime baseline. Use live GitHub/Vercel evidence for the exact current head/deployment when that distinction matters.

This checkpoint supersedes older candidate/draft/current-state language where it conflicts with newer verified evidence below.

## Governance and read order

For internal decision authority, read in this order:

1. the current explicit Founder instruction, when present;
2. this current Founder-approved checkpoint;
3. only the relevant `ACTIVE` RFCs in the [RFC Registry](06_RFC/README.md);
4. live implementation and repository evidence; and
5. historical documents only when their context is needed.

The [Decision & Documentation Governance](GOVERNANCE.md) defines the authority, evidence, override and RFC rules. A newer explicit Founder decision may supersede an older internal boundary for its approved scope. For factual claims, live authoritative system, Production, repository and provider evidence still outranks this document when newer evidence conflicts with it.

## Executive state

| Area | Current state | Meaning |
|---|---|---|
| Public site / product | **READY** | Accepted public design/UX baseline is in Production. |
| Public legal implementation | **READY** | Current GB public legal copy/consent/disclosure implementation is in Production for the approved scope. |
| Legal / administrative compliance | **READY WITH FOUNDER-ACCEPTED DEFERRALS** | Public legal work is closed for current scope; specified administrative items remain open. |
| Commercial CRM / Partner Operations | **READY IN PRODUCTION** | COMMERCIAL-OPS-01 code is deployed and Production migration `0020_commercial_ops_01` is applied and verified. |
| ChatGPT Work MCP / Better Auth 1.7 | **ENABLED IN PRODUCTION — RESOURCE-SPECIFIC DCR, DURABLE GRANTS AND DB FAILURE BOUNDARY DEPLOYED** | Commercial retains four tools; Media retains five. PR #161 binds standards-shaped DCR through resource-specific discovery while preserving strict one-resource clients and invalidating cross-resource use. PR #159 keeps unsupported methods DB-free and authenticated transient DB failures bounded. |
| Production DB / MCP reliability | **READY IN PRODUCTION** | The intentional pooled one-connection runtime remains unchanged. Public discovery no longer competes with itself or concurrent discovery work inside a warm function; transient DB availability receives narrow, secret-safe 503 behavior without an unhandled initialization rejection or process exit. |
| Commercial partner activation | **READY IN PRODUCTION — SIX GOVERNED ACTIVE ROUTES** | Six exact Superfly programme/offer/link graphs use bounded Founder global-default authority. Trusted request GEO independently denies the detected `DK`, `ES`, `FI`, `NO`, `CL`, `SE` and `GB` block set; missing or `UNKNOWN` exact-market evidence alone is not a prohibition. |
| Casino market data | **REAL CATALOG COMPLETE IN PRODUCTION — EIGHT SCORED/REVIEWED IDENTITIES; SIX PUBLISHED OFFERS** | Eight real global editorial identities remain published with their scores, reviews, SEO and controlled marks. Six have complete global catalog facts, a published welcome offer and a governed route; Betsson and DragonBet remain review-only. Temporary demo identities are excluded from every released catalog and offer surface. |
| Placement media | **RFC-040 OPTION C ACTIVE IN PRODUCTION** | Nine semantic placements resolve through typed Casino, Bonus and optional AffiliateOffer relationships, responsive variants and immutable publication snapshots. Production has 26 Casino and 20 Bonus assignments, zero partner-context assignments, and a strict rollback switch. |
| GEO-localized creative assignments | **CAPABILITY READY IN PRODUCTION — REAL LOCALIZED INVENTORY NOT INSTALLED** | Additive migration 0028 is applied and verified. Trusted request GEO plus presentation language resolve exact-country/language, global/language and neutral assignment scopes without client-side inventory selection. All 46 existing assignments remain global-neutral and targeted rows remain zero. |
| Commercial creative formats | **READY IN PRODUCTION** | Common affiliate formats, security-valid animated GIF ingestion, native responsive commercial geometry and governed creative actions are active without changing editorial media or expanding commercial authority. |
| Media ingestion / Media Operations | **READY IN PRODUCTION — FIRST-PARTY R2, REVIEW-SAFE DRAFT AUTHORITY** | Validated partner media persists through the existing S3 provider to approved Cloudflare R2 Standard and `media.b4gamble.com`; checksum dedupe, bounded analysis, protected draft plans and the separate five-tool Media MCP are active with no publish authority. |
| Public language / market presentation | **READY IN PRODUCTION — PUBLICATION AND CTA ARE INDEPENDENT** | Six language-only route families share the real global Casino layer. Trusted request GEO never comes from language, and independently controls outbound eligibility; global editorial/catalog and offer publication do not claim exact-local availability. |

### Recent implementation state

**DETECTED — DIRECT-GOVERNED-OUTBOUND-01 RELEASE CANDIDATE, 6 September
2026:** the protected implementation branch changes normal authorized
commercial CTA and promotional-creative anchors from the two-step
`/outbound/{slug}` confirmation journey to direct `/r/{slug}` navigation in a
new tab. The existing server-owned `/r` route remains the only external redirect
authority and retains its feature flag, trusted request GEO, cumulative
commercial resolution, jurisdiction logging, safe 302 response and best-effort
outbound-click recording. `/outbound/{valid-slug}` is compatibility-only and
redirects internally to `/r/{slug}`; `/outbound/unavailable` remains the
fail-closed terminal surface. The client event uses the backward-safe `direct`
outcome; historical confirmation outcomes remain parseable, and public product
analytics remains disabled. Preview, merge, Production and runtime evidence are
not claimed until the release record is finalized.

**DETECTED — GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01 COMPLETE, 5 September
2026:** [PR #163](https://github.com/AlexG-7BE/sevenbet-next/pull/163)
merged as `aedfaee48cefea34ac9b1fac71315ba7c8c3df19` after exact-head
CI, isolated Preview migration and hosted acceptance passed. Additive migration
`0028_geo_localized_creative_assignments` was then applied once to the exact
fingerprinted Production resource and independently verified: protected counts
remained 34 Casinos, 33 Bonuses, 11 Offers, 11 routes, 15 assets, 74 versions
and `26/20/0` typed assignments; all 46 existing assignments remain
`NULL/NULL`, with zero targeted rows. Ready deployment
`dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu` serves the canonical aliases from the
exact merge SHA and reports schema-ready build preflight. Public/API,
eight-review, 390/1440 adaptive media, cache/privacy, separate four-tool
Commercial/five-tool Media MCP and exact-deployment log acceptance passed. The
capability is Ready; no real localized partner creative has been installed or
published. See the [GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01 release
record](06_Operations/GEO-Localized-Creative-Assignments-01-Release-Record-2026-09-05.md).

**DETECTED — MEDIA-MCP-DCR-RESOURCE-FIX-01 COMPLETE, 5 September 2026:**
[PR #161](https://github.com/AlexG-7BE/sevenbet-next/pull/161) merged as
`edf191f9c52912fb1637b1f5952bf4f0e7830dfb` after exact-head CI and Preview
acceptance. Media now advertises its own RFC 8414 path issuer and DCR endpoint;
Commercial retains its existing issuer and endpoint. Neutral standard DCR
without custom resource fields, a scope discriminator or a Media-bearing name
creates exactly one resource-bound public client. Both valid resource flows
reached login and both inverse flows failed `invalid_target` in Preview and
Production. Ready Production deployment `dpl_F5s4pBxa4jkkRg2hv3CD6grcam9g`
also passed nine public routes, ten DB-free MCP method probes and an exact-
deployment error/credential log scan. No schema, migration, tool, CRM, Media,
R2, CTA, offer, GEO or public-product change occurred. See the
[MEDIA-MCP-DCR-RESOURCE-FIX-01 release record](06_Operations/Media-MCP-DCR-Resource-Fix-01-Release-Record-2026-09-05.md).

**DETECTED — PRODUCTION-DB-MCP-RELIABILITY-01 COMPLETE, 5 September 2026:**
[PR #159](https://github.com/AlexG-7BE/sevenbet-next/pull/159) merged as
`491e1c51bc26c60ac10b2fe5bf8f15bba5cfe044` after deterministic unavailable-
database and one-connection PostgreSQL acceptance, exact-head CI and a corrected
Preview passed. The first Preview transparently exposed six `P2024` failures
among eight concurrent `/casinos` requests; merge remained paused until the
complete one-connection discovery coordinator at accepted head
`2d47933371b229267b885476c7c58ebdf9b3a62e` made the repeated test 8/8 HTTP
200. Ready Production deployment `dpl_7VZfo7P55yAwgShrYK2wx1vDtk11` then
passed both MCP method-only probes, eight concurrent Casino reads, seven public
routes and an exact-deployment log scan with no P2024, Prisma initialization,
unhandled rejection, process exit, 500 or 503. No schema, data, environment,
provider/plan, R2, media, tool or authority change occurred. A safe current
Founder Commercial credential was unavailable, so no live authenticated MCP
read or refresh lifecycle is claimed beyond deterministic valid-token CI and
current metadata. See the
[PRODUCTION-DB-MCP-RELIABILITY-01 release record](06_Operations/Production-DB-MCP-Reliability-01-Release-Record-2026-09-05.md).

**DETECTED — MEDIA-INGESTION-AUTOPLACEMENT-01 COMPLETE, 5 September 2026:**
[PR #157](https://github.com/AlexG-7BE/sevenbet-next/pull/157) merged as
`b9965d5ca2744bdc510baadaad48fde3c1d39fba` after exact-head CI and Preview,
bucket-scoped Cloudflare R2 Standard transport preflight and custom-domain
verification passed. Ready Production deployment
`dpl_AWTHUgp2fp4XsVwRe4v25NKrcQoL` then completed one controlled current
Diamond7 ingestion and immediate replay: one 250×250 JPEG became first-party
`MediaAsset` `fb0a9f46-fb70-430e-a799-fc2cbf939f07` at
`media.b4gamble.com`, while the replay reused that exact object/row. Both plans
remained `SUGGEST_REVIEW`; no assignment or publication occurred. Read-only
postflight retained 8 real Casinos, 6 published Bonuses, 30 publication
snapshots and all 46 RFC-040 assignments with exact editorial/score, terms,
CTA/routes, GEO and Programme digests. The separate Media MCP exposes exactly
five read/safe-write tools, cross-resource scope probes failed closed, and
runtime logs were error-free and secret-safe. See the
[MEDIA-INGESTION-AUTOPLACEMENT-01 release record](06_Operations/Media-Ingestion-Autoplacement-01-Release-Record-2026-09-05.md).

**DETECTED — COMMERCIAL-CREATIVE-FORMATS-01 COMPLETE, 4 September 2026:**
[PR #150](https://github.com/AlexG-7BE/sevenbet-next/pull/150) delivered the
affiliate-industry format registry, strict GIF87a/GIF89a ingestion, native
commercial geometry, Admin suitability guidance and shared governed
CTA/creative action. Real Production acceptance then found that the composed
Slotnite 320×50 mobile stage remained too tall; the release stayed held while
[PR #151](https://github.com/AlexG-7BE/sevenbet-next/pull/151) added the compact
composition and real-inventory regression. Final runtime
`96cd546bf14a32fda0632f58382089aac4c7b905` is Ready as
`dpl_9PzTzpLcao3jveamPS9Dq4EVKF82`. Exact-head Preview and final Production
acceptance passed native 300×250, 250×250, 320×100, 320×50 and deliberate
728×90 presentation, animated GIF decoding, authorized mouse/keyboard
clickability, blocked non-interactivity, CTA/creative route agreement, raw-link
exclusion and responsive no-overflow gates. Bonuses retain three curated
records, Best Offers six, and Casino discovery eight real reviews. No schema,
migration, asset, assignment or commercial-authority change occurred. See the
[COMMERCIAL-CREATIVE-FORMATS-01 release record](06_Operations/Commercial-Creative-Formats-01-Release-Record-2026-09-04.md).

**DETECTED — PLACEMENT-MEDIA-ASSIGNMENTS-01 COMPLETE, 4 September 2026:**
[PR #148](https://github.com/AlexG-7BE/sevenbet-next/pull/148) activated RFC-040
Option C and merged as `aaebff1eccdf0f9694791b52fb88d1d011d74a17` after
exact-head Preview and full PR/merge CI passed. Additive migration
`0027_placement_media_assignments` was applied once to the fingerprint-guarded
Production database. The governed backfill produced 26 Casino and 20 Bonus
assignments, zero AffiliateOffer assignments and eight immutable projections;
the immediate rerun produced zero writes and the resolver comparison reported
62/62 matches. Ready deployment `dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2` serves the
canonical aliases with assignment-first reads enabled. Final 1440/390 browser,
all-eight review, Bonus Top-3, Best Offers, comparison, terms, CTA/GEO,
Programme/auth, canonical-route and read-only database acceptance passed. See
the [PLACEMENT-MEDIA-ASSIGNMENTS-01 release record](06_Operations/Placement-Media-Assignments-01-Release-Record-2026-09-04.md).

**DETECTED — CASINO-COMMERCIAL-VISIBILITY-03 COMPLETE, 3 September 2026:**
[PR #139](https://github.com/AlexG-7BE/sevenbet-next/pull/139) merged as
`e418d894d3f7156f60b2742c2c9389e11e8d7432` after all required CI and exact
Preview acceptance passed. A fingerprint-guarded Production reconciliation
published complete global catalog facts and one welcome offer for Diamond7,
G'day Casino, 21 Privé, Skol Casino, Slotnite and Hello Casino, plus six exact
Superfly programme/offer/link/redirect graphs carrying the seven-country block
set. The repeated write was a no-op. Live acceptance then detected that older
RFC-012 demo offers were still entering the shared offer repository; release
was held, [PR #140](https://github.com/AlexG-7BE/sevenbet-next/pull/140)
excluded them at the service boundary and merged as
`2507043cb945f2b920b73522763f51f36b3c246c`. Ready Production deployment
`dpl_7RFc2zonoZ9Upp9Fw5YtAmsvR8Ax` is sourced from that exact merge and serves
the canonical aliases. Final Production browser/database acceptance reports
eight real profiles, six real offers/routes, 42 detected route blocks, zero
demo identities, zero raw tracking URLs, zero issues and zero destructive
writes. See the [CASINO-COMMERCIAL-VISIBILITY-03 release record](06_Operations/Casino-Commercial-Visibility-03-Release-Record-2026-09-03.md).

**DETECTED — CASINO-REAL-CATALOG-02 COMPLETE, 3 September 2026:**
[PR #136](https://github.com/AlexG-7BE/sevenbet-next/pull/136) merged as
`68c9a8160d642c8795b3b7206fb8e67100978773` after all required checks and
actual Preview acceptance passed. A fingerprint-guarded Production
reconciliation published complete reviews, Founder-approved Editor Scores, SEO
and controlled real brand marks for Betsson, Skol Casino, Hello Casino, G'day
Casino, Diamond7, DragonBet, 21 Privé and Slotnite. The immediate repeat was a
no-op; exact final scoped counts are eight Casinos, nine profiles, ten licences,
95 evidence rows, 22 payments, three providers, 28 categories, two factual
bonus rows, eight published reviews/scores/SEO/media assets and zero commercial
routes. [PR #137](https://github.com/AlexG-7BE/sevenbet-next/pull/137)
then merged the live-acceptance overflow correction as
`769bf26317aab408eee3a3026f64822e09317608`; Ready deployment
`dpl_3JgZXZSPvv2HHud9shXJJiqh9EaW` serves the canonical aliases. Full
desktop/mobile/browser/API/GEO/redirect/Programme acceptance and final
read-only database/route-health postflight passed. See the
[CASINO-REAL-CATALOG-02 release record](06_Operations/Casino-Real-Catalog-02-Release-Record-2026-09-03.md).

**DETECTED — GEO-LANGUAGE-GLOBAL-CATALOG-01 COMPLETE, 3 September 2026:**
[PR #134](https://github.com/AlexG-7BE/sevenbet-next/pull/134) merged as
`f7f1251558ca6be773863023f01d2a8a1a054543` after all required gates passed.
Production deployment `dpl_Guy4E9LLYKQpws5MHWjQ7GYTibKZ` is Ready and serves
the canonical aliases. Public canonical identity is now language-only (`/en`,
`/de`, `/es`, `/el`, `/sv`, `/da`); trusted request GEO is independent of
language, preference and query state; and the global real-Casino catalogue
projects exact-market `PROMOTABLE`, `INFORMATIONAL_ONLY` or `HIDDEN` state.
Production HTTP/browser acceptance, a 13-market enforced read-only database
projection and post-acceptance logs passed. The final global projection contains
eight real informational identities, zero referral actions and zero eligible
routes; the database mutation count was zero. This newer Founder-authorised
release supersedes the historical BCP-47 canonical routing described in the
older GEO-LOCALIZATION-01 entries below. See the
[GEO-LANGUAGE-GLOBAL-CATALOG-01 release record](06_Operations/GEO-LANGUAGE-GLOBAL-CATALOG-01-Release-Record-2026-09-03.md).

**DETECTED — COMMERCIAL PLATFORM CODE COMPLETION, 3 September 2026:** PR #131
merged the exact Casino × GEO activation and asset adapters, aggregate-only
outbound-click accounting/reporting, read-only route health automation and
central market publication/indexability policy. Additive migration
`0026_commercial_platform_completion` is applied and checksum-verified. PR #132
fixed the monitor's repository context; the final manual Production health run
passed with no open alert. GB is centrally indexable, while its current Casino
directory applies a stricter inventory truthfulness `noindex`; SE and PE remain
centrally `noindex` on the documented data/content/legal blockers. No route was
activated. See the [commercial-platform completion release record](06_Operations/Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

**DETECTED — PR #105 merged:** merge `f457099` delivered the typed internationalisation foundation, `HOME_READY` / `PUBLIC_CORE_READY` / `ARCHITECTURE_ONLY` presentation states and Founder-accepted DE/ES/SE/DK/GR public-core presentations. PR #106 subsequently merged the separately governed Programme internationalisation architecture at `4184c4f`. The old description of PR #105 as unmerged was stale and is corrected here from repository history.

**DETECTED — GEO-LOCALIZATION-01 PR #121 merged, 2 September 2026:** merge `c27b94d22f50fd4822e61d6ae6353b01072d4682` deployed as `dpl_2RioUxbR838XZr8wGytPqrajgQVX`. The exact release made lowercase BCP-47 locale-market paths canonical and passed the ordinary Production smoke. `/en-gb`, `/en-gb/casinos`, `/sv-se` and `/sv-se/casinos` returned 200.

**DETECTED — GEO-LOCALIZATION-01 Production correction PR #122 merged, 2 September 2026:** merge `1392829c5823354ed9e3cb7d04d29b963e96262c` deployed as `dpl_2Wey6EznxUqnnRUYd7QVRbwQJ9ud`. `/en-gb`, `/en-gb/casinos`, `/sv-se`, `/sv-se/casinos`, `/es-pe` and `/es-pe/casinos` return 200 with matching `html lang`, self-canonical URLs, reciprocal locale alternates and exact selector state. Peru and Sweden remain `noindex, follow`; PE/SE public casino facts do not cross markets; no affiliate action appears; the Programme entry remains healthy. See [GEO-LOCALIZATION-01 implementation record](internationalisation/GEO-LOCALIZATION-01.md).

**DETECTED — CASINO-DATA-POPULATION-01 complete, 2 September 2026:** seven checksum-bound GB profiles — Hello Casino, Skol Casino, Diamond7, G'day Casino, 21 Privé, Slotnite and DragonBet — merged through PR #123 and imported atomically into Production by the closed, unmerged one-shot PR #124 executor. The committed reconciliation was `121 created / 0 updated / 5 unchanged`; both in-transaction and post-commit idempotency checks were `0 / 0 / 126`. Betsson remained unchanged in PE/SE, Gentleman Jim remained blocked, no candidate leaked outside GB, and no bonus, unevidenced payment, asset or commercial route was fabricated. The scoreless-profile comparison correction merged through PR #125 as `8e4cc093f5bbd9775ad60d586101aabd07308b78` and deployed Ready as `dpl_7Y4v58gkALDRNjkprNxCRhtzRLfR`; exact Production directory, detail, comparison, fallback and filter acceptance passed. See the [CASINO-DATA-POPULATION-01 release record](06_Operations/Casino-Data-Population-01-Release-Record-2026-09-02.md).

**DETECTED — Programme internationalisation PR #106 merged:** merge `4184c4f` presents one language-neutral Programme through its separately governed localized Programme routes while keeping locale out of Programme state, identity, rewards and persistence. It introduced no Prisma migration and did not extend public-market legal, indexing or commercial authority. Its runtime evidence and historical acceptance gates remain in [Programme internationalisation](internationalisation/programme-internationalisation.md).

**DETECTED — systemic Programme access merged and deployed:** PR #109 merged as
`be5641f90174b6200892274e5fd48000988091c5`, replacing the old authenticated
one-hour browser-authority lifecycle with one purpose-specific durable
`ProgrammeAccessAcceptance` per accepted User. Migration `0024` is effective in
Production and backfilled only the narrowly provable PROGRAM-AI
claim/Starting-Point path; generic historical enrollments remain explicitly
unknown. Later 0025/0026 preservation checks left Programme acceptance,
Enrollment, progress, reward, `currentStep` and Starting-Point projections
unchanged. See [Programme Access Authorization](05_Engineering/Technical_Baseline/12_Programme_Access_Authorization.md).

## Detected release evidence

### Casino market schema and Betsson PE/SE factual release

- Migration `0025_casino_market_profile_architecture` completed on 1 September 2026 from exact release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d` with SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.
- PRs #114, #111, #117, #112 and #118 then delivered the steady-state guard, market architecture, exact-country public read fix, checksum-bound disposable importer and null-safe factual publication runtime. Their merge SHAs and Production deployment identifiers are preserved in the [2 September casino release record](06_Operations/Casino-Market-Data-Release-Record-2026-09-02.md).
- The one-time execution-only PR #119 ran from exact head `3a48739d668d5005eb2c4cdabfa2f23103549007`, imported the exact nine-file bundle once and published one Betsson identity with independent PE and SE market profiles. It was closed without merge; its Production-targeted `--skip-domain` build `dpl_Fk23XAokr33hjubGsFKRSTdEFhRo` ended `Error` intentionally after the success sentinel.
- Import reconciliation was `78 created / 0 updated / 0 unchanged`; the immediate read-only idempotency comparison was `0 created / 0 updated / 78 unchanged`. The published Casino is version 1 with `editorScore=null`; both incomplete bonus observations remain `DRAFT` and are absent from public projections.
- Live postflight found Betsson alone in PE and alongside fictional Demo Prism in SE. PE projects PEN, Yape and two MINCETUR licences; SE projects SEK, Swish and Spelinspektionen licence `23Si2176`. Both retain typed `UNKNOWN` and `CONTRADICTION` evidence, expose no affiliate action and do not leak market facts into the other or unqualified projection.
- Production commercial state stayed fail-closed: no commercial write occurred; `AffiliateTrackingLinkCountry` remained zero; `productionEligibleRoutes` remained zero; no asset was published. `b4gamble.com` remained on Ready runtime deployment `dpl_6CRSFtbV4kZwhVurucV7jtKp4QoZ` at SHA `86470b8f05a9bc10f22fd7b18a09588319bfe2e0`.

### Public product and legal baseline

- PR #77 established the accepted B4GAMBLE v1 public product/design baseline.
- PR #78 delivered the GB public legal closeout for the current scope, including Programme consent/disclosure and final public affiliate/footer wording.
- The accepted public Product Freeze remains in force absent new scope, regression or materially new evidence.
- Programme/private/Help data remains separated from commercial ranking, routing and partner operations.

### Governance simplification

- PR #80 simplified RFC governance.
- Current explicit Founder instruction is the highest internal decision authority for its covered scope.
- RFCs are durable architecture/decision records, not routine PR/merge/deploy permission gates.
- Historical RFC wording cannot permanently veto a later explicit Founder decision.
- Decision authority does not fabricate external facts or override law/platform/technical reality.

### COMMERCIAL-OPS-01

PR #81 delivered the B4GAMBLE Commercial CRM and Partner Operations Agent.

**Commercial Admin routes:**

- `/admin/commercial`
- `/admin/commercial/partners`
- `/admin/commercial/partners/[opportunityId]`
- `/admin/commercial/analytics`

**Commercial CRM aggregate includes:**

- Opportunity
- Evidence
- Contact
- Activity
- Application
- Term
- Task
- AgentRun
- AgentOperation
- ActivationPacket

**Canonical pipeline:**

`PROSPECT → QUALIFIED → APPLICATION_READY → APPLIED → DUE_DILIGENCE → NEGOTIATING → APPROVED → ACTIVE`

with `REJECTED` and `ON_HOLD` terminal/side states where appropriate.

**Partner Operations:**

- canonical specialist key: `partner-operations`;
- compatibility alias: `partner-intelligence`;
- bounded CRM snapshot → strict model output → validation → transactional Agent-safe CRM operations;
- may prepare research/evidence, drafts, next actions, evidenced responses/terms and activation packets;
- cannot send external communications, submit applications, accept terms, set `APPROVED`, set `ACTIVE`, activate tracking, deploy, or mutate Production through the Agent surface.

CRM `APPROVED` is not public commercial authority. `ACTIVE` cannot be produced through ordinary CRM/Agent mutation. RFC-015 readiness, kill switch, AffiliateProgram/Offer/TrackingLink state and public routing remain independent server-authoritative controls.

## Production migration 0020

**DETECTED — Production migration `0020_commercial_ops_01` is applied and verified.**

Execution sequence on 20 August 2026:

1. Founder explicitly authorised the Production mutation with `GO 0020`.
2. A temporary fail-closed Production-only execution guard was introduced through PR #82.
3. The guard verified Production database readiness and same database identity for pooled runtime/direct migration bindings.
4. It refused mutation unless the only pending repository migration was exactly `0020_commercial_ops_01` and no unresolved migration record existed.
5. Vercel Production deployment `dpl_BQEqk75EcFxFR7gAYmcFFzRvmhxW` emitted `production_migration_0020: applying`, then `production_migration_0020: applied_and_verified`.
6. PR #83 immediately removed the temporary migration runner; no schema rollback was performed.
7. Final cleanup application/runtime baseline SHA is `f6f520340d67e4f2aac44142437962b287794a66` and verified post-cleanup deployment `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY.

The normal Vercel preflight is readiness-only again. This event does not establish a permanent automatic Production migration policy.

## Production Commercial MCP and refresh lifecycle

**CONTRADICTION RESOLVED — CURRENT REPOSITORY/RUNTIME, 5 September 2026:** the
historical 21 August text below predates
[PR #146](https://github.com/AlexG-7BE/sevenbet-next/pull/146) and
[PR #147](https://github.com/AlexG-7BE/sevenbet-next/pull/147). Those protected
merges deployed durable delegated access and removed browser-session dependence
from refresh. Current authorization/protected-resource metadata includes
`offline_access`; refresh permits an omitted request resource only after the
stored exact-resource grant and current delegated staff authority validate.
PR #159 preserved that contract. **UNKNOWN:** this reliability workstream had
no safe current Founder Commercial credential, so it did not independently
re-run a live end-to-end refresh cycle. The following paragraphs remain the
historical incident/root-cause record, but their “proposed/not deployed” state
is superseded.

**DETECTED — PRODUCTION RUNTIME, 2026-08-21:** Production serves the bounded Commercial MCP from application SHA `9d7ba9169df43f914a1fb05f44cfc10af87118e2` with Better Auth/OAuth Provider `1.7.1`. Public read-only checks returned HTTP 200 for both OAuth discovery documents. Authorization-server metadata advertises `authorization_code`, `refresh_token`, PKCE `S256`, the exact Commercial resource and `offline_access`; protected-resource metadata advertises only `commercial:read` and `commercial:safe_write`.

**DETECTED — REPRODUCED FAILURE:** authorization and token exchange succeed, MCP calls initially return 200, and the resource starts returning 401 approximately 15 minutes after issuance. No refresh-token request reaches the token endpoint before the failed resource call. Reauthorization restores access for another equivalent interval.

**DETECTED — REPOSITORY/PROVIDER CAUSAL MECHANISM:** the wrapper forwards the authorization request scope set unchanged. Better Auth 1.7.1 always returns normal expiry metadata but issues and persists a delegated refresh token only when the authorized grant contains `offline_access`. Its refresh handler can inherit the stored resource when the refresh request omits `resource`, while the application wrapper currently requires that request parameter for both grant types.

**INFERRED — ROOT CAUSE:** ChatGPT's resource-driven authorization did not establish `offline_access` because the protected-resource discovery document omitted it, leaving only a 15-minute access credential. The wrapper's mandatory refresh `resource` is a secondary interoperability defect; it did not cause the observed cycle because Production saw no refresh request.

**PROPOSED — NOT DEPLOYED:** the bounded fix advertises `offline_access` in both discovery documents and permits `resource` to be omitted only for `refresh_token`. A supplied resource must still equal the exact Commercial resource, and an omitted value succeeds only after the stored refresh record, client metadata, live provider session and current staff permission all pass the existing exact-resource checks. Authorization-code exchange still requires the exact resource. No schema, migration, token-TTL, tool, Commercial authority or Production environment change is included.

## Production acceptance after Commercial Ops migration

**DETECTED:**

- `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY, targets Production/main and served the canonical B4GAMBLE aliases at the bounded post-migration acceptance check.
- `https://b4gamble.com/` returned HTTP 200 from that verified post-cleanup runtime deployment.
- Anonymous access to `/admin/commercial` remains protected and resolves to the B4GAMBLE CMS Login flow rather than exposing Commercial Admin content.
- No Vercel runtime errors were detected in the bounded post-migration verification window.

**LIMITATION:** an authenticated post-migration Production Admin read/write walkthrough was not executed because the available verification tooling did not have an authorised B4GAMBLE Admin application session. This does not negate the direct Production migration verification or the exact-head CI/browser coverage from COMMERCIAL-OPS-01; it only limits the claim about a live authenticated manual walkthrough.

## Commercial conclusion

**DETECTED — the internal Commercial OS is deployed and its Production schema is ready.**

This means B4GAMBLE can proceed to the first real partner acquisition/qualification workflow without another CRM/Agent construction workstream.

It does **not** mean that a partner relationship, affiliate acceptance, GB eligibility, deal terms, tracking destination, commercial offer or active outbound route exists.

The next commercial operating loop is:

`DISCOVER → QUALIFY → PREPARE APPLICATION → DRAFT OUTREACH → TRACK RESPONSE → FOLLOW-UP → EXTRACT DEAL TERMS → PREPARE ACTIVATION`

A real GB commercial route remains fail-closed and requires evidence/authority for the exact partner and action, including real acceptance/agreement, explicit GB permission, correct identity, current UKGC licence/exact-domain evidence where applicable, real offer, safe tracking destination, significant conditions, adjacent disclosure, Preview validation, Founder activation approval and a working kill switch/rollback.

Missing, stale, unknown or contradictory authority remains deny-by-default. A public affiliate page is not evidence that B4GAMBLE has been accepted.

## Public legal conclusion

**DETECTED — public legal implementation for the current GB launch scope remains ready in Production.**

Current public legal implementation includes Privacy, Terms, Affiliate Disclosure, Programme just-in-time sensitive-input disclosure/explicit consent, responsible-gambling/protected-Help boundaries and commercial disclosure wording.

**DETECTED — SIGNED LETTERS OF APPOINTMENT, 22 AUGUST 2026:** 7BE Inc. has appointed Prighter EU Rep GmbH as its representative pursuant to Article 27 of the EU GDPR and Prighter Ltd as its representative pursuant to Article 27 of the UK GDPR. The 24 August 2026 bounded Privacy Policy release publishes the signed-LOA identities and addresses, the official Prighter data-subject portal, and both official live representation certificates. This does not appoint Prighter as a DPO or establish gambling, licensing, general legal or full-GDPR-compliance authority.

Public legal copy does not create or imply operator licensing, affiliate approval, partnership, regulatory approval or jurisdiction eligibility that has not been separately evidenced.

## Open legal / administrative deferrals

The EU and UK Article 27 appointments and their approved public particulars are no longer part of the deferred list. The following remain **OPEN — DEFERRED BY FOUNDER** and must not be described as completed:

1. **ICO registration / data-protection fee** — execution/evidence is not completed.
2. **Account-specific provider evidence** — exact plan/entity, accepted DPA/CDPA/terms, processing locations and applicable transfer mechanism evidence remain to be captured where not already evidenced.
3. **OpenAI project-specific controls evidence** — do not claim ZDR, MAM or a specific region without actual B4GAMBLE account/project evidence.
4. **DPIA approval record / ongoing review evidence** — do not invent internal signatures/completion.

The Founder has chosen not to delay initial market entry solely for these bounded administrative items. That risk decision does not complete the obligations or convert unknown external facts into detected facts.

## Launch recommendation

**GO WITH CONDITIONS.**

- **Website / product:** GO — ready.
- **Public legal implementation:** GO — ready for current scope.
- **Commercial CRM / Partner Operations:** GO — deployed, Production schema applied and verified.
- **Administrative legal follow-up:** OPEN under the existing Founder-accepted deferral posture.
- **Commercial activation:** GO only after a real partner passes the activation gate and the Founder explicitly authorises the activation.

## Reopen conditions

Reopen completed product/legal/Commercial OS architecture only for new material scope or evidence, including:

- Production regression;
- material Programme/product behaviour change;
- new provider or materially changed data handling;
- new data category/purpose/commercial use;
- new jurisdiction;
- material change in gambling/privacy/consumer-law requirements;
- new advertising/analytics/tracking technology;
- material change to public claims, partner model or commercial routing;
- evidence that the Commercial CRM/Partner Operations architecture cannot support the first real partner workflow safely.

Otherwise proceed to real partner acquisition and commercial operations rather than reopening completed site/legal/CRM construction work.

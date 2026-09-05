# FULL-SITE-QA-01 Implementation Evidence

## Status

**HOLD / IMPLEMENTATION AND AUDIT EVIDENCE COMPLETE / DRAFT PR ONLY.** This evidence record was created on 2026-08-13 from the active repository and read-only Production observations, then closed with hosted and Preview evidence after implementation-and-audit head `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`. This documentation-only closure follows that head and necessarily receives a later commit SHA; it does not claim that `60c30e3` is its own SHA. It does not authorise merge, Production deployment, configuration changes, credential changes, external communications, or data mutation.

The current HOLD is not a build-status conclusion. Read-only Production evidence shows two environment capabilities that conflict with the approved Production boundary: the feature-on PROGRAM-AI experience renders at `/program`, and Google is offered at `/login`. The repository documentation says both Production capabilities remain off unless separately authorised. The source branch can correct software defects, but it cannot reconcile or change that Production control-plane state under this audit's safety boundary.

## Record identity

| Field | Evidence |
| --- | --- |
| Audit window | **DETECTED:** overnight 2026-08-13–2026-08-14 (repository census refreshed at `2026-08-13T23:59:47+05:00`). |
| Repository root | **DETECTED:** `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`, confirmed by `git rev-parse --show-toplevel`. |
| Repository | **DETECTED:** `AlexG-7BE/sevenbet-next`. |
| Base SHA | **DETECTED:** `c52595405f0800c8c2b51d5951c4a8d45c133034`. |
| Source main at audit start | **DETECTED:** `c52595405f0800c8c2b51d5951c4a8d45c133034`; merge commit for PR #71. |
| Latest main at completion | **DETECTED:** `c52595405f0800c8c2b51d5951c4a8d45c133034`; direct remote and local `origin/main` verification matched. |
| Final implementation-and-audit head before closure | **DETECTED:** `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`. It contains the strengthened exact-demo fallback, adjacent comparison disclosure, independent sitemap-loader failure containment, deterministic browser fixtures and mode-neutral Programme metadata. This documentation-only closure follows it and will have a later SHA. |
| Documentation-closure identity boundary | **DETECTED:** `60c30e3` is the exact implementation-and-audit evidence head verified below, not an impossible self-SHA claim for this later documentation edit. |
| Branch | **DETECTED:** `codex/full-site-integrity-audit-01`. |
| Draft PR | **DETECTED:** PR #72, `https://github.com/AlexG-7BE/sevenbet-next/pull/72`; Open, Draft, unmerged and `CLEAN` at the final verification checkpoint. |
| Production deployment | **DETECTED:** `dpl_Hvvjqn3nDSf59vRMztyvXgQyKNx3`, Ready. |
| Production source SHA observed | **DETECTED:** `c52595405f0800c8c2b51d5951c4a8d45c133034`. |
| Source/Production parity at start | **DETECTED:** exact SHA match at `c52595405f0800c8c2b51d5951c4a8d45c133034`. Runtime configuration is not in parity with the documented activation boundary; see Contradictions. |
| Preview deployment | **DETECTED:** deployment `5895324564`, Ready at `2026-08-13T20:14:35Z`, for exact implementation-and-audit head `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`; immutable URL `https://sevenbet-next-95l54yjnq-alexg-7bes-projects.vercel.app`; stable branch alias `https://sevenbet-next-git-codex-full-site-in-ae3239-alexg-7bes-projects.vercel.app`. |
| Governing host RFC | **DETECTED:** RFC-030 is approved for the bounded branch implementation. |
| Voice-limit RFC | **PROPOSED:** RFC-031 remains `Proposed — no implementation or deployment authority`; the RFC-023 8 MiB/Vercel payload conflict remains unresolved. |

## Evidence method and classification

The Product Vision & Principles, Project State, Roadmap, founder brief, relevant RFCs, Programme standards, and current implementation were reviewed before this record was created. Product Vision remains the highest authority. The active repository was scanned across `app`, `components`, `lib`, `prisma`, `scripts`, `tests`, `agents`, `public`, `docs`, configuration, and workflows. Dependencies, `.next`, build output, caches, Playwright output, coverage, and `tsconfig.tsbuildinfo` were excluded. Secret values were neither printed nor recorded.

Evidence labels in this document are strict:

- **DETECTED:** direct repository, test, browser, HTTP, deployment, or log evidence proves the statement.
- **INFERRED:** the conclusion follows reasonably from detected evidence but was not observed directly.
- **PROPOSED:** a future action or decision that has not been approved/performed.
- **UNKNOWN:** evidence is insufficient.
- **CONTRADICTION:** reliable evidence sources disagree.

The route/API census below is **DETECTED** from the active filesystem. Product classification (`PUBLIC`, `AUTH`, `PROGRAMME`, `ADMIN`, `API`, `REDIRECT`, `INTERNAL/UTILITY`, `DEPRECATED`) is separate from the evidence label.

## Executive checkpoint

| Area | Result |
| --- | --- |
| Canonical Production origin | **DETECTED P0:** `https://sevenbet-next.vercel.app/login` returned `200` and rendered the app instead of redirecting. Signed-in inspection also rendered the git-main/account/immutable Production aliases in place. Branch commit `e5bec20` adds a constant-origin Production `308`; Production is unchanged. |
| Environment authority | **CONTRADICTION P1 / HOLD:** live Production renders feature-on PROGRAM-AI and presents Google, while approved documentation records both Production activations as off/separately gated. |
| Public data authority | **DETECTED P1:** the starting Production `/api/public/casinos` path exposed legacy operator-like claims; the branch makes deployed public casino/bonus reads CMS-only and fail-closed. Production is unchanged. |
| Programme integrity | **DETECTED P1:** feature-on legacy mutation endpoints and an incorrect Home reward/remaining-Mission projection were found. Branch guards and server-projection corrections are present; local Programme 108/108, hosted Quality and signed read-only Programme Preview evidence passed at the recorded implementation head. Real provider/manual flows remain separate. |
| Voice | **DETECTED P1:** current code/RFC-023 allow 8 MiB, but Vercel documents a 4.5 MB complete Function payload ceiling. RFC-031 proposes 4 MiB plus a bounded envelope but is not approved. |
| Admin/CMS | **DETECTED:** staff/permission, navigation, direct-data-read, workflow-action, branding, safe-error, and private-cache defects are committed at implementation head `60c30e3`; exact Preview admin login rendered B4GAMBLE/noindex. Final isolated role E2E remains **UNKNOWN/PENDING**. |
| Public product | **DETECTED:** demo truthfulness, adjacent selected-card demo disclosure, compare indexability, metadata, independently resilient sitemap loading, Best Offers, responsive, error-state, favicon, and accessibility corrections are committed at the recorded implementation head. Signed read-only exact-deployment checks covered Home, Programme, Best Offers, truthful empty fail-closed comparison, the noindex/non-commercial demo profile and admin login. Full manual/external-provider coverage remains pending. |
| Test checkpoint | **DETECTED branch evidence:** the quality/build/build-secret/disposable-database/seed/standard Chromium gates recorded below passed. The final deterministic `CI=true npm run browser:extended` gate passed 89/89 across nine specs with zero failures, skips or retries and exact cleanup. The final exact-build read-only Chromium/WebKit matrix passed 308/308 navigations, 1,848/1,848 matrix assertions and 39/39 WebKit interactions across all eleven required widths and 13 primary routes plus intentional 404, with zero failures and zero non-read-only requests. At head `60c30e3`, all six hosted contexts were green: Quality 59s; Database / Migration Verification 1m3s; Build / Browser 3m15s with 43 passes and one intentional missing-Google-credentials skip; Agent Core 13s; Vercel success; Vercel Preview Comments success. Firefox remains pending. |
| Readiness result | **HOLD:** Production control-plane contradictions and remaining Firefox, real external-provider/device and manual evidence prevent a release-ready conclusion. The hosted/Preview identity placeholders themselves are closed. |

## Current state

### Latest relevant source

| Item | Evidence |
| --- | --- |
| PR #71 | **DETECTED:** merged as base `c525954…`; microphone recovery, standalone `/login`, Google existing-account recovery/linking, Best Offers demo fallback, tests, and documentation are present in source. |
| PR #68 | **DETECTED:** Contact/error source is included in current main through PR #71's ancestry. |
| PR #72 | **DETECTED:** Open, Draft, unmerged and `CLEAN` at implementation-and-audit head `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`. This later documentation-only closure does not claim that SHA as its own. |
| RFC-030 | **DETECTED:** bounded canonical-host implementation authority, with no platform/DNS/environment mutation. See `docs/06_RFC/RFC-030-Production-Canonical-Host-Enforcement.md`. |
| RFC-031 | **PROPOSED:** no code or deployment authority. See `docs/06_RFC/RFC-031-Vercel-Compatible-Programme-Voice-Upload-Limit.md`. |
| RFC-032 | **DETECTED APPROVED BOUNDED AUTHORITY:** exact-manifest, noindex, non-commercial review-detail continuity only; no directory, API, sitemap, CMS, commercial, merge or Production authority. See `docs/06_RFC/RFC-032-Exact-Demo-Detail-Continuity.md`. |

### Pushed implementation-and-audit commits before documentation closure

| SHA | Detected commit subject |
| --- | --- |
| `e5bec20ac7a2635b156730a4e8f408b41d5ebe16` | `fix(host): enforce canonical production origin` |
| `6c0a3be4d7b7df6de2cbba4fae1777b55c02e732` | `fix(admin): enforce role-aware CMS boundaries` |
| `76ad17cb9857f601e7e4e5efc8a62ecd2dfd4276` | `fix(auth): harden private access and analytics consent` |
| `3c16ef132fe36c08b1089303d03ef45abca837e3` | `fix(programme): restore exclusive progress authority` |
| `03c5ad6bc50bce7207351ab521a698ff328f2aa4` | `fix(public): fail closed on demo and legacy data` |
| `63ff3241c0387a795bf23b688ade73f78b7aac04` | `fix(a11y): repair responsive interaction contracts` |
| `1cdd73cfee88ff05923bc286948044eb964aaa3f` | `test(qa): gate full regression coverage` |
| `9e7df95090c291e4397d5dad69fbd7391b9828da` | `test(qa): isolate sitemap canonical contract` |
| `403a0abb2b969b2e241f8cb83a3097a8aefd6673` | `fix(seo): noindex empty public directories` |
| `2f67bc1a2acd0e35bc1285a11cd7f447a9579515` | `fix(public): restore exact demo detail destinations` |
| `61b2f034fcd596caca33b76bba185ca11612dabd` | `fix(public): complete classified demo integrity` |
| `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e` | `docs(qa): reconcile production readiness evidence` |

**DETECTED:** the twelve commits above are pushed and descend from exact base `c52595405f0800c8c2b51d5951c4a8d45c133034`. `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e` is the final implementation-and-audit head verified by hosted CI and Preview. This documentation-only closure follows it and therefore is intentionally not represented as having the same SHA.

### Feature flags and manual gates

| Flag/capability | Source default/contract | Observed environment effect | Classification |
| --- | --- | --- | --- |
| `PROGRAM_AI_V1_ENABLED` | Exact `true` only; `.env.example` is `false`; feature-off must remain legacy. | Production `/program` rendered the feature-on experience. | **CONTRADICTION / P1.** No approved Production activation record was detected. |
| `PROGRAM_AI_REAL_PROVIDER_ENABLED` + provider/key | Exact server-side gate; `.env.example` is `false`; RFC-023 authorises controlled Preview evidence only. | No real Production provider call was made. | **UNKNOWN:** provider connectivity in current Production; **CONTRADICTION:** feature-on UI exposure itself. |
| Google credentials | Google UI appears only when both server credentials are complete; identity-only scopes. | Production `/login` presented Google. No OAuth round trip was initiated. | **CONTRADICTION / P1:** runtime availability conflicts with docs; **UNKNOWN:** current real round-trip result. |
| `AFFILIATE_REDIRECT_ENGINE_ENABLED` | Default `false`; exact true required plus jurisdiction/partner/action authority. | No real GB partner authority detected; commercial/referral remains off. | **DETECTED:** fail-closed source boundary; live real outbound success not tested because it is not authorised. |
| `PUBLIC_CASINO_CMS_ENABLED` | Local/config flag defaults false. Audit branch forces CMS authority in Vercel Preview/Production. | Starting Production API exposed legacy data when the deployed source evaluated the old mode. | **DETECTED P1:** branch correction in `lib/services/public-casino.service.ts:20-23`; Production unchanged. |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | Exact opt-in, default false. | Current Production flag value was not exposed. | **UNKNOWN:** Production activation; **DETECTED:** disabled branch client reads/writes no analytics marker storage. |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | Exact true plus complete server-only Resend configuration; default false. | No Contact submission or email was sent during this audit. | **UNKNOWN:** current live delivery enablement; historical bounded provider/mailbox evidence is not a fresh runtime check. |
| `CMS_PHASE1_ALLOW_DEV_ADMIN` | Default false; legacy token path is explicit only. | Production staff access is expected through Better Auth. | **DETECTED:** middleware and protected layout/route handlers re-check authority. |
| `JURISDICTION_RESOLVER_SHADOW_ENABLED` | Default false; diagnostics only. | No live effect inspected. | **UNKNOWN:** runtime value; no public authority is derived from it. |
| `CRON_SECRET` | Blank locally; required for expiry cron. | Route exists; runtime scheduling/secret state was not inspected. | **UNKNOWN:** current activation. |
| `LAUNCH_POLISH_ERROR_HARNESS` | Test-only, local Playwright origin, non-Production. | Production route resolves as not found unless every test constraint is met. | **DETECTED:** internal/utility route, not a public feature. |

Manual gates still include a physical/native microphone permission pass, a controlled real existing-account Google recovery/link round trip, final isolated admin-role E2E, final Contact receipt only if an already-configured Preview is safely enabled, manual screen-reader inspection, and native iOS microphone behaviour. Automation/emulation must not be described as those real-device/provider results.

### Data and integration inventory

| Area | Current evidence |
| --- | --- |
| Demo casino inventory | **DETECTED:** 25 exact fictional scenario records and 75 generated SVG assets under `public/demo-casinos/`. They are `DEMO_FIXTURE`, use `.example` domains, suppress commercial actions, and must remain noindex/no commercial schema. |
| Best Offers demo | **DETECTED:** bounded fallback requests at most 12 records and labels demo inventory. A demo CTA may link only to an internal demo profile. |
| Real published casino/offer authority | **UNKNOWN:** no complete real GB partner/licence/agreement/link evidence was detected. **DETECTED:** commercial policy remains off. |
| Starting Production public API | **DETECTED:** legacy `10bet`-like score/licence/country/offer claims were returned by `/api/public/casinos`; the associated profile was indexable and emitted schema. Branch fixes remove deployed legacy fallback. |
| Articles API | **DETECTED:** `/api/public/articles` is backed by the in-memory CMS seed surface rather than the static Learning Center corpus. **UNKNOWN:** whether it is intended as a durable public editorial contract. |
| Vercel | **DETECTED:** active hosting/deployments, current Production deployment Ready. |
| Prisma Postgres | **DETECTED:** application persistence and separately documented Preview/Production isolation/restore evidence. The audit used a disposable local `_ci` database to apply 19/19 migrations, pass 3/3 PostgreSQL runtime cases, and complete the ten-step Programme seed; Production remained untouched. |
| Better Auth | **DETECTED:** email/password, optional Google identity, sessions, staff boundary, and stripped OAuth-token persistence hooks. |
| OpenAI | **DETECTED:** source adapters for Responses/transcription; current real Production invocation not tested. |
| Resend/Google Workspace | **DETECTED:** Contact-only adapter and historical controlled delivery evidence; no audit send. Account/Programme/marketing mail remains separate and disabled. |
| Vercel Analytics | **DETECTED:** bounded event contract behind exact default-off flag. |
| S3-compatible media | **DETECTED:** optional provider code; current runtime activation unknown. Local provider is unavailable in Production. |
| Affiliate network adapters | **DETECTED:** provider/integration framework including Everflow-oriented administration; no real active partner connection or authority detected. |
| Payments/queues/APM/paging | **DETECTED:** no application payment/queue/APM/paging integration source was found. **UNKNOWN:** whether external infrastructure exists outside the repository. |

## Repository census

**DETECTED at implementation-and-audit head `60c30e3`:** 1,021 tracked repository files and zero untracked files, after excluding `.git`, dependencies, generated/build directories, caches, test output, coverage, visual-regression output, and `tsconfig.tsbuildinfo`. This documentation-only closure changes content in tracked files but does not change that file count.

| Measure | Detected count |
| --- | ---: |
| App Router page files | 63 |
| API `route.ts` files under `app/api` | 90 |
| Non-API route handlers | 3 |
| Exported method/route pairs | 126: GET 45, POST 54, PATCH 15, DELETE 9, PUT 3 |
| Special App Router layout/error/not-found/loading files | 23 |
| Prisma migration directories | 19 |
| Public assets | 88 |
| Root test/spec files at the refreshed audit-branch scan | 101 |
| Isolated `agents/` test/spec files | 7 |

**DETECTED RESOLVED at implementation-and-audit head `60c30e3`:** all 11 files in `docs/05_Engineering/Technical_Baseline/` were reconciled to exact current-main `c525954` facts, including 63 pages, 90 API handlers, three non-API handlers, 19 migrations, and 88 public assets. The larger refreshed counts above describe the active audit branch and therefore must not be substituted for the separately labelled current-main baseline. This later documentation-only closure preserves those counts and will necessarily have a later SHA.

## Filesystem page-route matrix

All rows are **DETECTED** from `app/**/page.tsx`. Route-group directories do not affect URLs.

| Route | Classification | Source/behaviour |
| --- | --- | --- |
| `/` | PUBLIC | `app/(public)/page.tsx`; home. |
| `/10-steps` | PUBLIC / PROGRAMME | Programme explanation/start surface. |
| `/about` | PUBLIC | Product/company boundary. |
| `/affiliate-disclosure` | PUBLIC | Commercial disclosure. |
| `/best-offers` | PUBLIC | Published-only or explicit demo/fail-closed projection. |
| `/bonus-guide` | PUBLIC | Educational guide. |
| `/bonuses` | PUBLIC | Published/demo-classified bonus directory. |
| `/casino/[slug]` | PUBLIC | Dynamic CMS profile; invalid/unpublished slug must 404. |
| `/casinos` | PUBLIC | Dynamic directory. |
| `/catalog` | DEPRECATED / REDIRECT | Permanent redirect to `/casinos`, preserving query. |
| `/compare` | PUBLIC | Dynamic comparison. |
| `/contact` | PUBLIC | General enquiry; protected Help remains separate. |
| `/faq` | PUBLIC | FAQ. |
| `/launch-polish-error-harness` | INTERNAL/UTILITY | Test-only error harness; otherwise 404. |
| `/learn` | PUBLIC | Learning Center index. |
| `/learn/[category]` | PUBLIC | Dynamic category; invalid category 404. |
| `/learn/[category]/[slug]` | PUBLIC | Dynamic article; invalid object 404. |
| `/login` | AUTH / PUBLIC | Standalone email/password and optional Google identity. |
| `/methodology` | PUBLIC | Editorial/ranking method. |
| `/outbound/[slug]` | REDIRECT / PUBLIC | Legacy compatibility redirect to `/r/[slug]`; invalid slugs fail to unavailable and no confirmation UI renders. |
| `/outbound/unavailable` | PUBLIC | Truthful no-action state. |
| `/privacy` | PUBLIC | Noindex privacy notice. |
| `/self-check` | PUBLIC | Local-only non-clinical reflection. |
| `/terms` | PUBLIC | Terms. |
| `/tools/budget-calculator` | PUBLIC | Local-only personal limit tool. |
| `/admin/login` | ADMIN / AUTH | Public entry surface, noindex; no admin data. |
| `/admin` | ADMIN / AUTH | Protected dashboard. |
| `/admin/[section]` | ADMIN / AUTH | Protected allow-list: `learning`, `bonuses`, `users`, `analytics`, `settings`; `program` redirects to `/admin/programs`; unknown values 404. Dedicated routes take precedence. |
| `/admin/achievements` | ADMIN / AUTH | Protected achievement management. |
| `/admin/program-settings` | ADMIN / AUTH | Protected Programme settings. |
| `/admin/programs` | ADMIN / AUTH | Protected Program list/workflow. |
| `/admin/programs/new` | ADMIN / AUTH | Protected create form. |
| `/admin/programs/[programId]` | ADMIN / AUTH | Protected record. |
| `/admin/programs/[programId]/builder` | ADMIN / AUTH | Protected builder. |
| `/admin/programs/[programId]/preview` | ADMIN / AUTH | Protected preview. |
| `/admin/programs/[programId]/revisions` | ADMIN / AUTH | Protected revision history. |
| `/admin/xp-rules` | ADMIN / AUTH | Protected XP policy administration. |
| `/admin/casinos` | ADMIN / AUTH | Protected casino list. |
| `/admin/casinos/new` | ADMIN / AUTH | Protected create form. |
| `/admin/casinos/[casinoId]` | ADMIN / AUTH | Protected record. |
| `/admin/casinos/[casinoId]/builder` | ADMIN / AUTH | Protected builder. |
| `/admin/casinos/[casinoId]/preview` | ADMIN / AUTH | Protected preview. |
| `/admin/casinos/[casinoId]/revisions` | ADMIN / AUTH | Protected revisions. |
| `/admin/affiliate` | ADMIN / AUTH | Protected affiliate dashboard. |
| `/admin/affiliate/import` | ADMIN / AUTH | Protected import workflow. |
| `/admin/affiliate/matching` | ADMIN / AUTH | Protected mapping workflow. |
| `/admin/affiliate/networks` | ADMIN / AUTH | Protected network list. |
| `/admin/affiliate/networks/new` | ADMIN / AUTH | Protected create form. |
| `/admin/affiliate/networks/[networkId]` | ADMIN / AUTH | Protected network record. |
| `/admin/affiliate/offers` | ADMIN / AUTH | Protected offer list. |
| `/admin/affiliate/offers/new` | ADMIN / AUTH | Protected create form. |
| `/admin/affiliate/offers/[offerId]` | ADMIN / AUTH | Protected offer record. |
| `/admin/affiliate/programs` | ADMIN / AUTH | Protected affiliate-program list. |
| `/admin/affiliate/programs/new` | ADMIN / AUTH | Protected create form. |
| `/admin/affiliate/programs/[programId]` | ADMIN / AUTH | Protected affiliate-program record. |
| `/admin/affiliate/sync` | ADMIN / AUTH | Protected sync-job list. |
| `/admin/affiliate/sync/[jobId]` | ADMIN / AUTH | Protected job record. |
| `/editorial-preview/[token]` | INTERNAL/UTILITY / ADMIN | Token-gated editorial preview, noindex. |
| `/program` | PROGRAMME / AUTH-OPTIONAL | Anonymous Mission 01 entry or authenticated Home, selected by server session/flag. |
| `/program/[...missing]` | PROGRAMME / INTERNAL/UTILITY | Explicit Programme 404 capture. |
| `/responsible-gambling` | PUBLIC / PROTECTED HELP | Help hub, open without Programme/account/commercial gates. |
| `/responsible-gambling/[slug]` | PUBLIC / PROTECTED HELP | Help article; invalid slug 404. |
| `/responsible-gaming` | DEPRECATED / REDIRECT | Permanent redirect to `/responsible-gambling`. |

### Special App Router surfaces

| Scope | Detected files/result |
| --- | --- |
| Root | `app/layout.tsx`, `app/global-error.tsx`, `app/not-found.tsx`. |
| Public | `app/(public)/layout.tsx`, public `error.tsx`; Best Offers error/loading; bonuses error; casino-detail error/not-found; casinos error; compare error. |
| Admin | Root admin layout/error/not-found; protected layout; affiliate protected layout; casino-builder error/loading. |
| Programme/Help | Programme not-found; responsible-gambling layout/not-found. |
| Metadata/utility | `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/icon.svg`. |

## Filesystem API and route-handler matrix

All handler/method rows are **DETECTED** from named exports in the active `route.ts` files. Unexported methods resolve through the framework's method-not-allowed behaviour; that was not separately exercised for every endpoint.

### Admin APIs — 40 handlers

All routes in this table are classified `ADMIN / AUTH / API`. The branch requires staff plus route/entity-specific permission where applicable, sets private/no-store response policy through middleware/handlers, and uses stable service-error envelopes. Final real-role E2E is **UNKNOWN/PENDING**.

| Route | Methods |
| --- | --- |
| `/api/admin/[entity]` | GET, POST |
| `/api/admin/[entity]/[id]` | GET, PATCH, DELETE |
| `/api/admin/affiliate/conflicts` | GET |
| `/api/admin/affiliate/imports/[jobId]/apply` | POST |
| `/api/admin/affiliate/imports/preview` | POST |
| `/api/admin/affiliate/jobs` | GET |
| `/api/admin/affiliate/jobs/[jobId]` | GET |
| `/api/admin/affiliate/mappings` | GET |
| `/api/admin/affiliate/mappings/[mappingId]/match` | POST |
| `/api/admin/affiliate/networks` | GET, POST |
| `/api/admin/affiliate/networks/[networkId]` | GET, PATCH |
| `/api/admin/affiliate/offers` | GET, POST |
| `/api/admin/affiliate/offers/[offerId]` | GET, PATCH |
| `/api/admin/affiliate/offers/[offerId]/duplicate` | POST |
| `/api/admin/affiliate/preview` | POST |
| `/api/admin/affiliate/programs` | GET, POST |
| `/api/admin/affiliate/programs/[programId]` | GET, PATCH |
| `/api/admin/affiliate/programs/[programId]/connection-test` | POST |
| `/api/admin/affiliate/providers` | GET |
| `/api/admin/affiliate/redirect-preview` | GET |
| `/api/admin/affiliate/redirect-slugs` | GET, POST |
| `/api/admin/affiliate/redirect-slugs/[redirectSlugId]` | GET, PATCH |
| `/api/admin/affiliate/reference-data` | GET |
| `/api/admin/casinos` | GET, POST |
| `/api/admin/casinos/[casinoId]` | GET, PATCH |
| `/api/admin/casinos/[casinoId]/action` | POST |
| `/api/admin/casinos/[casinoId]/revisions` | GET |
| `/api/admin/editorial-reviews/[casinoId]` | GET, PUT |
| `/api/admin/editorial-reviews/[casinoId]/action` | POST |
| `/api/admin/logout` | POST |
| `/api/admin/media` | GET |
| `/api/admin/media/upload` | POST |
| `/api/admin/media/reorder` | POST |
| `/api/admin/media/[mediaId]` | GET, PATCH, DELETE |
| `/api/admin/media/[mediaId]/archive` | POST |
| `/api/admin/programme/active-days/[activeDayId]/void` | POST |
| `/api/admin/programs` | GET, POST |
| `/api/admin/programs/[programId]/action` | POST |
| `/api/admin/programs/[programId]/builder` | GET, PATCH |
| `/api/admin/programs/[programId]/revisions` | GET, POST |

### Programme APIs — 44 handlers

All routes in this table are classified `PROGRAMME / API`; some are anonymous-session, some authenticated, and some support both through explicit authority. Non-GET `/api/program/**` requests also pass the central age-attestation middleware. The audit branch prevents legacy mutations when exact feature-on PROGRAM-AI mode is active; read-only compatibility routes remain available where intentionally required.

| Route | Methods | Contract note |
| --- | --- | --- |
| `/api/program/artefacts/active-boundary` | PATCH, DELETE | Authenticated legacy artefact mutation; feature-on conflict guard. |
| `/api/program/artefacts/current-goal` | PATCH, DELETE | Authenticated legacy artefact mutation; feature-on conflict guard. |
| `/api/program/artefacts/moment-map` | PATCH, DELETE | Authenticated legacy artefact mutation; feature-on conflict guard. |
| `/api/program/artefacts/urge-learning-record` | PATCH, DELETE | Authenticated legacy artefact mutation; feature-on conflict guard. |
| `/api/program/claims/redeem` | POST | Legacy claim; feature-on conflict guard. |
| `/api/program/dashboard` | GET | Authenticated server projection. |
| `/api/program/missions/01` | PATCH | Legacy M1 mutation; feature-on conflict guard. |
| `/api/program/missions/01/complete` | POST | Legacy M1 completion; feature-on conflict guard. |
| `/api/program/missions/02` | GET, PUT | Legacy read/write; write is feature-on guarded. |
| `/api/program/missions/02/complete` | POST | Legacy completion; feature-on guard. |
| `/api/program/missions/03` | GET, PUT | Legacy read/write; write is feature-on guarded. |
| `/api/program/missions/03/complete` | POST | Legacy completion; feature-on guard. |
| `/api/program/missions/04` | GET, PATCH | Legacy read/write; write is feature-on guarded. |
| `/api/program/missions/04/complete` | POST | Legacy completion; feature-on guard. |
| `/api/program/program-ai/authority` | GET, POST, DELETE | Narrow sensitive-input authority status/create/withdraw. |
| `/api/program/program-ai/claim` | POST | Anonymous-to-auth claim creation. |
| `/api/program/program-ai/claims/redeem` | POST | Claim redemption. |
| `/api/program/program-ai/home` | GET | Authenticated server-owned Home projection. |
| `/api/program/program-ai/missions/[missionNumber]` | GET | Mission projection. |
| `/api/program/program-ai/missions/[missionNumber]/actions` | POST | Closed structural action and XP authority. |
| `/api/program/program-ai/missions/[missionNumber]/complete` | POST | Completion and exact-once XP authority. |
| `/api/program/program-ai/missions/[missionNumber]/guidance` | POST | Optional bounded provider/fallback guidance. |
| `/api/program/program-ai/reviews/[milestone]` | GET, POST | Completion-derived Review projection/generation; zero XP. |
| `/api/program/program-ai/session` | POST | Anonymous M1 session under signed access proof. |
| `/api/program/program-ai/starting-point` | POST | Confirmed Starting Point persistence. |
| `/api/program/program-ai/support/continue` | POST | User-owned continuation after support pause. |
| `/api/program/program-ai/transcription` | POST | Multipart voice upload; current 8 MiB contract conflicts with Vercel cap. |
| `/api/program/program-ai/turn` | POST | Typed/transcribed situation turn; bounded provider/fallback. |
| `/api/program/progress` | GET | Compatibility progress read. |
| `/api/program/progress/complete` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/current-step` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/exercise` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/lesson` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/merge` | POST | Compatibility merge; branch feature-on guard. |
| `/api/program/progress/quiz` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/scenario` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/start` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/progress/step` | POST | Compatibility mutation; branch feature-on guard. |
| `/api/program/reflections` | GET, POST, DELETE | Authenticated legacy access/deletion; create is retired/local-only and feature-on guarded. |
| `/api/program/rewards` | GET | Authenticated server-owned reward read. |
| `/api/program/session` | POST, DELETE | Legacy anonymous session create/delete; mutation conflict guard in feature-on mode. |
| `/api/program/session/mission-01` | PATCH | Legacy session M1 mutation; feature-on guard. |
| `/api/program/session/mission-01/claim` | POST | Legacy claim; feature-on guard. |
| `/api/programme-access/authority` | POST | Signed, versioned, journey-bound access proof. |

### Other APIs — 6 handlers

| Route | Classification | Methods | Contract note |
| --- | --- | --- | --- |
| `/api/auth/[...all]` | AUTH / API | GET, POST | Restricted Better Auth catch-all; branch adds 32 KiB bounded JSON read and private/no-store + `Vary: Cookie`. |
| `/api/contact` | PUBLIC / API | POST | Same-origin bounded JSON, strict keys, no DB write, optional fail-closed mail adapter. |
| `/api/internal/cron/programme-expiry-purge` | INTERNAL/UTILITY / API | GET | Exact Bearer secret; bounded purge handler. Runtime activation unknown. |
| `/api/media/[mediaId]` | PUBLIC / API | GET | Redirect to published media URL. |
| `/api/media/local/[...key]` | INTERNAL/UTILITY / API | GET | Local media only; 404 in Production. |
| `/api/public/[resource]` | PUBLIC / API | GET | Allow-list: `program`, `program-steps`, `lessons`, `articles`, `casinos`, `bonuses`; branch validates one integer `limit` and filters deployed casino/bonus data to CMS source. |

### Non-API route handlers — 3

| Route | Classification | Methods | Contract note |
| --- | --- | --- | --- |
| `/go/[slug]` | REDIRECT / COMMERCIAL | GET | Governed redirect entry; must fail closed without exact authority. |
| `/r/[slug]` | REDIRECT / COMMERCIAL | GET | Server-authoritative affiliate redirect; allow-list/evidence/jurisdiction checks. |
| `/llms.txt` | PUBLIC / INTERNAL/UTILITY | GET | Public crawler summary; branch removes legacy records and unsupported commercial claims. |

## Canonical-host acceptance matrix

Production has not received the branch fix. Source-level `DETECTED` means the branch resolver/tests prove the intended decision; it is not a claim about current Production behaviour. `lib/auth/runtime-canonical-host.ts:13-65` contains the constant origin and environment switch. `middleware.ts` applies it before auth/admin/Programme/API policy. RFC-030 records the authority and rollback.

| Input | Read-only current Production evidence | Audit-branch expected result | Final Preview/Production verification |
| --- | --- | --- | --- |
| `https://b4gamble.com/` | **DETECTED:** canonical app served. | Continue; no loop. | **UNKNOWN/PENDING:** final post-fix Production cannot be tested without a later authorised merge/deploy. |
| `https://b4gamble.com/best-offers` | **DETECTED:** canonical origin is active. | Continue. | **DETECTED on exact Preview:** classified fictional records, 12 internal detail destinations and no `/r` or `/go` action. |
| `https://b4gamble.com/program` | **DETECTED:** app served; feature-on runtime contradiction observed. | Continue at canonical host. | **DETECTED on exact Preview:** signed read-only route rendered with mode-neutral Programme metadata. Real provider/manual flows were not exercised. |
| `https://b4gamble.com/login` | **DETECTED:** app served; Google availability contradiction observed. | Continue at canonical host. | **UNKNOWN/PENDING.** |
| `https://b4gamble.com/admin/login` | **DETECTED:** admin login route is reachable on canonical origin. | Continue, private/no-store. | **DETECTED on exact Preview:** B4GAMBLE admin login rendered with `noindex`; no admin write/login flow was performed. |
| `http://b4gamble.com/...` | **UNKNOWN:** exact live chain was not preserved in supplied evidence. | `308` to constant HTTPS apex, path/query preserved. | **UNKNOWN/PENDING.** |
| `https://www.b4gamble.com/...` | **DETECTED:** platform returned `308` to apex. | Application fallback also produces constant-origin `308`. | **UNKNOWN/PENDING:** path/query/no-loop recheck. |
| `https://sevenbet-next.vercel.app/login` | **DETECTED P0:** returned `200` and rendered directly; no canonical redirect. | `308` to `https://b4gamble.com/login`. | **UNKNOWN/PENDING:** only a future authorised Production deploy can prove live correction. |
| Main Vercel alias | **DETECTED:** signed-in browser rendered the app in place. Unauthenticated protected auto-alias curl received Vercel SSO `302`, which does not establish application canonicalisation. | `308` to constant apex in Vercel Production. | **UNKNOWN/PENDING.** |
| Immutable Production deployment URL | **DETECTED:** signed-in browser rendered the app in place. Unauthenticated protection behaviour is a separate Vercel layer. | `308` to constant apex in Vercel Production. | **UNKNOWN/PENDING.** |
| Account/team Production alias | **DETECTED:** signed-in browser rendered the app in place. | `308` to constant apex. | **UNKNOWN/PENDING.** |
| Preview deployment host | **DETECTED:** deployment `5895324564`, Ready at `2026-08-13T20:14:35Z`, immutable `https://sevenbet-next-95l54yjnq-alexg-7bes-projects.vercel.app`, stable branch alias `https://sevenbet-next-git-codex-full-site-in-ae3239-alexg-7bes-projects.vercel.app`, source `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`. | Exact deployment transport remains on the Preview host; public canonical metadata remains `https://b4gamble.com`; Preview must never be redirected to Production. | **DETECTED:** signed read-only exact-deployment checks preserved Preview transport and public canonical authority. This documentation-only closure follows the verified source head. |
| Path with repeated/encoded query | **DETECTED in source tests:** pathname and raw query are copied to the constant destination. | Exact path/query preserved. | **UNKNOWN/PENDING:** deployed Preview/source check. |
| API POST | **DETECTED in source tests:** `308` is method-preserving. | Same path/query on apex; no Host-derived destination. | **UNKNOWN/PENDING:** live future Production. |
| OAuth callback | **DETECTED in source tests:** callback path/query preserved. | Same path/query on apex. | **UNKNOWN/PENDING:** controlled auth regression. |
| Unknown/404 route | **DETECTED in source tests:** unknown path/query preserved across redirect. | Apex serves truthful 404 after one redirect. | **UNKNOWN/PENDING:** deployed verification. |
| Local/ordinary CI | **DETECTED in source tests:** no exact `VERCEL_ENV=production`, so no Production redirect. | Continue locally. | Covered by canonical-host test. |
| Malicious/unrelated Host | **DETECTED in source tests:** destination remains `https://b4gamble.com`; never attacker-derived. | Constant-origin `308`. | Covered by canonical-host test. |

## Navigation, labels, information architecture, and brand

### Canonical vocabulary

| Intent | Canonical label/path | Evidence/result |
| --- | --- | --- |
| Public product brand | `B4GAMBLE` | **DETECTED:** branch public/admin visible strings, metadata, demo source copy, and generated demo hero art use B4GAMBLE. Legacy repository/package/cookie/storage identifiers remain intentionally compatible. |
| Product explanation | `10 Steps` → `/10-steps` | **DETECTED:** public navigation. |
| Start new Programme journey | `Start the 10-Step Program` or `Start Mission 01` → `/program?entry=start` | **DETECTED:** explicit start intent prevents login/My Programme from accidentally restarting onboarding. |
| Existing personal area | `My Programme` → `/program` | **DETECTED:** session-derived Home/start state. |
| Sign in | `Log in` → `/login` | **DETECTED:** public shell and Programme entry use the standalone login route. |
| Protected support | `Help`, `Open Help`, or `Protected Help` → `/responsible-gambling` | **DETECTED:** intentional contextual labels for the same protected destination. |
| Casino discovery | `Casinos` or contextual `Casino reviews` → `/casinos` | **DETECTED:** generally intentional context. See adjacent Programme-nav duplication below. |
| Bonus comparison | `Bonuses` → `/bonuses` | **DETECTED.** |
| Offer shortlist | `Best offers` → `/best-offers` | **DETECTED.** |
| Comparison | `Compare` → `/compare` | **DETECTED:** feature-off Programme no longer misroutes Compare to `/casinos`. |

### Link/IA findings

| Finding | Evidence/status |
| --- | --- |
| Login action entered Programme onboarding instead of standalone authentication. | **DETECTED P1 FIXED:** `Log in` consistently targets `/login`; safe return handling remains server/client validated. |
| Feature-off Programme `Compare` linked to `/casinos`. | **DETECTED P2 FIXED:** now `/compare`. |
| FAQ existed but was absent from the public footer. | **DETECTED P3 FIXED:** footer exposes `/faq`. |
| `/catalog` and `/responsible-gaming` are legacy URLs. | **DETECTED ACCEPTED:** permanent redirects to `/casinos` and `/responsible-gambling`. |
| Feature-off Programme header renders adjacent `Casinos` and `Reviews` links that both target `/casinos`. | **DETECTED P3 UNRESOLVED:** likely redundant IA in `components/programme/ActiveControlProgramme.tsx:381-385`; no functional dead end. |
| Public copy alternates `Program` and `Programme`. | **DETECTED P3 UNRESOLVED:** terminology remains inconsistent across home/legacy areas. It is not old consumer branding, but should be normalised under the existing vocabulary. |
| Home copy described only Missions 01–04 as implemented and later Missions as unavailable. | **DETECTED P1 FIXED:** Home now states Mission 01 is available and Missions 02–10 unlock in sequence, without deployment/flag language. |
| Root/global/public/admin error pages and invalid routes could trap users or omit useful alternatives. | **DETECTED P2 FIXED in branch:** root/public links are neutral, casino/compare errors link to alternatives, and admin error/not-found surfaces exist. |
| Internal crawl/final redirect-chain matrix | **UNKNOWN/PENDING:** final deployed Preview crawl has not yet been recorded. |

### Legacy brand search

**DETECTED:** branch source search across `app`, `components`, and public assets finds remaining `SevenBet`/`sevenbet` only in compatibility identifiers, storage/cookie/header keys, CSS comments, one non-visible data attribute, and repository-internal terminology. The admin login title/copy, admin shell, editorial preview, Programme heading, seeds, staff copy, and demo art were corrected to B4GAMBLE. The compatibility key is explicitly labelled as such in admin settings.

**UNKNOWN/PENDING:** final rendered Preview search and screenshots must confirm no user-visible legacy string remains. Internal package/repository/database identifiers are not a consumer defect and must not be renamed in this QA workstream.

## Functional matrix

Unless stated otherwise, `FIXED` means the correction is **DETECTED in the unmerged branch at implementation-and-audit head `60c30e3`** and has regression source/tests. Hosted gates and the bounded signed read-only Preview routes recorded below are detected; unlisted external-provider, device, write, full-grid and manual flows remain pending.

| Product area/state | Result |
| --- | --- |
| Home/public shell | **DETECTED:** explicit start vs personal Programme intent, `/login`, Help, footer legal/FAQ links, and reduced-motion/global focus corrections. **UNKNOWN/PENDING:** final desktop/mobile menu, Escape, focus return, back/forward, and full-page screenshots. |
| 10 Steps | **DETECTED:** Mission 01 available-now and sequential M02–M10 copy; inactive-card opacity/contrast corrected. **UNKNOWN/PENDING:** final overflow and carousel interaction matrix. |
| Learn/category/article | **DETECTED:** filesystem/static-data routes and invalid-object 404 behaviour in source. **UNKNOWN/PENDING:** final all-object crawl. |
| Help/articles | **DETECTED:** protected Help is publicly reachable, commercially isolated, and separately shelled. **UNKNOWN/PENDING:** final article crawl/keyboard pass. |
| Self-Check / limit tool | **DETECTED:** browser-local processing and Help escape paths. No database/commercial use detected. **UNKNOWN/PENDING:** rendered validation/large-text pass. |
| Best Offers | **DETECTED:** strict published-first/fail-closed service, exact demo fallback, roving tabs, keyboard carousel, live slide status, 44px dots, keyboard-scroll region, 1024 wrapping, and request-consistent metadata/body. |
| Casinos | **DETECTED:** deployed environments now use immutable published CMS snapshots only; demo classification/disclosure and zero commercial action retained; search button and dialog accessibility corrected. |
| Casino detail | **DETECTED:** shared request cache for metadata/body; published records require `source === "cms"`; one exact source-controlled demo manifest slug may resolve only after a successful lookup proves it is outside the managed CMS namespace. Unknown/legacy, managed unpublished, and repository-error cases fail closed; demo commercial/schema/SEO is suppressed; facts/list semantics and contrast are corrected. |
| Bonuses | **DETECTED:** CMS-backed classified results, fail-closed error/empty states, responsive card/CTA fixes, invalid-list semantics corrected, and disclosure/badge contrast improved. |
| Compare | **DETECTED:** exact-ID classification/inventory mode, no demo commercial action, overall demo/mixed disclosure plus adjacent `DEMONSTRATION DATA · Fictional profile · GB illustrative context` on each selected demo card, published-only index/schema, request-consistent metadata/body, and corrected headings/landmarks. |
| Contact | **DETECTED:** labels, required validation, bounded message fields, honeypot, same-origin API, no application DB write, no analytics body, double-submit UI protection, and safe failure path. No email sent. |
| Login | **DETECTED:** standalone form, names/autocomplete/email input mode, invalid/empty/loading controls in source/tests, safe return handling, Google conditional rendering. Real Google final flow is manual. |
| Error/404/loading | **DETECTED:** global/public/admin/Programme/Help surfaces exist; major directory/detail routes have bounded error/loading or neutral empty states. **UNKNOWN:** simulated network interruption across every route. |
| Favicon/app icon | **DETECTED P2 FIXED:** `app/icon.svg` added after Production `/favicon.ico`/PNG and document icon linkage were absent. **UNKNOWN/PENDING:** deployed browser/network confirmation. |

## Authentication matrix

| Scenario | Result |
| --- | --- |
| Email/password form semantics | **DETECTED FIXED:** stable `name`, autocomplete, `inputMode="email"`, and `spellCheck={false}` where applicable. |
| Empty/invalid/wrong password | **DETECTED:** validation and safe Better Auth error mapping covered structurally/tests; **UNKNOWN/PENDING:** final deployed interaction screenshots. |
| Double submit/loading | **DETECTED:** client busy states disable submission; **UNKNOWN/PENDING:** final browser network assertion. |
| Already-authenticated `/login` | **DETECTED in source contract:** session-aware route/return behaviour; **UNKNOWN/PENDING:** final deployed authenticated pass. |
| Session persistence/logout | **DETECTED historically and structurally:** Better Auth session/logout paths; **UNKNOWN/PENDING:** final Preview fresh-context persistence test. |
| Invalid/expired session | **DETECTED:** protected/admin/Programme server boundaries fail to login/zero-state rather than expose data; **UNKNOWN/PENDING:** deployed expiry simulation. |
| `returnTo` normal/nested/query | **DETECTED:** root-relative paths accepted. |
| `returnTo` protocol-relative/external/encoded attacks | **DETECTED:** safe-return validator rejects external/protocol-relative targets; no open redirect found. |
| Google button visibility | **DETECTED:** only complete server-side configuration presents it. **CONTRADICTION:** it is presented in Production without detected approval. |
| Google initiation/request shape | **DETECTED:** fixed callbacks, identity scopes only, explicit sign-up/link intent, bounded 32 KiB JSON, invalid body stable 400/413. |
| Google callback/cancel/retry | **DETECTED in source/tests:** claim marker and callback boundaries. **UNKNOWN/MANUAL E2E REQUIRED:** current external chooser/cancel/return. |
| Existing same-email linking | **DETECTED:** only authenticated explicit linking after verified local+Google identity; no implicit match/reassignment. **UNKNOWN/MANUAL E2E REQUIRED:** real existing-account round trip. |
| OAuth token persistence | **DETECTED:** access/refresh/ID token, expiry, and scope are stripped before application persistence. |
| Auth cache/privacy | **DETECTED P1 FIXED in branch:** every Better Auth GET/POST response receives `private, no-store, max-age=0` and `Vary: Cookie` (`app/api/auth/[...all]/route.ts:13-26`). Production still serves old headers until an authorised deployment. |
| Staff boundary | **DETECTED:** admin layout and APIs perform server-side staff/permission checks; token middleware is convenience only. |

## Programme matrix

| Scenario/contract | Result |
| --- | --- |
| Runtime selection | **DETECTED:** exact server-only `PROGRAM_AI_V1_ENABLED=true`; missing/malformed value selects legacy. |
| Access gate | **DETECTED:** separate unchecked 18+ and combined Terms/Privacy acknowledgement; legal links are outside the checkbox label after a11y correction. |
| Mission 01 typed path | **DETECTED:** complete path, editable result, narrow authority, user confirmation, server-owned rewards. |
| Mission 01 voice path | **DETECTED source/historical Preview evidence:** explicit start, permission/recovery states, stop/cancel, 90-second cap, transcript edit, retry/type instead. Current byte limit remains unresolved. |
| Anonymous-to-auth claim | **DETECTED:** exact journey/token proof, collision handling, transient retry, source retirement, and exact-once rewards. |
| Protected Help | **DETECTED:** reachable without Programme/account/age/commercial gating; no commercial import path. |
| Legacy M01–M04 | **DETECTED:** server-owned progression/reward/read compatibility when feature off. |
| Legacy mutation exclusivity | **DETECTED P1 FIXED in branch:** feature-on mode returns stable `409 PROGRAMME_RUNTIME_MODE_CONFLICT` before body/service mutation for legacy session, claim, progress, M01–M04, reflection, and artefact writes. |
| Body-size authority | **DETECTED P1 FIXED in branch:** JSON is streamed/counted before parsing; declared, missing, understated, and chunked overflow are bounded at 32 KiB (`lib/programme/http.ts:29-69`). |
| Rate limiting | **DETECTED FIXED for audited mutation families:** user/session/IP buckets added where missing; distributed runtime model exists. **UNKNOWN:** shared-environment runtime readiness/activation. |
| Sensitive response caching | **DETECTED P1 FIXED in branch:** Programme/progress/reflection responses use `private, no-store, max-age=0`. Production remains old until deploy. |
| Missions 02–10 | **DETECTED:** closed server mission registry, prerequisites, structural actions, validation, save/completion/resume, exact-once rewards, provider-independent completion. |
| Clean-path XP | **DETECTED:** authoritative contract remains exactly `715 XP`: M1 `40`, nine later Missions `75` each. Historic M1 `60` and legacy completed work receive no retroactive award. |
| Reviews | **DETECTED:** First after M3, Mid after M6, Full after M10; completion-derived, zero XP. |
| Home zero/partial/completed M1 | **DETECTED P1 FIXED:** server projection now uses exact `0/2`, `1/2`, `2/2` M1 state and 20/40/legacy-60 XP truth. |
| Remaining distance | **DETECTED P1 FIXED:** no enrollment `190 XP / 3 missions`, partial M1 `170 / 3`, completed M1 `150 / 2`, then exact M2/M3 transitions to Mid Review. UI renders server-owned totals rather than hardcoded `/3` or `+25`. |
| Programme metadata/runtime consistency | **DETECTED P2 FIXED in commit `61b2f03` and present at `60c30e3`:** current-main metadata hard-coded the legacy Moment Map/early-signal journey while Production rendered feature-on. The title, description and breadcrumb now use mode-neutral `10-Step Control Programme` copy valid for either server-selected runtime; the 208/208 structural gate and signed read-only exact-Preview check include the regression. |
| Refresh/back/two tabs/stale/duplicate | **DETECTED in service/browser test design and exact-once transactions; UNKNOWN/PENDING:** final deployed cross-tab/browser recheck. |
| Raw narrative | **DETECTED:** memory/tab-scoped `sessionStorage`; required legacy DB fields receive neutral markers; historic rows remain under access/erasure and approved-cleanup gate. |
| Durable age evidence | **UNKNOWN/OPEN P1:** UI/request self-attestation exists; durable age-attestation evidence remains an approved future gate, not implemented by this audit. |

## Programme AI and microphone matrix

| Area | Result |
| --- | --- |
| Feature/provider flags | **DETECTED:** separate feature and real-provider exact gates; deterministic provider-off/failure fallback. |
| OpenAI contract | **DETECTED:** server-only adapters, fixed models/config, Structured Output, `store=false`, no tools/conversation/previous response, bounded timeout, no automatic retry. |
| Provider errors/invalid output | **DETECTED:** safe error/fallback mapping; provider response bodies and credentials are not returned/logged. |
| User-edited output | **DETECTED:** transcript and Starting Point remain editable before confirmation. |
| Analytics/privacy | **DETECTED:** voice analytics emits only closed outcome values; no audio/transcript/situation text. |
| Page-load permission | **DETECTED:** microphone is requested only after explicit user action. Global Permissions Policy denies microphone except same-origin `/program`. |
| Denied/unsupported/retry/cancel | **DETECTED in source/tests and earlier Preview evidence:** states and Type instead recovery exist. **UNKNOWN/MANUAL E2E REQUIRED:** physical/native browser prompt and real-device Safari behaviour. |
| Audio persistence | **DETECTED:** one completed in-memory file; track/Blob cleanup; no disk/Prisma/analytics persistence intended. |
| Current raw-file cap | **DETECTED:** `8 * 1024 * 1024` bytes at `lib/programme/application/programme-ai-transcription.service.ts:8`; route calls `request.formData()` after only a declared-length check. |
| Platform conflict | **DETECTED P1 UNRESOLVED:** Vercel documents a 4.5 MB complete Function request ceiling, so the approved 8 MiB file cannot reliably reach this route. |
| RFC-031 | **PROPOSED ONLY:** 4 MiB raw audio + 64 KiB complete multipart envelope, actual stream counter, client preflight, Type instead, and boundary tests. No implementation is authorised. |
| Production provider | **UNKNOWN:** no call initiated; no connectivity/live-flow claim. Feature-on Production UI remains a contradiction even if provider calls fail. |

## Public casino, bonus, comparison, and offer matrix

| Data/state | Expected boundary | Audit result |
| --- | --- | --- |
| Complete published CMS record | Eligible for public projection after publication/market/evidence rules. | **DETECTED in branch services/tests:** available and ranked with source facts. |
| Incomplete published record | Excluded from Best Offers strict eligible set. | **DETECTED:** fail-closed/no-eligible path. |
| Wrong market | Excluded/unavailable without inventing eligibility. | **DETECTED:** service tests. |
| Draft/archived/unavailable | Not public/actionable. | **DETECTED:** repository/service status filters. |
| Exact demo record | Explicit `DEMO_FIXTURE`, no real claim/action, no commercial schema, noindex. | **DETECTED:** 25-scenario dataset and public projections; branch fixes compare/profile/sitemap leakage. |
| Mixed inventory | Explicit mixed/demo disclosure; no misleading commercial action for demo rows. | **DETECTED:** service/UI classification. |
| Repository error | Truthful unavailable/empty; no healthy demo substitution unless the established zero-eligible demo fallback contract specifically applies. | **DETECTED:** casino deployed mode returns empty/null; Best Offers distinguishes repository failure. |
| Zero eligible | Explicit no-eligible or approved exact demo fallback. | **DETECTED.** |
| Production legacy public API | Must not expose legacy operator-like claims. | **DETECTED P1 on starting Production:** violated. **DETECTED FIXED in branch:** deployed env forces CMS and API filters `source === "cms"`. |
| Demo CTA | Internal demo profile only; never `/r`/operator. | **DETECTED P1 starting Preview issue:** 15 demo CTA destinations returned 404. **DETECTED initial fix at `2f67bc1` and stronger committed RFC-032 contract at `61b2f03`:** an exact source demo resolves when CMS is explicitly disabled or successful repository checks prove the slug is outside the managed namespace; malformed publications, repository errors and managed unpublished records fail closed. Public-casino service tests pass 30/30 and the deterministic browser gate passes 89/89 with exact cleanup. The exact Preview rendered 12 internal Best Offers detail destinations with no `/r`/`/go` action, and `demo-northstar` rendered 200 with fictional disclosure, `noindex, follow`, no commercial link and no commercial schema. |
| Selected demo comparison card | Adjacent card-level disclosure must not call a fictional record published or GB-available. | **DETECTED P1 FIXED in commit `61b2f03`:** exact demo cards render `DEMONSTRATION DATA · Fictional profile · GB illustrative context`; published cards retain published copy. Focused render tests pass 2/2 and seeded browser comparison tests pass 8/8, including per-record classification. The exact Preview repository was empty, so `/compare` truthfully rendered its fail-closed empty published state with `noindex, follow` and no `ItemList`; it did not supply a seeded adjacent-card screenshot. |
| Compare index/schema | Only clean default, available, `PUBLISHED_ONLY` may index/emit ItemList. | **DETECTED P1 fixed in branch.** |
| Best Offers interaction | Overall/Wagering/Payout, full field, arrows/swipe/keyboard/tabs. | **DETECTED source/a11y correction; UNKNOWN/PENDING deployed interaction matrix.** |
| Affiliate CTA | Only `/r/[slug]` after exact jurisdiction/operator/link authority. | **DETECTED fail-closed:** no real partner/action authority. |

## Contact and email matrix

| Scenario | Result |
| --- | --- |
| Labels/required/email/message bounds | **DETECTED:** client and server validation; strict accepted keys. |
| Same-origin/CSRF assumption | **DETECTED:** origin enforcement for public POST. |
| Body limit | **DETECTED:** 8 KiB JSON guard before processing. |
| HTML/header injection | **DETECTED:** plain-text internal envelope and CR/LF rejection for header-like fields. |
| Double submit/loading/success/failure | **DETECTED source:** disabled busy state and truthful responses. **UNKNOWN/PENDING:** final deployed interaction. |
| Persistence/analytics/logs | **DETECTED:** no application DB write, no body analytics, metadata-only operational logs. |
| Provider boundary | **DETECTED:** Contact-only direct HTTPS Resend adapter, exact enable/config gate, eight-second timeout, no automatic retry, visitor email only as Reply-To. |
| WAF/rate limit | **DETECTED in project documentation:** exact Production WAF previously recorded as five POST requests/IP/600 seconds. **UNKNOWN:** fresh control-plane verification during this audit. |
| Preview QA email | **DETECTED:** no audit send was performed. A single internal synthetic send is allowed only if final Preview is already safely configured; provider acceptance and mailbox receipt must be labelled separately. |
| Account/Programme/marketing email | **DETECTED:** remains separate/disabled; Contact does not activate it. |

## Admin/CMS matrix

| Scenario | Result |
| --- | --- |
| Unauthenticated pages | **DETECTED:** middleware redirects for UX and protected layout verifies staff; no direct page data read before authority in corrected pages. |
| Unauthenticated APIs | **DETECTED:** route handlers enforce staff/permission; middleware never treats cookie presence as API authority. |
| Role-filtered navigation | **DETECTED P1 FIXED:** server-owned `AdminArea` policy filters shell/actions before rendering. |
| Direct data access by URL | **DETECTED P1 FIXED:** protected pages resolve permission before service/repository reads. |
| Generic entity GET | **DETECTED P1 FIXED:** any-of article read and correct casino/bonus/affiliate/settings mappings. |
| Program workflow actions | **DETECTED P2 FIXED:** reviewer/approver/publisher/archive actions exposed only by capability. |
| Casino builder sections | **DETECTED P2 FIXED:** affiliate/media controls hidden without their permissions. |
| Error leakage | **DETECTED P1 FIXED:** known `ServiceError` mapping, stable SyntaxError 400, unknown stable 500; repository/validation throws typed errors. |
| Cache privacy | **DETECTED P1 FIXED:** admin path/API middleware uses `private, no-store, max-age=0` plus `Vary: Cookie`. Production remains old until deploy. |
| Branding | **DETECTED P2 FIXED:** B4GAMBLE login/title/shell/seeds/staff/editorial preview. |
| Error/404 semantics | **DETECTED P2 FIXED:** admin error and not-found pages provide safe retry/navigation and no internals. |
| Permission-denied document landmark | **DETECTED P2 FIXED:** denial surfaces use `<main>`; admin layout supplies skip target and global noindex. |
| Casino workflow permission granularity | **DETECTED P2 UNRESOLVED:** the established casino workflow centres on `casino.edit`; a more granular approve/publish role model would be a material permission decision/RFC, not an overnight inference. |
| Forbidden page HTTP status | **DETECTED P3 ACCEPTED/UNRESOLVED:** protected UI may render an in-app denial with HTTP 200 while APIs/data reads deny. |
| CMS write flows | **UNKNOWN/PENDING:** no real shared-environment write was attempted because isolated non-Production database authority was not established for this pass. Local mocks/tests cover workflow contracts. |

## Affiliate/commercial matrix

| Scenario | Result |
| --- | --- |
| Invalid/missing slug | **DETECTED:** `/go`, `/r`, and handoff page fail closed. |
| Demo record | **DETECTED:** no commercial action. |
| Published record without authority | **DETECTED:** no action/unavailable. |
| Target URL validation | **DETECTED:** HTTPS/domain validation and server-held target; no client target controls destination. |
| Query/double encoding/open redirect | **DETECTED in tests/source:** destination allow-list and slug resolution deny malformed input; canonical host destination is constant. |
| Jurisdiction/partner agreement | **DETECTED:** required before referral; no real GB partner authority found. |
| Production commercial activation | **DETECTED:** not authorised and no audit action enabled it. |

## API contract matrix

| Family | Auth/validation/status/cache/error evidence | Remaining evidence |
| --- | --- | --- |
| Better Auth | **DETECTED:** GET/POST only; closed social request shape; 32 KiB bounded JSON; stable 400/413; private no-store + `Vary: Cookie`; programme access proof for creation flows. | **UNKNOWN/PENDING:** final deployed cookie attributes, invalid-session, and real callback browser pass. |
| Admin | **DETECTED:** staff and permission checks, strict route/entity mappings, stable 4xx/5xx service envelopes, private no-store + `Vary: Cookie`. | **UNKNOWN/PENDING:** representative malformed/unauthorised request matrix on final Preview with isolated roles. |
| Programme | **DETECTED:** strict DTO parsers, 32 KiB actual stream bound, stable auth/validation/conflict/rate errors, private no-store, exact-once domain transactions. | **UNKNOWN/PENDING:** final deployed duplicate/two-tab/stale-session matrix. Voice multipart remains a P1 exception. |
| Voice transcription | **DETECTED:** POST multipart, MIME/duration/file checks, session+IP limit, safe error mapping. | **DETECTED P1 UNRESOLVED:** declared-length check plus `formData()` does not enforce an application limit compatible with Vercel's complete-body cap. |
| Public resources | **DETECTED:** GET only; allow-listed resource; unknown 404; exactly one bounded integer `limit`; invalid/duplicate/out-of-range value stable 400; casino/bonus source and outbound defence in depth. | **UNKNOWN/PENDING:** deployed malformed matrix. Article seed authority remains unresolved. |
| Contact | **DETECTED:** POST only, same-origin, content type and 8 KiB guard, exact keys/types/lengths, stable errors, no-store, no body logging. | **UNKNOWN:** fresh WAF/runtime delivery status. |
| Cron | **DETECTED:** GET with exact Bearer secret, bounded target classes/limits and dry-run operational contract. | **UNKNOWN:** current scheduled invocation and secret binding. |
| Media | **DETECTED:** GET public redirect; local route unavailable in Production; admin media mutations are staff/permission bounded. | **UNKNOWN:** active S3 configuration and every malformed media case. |
| Commercial redirect | **DETECTED:** GET only; closed slug/target/jurisdiction/agreement checks; no client-authored destination. | **DETECTED:** no real authority, therefore successful operator redirect was intentionally not exercised. |
| Unexpected methods | **INFERRED:** Next App Router returns method-not-allowed for unexported methods. | **UNKNOWN/PENDING:** a representative deployed 405 matrix has not been recorded. |
| CORS/CSRF | **DETECTED:** no permissive CORS layer was found; Contact has explicit same-origin enforcement; auth relies on Better Auth/cookie policy; mutation routes require authority/age/session constraints. | **UNKNOWN:** a complete cross-origin browser matrix for every mutation route. |

## Visual QA matrix

Read-only Production rendering/automated accessibility inspection found concrete defects and informed branch corrections. The generic Playwright visual baselines were subsequently resolved platform-independently, manually reviewed, and updated; a focused Chromium visual run passed 14/14. That is local branch evidence, not final Preview proof. The final required Preview pass must be fresh and must not reuse Production screenshots; a complete viewport-by-route Preview grid is still pending.

### Required viewport status

| Viewport width | Chromium final Preview | WebKit final Preview | Notes |
| ---: | --- | --- | --- |
| 320 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Critical narrow layout/forms/menu. |
| 360 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Mobile. |
| 375 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Programme/browser-suite governed width. |
| 390 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Programme/browser-suite governed width. |
| 430 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Large phone. |
| 768 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Tablet/Programme governed width. |
| 820 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Tablet. |
| 1024 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Desktop/tablet boundary; Best Offers defect corrected in source. |
| 1280 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Desktop. |
| 1440 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Programme governed desktop width. |
| 1920 | **UNKNOWN/PENDING** | **UNKNOWN/PENDING** | Wide desktop. |

### Rendered findings and source corrections

| Surface | Read-only rendered evidence | Branch state |
| --- | --- | --- |
| Home | **DETECTED:** primary CTA acid/white conflict at about 1.37:1; mini-screen text about 2.99:1; whole-card opacity reduced inactive content to about 1.61–3.84:1. | **DETECTED FIXED IN SOURCE:** explicit ink CTA, stronger night-muted token, and no whole-card opacity. Final computed/rendered ratio is **UNKNOWN/PENDING**. |
| Contact | **DETECTED:** acid section label on white about 1.37:1. | **DETECTED FIXED IN SOURCE:** contrast token split/darkened. Final rendered ratio is **UNKNOWN/PENDING**. |
| Best Offers | **DETECTED:** 7–8px carousel-dot hit area, non-focusable horizontal decision strip, 1024 eligibility overflow, and editorial desk text around 3.35/4.39. | **DETECTED FIXED IN SOURCE:** 44px controls, focusable labelled strip, wrap/breakpoint, stronger colours, roving tabs, and live carousel announcement. |
| Bonuses | **DETECTED:** invalid `listitem` semantics; 9px contract label about 3.07; unavailable badges about 4.38 at 9px; constrained mobile cards/CTA. | **DETECTED FIXED IN SOURCE:** native article semantics, stronger/larger labels/badges, flexible mobile height and 44px CTA. |
| Casinos | **DETECTED:** search control below 44px, dialog scroll chaining, small acid-muted labels near threshold. | **DETECTED FIXED IN SOURCE:** 44px target, `overscroll-behavior: contain`, stronger accessible colours. |
| Casino profile | **DETECTED:** light detail label about 1.26; invalid fact-description structure; tab-like static spans. | **DETECTED FIXED IN SOURCE:** teal label, valid `<dl>` sibling semantics, neutral noninteractive list presentation, dialog containment. |
| 10 Steps | **DETECTED:** future-Mission whole-card opacity reduced text to about 3.24. | **DETECTED FIXED IN SOURCE:** no whole-card opacity. |
| Compare | **DETECTED:** heading level/landmark repetition issues. | **DETECTED FIXED IN SOURCE:** hidden contextual heading and non-landmark repeated mobile wrappers. |
| Programme access | **DETECTED:** legal text/link overlap and anchors nested inside a checkbox label. | **DETECTED FIXED IN SOURCE:** explicit checkbox ID/label with links outside label in both modes. |
| Admin | **DETECTED:** missing main/skip/error landmarks and incorrect table roles in several states. | **DETECTED FIXED IN SOURCE:** main/skip target, denial landmarks, native/valid table roles, error/not-found. |
| Global motion | **DETECTED:** smooth scrolling had no global reduced-motion override. | **DETECTED FIXED IN SOURCE:** global reduced-motion disables smooth scroll; component motion rules remain. |

## Accessibility findings

| Requirement | Result |
| --- | --- |
| Single meaningful heading hierarchy | **DETECTED:** corrections applied to Compare and error surfaces; **UNKNOWN/PENDING:** final route-wide automated/manual heading audit. |
| Labels/native semantics | **DETECTED:** login names/autocomplete, Programme legal semantics, bonus list semantics, casino facts, and admin table roles corrected. |
| Buttons vs links | **DETECTED:** key controls use native buttons/links; disabled commercial action is a non-navigation control/state. |
| Tabs | **DETECTED:** Best Offers uses `tablist`/`tab`/`tabpanel`, roving tab index, Arrow/Home/End keys. |
| Carousel | **DETECTED:** labelled region, keyboard arrows/Home/End, inactive `inert`, 44px selectors, polite slide announcement. |
| Dialogs | **DETECTED:** Programme edit overlay handles initial focus, tab containment, Escape and focus return; native outbound/filter dialogs constrain scroll. Final current-build cross-engine evidence includes 39 read-only WebKit interaction assertions. Final hosted Preview/manual focus verification remains pending rather than local WebKit execution. |
| Focus visibility/skip link | **DETECTED:** global and scoped visible focus; root/admin skip targets. |
| Contrast | **DETECTED:** concrete Production failures above corrected in CSS source. **UNKNOWN/PENDING:** final automated contrast scan after deployment. |
| Touch targets | **DETECTED:** Best Offers dots/search/key CTAs corrected to at least 44px in source. |
| Status/error announcement | **DETECTED:** role status/alert and carousel live text on key flows. |
| Reduced motion | **DETECTED:** global/component media queries. |
| Screen reader | **UNKNOWN/MANUAL E2E REQUIRED:** no VoiceOver/NVDA session is claimed. |
| Browser zoom/large text | **UNKNOWN/PENDING:** no final 200% zoom evidence recorded. |

## SEO, metadata, and indexability matrix

| Surface | Result |
| --- | --- |
| Canonical origin | **DETECTED in branch source:** `https://b4gamble.com` constant at `lib/site.ts:7`; absolute public URLs cannot use a `vercel.app` host. Production host redirect is not deployed. |
| Root/home metadata | **DETECTED P2 FIXED:** root no longer leaks a home canonical/social URL to every child; home owns its canonical/social copy. |
| Programme metadata | **DETECTED P2 FIXED in commit `61b2f03` and exact Preview:** removed legacy-only Moment Map/early-signal claims from route metadata and normalized the breadcrumb/title to mode-neutral `10-Step Control Programme`; Production is unchanged until an authorised deploy. |
| Dynamic profile metadata/body | **DETECTED P2 FIXED:** React request cache shares the same resolved CMS profile; only CMS source renders. |
| Best Offers metadata/body | **DETECTED P2 FIXED:** request-scoped cache prevents divergent data reads. |
| Compare metadata/body | **DETECTED P2 FIXED:** request-scoped cache and published-only index rule. |
| Sitemap | **DETECTED P2 FIXED in the unmerged branch at `60c30e3`:** service-backed classification, no fabricated `lastModified=now`, no demo profiles, conditional casinos/bonuses/Best Offers/Compare, and `/10-steps`. Each dynamic casino/offer/comparison loader fails closed independently, so one unavailable source cannot remove static, Learn, or Help entries or suppress other healthy dynamic groups. Brand/canonical tests pass 15/15; a complete deployed sitemap crawl remains pending. |
| Robots/private surfaces | **DETECTED:** admin, login, privacy, Programme/private/demo surfaces use noindex as appropriate; admin layout applies global noindex. |
| Demo schema | **DETECTED P1 FIXED:** Review/FAQ/ItemList/offer schema is suppressed for demo or mixed inventory. |
| Empty public directories | **DETECTED P2 FIXED at `403a0ab`:** `/casinos` and `/bonuses` are noindex when their resolved total is zero, and empty `PUBLISHED_ONLY` results do not emit misleading `ItemList` schema. Final deployed metadata is **UNKNOWN/PENDING**. |
| `llms.txt` | **DETECTED P2 FIXED:** no legacy data import or stale commercial claims. |
| Old brand in metadata | **DETECTED FIXED in source and bounded Preview routes:** Home/Programme/Best Offers and B4GAMBLE admin login passed the signed read-only check. A complete rendered Preview crawl remains **UNKNOWN/PENDING**. |
| App icon | **DETECTED P2 FIXED in source:** `app/icon.svg`; final deployed link/200 is **UNKNOWN/PENDING**. |
| Final metadata crawl | **UNKNOWN/PENDING:** titles/descriptions/canonicals/robots/OG/Twitter/JSON-LD for every final Preview route. |

## Security findings

| Control | Result |
| --- | --- |
| Canonical Host/open redirect | **DETECTED P0 FIXED IN BRANCH:** constant trusted origin; environment signal, not hostname substring; path/query only; method-preserving 308; Preview remains separate. Production remains vulnerable to duplicate-origin rendering until an authorised deploy. |
| Authentication/authorization | **DETECTED:** Better Auth session, staff/permission checks, Google identity-only restriction, token stripping, safe callbacks. No auth bypass found. |
| Cookies | **DETECTED in source:** HttpOnly/SameSite Lax/secure-in-Production for Programme/admin compatibility cookies; Better Auth owns session cookie attributes. Final response inspection is **UNKNOWN/PENDING**. |
| Sensitive caching | **DETECTED P1 FIXED IN BRANCH:** auth/admin/Programme responses private/no-store; auth/admin also `Vary: Cookie`. Starting Production returned public revalidation headers on sensitive unauthenticated endpoints. |
| Request-body DoS | **DETECTED P1 FIXED for JSON:** actual stream bound before buffering/parsing. **DETECTED P1 UNRESOLVED for voice:** multipart platform/application cap mismatch. |
| Error leakage | **DETECTED P1 FIXED:** admin/Programme unknown exceptions return stable safe bodies; no database/stack/provider body. |
| Rate limiting | **DETECTED:** Programme distributed limiter source, transcription IP/session, Contact WAF record, auth/provider constraints. Runtime readiness for every shared environment remains unknown. |
| Security headers | **DETECTED live:** HSTS at edge, `nosniff`, `X-Frame-Options: DENY`, strict-origin referrer policy, and microphone-only-on-Programme Permissions Policy. |
| CSP | **DETECTED P2 UNRESOLVED:** no Content-Security-Policy header observed/configured. A safe CSP requires inventory/nonces for Next scripts, analytics, fonts, and current remote images; it was not improvised. |
| CORS | **DETECTED:** no broad permissive CORS configuration. |
| XSS/JSON-LD | **DETECTED:** React escaping and structured object serialization; no confirmed exploitable injection found. Final adversarial corpus is **UNKNOWN/PENDING**. |
| External targets | **DETECTED:** commercial URLs are server resolved/validated; `.example` demo domains cannot become action URLs. |
| Secret exposure | **DETECTED:** no secret values recorded; server-only variables have no `NEXT_PUBLIC_` names except intentionally public flags/origin. The 754-file scan passed locally and inside the green hosted Build / Browser job at `60c30e3`. |
| Source maps/client bundles | **UNKNOWN/PENDING:** final build bundle/source-map inspection not yet recorded. |

## Privacy and analytics findings

| Area | Result |
| --- | --- |
| Raw audio | **DETECTED:** no intended persistence; in-memory completed file and cleanup. Final oversized/body handling unresolved. |
| Transcript/situation/clarifications | **DETECTED:** transient/tab-only; no application DB/analytics/log payload dumping found. |
| Confirmed Starting Point | **DETECTED:** minimal user-confirmed structured continuity only. |
| Legacy narrative | **DETECTED:** historic rows remain under access/export/erasure; automatic approved cleanup remains open. |
| Self-Check/limit tool | **DETECTED:** local browser state, excluded from commercial/analytics authority. |
| Product analytics disabled | **DETECTED P2 FIXED:** exact disabled state no longer loads storage, reads/writes marker keys, or emits provider events (`lib/analytics/product-analytics-client.ts:39-69`). |
| Product analytics enabled contract | **DETECTED:** closed aggregate events/properties; no text/transcript/direct identifier. Production activation unknown. |
| Privacy notice | **DETECTED P2 FIXED:** updated 13 August 2026, legal implementation version bumped, and disabled-analytics behaviour stated exactly. |
| Production AI/Google exposure | **INFERRED privacy risk / CONTRADICTION:** unauthorised UI availability may expose real-user data to providers if downstream calls succeed. No call was made, so provider processing is **UNKNOWN**, not detected. |
| Remote Pexels images | **DETECTED P2 UNRESOLVED:** external hotlinks disclose ordinary viewer request metadata to the host; repository evidence does not establish durable licence/provenance. Do not download/redistribute without rights evidence. |
| Sensitive logs | **DETECTED:** no source `console.log` of transcript/password/token/Programme text found; operational analytics warnings include event name/result only. Final hosted log sampling is **UNKNOWN/PENDING**. |

## Performance/runtime-health findings

| Area | Result |
| --- | --- |
| Request consistency | **DETECTED P2 FIXED:** profile, comparison, and Best Offers metadata/body use request-scoped React caches. |
| Obvious responsive overflow | **DETECTED fixes:** Best Offers 1024 wrap, bonus mobile height/CTA, dialogs and comparison landmarks. Final all-width pass is **UNKNOWN/PENDING**. |
| Images | **DETECTED:** 88 public assets, plus remote image use. Remote hotlinks add third-party dependency/privacy risk. No complete asset byte budget is recorded. |
| Hydration/console/network | **DETECTED:** initial Production inspection did not reveal general application warnings/errors. **UNKNOWN/PENDING:** final fresh Preview console/network pass. |
| Lighthouse/Web Vitals | **UNKNOWN/PENDING:** no final Lighthouse or field-vitals evidence recorded. |
| Build size/secret scan | **DETECTED:** local build passed with 63 generated static targets and the configured scan passed across 754 browser-deliverable files; the hosted Build / Browser job at `60c30e3` also passed the build and secret-scan steps. |
| Representative route timing | **UNKNOWN/PENDING:** home, casinos, Best Offers, Programme, and login timings not consolidated. |

## Production log findings

| Window/source | Result |
| --- | --- |
| Initial current/recent sample | **DETECTED:** no pre-existing application warning/error cluster was observed in the initial read-only sample. |
| Deliberate invalid OAuth diagnostic | **DETECTED:** the audit's invalid callback probe generated state-mismatch errors. These are tester-induced and must not be counted as an organic incident. |
| Last hour grouped by route/status/type | **UNKNOWN/PENDING:** final consolidated query not recorded. |
| Last 24 hours grouped by route/status/type | **UNKNOWN/PENDING:** final consolidated query not recorded. |
| Current Production deployment logs after all audit work | **UNKNOWN/PENDING:** Production code remains unchanged; final read-only recheck still required. |

## Defect register by severity

### P0

| ID | Evidence/root cause | Fix | Verification/status |
| --- | --- | --- | --- |
| HOST-01 | **DETECTED:** project, git-main/account, and immutable Vercel Production aliases could render B4GAMBLE as alternative origins. No repository-enforced Production guard covered generated aliases; relying on platform domain behaviour was incomplete. | **DETECTED in branch:** RFC-030 resolver uses exact `VERCEL_ENV=production`, a constant `https://b4gamble.com` destination, `308`, and path/query preservation; Preview retains exact branch-host `307`. | **DETECTED:** source tests and current brand/canonical suite pass. **DETECTED UNRESOLVED LIVE:** Production remains unchanged, so aliases still do not have the application fix. |

### P1

| ID | Evidence/root cause | Fix | Verification/status |
| --- | --- | --- | --- |
| ENV-01 | **CONTRADICTION:** Production renders PROGRAM-AI and offers Google while approved state says both Production activations are off/separate. Runtime variables/configuration diverged from recorded authority. | **DETECTED:** no Production change was authorised or made; source remains fail-closed by exact gates. | **CONTRADICTION / HOLD / UNRESOLVED:** Founder/operations must reconcile authority and either disable/redeploy or document/approve a controlled state before readiness. |
| DATA-01 | **DETECTED:** deployed public casino API/page could fall back to legacy `10bet`-like claims when CMS flag was false. | **DETECTED in branch:** Vercel Preview/Production always use CMS snapshots; repository failure returns empty/null; API/profile require CMS source. | **DETECTED:** focused public casino/profile tests passed 32/32, hosted Quality passed, and exact Preview Best Offers/demo-profile/comparison states were truthful. A complete Preview casino-directory/API/SEO crawl remains **UNKNOWN/PENDING**. |
| DEMO-01 | **DETECTED:** 15 demo Best Offers CTA destinations returned 404 because the generated offer-detail path did not consistently resolve the exact deployed-demo profile record. | **DETECTED initial fix at `2f67bc1`; stronger RFC-032 fix committed at `61b2f03`:** exact CMS-disabled source demo resolution plus fail-closed malformed-publication/repository-error/managed-unpublished handling. | **DETECTED:** public-casino service tests pass 30/30 and the deterministic browser gate passes 89/89. Exact Preview Best Offers exposed 12 internal non-commercial detail destinations, and `demo-northstar` rendered 200/noindex with no commercial link/schema. |
| DEMO-02 | **DETECTED:** demo comparison/profile content could be indexed and emit commercial-style ItemList/Review/FAQ schema. | **DETECTED in branch:** index/schema only for clean available `PUBLISHED_ONLY`; demo profile SEO is noindex and schema suppressed. | **DETECTED:** comparison tests passed 19/19; final rendered metadata crawl is **UNKNOWN/PENDING**. |
| DEMO-03 | **DETECTED:** demo profile, Best Offers and comparison surfaces reused publication/current-evidence copy even though their records were fictional. | **DETECTED committed at `61b2f03`:** presentation branches on exact classification; demo records use adjacent fictional labels, source-neutral criteria and non-commercial copy, while published records retain published copy even in mixed mode. | **DETECTED:** focused server render tests pass 2/2 and seeded comparison browser tests pass 8/8. Exact Preview Best Offers/profile copy was classified correctly; Preview comparison truthfully rendered its empty fail-closed state because its repository contained no records. |
| PROG-01 | **DETECTED:** feature-on Home hardcoded/omitted M1 action/completion distance and could misstate remaining XP/Missions. | **DETECTED in branch:** server-owned exact M1 projection and Review distance, UI consumes returned totals. | **DETECTED:** Programme AI mission tests passed 13/13 focused and the later full Programme suite passed 108/108. |
| PROG-02 | **DETECTED:** legacy mutation endpoints remained callable while feature-on PROGRAM-AI used the same user progression aggregates, enabling cross-mode overwrite/reward inconsistency. | **DETECTED in branch:** early stable 409 mode-conflict guard across legacy session/claim/progress/M01–M04/reflection/artefact mutations. | **DETECTED:** included in 42/42 MVP runtime, 108/108 Programme and hosted Quality passes; the exact Preview Programme route passed read-only inspection. No deployed mutation was attempted, so isolated Preview mutation E2E remains **UNKNOWN/PENDING**. |
| API-01 | **DETECTED:** Programme/progress JSON paths buffered `request.text()` before enforcing 32 KiB, so a large body could be held first. | **DETECTED in branch:** declared-length plus actual streamed-byte counter/cancel before parsing; auth reuses it. | **DETECTED:** included in 42/42 MVP runtime; final malformed deployed matrix is **UNKNOWN/PENDING**. |
| CACHE-01 | **DETECTED:** starting Production returned `public, max-age=0, must-revalidate` without `Vary: Cookie` on auth/admin/legacy Programme endpoints. Sensitive/session-shaped responses should not be shared-cacheable. | **DETECTED in branch:** auth/admin private no-store + Cookie vary; Programme/progress/reflection private no-store. | **DETECTED:** source tests/`ci:quality` pass. Production remains old until deployment. |
| ADMIN-01 | **DETECTED:** overbroad admin navigation/direct reads/generic entity permissions could expose functions or data to roles lacking the intended capability. | **DETECTED in branch:** server page-area policy, guard-before-read, corrected mappings, filtered nav/actions. | **DETECTED:** auth/admin tests are included in the current passing quality gate; real isolated-role E2E is **UNKNOWN/PENDING**. |
| ADMIN-02 | **DETECTED:** generic unknown admin/CMS errors could expose implementation/database messages or return unstable status. | **DETECTED in branch:** shared stable error mapper and typed repository/validation errors. | **DETECTED:** admin service-error regressions pass within the auth test gate. |
| VOICE-01 | **DETECTED:** RFC-023/code allow 8 MiB raw audio while Vercel limits the complete Function payload to 4.5 MB. | **PROPOSED only:** RFC-031 4 MiB raw + 64 KiB envelope, actual stream counter and client preflight. | **DETECTED UNRESOLVED:** RFC-031 remains Proposed and no implementation/deployment authority exists. |

### P2

| ID/group | Evidence/root cause | Branch result / remaining status |
| --- | --- | --- |
| SEO-01 metadata authority | **DETECTED:** root canonical/social inheritance, stale sitemap dates/routes, legacy `llms.txt`, and request-double-read risk. | **DETECTED FIXED:** page-owned metadata, request cache, classified conditional sitemap, truthful `llms.txt`; bounded signed Preview routes preserved B4GAMBLE canonical authority. A complete Preview crawl remains **UNKNOWN/PENDING**. |
| SEO-02 empty directories | **DETECTED:** zero-result `PUBLISHED_ONLY` casino/bonus directories could remain indexable and emit an empty `ItemList`. | **DETECTED FIXED at `403a0ab`:** zero results force noindex/follow and suppress empty list schema. Exact Preview comparison demonstrated the equivalent empty fail-closed/no-`ItemList` contract; complete deployed casino/bonus empty-directory checks remain **UNKNOWN/PENDING**. |
| SEO-03 sitemap resilience | **DETECTED:** one rejected dynamic loader in the prior `Promise.all` could reject the entire sitemap and remove static, Learn, Help and otherwise healthy dynamic entries. | **DETECTED FIXED and committed at `61b2f03`:** casino, offer and comparison projections are independently fail-closed; 15/15 brand/canonical tests and hosted Quality pass. Complete deployed sitemap traversal remains pending. |
| SEO-04 Programme runtime metadata | **DETECTED:** current-main `/program` metadata described the legacy Moment Map/early-signal experience even when the feature-on runtime was selected in Production. | **DETECTED FIXED and committed at `61b2f03`:** mode-neutral Programme title, description and breadcrumb plus structural regression; exact Preview signed read-only verification passed. |
| API-02 public limit | **DETECTED:** `limit=abc` could return an empty 200 rather than a stable client error. | **DETECTED FIXED:** exact one integer/range contract and 400 envelope. |
| PRIV-01 analytics disabled | **DETECTED:** disabled analytics client could still touch marker storage. | **DETECTED FIXED:** no script/event/storage access when disabled; tests included in 42/42 MVP runtime. |
| A11Y-01 rendered contrast/semantics | **DETECTED:** exact Home, Contact, Best Offers, bonus, casino, profile, 10 Steps, Programme, and admin defects are recorded above. | **DETECTED FIXED IN SOURCE:** CSS/markup/keyboard corrections and regression test. Final axe/manual/contrast pass is **UNKNOWN/PENDING**. |
| RESP-01 responsive | **DETECTED:** Best Offers 1024 wrapping, bonus mobile sizing, and small hit targets. | **DETECTED FIXED IN SOURCE:** breakpoints/flex sizing/44px targets. Final width matrix is **UNKNOWN/PENDING**. |
| UX-ERR-01 | **DETECTED:** missing admin error/404, weak public recovery links, technical builder wording. | **DETECTED FIXED IN SOURCE.** |
| ICON-01 | **DETECTED:** Production icon requests/linkage were absent/404. | **DETECTED FIXED IN SOURCE:** `app/icon.svg`; deployment check is **UNKNOWN/PENDING**. |
| HOME-01 | **DETECTED:** public copy described stale four-Mission availability. | **DETECTED FIXED:** approved ten-Mission sequence wording without flag jargon. |
| ADMIN-03 workflow UX | **DETECTED:** workflow actions/role-specific builder sections were not consistently available/hidden. | **DETECTED FIXED:** capability-driven Programme workflow, affiliate/media sections. **DETECTED UNRESOLVED:** granular casino approval permission remains architecture debt. |
| SEC-02 CSP | **DETECTED:** no CSP header at the historical FULL-SITE-QA-01 base. | **RESOLVED IN UNMERGED DRAFT PR #74 / NOT PRODUCTION:** RFC-033 implements and verifies enforced per-request nonce CSP, including exact-Preview script nonces and no representative-route violations. Current main/Production are not reclassified until merge/deploy. |
| PRIV-02 remote imagery | **DETECTED:** Pexels hotlinks disclosed viewer request metadata; durable licence/provenance was absent from repository evidence. | **PRIVACY/AVAILABILITY RESOLVED IN UNMERGED DRAFT PR #74 / NOT PRODUCTION:** direct hotlinks are replaced by already-versioned first-party files and exact Preview emits no Pexels request. Historical per-asset attribution/release evidence remains not detected and is explicitly documented. |
| CI-01 coverage | **DETECTED:** Programme had been non-blocking; several tests/browser specs were orphaned; CI browser installed Chromium only. | **DETECTED PARTLY FIXED:** Programme is now blocking; casino editorial and focused public-integrity suites are in `ci:quality`; the deterministic clean-CMS/disposable-demo Chromium gate passes 89/89 across nine specs, and the local Chromium/WebKit matrix passes 308 navigations, 1,848 matrix assertions and 39 WebKit interactions. All six configured hosted contexts are green at `60c30e3`, including Build / Browser with 43 passes and one intentional Google skip. The extended 89-test manifest remains local-only, and Firefox coverage is absent. |
| DOC-01 technical baseline | **DETECTED:** the initial baseline drift was reconciled across all 11 Technical Baseline documents against exact current main `c525954`; current-main counts are clearly separated from audit-branch counts. | **DETECTED RESOLVED:** no remaining route/API/migration/public-asset contradiction is asserted by this record. |
| DATA-02 article resource | **DETECTED:** public articles API exposed the in-memory CMS seed rather than the static Learning Center corpus. | **RESOLVED IN UNMERGED DRAFT PR #74 / NOT PRODUCTION:** RFC-033 makes the validated source-controlled Learn manifest the sole public authority for pages, API, sitemap and discovery; explicit publication state/dates and duplicate validation fail closed. |

### P3

| ID/group | Evidence | Status |
| --- | --- | --- |
| IA-01 Programme nav | **DETECTED:** adjacent `Casinos` and `Reviews` both target `/casinos`. | **DETECTED UNRESOLVED polish:** no dead end. |
| COPY-01 Program/Programme | **DETECTED:** public/legacy areas alternate terms. | **DETECTED UNRESOLVED polish:** B4GAMBLE brand itself is corrected. |
| ADMIN-04 denial status | **DETECTED:** in-app forbidden page may be HTTP 200 while reads/APIs deny. | **DETECTED ACCEPTED LIMITATION / UNRESOLVED:** semantic HTTP refinement, not an exposure. |

## Fixed defects summary

**DETECTED in the unmerged branch at implementation-and-audit head `60c30e3`:** HOST-01 source guard; DATA-01; DEMO-01 source path and fail-closed detail authority; DEMO-02; DEMO-03 adjacent selected-card disclosure; PROG-01; PROG-02; API-01; CACHE-01; ADMIN-01/02; metadata/sitemap/`llms.txt` including mode-neutral Programme metadata, empty-directory noindex/schema handling and independent sitemap-loader resilience; public limit validation; disabled-analytics privacy; public/admin branding; standalone login/navigation; Home Mission copy; Best Offers keyboard/responsive behaviour; casino/bonus/profile/compare data and a11y boundaries; legal checkbox semantics; admin error/404/workflow UI; app icon; reduced motion; reviewed visual baselines; regression/CI coverage additions; and Technical Baseline/Project State/Roadmap reconciliation.

These are not declared Production-fixed. Exact-head hosted gates and the bounded signed read-only Preview checks are complete; Firefox, real external-provider/device flows, isolated write-role tests and the remaining manual/full-grid evidence are explicitly outside that detected closure.

## Unfixed defects and limitations

- **CONTRADICTION / P1:** Production PROGRAM-AI and Google availability lack detected approval.
- **DETECTED / P0 LIVE:** Production aliases remain directly renderable until a later authorised merge/deploy applies HOST-01.
- **DETECTED / P1:** VOICE-01 remains unresolved because RFC-031 is Proposed only.
- **RESOLVED IN UNMERGED DRAFT PR #74 / NOT PRODUCTION:** SEC-02 nonce CSP and DATA-02 public article authority.
- **PARTLY RESOLVED IN UNMERGED DRAFT PR #74 / NOT PRODUCTION:** PRIV-02 direct-hotlink privacy/availability is closed; historical per-asset attribution/release evidence remains absent.
- **DETECTED / P2:** extended hosted-CI and Firefox coverage are absent. The deterministic local Chromium gate is green 89/89 with exact fixture cleanup, and the final current-build read-only Chromium/WebKit matrix is green for 308 navigations, 1,848 matrix assertions and 39 WebKit interaction assertions with zero failures/non-read-only requests.
- **UNKNOWN/PENDING:** Firefox, final Production/Preview log sampling and the external-provider/device/manual/full-grid gates listed below. Preview identity/Ready state, `origin/main`, implementation head and configured hosted contexts are detected.

## Test evidence

Only completed commands/results are `DETECTED`. A test listing is not an execution pass.

| Command/evidence | Result |
| --- | --- |
| `npm run ci:quality` | **DETECTED PASS / exit 0 locally and inside hosted Quality at `60c30e3`:** lint, typecheck, Prisma validate, structural, casino-editorial, `public-integrity:test`, MVP runtime, auth/comms, brand/canonical, recovery, and launch-polish chain. Hosted Quality completed in 59 seconds and also ran the full Programme suite. |
| `npm run ci:structural` (inside quality) | **DETECTED PASS:** 208/208 structural plus 6/6 FE-GAP checks. |
| `npm run casino-editorial:test` (inside quality) | **DETECTED PASS:** 11/11. |
| `npm run mvp-runtime:test` (inside quality) | **DETECTED PASS:** 42/42. |
| `npm run auth-comms:test` (inside quality) | **DETECTED PASS:** 41/41. |
| `npm run brand-cutover:test` | **DETECTED PASS at `60c30e3`:** 15/15, including canonical-host and independent sitemap-loader resilience tests. The earlier checkpoint contained 14/14 before the new sitemap case. |
| `npm run recovery:test` (inside quality) | **DETECTED PASS:** 25/25. |
| `npm run launch-polish:test` (inside quality) | **DETECTED PASS:** 30/30. |
| `npm run programme:test` | **DETECTED PASS:** 108/108. |
| Focused `tests/program-ai-structural.test.ts` | **DETECTED PASS:** 12/12 at the recorded checkpoint. |
| Focused `tests/public-comparison.test.ts` | **DETECTED PASS:** 19/19. |
| Focused public casino/profile set | **DETECTED PASS:** 32/32. |
| `tests/public-casino-service.test.ts` after the strengthened exact-demo fallback | **DETECTED PASS:** 30/30, including malformed-publication fail-closed coverage. |
| `node --import tsx --test tests/public-comparison-render.test.tsx` | **DETECTED PASS:** 2/2 adjacent and mixed per-record disclosure render tests. |
| Focused `tests/program-ai-missions.test.ts` | **DETECTED PASS:** 13/13. |
| Earlier auth checkpoint | **DETECTED PASS:** 47/47 before later edits; superseded by the current quality/auth evidence above. |
| Earlier brand checkpoint | **DETECTED PASS:** 13/13 before later edits; superseded by current 15/15. |
| Earlier FE-GAP structural checkpoint | **DETECTED PASS:** 7/7; current CI structural evidence is recorded above. |
| Earlier bonus/offer focused run | **DETECTED FAIL:** 25/26 due to a regression-test matcher ordering issue; matcher was corrected. **UNKNOWN/PENDING:** exact final rerun result is not recorded here. |
| Earlier typecheck checkpoint | **DETECTED FAIL:** four branch typing errors; all were patched. Current `ci:quality` typecheck passed. |
| `CI=true npm run browser:extended` | **DETECTED PASS:** 81/81 clean-CMS tests in 1.8 minutes, then exact disposable-demo fixture seeding and 8/8 comparison tests in 21.5 seconds; aggregate 89/89 across nine specs, 0 failed, 0 skipped, 0 retries, exact cleanup complete. |
| `npm run build` | **DETECTED PASS locally and inside hosted Build / Browser at `60c30e3`:** the fresh local Production build completed with 63 generated static targets. Direct/non-approved pooled local-database warnings did not fail the local build and are not hosted-database evidence. |
| `npm run ci:build-secrets` | **DETECTED PASS locally and inside hosted Build / Browser at `60c30e3`:** the configured scan found no secret-pattern match across 754 browser-deliverable files. |
| `npm run ci:migrations` | **DETECTED PASS:** all 19/19 migrations applied to guarded disposable PostgreSQL databases locally and in the green hosted Build / Browser and Database / Migration Verification jobs at `60c30e3`. |
| `npm run mvp-runtime:postgres-test` | **DETECTED PASS at `9e7df95`:** 3/3 PostgreSQL runtime cases against the disposable local database. |
| `npm run programme:seed` | **DETECTED PASS at `9e7df95`:** all ten isolated seed steps completed against the disposable local database. No Production database was involved. |
| `npm run ci:browser` | **DETECTED PASS inside hosted Build / Browser at `60c30e3`:** Chromium 43 passed, one intentional missing-Google-credentials skip and zero failed. This is configured CI-browser evidence, not a real Google-provider flow. |
| Offline audit checkpoint | **DETECTED GREEN:** root quality, fresh build, build-secret scan and the deterministic 89/89 Chromium gate with exact fixture cleanup are green at the recorded implementation head. |
| GitHub hosted rollup | **DETECTED GREEN at `60c30e3`:** Agent Core 13s; Quality 59s; Database / Migration Verification 1m3s; Build / Browser 3m15s with 43 passes and one intentional Google skip; Vercel success; Vercel Preview Comments success. The initial historical Quality failure caused by database-coupled sitemap testing was resolved by `9e7df95`. |
| Initial `CI=true npm run browser:extended` diagnostic (then-seven-spec manifest) | **DETECTED:** 73 total; 42 passed, 31 failed, 0 skipped, with 21 retry executions. The exact failure taxonomy is recorded below; this was diagnostic evidence, not the current expanded-manifest result. |
| Focused stale-contract repair command covering 10 Steps, legal anchors and shared-action focus | **DETECTED PASS:** 13/13 in 11.0 seconds on valid elevated Chromium. An earlier sandbox Mach-port denial is invalid evidence and is not counted. |
| Focused manually reviewed visual-baseline run | **DETECTED PASS:** 14/14 after platform-independent snapshot resolution and deliberate baseline updates; no blind PNG acceptance is claimed. |
| Fresh optimized-build seven-spec extended Chromium checkpoint (`npx playwright test --config=playwright.ci.config.ts` with the then-seven extended spec files) | **DETECTED PASS:** 73/73 in 1.5 minutes; 0 failed, 0 skipped, 0 retries. The preceding 63/73 intermediate run is superseded. This checkpoint predates addition of the corrected eighth comparison spec and is not current-manifest closure evidence. |
| Corrected public comparison/offer contracts + deterministic `browser:extended` | **DETECTED PASS:** demo comparison requires `noindex`, no `ItemList`, adjacent per-record disclosure and truthful source copy. The runner passed 81 clean-CMS tests, then created exact local `_ci` demo fixtures, passed eight comparison tests and completed `finally` cleanup: aggregate 89/89 across nine specs. |
| Final exact-build cross-engine read-only gate | **DETECTED PASS:** Chromium + WebKit, all eleven required widths, 13 primary routes plus intentional 404, 308/308 navigations, 1,848/1,848 matrix assertions and 39/39 WebKit interaction assertions; zero failures and zero non-read-only requests. Ten explicitly classified local Next/WebKit cross-navigation artifacts—aborted RSC prefetch/access-control plus expected 404 logging—were excluded from the stable clean aggregate. Exact command exited 0; port stopped and verified free; no direct rerun required. |
| Firefox browser coverage | **UNKNOWN/PENDING:** no Firefox execution evidence. |

### Initial extended-run failure taxonomy

The initial 42/31 run was classified from exact spec/test output before repairs:

1. **Six genuine product failures — `casino-profile-browser.spec.ts`:** the disclosed SSR demo profile, approved/defensive-width overflow, commercially unavailable editorial state, demo schema suppression, market-denied outbound state and no-JavaScript server HTML cases all returned 404 because no bounded source-controlled demo-detail authority existed. The branch now projects only exact manifest demos and fails closed on repository error or managed unpublished state; the fresh suite passed.
2. **Twenty-one stale assertion/visual-harness failures:** ten visual cases (Home desktop/mobile, public mobile menu, protected Help desktop/mobile, FAQ desktop, legal mobile, Self-Check mobile, personal-limit desktop and About mobile) looked for absent macOS-suffixed PNGs; one shared-action focus test used stale `/program`; one Terms test used stale `#about-sevenbet`; and nine 10 Steps assertions expected the obsolete reward contract instead of approved `20 + 20` before registration and zero for registration. The 13/13 focused repair and reviewed 14/14 visual runs passed.
3. **Four local fixture/canonical-harness failures — `public-casino-browser.spec.ts`:** the stale tests assumed seeded demo/published directory content even though `/casinos` discovery is CMS-backed and the disposable CMS fixture was truthfully empty; local canonical-environment expectations were also inconsistent. `VERCEL_ENV` did **not** select the discovery data source. The tests now assert the governed empty CMS state, and the CI config explicitly clears inherited `VERCEL_ENV` while supplying the approved canonical public origin for deterministic local metadata. The fresh seven-spec checkpoint passed.

The two complete initial passing specs were `fe-gap-02-browser.spec.ts` at 9/9 and `responsible-gambling-browser.spec.ts` at 10/10. This taxonomy totals all 31 failures: 6 product, 21 stale harness/assertions and 4 contaminated local fixture cases.

The exact valid focused repair command was:

```text
CI=true npx playwright test --config=playwright.ci.config.ts tests/ten-steps-browser.spec.ts tests/fe-gap-01-browser.spec.ts tests/design-system-visual.spec.ts --grep "signed-out 10 Steps|10 Steps remains visible|10 Steps follows|all signed-out Programme CTAs|/privacy renders|/terms renders|10 Steps Shared Action"
```

It passed 13/13 in 11.0 seconds. The separately reviewed visual-focused run passed 14/14 after the intentional baseline update.

## Browser evidence

### Read-only Production

| Item | Evidence |
| --- | --- |
| Browser | **DETECTED:** signed-in in-app Chromium-class browser plus read-only HTTP probes. Exact browser build is **UNKNOWN**. |
| Routes inspected | **DETECTED:** canonical home/login/Programme; public project alias login; signed-in git-main/account/immutable aliases; representative Home, 10 Steps, Best Offers, bonuses, casinos, casino profile, compare, contact, admin/login, and error/a11y surfaces. |
| Important observed interactions | **DETECTED:** direct alias navigation/render, page scrolling/inspection, login provider presence, Programme runtime identification, link/CTA inspection, responsive/semantic/accessibility inspection. |
| Deliberately not performed | **DETECTED:** no real Google chooser/return, no physical microphone permission, no Contact email, no CMS/data write, no affiliate redirect success, no Production mutation. |
| Exact viewport list | **UNKNOWN:** the final evidence bundle does not yet preserve the per-capture sizes. No claim is made that the required width matrix is complete. |
| Console/network | **DETECTED:** no general initial app error cluster; expected invalid-OAuth state mismatch from the audit probe. Final fresh pass is **UNKNOWN/PENDING**. |

### Local automated browser checkpoints

| Item | Evidence |
| --- | --- |
| Seven-spec checkpoint | **DETECTED:** fresh optimized build, 73/73 passed in 1.5 minutes; zero failures, skips and retries. Direct/non-approved pooled local database warnings did not represent browser failures. |
| Current deterministic manifest | **DETECTED PASS:** corrected comparison and Best Offers contracts included; 89/89 across nine specs with guarded clean/demo phases, zero failures/skips/retries and exact cleanup. |
| Final exact-build engine/viewport matrix | **DETECTED PASS:** local Chromium and WebKit completed 308/308 route navigations, 1,848/1,848 matrix assertions and 39/39 read-only WebKit interaction assertions across all eleven required widths, 13 primary routes plus intentional 404; zero failures/non-read-only requests. |
| Governed widths exercised | **DETECTED locally:** the functional suites cover 320, 360, 375, 390, 430, 768, 900, 1024, 1280 and 1440 px; the final exact-build cross-engine matrix covers all eleven required widths, including 820 and 1920 px. The hosted Preview grid remains separately pending. |
| State/interaction coverage | **DETECTED:** SSR and JavaScript-disabled casino/profile/directory/legal/Programme paths; responsive overflow/reflow; mobile navigation; reduced motion; legal anchors; Self-Check and Limit Tracker interactions; responsible-gambling surfaces; keyboard/focus contracts; demo action/SEO/schema denial; and the reviewed design-system snapshots. |
| Engines/hosting boundary | **DETECTED:** deterministic functional gate in local Chromium; final current-build route/layout/interaction matrix in local Chromium and WebKit; all six configured hosted contexts green; bounded signed Chromium-class read-only checks on the exact Ready Preview. **UNKNOWN/PENDING:** Firefox and a complete remote Preview cross-engine/full-viewport matrix. |

### Final Preview

| Item | Evidence |
| --- | --- |
| URL/deployment/SHA | **DETECTED:** deployment `5895324564`, Ready at `2026-08-13T20:14:35Z`, immutable `https://sevenbet-next-95l54yjnq-alexg-7bes-projects.vercel.app`, stable branch alias `https://sevenbet-next-git-codex-full-site-in-ae3239-alexg-7bes-projects.vercel.app`, exact source `60c30e3e0d9b2ebde58bd397fffee3c7ce15997e`. This later documentation-only closure is not attributed to that SHA. |
| Signed read-only routes | **DETECTED:** `/`, `/program`, `/best-offers`, `/compare`, `/casino/demo-northstar` and `/admin/login` on the exact deployment. Public canonical URLs remained `https://b4gamble.com`; Preview transport remained on the Preview host. |
| Route findings | **DETECTED:** Programme metadata was mode-neutral; Best Offers rendered classified fictional records and 12 internal detail destinations without `/r`/`/go`; `demo-northstar` returned 200 with fictional disclosure, `noindex, follow` and no commercial link/schema; admin login was B4GAMBLE/noindex; empty Preview comparison truthfully rendered fail-closed, `noindex, follow` and without `ItemList`. Seeded demo comparison behaviour passed 8/8 locally. |
| Chromium desktop/mobile | **DETECTED bounded Chromium-class signed read-only route check.** A complete final desktop/mobile screenshot and interaction matrix is not claimed. |
| WebKit/mobile-equivalent | **UNKNOWN/PENDING.** |
| Firefox | **UNKNOWN/PENDING.** |
| Viewports | **UNKNOWN/PENDING:** 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920. |
| Required routes | **PARTLY DETECTED:** Home, Programme, Best Offers, comparison empty state, one demo profile and admin login are recorded above. Final exact-Preview 10 Steps, login flows, casino directory/other details, bonuses, Learn, Help, Contact and error-route manual evidence remains pending. |
| Required interactions | **UNKNOWN/PENDING:** public desktop/mobile nav, login validation/return, Programme typed/voice-recovery simulation, tabs/carousel/filters/dialogs, Contact validation, error recovery, keyboard, focus, console/network. |
| Authenticated simulation | **DETECTED bounded signed-in read-only inspection:** no write, provider, email, affiliate or Production action was performed. Any future authenticated write simulation still requires an isolated safe account/database or mocks. |

## Manual E2E required

- **UNKNOWN/MANUAL:** physical microphone prompt, denial, settings recovery, actual capture quality, and native Safari/iOS behaviour.
- **UNKNOWN/MANUAL:** controlled Google new-account, cancellation, repeat, and verified existing-account `account_not_linked` recovery/link flow.
- **UNKNOWN/MANUAL:** screen reader (VoiceOver and/or NVDA) and 200% browser zoom/large-text pass.
- **UNKNOWN/MANUAL:** final admin role matrix with isolated non-Production staff accounts and an isolated database before any write.
- **UNKNOWN/MANUAL:** Contact mailbox receipt only if a single safe synthetic Preview send is still required and already configured; provider acceptance is not mailbox receipt.
- **UNKNOWN/MANUAL:** real-device/native microphone behaviour cannot be inferred from Playwright emulation.

## Blockers

- **CONTRADICTION:** Production environment authority for PROGRAM-AI and Google.
- **DETECTED CLOSED:** Preview deployment `5895324564`, Ready state, immutable URL, branch alias and exact implementation source `60c30e3` are recorded. This documentation-only closure follows that source head.
- **PROPOSED:** RFC-031 supplies no implementation authority, so the voice-cap defect cannot be fixed in code yet.
- **UNKNOWN:** isolated admin/CMS write-test environment/credentials were not established for this pass.
- **UNKNOWN/PENDING:** Firefox and the complete remote Preview cross-engine/full-viewport/manual-flow counts. The bounded signed read-only exact-Preview route evidence, deterministic local Chromium 89/89 and exact-build Chromium/WebKit matrix are detected.
- **DETECTED:** completion fetch found `origin/main` unchanged at `c52595405f0800c8c2b51d5951c4a8d45c133034`; implementation head `60c30e3` therefore remained based on that exact main. Merge/promotion remains a Founder decision.

## Known accepted limitations

- **DETECTED:** exact fictional demo records may remain only when conspicuously labelled, noindex/no commercial schema, and without commercial action.
- **DETECTED:** internal `sevenbet` repository, package, cookie, header, database, migration, and compatibility identifiers may remain; they are not consumer brand surfaces.
- **DETECTED:** feature flags remain necessary rollback controls; do not delete them merely because a branch test passes.
- **DETECTED:** Help and Mission 01 remain open without account; persistent Programme after M1 requires account continuity.
- **DETECTED:** no real GB commercial partner/action exists; a smaller/empty public directory is preferable to invented authority.
- **DETECTED:** external legal/regulatory/partner/processor gates remain outside a software QA completion claim.

## Contradictions

1. **CONTRADICTION / HOLD:** Production PROGRAM-AI UI is on; RFC-023/RFC-025/Project State authority says Production activation remains separate/off.
2. **CONTRADICTION / HOLD:** Production Google is presented; RFC-021/RFC-029/Project State say Production Google remains separately gated/off.
3. **CONTRADICTION:** source and Production SHA matched at audit start, but runtime feature configuration did not match documented authority. SHA parity is therefore not product-state parity.

**DETECTED RESOLVED:** the former Technical Baseline and Project State/Roadmap wording drift was reconciled. It is not a live contradiction in this final audit record.

## Unknown / pending completion evidence

The implementation head, commit list, completion `origin/main`, Ready Preview identity, bounded signed route evidence and all six configured hosted contexts are detected above. This documentation-only closure intentionally follows `60c30e3` and cannot claim that pre-closure SHA as its own.

- Complete final Preview screenshots, WebKit/Firefox coverage, the full governed viewport/route grid, console/network results and accessibility scan totals beyond the bounded signed read-only routes recorded above.
- Final Production log one-hour/24-hour grouped evidence.
- Current Production values for non-exposed flags; no secret value should be retrieved or recorded.
- Real provider/device/manual gates listed above.

## Rollback

| Change area | Rollback |
| --- | --- |
| Canonical-host guard | Revert the focused RFC-030 middleware/resolver/test commit. Existing custom-domain/platform redirects and canonical metadata remain independent. Never replace it with a Host-derived redirect. |
| Public data/SEO | Revert the coherent public fix commit if a Preview regression is confirmed. No schema/data rollback is required. Do not restore legacy deployed fallback as a Production solution. |
| Programme guards/projection/body limits | Revert the coherent Programme fix commit if tests reveal regression; exact feature flags remain the operational kill switch. No reward/data rewrite is part of rollback. |
| Admin/a11y/UI | Revert the respective coherent commit(s); no migration or Production data rollback. |
| PROGRAM-AI operational safety | Set `PROGRAM_AI_REAL_PROVIDER_ENABLED` and/or `PROGRAM_AI_V1_ENABLED` to the approved off state only under explicit operations authority, then redeploy/verify. This audit did not perform that action. |
| Voice | Current incompatible 8 MiB limit must not be called resolved. If RFC-031 is later approved and implemented, rollback should disable real provider/feature and preserve typed input rather than restore an unusable Vercel limit. |

No destructive migration, schema change, Production seed, or Production write is part of the audit branch. The detected seed/migration/runtime checks used a guarded disposable local `_ci` database, so no Production database rollback is expected.

## Production changes

Production code deployed: **NO**

Production database mutated: **NO**

Production env changed: **NO**

Production secrets changed: **NO**

Production DNS changed: **NO**

Production OAuth configuration changed: **NO**

Production CMS data changed: **NO**

Production email/partner/customer communication sent: **NO**

Production affiliate/commercial action enabled: **NO**

## Founder decisions required

1. **Production authority reconciliation:** decide whether the observed Production PROGRAM-AI and Google availability is unauthorised drift that must be disabled/redeployed, or provide the missing approved activation record and require the full privacy/provider/operational evidence before it remains available. HOLD remains until reconciled.
2. **RFC-031:** approve, amend, or reject the proposed 4 MiB raw-audio/4 MiB+64 KiB envelope contract. Until approval, the Vercel voice-size conflict remains P1 and should not be patched ad hoc.
3. **Remote imagery rights/provenance:** decide whether rights evidence permits controlled self-hosting/replacement of Pexels imagery. Engineering must not copy third-party assets merely to remove hotlinks without that evidence.

## Completion gate

The identity, configured hosted-gate and bounded signed read-only Preview placeholders are closed. This record remains on HOLD because Production authority contradictions and live P0/P1 conditions are unresolved. It may move to `GO FOR FOUNDER REVIEW` or `GO WITH CONDITIONS` only after explicit treatment of every remaining P0/P1 and the required Firefox, external-provider/device, isolated-role, accessibility, console/network/log and other manual/full-grid evidence is either completed or formally accepted as a condition. The PR must remain Draft and Production must remain unchanged.

# MVP-RUNTIME-01 Implementation Evidence

## Status

**CODE COMPLETE / ACTIVATION PENDING** is the intended handoff state after exact-head verification. This document records evidence as of 2026-08-11 and does not declare shared Preview or Production readiness.

## Detected

- Branch `codex/mvp-runtime-01-analytics-hardening` was created from exact main `0a904a3b8dbf95de4a290ba9b071785f0bbbcfc3`.
- Draft PR #67 exists and is not merged.
- RFC-026 was approved for the bounded package before implementation.
- `@vercel/analytics` is the only added runtime dependency and is pinned exactly to `2.0.1`.
- The repository contains one 15-event typed/runtime-validated analytics contract, root page-view redaction and named client/server emitters.
- Every custom event has at most two properties for base Vercel Pro compatibility; `programme_home_viewed` contains only `currentMission` and `engagementDayBucket`.
- Analytics remains default off unless `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` is exact `true`.
- Hobby Web Analytics was enabled at zero incremental recurring cost; no event was manufactured.
- Custom Events are unavailable on the current Hobby plan; no plan upgrade occurred.
- Vercel Pro is the Founder-managed target for Custom Events; Web Analytics Plus is not required or approved.
- The repository contains one standalone `ProgrammeRuntimeRateLimitBucket` model and additive migration `0019_programme_runtime_hardening`.
- The distributed limiter uses fixed windows, HMAC keys, one atomic upsert and exact RFC-026 thresholds.
- `PROGRAMME_MUTATION_SESSION` protects every formerly guarded anonymous mutation at 60 requests per 10 minutes without persisting the raw token or intermediate token hash.
- Expensive provider routes suppress provider calls and retain existing fallback/Type instead paths when limited.
- The purge is dry-run by default, batch/total bounded and restricted to three transient row classes.
- One exact-Bearer authenticated cron route and one daily schedule are present.
- The aggregate report uses only Vercel's aggregate event-count API and process `VERCEL_TOKEN`.
- Redacted Preview and Production provider identities are `DIFFERENT`.
- Base `DATABASE_URL` and `DIRECT_URL` are empty in both current Vercel inventories; provider aliases are present but direct-only.
- `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` and `CRON_SECRET` are absent in both current Vercel inventories.
- Node 24 final-gate checks pass locally: lint, typecheck, Prisma validation, 196 structural checks, 34 analytics/runtime/report checks, 38 auth/comms checks and 6 brand checks.
- Programme tests pass 94/94, Program AI tests pass 44/44 and legal/privacy regressions pass 20/20.
- A fresh disposable PostgreSQL database applied all 19 migrations through the repository CI path. The amended real-PostgreSQL concurrency, anonymous HMAC-only persistence and purge tests pass 3/3.
- The database-backed Program AI browser suite passes 9/9, including the full 715-XP path and a real distributed 429. Feature-off/auth/brand/public/Help browser regressions pass 24 with one intentional skip.
- The analytics-enabled production build passes. The client/build secret audit passes across 690 browser-deliverable files.
- The final-gate browser suites pass 24 with one intentional skip plus 9/9 database-backed Program AI checks.
- The final-gate disposable cluster and all synthetic rows were removed after verification.

## Inferred

- A new Vercel deployment is not database-ready from the current base bindings, even if an already-built Production deployment retained an older configuration snapshot.
- Migration 0019 and successful cron purge must remain blocked until matched pooled/direct bindings are configured and recovery sequencing allows shared-environment mutation.
- Custom-event report sections cannot produce useful data on the current Hobby plan.

## Planned / activation pending

- Generate matched pooled/direct credentials for each existing isolated Prisma Postgres resource after RECOVERY-01 closure.
- Bind Preview first, prove `DIFFERENT` from Production, apply migration 0019 through the controlled migration path and run safe Preview smoke.
- Decide whether to approve Vercel Pro for Custom Events. If approved, activate the exact analytics flag in the authorised environment; otherwise retain code default-off for custom events.
- Generate and install `CRON_SECRET` only after database/migration readiness, then verify exact authenticated invocation in Preview-equivalent evidence before Production approval.
- Apply migration 0019 to Production under separate Founder authority while old main is still deployed; only after verification may PR #67 merge. Runtime flags/secrets remain later separate actions.

### Unmet release gates

- Founder review of the draft package is pending.
- RECOVERY-01 closure is pending.
- Matched pooled-runtime/direct-migration bindings are unresolved in both shared environments.
- Migration 0019 has not been applied to isolated Preview or Production.
- Preview rate-limit/purge smoke and exact deployment-SHA evidence are pending.
- Vercel Custom Events require a separate plan decision; the custom-event flag remains absent.
- `CRON_SECRET` remains absent and scheduled purge activation is pending.
- Production migration/configuration and final post-activation smoke remain separately controlled.

### Exact post-RECOVERY migration-before-merge sequence

1. Fetch new main after RECOVERY-01 merges.
2. Resolve only genuine conflicts and verify migration `0019` remains unique.
3. Configure matched pooled/direct bindings for isolated Preview and prove Preview `DIFFERENT` from Production.
4. Apply migration 0019 to isolated Preview only.
5. Use a synthetic/test secret only for the Preview Cron-handler proof and run Preview limiter, Programme-mutation, purge dry-run, page-view-redaction and feature-off smoke.
6. Obtain Founder review.
7. Under explicit Founder authority, apply additive migration 0019 to Production while old current-main code remains deployed.
8. Verify the table/index/check constraints, unchanged existing schema and operational old Production Programme without synthetic rows.
9. Only then merge PR #67 by merge commit and verify the automatic exact-main deployment.
10. Configure Production analytics, `CRON_SECRET`, Vercel Pro Custom Events and matched pooling only under separate Founder authority.
11. Run final safe Production smoke without synthetic Programme users, analytics events, concurrency traffic or purge execution.
12. Keep Program AI, Google and commercial/referral activation separately controlled.

## Not detected

- No reward, achievement, Mission ordering, prerequisite or Definition-of-Done contract change.
- No new generic Programme engine, workflow DSL, central Mission switch or repository abstraction.
- No Prisma import in a route handler or React component.
- No client-owned XP, completion, progress or next-Mission calculation.
- No Programme/Help/pause signal imported by commercial targeting, ranking or affiliate authority.
- No raw analytics identity, content, XP total, health data or arbitrary metadata property.
- No shared Preview or Production migration, purge, seed, reset, data query or canary access.
- No Production feature/provider/Google/commercial activation.
- No Vercel plan upgrade or other paid recurring commitment.
- No documentation permits merging PR #67 before Production migration 0019 is applied and verified against old main.

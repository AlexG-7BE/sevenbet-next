# RFC-026: MVP Analytics and Programme Runtime Hardening

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `MVP-RUNTIME-01`
- **Approved:** 2026-08-11
- **Scope:** Privacy-safe aggregate product analytics, distributed Programme runtime rate limiting, bounded transient expiry purge, one authenticated Vercel Cron route, runtime database binding verification and activation-readiness evidence
- **Base:** `0a904a3b8dbf95de4a290ba9b071785f0bbbcfc3`
- **Depends on:** Product Vision & Principles v2.0, RFC-017, RFC-021, RFC-022, RFC-023, RFC-025, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** the in-memory Programme limiter only for runtime requests routed through the distributed contract; no Product, Mission, reward, commercial, authentication or provider authority is superseded

## 1. Decision and ceiling

B4GAMBLE will add the final broad pre-commercial product-code package for aggregate product measurement and Programme runtime hardening. The package is intentionally bounded to:

1. Vercel Web Analytics and a closed custom-event contract;
2. an aggregate-only Founder report;
3. PostgreSQL-backed fixed-window Programme rate limiting;
4. a bounded purge for expired anonymous operational state;
5. one secure daily Vercel Cron invocation;
6. safe database binding classification and activation runbooks; and
7. deterministic local/disposable-database evidence.

It adds exactly one runtime dependency, `@vercel/analytics`, and exactly one Prisma concept, `ProgrammeRuntimeRateLimitBucket`.

This RFC does not authorise a new analytics provider, warehouse, event bus, cache, database, queue, dashboard, session replay, heatmap, advertising tracker, commercial segmentation, real operator/casino/bonus data, affiliate activation, Production Google activation, Production PROGRAM-AI activation, reminder delivery or Production data mutation.

Analytics is measurement, never authority. Its availability cannot affect access, authentication, age, XP, Mission state, Review entitlement, provider results, ranking, commercial availability, Help or safer-gambling behaviour.

## 2. Analytics provider and kill switch

The provider is Vercel Web Analytics plus Vercel custom events because the application already runs on Vercel. The integration uses the framework package at the application root and server events through the package's server entry point. Server event dispatch is scheduled with stable Next.js `after(...)` after the authoritative response path; it does not run inside a Prisma transaction.

One non-secret flag controls both client and server analytics:

```text
NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true
```

Only the exact string `true` enables analytics. Missing, empty, differently cased or malformed values disable it. There is no second flag or per-event flag. Analytics errors produce bounded metadata-only operational logging and never a user-visible failure.

## 3. Automatic page-view privacy

The root Analytics component uses `beforeSend` with these exact rules:

- `/program` and every nested Programme URL retain only origin plus clean pathname; query and fragment are removed;
- `/admin` and nested private admin surfaces return `null` and send no automatic page view;
- `/api` URLs return `null` defensively;
- other public acquisition routes keep Vercel's normal safe campaign attribution.

This rule is URL minimisation only. It does not make Programme content eligible for custom-event properties.

## 4. Closed event contract

Normal product code cannot call a public generic `track(name, properties)` API. It calls a closed typed product-event contract whose runtime parser rejects unknown event names, missing or additional properties, invalid enum/range values and strings longer than the provider ceiling. Values are closed enums or small integers only; free text and nested objects are absent.

The approved events are:

| Event | Exact allowed properties |
| --- | --- |
| `programme_start_clicked` | `sourceSurface: ten_steps | public_header | home | other_public` |
| `programme_access_granted` | `entryMode: start | resume | unknown` |
| `programme_m1_situation_submitted` | `inputMode: voice | text` |
| `programme_m1_personalised_value_presented` | `resultType: starting_point | clarification`; `elapsedBucket: lt_30s | 30_60s | 60_90s | 90_120s | gt_120s | unknown` |
| `programme_registration_cta_presented` | `elapsedBucket: lt_60s | 60_90s | 90_120s | gt_120s | unknown` |
| `programme_claim_redeemed` | `authMethod: google | email | unknown` |
| `programme_home_viewed` | `currentMission: 1..10`; `programmeState: not_started | in_progress | completed`; `engagementDayBucket: day_0 | day_1 | day_2_3 | day_4_7 | day_8_plus | unknown` |
| `programme_mission_opened` | `mission: 1..10`; `mode: start | resume | review` |
| `programme_mission_action_completed` | `mission: 1..10`; `actionPosition: 1 | 2 | 3` |
| `programme_mission_completed` | `mission: 1..10` |
| `programme_review_opened` | `milestone: first | mid | full` |
| `programme_completed` | `pathVersion: program_ai_v1` |
| `programme_discovery_clicked` | `sourceSurface: programme_home | mission_08 | mission_10`; `destinationRoute: casinos | compare | bonuses | best_offers | bonus_guide` |
| `programme_ai_outcome` | `operation`: one RFC-023/RFC-025 closed operation; `result: provider | fallback | rate_limited | timeout | invalid_output | provider_error` |
| `programme_voice_outcome` | `result: recording_started | transcription_success | permission_denied | transcription_error | cancelled` |

Authoritative milestones emit only after the corresponding server operation succeeds. Mission and Programme completion events are first-completion events where the authoritative result exposes that distinction. Client exposure events use bounded `sessionStorage` deduplication. The M1 start timestamp is stored only in the current tab and converted to an approved bucket; the raw timestamp and exact duration are never transmitted.

## 5. Absolute analytics denylist and commercial firewall

No event property, event name construction, log or report contains an identifier or private/content value, including user/account/session/journey/claim identifiers, IP or hashed IP, user agent, email/name, token, raw situation, audio/transcript, clarification, prompt/output, Starting Point, Review text, Mission wording or artifact value, boundary/support/research/rehearsal/plan answer, operator/bonus preference, affiliate destination, XP total, monetary amount or health/addiction information.

Analytics remains aggregate product measurement. It is not imported by casino/bonus ranking, affiliate redirect authority, commercial personalisation, retargeting or commercial AI. No user profile, engagement score, readiness/risk/LTV/intent score or audience segment is created.

## 6. Aggregate report

`npm run analytics:programme` queries only Vercel's aggregate/count Web Analytics API with `VERCEL_TOKEN` from the operator process. The token is never printed. Default project/team IDs are the existing B4GAMBLE authorities and may be replaced only by explicit syntactically safe CLI overrides.

The report supports `--since 7d` or bounded `--from`/`--to` dates and reports:

- adjacent M1 activation counts and conversion percentages;
- Mission 02–10 completion counts and adjacent continuation ratios;
- First/Mid/Full Review-open counts;
- generic Programme discovery click counts by approved surface/route;
- AI result counts; and
- voice result counts.

Zero denominators render `N/A`. The report does not claim cohort-perfect retention, fetch raw visitor records or query private application tables.

## 7. Distributed rate-limit model

One additive Prisma model stores operational fixed-window buckets:

```text
ProgrammeRuntimeRateLimitBucket
  bucketKey       String primary key
  scope           closed internal scope
  count           integer
  windowStartedAt timestamp
  expiresAt       timestamp, indexed
  createdAt       timestamp
  updatedAt       timestamp
```

There is no foreign key to `User`, `AnonymousProgrammeSession` or another product record. The bucket key is a lowercase HMAC-SHA-256 digest. A purpose key is derived from `BETTER_AUTH_SECRET` with domain separator `b4gamble:programme-rate-limit:key:v1`; the bucket digest covers the closed scope, source and fixed-window number. Raw source identifiers and derived bucket keys are not logged.

In Vercel runtime, anonymous IP scopes use the Vercel-overwritten `x-forwarded-for` client address. Deterministic local/CI tests may inject a test address. If a trusted Production client address is unavailable, the expensive provider path fails safe on cost.

The persistence operation is one atomic PostgreSQL upsert that creates `count=1` or increments `count`. The returned count decides allowance, making concurrent serverless instances share one counter. The normal window is 10 minutes.

## 8. Closed scopes and thresholds

| Scope | Source | Threshold / 10 minutes | Behaviour on denial |
| --- | --- | ---: | --- |
| `PROGRAMME_SESSION_CREATE_IP` | client IP | 12 | `429 RATE_LIMITED` |
| `PROGRAMME_TRANSCRIPTION_SESSION` | anonymous session | 6 | `429`, Type instead remains available |
| `PROGRAMME_TRANSCRIPTION_IP` | client IP | 20 | `429`, Type instead remains available |
| `PROGRAMME_M1_AI_SESSION` | anonymous session | 4 | truthful existing provider-off/fallback path |
| `PROGRAMME_M1_AI_IP` | client IP | 30 | truthful existing provider-off/fallback path |
| `PROGRAMME_MISSION_GUIDANCE_USER` | authenticated user | 30 | no provider call; deterministic fallback |
| `PROGRAMME_REVIEW_USER` | authenticated user | 12 | no provider call; deterministic fallback |
| `PROGRAMME_MUTATION_USER` | authenticated user | 120 | `429 RATE_LIMITED` |

Hard denials return HTTP 429 with `Retry-After` and only `{ code: "RATE_LIMITED", retryAfterSeconds: integer }`. Static/public pages, ordinary Programme reads, Protected Help and commercial discovery clicks have no Programme rate-limit dependency.

If the limiter's database operation fails, expensive provider calls fail safe on cost and use an existing deterministic fallback when available. Non-provider progress cannot silently lose or duplicate state; it receives the smallest safe typed failure before mutation. External calls never run inside the limiter or Programme transaction.

## 9. Bounded transient expiry purge

`purgeExpiredProgrammeRuntime({ now, batchSize, dryRun })` operates on three and only three temporary row classes:

- `AnonymousProgrammeSession` with `expiresAt < now - 24 hours`;
- unconsumed `PendingProgrammeClaim` with `expiresAt < now - 24 hours`;
- `ProgrammeRuntimeRateLimitBucket` with `expiresAt < now`.

Consumed claims, users, accounts, active auth sessions, user-bound Programme state/content/authority, progress/XP, Reviews, legacy Programme artifacts, casino/bonus/affiliate data and audit logs are excluded.

The default batch is 500 rows per class. One invocation has a hard ceiling of 5,000 per class and no unbounded loop. Inputs are clock, batch size and dry-run; output contains aggregate counts only. The manual CLI is dry-run by default and requires both `--execute` and the existing explicit environment-target confirmation convention for Production. Production execution is outside this workstream.

## 10. Cron contract

One daily Production-only Vercel Cron invokes:

```text
GET /api/internal/cron/programme-expiry-purge
17 4 * * *
```

The route fails closed when `CRON_SECRET` is missing and requires exact `Authorization: Bearer <CRON_SECRET>`. The secret never appears in a URL, response, log, build artifact or committed file. The route performs bounded execute-mode purge and returns aggregate counts only. Preview/shared-database invocation and Production secret mutation are outside the initial implementation.

## 11. Migration and recovery sequencing

The additive migration is expected to be `0019_programme_runtime_hardening` after verifying current main. It creates only the rate-limit table, primary key and expiry index. Rollback SQL drops only that new table and is documented for an explicitly controlled rollback; no automatic down migration is introduced.

RECOVERY-01 remains open and owns PR #65, RFC-024 and recovery canary `73a3c254-8ffb-4d35-b91f-9fb7436ad45f`. This workstream must not switch to or modify that branch/PR, access the canary, reset/seed shared Preview, apply migration 0019 to shared Preview or Production, or mutate Production data. Migration, concurrency, purge and browser evidence use local/disposable PostgreSQL until RECOVERY-01 closes.

If RECOVERY-01 merges before schema finalisation, the branch must update from new main, inspect migration history and retain a unique next migration identifier.

## 12. Database runtime target

Read-only control-plane inspection classifies, without revealing URLs or passwords:

- whether `DATABASE_URL` and `DIRECT_URL` are configured;
- whether runtime is pooled/direct/unknown;
- whether migration authority is direct/pooled/unknown; and
- whether Preview resource `store_hLPkkgamL7rJNmCe` and Production resource `store_1I4F54ETrwSKS42o` remain different.

Prisma Postgres provides managed pooling for the Marketplace runtime URL. Repository schema keeps `DATABASE_URL` as runtime authority and `DIRECT_URL` as migration/administrative authority. No Production binding changes or new database are authorised. A binding correction that cannot be proven as a safe future alias change stops for Founder review.

## 13. Observability and secret boundary

Operational logs may contain fixed analytics event/result names, rate-limit scope/limited boolean, purge aggregate counts/duration, cron result, closed AI operation and provider result category. They never contain raw/digested source identity, identifiers, private content, provider request/response content, URLs, tokens or secrets.

`VERCEL_TOKEN`, `CRON_SECRET`, `BETTER_AUTH_SECRET`, database credentials and OpenAI credentials are server/operator-only and must not enter client/build artifacts. `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` is intentionally a public boolean.

## 14. Rollout, cost and rollback

Initial delivery is code/disposable-database complete with shared activation pending. Vercel Web Analytics may be enabled on the existing project only when control-plane evidence confirms no plan upgrade or incremental recurring commitment. No plan upgrade or paid analytics product is authorised. Expected incremental recurring infrastructure cost is USD 0.

Analytics rollback sets `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` to a value other than exact `true` or removes the root component. Rate-limit code rollback must occur only with an explicit runtime decision; database rollback drops only the new operational table after code no longer depends on it. Cron rollback removes/disables the one schedule after ensuring no active invocation depends on it.

Production PROGRAM-AI, real provider, Google OAuth and commercial/referral flags remain unchanged and off.

## 15. Verification and release boundary

Required evidence includes:

- exact event-contract allow/deny tests, URL redaction and admin suppression;
- M1 ordered funnel, elapsed buckets, Mission/Review/completion/discovery events and no-content payload checks;
- analytics failure non-authority and aggregate-report API mocks;
- limit/limit+1, reset, source isolation, digest privacy, Retry-After and concurrent atomic-increment tests;
- provider-call suppression and deterministic fallback/Type Instead behaviour;
- clean M1–M10 progression below thresholds and exact-once regressions;
- purge grace, dry-run, bounded execute, cascade, consumed-claim/user-authority preservation, bucket cleanup and idempotency;
- Cron authentication and missing-secret denial;
- fresh/disposable migration application after 0018, Prisma validation/generation and rollback notes;
- data-subject, Help, feature-off, auth, privacy, build-secret and browser regressions; and
- exact-head CI/build evidence.

The package remains a draft and must not merge. It may be described as `CODE COMPLETE / ACTIVATION PENDING` only after local/disposable gates pass. It may not be described as Production hardened until RECOVERY-01 closes, the unique migration is applied through the controlled shared-environment procedure, Preview smoke passes, and Founder Office separately approves Production environment activation.

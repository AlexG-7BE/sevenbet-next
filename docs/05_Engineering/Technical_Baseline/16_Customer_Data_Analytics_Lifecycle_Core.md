# Customer Data, Analytics & Lifecycle Core

## Evidence scope

| Field | Evidence |
| --- | --- |
| Audit date | 11 September 2026 |
| Canonical repository | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Candidate worktree | `codex/customer-data-analytics-lifecycle-v1`, based on `230e652af0e53e1e378051e33955943f788cd94a` |
| Scan | Entire active repository: 2,388 files after excluding dependencies, generated/build output, caches and `tsconfig.tsbuildinfo` |
| Inventory | 125 API route handlers, 79 pages, 220 test/spec files, 116 Prisma models, 99 enums and 37 ordered migrations |

**DETECTED** below means present in the isolated implementation candidate.
**UNKNOWN** means live Preview/Production or provider evidence has not yet
established the fact. Planned work is explicitly **PROPOSED**. This document
does not convert candidate source into deployed state.

## Governing decision and release classification

**DETECTED:** [RFC-046](../../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)
records the durable domain, data, privacy, provider and reporting boundaries.
The implementation uses additive migration
`0037_customer_data_analytics_lifecycle_core` and retains Better Auth,
Programme persistence and RFC-042 as identity, progress and commercial-routing
authorities.

**UNKNOWN:** migration 0037 in Production, application deployment, analytics
observations, dashboard values, provider registration and live lifecycle
delivery. The outbound lifecycle sender is intentionally unwired, so email
delivery is **HOLD**, not Production-complete.

## Detected runtime architecture

```text
browser/server observations -> strict services -> PostgreSQL ledgers -> fixed Admin views
Better Auth User -----------^          |                 |
Programme authority ------------------|                 +-> aggregate-only sanity
RFC-042 /r authority -> final click observation
email consent -> eligibility -> durable queue -X-> external provider (unwired)
                                      ^
verified Resend webhook -> normalized outcomes
```

**DETECTED:** route handlers and React components depend on service modules,
not Prisma. Analytics failures cannot authenticate, advance Programme/XP or
change a redirect. Email state cannot grant identity or Programme access.
Programme answers, transcripts, Help/pause/vulnerability data and arbitrary
JSON are absent from analytics and campaign filters.

## Detected product surfaces

| Area | Evidence |
| --- | --- |
| Customers | `/admin/customers`, customer detail, canonical Better Auth observer, normalized email constraint and bounded acquisition/last-seen metadata |
| Core analytics | signed preference endpoint, strict `/api/analytics/events` batch ingestion, 19 enum-backed events, database rate limit, cross-account-safe session rotation/linking and explicit relational dimensions |
| Programme analytics | server observers attached after canonical persisted starts/completions; consented client views; no client progress calculation |
| Commercial attribution | consented casino-review and viewport offer observations plus `/r/{slug}` retaining RFC-042 decision authority and recording one minimized final `SUCCEEDED`/`BLOCKED` result without destination/tracking URL |
| Email/templates | versioned/sanitized templates, current eligibility, durable message/campaign idempotency, review-before-queue, unsubscribe and provider-event ledger |
| Consent/dashboards | analytics and email purposes remain separate; fixed Founder/Programme/Commercial/Email views with bounded UTC ranges and explicit metric definitions |

**DETECTED:** optional signup marketing-consent copy is unchecked by default
and uses an explicit English fallback for locales without approved compliance
translations. No new translated legal or gambling-marketing claim is inferred.

## Detected privacy and security controls

- Browser analytics identifiers are issued only after affirmative consent and
  are HMAC-signed with at least 32 characters of configured secret material;
  withdrawal clears them. Email is never an analytics ID.
- Ingestion requires exact Origin or explicit same-origin Fetch Metadata,
  fails closed when that evidence is absent, and is strict, 32 KiB/20-event bounded, versioned,
  per-item deduplicated and database-rate-limited. Production-human filtering
  is explicit.
- Raw IP, user agent, arbitrary properties, free text, audio/transcripts,
  credentials, raw affiliate destinations/tokens and clicked email URLs are
  not stored by the Core.
- Admin pages and mutations independently enforce scoped role permission;
  state changes also enforce same-origin and bounded JSON. Template and
  campaign state transitions create relational staff audit records without
  copying template bodies or recipient addresses.
- Webhooks use the exact raw body and Svix headers before parsing; provider
  event IDs make replay idempotent. Raw payloads and recipient addresses are
  not persisted as provider events.
- Unsubscribe URLs use a message-bound HMAC token; only its SHA-256 hash is
  stored. Consumed-token replay safely reapplies a later-removed suppression.
  Marketing and all-email suppression are distinct.
- Default detail retention is 395 days for analytics/session/click records and
  730 days for terminal email history, with bounded 5,000-row purges.

## Detected persistence and reporting controls

**DETECTED:** migration 0037 is additive; it creates no customer, event, click,
campaign or message rows. English verification/reset/welcome/reminder/broadcast
template versions are deterministic seeds. Functional email uniqueness,
state/provider/test-purpose checks, stable opaque keys, foreign-key deletion behavior and reporting indexes
make malformed or duplicate state fail closed.

**DETECTED:** metric formulas are centralized in
`lib/analytics/metrics.ts`. Dashboards use fixed filters and UTC half-open
ranges. An outbound attempt is not a success; Programme completion is a start
cohort outcome; email delivery/bounce/click require unique verified provider
events. Open rate and free-form query builders are absent.

**DETECTED:** email workers select only the current tagged environment and
perform a second canonical recipient/eligibility read immediately before the
provider boundary. Campaigns/messages are environment-tagged with composite
environment/idempotency uniqueness. Review records eligible, excluded and
suppressed/unsubscribed counts; queue transitions are conditional and audited.
Lifecycle selection excludes already-queued reminder identities so a full
early page cannot starve later candidates. Recipient rows remain idempotent by
campaign and user.

## Detected release and verification surfaces

- `prisma/preflight/0037_customer_data_analytics_lifecycle_core.sql` reports
  duplicate normalized emails and rows requiring normalization without writes.
- `scripts/vercel-build-preflight.ts` verifies required migration state,
  checksum, schema objects, constraints, indexes and data invariants.
- Unit and structural suites cover identity, consent, validation, metrics,
  eligibility, sanitization, provider contract, idempotency, RBAC and layering.
- A disposable-PostgreSQL suite covers full relational flows and rollback-safe
  behavior; browser acceptance covers consent, anonymous/authenticated use,
  Admin surfaces, webhook rejection, cron protection and mobile layouts.
- `scripts/customer-data-analytics-lifecycle-sanity.ts` emits aggregate counts
  only and fails on identity, cross-session identity/environment, event, click,
  provider/message, suppression or environment defects.

**UNKNOWN until CI/release evidence is linked:** successful full migration
replay, build/browser acceptance, Production preflight/postflight and live
aggregate sanity. The operational procedure is
[Customer Data, Analytics & Lifecycle Core v1](../../06_Operations/Customer-Data-Analytics-Lifecycle-Core.md).

## External integration boundary

**DETECTED:** the direct-HTTPS Resend adapter has an eight-second timeout,
provider idempotency header and exact Production-only configuration contract.
The webhook verifier and memory-test provider are implemented.

**DETECTED HOLD:** no public/Admin route, Better Auth callback or cron imports
and invokes the external processor. Queued messages are therefore durable
intent, never evidence of send. **PROPOSED:** connect that processor only after
explicit privacy/security/provider-transfer authority, configure verified
sender/webhook state and pass controlled non-customer canary delivery.

## Contradictions reconciled

- Older baseline claims that Vercel Analytics is the active candidate are
  stale for RFC-046; the candidate retires that transport in favor of the
  first-party, consented relational contract.
- Older claims that no receiving webhook or account/Programme email boundary
  exists are historical. A receiver and ledger now exist in candidate source,
  while external lifecycle sending remains absent.
- No candidate fact changes the separately recorded live Production SHA,
  migration history or provider activation without authoritative release
  evidence.

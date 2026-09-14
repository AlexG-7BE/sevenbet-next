# Customer Data, Analytics & Lifecycle Core

## Evidence scope

| Field | Evidence |
| --- | --- |
| Audit date | 14 September 2026 |
| Canonical repository | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Current state | Production delivery and Customer / Analytics / Lifecycle acceptance are active at 6/6 PASS |
| Scan | Entire active repository: 2,356 tracked files after excluding dependencies, generated/build output, caches and `tsconfig.tsbuildinfo` |
| Inventory | 116 API route handlers, 77 pages, 228 test/spec files, 109 Prisma models, 99 enums and 41 ordered migrations |

**DETECTED** means established from repository or named live authoritative
evidence. **UNKNOWN** means live Preview/Production or provider evidence has
not established the fact. Planned work is explicitly **PROPOSED**. Candidate
source is never presented as deployed state.

## Governing decision and release classification

**DETECTED:** [RFC-046](../../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)
records the durable domain, data, privacy, provider and reporting boundaries.
The implementation uses additive migration
`0037_customer_data_analytics_lifecycle_core` and retains Better Auth,
Programme persistence and RFC-042 as identity, progress and commercial-routing
authorities.

**DETECTED:** PR #269 established the Core. All 41 current migrations,
including 0037 and the additive 0038 Commercial UX events, are applied;
consented analytics is enabled and aggregate sanity passed. The 12 September
Founder instruction approves bounded Resend processing.

**DETECTED / GO:** the webhook and complete sender configuration exist. PRs
#271/#273/#274 deploy the worker and acceptance fixes. All six controlled live
cases pass with marked provider-safe fixtures; lifecycle delivery is enabled.
This live operational evidence does not establish still-open provider
agreement, entity, location or international-transfer facts.

## Detected runtime architecture

```text
browser/server observations -> strict services -> PostgreSQL ledgers -> fixed Admin views
Better Auth User -----------^          |                 |
Programme authority ------------------|                 +-> aggregate-only sanity
RFC-042 /r authority -> final click observation
email consent -> eligibility -> durable queue -> protected daily worker -> external provider
                                               (exact Production config only)
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
| Core analytics | signed preference endpoint, strict `/api/analytics/events` batch ingestion, 22 enum-backed events, database rate limit, cross-account-safe session rotation/linking and explicit relational dimensions |
| Programme analytics | server observers attached after canonical persisted starts/completions; Mission 10 and enrollment completion timestamps are equal; consented client views; no client progress calculation or Vercel aggregate dependency |
| Commercial attribution | consented commercial presentation observations plus `/r/{slug}` retaining independent MarketActivation decision authority; one transaction records minimized detailed attribution, AnalyticsEvent projections and a success-only daily aggregate |
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

**DETECTED:** `ProgramEnrollment.completedAt` is the Programme completion
source for the observer and dashboards. The former
`vercel-product-analytics.ts`, Vercel Programme event taxonomy and
`analytics:programme` report are absent from current runtime/tooling and remain
historical evidence only.

**DETECTED:** email workers select only the current tagged environment and
perform a second canonical recipient/eligibility read immediately before the
provider boundary. Campaigns/messages are environment-tagged with composite
environment/idempotency uniqueness. Review records eligible, excluded and
suppressed/unsubscribed counts; queue transitions are conditional and audited.
Lifecycle selection excludes already-queued reminder identities so a full
early page cannot starve later candidates. Recipient rows remain idempotent by
campaign and user.

**DETECTED:** the Commercial dashboard reader already computes casino/offer
views, card views, view selections, review clicks, CTA clicks, detailed
outbound attempts/successes/blocks and CTR. All bounded funnel metrics are
rendered; the fixed view explicitly identifies detailed attribution and warns
that the separate success-only aggregate can overlap.

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

**DETECTED for the Core release:** successful full migration replay,
build/browser acceptance, Production preflight/postflight and live aggregate
sanity are linked from PR #269 and current records. **DETECTED for the Resend
release:** PRs #271/#273/#274 passed exact-head hosted CI. Worker, configuration,
valid delivery, signed/invalid/replay webhook outcomes, unsubscribe, separate
transactional delivery and fixed-filter broadcast safety pass all six
controlled Production cases. Post-test sanity records five delivered messages,
five distinct delivered provider events, four completed campaigns and zero
queued, sending, failed, duplicate, post-unsubscribe or non-fixture messages.
The operational procedure is
[Customer Data, Analytics & Lifecycle Core v1](../../06_Operations/Customer-Data-Analytics-Lifecycle-Core.md).

## External integration boundary

**DETECTED:** the direct-HTTPS Resend adapter has an eight-second timeout,
provider idempotency header and exact Production-only configuration contract.
The raw-body webhook verifier, memory-test provider and normalized delivered,
bounced, clicked, complained and suppressed outcomes are implemented. The
deployed activation calls a maximum 50-message batch only from the existing
exact-Bearer protected daily cron and then refreshes campaign states.

**DETECTED live provider evidence:** `b4gamble.com`, DKIM and SPF return-path
MX/TXT are verified and sending is enabled. Two existing keys are sending-only.
The canonical lifecycle webhook is enabled for the five required events; its
signing secret plus the approved sender/reply-to are present only in Vercel
Production and were not disclosed.

**DETECTED / ACTIVE:** Founder processor authority, provider configuration,
deployment and six of six controlled Production acceptance exist. Delivery is
exact `true`. Exact current deployment identity belongs in
`docs/CURRENT_STATE.md` and live release evidence rather than this architecture
baseline.

## Contradictions reconciled

- Older baseline claims that Vercel Analytics is the active candidate are
  stale for RFC-046; the current Core retires that transport in favor of the
  first-party, consented relational contract.
- Older claims that no receiving webhook or account/Programme email boundary
  exists are historical. A receiver, ledger and provider registration are
  live, and bounded accepted delivery is recorded.
- Older claims that Founder transfer approval is missing are superseded by the
  explicit 12 September 2026 decision. That decision is authority, not proof of
  live configuration or delivery.
- PRs #271/#273/#274 and the dated activation record are the authoritative
  release evidence for the current Production SHA and active delivery state.
- Older candidate claims that the dictionary has 19 events or migration 0038
  is unapplied are stale. The current closed dictionary has 22 events and all
  41 migrations are applied.
- The aggregate affiliate click report is not a second detailed-attribution
  total. `OutboundClick` is canonical detailed runtime attribution;
  `AffiliateOutboundClickDaily` is success-only aggregate accounting with
  unique historical coverage. Overlapping totals must not be added.

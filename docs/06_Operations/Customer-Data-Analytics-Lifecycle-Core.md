# Customer Data, Analytics & Lifecycle Core v1

**Authority:** [RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)<br>
**Runbook date:** 11 September 2026<br>
**Application:** B4GAMBLE / `sevenbet-next`<br>
**Production origin:** `https://b4gamble.com`<br>
**Migration:** `0037_customer_data_analytics_lifecycle_core`

## 1. Current release state

**DETECTED in the implementation candidate:** the relational models, additive
migration, customer/admin surfaces, closed analytics ingestion, fixed
dashboards, Programme observers, outbound attribution, consent history,
template/campaign queues, provider adapter, signed webhook, unsubscribe flow,
retention job, aggregate sanity command, unit/integration/browser acceptance
tests and DB-first release guard exist in the repository.

**NOT YET VERIFIED in Production:** migration 0037, application deployment,
runtime analytics collection, dashboards over Production observations, Resend
webhook registration, lifecycle sender configuration and live delivery.

**DELIVERY HOLD:** welcome, reminder, test and broadcast records may be queued,
but no Better Auth callback, public route or cron invokes the external email
processor. Do not claim that lifecycle email is operational. An explicitly
authorised follow-up must connect the bounded processor and verify the provider
before `LIFECYCLE_EMAIL_DELIVERY_ENABLED=true` is allowed.

## 2. Architecture and authority

```text
Better Auth User ─────────────── registered identity authority
ProgramEnrollment / mission ─── Programme progress authority
RFC-042 /r/{slug} ───────────── legal and commercial routing authority
CustomerEmailPreference ─────── final email eligibility authority
                │
                └── observations → sessions/events/clicks/messages → fixed dashboards
```

Analytics never authenticates a person, completes a Mission, changes XP,
selects a casino or permits a redirect. Email state never grants account or
Programme access. A failure to record an observation is bounded and logged; it
does not reverse the product authority that preceded it.

Runtime layering is route/component → service module → Prisma singleton.
Route handlers and React components do not import Prisma. The new system stays
inside the existing Next.js App Router, Better Auth, Prisma/PostgreSQL, Vercel
Cron and AdminShell architecture.

## 3. Data model

| Store | Purpose and key constraints |
| --- | --- |
| `User` additions | Account state, locale, lawful signup GEO/source/UTM/referrer and last-seen metadata; functional unique index on trimmed lower-case email |
| `AnalyticsSession` | Consented anonymous/session/user relationship, 30-minute expiry, environment/traffic classification and bounded acquisition context |
| `AnalyticsEvent` | Closed enum, schema version 1, unique dedupe key, explicit columns only; no arbitrary JSON |
| `OutboundClick` | One final server-observed `SUCCEEDED` or `BLOCKED` outcome; state/time checks; no destination or tracking URL |
| `CustomerEmailPreference` | One current per-user marketing/unsubscribe/suppression projection with state checks |
| `ConsentEvent` | Append-only analytics and email grant/withdrawal/suppression history |
| `EmailTemplate` | Versioned key/type/locale copy; one active version per key and locale |
| `EmailCampaign` | Fixed filters, review evidence, idempotency key and aggregate execution counts |
| `EmailMessage` | One recipient/purpose/template version, durable idempotency, bounded attempts and inspectable outcome; provider ID pairs, accepted-state timestamps and test-purpose state are database-constrained; `UNKNOWN` preserves ambiguity after the provider idempotency horizon rather than risking a duplicate |
| `EmailProviderEvent` | Minimal normalized outcome keyed by unique provider event ID |
| `EmailUnsubscribeToken` | Message/user binding and SHA-256 token hash; raw token is not stored |
| `AnalyticsRateLimitBucket` | Atomic, keyed minute window; expired rows are purged |

User-linked email/consent state is deleted with the customer when the existing
privacy workflow authorises erasure. Analytics user links use `SET NULL`, while
the data-subject workflow also removes associated anonymous/session history so
new pseudonymous tables cannot silently defeat deletion.

## 4. Identity and sessionization

The hierarchy is `anonymous_id → session_id → User.id when authenticated`.
Email is never an analytics identifier.

- The browser receives no analytics ID until an affirmative analytics choice.
- Consent, anonymous and session cookies are HMAC-signed with at least 32
  characters of configured secret material. Anonymous/session
  cookies are HTTP-only; the browser-readable consent cookie is only a UX hint.
- The server verifies every signature before accepting an event.
- The first accepted event creates the session row. Accepted activity extends
  its expiry to 30 minutes. An expired, environment-mismatched or
  different-account session rotates; a signed-out browser cannot resume a
  session already owned by an authenticated user.
- A later authenticated event can associate prior rows for the same consented
  anonymous ID to the canonical user without creating duplicate events.
- UTC is the storage/report boundary. Selected dashboard dates are inclusive
  UTC calendar days and queries use an exclusive next-day upper bound.
- `LOCAL`, `PREVIEW`, `TEST`, `BOT` and `INTERNAL` observations remain tagged
  and are excluded from Founder metrics.

## 5. Canonical event dictionary

| Area | Events | Authority |
| --- | --- | --- |
| Acquisition/site | `session_started`, `page_viewed`, `signup_completed`, `login_completed` | Session start and auth outcomes are server-observed; page view is consented client observation |
| Programme | `programme_started`, `programme_step_viewed`, `programme_step_completed`, `programme_completed` | Starts/completions are derived from canonical persisted Programme state; view is consented client observation |
| Commercial | `casino_viewed`, `offer_viewed`, `commercial_cta_clicked`, `outbound_redirect_attempted`, `outbound_redirect_succeeded`, `outbound_redirect_blocked` | Redirect events are server-authoritative observations after RFC-042 |
| Email | `email_sent`, `email_delivered`, `email_bounced`, `email_clicked`, `email_unsubscribed` | Provider acceptance, verified webhook or local unsubscribe |

Client ingestion accepts at most 20 events and 32 KiB per request. The Zod
schema is strict, paths are query/fragment-free, timestamps must be within the
bounded acceptance window and event IDs/dedupe keys are unique. Invalid items
are reported independently with HTTP 207 when valid siblings are accepted.
Exact Origin matching, or an explicit `Sec-Fetch-Site: same-origin` fallback,
and database-backed rate-limit checks apply before persistence. Missing or
ambiguous same-origin evidence fails closed.

`casino_viewed` means a consented rendered casino-review page with its
canonical casino ID. `offer_viewed` means a published offer card or review
offer block actually intersected the viewport. A stable bonus/card key is used
only in session storage to prevent duplicate browser impressions; it is not
sent as an affiliate-offer foreign key. The event stores the canonical casino
ID and stores an affiliate-offer ID only when that authority is genuinely
available. Demo fixtures do not emit offer impressions.

Never add email, name, raw IP, user agent, password, auth/reset token, affiliate
destination/token, Programme answer, transcript, Help use or arbitrary object
properties to this dictionary.

## 6. Metric definitions and dashboards

The code definitions in `lib/analytics/metrics.ts` are canonical.

- Registered user: canonical `User` row existing before report end.
- New registration: `User.createdAt` inside the selected UTC range.
- Active user: distinct authenticated user with a Production human event.
- Programme start: canonical enrollment started in the range.
- Programme completion: that start cohort has `completedAt` before report end.
- Programme completion rate: completions divided by starts in the same cohort.
- Outbound attempt/success/block: explicit final `OutboundClick` state; an
  attempt is never called a success.
- Unique outbound actor: authenticated user, otherwise analytics session.
- CTR: commercial CTA clicks divided by offer views. Both sides are consented
  Production human events in the same selected UTC range. Redirect attempts,
  successes and blocks remain separate server-authoritative measures.
- Email sent: provider accepted the message. Delivery/bounce/click are unique
  verified provider events. Delivery rate is delivered/sent; bounce rate is
  bounced/sent; click rate is clicked/delivered.

All fixed dashboards select `PRODUCTION` + `HUMAN`; Preview, local, CI, bot,
internal and explicit test-message observations do not enter Founder metrics.
Provider complaints suppress all email but remain distinct from a customer's
unsubscribe and therefore are not counted as unsubscribe events.

`/admin/analytics` has fixed Founder, Programme, Commercial and Email views for
7, 30, 90 or a bounded custom range. Zero and failure states are displayed.
Open rate is intentionally absent.

## 7. Commercial click attribution

`/r/{slug}` generates one UUID at request entry, executes the existing legal,
GEO, commercial, route-health and safe-response chain, then schedules the
observation. `BLOCKED` is recorded for disabled, malformed, unavailable,
regulatory or unsafe results; only a validated 302 is `SUCCEEDED`.

The observer may store safe canonical internal IDs, coarse country, locale,
page path, acquisition source and placement. Optional identity/source
enrichment requires analytics consent. It never stores or logs `destination`,
`trackingUrl`, credentials or affiliate query tokens. Failure returns a fixed
category and does not change the already-safe redirect decision.

Governed CTA links append only the closed source/placement label (for example,
`CTA_CASINO_OFFER_BLOCK`) to the internal `/r/{slug}` request. The redirect
service ignores it for routing; the observer validates and records it only
when analytics consent permits enrichment.

## 8. Privacy, PII and Programme purpose boundary

- Customer email is available only in Customer/email stores and authorised
  staff UI. It is not copied to analytics.
- IP is used transiently for request/rate/GEO handling and rate keys are HMACs;
  raw IP is not persisted by the Core.
- Analytics consent and email marketing consent are separate.
- Programme narrative/free text, voice/audio, Starting Point, Help, pause,
  vulnerability and boundary content are absent from events and segments.
- Programme state may support Programme UX, reminders and aggregate product
  analysis. It must never rank, time or personalise gambling promotion.
- No session replay, advertising pixel, fingerprinting or cross-site tracker is
  introduced.
- Default retention is 395 days for individual analytics/session/click detail
  and 730 days for terminal email-message history. Each collection is purged in
  a 5,000-row bounded batch.

## 9. Email architecture and eligibility

The provider port has disabled, Resend and memory-test implementations. Resend
uses direct HTTPS, an eight-second timeout and provider idempotency header; the
database key remains the durable authority after the provider's 24-hour
window. Provider idempotency values contain an opaque SHA-256 subject digest,
not a customer ID. Real delivery is possible only in Vercel Production with the exact
flag and valid sender/reply-to/site configuration, but no live invocation is
wired in this candidate.

Final eligibility is read after a worker claims a message and then read again
immediately before synchronous template rendering/provider invocation. The
second read also refreshes the canonical recipient address, closing the normal
application race between queue/claim and an unsubscribe, suppression, account
change or address change:

| Purpose | Marketing grant required | Verified email required | Suppression behavior |
| --- | --- | --- | --- |
| Verification/reset/security | No | No | `ALL` blocks |
| Welcome account onboarding | No | No | `ALL` blocks |
| Programme reminder | Yes | Yes | `MARKETING` or `ALL` blocks |
| Manual broadcast | Yes | Yes | `MARKETING` or `ALL` blocks |
| Staff test | No | Staff account state still applies | `ALL` blocks; `[TEST]` subject and no campaign |

Account suspension and invalid recipient format block every purpose. Provider
bounce/complaint sets `ALL`; an unsubscribe sets `MARKETING`. A later explicit
preference can lift only the user's voluntary unsubscribe suppression, never a
provider or all-email suppression.

## 10. Templates, lifecycle and campaigns

Approved English versions are seeded for email verification, password reset,
welcome, Programme reminder and marketing broadcast. Unsupported locales fall
back to English; do not invent legal/commercial translations. Admin editing
creates a new sanitized version. Allowed HTML is a small semantic subset and
only approved full-URL placeholders may be used in links.

The optional signup marketing-consent sentence and its fail-closed save error
also remain in explicit English when no approved localized compliance copy
exists. This is a visible fallback, not a machine-invented translation.

Signup observation queues one welcome message. The daily lifecycle cron queues
one Programme reminder for a verified, opted-in, unsuppressed user whose
incomplete enrollment and last activity exceed the configured 7- or 30-day
threshold. Stable environment-scoped message keys make cron replay a no-op;
the scan excludes identities already holding the same reminder intent so one
full early page cannot starve later eligible identities.

Manual campaigns use only locale, country, new-user, Programme
started/completed/not-completed and 7-/30-day inactivity filters. Draft must be
reviewed with current eligible/excluded counts and separate
suppressed/unsubscribed exclusions before queueing. Campaigns and messages are
tagged with the current environment and use environment-scoped idempotency.
Queue execution uses 500-row cursor batches, one unique message per
campaign/user and current canonical recipient data. Campaign
create/review/queue and template
version/activation/test-queue actions write relational staff audit records;
template body content and customer addresses are not copied into those audit
records. Final send rechecks current consent.

## 11. Unsubscribe and webhooks

The link contains only a 43-character message-bound HMAC token. The database
stores SHA-256, not the token, user ID or email in the URL. POST requires exact
same-origin evidence and is bounded and idempotent. Consumption records a
consent withdrawal, marks the message and immediately changes current
suppression. A replay after a later re-opt-in reapplies suppression, so an old
valid unsubscribe link remains authoritative.

If the unsubscribe signing secret changes while an already-queued message has
a stored token hash, processing stops that message as `UNKNOWN` with
`UNSUBSCRIBE_TOKEN_MISMATCH`. It never overwrites the hash behind a link that
may already exist in an inbox.

`POST /api/email/webhooks/resend` reads at most 64 KiB of raw request text and
passes that exact body plus `svix-id`, `svix-timestamp` and `svix-signature` to
Svix verification. Only then is a delivered/bounced/clicked/complained event
normalized. Provider event and provider message identifiers must match the
closed bounded identifier grammar. Provider event ID is unique; replay returns
`duplicate`. Payloads, clicked URLs and recipient addresses are not retained or
logged. Complaint events create provider suppression, not a false customer
unsubscribe timestamp or `email_unsubscribed` event.

## 12. Access control

| Area | Permission / default roles |
| --- | --- |
| Customers and customer detail | `user.view`: Support, Admin, Super Admin |
| Fixed dashboards | `analytics.view`: Analyst, Admin, Super Admin |
| Campaigns/email history | `email.manage`: Admin, Super Admin |
| Template versions/test queue | `template.manage`: Admin, Super Admin |

Every server page checks its area before querying. Every admin API checks a
permission independently; POST actions also require same-origin and bounded
JSON. Navigation filtering is convenience only. Customer IDs do not bypass
the page-level authorization gate.

## 13. Environment variables

| Name | Treatment |
| --- | --- |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Public exact `true` client switch; default false; server consent still required |
| `ANALYTICS_SIGNING_SECRET` | Server-only HMAC secret; falls back to Better Auth secret; use a distinct Production value |
| `ANALYTICS_INTERNAL_TRAFFIC_TOKEN` | Server-held exact internal/test marker |
| `ANALYTICS_RETENTION_DAYS` | 90–730; invalid value falls back to 395 |
| `EMAIL_HISTORY_RETENTION_DAYS` | 365–2555; invalid value falls back to 730 |
| `PROGRAMME_REMINDER_INACTIVITY_DAYS` | Exact supported cadence is 7 or 30; otherwise 7 |
| `CRON_SECRET` | Exact Bearer secret for lifecycle/retention and existing protected cron routes |
| `LIFECYCLE_EMAIL_DELIVERY_ENABLED` | Exact Production-only switch; keep false under the current hold |
| `LIFECYCLE_EMAIL_FROM`, `LIFECYCLE_EMAIL_REPLY_TO` | Valid, newline-free provider identities |
| `RESEND_API_KEY` | Server-only provider credential; never log or expose |
| `RESEND_WEBHOOK_SECRET` | Required server-only Svix verification secret; delivery stays disabled without it |

Local/CI uses synthetic data and the memory provider. Preview must keep real
lifecycle delivery off. Webhooks ignore messages not tagged `PRODUCTION`.

## 14. Observability

Logs use fixed categories and aggregate counts only:

- analytics validation/timestamp/database/rate-limit failures;
- outbound attribution database failure and final state;
- email provider failure category and purpose, never recipient;
- webhook configuration/verification/processing failure;
- lifecycle queue/retention counts, limit flag and duration.

Dashboard zeroes are not hidden. Failed, suppressed, stale-sending and bounded
retry states remain inspectable in tables. Bounce spikes and sudden outbound
drop are reviewed through fixed Email/Commercial ranges; no new alerting
platform is introduced.

## 15. Local and CI verification

Use Node 24.x and a disposable PostgreSQL database only.

```bash
npm ci
npm run typecheck
npx prisma validate
npm run customer-data-core:test
npm run ci:migrations
npm run customer-data-core:postgres-test
npm run ci:browser
```

The PostgreSQL suite refuses a non-local/non-CI database name. It uses only
`.invalid` recipients and an in-process fake Resend provider; automated tests
never make a provider network call or send a real email. CI migration replay
must run before database/browser tests.

## 16. Migration and deployment

1. Pull a redacted Production environment inventory; never print values.
2. Run `prisma/preflight/0037_customer_data_analytics_lifecycle_core.sql`
   read-only. Stop on normalized-email duplicates. Record User row/table size
   before choosing the index maintenance window.
3. Confirm all prior migrations through 0036 and no unresolved migration row.
4. Run disposable full-history migration replay and the PostgreSQL acceptance.
5. Apply migration 0037 DB-first with `prisma migrate deploy`. Never use
   `db push`, `migrate dev`, `migrate reset`, destructive repair or fake seed.
6. Run the aggregate sanity command and schema invariants.
7. Deploy the backwards-compatible application with analytics client and
   lifecycle delivery disabled.
8. Verify public/auth/Programme/redirect/admin behavior, then enable consented
   analytics only if the privacy/runtime configuration is ready.
9. Keep email delivery disabled until the separate hold is cleared.

The Production build preflight refuses to build this application revision
until migration 0037 is completed and its checksum/tables/indexes/uniqueness
invariants pass.

## 17. Production smoke and data sanity

Run:

```bash
npm run customer-data-core:sanity
```

Output is aggregate JSON only. A nonzero integrity-defect total exits 2. It
reports canonical users; normalized duplicates; event counts by exact type,
environment and traffic kind; missing client identity; click attempt/result
orphans; impossible states; cross-session identity/environment mismatches;
template/type/provider-state defects; provider replay/message-ID defects;
incorrect marketing eligibility; lifecycle duplicates; and non-Production
provider outcomes. It never prints email or an individual identifier.

Then verify homepage, Programme, auth, representative casino/offer pages,
permitted and blocked `/r` behavior, analytics consent/dedupe/dashboard,
unauthorized admin denial, authorized desktop/mobile admin, unsubscribe, forged
webhook rejection, no 5xx regression and no partner-token exposure. A live
email check is forbidden until the delivery hold is cleared.

## 18. Rollback, recovery and external dependencies

Immediate collection rollback is
`NEXT_PUBLIC_ANALYTICS_ENABLED=false` plus redeploy. Email rollback is
`LIFECYCLE_EMAIL_DELIVERY_ENABLED=false`; under the current release it must
already be false. Application rollback deploys the last known-good commit.
Migration 0037 remains because it is additive and older code ignores the new
columns/tables. Do not down-migrate or drop data. Queue/history rows remain for
forensic inspection and later controlled recovery.

Known external dependencies are Vercel, Prisma Postgres, Better Auth and—only
after explicit activation—Resend. Production completion additionally requires
live database preflight/migration evidence, Vercel deployment evidence,
provider sender/domain state, webhook registration/signature proof and one
safe test delivery. Repository implementation or historical Contact-domain
verification is not a substitute for those checks.

# Product Analytics Operations

## Current authority

This path is governed by [RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)
and the complete [Customer Data, Analytics & Lifecycle Core runbook](Customer-Data-Analytics-Lifecycle-Core.md).
It supersedes the old RFC-026 Vercel custom-event operating procedure.

**DETECTED in current canonical main and Production:** B4GAMBLE uses a first-party,
PostgreSQL-backed, closed 22-event dictionary. The three Commercial UX
observations added by applied migration 0038 remain bounded to selected view, card
impression and casino-review click; they add no arbitrary payload or new
identity. The runtime does not import or
mount `@vercel/analytics`, and there is no Vercel Web Analytics plan dependency
for Product Core events.

**VERIFIED in Production:** migrations 0037 and 0038, the exact analytics flag,
consented event ingestion, retention and aggregate Core sanity. A legitimate
zero for a bounded event remains truthful; it is not a release defect.

The former `vercel-product-analytics.ts`, Vercel Programme event taxonomy and
`analytics:programme` aggregate report are retired. Programme observation and
the fixed dashboard use canonical persisted Programme state.

## Runtime controls

The public collection switch is:

```text
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Only exact lower-case `true` includes browser emission. Missing, empty,
`false`, `TRUE`, `1` and every other value are off. This flag is necessary but
not sufficient: the browser must also hold an affirmative signed analytics
choice and the ingestion route verifies it again.

Server controls are:

- `ANALYTICS_SIGNING_SECRET`: HMAC signing/rate key; server-only;
- `ANALYTICS_INTERNAL_TRAFFIC_TOKEN`: exact internal/test marker; server-only;
- `ANALYTICS_RETENTION_DAYS`: bounded 90–730, default 395; and
- `CRON_SECRET`: protects the bounded retention scheduler.

## Privacy contract

Analytics consent is separate from authentication, necessary Programme
storage, language preference and email marketing permission. Declining sets a
signed denial preference and clears anonymous/session analytics identifiers.
Withdrawing does not affect account or Programme access.

No event may contain email, name, IP, user agent, password, auth/reset token,
affiliate destination/token, Programme answer/transcript/audio, Help use,
arbitrary form input or arbitrary JSON properties. Local, Preview, test,
internal and obvious bot traffic is tagged and excluded from Production human
metrics.

## Ingestion and failure behavior

`POST /api/analytics/events` requires same-origin, signed consent, a body no
larger than 32 KiB, 1–20 strictly validated schema-v1 events and the atomic
rate limit. Event IDs and server dedupe keys are unique. A mixed batch returns
per-item rejection without discarding valid siblings.

The browser sink is asynchronous and catches failures. Auth, Programme and
redirect observers use best-effort boundaries after their canonical product
decision. An analytics database failure must not break rendering, signup,
login, Programme persistence or RFC-042 routing.

## Reporting

Use `/admin/analytics` for the fixed Founder, Programme, Commercial and Email
dashboards. Definitions and denominators are locked in
`lib/analytics/metrics.ts`; the runbook reproduces them. There is no generic
query builder, arbitrary BI endpoint or Vercel aggregate-report dependency.

The Commercial view uses detailed `OutboundClick` attribution and consented
funnel events. `GET /api/admin/affiliate/outbound-clicks` is a separate
success-only, aggregate-only accounting report with unique historical
coverage. New successful traffic can overlap; never add detailed and aggregate
totals.

Run the aggregate integrity check from an authorised operator process:

```bash
npm run customer-data-core:sanity
```

It prints aggregate counts only and exits nonzero for integrity defects.

## Activation and rollback

Migrations 0037 and 0038 are already applied. Do not re-run or roll them back.

1. Deploy with the public flag false when a collection rollback is required.
2. Verify consent grant/decline/withdrawal, cookie signing, event dedupe,
   environment tags, dashboard authorization and data sanity.
3. Set the exact flag true only in the authorised environment and redeploy.
4. Verify normal real traffic without generating synthetic Production events,
   and confirm Preview/test/bot/internal rows
   remain excluded.

Rollback sets the flag false and redeploys. Existing observations remain under
the documented retention/deletion rules; rollback never changes Programme or
commercial authority and never drops migrations 0037 or 0038.

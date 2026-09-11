# Product Analytics Operations

## Current authority

This path is governed by [RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)
and the complete [Customer Data, Analytics & Lifecycle Core runbook](Customer-Data-Analytics-Lifecycle-Core.md).
It supersedes the old RFC-026 Vercel custom-event operating procedure.

**DETECTED in the current candidate:** B4GAMBLE uses a first-party,
PostgreSQL-backed, closed 19-event dictionary. The runtime does not import or
mount `@vercel/analytics`, and there is no Vercel Web Analytics plan dependency
for Product Core events.

**NOT YET VERIFIED in Production:** migration 0037, the exact analytics flag,
event ingestion, retention and fixed dashboards. Do not treat repository code
or an old Vercel Analytics setting as activation evidence.

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

Run the aggregate integrity check from an authorised operator process:

```bash
npm run customer-data-core:sanity
```

It prints aggregate counts only and exits nonzero for integrity defects.

## Activation and rollback

1. Complete migration 0037 DB-first and pass its read-only preflight.
2. Deploy with the public flag false.
3. Verify consent grant/decline/withdrawal, cookie signing, event dedupe,
   environment tags, dashboard authorization and data sanity.
4. Set the exact flag true only in the authorised environment and redeploy.
5. Verify one normal consented flow and confirm Preview/test/bot/internal rows
   remain excluded.

Rollback sets the flag false and redeploys. Existing observations remain under
the documented retention/deletion rules; rollback never changes Programme or
commercial authority and never drops migration 0037.

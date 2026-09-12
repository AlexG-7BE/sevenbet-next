# Resend Production Activation — 12 September 2026

**Authority:** explicit Founder instruction `CONTINUE B4GAMBLE FOUNDER OFFICE
— RESEND PRODUCTION ACTIVATION` and
[RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)<br>
**Scope:** bounded Production activation and verification only<br>
**Production origin:** `https://b4gamble.com`<br>
**State:** `IN PROGRESS — DELIVERY DISABLED`

## Founder decision

The Founder approves Resend as B4GAMBLE's processor for minimum-necessary
account/transactional messages, welcome messages, consented Programme
reminders and consented broadcast/marketing messages. This removes the former
missing-Founder-transfer-approval hold. It does not by itself prove every
legal requirement, provider setting, delivery or operational control.

## Preserved Production baseline

The five previously accepted areas are not reopened: Product/public
experience, Programme, canonical partner routing, security/public privacy
controls, and Customer/Analytics Core. PR #269 is live at
`e4268c9031cdf92704c529225ef71edcb16d20a5` in Ready deployment
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw`; all 37 migrations including 0037 are
applied. Analytics is enabled. Lifecycle delivery is disabled. Aggregate
sanity recorded three canonical users, zero normalized-email duplicates, five
active English templates and zero campaigns, messages or provider events.

## Live provider and configuration audit

| Check | Evidence at start | State |
| --- | --- | --- |
| Resend account access | Authenticated Founder account inspected | `PASS` |
| Existing credentials | Two credentials; sending-only permission; last used 30 days ago | `PASS FOR SEND / NOT WEBHOOK ADMIN` |
| Sending domain | `b4gamble.com`, `us-east-1`, sending enabled | `PASS` |
| DKIM | Provider dashboard reports verified | `PASS` |
| SPF return path | Provider dashboard reports MX and TXT verified | `PASS` |
| Webhook endpoint | No webhook registered | `PENDING` |
| Required events | Provider offers delivered, bounced, clicked, complained and suppressed | `AVAILABLE / NOT SUBSCRIBED` |
| Provider unsubscribe event | Not supported in the Resend event selector; local signed unsubscribe remains authoritative | `NOT APPLICABLE` |
| Production provider credential | `RESEND_API_KEY` exists in Vercel Production; protected value not disclosed | `PENDING LIVE SEND PROOF` |
| Production sender/reply-to/webhook secret | Absent at start | `PENDING` |
| Delivery switch | Present and exactly disabled at start | `PASS SAFE DEFAULT` |
| Click tracking | Provider metrics/tracking is off | `KNOWN LIMITATION` |

No secret value, full or partial credential, DNS key, recipient address or
individual customer identifier is recorded in this document.

## Activation implementation

The isolated `codex/resend-production-activation` candidate:

- invokes a maximum 50-message delivery batch only from the existing
  exact-Bearer protected daily lifecycle cron;
- leaves queued intent untouched when delivery is disabled or Production
  configuration is incomplete, so staging/rollback cannot consume retries;
- refreshes campaign states after delivery;
- keeps final consent, account, verification, address and suppression checks
  immediately before the provider call;
- retains `[TEST]` in the actual provider subject after final rendering;
- normalizes `email.suppressed` as a replay-safe provider event with a distinct
  `PROVIDER_SUPPRESSION` reason; and
- logs aggregate delivery/campaign counts without recipient PII.

The provider request contains only the recipient email, legitimately needed
name rendered into approved copy, subject/body, reply-to and an opaque
idempotency key. It does not transmit Programme answers, vulnerability or Help
data, analytics identifiers, affiliate data, browsing history, raw IP,
password/auth/reset tokens or arbitrary metadata.

## Webhook activation contract

Register exactly `https://b4gamble.com/api/email/webhooks/resend` and subscribe
to:

- `email.delivered`
- `email.bounced`
- `email.clicked`
- `email.complained`
- `email.suppressed`

The endpoint verifies the exact raw body with `svix-id`, `svix-timestamp` and
`svix-signature` before normalization. The unique provider event ID is the
replay key. Recipient addresses, clicked URLs and raw payloads are neither
stored in the normalized provider ledger nor logged.

## Controlled Production acceptance

| # | Acceptance | State |
| ---: | --- | --- |
| 1 | Welcome delivery to a provider-safe non-customer recipient | `PENDING` |
| 2 | Programme reminder consent/suppression/final-check and duplicate-job exactly-once | `PENDING` |
| 3 | Marketing unsubscribe audit/suppression and second-send pre-provider block | `PENDING` |
| 4 | Transactional rules remain separate after marketing unsubscribe | `PENDING` |
| 5 | Webhook invalid/valid/replay/cross-customer/secret controls | `PENDING` |
| 6 | Bounded broadcast preview/exclusions/idempotency/retry/history | `PENDING` |

Overall activation remains `HOLD` until all six rows are evidenced `PASS`.

## Rollback

Set `LIFECYCLE_EMAIL_DELIVERY_ENABLED=false` and redeploy. Retain the additive
schema and queue/history for inspection; do not down-migrate or delete audit
evidence. The pre-activation application rollback deployment is
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw`.

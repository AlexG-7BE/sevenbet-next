# Resend Production Activation — 12 September 2026

**Authority:** explicit Founder instruction `CONTINUE B4GAMBLE FOUNDER OFFICE
— RESEND PRODUCTION ACTIVATION` and
[RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)<br>
**Scope:** bounded Production activation and verification only<br>
**Production origin:** `https://b4gamble.com`<br>
**State:** `GO — SIX OF SIX ACCEPTED; DELIVERY ENABLED`

## Founder decision

The Founder approves Resend as B4GAMBLE's processor for minimum-necessary
account/transactional messages, welcome messages, consented Programme
reminders and consented broadcast/marketing messages. This removes the former
missing-Founder-transfer-approval hold. It does not by itself prove every
legal requirement, provider setting, delivery or operational control.

## Preserved Production baseline

The five previously accepted areas are not reopened: Product/public
experience, Programme, canonical partner routing, security/public privacy
controls, and Customer/Analytics Core. PR #269 established that baseline at
`e4268c9031cdf92704c529225ef71edcb16d20a5` in Ready deployment
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw`; all 37 migrations including 0037 are
applied. Analytics is enabled. Aggregate
sanity recorded three canonical users, zero normalized-email duplicates, five
active English templates and zero campaigns, messages or provider events. PR
#271 subsequently deployed the bounded Resend activation code without
reopening those accepted areas.

## Live provider and configuration audit

| Check | Current evidence | State |
| --- | --- | --- |
| Resend account access | Authenticated Founder account inspected | `PASS` |
| Existing credentials | Two credentials with sending-only permission; bounded acceptance sends succeeded | `PASS FOR SEND / NOT WEBHOOK ADMIN` |
| Sending domain | `b4gamble.com`, `us-east-1`, sending enabled | `PASS` |
| DKIM | Provider dashboard reports verified | `PASS` |
| SPF return path | Provider dashboard reports MX and TXT verified | `PASS` |
| Webhook endpoint | Canonical endpoint registered and enabled | `PASS` |
| Required events | Exactly delivered, bounced, clicked, complained and suppressed subscribed | `PASS` |
| Provider unsubscribe event | Not supported in the Resend event selector; local signed unsubscribe remains authoritative | `NOT APPLICABLE` |
| Production provider credential | `RESEND_API_KEY` exists in Vercel Production; protected value not disclosed; bounded live sends accepted | `PASS` |
| Production sender/reply-to/webhook secret | Approved sender/reply-to and protected signing secret stored in Vercel Production | `PASS` |
| Delivery switch | Present, enabled only after fail-closed queue proof and retained through the accepted deployment | `PASS / ENABLED` |
| Click tracking | Provider metrics/tracking is off | `KNOWN LIMITATION` |

No secret value, full or partial credential, DNS key, recipient address or
individual customer identifier is recorded in this document.

## Activation implementation

PR #271, merged as `dea4476a5681129ad67ce0d8cbb1d410e3b4ed10`:

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

PR #273, merged as `cd4f2dee23f4d7f42d18725ac4b24366aaf5780a`,
corrected two defects found by controlled acceptance: the exact protected cron
path is exempt from canonical-host redirect middleware, and the standard
password-reset request invokes the existing transactional email transport. PR
#274, merged as `22cf696b31b6adc3e456508b1a140044a5061698`,
constructs the unsubscribe form `303` response with its no-store headers in a
single mutable response after Production exposed the former immutable-header
exception. Both fixes have regression coverage and passed all exact-head
quality, database, build/browser and Vercel gates.

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

## Production execution evidence

- Production re-verification and a current B4GAMBLE staff session allowed two
  provider-safe non-customer fixtures to be created with exact
  `INTERNAL_ACCEPTANCE` provenance;
- delivery-disabled worker runs queued the single eligible reminder exactly
  once and consumed no attempt or provider ID; the repeat run was a no-op;
- after configuration verification and switch enablement, one welcome and one
  Programme reminder were accepted and reported delivered by Resend; a repeat
  worker run selected zero;
- one fixed-filter campaign reviewed one eligible, zero excluded and zero
  suppressed recipients, queued once and delivered once. The signed
  unsubscribe persisted withdrawal, consumed its token and made an identical
  second campaign review zero eligible, one excluded/suppressed and zero
  queued;
- the normal password-reset endpoint returned its generic `200` response and
  delivered a transactional message after marketing withdrawal;
- unsigned and forged webhook probes returned `401 INVALID_SIGNATURE`;
  authentic events returned `200`, an authentic replay added no row, and a
  validly signed unknown-provider-message event returned `202 ignored` without
  creating a cross-customer message or event;
- the first unsubscribe transaction exposed a response-only defect: state was
  committed, then mutation of `Response.redirect()` headers threw. PR #274
  fixed that defect. A fresh bounded campaign then delivered once, its signed
  unsubscribe returned `303`, rendered `You are unsubscribed.`, persisted a
  second withdrawal/token consumption, and another identical campaign again
  queued zero recipients;
- the post-hotfix worker log is `200` with one selected, one sent, zero
  suppressed/failed and one campaign refreshed; the unsubscribe log is `303`
  with zero warning, error or fatal records for the filtered window; and
- Ready canonical deployment `5i5N2H2xWqMySWysU78EdinEwK2v` serves merge
  `22cf696b31b6adc3e456508b1a140044a5061698`. The documented nine-route
  read-only Production smoke passed.

No real customer was contacted. Provider-safe addresses, opaque tokens,
provider IDs, webhook signatures and secret values are intentionally omitted.

## Controlled Production acceptance

| # | Acceptance | State |
| ---: | --- | --- |
| 1 | Welcome delivery to a provider-safe non-customer recipient | `PASS` |
| 2 | Programme reminder consent/suppression/final-check and duplicate-job exactly-once | `PASS` |
| 3 | Marketing unsubscribe audit/suppression and second-send pre-provider block | `PASS` |
| 4 | Transactional rules remain separate after marketing unsubscribe | `PASS` |
| 5 | Webhook invalid/valid/replay/cross-customer/secret controls | `PASS` |
| 6 | Bounded broadcast preview/exclusions/idempotency/retry/history | `PASS` |

Overall activation is `GO`. `LIFECYCLE_EMAIL_DELIVERY_ENABLED=true` is the
accepted Production state. Any eligibility, signature, duplicate-send,
privacy, provider-state or material log regression returns the activation to
`HOLD` and requires the rollback below.

## Post-test data sanity

| Aggregate | Result |
| --- | ---: |
| Canonical users / marked acceptance fixtures | 5 / 2 |
| Active templates | 5 |
| Production messages / delivered | 5 / 5 |
| Welcome / reminder / marketing / password reset | 1 / 1 / 2 / 1 |
| Provider events / distinct delivered events | 5 / 5 |
| Completed campaigns | 4 |
| Consumed unsubscribe tokens | 2 |
| Queued / sending / failed-or-unknown | 0 / 0 / 0 |
| Duplicate provider IDs / message keys / lifecycle sends | 0 / 0 / 0 |
| Marketing after current withdrawal / non-fixture messages | 0 / 0 |

The active fixture preference is marketing-disabled, `MARKETING` suppressed
and unsubscribed. The two controlled fixtures are retained as explicitly
marked audit evidence; no silent destructive cleanup was performed.

## Rollback

Set `LIFECYCLE_EMAIL_DELIVERY_ENABLED=false` and redeploy. Retain the additive
schema and queue/history for inspection; do not down-migrate or delete audit
evidence. The pre-activation application rollback deployment is
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw`.

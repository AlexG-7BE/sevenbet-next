# Resend Production Activation — 12 September 2026

**Authority:** explicit Founder instruction `CONTINUE B4GAMBLE FOUNDER OFFICE
— RESEND PRODUCTION ACTIVATION` and
[RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)<br>
**Scope:** bounded Production activation and verification only<br>
**Production origin:** `https://b4gamble.com`<br>
**State:** `HOLD — PROVIDER AND CODE READY; DELIVERY DISABLED`

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
| Existing credentials | Two credentials; sending-only permission; last used 30 days ago | `PASS FOR SEND / NOT WEBHOOK ADMIN` |
| Sending domain | `b4gamble.com`, `us-east-1`, sending enabled | `PASS` |
| DKIM | Provider dashboard reports verified | `PASS` |
| SPF return path | Provider dashboard reports MX and TXT verified | `PASS` |
| Webhook endpoint | Canonical endpoint registered and enabled | `PASS` |
| Required events | Exactly delivered, bounced, clicked, complained and suppressed subscribed | `PASS` |
| Provider unsubscribe event | Not supported in the Resend event selector; local signed unsubscribe remains authoritative | `NOT APPLICABLE` |
| Production provider credential | `RESEND_API_KEY` exists in Vercel Production; protected value not disclosed | `CONFIGURED / LIVE SEND NOT PROVEN` |
| Production sender/reply-to/webhook secret | Approved sender/reply-to and protected signing secret stored in Vercel Production | `PASS` |
| Delivery switch | Present and restored to exact `false` after incomplete acceptance | `PASS FAIL-CLOSED HOLD` |
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

- all exact-head GitHub checks passed before normal merge: Agent Core,
  Quality, Database/Migration, Build/Browser and Vercel Preview;
- Ready Production deployment `dpl_8txeXABXbXkD9KCCeKFj4a3wnQMD` proved the
  merged source and canonical-domain assignment;
- the Node.js 24 Production smoke passed all nine read-only routes;
- an unsigned synthetic webhook request returned `401 INVALID_SIGNATURE` and
  the aggregate Vercel log recorded the expected 401;
- Vercel's inspected 30-minute aggregate showed zero warning, error or fatal
  console records;
- Resend still showed zero sent emails and zero webhook events; no real
  recipient was contacted; and
- a direct account-creation request without current access authority returned
  the expected 403. No account, consent or email fixture was created.

The current Production database editor requires interactive account
re-verification by authenticator code or passkey. No authenticated B4GAMBLE
staff session was available: `/admin/email` correctly redirected to the Admin
login. Creating a substitute account by fabricating adult, Terms or privacy
affirmations was rejected as unsafe and was not performed. Those constraints
prevented a bounded safe fixture from being created, inspected and removed and
prevented aggregate before/after database evidence for the six cases.

Delivery was therefore restored to exact `false`; Ready deployment
`dpl_XfWtrA94y9FkypcueURb54dzUWUk` now serves `b4gamble.com` from the same
merged source. The additive provider, webhook and code configuration remains
in place. A second nine-route smoke passed against this final state.

## Controlled Production acceptance

| # | Acceptance | State |
| ---: | --- | --- |
| 1 | Welcome delivery to a provider-safe non-customer recipient | `BLOCKED — NO SAFE AUTHORISED FIXTURE` |
| 2 | Programme reminder consent/suppression/final-check and duplicate-job exactly-once | `BLOCKED — FIXTURE/DB ACCESS REQUIRED` |
| 3 | Marketing unsubscribe audit/suppression and second-send pre-provider block | `BLOCKED — FIXTURE/STAFF ACCESS REQUIRED` |
| 4 | Transactional rules remain separate after marketing unsubscribe | `BLOCKED — FIXTURE/STAFF ACCESS REQUIRED` |
| 5 | Webhook invalid/valid/replay/cross-customer/secret controls | `PARTIAL — INVALID REJECTION PASS; VALID/REPLAY/CROSS-CUSTOMER BLOCKED` |
| 6 | Bounded broadcast preview/exclusions/idempotency/retry/history | `BLOCKED — FIXTURE/STAFF ACCESS REQUIRED` |

Overall activation is `HOLD`. To resume, an authorised operator must complete
Vercel database re-verification and provide a current B4GAMBLE staff session,
then create the named provider-safe fixture and execute all six cases. Delivery
must remain `false` until every row is evidenced `PASS`.

## Rollback

Set `LIFECYCLE_EMAIL_DELIVERY_ENABLED=false` and redeploy. Retain the additive
schema and queue/history for inspection; do not down-migrate or delete audit
evidence. The pre-activation application rollback deployment is
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw`.

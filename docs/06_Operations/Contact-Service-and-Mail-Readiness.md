# Contact Service and Mail Readiness

- **Status:** Current main integrated; repository verification complete; Resend domain and DNS preservation verified; Preview activation pending
- **Decision:** RFC-028 / `LAUNCH-POLISH-01`
- **Base:** `64aba31c300984deb128bd6d06495f2bfaceb510`
- **Current main integrated:** `3416a72e469f31dcba06188847e7dd1716f36ae4`
- **Validated integration commit:** `0d2e67e6415566459c8c79bd2d6e6f6c2a59e67d`
- **Last reviewed:** 2026-08-13

## Evidence classification

### Detected

- The existing human mailbox is `support@b4gamble.com`; Founder Office identifies Google Workspace Business Starter as its authority.
- The application Contact boundary accepts only name, email, subject, message and the hidden honeypot; it does not import Prisma or persist submission bodies in the application database.
- Contact delivery is isolated under `lib/contact`. It does not activate the account/security or Programme transports under `lib/communications`.
- The Resend adapter uses direct server-side HTTPS, plain text, a bounded timeout and no automatic retry, SDK, tracking pixel, click tracking, visitor confirmation or marketing list.
- Runtime configuration fails closed unless `CONTACT_EMAIL_DELIVERY_ENABLED` is exactly `true` and the API key, exact approved From identity and exact support recipient are all valid.
- Founder Office override dated 2026-08-13 superseded the former sender and date gate. The visible sender is now exactly `B4GAMBLE Website <website@b4gamble.com>` and the former `2026-08-14 09:00 Asia/Almaty` mail-DNS gate is cancelled.
- The normal merge of current main preserved PR #69 `AGENT-CORE-01` and PR #70 `PARTNER-INTEL-EVAL-01`. Their pre-existing RFC-027 identifier required the unmerged Contact decision to move to RFC-028; no Contact runtime variable or behaviour changed.
- Exact-head local verification passed: root quality including 196 structural assertions and 30 Contact/launch assertions; legal 20/20; isolated Agent Core 40/40 plus typecheck/lint; production build; 742-file build-secret scan; 71-route/70-link audit with zero broken links; 32 passed non-database browser cases with one configured skip; all 19 migrations against a fresh local `_ci` database; 3/3 PostgreSQL runtime cases; and 9/9 database-backed Programme browser cases.
- The authenticated Vercel team is on the existing Pro plan. Project Firewall is active, Custom Rules and Rate Limit rules are both `0 / 40`, and the current rule editor supports exact request path, Fixed Window, IP Address key, 10–600 second window and HTTP 429. The required target is therefore representable without Enterprise.
- Current Vercel documentation prices rate-limit evaluation at `$0.50` per 1,000,000 allowed requests and records 1,000,000 included allowed requests for Pro. The first saved rate-limit rule requires an in-product pricing acknowledgement. No rule or paid add-on has been created.
- Read-only Vercel environment-variable searches found no `CONTACT_EMAIL_*` or `RESEND_*` variable names in any environment. No value was revealed.
- The authenticated Resend account is on the Free plan. Pay-as-you-go is disabled; no unexpected paid plan, add-on or recurring commitment is active.
- Resend reports the single domain `b4gamble.com` as verified and ready to send in North Virginia (`us-east-1`). Sending is enabled and receiving is disabled. Its records are:
  - `TXT resend._domainkey` — DKIM — verified;
  - `MX send` — SES Return-Path, priority 10 — verified; and
  - `TXT send` — SES SPF Return-Path — verified.
- `send.b4gamble.com` is therefore only the detected technical Return-Path for the verified root sending domain. It is not a second Resend domain and is not the visible From identity.
- Read-only authoritative DNS audit through the zone's Cloudflare nameservers on 2026-08-13 confirmed:
  - root Google Workspace MX `smtp.google.com` is present;
  - root Google Workspace SPF is present;
  - `google._domainkey` Workspace DKIM is present;
  - `resend._domainkey` Resend DKIM is present;
  - `send.b4gamble.com` MX and SPF match the verified Resend Return-Path records;
  - root and `www` web A records are present; and
  - DNSSEC has both parent DS and zone DNSKEY evidence.
- The Cloudflare dashboard was not authenticated during this read-back. The evidence above comes directly from the Cloudflare authoritative nameservers and does not claim console access or mutation.

No DKIM public-key body or secret value is recorded here.

### Planned

- Create one narrowly scoped send-only Resend API key for the website Contact purpose without recording its value.
- Send one non-sensitive Founder-controlled Preview test after provider verification, then verify From, Reply-To, subject, delivery and no duplicate.
- Prepare the four Production Contact variables and Vercel WAF rule only after code PASS and Founder review.

### Not detected

- No Resend API credential created for Contact, Contact delivery environment activation, real Preview delivery, Production Contact environment mutation or applied Production WAF rule is detected yet.
- No account email, Programme reminder, Programme engagement or marketing delivery activation is detected.

## Runtime environment contract

Names only; never record values:

```text
CONTACT_EMAIL_DELIVERY_ENABLED
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_EMAIL_TO
```

The approved target identities are `B4GAMBLE Website <website@b4gamble.com>` and `support@b4gamble.com`. `website@b4gamble.com` is a verified-domain transactional From identity and need not be a human mailbox. Visitor email is used only as validated Reply-To. The provider-managed `send.b4gamble.com` records are technical Return-Path authority only.

Anything other than exact enable value `true` fails closed. Partial or unexpected sender/recipient configuration fails closed. No Contact value uses a `NEXT_PUBLIC_` prefix.

## DNS authority boundary

Founder Office override dated 2026-08-13 explicitly cancelled and superseded the former `2026-08-14 09:00 Asia/Almaty` date gate. No further mail DNS write is required for the currently verified domain. Any later provider-requested record change must still use only exact Resend control-plane values and preserve Google Workspace root MX, root SPF, Workspace DKIM, DNSSEC and web DNS. Mail records remain DNS-only, not proxied.

DMARC is a separate Founder-scheduled action. If the exact previously approved value is unavailable at activation time, report `DMARC_VALUE_REQUIRED` and do not guess a policy, reporting address, percentage or subdomain policy.

## Vercel WAF preparation

Prepare, but do not apply before Founder review:

```text
Name: contact-form-rate-limit
Condition: request path = /api/contact AND method = POST
Strategy: Fixed Window
Key: IP
Limit: 5 requests / 10 minutes / IP
Action: 429
```

The read-only review confirms the rule is available in the existing Vercel Pro billing surface with the usage price recorded above; no Enterprise, Bot Management, CAPTCHA or recurring add-on is required. Application validation, body limit, same-origin enforcement and honeypot remain required even when WAF is active. Do not save or publish the rule until Resend domain verification, the single Preview send and mailbox receipt have passed.

Rollback removes only `contact-form-rate-limit`. Delivery rollback changes `CONTACT_EMAIL_DELIVERY_ENABLED` away from exact `true` and redeploys; the direct `mailto:support@b4gamble.com` fallback remains available.

## Activation sequence

1. Complete code, tests, accessibility, responsive, no-JavaScript, link and secret gates.
2. Obtain Founder review of the draft PR.
3. Verify the exact Resend plan/cost and provider-generated domain records.
4. Verify the sending domain and authoritative DNS preservation without changing Google Workspace root authority.
5. Send exactly one non-sensitive Preview test and confirm one message arrived.
6. Only at explicit Founder activation stage, prepare Production variables and WAF before the route reaches Production.
7. Under the Founder Office full completion authorisation dated 2026-08-13, merge by merge commit only after every gate passes. After the exact merge deployment is Ready, perform one Founder-controlled Production form smoke and inspect only metadata-safe application logs.

Do not change Production database, Programme, Google, affiliate, commercial or CMS configuration during this sequence.

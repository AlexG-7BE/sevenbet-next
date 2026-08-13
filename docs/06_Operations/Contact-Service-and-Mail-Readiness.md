# Contact Service and Mail Readiness

- **Status:** Current main integrated and repository verification complete on review branch; external mail activation deferred
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
- The normal merge of current main preserved PR #69 `AGENT-CORE-01` and PR #70 `PARTNER-INTEL-EVAL-01`. Their pre-existing RFC-027 identifier required the unmerged Contact decision to move to RFC-028; no Contact runtime variable or behaviour changed.
- Exact-head local verification passed: root quality including 196 structural assertions and 30 Contact/launch assertions; legal 20/20; isolated Agent Core 40/40 plus typecheck/lint; production build; 742-file build-secret scan; 71-route/70-link audit with zero broken links; 32 passed non-database browser cases with one configured skip; all 19 migrations against a fresh local `_ci` database; 3/3 PostgreSQL runtime cases; and 9/9 database-backed Programme browser cases.
- The authenticated Vercel team is on the existing Pro plan. Project Firewall is active, Custom Rules and Rate Limit rules are both `0 / 40`, and the current rule editor supports exact request path, Fixed Window, IP Address key, 10–600 second window and HTTP 429. The required target is therefore representable without Enterprise.
- Current Vercel documentation prices rate-limit evaluation at `$0.50` per 1,000,000 allowed requests and records 1,000,000 included allowed requests for Pro. The first saved rate-limit rule requires an in-product pricing acknowledgement. No rule or paid add-on has been created.
- Read-only Vercel environment-variable searches found no `CONTACT_EMAIL_*` or `RESEND_*` variable names in any environment. No value was revealed.
- Read-only public DNS audit at `2026-08-12 13:10 Asia/Almaty` found:
  - web A authority: present;
  - Google Workspace MX: present;
  - root Google Workspace SPF: present;
  - `google._domainkey` Workspace DKIM: present;
  - DMARC at `_dmarc.b4gamble.com`: absent;
  - `send.b4gamble.com` Resend SPF: absent/deferred; and
  - `send.b4gamble.com` Resend DKIM: absent/deferred.

No DKIM public-key body or secret value is recorded here.

### Planned

- Complete Resend authentication only after explicit approval of the pending GitHub OAuth permission, then verify the account/plan before creating any credential or domain configuration.
- Verify `send.b4gamble.com` in Resend using only provider-generated exact SPF/DKIM records after the Founder date boundary.
- Send one non-sensitive Founder-controlled Preview test after provider verification, then verify From, Reply-To, subject, delivery and no duplicate.
- Prepare the four Production Contact variables and Vercel WAF rule only after code PASS and Founder review.

### Not detected

- The Resend account/plan is not yet verified: the available session reached a GitHub OAuth permission screen and stopped before granting it. No Resend API credential, registered or verified sending subdomain, Contact delivery environment activation, real Preview delivery, Production Contact environment mutation or applied Production WAF rule is detected.
- No account email, Programme reminder, Programme engagement or marketing delivery activation is detected.

## Runtime environment contract

Names only; never record values:

```text
CONTACT_EMAIL_DELIVERY_ENABLED
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_EMAIL_TO
```

The approved target identities are `B4GAMBLE Website <website@send.b4gamble.com>` and `support@b4gamble.com`. `website@send.b4gamble.com` is a transactional From identity, not a human mailbox. Visitor email is used only as validated Reply-To.

Anything other than exact enable value `true` fails closed. Partial or unexpected sender/recipient configuration fails closed. No Contact value uses a `NEXT_PUBLIC_` prefix.

## Absolute DNS boundary

No mail DNS mutation is permitted before `2026-08-14 09:00 Asia/Almaty`. Current work therefore reports:

```text
MAIL_DNS_ACTIVATION_DEFERRED
```

At `2026-08-13 15:38 Asia/Almaty`, the boundary had not passed. No DNS write, real Contact delivery or Production Contact activation is permitted in this state.

After the boundary, use only Resend control-plane values for the sending subdomain. Preserve Google Workspace root MX, root SPF, Workspace DKIM, DNSSEC and web DNS. Mail records remain DNS-only, not proxied.

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
3. On or after the DNS boundary, verify the exact Resend plan/cost and provider-generated subdomain records.
4. Verify the sending domain without changing Google Workspace root authority.
5. Send exactly one non-sensitive Preview test and confirm one message arrived.
6. Only at explicit Founder activation stage, prepare Production variables and WAF before the route reaches Production.
7. Under the Founder Office full completion authorisation dated 2026-08-13, merge by merge commit only after every gate passes. After the exact merge deployment is Ready, perform one Founder-controlled Production form smoke and inspect only metadata-safe application logs.

Do not change Production database, Programme, Google, affiliate, commercial or CMS configuration during this sequence.

# Contact Service and Mail Readiness

- **Status:** Corrected replacement Preview delivered and Founder-confirmed in the support inbox; WAF and Production sequence authorised
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
- Founder Office correction dated 2026-08-13 sets the visible sender to exactly `B4GAMBLE <info@b4gamble.com>`, requires `info@b4gamble.com` to be an alias delivering to `support@b4gamble.com`, and separately authorises one replacement Preview submission after every pre-send gate passes. The former `2026-08-14 09:00 Asia/Almaty` mail-DNS gate remains cancelled.
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
- During the initial activation read-back, the Cloudflare dashboard was not authenticated and the evidence came directly from authoritative nameservers. The later Founder correction run used the authenticated Cloudflare console for the narrowly authorised DMARC addition; the earlier provider-record evidence remains authoritative DNS evidence rather than a retrospective console claim.
- Resend API key `B4GAMBLE Website Contact` was created with Sending access restricted to the verified `b4gamble.com` domain. Its value was transferred only in transient browser memory to a Sensitive, Preview-only, `codex/launch-polish-01` Vercel variable and was never printed, written to disk or committed.
- On 2026-08-13, the authenticated Cloudflare console and both authoritative nameservers confirmed that DMARC was absent. The authorised monitoring-only TXT value `v=DMARC1; p=none` was then added at `_dmarc.b4gamble.com` and read back identically from both authoritative nameservers. Exactly one DMARC policy is published; no aggregate-report destination is configured.
- Google Admin shows `info@b4gamble.com` as an alternate email address on the existing `support@b4gamble.com` user. No additional user or licence was created.
- Google Admin's DKIM screen for `b4gamble.com` exposes the existing `google._domainkey` selector and an enabled authentication control while concurrently displaying its DNS-update notice. The existing key was not regenerated or changed; authoritative DNS continues to publish the matching selector.
- At `2026-08-13 17:07:08 Asia/Almaty`, the one authorised corrected replacement submission produced one Vercel `POST /api/contact` request and one Resend message. Vercel recorded HTTP `200`, `contact_result=delivered`, provider class `2xx`, duration `183 ms` and correlation ID `e6ca5a51-3c9f-484a-bf2f-4e40b6299d20`. Resend email ID `569bea8e-9a2d-4edc-a5ff-8916fc8ffd34` and request/log ID `cf8ee319-f995-4824-aef7-f4072d788143` show `delivered`, exact From `B4GAMBLE <info@b4gamble.com>`, To `support@b4gamble.com`, a Founder-controlled external Preview test address as Reply-To, no CC/BCC and no visitor confirmation. Founder Office subsequently confirmed actual receipt in `support@b4gamble.com`; `FOUNDER_MAILBOX_CONFIRMATION_REQUIRED` is satisfied.

No DKIM public-key body or secret value is recorded here.

### Planned

- Create and verify the authorised Vercel WAF rule.
- Prepare the authorised fail-closed Production Contact variables, then complete the remaining pre-merge gates.

### Not detected

- No Production Contact environment mutation or applied Production WAF rule is detected at this documentation checkpoint.
- No account email, Programme reminder, Programme engagement or marketing delivery activation is detected.

## Runtime environment contract

Names only; never record values:

```text
CONTACT_EMAIL_DELIVERY_ENABLED
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_EMAIL_TO
```

The approved target identities are `B4GAMBLE <info@b4gamble.com>` and `support@b4gamble.com`. `info@b4gamble.com` is the public/general sender and must be a Google Workspace alias delivering to the existing support mailbox; it must not become a separately licensed user. Each real Contact submission uses only the validated visitor email as Reply-To, so a support-inbox reply is addressed to that visitor. The corrected replacement Preview used a Founder-controlled external Preview test address only as bounded historical verification evidence; it is not part of Production configuration, defaults, tests, runtime configuration or future smoke submissions. The provider-managed `send.b4gamble.com` records remain technical Return-Path authority only.

Anything other than exact enable value `true` fails closed. Partial or unexpected sender/recipient configuration fails closed. No Contact value uses a `NEXT_PUBLIC_` prefix.

## DNS authority boundary

Founder Office override dated 2026-08-13 explicitly cancelled and superseded the former `2026-08-14 09:00 Asia/Almaty` date gate. No further mail DNS write is required for the currently verified domain. Any later provider-requested record change must still use only exact Resend control-plane values and preserve Google Workspace root MX, root SPF, Workspace DKIM, DNSSEC and web DNS. Mail records remain DNS-only, not proxied.

DMARC is now exactly `v=DMARC1; p=none` at `_dmarc.b4gamble.com`, confirmed through both authoritative Cloudflare nameservers. No `rua`, `ruf`, `pct`, subdomain policy, quarantine or reject setting is configured or authorised in this work package.

## Preview activation evidence and stop state

The exact `e3808a6b03d46c9fa0ec327c741ff0f999d8df4d` Preview deployment reached Ready with all four Contact variables Sensitive, Preview-only and restricted to `codex/launch-polish-01`. The deployed page passed Contact rendering, canonical `https://b4gamble.com/contact`, footer/Privacy/protected-Help navigation, client validation, 4,000-character UI bound, static no-Prisma/no-database path, safe noindex 404 and zero browser warning/error-log checks. The exact server guard, honeypot, 8 KiB, CR/LF, safe-error and no-sensitive-log contracts remain covered by the passing repository tests.

At `2026-08-13 16:10:29 Asia/Almaty`, a CR/LF browser test was normalized by the single-line Subject control into a valid subject and unintentionally consumed the one authorised Preview delivery. The result was exactly one provider request and one internal message:

- Vercel: `POST /api/contact`, HTTP `200`, `contact_result=delivered`, provider class `2xx`, duration `139 ms`; application log contained only the approved metadata fields.
- Resend request/log ID: `e64b5d64-464c-44ab-9fdc-7b91ec8b6d4c`; email ID: `30bc211f-6971-4a38-8715-d316a71233c9`; provider API status `200`; delivery status `delivered`.
- Historical From: `B4GAMBLE Website <website@b4gamble.com>`; To: `support@b4gamble.com`; no CC/BCC and no visitor confirmation message. This records the former approved contract and is not the current sender identity.
- Subject: `[B4GAMBLE Contact] Preview checkBcc: attacker@example.invalid`.
- Reply-To: `visitor@example.invalid`, which violates the required Founder-controlled Reply-To contract.

No second submission was made. The authenticated external Founder mailbox session did not provide access to the distinct `support@b4gamble.com` mailbox. That historical first submission still failed the required Reply-To gate and is not cured by later mailbox evidence.

Preview delivery was immediately rolled back to fail closed by changing branch-specific `CONTACT_EMAIL_DELIVERY_ENABLED` to `false`. Vercel redeployment `9owEsaw6ug7oanxu5v3DzzqeXnHd` reached Ready at the same source commit. The API key, From and To variables remain Sensitive and Preview/branch-only for controlled remediation; Production received none of these values.

After the correction gates passed, exact source `315dc440809dc6ead02ccfbaa3a08e3e41674582` was redeployed as Preview `6dVPMXNMKeN8ZcrH9eCQDFDstBCe` with delivery enabled only for the bounded replacement. The exact Founder payload produced the single successful provider event recorded above. Resend displayed the final subject `[B4GAMBLE Contact] B4GAMBLE Contact Preview verification` and exact From/To contract, with a Founder-controlled external Preview test address as Reply-To. Founder Office subsequently confirmed actual receipt in the distinct support inbox, satisfying `FOUNDER_MAILBOX_CONFIRMATION_REQUIRED`; no additional Preview message is permitted or required. Delivery was changed back to `false` immediately after evidence capture; branch-specific Preview redeployment `FFbwLJZerUqvM6cZhguxMGZjWzrR` reached Ready at `2026-08-13 17:10:43 Asia/Almaty`. At this documentation checkpoint, WAF, Production variables, merge and Production smoke remain untouched.

## Vercel WAF preparation

Apply under the Founder continuation authorisation:

```text
Name: contact-form-rate-limit
Condition: request path = /api/contact AND method = POST
Strategy: Fixed Window
Key: IP
Limit: 5 requests / 10 minutes / IP
Action: 429
```

The read-only review confirms the rule is available in the existing Vercel Pro billing surface with the usage price recorded above; no Enterprise, Bot Management, CAPTCHA or recurring add-on is required. Application validation, body limit, same-origin enforcement and honeypot remain required even when WAF is active. The exact Preview Reply-To and mailbox gates have passed; Founder Office authorised rule creation.

Rollback removes only `contact-form-rate-limit`. Delivery rollback changes `CONTACT_EMAIL_DELIVERY_ENABLED` away from exact `true` and redeploys; the direct `mailto:support@b4gamble.com` fallback remains available.

## Activation sequence

1. Complete code, tests, accessibility, responsive, no-JavaScript, link and secret gates.
2. Obtain Founder review of the draft PR.
3. Verify the exact Resend plan/cost and provider-generated domain records.
4. Verify the sending domain and authoritative DNS preservation without changing Google Workspace root authority.
5. Send exactly one non-sensitive Preview test and confirm one message arrived. This is complete; do not send another Preview message.
6. Under the Founder continuation authorisation dated 2026-08-13, create the exact WAF rule and prepare fail-closed Production variables before merge.
7. Merge by merge commit only after every gate passes. After the exact merge deployment is Ready, enable delivery and perform exactly one B4GAMBLE-controlled Production form smoke using `info@b4gamble.com` as the submitted synthetic visitor email; inspect only metadata-safe application logs and confirm actual support-inbox receipt.

Do not change Production database, Programme, Google, affiliate, commercial or CMS configuration during this sequence.

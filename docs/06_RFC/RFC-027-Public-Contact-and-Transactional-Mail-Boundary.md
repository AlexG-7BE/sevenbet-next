# RFC-027: Public Contact and Transactional Mail Boundary

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `LAUNCH-POLISH-01`
- **Approved:** 2026-08-12
- **Scope:** Public Contact page and form, `/api/contact`, isolated transactional delivery to the existing support mailbox, privacy and abuse controls, and error-surface hardening
- **Base:** `64aba31c300984deb128bd6d06495f2bfaceb510`
- **Depends on:** Product Vision & Principles v2.0, RFC-007, RFC-017, RFC-018, Design System v1, Architectural Principles, Module Boundaries, Server and Client Boundaries, and Dependency Rules
- **Supersedes:** RFC-018 only for this one Contact-form delivery purpose; account, security and Programme communications remain disabled

## 1. Decision and ceiling

B4GAMBLE will provide a public, non-commercial Contact route for general questions, technical issues, editorial feedback and business enquiries. The capability is useful without casino, bonus, affiliate, Programme or account activity. Protected Help remains a separate, registration-free route and is presented before the Contact form can be mistaken for gambling support.

The Contact capability owns only:

1. visible Contact content and form state;
2. validation of the four public fields plus a honeypot;
3. one server-side delivery request to the existing `support@b4gamble.com` mailbox;
4. bounded operational outcome metadata; and
5. abuse protection for `POST /api/contact`.

It does not own accounts, Programme communications, marketing permission, customer-support tickets, attachments, a message database, analytics events, gambling-support intake, CRM data or affiliate/commercial personalisation.

## 2. Data and purpose boundary

The accepted submission contains optional name, required email, required subject and required plain-text message. The server accepts no other keys. Browser and server validation enforce bounded lengths, a basic email shape, meaningful message length and CR/LF rejection for header-bound fields. The hidden `company` honeypot is never delivered; a filled honeypot receives the same generic success response as an accepted submission.

The application does not persist the submission body in Prisma, another database, local storage, session storage after success, analytics or application logs. The purpose is limited to receiving, routing and responding to the enquiry and protecting the form from abuse. It is not marketing consent, profiling, casino personalisation, Programme personalisation or AI input.

The route may process ordinary request security metadata through the hosting layer and same-origin check. Application logging is restricted to a random request correlation ID, fixed result category, duration and provider status class. It excludes name, email, subject, message, honeypot, request body, raw IP and provider response body.

## 3. Delivery architecture

Contact uses a server-only `ContactTransport` port owned by `lib/contact`. This boundary stays separate from `lib/communications`, whose account/security and Programme purposes remain provider-independent and disabled. The Contact port has:

- a disabled transport for fail-closed runtime;
- a memory transport injectable only by tests; and
- a Resend HTTPS adapter for the approved live delivery path.

The adapter uses direct `fetch` and adds no SDK dependency. It sends one internal notification only:

- From: `B4GAMBLE Website <website@send.b4gamble.com>` after domain verification;
- To: `support@b4gamble.com`;
- Reply-To: the server-validated visitor email; and
- Subject: `[B4GAMBLE Contact] ` plus the validated subject.

Plain text is mandatory. No visitor confirmation, tracking pixel, click tracking, remote image, automatic retry, AI processing, marketing list or inbound Resend mailbox is authorised. Provider timeouts are bounded and ambiguous timeouts are not retried automatically.

## 4. Runtime configuration and fail-closed activation

The server recognises only these Contact variables:

```text
CONTACT_EMAIL_DELIVERY_ENABLED
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_EMAIL_TO
```

Delivery is enabled only when the first variable is exactly `true` and all remaining values pass validation. The configured recipient must be exactly `support@b4gamble.com`; the From address must be the approved verified `send.b4gamble.com` identity. Partial, malformed or unexpected configuration resolves to the disabled transport. Memory transport cannot be selected by Production environment input.

Provider configuration and Production variables do not activate account/security, Programme reminder, Programme engagement or commercial marketing delivery. `PROGRAM_AI`, Google, affiliate, commercial and CMS flags remain unchanged.

## 5. HTTP and abuse contract

`POST /api/contact` runs in the Node runtime and accepts `application/json` only. It applies a small body-size limit before parsing, strict key allow-listing, server validation, same-origin enforcement and no-store responses. It exposes no GET data endpoint, CORS wildcard, authentication gate, age gate or Programme gate.

Safe browser outcomes are delivered, rejected or unavailable. Provider identity, response content and errors do not cross the API boundary.

Network-layer rate limiting is owned by the existing Vercel platform, not Prisma or a Programme limiter. The prepared Production WAF rule is:

```text
Name: contact-form-rate-limit
Condition: path = /api/contact AND method = POST
Strategy: Fixed Window
Key: IP
Limit: 5 requests per 10 minutes
Action: 429
```

The rule is not applied before Founder review. No CAPTCHA, challenge service, Redis, Upstash, schema migration or new recurring SaaS dependency is authorised. Rollback disables/removes this exact rule and disables Contact delivery by changing the exact enable flag away from `true`.

## 6. Mail authority and DNS boundary

The existing human mailbox authority remains Google Workspace Business Starter at `support@b4gamble.com`. The application does not use a mailbox password, Google OAuth credential, Gmail API, domain-wide delegation or root-domain mail change.

Resend is the approved narrow transactional provider for `send.b4gamble.com`. It must use only provider-generated exact records and must not replace or modify Google Workspace MX, root SPF, Workspace DKIM, DNSSEC or web DNS.

No mail DNS mutation is authorised before `2026-08-14 09:00 Asia/Almaty`. If the exact previously approved DMARC value is unavailable at activation time, the DMARC action stops without guessing. Code, local tests and non-DNS Preview tests may proceed while reporting `MAIL_DNS_ACTIVATION_DEFERRED`.

## 7. Privacy, retention and processor boundary

The Privacy Notice discloses the accepted Contact data, purpose, abuse metadata, absence of application-database persistence, no marketing/profiling/Programme/casino/AI use, and the warning not to submit passwords, payment details or private Programme answers.

If activated, the recipient chain is Vercel application hosting, Resend transactional delivery and the Google Workspace support mailbox. Provider/mailbox copies and operational delivery data follow their actual service and B4GAMBLE operational retention; this RFC does not invent a deletion period. Processor contracts, locations, subprocessors, retention, transfers and applicable safeguards remain external launch evidence until verified.

## 8. Error and design-system boundary

The root 404 removes session/database coupling and renders static anonymous Public Shell navigation with truthful HTTP 404 and noindex behavior. The public error boundary remains client-safe inside the Public Shell. The root global error remains standalone and imports no application shell, data, auth, analytics, communications or provider dependency.

Contact and error surfaces use the approved Design System v1 tokens and shared Action primitive where its internal-action contract applies. No new visual direction, arbitrary colour/font/spacing scale, generic form system or Programme/specialised error redesign is authorised.

## 9. Verification and release boundary

Required evidence includes validation and injection tests, same-origin and content-type denial, body-size and unexpected-key denial, honeypot zero-delivery, one accepted submission producing exactly one memory envelope, safe provider failure, no sensitive logging, duplicate in-flight UI prevention, structural global-error/404 assertions, truthful HTTP status and robots checks, first-party link audit, keyboard/no-JavaScript/accessibility/responsive smoke, build and secret audit.

CI and local tests use no real provider call. After mail DNS is permitted and the sending domain is verified, exactly one Founder-controlled, non-sensitive Preview delivery test may be sent. Production environment preparation, WAF activation and Production contact smoke require the later Founder activation stage. This RFC does not authorise merge; the pull request remains draft until Founder Office GO and the user alone merges with a merge commit.

## 10. Cost and rollback

The code package adds no npm dependency, schema change, migration, database or recurring application service. Resend must not be adopted if it requires an unexpected paid plan or material recurring commitment. Vercel WAF must not be enabled if it requires an unexpected material paid add-on or Enterprise upgrade.

Delivery rollback sets `CONTACT_EMAIL_DELIVERY_ENABLED` to anything other than exact `true` and redeploys. The public page continues to expose the direct `mailto:support@b4gamble.com` fallback. WAF rollback removes only `contact-form-rate-limit`. No mailbox, root mail DNS, Programme communication or database rollback is involved.

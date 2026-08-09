# Google Authentication and Email Readiness

- **Status:** Repository foundation ready; external Google and email activation open
- **Owner:** Founder Office configuration owner with Engineering and Privacy review
- **Decision:** RFC-018 / AUTH-COMMS-01
- **Last reviewed:** 2026-08-09

## Evidence status

### Detected

- Better Auth `1.6.23` owns the Google authorization, state, PKCE, callback, user/session and provider-account flow.
- Google is registered only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present.
- The server accepts only the fixed Google provider, fixed internal success/error callbacks and a boolean sign-up intent. Caller-supplied scopes, tokens, provider changes, extra data and callback destinations are rejected.
- The installed provider requests its default identity scopes: `openid`, `email` and `profile`. No Google client SDK is added.
- OAuth tokens are encrypted in the Better Auth `Account` row, excluded from normal data-subject export and deleted with the account.
- Preview Better Auth continues to derive one exact branch host from `VERCEL_BRANCH_URL`; wildcard or contradictory origins fail closed.
- The communications module has closed purposes, fixed templates, authoritative recipient resolution, sender categories, idempotency, bounded audit metadata, a disabled runtime transport and an in-memory test transport.

### Inferred

- Separate Google Web application clients for Production and Preview are the safest operational fit because their database, session secret, base URL and callback authority are already isolated.
- Account/security and Programme sender identities should remain separate from any future commercial sender reputation.

### Planned

- Create and verify the external Google Cloud clients and exact authorised redirects.
- Select and legally/operationally review an email delivery provider only under a separate activation decision.
- Verify a B4GAMBLE-controlled sending domain and monitored mailboxes.

### Not detected

- No Google credentials, consent-screen publication, exact Preview callback registration or live Google smoke result is proven by repository evidence.
- No email delivery provider, provider credential, scheduler, queue, outbox, preference store, suppression list, bounce/complaint handler, tracking or Production email send path exists.

## Google callback matrix

Better Auth's provider callback path is exactly `/api/auth/callback/google`.

| Environment | B4GAMBLE origin | Exact callback to register | Credential boundary |
| --- | --- | --- | --- |
| Local | `http://localhost:4173` | `http://localhost:4173/api/auth/callback/google` | Developer-owned client only; synthetic accounts |
| Preview | `https://sevenbet-next-git-codex-auth-comms-0-22e2e7-alexg-7bes-projects.vercel.app` | `https://sevenbet-next-git-codex-auth-comms-0-22e2e7-alexg-7bes-projects.vercel.app/api/auth/callback/google` | Separate Preview client and Preview database/session secret |
| Production | `https://b4gamble.com` | `https://b4gamble.com/api/auth/callback/google` | Separate Production client and Production database/session secret |

The Preview host above is the stable branch alias exposed by PR #58; the first generated deployment hostname was deliberately not used. Register only this exact callback before Google Preview activation. Do not register a random generated deployment hostname, a wildcard `*.vercel.app` redirect, the Production host for Preview, or a substring/pattern. The application deliberately rejects a Preview base URL that does not equal the exact `VERCEL_BRANCH_URL` origin.

The approved canonical Production origin is `https://b4gamble.com`. Set `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` to that exact origin together through release governance. When Google Production activation is separately authorised, register that exact JavaScript origin and callback. Do not leave the Vercel hostname and custom domain mixed across state/cookie boundaries.

## Google Cloud setup

1. Confirm the Google Cloud organisation/project owner and the 7BE Inc./B4GAMBLE controller identity to display.
2. Configure the OAuth consent screen with accurate application name, verified B4GAMBLE-controlled homepage/privacy/terms domains, support contact and incident contact. Do not claim Google verifies age or gambling eligibility.
3. Request only the normal OpenID identity permissions. Do not add mailbox, contacts, Drive, Calendar, advertising or offline mail access.
4. Create one **Web application** OAuth client for Production and a separate Web application client for Preview/development where operationally practical.
5. Add only the exact environment origin under authorised JavaScript origins and the exact matrix callback under authorised redirect URIs.
6. Record the consent-screen publication/test-user state. If the client remains in test mode, record the allowed testers and expiry/refresh constraints.
7. Store each client ID and client secret in Vercel only for its intended environment as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Never copy a Production secret into Preview, commit values, prefix a secret with `NEXT_PUBLIC_`, or place a value in a React prop.
8. Trigger a new deployment. Missing or partial credentials must leave the Google button absent while email/password remains available.

## Google verification

Use synthetic/non-sensitive accounts in Preview. Do not enter Programme narrative into Google fields or support tickets.

1. Confirm the deployment SHA, exact `VERCEL_BRANCH_URL`, Preview database and Preview Better Auth secret before authentication.
2. Confirm the Google option is absent with no credentials and with only one credential.
3. With a complete Preview pair, confirm the button is visible and labelled `Continue with Google` with the official multicolour mark.
4. Inspect the authorization request: only `openid`, `email` and `profile`; callback host/path exact; state and PKCE present; no caller-controlled callback.
5. Exercise a new Google sign-up after the separate 18+ and Terms controls. Confirm one `User`, one Google `Account`, no password requirement and no `AdminUser`.
6. Exercise a returning Google user. Confirm the provider account ID remains stable and no duplicate `User` is created.
7. Exercise a verified existing email/password account with the same Google email. Confirm one `User` with multiple authentication methods. An unverified local email must fail safely rather than merge.
8. Confirm a Google identity already owned by User A cannot be reassigned or linked to User B.
9. Exercise Mission 01 claim continuation: exact marker, server claim redemption, one reward, local journey-to-user migration and source removal. Then exercise expired/mismatched marker, cancellation, ordinary sign-in and User A → logout → User B negative cases.
10. Confirm Google authentication without the bounded age header is denied, Programme mutations still require age confirmation and `/responsible-gambling` remains open.
11. Confirm user-visible failures are generic and no token, email, database detail, secret or provider payload appears in HTML, logs or URLs.
12. Revoke/delete the synthetic accounts and verify the active-database `Account`/session rows follow the approved privacy process.

## Account-linking and recovery rules

- The Google `sub` value stored as Better Auth's provider account ID is immutable authority. Display name and client-provided email are not merge authority.
- Implicit same-email linking requires Google to report a verified email and the existing local `User.emailVerified` value to be true.
- Different-email linking is disabled. Provider account reassignment is prohibited. Provider profile data does not overwrite the local account on link.
- Google implicit sign-up is disabled. The UI sends an explicit sign-up intent only after the separate account-creation controls.
- The last authentication method cannot be unlinked. No unlink UI is exposed in this release.
- If Google is a user's only method, do not disable the provider in Production without a tested verified recovery path.
- Public Google users receive no staff role. Staff access still requires a separately provisioned `AdminUser` relation and server permission checks.

## Communications authority

| Purpose | Current authority | Delivery state |
| --- | --- | --- |
| `ACCOUNT_SECURITY` | Genuine necessity plus an approved security workflow | Template/contract only; disabled transport |
| `PROGRAMME_USER_REQUESTED_REMINDER` | Explicit request for that reminder/category | Template/contract only; no scheduler |
| `PROGRAMME_ENGAGEMENT` | Separate current engagement opt-in | Template/contract only; no preference store or scheduler |
| `COMMERCIAL_MARKETING` | Denied | No template and no transport path |

Unknown purposes deny. Google authentication, provider email verification, age confirmation, Terms acceptance, account creation, Programme enrollment, completion, streak or inactivity do not grant reminder or marketing authority. One user-requested reminder does not become recurring engagement permission.

The service accepts no caller-provided recipient, sender, subject, text, HTML or URL. It resolves the current account email on the server, renders a fixed purpose-compatible template and passes it to a provider-independent transport with an opaque idempotency key. Programme templates contain no Moment Map, goal, urge, Self-Check, Limit Tracker, private boundary, loss, vulnerability, casino, bonus, affiliate or commercial-personalisation data.

## Sender identity and provider decision

The future visible sender is independent of the transport provider. Runtime configuration is reserved for:

- `SEVENBET_ACCOUNT_EMAIL_FROM` — B4GAMBLE-controlled account/security sender;
- `SEVENBET_PROGRAMME_EMAIL_FROM` — B4GAMBLE-controlled Programme sender; and
- `SEVENBET_EMAIL_REPLY_TO` — monitored reply mailbox.

All three must be valid and configured before message creation, but they do not activate delivery. `createDisabledCommunicationService()` always uses the disabled transport and returns `EMAIL DELIVERY NOT CONFIGURED` semantics (`TRANSPORT_NOT_CONFIGURED`) without logging a body or claiming success.

A future provider decision must compare security, reliability, regional processing, data-processing terms, subprocessors, transfer mechanism, retention, deletion, support access, API/SMTP credentials, idempotency, rate controls, bounce/complaint/suppression support and operational ownership. Do not default to a personal mailbox, use a user's Google token, or assume that a Google-authenticated recipient will whitelist B4GAMBLE messages.

## Deliverability activation checklist

Every item is **OPEN** until owner evidence is attached. There is no inbox-placement guarantee.

- [ ] B4GAMBLE-controlled sending domain ownership verified.
- [ ] Account, Programme and reply mailboxes approved, monitored and tested.
- [ ] SPF record configured for the selected transport and verified.
- [ ] DKIM selector/key configured and verified.
- [ ] DMARC policy and reporting mailboxes approved; SPF/DKIM alignment verified.
- [ ] Provider TLS behaviour and credential rotation verified.
- [ ] Account/security reputation separated from future commercial marketing where useful.
- [ ] Bounce classification, retry limits, hard-bounce suppression and ownership defined.
- [ ] Complaint feedback/suppression, incident threshold and owner defined.
- [ ] Rate limits, abuse controls and duplicate/idempotency behaviour load-tested.
- [ ] Provider delivery-event data fields, access, retention and deletion approved.
- [ ] Postmaster/reputation monitoring decision and scale threshold recorded.
- [ ] Accessible text/HTML rendering and lock-screen-safe subject/preview reviewed.
- [ ] Programme engagement opt-out works in one clear action without deleting the account.
- [ ] `List-Unsubscribe` and one-click behaviour implemented where applicable only after a real preference endpoint exists; no fake header.
- [ ] No open pixel, click decoration, device fingerprint, affiliate tracking or remote image enabled.

## Rollout and containment

Google can be disabled by removing one or both environment credentials and redeploying; email/password remains available. Before doing so in Production, assess Google-only account recovery. OAuth provider rows must not be deleted or merged as a rollback shortcut.

Email delivery remains contained by the disabled transport, absence of a public send endpoint and absence of provider credentials. A real adapter, provider, scheduling, recurring reminders, preferences, unsubscribes, outbox or delivery logging requires a separate approved change. Commercial/referral policy and the affiliate engine remain off independently.

Treat unexpected OAuth scope, callback, account merge, token exposure, Preview/Production crossover or provider-account reassignment as an authentication incident. Treat unintended recipient, protected Programme content, tracking, commercial content or unbounded repeated delivery as a communications/privacy incident. Preserve evidence and follow the personal-data-breach and incident runbooks.

## Founder/Operations inputs still required

- Apply the approved Production authority `https://b4gamble.com` to the three documented environment values and redeploy exact merged `main` before any later Google Production activation.
- Register the documented stable Preview origin and callback in the separate Preview Google client.
- Create and place separate Production and Preview Google client IDs/secrets.
- Verify the consent screen, authorised origins and exact callbacks.
- Select the future B4GAMBLE-controlled sending domain.
- Select account/security From, Programme From and monitored Reply-To mailboxes.
- Decide whether/when to select an email transport provider under a separate activation decision.
- Assign Privacy, Security, deliverability and bounce/complaint owners.

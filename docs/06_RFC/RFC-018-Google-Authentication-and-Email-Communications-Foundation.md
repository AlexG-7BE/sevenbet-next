# RFC-018: Google Authentication and Email Communications Foundation

> **OAuth credential supersession — 2026-08-09:**
> [RFC-020](RFC-020-Google-Identity-Only-Authentication-Hardening.md)
> supersedes this RFC where it permits durable Google OAuth token/scope storage
> or leaves explicit provider-linking and provider-token HTTP capabilities
> available. Google remains identity-only; its durable account relationship now
> excludes access, refresh and ID tokens, expiry metadata and scope.

- **Status:** Approved
- **Decision authority:** Founder Office AUTH-COMMS-01 authorization
- **Approved:** 2026-08-09
- **Scope:** Google identity, safe account linking, exact-journey Programme claim continuation, and a provider-independent email communications foundation
- **Depends on:** RFC-002, RFC-008 and RFC-017
- **Supersedes:** RFC-002 only where it deferred social sign-in to a later decision; Mission, reward and Programme ordering remain unchanged

## 1. Decision

SevenBet will add Google as an optional public authentication method through the installed Better Auth Google provider. Email/password remains available. Google authentication is identity only: it does not grant staff access, prove age, imply communications consent, request Gmail access or authorise commercial personalisation.

Google configuration fails closed. The option is shown only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. The application requests only the provider's default OpenID Connect identity scopes (`openid`, `email` and `profile`). The callback remains the Better Auth route at `/api/auth/callback/google`. Production and Preview use separate Google credentials and exact authorised origins; Preview uses the stable branch alias already enforced by the Better Auth runtime-origin contract.

The existing anonymous Mission 01 claim may continue through the full-page OAuth round trip only when a short-lived, versioned `sessionStorage` marker identifies the exact active anonymous journey and intent. The marker contains no Programme narrative. After return, the server remains the sole authority for claim validity, ownership, reward and completion. Local Programme content moves only after successful redemption and exact marker-to-journey matching. An ordinary Google or email/password sign-in does not migrate anonymous content.

SevenBet will also introduce a server-only, provider-independent email communications boundary. It defines a closed set of purposes, explicit authority checks, fixed templates, authoritative recipient resolution, transport and idempotency contracts, and disabled/test adapters. This release does not select or integrate an email provider, send Production email, schedule reminders, add a preference centre, create marketing campaigns or introduce tracking.

No database schema change, migration or dependency upgrade is required or authorised.

## 2. Evidence classification

### Detected

- Better Auth `1.6.23`, its Prisma adapter, email/password authentication, server-derived sessions and exact Preview-origin validation are present.
- The installed Better Auth Google provider uses Google's immutable subject identifier for the provider account, maps `email_verified`, and defaults to `email`, `profile` and `openid` scopes.
- The existing `Account` relation stores provider identity separately from `User`; `User.email` is unique; sessions and provider accounts cascade on user deletion.
- Public authenticated users become staff only through a separately provisioned `AdminUser` relation and server-side staff checks.
- Mission 01 completion creates a short-lived server claim, and redemption is server-authoritative and idempotent. The browser currently migrates only the exact current journey after a successful same-page email/password flow.
- Raw Programme narrative and local age confirmation are subject-isolated in `sessionStorage`; the active journey pointer is an opaque random identifier.
- Data-subject export includes provider account identifiers and scopes while excluding tokens. Data-subject deletion removes provider accounts and sessions.
- No email delivery provider, queue, scheduler, CRM, behavioural analytics SDK, marketing automation tool or public arbitrary-send endpoint is present.
- The active repository scan covered the repository root and excluded dependencies, generated output, caches, test artefacts and `tsconfig.tsbuildinfo` from the source baseline.

### Inferred

- Better Auth's built-in verified-email account-linking rules can safely link a Google identity to an existing verified local account without a homemade email-merge algorithm.
- A short-lived exact-journey marker can bridge the OAuth navigation without moving raw Programme narrative into a cookie, URL, database, log or third-party state.
- A transport abstraction and closed purpose policy can establish communications safety and testability without prematurely selecting a processor or adding persistence.

### Planned

- Production and Preview Google OAuth clients, consent-screen configuration and redirect registration will be completed outside the repository using separate secrets and exact deployed origins.
- A real email provider, verified sending domain, SPF, DKIM, DMARC, bounce/complaint handling, suppression processing, processor review, transfer assessment and provider retention review require a separate approved activation decision.
- Any durable communications preferences, scheduling, quiet hours, unsubscribe state, delivery audit/outbox or operational reminder service require a separately approved schema and product decision.

### Not detected

- No Gmail API access, offline mail access, Google marketing scope, Google Ads integration or use of Google identity for commercial targeting is authorised or implemented.
- No date-of-birth collection, KYC or durable age-attestation evidence is introduced. `AGE ATTESTATION PERSISTENCE — P1 OPEN` remains true.
- No real email transport, Production sender, public send API, open relay, tracking pixel, click tracking, campaign engine, AI integration or new Mission is implemented.

## 3. Google authentication contract

### 3.1 Provider and runtime configuration

The server registers the Better Auth Google provider only when both trimmed credentials are non-empty. A partial pair is treated as unavailable; the public UI receives only an availability boolean and never a secret or configuration error. Secrets remain server-only and are not used in build-time client variables.

The provider uses the existing Better Auth base-URL and trusted-origin resolution. Preview continues to accept only the exact stable Vercel branch host selected by `VERCEL_BRANCH_URL`; Production uses its independent exact origin. Wildcard redirect URIs, caller-provided callback hosts and weakened trusted-origin rules are prohibited.

The application does not add scopes beyond the provider defaults. It does not request Gmail, contacts, calendar, advertising or offline mail permissions. OAuth tokens stored by Better Auth are encrypted through its supported account option. Token values remain excluded from data-subject export and operational logs.

### 3.2 Account linking and failure behaviour

Account ownership remains `User`; authentication methods remain separate `Account` rows. The immutable Google provider account ID is the linking authority, not a mutable display name or client assertion.

Implicit linking may occur only under Better Auth's installed safety rules: Google reports a verified email and the existing local account email is verified. A provider identity already owned by another user must fail. A same-email unverified local account must not be silently merged; the user receives bounded recovery guidance to use the existing method. Manual linking, when a future account-settings surface exposes it, must require an authenticated session and Better Auth's verified-email/provider-ownership checks. Unlinking the last authentication method remains prohibited.

Public Google authentication never creates an `AdminUser` row, assigns a staff role or bypasses the existing protected-layout and server-route staff checks.

### 3.3 Age boundary

Google is not age verification. A new account and Programme saving remain behind the existing explicit unchecked 18-or-over self-attestation. Initiating Google sign-in from the Programme claim flow requires the bounded age-attestation header, and the subsequent Programme claim mutation remains independently age-gated by server middleware. Protected Help remains open.

## 4. OAuth Programme continuation

Before claim-oriented Google sign-in, the browser may write a versioned marker containing only:

- the exact opaque journey ID;
- the fixed claim-continuation intent;
- creation and expiry timestamps; and
- the marker schema version.

The marker lives in `sessionStorage`, expires before the server claim, and is rejected and removed when malformed, stale, from the future or not equal to the current journey pointer. It contains no user-entered content, task answer, health or vulnerability inference, email, access token, consent state or arbitrary return URL.

After the OAuth callback returns to the fixed Programme route:

1. Better Auth establishes the authenticated session.
2. The browser validates the marker and exact journey pointer before exposing that journey for transition.
3. The browser sends the existing server claim cookie to the existing authenticated redemption endpoint with age confirmation.
4. The server validates the unconsumed claim, expiry and reward invariants and associates it atomically with the authenticated user.
5. Only a successful server response allows the exact local journey namespace to migrate to the authenticated user namespace; the source namespace and marker are then removed.

Failure, cancellation, expired claims, invalid markers, mismatched journeys or ordinary sign-in do not migrate anonymous content. Authentication may still succeed, but the authenticated namespace starts or resumes independently and the user receives a bounded message. OAuth errors do not expose provider payloads, tokens, emails or internal account state.

## 5. Communications purpose policy

The only recognised purposes are:

| Purpose | Authority in this foundation | Result |
|---|---|---|
| `ACCOUNT_SECURITY` | Necessary to protect or recover the user's account and initiated by an approved server workflow | Allow |
| `PROGRAMME_USER_REQUESTED_REMINDER` | The authenticated user explicitly requests that specific reminder | Allow |
| `PROGRAMME_ENGAGEMENT` | A separately recorded, current Programme-engagement opt-in exists | Allow |
| `COMMERCIAL_MARKETING` | No approved marketing consent/preference architecture exists | Deny |

Unknown purposes deny. Google sign-in, Google email verification, account creation, age confirmation, terms acceptance, Programme participation, Mission completion, streaks and dormant status never imply consent. Programme, pause, Help, Self-Check, limit or vulnerability data must not authorise or personalise commercial messages.

The release includes no preference persistence or sending workflow, so the allowed policy outcomes are architectural/test contracts rather than evidence that delivery is operational.

## 6. Server-only delivery boundary

Callers provide an authenticated user ID, a recognised purpose, the corresponding bounded authority evidence, a fixed template identifier and an idempotency key. They do not provide a recipient address, arbitrary subject, arbitrary HTML/text body, sender identity or tracking parameters.

The communication service:

1. validates the closed purpose and authority contract;
2. resolves the current account email from an injected server-side account directory;
3. renders a fixed, purpose-compatible template from bounded data;
4. chooses an approved sender category and configured reply-to value;
5. hands the message and idempotency key to the transport contract; and
6. returns a bounded delivered, duplicate, denied, unavailable or failed result without logging content or secrets.

This release provides a disabled transport for normal runtime and an in-memory adapter for deterministic tests. The transport contract requires adapters to honour idempotency. There is no public send route and no client import of the communications service.

Fixed templates cover a generic account-security notice, a user-requested Programme reminder and a Programme-engagement reminder. They do not include raw Programme content, inferred vulnerability, gambling offer data, affiliate links, behavioural tracking, open redirects, pixels or remote images. No commercial template exists.

## 7. Privacy, rights and operational records

The Privacy Policy and internal records will disclose Google identity processing, the local-first OAuth continuation boundary, current communications purposes and the absence of Gmail access, provider sending and tracking.

The processor register records Google identity as a prospective/externally configured authentication provider whose contract, locations, subprocessors, retention and UK transfer mechanism require owner evidence before release approval. It continues to record email delivery as not selected.

The retention schedule distinguishes provider account metadata and encrypted OAuth tokens from local continuation markers and future message records. The marker expires within the browser tab; active-account provider metadata follows the account lifecycle; no application-owned delivery record is created by this foundation. Provider-side retention and token lifecycle require verification.

Data-subject export continues to expose provider ID, provider account ID and scope while excluding credentials and tokens. Account deletion removes Google account and session rows through the existing deletion workflow. Provider-side revocation/deletion behaviour must be verified operationally before launch and must not be overstated.

## 8. Security and abuse controls

- CSRF/state/PKCE and callback validation remain Better Auth responsibilities; no parallel OAuth implementation is introduced.
- OAuth callbacks and callback destinations are fixed to internal routes and the exact origin contract.
- Secrets and tokens are excluded from client bundles, logs, templates, exports and error responses.
- No route accepts an arbitrary recipient, sender, subject, body, URL or purpose.
- Sender categories, templates and purposes are closed enums/unions with deny-by-default runtime validation.
- Transport failures are bounded and fail closed. The disabled adapter never simulates a successful send.
- Test adapters are not selected by a client request or Production environment input.
- Email HTML and text contain no tracking pixel, click tracking or remote image.
- Authentication rate limiting, provider abuse monitoring, revocation evidence, deliverability and suppression handling remain explicit operational activation gates.

## 9. Compatibility, rollout and rollback

Email/password sign-up and sign-in remain available. When Google credentials are absent or partial, Google UI and provider registration are absent and existing authentication behaviour is unchanged. Existing account, claim, Programme, privacy and admin schemas remain unchanged.

Rollout order is code and tests, Preview Google credential registration, exact Preview callback verification, separate Production credential registration, then a separately authorised Production deployment. A real email provider cannot be activated under this RFC.

Rollback removes the Google provider and UI while leaving email/password intact. Existing linked Google account rows remain part of the user's export/deletion scope; disabling Google must not delete or merge accounts. If Google is a user's only method, operations must provide a verified recovery path before disabling the provider in Production.

## 10. Verification obligations

Completion requires automated and manual evidence for:

- absent, partial and complete Google credential states;
- exact default identity scopes, callback and origin behaviour;
- email/password, new Google, verified same-email linking, provider-already-linked and unverified-local-account outcomes;
- public-user/staff separation;
- Google initiation and Programme mutation age enforcement, with Help remaining open;
- valid exact-journey OAuth continuation, marker expiry/mismatch/future rejection, cancellation, callback failure and ordinary-sign-in non-migration;
- server-authoritative claim redemption, no duplicate reward and source deletion only after success;
- closed communications purposes and deny-by-default policy;
- recipient resolution from server account state, fixed templates, sender categories, idempotency and disabled/test transport behaviour;
- absence of Gmail scopes, client secrets, arbitrary send routes, remote images, tracking and commercial templates;
- provider account export/deletion scope without token disclosure;
- lint, typecheck, Prisma validation, migration integrity, build-secret checks, production build, Programme/legal/privacy regressions and targeted browser journeys;
- responsive, keyboard, focus, no-JavaScript and reduced-motion behaviour; and
- Preview deployment and exact-head CI without merging the pull request.

## 11. External release gates

Repository completion does not prove external readiness. Before Google Production activation, the owner must verify the Google Cloud project/controller identity, consent screen, Production and Preview client separation, exact authorised origins and redirects, branding, test-user/publication state, incident contacts, revocation, provider terms, processor role, subprocessors, locations, retention, deletion, security evidence and UK transfer mechanism.

Before any real email delivery, a separate approved decision must select and review the provider and controller/processor roles, verify the sending domain and from/reply-to ownership, configure SPF/DKIM/DMARC, define bounce/complaint/suppression handling, approve lawful basis and user-request/opt-in evidence, design unsubscribe and preference controls where applicable, set retention and deletion rules, verify rate limits and abuse controls, establish operational monitoring and complete accessibility/content review.

Google sign-in must not be publicly described as age verification, identity assurance beyond the provider's account assertion, consent, security certification or launch approval. This implementation does not make SevenBet GB-launch-ready.

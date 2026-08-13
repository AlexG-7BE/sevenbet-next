# RFC-029: Runtime Product Polish

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `RUNTIME-PRODUCT-POLISH-01`
- **Approved:** 2026-08-13
- **Scope:** Programme microphone recovery, explicit Google account linking after trusted authentication, a standalone public login route and restoration of the existing Best Offers presentation when the published shortlist is empty
- **Base:** `fa4d86a9cc7b42001bb69f0687ffe1f23c9f4b92`
- **Depends on:** Product Vision & Principles v2.0, RFC-012, RFC-014, RFC-017, RFC-018, RFC-020, RFC-021, RFC-022, RFC-023, RFC-025, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** RFC-020 only for the exact authenticated Google `link-social` flow in section 3; RFC-012 only for the exact no-action source-controlled demonstration projection in section 5

## 1. Decision

B4GAMBLE will correct four confirmed runtime defects without changing Programme Missions, rewards, commercial policy, Production configuration or database schema:

1. microphone access remains user-initiated and gains accurate permission-state recovery;
2. a Google `account_not_linked` return gains an explicit existing-account authentication and linking journey;
3. the public shell links to a standalone `/login` experience; and
4. `/best-offers` restores its existing full comparison presentation using eligible published records when available, otherwise the existing RFC-012 source-controlled fictional dataset as a no-action demonstration.

This package is Preview-only until Founder review. It does not authorise a Production deployment, environment change, provider activation, database mutation, commercial activation or merge.

## 2. Microphone permission boundary

Microphone access is requested only from the user's `Start recording` or retry action through the existing `getUserMedia({ audio: true })` path. There is no page-load request.

The Permissions API may be queried, when supported, to distinguish `granted`, `prompt` and persistent `denied` states and observe later browser-setting changes. Query failure or absence is an `unknown` state and must retain the direct user-gesture request plus typed fallback. The experience cannot claim that B4GAMBLE can override a persistent browser block.

Experimental permission elements are not a dependency. `MediaRecorder` or `getUserMedia` absence receives a truthful unsupported-browser state. Raw audio remains short-lived in memory, uses the existing transcription API, is not persisted and is never placed in analytics. `Permissions-Policy: microphone=(self)` is unchanged.

## 3. Explicit Google link recovery

The exact recovery is:

```text
Google returns account_not_linked
→ preserve the pending Programme claim marker and local Starting Point
→ authenticate the existing email/password account
→ establish its trusted Better Auth session
→ explicitly start Better Auth linkSocial for Google
→ require the verified Google identity to use the same email
→ attach the Google account to the authenticated user
→ return to Programme
→ redeem the already-confirmed claim once
```

`requireLocalEmailVerified` remains `true`; `allowDifferentEmails` remains `false`; implicit Google sign-up remains disabled; implicit linking is not used for recovery; Google ID-token sign-in remains disabled; user information is not overwritten during linking. An email match alone is never ownership proof: the user must first prove control of the existing credential account, then complete Google OAuth while authenticated.

RFC-020's broad `/link-social` disablement is narrowed only for a session-authenticated POST whose body contains the exact Google provider and an allow-listed B4GAMBLE callback/error-callback pair. ID tokens, requested scopes, additional data, arbitrary callbacks and other providers are rejected before Better Auth. `/get-access-token`, `/refresh-token` and `/account-info` remain disabled. Existing database hooks continue to null OAuth access tokens, refresh tokens, ID tokens, expiry values and scopes on create and update.

Cancellation, wrong password, a repeated attempt or a link error never redeems the Programme claim silently. Refresh preserves the recovery state through the existing URL and sessionStorage claim authority. A successful link may resume the existing authenticated Programme claim path.

## 4. Standalone login

The signed-out desktop and mobile public-shell `Log in` links point to `/login`. The page uses the existing Better Auth client and presents Google and email/password sign-in. Account creation remains secondary and returns users to the existing Programme entry; no parallel auth system or generic-login Programme claim is introduced.

Generic Google login uses `requestSignUp: false` and therefore cannot create an account. It does not require a new Programme access proof because it grants no new Programme claim, age authority or account; the existing Programme Google callback and every social account-creation request retain the current server-verified access-proof requirement.

`returnTo` is optional. Only a same-origin root-relative application path is accepted. Protocol-relative paths, absolute URLs, backslashes, control characters and login loops are rejected to the default `/program`. OAuth callback and error URLs are generated from that validated value and are revalidated by the server auth-route boundary.

The same explicit `account_not_linked` recovery may run on `/login`: authenticate the existing email/password account, explicitly link Google and then continue to the validated destination. An already authenticated visit redirects to the validated destination unless it is an exact link-recovery return that still needs a retry choice.

## 5. Best Offers restoration

The existing server-owned ranking method and full `BestOffersExperience` remain unchanged. The source selection order is:

1. read current published offer projections;
2. use the strict GB/material-term shortlist when at least one record clears every existing gate;
3. when the published read succeeds but the shortlist is empty, project only the exact 25 RFC-012 records from the existing source-controlled temporary-production manifest and rank their already-authored synthetic terms; or
4. when the repository read fails, fail closed and show the unavailable state.

The demonstration projection is not a commercial-data substitute and is not mixed into `/bonuses`, `/casinos`, search or repository results. Exact manifest IDs are the only demo authority. Every resulting record is `DEMO_FIXTURE`, actions and raw destinations are absent, the page labels the demonstration prominently, `noindex` is used and item-list structured data is suppressed. It does not relax evidence completeness, GB selection, partner eligibility, affiliate routing or referral policy and does not fabricate a real operator or offer.

No Production reseed or data edit is authorised. Genuine current published records automatically replace the demo fallback as soon as one or more clear the unchanged shortlist gates.

## 6. Design decision ledger

The existing B4GAMBLE paper/night surfaces, Archivo type, acid primary action and teal safety semantics remain the visual authority. Reference research was used only to clarify hierarchy and recovery language:

| Reference | Adopt | Reject |
| --- | --- | --- |
| 1Password and Fingerprint sign-in patterns | one clear form column, high-trust spacing, explicit provider separation | their brand styling and generic SaaS shell |
| Skillshare and Miro auth error patterns | inline error adjacent to the next recovery action | dead-end provider errors and vague retry copy |
| Wrike sign-in/recovery flow | explicit primary recovery path plus secondary account route | multi-step password-reset expansion outside this scope |

No new design system, visual language or Programme redesign is authorised.

## 7. Verification and release gates

Required automated evidence includes permission-state unit/browser coverage, strict social-request allow-list coverage, `account_not_linked` recovery coverage, safe-return validation, public-shell navigation coverage, Best Offers published/demo/unavailable coverage, lint, type-check and production build.

Browser automation may validate state handling with controlled browser APIs, but the handoff must distinguish that from physical microphone and native permission-prompt evidence. Manual Preview checks must cover desktop and mobile login, Programme claim preservation, wrong-password/cancel/retry outcomes, Best Offers disclosure/action absence and responsive/accessibility smoke.

Unmet Programme release gates must be listed explicitly. Founder review of the Preview is required before any merge or Production request.

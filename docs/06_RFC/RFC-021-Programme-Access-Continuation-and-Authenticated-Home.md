# RFC-021: Programme Access Continuation and Authenticated Home

- **Status:** Approved
- **Decision authority:** Founder Office `GOOGLE-OAUTH-ACTIVATE-01` Preview flow correction v2.1
- **Approved:** 2026-08-10
- **Scope:** One-screen Programme access, server-verifiable bounded same-tab account/access authority, Google/email transition and authenticated Programme routing
- **Depends on:** Product Vision & Principles v2.0, RFC-002, RFC-008, RFC-017, RFC-018, RFC-019 and RFC-020
- **Supersedes:** RFC-017 and RFC-018 only where their separate age/account controls or age-only OAuth continuation cause repeated controls in one valid current-tab journey

## 1. Decision

B4GAMBLE will replace the fragmented Programme age and account-creation controls with one access screen. The screen has exactly two unchecked required controls:

1. `I confirm I am 18 or over · required`;
2. `I agree to the Terms and acknowledge the Privacy Notice · required`.

The Terms and Privacy Notice remain normal links. Terms are agreed; the Privacy Notice is acknowledged. The screen does not collect date of birth, perform KYC, grant Google consent, request marketing or reminder permission, or create a durable legal acceptance ledger.

Successful acceptance creates a bounded, versioned, same-tab access-continuation authority tied to the exact opaque anonymous journey. It permits the existing anonymous Mission 01 journey and, while valid, supplies the self-attestation and current legal-copy signals required to initiate persistent account creation. The later account form contains authentication choices only and does not repeat the controls.

Programme content claim authority remains separate. Access acceptance never authorises anonymous narrative migration. Only the existing exact claim and server redemption contract may move the current claimed local namespace to the authenticated user.

## 2. Access continuation contract

The browser stores one `sessionStorage` continuation marker containing a server-issued proof and its non-sensitive authority metadata:

- exact schema version and fixed access intent;
- exact opaque journey ID;
- creation and expiry timestamps;
- current Terms and Privacy Notice contract versions;
- adult-confirmation, Terms-agreement and Privacy-acknowledgement timestamps.
- a server-generated, purpose-separated HMAC proof over those exact claims.

The marker contains no date of birth, account, email, Google subject or token, Programme narrative, control-tool content, vulnerability signal, commercial preference or affiliate information. It is valid in the browser only when its schema, intent, journey syntax, current journey pointer, timestamps, duration, required acknowledgements, legal-copy versions and proof shape all match exactly. Browser validation is only a UX guard; it is not account-creation authority.

The time-to-live is 60 minutes. This is long enough for the approved 17–22 minute Mission 01, the earned-result account step and an OAuth redirect, while remaining bounded to the current tab. Missing, malformed, future, expired, mismatched or obsolete-version markers fail closed and return the user to the consolidated access screen.

On successful email or Google authentication, valid access authority transitions explicitly from the exact journey to the exact `user:<userId>` local subject for the remainder of its original lifetime. The transition moves access authority only. It does not move local Programme content and does not extend the expiry.

On logout, the authenticated access authority, access-continuation marker and OAuth claim marker are removed and a new opaque anonymous journey is created. The new journey inherits no access authority or private content.

## 3. Server-verifiable auth access boundary

After the two explicit controls are accepted, a dedicated same-origin endpoint issues the bounded proof. The server, not the browser, fixes the intent, proof version, purpose, current Terms version, current Privacy Notice version, issuance time and expiry. The request supplies only the exact opaque current journey and the explicit boolean affirmations. The proof uses HMAC-SHA-256 with a signing key derived from existing `BETTER_AUTH_SECRET` material under a fixed Programme-auth domain-separation label. Raw secret material is never returned, logged or placed in browser storage.

The Better Auth application route verifies the proof signature and every current claim before allowing either persistent email account creation or Google authentication. It also requires the separately supplied exact journey to equal the signed journey. The legacy static age, Terms and Privacy headers are not proof and cannot authorize these boundaries, even when all three values are forged correctly.

This applies to:

- `POST /api/auth/sign-up/email`;
- `POST /api/auth/sign-in/social` for both returning access and `requestSignUp === true` account creation.

Returning email sign-in does not require the proof because it cannot create an account. Returning Google sign-in requires current signed access authority, preserving the approved adult access boundary without treating Google identity as age verification; it is not recorded as a new durable legal acceptance. The existing Google request allow-list, fixed callbacks and provider restriction remain.

Missing, malformed, modified, expired, future-issued, wrong-duration, wrong-intent, wrong-version, wrong-purpose, obsolete-copy, invalid-signature or wrong-journey proofs fail closed with `403`. Secret rotation invalidates outstanding proofs. The proof is a bounded bearer authority and may be replayed only within its original lifetime and signed journey; no one-time-use claim is made without server state. An attacker can truthfully submit the same self-attestation endpoint as a user can tick the controls, but cannot fabricate or alter server authority merely by choosing headers. This decision proves current server issuance and integrity, not DOB/KYC or the identity of the person making the self-attestation.

No database field, acceptance history, schema migration or dependency is introduced. If durable legal acceptance evidence becomes required, it needs a separate legal/schema decision.

## 4. Authenticated Programme resolver

Every Programme header derives account state from the settled Better Auth session, never from Mission number, view, local subject kind, claim state or Dashboard availability. While the session is loading, the interface shows a bounded loading state and does not settle on a false `Log in` treatment.

`/program` resolves the session before choosing its durable view:

- authenticated user with progress → server-authoritative Dashboard/current Mission;
- authenticated user without an enrollment → server-authoritative empty Programme home with Mission 01 current and explicitly startable;
- unauthenticated user → the approved consolidated access/onboarding path.

`My Programme` means the authenticated home/resume state. `Start the 10-Step Program` means onboarding/start. Both may use `/program`, but the session and entry state must preserve those distinct semantics. A fresh authenticated user is not dropped directly into Mission 01 and never sees a logged-out Programme header.

The empty authenticated Dashboard is a server DTO assembled from the approved Mission registry. It reports exactly `0 XP`, zero completed Missions and Mission 01 as current. Its visual treatment names only Mission 01 and an explicit start action; Mission 02, a 7-day goal and the `FIRST PLAN` achievement do not impersonate current or earned progress. Progressed-user Dashboard behaviour is unchanged. The client does not calculate Mission eligibility, XP, progress or the next Mission.

## 5. OAuth transition and security

The access-continuation marker and `PROGRAMME_CLAIM_GOOGLE` marker remain distinct. A valid Google callback may establish the Better Auth session, transition current access authority and then, only when the separate claim marker and server claim are valid, redeem Programme progress.

A successful callback cleans the temporary `auth` query state. A replayed or consumed Google callback remains rejected by the Better Auth state/PKCE boundary together with Google's one-use authorization-code validation and must not create a second account, session mutation or redirect loop.

RFC-020 remains fully in force: Better Auth stays at `1.6.23`; access, refresh and ID tokens, expiry metadata and scope remain `null`; direct ID-token sign-in and explicit provider-management/token endpoints remain disabled; linking safeguards remain unchanged.

## 6. Design and content contract

This is not a redesign. The existing Programme shell, typography, color, spacing, controls, focus treatment and responsive structure remain the visual authority. The access screen is one deliberate decision step with one primary action, the two required controls, concise no-DOB/KYC/no-marketing copy and an always-available Protected Help link.

The account-creation screen shows Google and email/password choices without duplicate compliance checkboxes. Google remains described as identity only, not age verification or marketing consent.

## 7. Privacy and commercial containment

Access and authentication state is not available to casino or bonus ranking, operator selection, affiliate routing, retargeting, commercial personalisation, Programme AI or risk scoring. GB remains `editorialAllowed = true`, `commercialAllowed = false`, `referralAllowed = false`.

Protected Help remains available without acceptance, account or Programme completion.

## 8. Verification and release boundary

Automated evidence must cover consolidated-screen content and disabled state, signed proof issuance, static-header forgery rejection, signature/expiry/original-duration/version/purpose/copy/journey tamper rejection, email and Google signup enforcement, returning sign-in policy, Google callback transition, fresh and progressed authenticated homes, refresh/navigation consistency, logout/User A→B isolation, content-claim separation, callback replay rejection, RFC-020 regressions and commercial/privacy firewalls.

No Prisma schema, migration, dependency, package-lock, Production credential, Production environment, Production database, email, analytics, CMP, commercial, affiliate or AI change is authorised.

Repository completion is not real Google Preview completion. Founder Office must point the separate Preview client and environment-scoped credential pair at the new stable branch alias, redeploy exact head and complete the controlled real-Google journey before merge consideration. Production Google OAuth remains off. Founder Office alone performs any merge.

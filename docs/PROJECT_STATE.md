# Project State

## Snapshot

- **Reconciled:** 2026-08-10
- **Current main at implementation base:** `240dff31537bf4f42978ad7aebe94ae6b60074cc`
- **UX-PERF-01:** [PR #56](https://github.com/AlexG-7BE/sevenbet-next/pull/56) merged into current main.
- **LEGAL-02:** analysis complete; Founder Office decisions accepted.
- **LEGAL-IMPL-01:** **CLOSED**; [PR #57](https://github.com/AlexG-7BE/sevenbet-next/pull/57) is merged in current main.
- **AUTH-COMMS-01:** **CLOSED**; [PR #58](https://github.com/AlexG-7BE/sevenbet-next/pull/58) is merged in current main.
- **BRAND-CUTOVER-01:** **CLOSED**; [PR #59](https://github.com/AlexG-7BE/sevenbet-next/pull/59) is merged in current main.
- **AUTH-HARDEN-01:** **CLOSED**; [PR #60](https://github.com/AlexG-7BE/sevenbet-next/pull/60) is merged in current main under RFC-020.
- **GOOGLE-OAUTH-ACTIVATE-01:** **CLOSED**; [PR #61](https://github.com/AlexG-7BE/sevenbet-next/pull/61) merged head `d129130acd982624aa7cf5d31ce4a8b8e81dfa58` into current main as `324a5b51e2e37f456c2386413a6d6c4831607914`. RFC-021 v2.1 remains the architecture authority for the merged access, authentication-continuation and authenticated-Programme runtime.
- **Production:** <https://b4gamble.com> reached **READY** after the merge and continues to serve the B4GAMBLE consumer identity and canonical authority. Production Google OAuth remains **OFF**; Production Google credentials are **not detected**, and Google remains identity-only rather than age verification or KYC.
- **PROGRAM-AI-IMPL-01A:** **BOUNDED M1 FOUNDATION + PREVIEW VERTICAL SLICE IMPLEMENTED ON FEATURE BRANCH; PR/PREVIEW EVIDENCE PENDING**. Founder Office authority and [RFC-022](06_RFC/RFC-022-PROGRAM-AI-M1-Foundation-and-Preview-Vertical-Slice.md) supersede the earlier implementation stop only for this bounded package. `PROGRAM_AI_V1_ENABLED` is server-controlled, exact-`true` and default-off; Production configuration is unchanged and legacy M1 remains the default runtime. No real AI/transcription provider or SDK is connected.
- **Commercial state:** GB editorial access available; GB commercial/referral capability **OFF**; affiliate engine **OFF**; no real GB partner authority detected.
- **Launch state:** **NOT GB LAUNCH READY.** Internal legal/privacy remediation does not close external legal, regulatory, partner, processor, recovery or operations gates.

| Gate | Current state |
| --- | --- |
| LEGAL-02 | **ANALYSIS COMPLETE** |
| LEGAL-IMPL-01 | **CLOSED — PR #57 MERGED** |
| AUTH-COMMS-01 | **CLOSED — PR #58 MERGED** |
| BRAND-CUTOVER-01 | **CLOSED — PR #59 MERGED** |
| AUTH-HARDEN-01 | **CLOSED — PR #60 MERGED** |
| GOOGLE-OAUTH-ACTIVATE-01 | **CLOSED — PR #61 MERGED** |
| Google login code | **IDENTITY-ONLY BASELINE; CONTROLLED PREVIEW E2E VERIFIED** |
| Google Production credentials | **NOT DETECTED — PRODUCTION GOOGLE OAUTH OFF** |
| Email communication architecture | **READY — provider-independent, disabled transport** |
| Email provider | **OPEN — NOT SELECTED** |
| Programme reminder delivery | **NOT YET ACTIVE** |
| Programme reminder permission architecture | **DEFINED** |
| Commercial marketing email | **DISABLED** |
| PROGRAM-AI-IMPL-01A | **IMPLEMENTED ON FEATURE BRANCH — DEFAULT OFF; PR/PREVIEW GATES PENDING** |
| Fixture truthfulness | **CLOSED — exact-ID demo disclosure/action/SEO/schema controls tested** |
| Privacy complaints | **CLOSED — public policy and operating runbook implemented** |
| Protected data firewall | **CLOSED / STRENGTHENED** |
| Local-first Programme | **IMPLEMENTED — historic raw rows remain under export/erasure; cleanup open** |
| Age | **PARTIAL — UI/request enforcement implemented; durable evidence P1 open** |
| UK representative | **OPEN EXTERNAL** |
| ICO fee | **OPEN EXTERNAL** |
| Real partner | **OPEN** |
| Commercial/referral | **OFF** |
| Recovery | **OPEN / PARTIAL** |

## Governing product boundary

Product Vision & Principles v2.0 remains constitutional authority. RFC-017 governs the merged legal/privacy remediation. RFC-018 governs AUTH-COMMS-01 and authorises only bounded Google identity authentication and the disabled communication foundation. RFC-019 governs the merged consumer brand and Production canonical authority. RFC-020 supersedes RFC-018 for Google credential persistence, direct ID-token sign-in, provider-token/account-management paths and public sign-out. RFC-021 v2.1 governs the merged current-runtime Programme access, Google/email continuation and authenticated-home contract. RFC-022 authorises only the default-off PROGRAM-AI M1 foundation and Preview vertical slice. None authorises reminders, marketing, Production Google activation or a real Programme AI/transcription provider.

The [PROGRAM-AI-01 Product Direction v2.2](07_Decisions/PROGRAM-AI-01-Product-Direction-v2.2.md) remains target product direction. Founder Office `PROGRAM-AI-IMPL-01A` and RFC-022 provide the separate bounded implementation authority that document required. The current hard-coded Programme remains frozen for unrelated expansion and remains the runtime whenever the new flag is absent or malformed. Missions 02–04 reward amounts are unchanged.

B4GAMBLE, the consumer brand approved to replace SevenBet under RFC-019, is positioned as adult gambling education, private behavioural reflection, decision support, personal-boundary planning and transparent comparison. It is not positioned as treatment, therapy, rehabilitation, clinical assessment, recovery-to-gambling or a product that makes gambling safe.

## Detected implementation

### Public truthfulness and commercial containment

- Exact RFC-012 IDs classify temporary fictional casinos and related offer inventory through a server-owned authority.
- Demo casino, profile, bonus and best-offer surfaces disclose fictional demonstration state and expose no commercial action.
- Demo-only and mixed public inventory is `noindex, follow`; commercial item/list/review/offer schema is suppressed where it could present demo records as real.
- Future non-demo inventory must still pass GB jurisdiction, partner, offer, link, bonus and redirect authority before any commercial action appears.
- Affiliate compensation does not determine Editor Score or natural editorial ranking. Any future paid placement must be separately identified.
- Bounded public-claims tests cover high-risk safety, treatment, recovery, verification and independence language.

### Active Control Programme — current implementation

- Missions 01–04 retain server-owned progression, deterministic XP, achievements, active days, streak inputs and next-Mission state.
- Raw M1–M4 narrative is local-first in React state and subject-isolated, tab-scoped `sessionStorage`: random anonymous journey before authentication and actual Better Auth user ID after authentication. Exact current-claim migration removes its anonymous source; subject changes fail closed before rendering. Active server DTOs use exact allow-lists and reject unexpected sensitive fields.
- Required legacy text columns receive neutral implementation markers. Active presenters redact historic raw narrative.
- Legacy reflection creation is retired with `410 LOCAL_ONLY_CONTENT` before request-body parsing; authenticated access/export/deletion remains.
- The Programme entry uses one unchecked two-control access screen for 18+ confirmation plus current Terms agreement/Privacy Notice acknowledgement. The server issues a versioned, purpose-separated HMAC proof containing fixed current legal-copy claims and an original 60-minute lifetime, bound to the exact opaque journey. The same-tab marker moves after authentication to the exact Better Auth user without extending expiry and remains separate from the ten-minute OAuth/content-claim marker. Email account creation and all Google authentication verify the signed proof and exact journey; forged legacy age/Terms/Privacy headers alone fail. Returning email sign-in remains proof-free. Non-GET Programme API requests retain their separate bounded age header policy.
- Client marker validation remains a non-cryptographic UX guard: it accepts a server-issued `createdAt` at most five minutes ahead of the browser clock, while enforcing immediate client expiry, the exact original 60-minute duration, current versions/purpose/legal copy, exact journey and proof shape. Materially future markers fail; strict server time/signature verification remains the final account-creation authority. Access-screen failures use a safe retry message rather than internal architecture text.
- Actual Better Auth session state owns Programme headers and direct `/program` resolution. Authenticated users receive a server-projected personal home even before enrollment; that empty projection is Mission 01 current/startable, zero XP and zero completed Missions. Public Start controls use an explicit start entry while My Programme resolves to the personal home.
- Authenticated Mission 01 drafts/completion are user-owned and never read the anonymous Programme cookie. A successful pending claim retires the anonymous session and migrates only the exact local journey; an expired/missing/conflicting claim settles to the truthful authenticated zero-progress home with the old journey isolated. Transient claim retry remains user-authoritative and completion/XP stays exactly-once.
- Protected Help remains accessible without age or Programme completion gating and remains commercially isolated.
- Structural tests prevent Programme, Self-Check, personal-limit, Help, vulnerability and local-session state from entering commercial modules or DTOs.

### PROGRAM-AI M1 foundation — detected on the implementation branch

- A server-only, exact-`true` `PROGRAM_AI_V1_ENABLED` gate selects the new experience. Every new service operation denies while disabled; missing/malformed values render the legacy Programme.
- Entry uses exactly the RFC-021 18+ and combined Terms/Privacy controls. Session creation now verifies the current signed exact-journey proof server-side; no/static/forged/mismatched/expired/stale-copy proofs deny before anonymous session creation.
- The combined mobile/desktop intake keeps concise JIT disclosure, one narrow Article 9 authority and text/recorder input on one surface. Typed input completes the entire path. The recorder has idle, permission, recording, stop, cancel, denied, transcribing and error/fallback states; no audio is uploaded.
- Raw audio, typed situation, clarification answers and candidate drafts remain in memory or exact-subject tab `sessionStorage`. Database drafts contain only structural lifecycle/input-mode/clarification-count state. Successful claim clears the anonymous browser namespace.
- Provider-neutral `TranscriptionPort` and `ProgrammeAiPort` contracts exist with no adapters. The runtime truthfully produces a user-controlled editable fallback and never claims AI analysis.
- `ProgrammeSensitiveInputAuthority` and `ProgrammeStartingPoint` are the only new schema concepts. Authority is database-constrained to anonymous-only before claim and user-only afterward; active `confirmedAt` is immutable, clarification cannot reconfirm, and withdrawal requires a new explicit intake action. Starting Point persistence is `USER_CONFIRMED`, exact-once and inside the existing Serializable claim transaction.
- M1 awards use distinct versioned `20 + 20` step-completion keys. Clarification and registration award zero. Existing complete M1, higher progress or an existing Starting Point dominates an anonymous collision and receives no duplicate/new M1 reward.
- Feature-on Home projects exact current/completed/locked Mission state without percentages. Review entitlement is limited to completion of M3, M6 and M10. Existing Missions 02–04 continue through their current vertical services.
- Commercial import/DTO firewall, raw-data, runtime-gate, signed-entry, authority-transition, provider-output, legacy-collision and exact-once structural tests are included. An isolated feature-on browser lane covers real Better Auth email/claim persistence and a feature-off lane asserts the legacy runtime. Data-subject export/deletion includes both new concepts.

### Active Control Programme — deferred target beyond RFC-022

- **Approved direction:** retain a deterministic public 10-Step Programme structure and outcomes, add bounded AI-guided personalised interaction, keep progression/rewards server-owned, and preserve regulated safety/compliance boundaries.
- **Mission 01 target:** a short voice-first or typed Situation Intake should provide first personalised value before registration, with P75 fewer than 90 seconds to first personalised value and P75 fewer than 120 seconds to the registration CTA as Product targets, not guarantees. Google is the primary registration continuation and email the secondary route. It must not become diagnosis, therapy, clinical intake, a long questionnaire or another static lesson.
- **Approved Mission 01 XP direction:** first valid substantive situation submission `+20 XP`; clarification `0 XP`; successfully completed Starting Point `+20 XP`; registration `0 XP`; total `40 XP` before registration. Rewards remain deterministic, server-authoritative and exactly-once; AI does not decide amounts, eligibility, completion or Review entitlement.
- **Approved Review direction:** Mission 01's Starting Point is not a separate Review. Mission 03 completion unlocks the First Personal Review, Mission 06 completion unlocks the Mid-Programme Personal Review and Mission 10 completion unlocks the Full Programme Personal Review. Raw or farmed XP cannot bypass those milestones; exact cumulative display thresholds are derived later from the final deterministic reward budget.
- **Missions 02–10 balancing hypothesis:** `+25 XP` is the default completion-bonus assumption, not an immutable reward amount. Final per-Mission mapping may adjust it deterministically; AI cannot change it dynamically.
- **Data and authority boundary:** raw Programme narrative, AI-generated Programme summaries and vulnerability-derived Programme information must not become commercial recommendation inputs. AI may later support bounded conversation, clarification, explanation, personalisation, reflection and approved synthesis, but it may not independently control legal/age gates, safety policy, commercial routing, deterministic progression or reward integrity.
- **Delivery boundary:** RFC-022 closes authority only for the M1 foundation/Preview slice. Real providers, Production activation, generated Personal Reviews, Missions 05–10, a general orchestration platform, provider data transfers/training terms and wider target architecture remain separately gated.

### Privacy operations

- Privacy copy describes the local-first Programme boundary, one-month rights workflow, complaint escalation and the unappointed UK-representative gap.
- The internal data-subject CLI performs deterministic account lookup, structured JSON export and ordered relation-count deletion planning, including consumed claims and linked/draft-bearing anonymous sessions.
- Exact claimant-owned consumed claims and anonymous sessions are deleted before the User; other users, unconsumed journeys and global content remain outside scope. Deletion is dry-run by default. Output files are exclusive mode `0600`. Every execution requires an exact general user confirmation; Production requires a second exact confirmation and explicit target declaration.
- Retention, processor/international-transfer, breach and DPIA draft documents distinguish detected, target and unknown facts without inventing contracts or appointments.

### Authentication and communication foundation

- Optional Google identity authentication is integrated through Better Auth and appears only when both server-only credentials are complete. The accepted request is restricted to fixed internal callbacks, explicit sign-up intent and the installed `openid`, `email` and `profile` identity scopes; Gmail and other Google product scopes are absent.
- The merged AUTH-HARDEN-01 baseline strips access, refresh and ID tokens, expiry metadata and scope through Better Auth create/update hooks before persistence; disables direct client ID-token sign-in and the explicit link/token/account-info endpoints; and retains the normal redirect callback, session and sign-out endpoints.
- A ten-minute, tab-scoped marker continues only the exact opaque anonymous Programme journey through OAuth. It contains no narrative, email, token or reward data. Exact success redeems the server claim and migrates only that local namespace; cancellation preserves it, while stale or mismatched markers deny.
- Same-email linking is limited to verified Google identity plus an already verified local account. Different-email linking, provider-account reassignment, implicit sign-up, staff elevation and client-authored scope/callback expansion remain denied.
- In Vercel Preview only, the exact current `VERCEL_URL` deployment host is a redirect source, never auth authority. Edge middleware issues a method-preserving temporary redirect to the exact `VERCEL_BRANCH_URL` branch host before rendering or Better Auth, preserving path and query. Stable-host requests continue without redirect; malformed metadata and unexpected Preview hosts fail closed. Better Auth still trusts only the exact branch origin, so no wildcard or ephemeral deployment host enters its allowlist and tab-scoped Programme/OAuth/journey state remains same-origin.
- **Detected Founder-controlled Preview evidence, 2026-08-10:** Google credentials/configuration were active only for the isolated Preview branch. A real Google Test User completed `POST /api/auth/sign-in/social` with `200`, `GET /api/auth/callback/google` with `302`, and established an authenticated Better Auth session. The consolidated access screen passed; account creation introduced no duplicate age, Terms or Privacy controls; and Google remained identity-only rather than age verification. The isolated Preview Control Programme was seeded with B4GAMBLE naming. After the discovered post-OAuth claim defect was corrected, authenticated Mission 01 used the user-owned endpoints and the final authenticated Mission 01 smoke succeeded. Logout then produced a fresh isolated anonymous journey and required the consolidated access gate again.
- The authenticated Programme header exposes bounded sign-out and starts a fresh anonymous subject after success; account-scoped browser content remains isolated for the same user.
- Communication purposes are closed and server-owned. Account/security and Programme reminder contracts have fixed non-commercial templates; Programme engagement requires separate opt-in; commercial marketing denies. Delivery remains disabled because no provider, scheduler or preference store is selected.

### Platform and delivery baseline

- FE-MIG, FE-GAP, FE-DS, OPS-01, ENV-ISO-01, GB-MARKET-01, COMM-01, UX-PERF-01, LEGAL-IMPL-01, AUTH-COMMS-01 and BRAND-CUTOVER-01 are merged on main.
- RFC-020 governs merged AUTH-HARDEN-01. RFC-021 v2.1 governs the merged GOOGLE-OAUTH-ACTIVATE-01 current runtime. PR #61 is closed and merged; it added no Prisma/schema/migration/dependency or protocol-provider change.
- Preview and Production use isolated database/auth/admin authority. No Production data is copied into Preview.
- CI includes structural, browser, build-secret and migration/fresh-database gates; scheduled Production smoke remains active.
- Recovery is **PARTIAL** because no verified provider snapshot/PITR restore point is available under the current provider plan.

## Evidence classification

- **Detected:** base main `240dff31537bf4f42978ad7aebe94ae6b60074cc`; Missions 01–04 vertical services and deterministic reward policies; the default-off RFC-022 PROGRAM-AI M1 code, two additive models/migration, provider-neutral ports with no adapters, typed fallback path, recorder state UI, exact claim compatibility, Home/Review entitlement projection, commercial firewall tests and updated account export/deletion operations on the implementation branch.
- **Inferred:** neutral legacy markers preserve existing progression/reward relations without a schema change while avoiding new raw narrative persistence.
- **Planned:** RFC-022 branch PR/Preview verification; any real Programme AI/transcription provider decision; generated Reviews; Missions 05–10; any separately authorised Production Google or PROGRAM-AI activation; an approved email transport; COMMS-REMINDER-01; durable age evidence; distributed Programme rate limiting; automated anonymous-data purge; approved legacy raw-data cleanup; and recovery architecture.
- **Not detected:** a runtime Programme AI or speech-provider adapter; external AI/audio call; Production PROGRAM-AI flag activation; Production Google credentials or provider activation; an email provider, preference store, scheduler or Production email send; DOB/KYC; durable age-attestation evidence; completed UK representative/ICO/counsel/processor-transfer gates; a real signed GB partner; Production affiliate activation; or a successful restore drill.

## Remaining release gates

### External legal and regulatory

- Appoint a qualifying UK representative or record the legally approved alternative; none is currently appointed.
- Complete ICO registration/fee assessment and payment where required; outcome remains open.
- Obtain outside-counsel review of the launch package, privacy/legal copy, age approach and closed-beta constraints.
- Verify processor/subprocessor contracts, locations, retention, international transfers and the applicable transfer mechanism.
- Complete and approve the DPIA; the repository document is a working draft, not sign-off.

### Product, data and partners

- Replace or remove RFC-012 fictional data before genuine regulated commercial operation.
- Contract and manually approve 1–3 eligible GB operators only under a separately authorised closed beta.
- Supply and verify current licence, exact-domain, agreement, offer, material-condition, tracking-link and redirect evidence.
- Keep commercial/referral policy and the affiliate engine off until those gates are separately approved.
- Before any real provider or Production activation, close the still-open provider/DPIA/processor/transfer/training, operational safety, retention/deletion and human-review evidence identified by workstream 45 and RFC-022.

### Engineering and operations

- Keep Production Google OAuth off. Any future Production Google Web client, credentials, exact origins/callbacks and consent-screen evidence require a separate Founder-authorised activation and must remain isolated from the verified Preview configuration.
- Select and approve a B4GAMBLE-controlled sending domain, sender mailboxes and email transport before any delivery work. SPF, DKIM, DMARC, TLS, bounce/complaint handling and monitoring remain open. Actual reminders require COMMS-REMINDER-01 and an appropriate preference/opt-out decision.
- Implement durable age-attestation evidence under an approved schema/privacy decision. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**
- Select a distributed Programme limiter and automated expired-session/claim purge.
- Approve legacy Programme-content retention/cleanup after access, export and erasure safeguards.
- Complete RECOVERY-01 with a governed backup architecture and isolated restore drill.
- Close remaining multi-process concurrency, autosave ordering, APM/paging and operational evidence gaps.

## Release conclusion

LEGAL-IMPL-01, AUTH-COMMS-01, BRAND-CUTOVER-01, AUTH-HARDEN-01 and GOOGLE-OAUTH-ACTIVATE-01 are closed on base main. Production Google OAuth remains off. PROGRAM-AI-IMPL-01A is implemented on its focused branch under RFC-022 but remains default-off and pending PR/Preview evidence. It does not activate Google or PROGRAM-AI in Production, connect runtime AI/voice providers, enable email/reminders, mutate Production data, activate commercial traffic or make B4GAMBLE GB launch-ready.

# Project State

## Snapshot

- **Reconciled:** 2026-08-10
- **Current main:** `324a5b51e2e37f456c2386413a6d6c4831607914`
- **UX-PERF-01:** [PR #56](https://github.com/AlexG-7BE/sevenbet-next/pull/56) merged into current main.
- **LEGAL-02:** analysis complete; Founder Office decisions accepted.
- **LEGAL-IMPL-01:** **CLOSED**; [PR #57](https://github.com/AlexG-7BE/sevenbet-next/pull/57) is merged in current main.
- **AUTH-COMMS-01:** **CLOSED**; [PR #58](https://github.com/AlexG-7BE/sevenbet-next/pull/58) is merged in current main.
- **BRAND-CUTOVER-01:** **CLOSED**; [PR #59](https://github.com/AlexG-7BE/sevenbet-next/pull/59) is merged in current main.
- **AUTH-HARDEN-01:** **CLOSED**; [PR #60](https://github.com/AlexG-7BE/sevenbet-next/pull/60) is merged in current main under RFC-020.
- **GOOGLE-OAUTH-ACTIVATE-01:** **CLOSED**; [PR #61](https://github.com/AlexG-7BE/sevenbet-next/pull/61) merged head `d129130acd982624aa7cf5d31ce4a8b8e81dfa58` into current main as `324a5b51e2e37f456c2386413a6d6c4831607914`. RFC-021 v2.1 remains the architecture authority for the merged access, authentication-continuation and authenticated-Programme runtime.
- **Production:** <https://b4gamble.com> reached **READY** after the merge and continues to serve the B4GAMBLE consumer identity and canonical authority. Production Google OAuth remains **OFF**; Production Google credentials are **not detected**, and Google remains identity-only rather than age verification or KYC.
- **PROGRAM-AI-01:** **PRODUCT/COMPLIANCE WORKSTREAM COMPLETED — PRODUCT DIRECTION v2.2 FOUNDER APPROVED / GO**. The [final workstream-40 handoff](08_Research/PROGRAM-AI-01-Product-Compliance-Architecture-Handoff.md) is tracked as Research/Product evidence. Implementation remains **STOP / NOT AUTHORISED**; workstream 45 — Legal & Compliance is the next gate before any bounded Design or Backend/CMS architecture work.
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
| PROGRAM-AI-01 | **PRODUCT/COMPLIANCE COMPLETED — DIRECTION v2.2 APPROVED / GO; IMPLEMENTATION BLOCKED** |
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

Product Vision & Principles v2.0 remains constitutional authority. RFC-017 governs the merged legal/privacy remediation. RFC-018 governs AUTH-COMMS-01 and authorises only bounded Google identity authentication and the disabled communication foundation. RFC-019 governs the merged consumer brand and Production canonical authority. RFC-020 supersedes RFC-018 for Google credential persistence, direct ID-token sign-in, provider-token/account-management paths and public sign-out. RFC-021 v2.1 governs the merged current-runtime Programme access, Google/email continuation and authenticated-home contract. None authorises reminders, marketing, Production Google activation or Programme AI.

The [PROGRAM-AI-01 Product Direction v2.2](07_Decisions/PROGRAM-AI-01-Product-Direction-v2.2.md) is Founder-approved target product direction and is not an implementation RFC. The current hard-coded Programme is frozen for further product/content expansion under its previous static model. That freeze does not delete or disable the deployed Missions 01–04, change their current order, prerequisites, content intent or reward amounts, or weaken their runtime privacy, safety and exactly-once guarantees.

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

### Active Control Programme — approved target product direction, not implemented

- **Approved direction:** retain a deterministic public 10-Step Programme structure and outcomes, add bounded AI-guided personalised interaction, keep progression/rewards server-owned, and preserve regulated safety/compliance boundaries.
- **Mission 01 target:** a short voice-first or typed Situation Intake should provide first personalised value before registration, with P75 fewer than 90 seconds to first personalised value and P75 fewer than 120 seconds to the registration CTA as Product targets, not guarantees. Google is the primary registration continuation and email the secondary route. It must not become diagnosis, therapy, clinical intake, a long questionnaire or another static lesson.
- **Approved Mission 01 XP direction:** first valid substantive situation submission `+20 XP`; clarification `0 XP`; successfully completed Starting Point `+20 XP`; registration `0 XP`; total `40 XP` before registration. Rewards remain deterministic, server-authoritative and exactly-once; AI does not decide amounts, eligibility, completion or Review entitlement.
- **Approved Review direction:** Mission 01's Starting Point is not a separate Review. Mission 03 completion unlocks the First Personal Review, Mission 06 completion unlocks the Mid-Programme Personal Review and Mission 10 completion unlocks the Full Programme Personal Review. Raw or farmed XP cannot bypass those milestones; exact cumulative display thresholds are derived later from the final deterministic reward budget.
- **Missions 02–10 balancing hypothesis:** `+25 XP` is the default completion-bonus assumption, not an immutable reward amount. Final per-Mission mapping may adjust it deterministically; AI cannot change it dynamically.
- **Data and authority boundary:** raw Programme narrative, AI-generated Programme summaries and vulnerability-derived Programme information must not become commercial recommendation inputs. AI may later support bounded conversation, clarification, explanation, personalisation, reflection and approved synthesis, but it may not independently control legal/age gates, safety policy, commercial routing, deterministic progression or reward integrity.
- **Delivery boundary:** Product/Compliance workstream 40 is complete and its detailed handoff is tracked. Workstream 45 — Legal & Compliance is next. Bounded Product Design and Backend/CMS architecture may begin only after Founder Office accepts the Legal data envelope. Implementation requires a later Founder-authorised RFC or equivalent bounded implementation authority; no implementation RFC is authorised now.

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

- **Detected:** current main `324a5b51e2e37f456c2386413a6d6c4831607914`; Missions 01–04 routes, vertical application services and deterministic reward policies; local-first subject-isolated active Programme narrative; server allow-lists; redacted presenters; consolidated subject-scoped access marker backed by current purpose-separated server HMAC authority; session-derived Programme home/header routing; truthful zero-progress Dashboard; exact Preview deployment-to-branch host canonicalisation before rendering/auth; bounded stable-origin-only Google/Better Auth configuration; successful Founder-controlled real Google Test User Preview OAuth and final authenticated Mission 01/logout smoke; identity-only account hooks; restricted auth paths and separate OAuth-claim continuation; closed communication-purpose and protected-content firewalls; demo disclosure/SEO/schema/action containment; commercial firewall; account export/deletion operations including exact consumed-journey erasure; substantive compliance runbooks.
- **Inferred:** neutral legacy markers preserve existing progression/reward relations without a schema change while avoiding new raw narrative persistence.
- **Planned:** implementation of the Founder-approved PROGRAM-AI-01 target direction only after the Legal/Compliance, Founder, Design/Backend architecture and later implementation-authority gates; any later separately authorised Production Google client configuration/activation; an approved email transport decision; COMMS-REMINDER-01; durable age evidence; distributed Programme rate limiting; automated anonymous-data purge; approved legacy raw-data cleanup; and recovery architecture. Planned Programme AI direction is not implemented functionality.
- **Not detected:** runtime Programme AI or speech-provider integration; Production Google credentials or Production provider activation; an email provider, preference store, scheduler or Production email send; DOB/KYC; durable age-attestation evidence; a completed UK representative appointment; a confirmed ICO registration/fee outcome; outside-counsel sign-off; verified complete processor/transfer evidence; a real signed GB partner; real eligible offer/link authority; Production affiliate activation; or a successful restore drill.

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
- Complete workstream 45 — Legal & Compliance across legal classification, voice/transcript/raw narrative, Article 6/9, derived profiles, AI DPIA, profiling/automated decisions, crisis/safety, memory, transparency, retention/deletion, provider DPA/subprocessors/transfers/training/human review and commercial-data separation. Only after Founder acceptance of that envelope may bounded Product Design and Backend/CMS architecture proceed; later Founder implementation authority remains mandatory.

### Engineering and operations

- Keep Production Google OAuth off. Any future Production Google Web client, credentials, exact origins/callbacks and consent-screen evidence require a separate Founder-authorised activation and must remain isolated from the verified Preview configuration.
- Select and approve a B4GAMBLE-controlled sending domain, sender mailboxes and email transport before any delivery work. SPF, DKIM, DMARC, TLS, bounce/complaint handling and monitoring remain open. Actual reminders require COMMS-REMINDER-01 and an appropriate preference/opt-out decision.
- Implement durable age-attestation evidence under an approved schema/privacy decision. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**
- Select a distributed Programme limiter and automated expired-session/claim purge.
- Approve legacy Programme-content retention/cleanup after access, export and erasure safeguards.
- Complete RECOVERY-01 with a governed backup architecture and isolated restore drill.
- Close remaining multi-process concurrency, autosave ordering, APM/paging and operational evidence gaps.

## Release conclusion

LEGAL-IMPL-01, AUTH-COMMS-01, BRAND-CUTOVER-01, AUTH-HARDEN-01 and GOOGLE-OAUTH-ACTIVATE-01 are closed on current main. Production reached READY after the PR #61 merge, but Production Google OAuth remains off. PROGRAM-AI-01 Product/Compliance workstream 40 is completed and Product Direction v2.2 is Founder-approved / GO; implementation remains STOP / not authorised with workstream 45 — Legal & Compliance next. Neither the merged OAuth runtime nor the PROGRAM-AI-01 direction activates Google in Production, runtime AI, voice processing, email delivery, reminders, commercial beta, Production data mutation, partner traffic or GB launch.

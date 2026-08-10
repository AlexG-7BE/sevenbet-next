# Project State

## Snapshot

- **Reconciled:** 2026-08-10
- **Current main:** `9c3e1aab825bdc5a6cb587a7efb8d030b8e4ea4c`
- **UX-PERF-01:** [PR #56](https://github.com/AlexG-7BE/sevenbet-next/pull/56) merged into current main.
- **LEGAL-02:** analysis complete; Founder Office decisions accepted.
- **LEGAL-IMPL-01:** **CLOSED**; [PR #57](https://github.com/AlexG-7BE/sevenbet-next/pull/57) is merged in current main.
- **AUTH-COMMS-01:** **CLOSED**; [PR #58](https://github.com/AlexG-7BE/sevenbet-next/pull/58) is merged in current main.
- **BRAND-CUTOVER-01:** **CLOSED**; [PR #59](https://github.com/AlexG-7BE/sevenbet-next/pull/59) is merged in current main.
- **AUTH-HARDEN-01:** **CLOSED**; [PR #60](https://github.com/AlexG-7BE/sevenbet-next/pull/60) is merged in current main under RFC-020.
- **GOOGLE-OAUTH-ACTIVATE-01:** RFC-021 v2.1 correction candidate on `codex/google-oauth-activate-01-b4gamble`; consolidates Programme access confirmation, adds current server-verifiable bounded auth authority, preserves separate OAuth/content-claim continuation, and makes actual Better Auth session state authoritative for Programme home/header routing. External Preview credential reconfiguration and real-provider E2E remain Founder-controlled.
- **Production:** <https://b4gamble.com> serves the merged B4GAMBLE consumer identity and canonical authority. Google credentials and external provider activation remain absent.
- **Commercial state:** GB editorial access available; GB commercial/referral capability **OFF**; affiliate engine **OFF**; no real GB partner authority detected.
- **Launch state:** **NOT GB LAUNCH READY.** Internal legal/privacy remediation does not close external legal, regulatory, partner, processor, recovery or operations gates.

| Gate | Current state |
| --- | --- |
| LEGAL-02 | **ANALYSIS COMPLETE** |
| LEGAL-IMPL-01 | **CLOSED — PR #57 MERGED** |
| AUTH-COMMS-01 | **CLOSED — PR #58 MERGED** |
| BRAND-CUTOVER-01 | **CLOSED — PR #59 MERGED** |
| AUTH-HARDEN-01 | **CLOSED — PR #60 MERGED** |
| GOOGLE-OAUTH-ACTIVATE-01 | **DELIVERY CANDIDATE — EXTERNAL PREVIEW E2E PENDING** |
| Google login code | **MERGED IDENTITY-ONLY BASELINE; PREVIEW FLOW CORRECTION CANDIDATE** |
| Google Production credentials | **OPEN EXTERNAL** |
| Email communication architecture | **READY — provider-independent, disabled transport** |
| Email provider | **OPEN — NOT SELECTED** |
| Programme reminder delivery | **NOT YET ACTIVE** |
| Programme reminder permission architecture | **DEFINED** |
| Commercial marketing email | **DISABLED** |
| PROGRAM-AI-01 | **NEXT / OPEN — separate scope** |
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

Product Vision & Principles v2.0 remains constitutional authority. RFC-017 governs the merged legal/privacy remediation. RFC-018 governs AUTH-COMMS-01 and authorises only bounded Google identity authentication and the disabled communication foundation. RFC-019 governs the merged consumer brand and Production canonical authority. RFC-020 supersedes RFC-018 for Google credential persistence, direct ID-token sign-in, provider-token/account-management paths and public sign-out. None authorises reminders, marketing or external provider activation. Mission order, prerequisites, content intent and reward amounts are unchanged.

B4GAMBLE, the consumer brand approved to replace SevenBet under RFC-019, is positioned as adult gambling education, private behavioural reflection, decision support, personal-boundary planning and transparent comparison. It is not positioned as treatment, therapy, rehabilitation, clinical assessment, recovery-to-gambling or a product that makes gambling safe.

## Detected implementation

### Public truthfulness and commercial containment

- Exact RFC-012 IDs classify temporary fictional casinos and related offer inventory through a server-owned authority.
- Demo casino, profile, bonus and best-offer surfaces disclose fictional demonstration state and expose no commercial action.
- Demo-only and mixed public inventory is `noindex, follow`; commercial item/list/review/offer schema is suppressed where it could present demo records as real.
- Future non-demo inventory must still pass GB jurisdiction, partner, offer, link, bonus and redirect authority before any commercial action appears.
- Affiliate compensation does not determine Editor Score or natural editorial ranking. Any future paid placement must be separately identified.
- Bounded public-claims tests cover high-risk safety, treatment, recovery, verification and independence language.

### Active Control Programme

- Missions 01–04 retain server-owned progression, deterministic XP, achievements, active days, streak inputs and next-Mission state.
- Raw M1–M4 narrative is local-first in React state and subject-isolated, tab-scoped `sessionStorage`: random anonymous journey before authentication and actual Better Auth user ID after authentication. Exact current-claim migration removes its anonymous source; subject changes fail closed before rendering. Active server DTOs use exact allow-lists and reject unexpected sensitive fields.
- Required legacy text columns receive neutral implementation markers. Active presenters redact historic raw narrative.
- Legacy reflection creation is retired with `410 LOCAL_ONLY_CONTENT` before request-body parsing; authenticated access/export/deletion remains.
- The Programme entry uses one unchecked two-control access screen for 18+ confirmation plus current Terms agreement/Privacy Notice acknowledgement. The server issues a versioned, purpose-separated HMAC proof containing fixed current legal-copy claims and an original 60-minute lifetime, bound to the exact opaque journey. The same-tab marker moves after authentication to the exact Better Auth user without extending expiry and remains separate from the ten-minute OAuth/content-claim marker. Email account creation and all Google authentication verify the signed proof and exact journey; forged legacy age/Terms/Privacy headers alone fail. Returning email sign-in remains proof-free. Non-GET Programme API requests retain their separate bounded age header policy.
- Actual Better Auth session state owns Programme headers and direct `/program` resolution. Authenticated users receive a server-projected personal home even before enrollment; that empty projection is Mission 01 current/startable, zero XP and zero completed Missions. Public Start controls use an explicit start entry while My Programme resolves to the personal home.
- Protected Help remains accessible without age or Programme completion gating and remains commercially isolated.
- Structural tests prevent Programme, Self-Check, personal-limit, Help, vulnerability and local-session state from entering commercial modules or DTOs.

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
- The authenticated Programme header exposes bounded sign-out and starts a fresh anonymous subject after success; account-scoped browser content remains isolated for the same user.
- Communication purposes are closed and server-owned. Account/security and Programme reminder contracts have fixed non-commercial templates; Programme engagement requires separate opt-in; commercial marketing denies. Delivery remains disabled because no provider, scheduler or preference store is selected.

### Platform and delivery baseline

- FE-MIG, FE-GAP, FE-DS, OPS-01, ENV-ISO-01, GB-MARKET-01, COMM-01, UX-PERF-01, LEGAL-IMPL-01, AUTH-COMMS-01 and BRAND-CUTOVER-01 are merged on main.
- RFC-020 governs merged AUTH-HARDEN-01. RFC-021 v2.1 governs the GOOGLE-OAUTH-ACTIVATE-01 correction candidate. The v2.1 candidate adds no Prisma/schema/migration/dependency or protocol-provider change.
- Preview and Production use isolated database/auth/admin authority. No Production data is copied into Preview.
- CI includes structural, browser, build-secret and migration/fresh-database gates; scheduled Production smoke remains active.
- Recovery is **PARTIAL** because no verified provider snapshot/PITR restore point is available under the current provider plan.

## Evidence classification

- **Detected:** local-first subject-isolated active Programme narrative; server allow-lists; redacted presenters; consolidated subject-scoped access marker backed by current purpose-separated server HMAC authority; session-derived Programme home/header routing; truthful zero-progress Dashboard; bounded Google/Better Auth configuration, identity-only account hooks, restricted auth paths and separate OAuth-claim continuation; closed communication-purpose and protected-content firewalls; demo disclosure/SEO/schema/action containment; commercial firewall; account export/deletion operations including exact consumed-journey erasure; substantive compliance runbooks.
- **Inferred:** neutral legacy markers preserve existing progression/reward relations without a schema change while avoiding new raw narrative persistence.
- **Planned:** external Google Preview/Production client configuration, an approved email transport decision, COMMS-REMINDER-01, durable age evidence, distributed Programme rate limiting, automated anonymous-data purge, approved legacy raw-data cleanup, recovery architecture and Missions 05–10.
- **Not detected:** live Google credentials or smoke result; an email provider, preference store, scheduler or Production email send; DOB/KYC; durable age-attestation evidence; a completed UK representative appointment; a confirmed ICO registration/fee outcome; outside-counsel sign-off; verified complete processor/transfer evidence; a real signed GB partner; real eligible offer/link authority; Production affiliate activation; or a successful restore drill.

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
- Approve and implement Missions 05–10 through Mission-specific RFCs and the Programme Definition of Done.

### Engineering and operations

- Configure separate Google Preview and Production Web clients, exact origins/callbacks and consent-screen evidence; keep the provider absent until each environment has a complete credential pair.
- Select and approve a B4GAMBLE-controlled sending domain, sender mailboxes and email transport before any delivery work. SPF, DKIM, DMARC, TLS, bounce/complaint handling and monitoring remain open. Actual reminders require COMMS-REMINDER-01 and an appropriate preference/opt-out decision.
- Implement durable age-attestation evidence under an approved schema/privacy decision. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**
- Select a distributed Programme limiter and automated expired-session/claim purge.
- Approve legacy Programme-content retention/cleanup after access, export and erasure safeguards.
- Complete RECOVERY-01 with a governed backup architecture and isolated restore drill.
- Close remaining multi-process concurrency, autosave ordering, APM/paging and operational evidence gaps.

## Release conclusion

LEGAL-IMPL-01, AUTH-COMMS-01, BRAND-CUTOVER-01 and AUTH-HARDEN-01 are closed on current main. GOOGLE-OAUTH-ACTIVATE-01 is a correction candidate and must pass exact-head CI/Preview review before Founder merge consideration. It does not configure Google Cloud, add credentials, activate Google in Production, enable email delivery, reminders, commercial beta, Production data mutation, partner traffic or GB launch.

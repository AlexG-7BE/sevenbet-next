# Project State

## Snapshot

- **Reconciled:** 2026-08-13
- **Current main at implementation base:** `0a904a3b8dbf95de4a290ba9b071785f0bbbcfc3`
- **UX-PERF-01:** [PR #56](https://github.com/AlexG-7BE/sevenbet-next/pull/56) merged into current main.
- **LEGAL-02:** analysis complete; Founder Office decisions accepted.
- **LEGAL-IMPL-01:** **CLOSED**; [PR #57](https://github.com/AlexG-7BE/sevenbet-next/pull/57) is merged in current main.
- **AUTH-COMMS-01:** **CLOSED**; [PR #58](https://github.com/AlexG-7BE/sevenbet-next/pull/58) is merged in current main.
- **BRAND-CUTOVER-01:** **CLOSED**; [PR #59](https://github.com/AlexG-7BE/sevenbet-next/pull/59) is merged in current main.
- **AUTH-HARDEN-01:** **CLOSED**; [PR #60](https://github.com/AlexG-7BE/sevenbet-next/pull/60) is merged in current main under RFC-020.
- **GOOGLE-OAUTH-ACTIVATE-01:** **CLOSED**; [PR #61](https://github.com/AlexG-7BE/sevenbet-next/pull/61) merged head `d129130acd982624aa7cf5d31ce4a8b8e81dfa58` into current main as `324a5b51e2e37f456c2386413a6d6c4831607914`. RFC-021 v2.1 remains the architecture authority for the merged access, authentication-continuation and authenticated-Programme runtime.
- **Production:** <https://b4gamble.com> reached **READY** after the merge and continues to serve the B4GAMBLE consumer identity and canonical authority. Production Google OAuth remains **OFF**; Production Google credentials are **not detected**, and Google remains identity-only rather than age verification or KYC.
- **PROGRAM-AI-IMPL-01A:** **CLOSED; PR #63 MERGED**. The default-off RFC-022 M1 foundation is present on main at `5a6ede5b45ad4cb3c71ac14190ad12286b335ac7`.
- **PROGRAM-AI-ACTIVATE-01:** **CLOSED; PR #64 MERGED AFTER CONTROLLED LIVE PREVIEW VALIDATION.** [PR #64](https://github.com/AlexG-7BE/sevenbet-next/pull/64) merged approved head `377777d5c6e9f03f6eae9d9e9bb1293191873720` as `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`. [RFC-023](06_RFC/RFC-023-OpenAI-Preview-Voice-and-Personalisation-Activation.md) authorised Founder/team/synthetic Preview use. Production configuration remained unchanged and legacy M1 remains the Production runtime.
- **PROGRAM-AI-IMPL-01B:** **CLOSED; PR #66 MERGED.** [RFC-025](06_RFC/RFC-025-PROGRAM-AI-Missions-02-10-MVP.md) governs the feature-on Missions 02–10 MVP, three completion-derived Personal Reviews, Home/resume and bounded guidance. The clean M1→M10 path is server-owned and deterministic at exactly `715 XP`; feature-off remains legacy and Production provider activation remains off.
- **Detected controlled activation evidence:** the approved feature-on Preview used an isolated configured database with migration `0018`, a Preview-only real OpenAI key and valid runtime bindings. Real typed OpenAI passed; the deployed 20-case corpus scored 20/20 with 20/20 schema validity and 0% unnecessary clarification. Real microphone capture, OpenAI transcription and editable transcript passed; Founder Office physically accepted the timer/pulse UX. Deterministic `20 + 20` XP, Better Auth claim, durable Starting Point and the provider kill switch passed. Production remained legacy/off.
- **Environment nuance:** the RECOVERY-01 branch pull did not expose generic runtime `DATABASE_URL`/`DIRECT_URL`, while provider-owned Preview aliases remained available. That branch-specific visibility is not evidence against the working isolated bindings used by the approved PR #64 Preview validation. RECOVERY-01 changed no Vercel runtime value, deployment or Production setting.
- **RECOVERY-01:** **MANAGED RESTORE DRILL COMPLETE.** Starter managed snapshots remain active for the distinct Preview and Production databases. Preview backup `backup-01kzszywy038jepagf0zk705zs` at `2026-08-12T03:23:52.640Z` was restored provider-natively to a fresh disconnected database, passed exact 18-migration, 12-table, schema, FK/orphan, auth/Programme, repository-read and deterministic canary parity, then the exact target and Preview canary were deleted and verified absent. Production remained read-only.
- **AGENT-CORE-01:** **STRUCTURALLY COMPLETE / LIVE SMOKE PENDING / UNMERGED.** [RFC-027](06_RFC/RFC-027-B4GAMBLE-Operational-Agent-Foundation.md) governs a separate internal `agents/` package using `@openai/agents` `0.15.0`. Eight read-analyse-draft specialists, strict shared contracts, deterministic preflight, explicit `gpt-5.6-luna` / `gpt-5.6-terra` / `gpt-5.6-sol` cost tiers and a bounded manual runner are detected. The no-key suite passes 23/23; agent type-check/lint, repository structural/build-secret checks, root build and root type-check pass. No live OpenAI call, Production change, schedule, external integration, consumer-runtime import, database/schema change, deploy or activation occurred.
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
| PROGRAM-AI-IMPL-01A | **CLOSED — PR #63 MERGED; DEFAULT OFF** |
| PROGRAM-AI-ACTIVATE-01 | **CLOSED — PR #64 MERGED; CONTROLLED LIVE PREVIEW VALIDATION PASSED** |
| Fixture truthfulness | **CLOSED — exact-ID demo disclosure/action/SEO/schema controls tested** |
| Privacy complaints | **CLOSED — public policy and operating runbook implemented** |
| Protected data firewall | **CLOSED / STRENGTHENED** |
| Local-first Programme | **IMPLEMENTED — historic raw rows remain under export/erasure; cleanup open** |
| Age | **PARTIAL — UI/request enforcement implemented; durable evidence P1 open** |
| UK representative | **OPEN EXTERNAL** |
| ICO fee | **OPEN EXTERNAL** |
| Real partner | **OPEN** |
| Commercial/referral | **OFF** |
| Recovery | **RECOVERY-01 — MANAGED RESTORE DRILL COMPLETE** |
| AGENT-CORE-01 | **STRUCTURALLY COMPLETE — LIVE SMOKE PENDING / UNMERGED** |

## Governing product boundary

Product Vision & Principles v2.0 remains constitutional authority. RFC-017 governs the merged legal/privacy remediation. RFC-018 governs AUTH-COMMS-01 and authorises only bounded Google identity authentication and the disabled communication foundation. RFC-019 governs the merged consumer brand and Production canonical authority. RFC-020 supersedes RFC-018 for Google credential persistence, direct ID-token sign-in, provider-token/account-management paths and public sign-out. RFC-021 v2.1 governs the merged current-runtime Programme access, Google/email continuation and authenticated-home contract. RFC-022 governs the default-off PROGRAM-AI M1 foundation. RFC-023 authorises only OpenAI-backed Founder/team/synthetic Preview validation; it does not authorise unrestricted real-user Production data. RFC-024 governs restore-to-new-target recovery, Production read-only drills and the current logical-fallback boundary. RFC-027 governs only the isolated internal operational-agent foundation and authorises no consumer runtime, external write, schedule, database or Production capability. None authorises reminders, marketing or Production Google/PROGRAM-AI activation.

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

### PROGRAM-AI M1 foundation and OpenAI Preview activation — detected

- A server-only, exact-`true` `PROGRAM_AI_V1_ENABLED` gate selects the new experience. Every new service operation denies while disabled; missing/malformed values render the legacy Programme.
- Entry uses exactly the RFC-021 18+ and combined Terms/Privacy controls. Session creation now verifies the current signed exact-journey proof server-side; no/static/forged/mismatched/expired/stale-copy proofs deny before anonymous session creation.
- The combined mobile/desktop intake keeps concise JIT disclosure, one narrow Article 9 authority and text/recorder input on one surface. Typed input completes the entire path. The recorder performs one explicit completed-file upload, stops at 90 seconds, releases tracks and Blob state, exposes permission/cancel/error states and presents an editable transcript before Programme AI submission.
- Raw audio, typed situation, clarification answers and candidate drafts remain in memory or exact-subject tab `sessionStorage`. Database drafts contain only structural lifecycle/input-mode/clarification-count state. Successful claim clears the anonymous browser namespace.
- Concrete OpenAI adapters implement the existing provider-neutral `TranscriptionPort` and `ProgrammeAiPort` without leaking provider types into domain code. Direct Node 24 fetch calls use `gpt-4o-transcribe` and `gpt-5.6-terra`; the latter uses Responses with strict Structured Output, `store=false`, `background=false`, reasoning `none`, no tools, no conversation and no previous response. Missing gates/credential fail closed, while Programme AI failures return a truthfully labelled user-controlled fallback.
- Real calls require both exact server gates, provider identity and a server-only key. Server reservations cap Programme AI attempts at three per anonymous M1. Audio is limited to 8 MiB/90 seconds; situation text is 4,000 characters and each of two clarifications is 1,000 characters. Provider timeouts are 20 seconds for Programme AI and 25 seconds for transcription, with no automatic retry.
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
- **Delivery boundary:** RFC-022 closes authority for the M1 foundation, RFC-023 closes the controlled Preview OpenAI activation, and RFC-025 closes the bounded feature-on Missions 02–10 MVP at exactly `715 XP`. Unrestricted Production provider data, a general orchestration platform and wider target architecture remain separately gated.

### Privacy operations

- Privacy copy describes the local-first Programme boundary, one-month rights workflow, complaint escalation and the unappointed UK-representative gap.
- The internal data-subject CLI performs deterministic account lookup, structured JSON export and ordered relation-count deletion planning, including consumed claims and linked/draft-bearing anonymous sessions.
- Exact claimant-owned consumed claims and anonymous sessions are deleted before the User; other users, unconsumed journeys and global content remain outside scope. Deletion is dry-run by default. Output files are exclusive mode `0600`. Every execution requires an exact general user confirmation; Production requires a second exact confirmation and explicit target declaration.
- Retention, processor/international-transfer, breach and DPIA draft documents distinguish detected, target and unknown facts without inventing contracts or appointments.

### Database recovery

- RFC-024 owns the restore-to-new-target architecture, exact identity guard, internal RPO/RTO targets, temporary-copy handling and Production read-only drill boundary.
- **Detected:** Prisma workspace `cmrixpep23o54wfdvy6ikjzc1`, billed through the existing Vercel team context, is Starter. Preview `cn8xojfxs6i5z82riihkfjfy` / `store_hLPkkgamL7rJNmCe` and Production `cmrixqbwl21xqyif8ab2vr2xw` / `store_1I4F54ETrwSKS42o` are distinct databases in project `cmrixqbwl21xsyif8kj8xl01s`, with Starter applying to both.
- **Detected:** the Management API reports seven-day retention metadata, 14 completed Production snapshots and six completed Preview snapshots. Production's newest completed snapshot is `backup-01kzq2vm7gagejt88nn3hjqgpz` at `2026-08-11T00:16:47.856Z`; Production remained read-only.
- The 2026-08-11 logical drill used only Preview test/synthetic data. A custom PostgreSQL 17 backup restored into a disposable loopback PostgreSQL 16 database after excluding only the provider-owned `prisma_postgres` extension and its PostgreSQL 17-only session setting.
- Verification passed exact 18-migration parity, 12 selected table-count parity, source/target schema fingerprint parity, canary parent/child parity, zero orphans, auth/session and Programme structure, and an application repository read.
- The Preview canary was deleted and verified absent. All local targets, dumps, SQL, manifests, environment files and the temporary server directory were destroyed. Production data and configuration remained untouched.
- The provider-native drill selected Preview backup `backup-01kzqcxb1ak4rx3amh1snpwdag` at `2026-08-11T03:12:29.738Z` and restored it through Prisma Console's **Restore to a new database** path. Temporary target `cmsodg4461nfn17e56q2juff7` in `us-east-1` reached `ready`, passed connectivity, exact 18-migration parity, schema parity, zero-orphan/FK checks, auth/Programme structure and a `ProgrammeSessionRepository` read with external providers disabled. Exact-ID deletion returned HTTP 204; a subsequent exact lookup returned 404 and the target disappeared from the console list.
- On 2026-08-12, completed Preview backup `backup-01kzszywy038jepagf0zk705zs` at `2026-08-12T03:23:52.640Z` captured the synthetic structural canary. Fresh target `cmspkm3vo22py12f5nej7sdfc` reached ready and passed exact 18-migration, 12 selected table-count, schema, FK/orphan, auth/Programme, repository-read and canary parent/claim parity. Exact target deletion returned HTTP 204, subsequent GET returned 404, and console absence was confirmed. The exact Preview canary root and claim were then deleted; both were verified absent and all unrelated selected-table counts were unchanged. Temporary credentials were revoked. No real-person content or external-provider call was involved; Production remained read-only.

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

- FE-MIG, FE-GAP, FE-DS, OPS-01, ENV-ISO-01, GB-MARKET-01, COMM-01, UX-PERF-01, LEGAL-IMPL-01, AUTH-COMMS-01, BRAND-CUTOVER-01 and PROGRAM-AI-ACTIVATE-01 are merged on main.
- RFC-020 governs merged AUTH-HARDEN-01. RFC-021 v2.1 governs the merged GOOGLE-OAUTH-ACTIVATE-01 current runtime. PR #61 is closed and merged; it added no Prisma/schema/migration/dependency or protocol-provider change.
- Preview and Production use isolated database/auth/admin authority. No Production data is copied into Preview.
- CI includes structural, browser, build-secret and migration/fresh-database gates; scheduled Production smoke remains active.
- Recovery is **RECOVERY-01 — MANAGED RESTORE DRILL COMPLETE**: managed snapshots, isolated provider-native restoration, exact deterministic canary parity and exact cleanup are detected; Production remained read-only.

### Internal operational-agent foundation

- The top-level private `agents/` package has its own manifest, lockfile, TypeScript/lint configuration, README, fixtures and commands. The root Next.js TypeScript project excludes it, and no consumer runtime imports it.
- The package uses official `@openai/agents` `0.15.0` with Zod v4 structured output. The SDK agent has no tools, handoffs, session or persistent memory; provider storage is false, SDK tracing is disabled, max turns are one to four and runtime has a 5–180 second timeout bound with no automatic retry or stronger-model fallback.
- Exactly eight specialists are registered: Compliance Gate, Repo Architecture Guardian, Production Sentinel Analyst, Programme AI Eval Agent, Growth Opportunity Radar, SERP & Competitor Intelligence Agent, Partner Intelligence Agent and Digital PR & Data Story Agent.
- Shared input and result contracts are strict. Result findings use only `DETECTED`, `INFERRED`, `PROPOSED` and `UNKNOWN`; `VERIFIED` is absent. Deterministic preflight stops explicit synthetic-Production, vulnerability-commercial, Programme-commercial and agent-architecture boundary violations before a provider call and carries unsupported commercial claims forward as evidence gaps.
- Model selection is pre-run, closed and observable: bulk `gpt-5.6-luna`, standard `gpt-5.6-terra` and high-consequence `gpt-5.6-sol`, with explicit override source, token usage and a conservative upper-bound USD estimate. There is no silent escalation.
- `OPENAI_API_KEY` is runtime-only. The neutral fixture reaches `OPENAI_API_KEY_REQUIRED` with the variable explicitly absent; no live provider call has occurred. `agents/.env.local` is the recommended existing-ignore-rule destination, and the separately invoked first smoke remains Founder-gated.
- The detected validation result is 23/23 no-key agent tests, agent TypeScript and lint pass, root structural 196/196 plus supporting 5/5 pass, build-secret scan pass for 742 browser-deliverable files, root production build pass and root type-check pass after normal build-artifact regeneration.

## Evidence classification

- **Detected:** base main `0a904a3b8dbf95de4a290ba9b071785f0bbbcfc3`; merged RFC-022/RFC-023/RFC-025 Programme AI implementation, feature-on Missions 02–10 and exact `715 XP` clean-path policy plus successful controlled live Preview validation; distinct Preview/Production resource IDs and connection fingerprints; Starter workspace scope; completed Production and Preview snapshots with seven-day retention metadata; a passed Preview logical restore; a passed, fully deleted provider-native Preview restore target with exact managed canary parity; and the unmerged RFC-027 isolated operational-agent foundation with 23/23 no-key tests and no live provider call.
- **Inferred:** neutral legacy markers preserve existing progression/reward relations without a schema change while avoiding new raw narrative persistence.
- **Planned:** the separately Founder-approved AGENT-CORE-01 neutral live smoke; any separately authorised Production Google or PROGRAM-AI provider activation; an approved email transport; COMMS-REMINDER-01; durable age evidence; distributed Programme rate limiting; automated anonymous-data purge; and approved legacy raw-data cleanup.
- **Not detected:** unrestricted Production-provider authority, Production PROGRAM-AI/provider flags or credential changes, Production Google credentials/provider activation, an email provider/preference store/scheduler/Production send, DOB/KYC, durable age evidence, completed UK representative/ICO/counsel/processor-transfer gates, a real signed GB partner, Production affiliate activation, or fine-grained PITR.

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
- Before unrestricted Production provider activation, close the provider/DPIA/processor/transfer/training, abuse-monitoring retention, operational safety, retention/deletion and human-review evidence recorded by RFC-023 and the compliance register.

### Engineering and operations

- Configure the dedicated key only in the ignored local agent environment and obtain Founder approval before the exact first AGENT-CORE-01 live smoke. The smoke remains manual, non-Production and lowest-cost; no schedule or deployment is authorised.
- Keep Production Google OAuth off. Any future Production Google Web client, credentials, exact origins/callbacks and consent-screen evidence require a separate Founder-authorised activation and must remain isolated from the verified Preview configuration.
- Select and approve a B4GAMBLE-controlled sending domain, sender mailboxes and email transport before any delivery work. SPF, DKIM, DMARC, TLS, bounce/complaint handling and monitoring remain open. Actual reminders require COMMS-REMINDER-01 and an appropriate preference/opt-out decision.
- Implement durable age-attestation evidence under an approved schema/privacy decision. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**
- Select a distributed Programme limiter and automated expired-session/claim purge.
- Approve legacy Programme-content retention/cleanup after access, export and erasure safeguards.
- Preserve RECOVERY-01 evidence and continue routine managed-snapshot monitoring; any Production restore remains a separately authorised incident action.
- Close remaining multi-process concurrency, autosave ordering, APM/paging and operational evidence gaps.

## Release conclusion

LEGAL-IMPL-01, AUTH-COMMS-01, BRAND-CUTOVER-01, AUTH-HARDEN-01, GOOGLE-OAUTH-ACTIVATE-01, PROGRAM-AI-IMPL-01A, PROGRAM-AI-IMPL-01B and the successfully Preview-validated PROGRAM-AI-ACTIVATE-01 are on base main. RFC-025’s feature-on Missions 02–10 path retains exact `715 XP` clean-path truth. AGENT-CORE-01 is an unmerged, structurally complete internal package whose first live smoke remains pending; it changes no consumer or Production authority. Production Google OAuth and PROGRAM-AI providers remain off. RECOVERY-01 is `MANAGED RESTORE DRILL COMPLETE`; the closure used Preview only and left Production read-only. None of this enables email/reminders, mutates Production data, activates commercial traffic or makes B4GAMBLE GB launch-ready.

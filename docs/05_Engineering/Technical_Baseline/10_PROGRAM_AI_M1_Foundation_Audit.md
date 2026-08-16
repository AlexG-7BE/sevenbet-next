# PROGRAM-AI M1 Foundation Technical Baseline

Baseline date: **2026-08-13**

Repository root: `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`

Exact base: current main `c52595405f0800c8c2b51d5951c4a8d45c133034`. FULL-SITE-QA-01 Draft PR #72 worktree changes are not treated as merged baseline facts.

The entire active repository was scanned. Dependencies, generated directories, build artefacts, caches, reports and `tsconfig.tsbuildinfo` were excluded from implementation claims. This document records source evidence and the already documented controlled Preview evidence. It does not infer current hosted activation or expose environment values.

## Detected

- `app/program/page.tsx` evaluates the server-only `PROGRAM_AI_V1_ENABLED` flag. Only exact `true` selects `ProgramAiExperience`; missing or malformed values keep `ActiveControlProgramme`.
- Every new application operation repeats the server flag assertion. Direct calls to new routes therefore fail closed when the feature is disabled.
- The PROGRAM-AI entry reuses exactly two RFC-021 access controls. Anonymous session creation verifies the current HMAC proof and exact journey server-side; static age/legal headers and invalid signature, journey, purpose, time or legal-copy claims fail before database access.
- The feature-on M1 remains a dedicated vertical slice: mission-specific application services/repository, focused routes and provider-neutral contract/orchestrator/port code. Prisma remains below route and React layers.
- The intake combines concise sensitive-data disclosure, one narrow unchecked authority and voice/text controls. Mobile does not render a separate legal happy-path screen.
- `OpenAiTranscriptionAdapter` and `OpenAiProgrammeAiAdapter` implement the existing `TranscriptionPort` and `ProgrammeAiPort`. Provider request/response types stay in the adapter module. The implementation uses the Node 24 fetch stack and adds no dependency.
- Real calls require exact `PROGRAM_AI_V1_ENABLED=true`, exact `PROGRAM_AI_REAL_PROVIDER_ENABLED=true`, `PROGRAM_AI_PROVIDER=openai` and a non-empty server-only key. Only the approved model IDs are accepted. Missing or malformed configuration fails closed before a request.
- Programme AI uses `POST /v1/responses` with `gpt-5.6-terra`, reasoning `none`, minimum current-turn input, strict JSON Schema, 700 output tokens, `store=false` and `background=false`. Tools, conversation, `previous_response_id`, prompt-cache controls, web/files and provider threads are absent.
- Voice uses a single completed in-memory file with `gpt-4o-transcribe` at `POST /v1/audio/transcriptions`, `language=en` and JSON response. Accepted server formats are WebM, MP4/M4A, MPEG/MP3, OGG and WAV; duration is at most 90 seconds and the current raw-file ceiling is 8 MiB. This exceeds Vercel's documented 4.5 MB complete Function-payload ceiling; RFC-031 proposes, but does not yet authorise, a 4 MiB replacement with bounded request-stream enforcement.
- Typed input still completes the path. Provider-disabled/error/timeout/invalid output produces a truthfully labelled user-controlled fallback that copies only bounded user text and leaves desired change/continuation fields for the user.
- Recorder UI covers idle, permission request, recording, stop, cancel, denied, transcribing, success and transcription error/type fallback. It uploads only after Stop, displays an editable transcript, releases tracks, discards on cancel and releases the retained Blob after success/type/unmount.
- Situation input is capped at 4,000 characters and two clarification answers at 1,000 characters each. A metadata-only serializable reservation caps real Programme AI attempts at three per anonymous Mission 01; the external request is outside database transactions.
- OpenAI output passes a strict nested closed result union and existing local allow-list/enum/length validation. No provider field can grant XP, progression, completion, entitlement, legal authority, commercial destination or durable risk state.
- Provider timeouts are 20 seconds for Programme AI and 25 seconds for transcription. There is no automatic retry. The error taxonomy is closed to six safe codes and raw provider bodies/messages are not surfaced.
- Provider and client logs contain only bounded technical metadata and latency/count fields. Regression tests prove that audio, transcript, situation, clarifications, candidate text and key material are absent.
- Raw situation text, clarification answers and candidates live only in memory and exact-subject tab `sessionStorage`. Anonymous database drafts contain only input mode, clarification count, lifecycle and browser-storage markers.
- `ProgrammeSensitiveInputAuthority` records exactly one subject at a time: anonymous-only before claim and user-only after claim. Migration 0018 enforces XOR at the database boundary. Active confirmation is idempotent, clarification cannot refresh `confirmedAt`, withdrawal blocks turns, and claim binding clears `anonymousSessionId` so authenticated evidence survives anonymous-session cleanup.
- `ProgrammeStartingPoint` persists only a closed `USER_CONFIRMED` structure during the exact claim transaction. User and enrollment uniqueness prevent a second durable Starting Point.
- Mission 01 reward policy is versioned `20 + 20`; clarification and registration are zero. Two distinct `STEP_COMPLETION` XP events use unique user/award keys. Completion, next Mission and review entitlement remain server-owned.
- Complete legacy M1, higher Mission progress or an existing Starting Point dominates an anonymous collision. Incomplete progress alone does not manufacture completion; a genuine complete Program AI claim may finish M1 without granting the legacy `+60` key.
- Feature-on Home reads server-owned Mission state and exposes Reviews only after M3/M6/M10 completion. **Detected current-main limitation:** partially completed M1 action/XP and next-Review distance can be misprojected; unmerged Draft PR #72 corrects those server projections. The client does not calculate arbitrary percentages.
- Data-subject export/deletion includes the new authority and Starting Point relations.
- Structural tests deny commercial imports/fields in both directions and confirm raw durable fields are absent. Adapter tests cover request shape, stateless settings, schema, prompt-injection containment, timeout/status mapping, no retry, upload limits and no-content logging. A synthetic 20-family quality corpus is available only through the separately invoked `npm run program-ai:openai-eval` command.
- The PostgreSQL 16 CI migration job has applied the migration chain, including migration 0018 and its preflight, to a fresh database successfully.
- A dedicated feature-on Playwright lane is configured against the disposable CI PostgreSQL service. It covers direct access-proof bypasses, keyboard/responsive typed fallback, real Better Auth email continuation, `20 + 20`, duplicate operations and claim replay, wrong-user denial, user-only authority persistence, withdrawal/reconfirmation, legacy-complete dominance and support-first suppression. A separate feature-off browser check keeps the legacy runtime explicit.

## Current-main Missions 02–10 and runtime-hardening delta

- **Detected:** RFC-025's bounded `programAiMissionRegistry` implements Missions 02–10 with exact prerequisites, three action identities per Mission, `15 + 20 + 15` action XP and `25 XP` completion. The clean PROGRAM-AI path totals `715 XP`.
- **Detected:** authenticated action, completion, guidance and Review routes use closed mission/milestone contracts. First/Mid/Full Review entitlement derives from M3/M6/M10 completion and awards no XP.
- **Detected:** deterministic fallbacks keep Missions and Reviews completable when the real provider gate is off or provider output fails validation. Private Programme fields remain excluded from commercial routing and analytics properties.
- **Detected:** migration 0019 adds one transient rate-limit bucket model. Runtime requests use shared PostgreSQL counters outside isolated Node tests; bounded manual/Cron purge code covers expired anonymous sessions, unconsumed claims and expired buckets.
- **Detected:** Vercel product analytics is present behind an exact default-off flag with a closed event contract. Raw Programme text, transcript and identifiers are excluded from its property schema.
- **Detected current-main limitation:** legacy Programme mutations remain reachable while the feature-on path is selected and share progress aggregates. Unmerged Draft PR #72 adds explicit mode-conflict denial; that correction is not merged/deployed baseline evidence.
- **Not detected from repository source:** exact deployed migration/Cron/analytics/provider flag state. PROJECT_STATE separately records read-only live Production PROGRAM-AI/Google observations as a contradiction requiring Founder/operations reconciliation.
- **Detected current-main metadata limitation:** `/program` route metadata hard-codes the legacy Moment Map/early-signal journey even when the feature-on server runtime is selected. Unmerged Draft PR #72 replaces it with mode-neutral 10-Step Programme metadata; that is not current-main or Production baseline evidence.

## Inferred

- Reusing the privacy-safe legacy `MomentMap` sentinel is currently necessary for the deployed Mission 02 relation. It is a compatibility anchor, not the Program AI result of record.
- The exact-user and exact-enrollment Starting Point uniqueness plus serializable transaction and idempotent reward keys make claim retries conservative even across concurrent attempts.

## Design System consolidation delta

- The new UI inventory is limited to the combined JIT-authority intake, recorder states, bounded clarification, editable Starting Point candidate, support-first interruption, registration continuation, truthful Programme Home and locked/eligible Review cards.
- Existing `ActionButton` and `ActionLink` controls, Programme shell, typography, colour, spacing, radius, focus and surface tokens remain the implementation vocabulary. No global token was added and no second generic button, card or form abstraction was created.
- The recorder remains the only newly justified interaction component. The other surfaces are mission-local compositions; no speculative AI component system was introduced.
- Component CSS contains explicit narrow/mobile reflow, visible focus/error/loading state treatment and reduced-motion handling. Automated browser checks exercise keyboard access controls, editable voice transcript, MediaRecorder selection, track cleanup/cancel, typed/edited fields, fallback and 390/320 px overflow. Manual screen-reader, actual-device Safari permission/format and exact Preview Figma parity checks remain release gates rather than completed repository claims.

## Planned

- OpenAI DPA/subprocessor/location/transfer/account-retention evidence, any ZDR/MAM approval, Production monitoring/human-review decision and any separately approved Production activation.
- Exact deployed migration/Cron/analytics runtime verification and alerting evidence.
- If Founder Office approves RFC-031, a 4 MiB raw-audio ceiling, bounded complete-request streaming enforcement and client Type-instead preflight. Current code remains at 8 MiB/90 seconds.

## Not detected

- Production activation authority or secret values; a durable audio/transcript/provider-message store; conversation store; vector database; RAG; consumer Programme agent framework; or generic Mission DSL. Repository source cannot establish hosted values. PROJECT_STATE records the live-state contradiction separately.
- Client-authored XP, completion, next Mission, Review entitlement, risk label, diagnosis, affordability/vulnerability score or commercial personalisation input.
- A destructive migration or `prisma migrate reset`.

## Verification boundary

Focused Node tests cover the exact flag, signed session-entry gate, reward identities, input/provider allow-lists, clarification cap, immutable confirmation evidence, fallback truthfulness, support-first union, Starting Point validation, legacy/higher-progress collision policy, exactly-once schema/ledger keys, raw-data absence, commercial firewall, two-control access/intake and truthful Home/Review state. The isolated browser lane adds real-route/database/auth continuity evidence. Passing repository tests do not establish legal approval, provider safety, Production activation or clinical validity.

## RFC-029 merged delta — 2026-08-13

- **Detected on current main through merged PR #71:** the recorder performs a feature-detected Permissions API query without requesting access on load, observes `granted`/`prompt`/`denied` changes, and preserves direct user-gesture `getUserMedia` as the request authority.
- **Detected:** persistent denial, prompt/dismissal, unsupported `MediaRecorder`/`getUserMedia`, recording, cancellation, transcription and typed fallback have distinct truthful states. No permission API or copy claims that the site can override a browser block.
- **Detected:** the audio Blob, 90-second cap, existing transcription route, track cleanup, sessionStorage content and analytics privacy boundaries are unchanged. `Permissions-Policy` is unchanged.
- **Detected:** browser automation passes the clean request, granted recording, persistent denied/recheck, prompt retry and unsupported-feature paths using controlled browser APIs. This is browser-state handling evidence, not a physical microphone/native prompt E2E claim.
- **Detected:** `account_not_linked` retains the exact Programme OAuth claim marker, requires email/password authentication of the existing account, then starts installed Better Auth `linkSocial` with an allow-listed Google callback. Claim redemption remains after a successful link return.
- **Not detected in the RFC-029 repository evidence:** a real external Google recovery round trip or physical microphone test on that Preview. Both remain separately bounded manual evidence; PR #71 is nevertheless merged.

## PR #76 Founder correction delta — 2026-08-16

- **Detected on `codex/final-design-handoff-v1`:** after the existing adult/Terms access gate and just-in-time authority, anonymous Mission 01 has one voice-or-text situation submission. The application sends no clarification answers and never renders a clarification screen.
- **Detected:** valid provider output and provider-disabled/error/invalid/clarification output all resolve to a closed best-effort Starting Point candidate. A support-first disposition still interrupts before account claim when required; continuing from it uses that same candidate.
- **Detected:** the anonymous UI proceeds directly to “Your Starting Point is ready.” with Google primary and email secondary. The visible save/account action is the user's confirmation authority; the former candidate editor and pre-auth reward screen are absent.
- **Detected:** successful authentication and claim still use the existing serializable claim transaction, durable `USER_CONFIRMED` Starting Point, ownership checks and replay protection, then land on the real server-projected Dashboard.
- **Detected:** reward identities and amounts are unchanged: 20 XP for the situation action and 20 XP for Mission 01 completion; registration grants zero. Progress, completion and next Mission remain server-owned.
- **Detected:** focused structural, orchestration and browser regression tests assert the single-submit sequence, best-effort fallback, absence of old screens, account claim, durable output, wrong-user denial and final 40 XP Dashboard state.
- **Not detected/authorised:** Production activation, Production configuration changes, merge to `main`, legal approval or clinical validation.

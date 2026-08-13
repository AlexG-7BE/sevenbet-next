# PROGRAM-AI M1 Foundation Technical Baseline

Baseline date: **2026-08-10**

Repository root: `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`

Exact base: main `5a6ede5b45ad4cb3c71ac14190ad12286b335ac7`; activation branch `codex/program-ai-activate-01-openai-preview`.

The entire active repository was scanned. Dependencies, generated directories, build artefacts, caches, reports and `tsconfig.tsbuildinfo` were excluded from implementation claims. This document records branch evidence; it does not claim activation-branch merge, Preview deployment, Production activation or a successful external-provider call.

## Detected

- `app/program/page.tsx` evaluates the server-only `PROGRAM_AI_V1_ENABLED` flag. Only exact `true` selects `ProgramAiExperience`; missing or malformed values keep `ActiveControlProgramme`.
- Every new application operation repeats the server flag assertion. Direct calls to new routes therefore fail closed when the feature is disabled.
- The PROGRAM-AI entry reuses exactly two RFC-021 access controls. Anonymous session creation verifies the current HMAC proof and exact journey server-side; static age/legal headers and invalid signature, journey, purpose, time or legal-copy claims fail before database access.
- The feature-on M1 remains a dedicated vertical slice: mission-specific application services/repository, focused routes and provider-neutral contract/orchestrator/port code. Prisma remains below route and React layers.
- The intake combines concise sensitive-data disclosure, one narrow unchecked authority and voice/text controls. Mobile does not render a separate legal happy-path screen.
- `OpenAiTranscriptionAdapter` and `OpenAiProgrammeAiAdapter` implement the existing `TranscriptionPort` and `ProgrammeAiPort`. Provider request/response types stay in the adapter module. The implementation uses the Node 24 fetch stack and adds no dependency.
- Real calls require exact `PROGRAM_AI_V1_ENABLED=true`, exact `PROGRAM_AI_REAL_PROVIDER_ENABLED=true`, `PROGRAM_AI_PROVIDER=openai` and a non-empty server-only key. Only the approved model IDs are accepted. Missing or malformed configuration fails closed before a request.
- Programme AI uses `POST /v1/responses` with `gpt-5.6-terra`, reasoning `none`, minimum current-turn input, strict JSON Schema, 700 output tokens, `store=false` and `background=false`. Tools, conversation, `previous_response_id`, prompt-cache controls, web/files and provider threads are absent.
- Voice uses a single completed in-memory file with `gpt-4o-transcribe` at `POST /v1/audio/transcriptions`, `language=en` and JSON response. Accepted server formats are WebM, MP4/M4A, MPEG/MP3, OGG and WAV; duration is at most 90 seconds and upload payload at most 8 MiB.
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
- Feature-on Home reads server-owned exact Mission states and exposes Reviews only after M3/M6/M10 completion. It does not calculate arbitrary percentages.
- Data-subject export/deletion includes the new authority and Starting Point relations.
- Structural tests deny commercial imports/fields in both directions and confirm raw durable fields are absent. Adapter tests cover request shape, stateless settings, schema, prompt-injection containment, timeout/status mapping, no retry, upload limits and no-content logging. A synthetic 20-family quality corpus is available only through the separately invoked `npm run program-ai:openai-eval` command.
- The PostgreSQL 16 CI migration job has applied the migration chain, including migration 0018 and its preflight, to a fresh database successfully.
- A dedicated feature-on Playwright lane is configured against the disposable CI PostgreSQL service. It covers direct access-proof bypasses, keyboard/responsive typed fallback, real Better Auth email continuation, `20 + 20`, duplicate operations and claim replay, wrong-user denial, user-only authority persistence, withdrawal/reconfirmation, legacy-complete dominance and support-first suppression. A separate feature-off browser check keeps the legacy runtime explicit.

## Inferred

- Reusing the privacy-safe legacy `MomentMap` sentinel is currently necessary for the deployed Mission 02 relation. It is a compatibility anchor, not the Program AI result of record.
- The exact-user and exact-enrollment Starting Point uniqueness plus serializable transaction and idempotent reward keys make claim retries conservative even across concurrent attempts.

## Design System consolidation delta

- The new UI inventory is limited to the combined JIT-authority intake, recorder states, bounded clarification, editable Starting Point candidate, support-first interruption, registration continuation, truthful Programme Home and locked/eligible Review cards.
- Existing `ActionButton` and `ActionLink` controls, Programa shell, typography, colour, spacing, radius, focus and surface tokens remain the implementation vocabulary. No global token was added and no second generic button, card or form abstraction was created.
- The recorder remains the only newly justified interaction component. The other surfaces are mission-local compositions; no speculative AI component system was introduced.
- Component CSS contains explicit narrow/mobile reflow, visible focus/error/loading state treatment and reduced-motion handling. Automated browser checks exercise keyboard access controls, editable voice transcript, MediaRecorder selection, track cleanup/cancel, typed/edited fields, fallback and 390/320 px overflow. Manual screen-reader, actual-device Safari permission/format and exact Preview Figma parity checks remain release gates rather than completed repository claims.

## Planned

- Feature-on Preview deployment, mobile/desktop visual/accessibility QA, controlled real typed/voice eval and Preview rollback evidence after credential and isolated-database/migration checks.
- OpenAI DPA/subprocessor/location/transfer/account-retention evidence, any ZDR/MAM approval, production monitoring/human-review decision, retention automation or Production activation.
- Generated Personal Reviews and Missions 05–10.

## Not detected

- Production `PROGRAM_AI_V1_ENABLED=true`, Production real-provider flag/key, a Production environment change, successful live model/transcription evidence, durable audio/transcript/provider-message store, conversation store, vector database, RAG, agent framework or generic Mission DSL.
- Client-authored XP, completion, next Mission, Review entitlement, risk label, diagnosis, affordability/vulnerability score or commercial personalisation input.
- A destructive migration or `prisma migrate reset`.

## Verification boundary

Focused Node tests cover the exact flag, signed session-entry gate, reward identities, input/provider allow-lists, clarification cap, immutable confirmation evidence, fallback truthfulness, support-first union, Starting Point validation, legacy/higher-progress collision policy, exactly-once schema/ledger keys, raw-data absence, commercial firewall, two-control access/intake and truthful Home/Review state. The isolated browser lane adds real-route/database/auth continuity evidence. Passing repository tests do not establish legal approval, provider safety, Production activation or clinical validity.

## RFC-029 review-branch delta — 2026-08-13

- **Detected on the unmerged review branch:** the recorder performs a feature-detected Permissions API query without requesting access on load, observes `granted`/`prompt`/`denied` changes, and preserves direct user-gesture `getUserMedia` as the request authority.
- **Detected:** persistent denial, prompt/dismissal, unsupported `MediaRecorder`/`getUserMedia`, recording, cancellation, transcription and typed fallback have distinct truthful states. No permission API or copy claims that the site can override a browser block.
- **Detected:** the audio Blob, 90-second cap, existing transcription route, track cleanup, sessionStorage content and analytics privacy boundaries are unchanged. `Permissions-Policy` is unchanged.
- **Detected:** browser automation passes the clean request, granted recording, persistent denied/recheck, prompt retry and unsupported-feature paths using controlled browser APIs. This is browser-state handling evidence, not a physical microphone/native prompt E2E claim.
- **Detected:** `account_not_linked` retains the exact Programme OAuth claim marker, requires email/password authentication of the existing account, then starts installed Better Auth `linkSocial` with an allow-listed Google callback. Claim redemption remains after a successful link return.
- **Not detected:** a real external Google recovery round trip or physical microphone test on the RFC-029 Preview. Both remain manual Preview gates.

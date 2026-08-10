# PROGRAM-AI M1 Foundation Technical Baseline

Baseline date: **2026-08-10**

Repository root: `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`

Exact base: main `240dff31537bf4f42978ad7aebe94ae6b60074cc`; implementation branch `codex/program-ai-impl-01a-m1-foundation`.

The entire active repository was scanned. Dependencies, generated directories, build artefacts, caches, reports and `tsconfig.tsbuildinfo` were excluded from implementation claims. This document records branch evidence; it does not claim merge, Preview deployment, Production activation or external-provider behaviour.

## Detected

- `app/program/page.tsx` evaluates the server-only `PROGRAM_AI_V1_ENABLED` flag. Only exact `true` selects `ProgramAiExperience`; missing or malformed values keep `ActiveControlProgramme`.
- Every new application operation repeats the server flag assertion. Direct calls to new routes therefore fail closed when the feature is disabled.
- The feature-on M1 is a dedicated vertical slice: one application service, one mission-specific repository, focused routes and a provider-neutral contract/orchestrator directory. Prisma remains below the route and React layers.
- The intake combines concise sensitive-data disclosure, one narrow unchecked authority and voice/text controls. Mobile does not render a separate legal happy-path screen.
- `TranscriptionPort` and `ProgrammeAiPort` are the only external-processing port interfaces. No adapter, provider SDK, credential or external AI/audio request is present.
- Typed input completes the path. With no provider, orchestration returns a truthfully labelled user-controlled fallback that copies only bounded user text and leaves desired change/continuation fields for the user.
- Recorder UI covers idle, permission request, recording, stop, cancel, denied, transcribing and transcription error/type fallback. It does not upload audio.
- Raw situation text, clarification answers and candidates live only in memory and exact-subject tab `sessionStorage`. Anonymous database drafts contain only input mode, clarification count, lifecycle and browser-storage markers.
- `ProgrammeSensitiveInputAuthority` records exact anonymous/user subject, purpose/statement versions and confirmation/withdrawal times. The service checks a current row before each unrestricted turn.
- `ProgrammeStartingPoint` persists only a closed `USER_CONFIRMED` structure during the exact claim transaction. User and enrollment uniqueness prevent a second durable Starting Point.
- Mission 01 reward policy is versioned `20 + 20`; clarification and registration are zero. Two distinct `STEP_COMPLETION` XP events use unique user/award keys. Completion, next Mission and review entitlement remain server-owned.
- Complete legacy M1, higher Mission progress or an existing Starting Point dominates an anonymous collision. Incomplete progress alone does not manufacture completion; a genuine complete Program AI claim may finish M1 without granting the legacy `+60` key.
- Feature-on Home reads server-owned exact Mission states and exposes Reviews only after M3/M6/M10 completion. It does not calculate arbitrary percentages.
- Data-subject export/deletion includes the new authority and Starting Point relations.
- Structural tests deny commercial imports/fields in both directions and confirm raw durable fields are absent.
- The PostgreSQL 16 CI migration job has applied the migration chain, including migration 0018 and its preflight, to a fresh database successfully.

## Inferred

- Reusing the privacy-safe legacy `MomentMap` sentinel is currently necessary for the deployed Mission 02 relation. It is a compatibility anchor, not the Program AI result of record.
- The exact-user and exact-enrollment Starting Point uniqueness plus serializable transaction and idempotent reward keys make claim retries conservative even across concurrent attempts.

## Design System consolidation delta

- The new UI inventory is limited to the combined JIT-authority intake, recorder states, bounded clarification, editable Starting Point candidate, support-first interruption, registration continuation, truthful Programme Home and locked/eligible Review cards.
- Existing `ActionButton` and `ActionLink` controls, Programa shell, typography, colour, spacing, radius, focus and surface tokens remain the implementation vocabulary. No global token was added and no second generic button, card or form abstraction was created.
- The recorder is the only newly justified interaction component. The other surfaces are mission-local compositions; no speculative AI component system was introduced.
- Component CSS contains explicit narrow/mobile reflow, visible focus/error/loading state treatment and reduced-motion handling. Local feature-on checks covered desktop and 390 px layouts without horizontal overflow; exact Preview keyboard, assistive-technology and Figma parity checks remain release gates rather than completed repository claims.

## Planned

- Exact-head CI completion, Preview feature-on deployment, mobile/desktop visual/accessibility QA, Better Auth email/Google continuation QA and Preview rollback evidence.
- Any real AI/transcription adapter, provider contract, DPA/subprocessor/transfer/training decision, monitoring, retention automation or Production activation.
- Generated Personal Reviews and Missions 05–10.

## Not detected

- Production `PROGRAM_AI_V1_ENABLED=true`, a Production environment change, a real model/transcription call, provider SDK/credential, audio upload/store, conversation store, vector database, RAG, agent framework or generic Mission DSL.
- Client-authored XP, completion, next Mission, Review entitlement, risk label, diagnosis, affordability/vulnerability score or commercial personalisation input.
- A destructive migration or `prisma migrate reset`.

## Verification boundary

Focused Node tests cover the exact flag, reward identities, input/provider allow-lists, clarification cap, fallback truthfulness, support-first union, Starting Point validation, legacy/higher-progress collision policy, exactly-once schema/ledger keys, raw-data absence, commercial firewall, combined intake and truthful Home/Review state. Passing repository tests do not establish legal approval, provider safety, Production activation or clinical validity.

# RFC-022: PROGRAM-AI M1 Foundation and Preview Vertical Slice

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `PROGRAM-AI-IMPL-01A`
- **Approved:** 2026-08-10
- **Scope:** Mission 01 PROGRAM-AI foundation, feature-gated Preview vertical slice, two narrow persistence concepts, provider-neutral ports, legacy compatibility, Programme Home and Personal Review entitlement foundations
- **Base:** `240dff31537bf4f42978ad7aebe94ae6b60074cc`
- **Depends on:** Product Vision & Principles v2.0, RFC-002, RFC-008, RFC-017, RFC-018, RFC-020, RFC-021, PROGRAM-AI-01 Product Direction v2.2, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** no historical RFC; this record authorises the bounded implementation that the earlier Product Direction and Roadmap explicitly deferred

## 1. Decision

B4GAMBLE will implement a bounded PROGRAM-AI Mission 01 foundation and Preview vertical slice behind one server-controlled feature gate:

```text
PROGRAM_AI_V1_ENABLED
```

Only the exact string `true` enables the new server routes and frontend. Missing, empty, partial, differently cased or otherwise malformed values deny. The default is off. This package does not alter Production environment configuration.

When the flag is off, the deployed legacy Mission 01 journey, reward, claim, Dashboard and Missions 02–04 remain the runtime. When the flag is on, the new Mission 01 path is available without selecting or integrating a real AI or transcription provider. No provider credential, SDK, Production AI call, Production Google activation, RAG, embedding, vector database, agent framework, conversation store or audio store is authorised.

The new path is:

```text
existing access gate
→ combined JIT disclosure + narrow sensitive-input authority + situation intake
→ voice-first foundation or equal typed input
→ 0–2 bounded clarifications when an authorised future/test port requires them
→ user-editable Starting Point candidate
→ explicit user confirmation
→ 40 XP structurally earned before registration
→ Google primary / email secondary continuation
→ exact anonymous claim
→ durable confirmed Starting Point
→ authenticated Programme continuation
```

P75 first personalised value under 90 seconds and registration CTA under 120 seconds are Product targets, not server guarantees.

## 2. Design authority and Founder mobile override

Implementation must use Figma file `UvuJZEzeMAd8cK9TNAueb8`, approved page `954:2`, and the design context/screenshots for families:

- `954:3` — M1 Mobile / Complete First Session;
- `954:4` — M1 Desktop / Representatives;
- `954:5` — Personal Reviews + Programme Home; and
- `954:6` — Interaction / Accessibility / Responsive Contract.

The existing B4GAMBLE Design System, Programme shell, Archivo typography, paper/night surfaces, primary acid action, verified-safety teal, spacing, radii and focus grammar remain authoritative. The Situation Intake Recorder is the only newly justified reusable interaction component. Starting Point and Personal Review screens remain product evidence, not speculative generic design-system abstractions.

Founder Office overrides any treatment of mobile frame `955:19` as a mandatory standalone happy-path page: it must not be implemented as a separate legal screen. Mobile uses the conceptual model already shown by desktop `957:2`: the concise JIT disclosure, one unchecked narrow authority and the Situation Intake share one surface. Authority must be completed before unrestricted free-form content is transmitted for processing. There is no separate AI consent, voice consent or ordinary-personalisation consent.

## 3. Reward and progression authority

PROGRAM-AI M1 uses reward policy version `program-ai-01:v1`:

| Logical action | XP | Semantic identity |
| --- | ---: | --- |
| `SITUATION_SUBMITTED` | `+20` | `programme:m01:situation-submitted:program-ai-01:v1` |
| `CLARIFICATION` | `0` | no reward event |
| `STARTING_POINT_COMPLETE` | `+20` | `programme:m01:starting-point-complete:program-ai-01:v1` |
| `REGISTRATION` | `0` | no reward event |

Anonymous XP is derived from server-owned structural action state. It is displayed as earned before registration, but authenticated `UserXpEvent` rows materialise only during the exact claim or a direct authenticated action. Database uniqueness and conditional state transitions enforce exactly once across duplicate submissions, edits, retries, tabs, callbacks and claim replay.

AI/transcription output never contains or decides reward amount, entitlement, Mission completion, next Mission or Personal Review entitlement.

Existing Mission 02 (`+80`), Mission 03 (`+90`) and Mission 04 (`+100`) runtime rewards are unchanged by this package. The Product Direction's `+25` Missions 02–10 value remains a balancing hypothesis and is not implemented here.

## 4. Legacy Mission 01 compatibility

Historical and current legacy reward identities remain immutable.

- An authenticated user whose legacy M1 is `COMPLETED` stays complete, retains the exact historical XP ledger and receives neither PROGRAM-AI reward automatically. Anonymous PROGRAM-AI work cannot overwrite that state.
- A user already beyond M1 retains all progress. Authenticated progress dominates an anonymous claim; no Mission, artefact or current-step regression is allowed.
- Incomplete legacy M1 does not imply PROGRAM-AI completion. Existing task state and any immutable XP stay intact until the user genuinely completes the new required actions. A complete exact PROGRAM-AI anonymous claim may finish M1 under the new policy; partial legacy task state alone cannot.
- PROGRAM-AI action reward keys are versioned and distinct from the legacy M1 completion key. Application compatibility checks prevent a completed legacy M1 from receiving the new pair.
- The existing privacy-safe legacy `MomentMap` marker may remain as the minimum compatibility anchor required by the current Mission 02 relation, but the dedicated Starting Point is the durable PROGRAM-AI result and source of truth.

## 5. Exactly two persistence concepts

### 5.1 `ProgrammeSensitiveInputAuthority`

This model stores minimum evidence and withdrawal state for the narrow authority required before processing unrestricted voluntarily supplied health/addiction information.

Allowed fields are limited to an opaque ID, exact anonymous-session and/or authenticated-user binding, purpose/version, statement/version, confirmation/withdrawal timestamps and repository-standard timestamps. It stores no transcript, narrative, diagnosis, Starting Point, commercial consent, marketing consent or generic consent-management state.

It is purpose-separated from RFC-021's HMAC access authority. A current, unwithdrawn exact-subject row is checked server-side before every unrestricted situation or clarification submission. Withdrawal denies further processing immediately. Anonymous-to-authenticated rebinding occurs only inside the exact claim transaction.

### 5.2 `ProgrammeStartingPoint`

This model stores only the user-confirmed, closed B4GAMBLE structure required for post-registration continuity:

- concise Starting Point;
- desired change;
- broad context;
- continuation cue;
- optional chosen boundary/action;
- provenance/version; and
- confirmation timestamp.

All persisted content is `USER_CONFIRMED` (or an equivalent closed provenance value). Candidate content is temporary and never written. The model stores no audio, transcript, original narrative, clarification conversation, hidden reasoning, diagnosis, risk/vulnerability/affordability score, casino suitability or bonus suitability.

The Starting Point is saved exactly once during an exact successful anonymous claim or direct authenticated completion. Account creation therefore preserves the confirmed result and Programme continuity rather than merely changing identity.

## 6. Raw-data lifecycle

No raw audio, transcript, typed situation narrative, clarification answer, provider payload or hidden reasoning is durably stored by default.

Raw content may exist only in current browser memory and the existing versioned, exact-subject, tab-scoped `sessionStorage` namespace for transcript correction, clarification, candidate display and correction. `localStorage`, cookies, URLs, analytics, reward metadata, logs and database drafts are prohibited for raw content.

Server handlers read bounded request bodies, validate without echoing values, use raw content only for the current transient orchestration call and persist only structural action state. After successful authenticated save, the exact anonymous namespace is cleared. Cancellation or auth failure retains the exact current permitted browser-session state for retry; it does not duplicate rewards or state.

## 7. Provider-neutral orchestration

Two narrow ports are authorised:

```text
TranscriptionPort
ProgrammeAiPort
```

There is no real adapter in this package. Provider-specific types do not enter Programme domain/application contracts. The AI result is a closed union of `CLARIFICATION_REQUIRED` or `STARTING_POINT_CANDIDATE`, with a maximum of two clarifications. Closed validation rejects additional fields and all client/model-authored progression, reward, completion, legal-authority, risk-score or commercial concepts.

Test doubles may be injected by unit/integration/browser tests only. They are not selectable by client input or ordinary non-test runtime configuration.

Without an authorised runtime provider, the application shows the approved truthful non-AI path. It may prepare a simple editable draft solely from text explicitly supplied in the current session, clearly labels it as a user-controlled fallback, and awards the Starting Point action only after the user sees, edits as needed and explicitly confirms it. It never claims an AI analysis succeeded.

## 8. Voice, text and support-first foundations

The recorder supports explicit idle, permission request, recording, stop, cancel, denied, transcribing and transcription-error states. Cancel never submits. Denial and error expose Type instead immediately. Waveform treatment is decorative, recorder state is announced as text and reduced motion removes non-essential animation. No audio upload, external processing, background upload or recording storage occurs.

Typed and future voice input converge on the same transient request contract and the same reward, Starting Point, claim and persistence lifecycle.

The transient support disposition is closed to `CONTINUE | SUPPORT_FIRST`. This package does not implement a clinical classifier, durable risk label or vulnerability score. `SUPPORT_FIRST` suppresses registration pressure, commercial surfaces and celebratory XP presentation; preserves earned XP as neutral history; exposes Protected Help; and permits exit.

## 9. Programme Home and Personal Reviews

The feature-on authenticated Home remains a server-owned read model. It may present only facts supported by current data: current Mission, `NOT STARTED | IN PROGRESS | COMPLETE`, exact next action, earned XP, actions remaining, locked completion reward and next Review milestone. It does not invent percentage completion or Missions 05–10 state. Streak and achievements remain secondary.

Personal Review entitlement is deterministic:

- M3 complete → First Personal Review eligible;
- M6 complete → Mid-Programme Personal Review eligible; and
- M10 complete → Full Programme Personal Review eligible.

XP alone never authorises a Review. This package implements entitlement and locked/unlocked presentation only; it does not generate a real AI Review.

## 10. Commercial, analytics and OAuth containment

No new firewall service, analytics port or analytics provider is introduced. Structural tests extend the existing prohibition on Programme, pause and Help imports/fields in casino ranking, bonus ranking, affiliate routing, offer eligibility, retargeting and commercial audience/personalisation code. Raw or confirmed protected content is never analytics metadata.

Google remains identity-only. OAuth receives no narrative, transcript, Starting Point, Programme personalisation or sensitive-authority content. Production Google configuration remains off and unchanged.

## 11. Migration, rollback and operations

The migration is additive and limited to the two authorised models, their indexes, foreign keys and required relations. A non-mutating preflight checks conflicts and expected existing relations. No destructive migration or reset is permitted.

Rollback disables `PROGRAM_AI_V1_ENABLED` and restores the exact legacy runtime without deleting the additive rows. A later data-removal decision would require separate authority. Provider activation, Production feature activation, provider contracts/transfers/training decisions, final DPIA closure and operational monitoring remain later gates.

## 12. Verification and release boundary

Required evidence covers feature-off regression, feature-on text path, exact `20 + 20`, duplicate/idempotent operations, zero-XP clarification, correction, cancellation/retry, exact claim, Starting Point persistence, legacy-complete and higher-progress dominance, subject isolation, authority withdrawal, support-first suppression, commercial firewall, raw-data absence, OAuth containment, migration/fresh database, TypeScript, lint, build, browser accessibility and responsive states.

Production with the feature missing or malformed continues to serve the legacy Programme. No real provider, external AI/transcription call, Production data transfer to AI, Production Google activation or merge is part of this implementation authority.

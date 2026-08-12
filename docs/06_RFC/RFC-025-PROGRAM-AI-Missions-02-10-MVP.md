# RFC-025: PROGRAM-AI Missions 02–10 MVP

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `PROGRAM-AI-IMPL-01B`
- **Approved:** 2026-08-11
- **Scope:** Feature-on Missions 02–10, deterministic action rewards, three Personal Reviews, authenticated Programme Home/resume, bounded Mission AI guidance, closed structural persistence, generic public discovery navigation and consumer truth reconciliation
- **Base:** `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`
- **Depends on:** Product Vision & Principles v2.0, RFC-002, RFC-008, RFC-009, RFC-010, RFC-017, RFC-021, RFC-022, RFC-023, PROGRAM-AI-01 Product Direction v2.2, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** RFC-002, RFC-008, RFC-009 and RFC-010 only for feature-on Mission 02–04 duration, action, artefact and reward contracts. Their feature-off legacy implementation and historical rewards remain authoritative and unchanged.

## 1. Decision

B4GAMBLE will complete the authenticated feature-on 10-Step Control Programme behind the existing exact server gate:

```text
PROGRAM_AI_V1_ENABLED=true
```

Mission 01 remains the merged RFC-022/RFC-023 implementation. This RFC does not rebuild its access, voice, transcription, clarification, `20 + 20`, Starting Point, claim or registration journey.

When the feature gate is enabled, an authenticated user continues from the Programme Home into the new Missions 02–10 rather than the legacy `ActiveControlProgramme`. When the gate is absent or malformed, the legacy runtime remains unchanged.

The feature-on Programme is:

```text
M1 Starting Point
→ M2 7-day goal
→ M3 urge sequence
→ First Personal Review
→ M4 boundary
→ M5 decision check
→ M6 friction stack
→ Mid-Programme Personal Review
→ M7 support card
→ M8 research checklist
→ M9 decision rehearsal
→ M10 reviewable plan
→ Full Programme Personal Review
```

Missions 02–10 target roughly 5–8 minutes of meaningful active interaction each. Time is not a completion condition. No delay, countdown, mandatory return interval or artificial content padding is authorised.

## 2. Product boundary

The Programme remains adult decision support, private behavioural reflection, education and personal planning. It is not treatment, therapy, clinical intake, diagnosis, a risk score, gambling-readiness assessment or casino onboarding.

Every Mission uses this product grammar:

1. hook and practical objective;
2. interactive challenge;
3. build or personalise one useful result;
4. apply or rehearse the result;
5. review the result; and
6. receive deterministic completion feedback.

Each Mission normally exposes three rewardable actions and one completion bonus across four to six meaningful states. Explanatory copy stays short. Cards are used for actual choices, scenarios and built artefacts rather than as generic decoration.

Protected Help, leave and pause remain available. A support-first state contains no commercial content.

## 3. Mission titles and ordering

The public titles and order are immutable for this MVP:

| Mission | Title | Prerequisite |
| ---: | --- | ---: |
| 01 | Map the moment | none |
| 02 | Set a 7-day goal | 01 |
| 03 | Understand the urge | 02 |
| 04 | Build one boundary | 03 |
| 05 | Check before deciding | 04 |
| 06 | Add friction | 05 |
| 07 | Prepare support | 06 |
| 08 | Research responsibly | 07 |
| 09 | Rehearse the decision | 08 |
| 10 | Make the plan reviewable | 09 |

The server owns prerequisite, current Mission, action completion, Mission completion, next Mission and Review availability. The client cannot supply or override these facts.

## 4. Deterministic XP economy

Mission 01 remains:

| Action | XP |
| --- | ---: |
| situation submitted | 20 |
| Starting Point confirmed | 20 |
| clarification | 0 |
| registration | 0 |
| **Mission 01 total** | **40** |

Every Mission from 02 through 10 uses the following exact feature-on policy:

| Action | XP |
| --- | ---: |
| Action A | 15 |
| Action B | 20 |
| Action C | 15 |
| Mission completion | 25 |
| **Mission total** | **75** |

The clean PROGRAM-AI-v1 cumulative map is:

| Completed through | XP |
| --- | ---: |
| M1 | 40 |
| M2 | 115 |
| M3 | 190 |
| M4 | 265 |
| M5 | 340 |
| M6 | 415 |
| M7 | 490 |
| M8 | 565 |
| M9 | 640 |
| M10 | 715 |

Each logical action has one versioned server award key. A duplicate action, completion request, provider retry, refresh, navigation, multi-tab race or request retry cannot award XP again. Reviews, registration, commercial navigation and public page visits award zero XP. AI never decides reward amount or eligibility.

The existing deployed `UserXpEvent_mission_source_check` database constraint permits Missions 02–10 only with the ledger `eventType` value `MISSION_COMPLETION`; broadening that constraint would require the schema migration this package explicitly forbids. Missions 02–10 therefore use that existing storage discriminator for both their three logical action awards and their completion award. This is a storage-compatibility detail, not a product classification: exact versioned `awardKey`, `ProgramProgressEvent.eventKey`, XP amount and source artifact identify the logical action. No existing Mission 01 event semantics change.

## 5. Exact Mission contracts

### 5.1 Mission 02 — Set a 7-day goal

**Purpose:** turn the confirmed Starting Point into one small seven-day experiment. It is not a treatment plan.

| Action | XP | Completion evidence |
| --- | ---: | --- |
| `choose_direction` | 15 | one closed direction |
| `build_7_day_goal` | 20 | user confirms a selected or edited goal style |
| `reality_check` | 15 | one closed difficult-day response |
| completion | 25 | all three actions |

Directions are `understand`, `pause`, `reduce_impulse`, `set_boundary`, `research_later` or `seek_support`. AI may produce two or three concise candidate formulations from the Starting Point, direction and current local wording. The user, not AI output, completes the action. The result is a compact Goal Card. No amount disclosure or clinical confidence score is required.

### 5.2 Mission 03 — Understand the urge

| Action | XP | Completion evidence |
| --- | ---: | --- |
| `map_urge_sequence` | 15 | accessible cue-to-choice sequence interaction |
| `name_early_signal` | 20 | one closed signal category |
| `choose_pause_move` | 15 | one closed pause move |
| completion | 25 | all three actions |

The sequence is `Cue → Early signal → Urge builds → Choice point`. Drag and drop may never be the only interaction. Signal categories are `body`, `thought`, `attention`, `action_tendency` or `not_sure`. AI may reflect one possible pattern in tentative language. It cannot diagnose, label severity or claim knowledge outside supplied data.

### 5.3 Mission 04 — Build one boundary

| Action | XP | Completion evidence |
| --- | ---: | --- |
| `choose_boundary` | 15 | one closed boundary category and trigger |
| `build_boundary_rule` | 20 | user confirms one structured rule style |
| `choose_execution` | 15 | one closed execution method and pressure check |
| completion | 25 | all three actions |

Categories are `money`, `time`, `access` or `pause`. Trigger types are `before_access`, `saved_early_signal`, `scheduled_time` or `custom_local`. Execution methods are the approved operator-limit, bank-block, device/site-block, payment-removal, trusted-contact, leave, self-exclusion/Help or custom-local concepts. B4GAMBLE does not claim to enforce third-party controls. AI may help word the user-controlled rule.

### 5.4 Mission 05 — Check before deciding

| Action | XP |
| --- | ---: |
| `run_decision_check` | 15 |
| `build_three_checks` | 20 |
| `commit_pause_rule` | 15 |
| completion | 25 |

This is a deterministic decision game. The user selects exactly three approved checks, rehearses them in a second neutral scenario and commits one closed pause-rule type. It does not produce a responsible-gambler score and needs no AI call.

### 5.5 Mission 06 — Add friction

| Action | XP |
| --- | ---: |
| `choose_friction_layer` | 15 |
| `build_friction_stack` | 20 |
| `rehearse_bypass` | 15 |
| completion | 25 |

The Friction Lab permits one or two approved generic mechanisms. AI may suggest implementation order from the selected mechanisms only. It cannot select an operator. The bypass rehearsal selects one generic fallback. A factual layer count is allowed; a scientific friction score is not.

### 5.6 Mission 07 — Prepare support

| Action | XP |
| --- | ---: |
| `choose_support_route` | 15 |
| `build_support_card` | 20 |
| `choose_exit_action` | 15 |
| completion | 25 |

Support modes are closed generic categories and never require a person's identity. Personal wording remains local-first. AI may turn current choices into one concise `When X, I can Y` card. `not_ready` is an accepted support mode. Protected Help stays available and commercial content is absent from the support-first state.

### 5.7 Mission 08 — Research responsibly

| Action | XP |
| --- | ---: |
| `learn_comparison_signals` | 15 |
| `decode_offer_terms` | 20 |
| `build_research_checklist` | 15 |
| completion | 25 |

The Mission teaches only comparison concepts supported by current public product fields: licensing/regulatory status, operator identity, terms, withdrawal conditions, payments, safer-gambling tools and material offer conditions. It uses generic educational terms, not fictional operator inventory. The research checklist persists only closed criterion IDs.

After educational completion, a separate section may link to `/casinos`, `/compare`, `/bonuses`, `/best-offers` and `/bonus-guide`. Completion does not require a click. Private Programme state is never placed in a URL, ranking call or affiliate destination.

### 5.8 Mission 09 — Rehearse the decision

| Action | XP |
| --- | ---: |
| `choose_scenario` | 15 |
| `rehearse_response` | 20 |
| `build_fallback_response` | 15 |
| completion | 25 |

The user chooses one neutral scenario category. One bounded AI simulation may return a short scenario, a decision point and two to four response choices mapped to approved closed strategy IDs. Feedback is short and non-shaming. The user selects one fallback strategy. The rewardable path contains one scenario cycle; replay after completion awards zero XP.

### 5.9 Mission 10 — Make the plan reviewable

| Action | XP |
| --- | ---: |
| `review_my_plan` | 15 |
| `assemble_final_plan` | 20 |
| `choose_review_cadence` | 15 |
| completion | 25 |

The timeline shows only legitimately available Starting Point and structural facts. Missing output is omitted, never invented. AI may draft a concise plan from those facts and current local wording; the user reviews it. Cadence is exactly 7, 14 or 30 days and creates no email or reminder. `COMMS-REMINDER-01` remains outside scope.

## 6. Personal Reviews

Review entitlement is derived from Mission completion:

| Review | Unlock | Clean-cohort cumulative reference |
| --- | ---: | ---: |
| First Personal Review | M3 complete | 190 XP |
| Mid-Programme Personal Review | M6 complete | 415 XP |
| Full Programme Personal Review | M10 complete | 715 XP |

XP communicates distance but cannot unlock a Review. Opening or regenerating a Review awards zero XP. No Review table is added.

Reviews are generated on demand from the confirmed Starting Point, closed structural facts and completion state. Optional current-tab local wording may be included only when currently available. It is not required or persisted. Provider-off and provider-failure paths return a truthful deterministic structured Review.

- First Review: where the user started, seven-day direction, early signal/pause move and one focus for the next three Missions; maximum 250 words.
- Mid Review: adds boundary, decision checks, friction and one next focus; maximum 300 words.
- Full Review: `Where you started`, `What you built`, `What you now have in place`, `What to review next` and `Your plan in one screen`; maximum 450 words.

Reviews cannot contain diagnosis, risk/control/efficacy scores, gambling-readiness claims or commercial recommendations.

## 7. Persistence and local-first wording

This package adds no Prisma model, migration, table or generic memory store.

`ProgrammeMissionProgress` is the durable Mission 02–10 aggregate:

- `status` stores server-owned progression;
- `taskStates` stores completed versioned logical actions; and
- `draft` stores one namespaced, versioned, allow-listed structural artefact.

Allowed durable structural facts are:

| Mission | Allowed fields |
| ---: | --- |
| 02 | `direction`, `goalStyle`, `reviewWindowDays`, `realityCheck` |
| 03 | `earlySignalCategory`, `pauseMove`, `sequenceOrder` |
| 04 | `boundaryCategory`, `triggerType`, `executionMethod`, `pressureCheck` |
| 05 | `decisionChecks`, `pauseRuleType`, `scenarioChoice` |
| 06 | `frictionMethods`, `fallbackMethod`, `bypassReason` |
| 07 | `supportModes`, `exitActionType`, `supportCardStyle` |
| 08 | `researchCriteria`, `comparisonSignals`, `offerTermSignal` |
| 09 | `scenarioType`, `responseStrategy`, `fallbackStrategy` |
| 10 | `reviewCadenceDays`, `planPriorityIds`, `timelineReviewed` |

Unknown keys, values, versions, Mission numbers and array overflow are rejected before persistence. Durable artifacts contain no amount, loss value, operator/casino/bonus preference, voice, transcript, narrative, conversation, provider payload or hidden reasoning.

Optional personal wording stays in React state or the existing exact-subject tab-scoped `sessionStorage` namespace. It is isolated by actual Better Auth user ID after registration. It is not copied to commercial modules or URLs. Logout and user transition retain the existing exact-subject isolation rules.

## 8. Bounded feature-on architecture decision

Founder Office authorises one bounded `programAiMissionRegistry` and one bounded feature-on progression coordinator for Missions 02–10. This is a deliberate package-specific exception to the default rule against adding Missions to a central service. It is justified by the approved identical reward/idempotency transaction and closed structural-persistence contract across exactly nine Missions.

The exception is narrow:

- it does not modify or grow the compatibility `ProgrammeFlowService`;
- it does not replace the legacy Mission 01–04 vertical services;
- it is not a workflow DSL, generic Mission engine, base class or arbitrary switch;
- it cannot load prompt strings, action IDs, XP or artifact fields from client input;
- it contains exactly the approved Mission 02–10 definitions and cannot register runtime plugins; and
- Mission-specific validation and product content remain explicit typed contracts.

The feature-on registry records title, prerequisite, three actions, action XP, completion XP, Review unlock, AI operation and artifact version/schema. Routes remain thin and call one application operation. Repository methods persist/query owned enrollment progress and ledgers but do not decide eligibility or reward amounts.

## 9. Transaction and authorization contract

Missions 02–10 require an authenticated user and owned Programme enrollment. Anonymous requests, missing enrollment, foreign ownership, locked prerequisites, arbitrary Mission/action IDs and unsupported artifacts deny.

Every action transaction:

1. resolves the exact user-owned enrollment and Programme definition;
2. validates prerequisite and Mission state;
3. validates and merges only the action's closed structural facts;
4. records the action task state;
5. records its exact append-only XP event once; and
6. returns the server projection from the same transaction.

For the compatibility reason in section 4, step 5 writes the existing `MISSION_COMPLETION` XP ledger discriminator with an action-specific immutable award key. Eligibility and idempotency are still action-level and server-owned.

Every completion transaction:

1. verifies all three required actions;
2. records the `+25` completion event once;
3. marks Mission progress completed with stable `completedAt`;
4. makes the next Mission current without regressing higher progress;
5. records the active-day fact idempotently; and
6. returns the updated server Home/Mission projection.

OpenAI calls occur outside database transactions. Provider failure cannot remove completed actions, earned XP or structural progress.

## 10. Mission and Review APIs

The feature-on contract may use these coherent authenticated routes:

```text
GET  /api/program/program-ai/missions/:missionNumber
POST /api/program/program-ai/missions/:missionNumber/actions
POST /api/program/program-ai/missions/:missionNumber/guidance
POST /api/program/program-ai/missions/:missionNumber/complete
GET  /api/program/program-ai/reviews/:milestone
POST /api/program/program-ai/reviews/:milestone
```

Every mutation applies bounded JSON parsing, strict unknown-key rejection, enum and array limits, authenticated ownership, rate limiting and the existing no-store response/error contract. The client supplies no user ID, XP, completion state, entitlement or arbitrary prompt.

## 11. AI operations and provider boundary

The only Mission/Review operations are:

```text
M2_GOAL
M3_PATTERN_REFLECTION
M4_BOUNDARY_WORDING
M6_FRICTION_ORDER
M7_SUPPORT_CARD
M9_REHEARSAL
M10_FINAL_PLAN
REVIEW_M3
REVIEW_M6
REVIEW_M10
```

Mission 05 and Mission 08 remain deterministic. Each operation has an explicit request allow-list, strict operation-specific response schema and output ceiling. User text is delimited as untrusted data. Provider output is validated again locally and falls back on extra keys, malformed output, oversized strings, wrong operation, diagnostic content, XP instructions or commercial recommendations.

The existing OpenAI configuration remains:

- model `gpt-5.6-terra`;
- Responses API;
- reasoning `none`;
- `store=false`;
- `background=false`;
- no tools, web/file search, RAG, provider memory, `previous_response_id`, agent loop, TTS or realtime voice.

The ordinary first-time path makes at most one guidance call in each AI-enabled Mission and one call per Review, with a target ceiling of 10–12 calls across M2–M10 plus Reviews. Ordinary output is at most 500 tokens and Review output at most 700 tokens. No call occurs on render, navigation, click, animation, scroll, XP feedback or commercial navigation.

`PROGRAM_AI_REAL_PROVIDER_ENABLED=false`, an unavailable provider, timeout, rate limit, invalid JSON/schema or provider 5xx leaves every Mission completable with identical XP through a truthful deterministic fallback.

## 12. Programme Home, retention and Reviews

The server-owned feature-on Home shows:

- current Mission number and approved title;
- exact start/resume action;
- action progress and XP already earned in the current Mission;
- locked `+25` completion reward;
- completed/current/locked 10-step path;
- next Personal Review, exact remaining deterministic XP and Missions until unlock;
- available Reviews; and
- a visually secondary `Explore B4GAMBLE` rail.

Resume selects the first incomplete logical action. Completed actions remain reviewable but award zero further XP. Retention uses visible useful progress, near-term deterministic reward, Review distance and built artifacts. It does not use random rewards, XP loss/expiry, punitive streaks, fake urgency, chance multipliers or casino-like mechanics.

## 13. Commercial discovery separation

Programme Home links generically to `/casinos`, `/compare`, `/bonuses` and `/best-offers`. Mission 08 may additionally link to `/bonus-guide`. Mission 10 may show a separate `What next?` section with Programme return and generic discovery links.

These are ordinary internal links with fixed route targets and order. They receive no Starting Point, Mission artifact, local wording, Review, XP, support or completion payload. Programme code does not invoke ranking, recommendation, offer selection or affiliate resolution. Clicks award zero XP and are never required for completion.

Commercial/referral capability, Production partner state and public destination-page authority remain unchanged and fail closed according to their existing contracts.

## 14. Legacy compatibility

- Completed legacy Missions remain complete and are never repeated merely to unlock the next Mission.
- Historical Mission 01 `+60` remains immutable.
- New PROGRAM-AI Mission 01 remains `+40`.
- Existing XP never decreases.
- A completed legacy Mission 02–04 receives no retroactive PROGRAM-AI-v1 action or completion reward.
- Incomplete legacy Mission 02–04 keeps historical XP and may begin the new feature-on meaningful actions without fabricated action completion.
- Users already beyond a Mission are not moved backward.
- Review entitlement uses Mission completion rather than exact XP total, so a legacy complete Programme may truthfully differ from 715 XP.

## 15. Design and accessibility authority

No new Figma workstream is opened. The build target is the merged `ProgramAiExperience`, current Programme Home, RFC-010 interaction reference lock and Design System v1.

Reference lock:

- **Primary:** existing PROGRAM-AI paper/night product theatre, Archivo hierarchy and current Home density;
- **Preserve:** paper canvas, night result surfaces, teal safety/verified semantics, acid only for primary action/progress, visible focus, bold compact labels and object-like built artefacts;
- **Borrow:** accessible choice/sequence/scenario grammar and live artefact reveal from the legacy Mission 03–04 implementation;
- **Reject:** generic form pages, equal decorative card grids, indigo/purple UI, casino imagery, confetti, fake scores and commercial CTA inside reward feedback;
- **Media:** no new imagery is required; Mission mechanics and real existing product components carry the experience.

Motion is functional feedback, continuity or hierarchy only. Action feedback is small; Mission and Review unlock feedback is stronger but restrained. Reduced motion removes non-essential movement.

Required accessibility includes semantic headings, fieldset/legend for grouped choices, keyboard operation, visible focus, polite screen-reader XP status, active Mission `aria-current`, locked disabled semantics, non-colour-only state, sensible focus movement, usable touch targets and no drag-only interaction.

Representative viewports are 375, 390, 768, 1024 and 1440 pixels with no horizontal overflow.

## 16. Public truth reconciliation

The public `/10-steps` page must describe the approved product rather than deployment configuration:

- Mission 01 remains named `Map the moment`;
- new flow value is a personalised Starting Point and 40 XP;
- registration awards zero XP and saves the already-earned Starting Point/XP;
- Missions 02–10 are the real MVP path rather than planned placeholders; and
- no copy claims that Programme completion makes gambling safe or qualifies someone for an operator.

Production feature flags remain off unless separately activated. The consumer page does not expose environment language.

## 17. Operations, rollout and rollback

This RFC adds no dependency, schema change, migration, database push, Production credential or Production data mutation.

Rollback sets `PROGRAM_AI_V1_ENABLED=false`, restoring the existing feature-off runtime without deleting progress or XP. Provider rollback independently sets `PROGRAM_AI_REAL_PROVIDER_ENABLED=false`; deterministic Missions and Reviews continue.

Preview validation may use only the existing isolated Preview database and synthetic/test identities. Preview and Production identity must be proven before live access. Recovery canary `73a3c254-8ffb-4d35-b91f-9fb7436ad45f` is outside scope and must not be read, changed or deleted by this work.

Production PROGRAM-AI, Production Google, affiliate capability, reminders and Production OpenAI credentials remain unchanged and off.

## 18. Verification and release gates

Required deterministic evidence includes:

- all Mission contracts and unknown-key rejection;
- sequential and concurrent duplicate action/completion behavior;
- prerequisite bypass, anonymous access and foreign-user denial;
- clean M1→M10 `715 XP` progression and refresh/resume;
- legacy M1 `+60`, completed M2–M4 and PROGRAM-AI M1 `+40` preservation;
- First/Mid/Full Review completion-based entitlement and zero Review XP;
- provider-off and provider-failure completion with identical rewards;
- commercial route immutability and private-data absence;
- no direct affiliate destination and no completion dependency on clicks;
- feature-off Programme and merged Mission 01 regressions;
- keyboard, focus, reduced-motion, responsive and no-overflow behavior;
- lint, typecheck, Prisma validation, Programme tests, PROGRAM-AI tests, build and database-backed browser tests; and
- exact-head CI and safe Preview evidence where bindings are available.

Live synthetic provider evaluation is bounded to approximately USD 0.25 and reports aggregate tokens, cost, latency, schema/safety quality and provider errors without printing fixture inputs or outputs.

No release claim may exceed evidence. Unavailable live Preview bindings, exact-head CI or manual screen-reader evidence remain explicit release gates rather than inferred passes.

## 19. Evidence classification at approval

- **Detected:** exact base `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`; merged PROGRAM-AI M1; server-owned enrollment/progression and append-only XP; `ProgrammeMissionProgress.status/taskStates/draft`; Serializable unit of work; subject-scoped `sessionStorage`; fixed public discovery routes; Design System v1; feature-off legacy runtime; no required dependency or schema change.
- **Inferred:** the existing JSON draft can safely retain the approved closed versioned structural facts when every mutation parses an exact allow-list and preserves namespace/version.
- **Planned by this RFC:** feature-on Missions 02–10, action rewards, three generated/fallback Reviews, full Home/resume, bounded Mission AI guidance, public truth reconciliation and the focused regression/browser evidence.
- **Not detected / not authorised:** Production PROGRAM-AI/provider/Google activation, a reminder transport, a new data model, a general agent/workflow platform, commercial targeting from Programme data, affiliate activation, real partner inventory or unrestricted real-user provider use.

## 20. Definition-of-Done exceptions and open release gates

No schema/migration/preflight is required because migration impact is explicitly `none`. No new telemetry provider is introduced. Existing distributed rate limiting, automated expiry cleanup, error paging/APM and durable age-attestation gaps remain open operational gates and are not expanded by this package.

The package may be recommended as the bounded Programme MVP only after the exact implementation head satisfies the verification evidence above. It does not make B4GAMBLE GB launch-ready and does not authorise a Production flag change.

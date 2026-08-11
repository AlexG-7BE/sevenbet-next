# PROGRAM-AI-IMPL-01B Implementation Evidence

- **Authority:** RFC-025
- **Repository root:** `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`
- **Base:** `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`
- **Branch:** `codex/program-ai-impl-01b-missions-02-10-mvp`
- **Captured:** 2026-08-11
- **Scope:** Feature-on Missions 02–10, Personal Reviews, Programme Home/resume, bounded Mission AI guidance and public truth reconciliation

## Repository evidence method

The active repository root was confirmed with Git before this record was updated. All 909 tracked files were included in the repository inventory. Source claims below were checked against the active `app`, `components`, `lib`, `tests`, `prisma`, `scripts`, `docs`, configuration and package files. Dependencies, `.next`, Playwright artefacts, caches and `tsconfig.tsbuildinfo` were excluded from implementation analysis. No secret value was inspected or recorded.

## Detected

- The feature-on Programme routes authenticated users from the merged Mission 01 journey to a server-projected Home and Missions 02–10. The feature-off route continues to use the legacy Programme.
- The bounded Mission registry contains exactly Missions 02–10, their immutable order, three action IDs, `15 + 20 + 15` action XP, `+25` completion XP, prerequisites, titles and optional AI operations.
- Action and completion eligibility, progression, Review availability and next Mission are calculated in the application service, not in React.
- Each action and completion uses a versioned immutable award key inside the Serializable Programme unit of work. Concurrent duplicate action/completion tests award once.
- A clean Programme path produces Mission 01 `40 XP`, nine later Missions at `75 XP` each and exactly `715 XP` after Mission 10.
- Historical Mission 01 `60 XP` and completed legacy Missions 02–04 remain complete and receive no retroactive feature-on rewards.
- Durable Mission facts use the existing `ProgrammeMissionProgress` aggregate and one versioned `programAiV1` namespace. Strict per-action validation rejects unknown keys, values, Mission numbers, versions and array overflow before persistence.
- Optional user wording stays in exact-subject, tab-scoped `sessionStorage`; it is not added to durable Mission artefacts or public/commercial URLs.
- First, Mid and Full Personal Reviews unlock from completion of Missions 03, 06 and 10. Reviews use confirmed structural facts, award zero XP and have deterministic provider-off/provider-failure results.
- The OpenAI boundary contains exactly ten named Mission/Review operations, one bounded Responses request per invocation, `gpt-5.6-terra`, reasoning `none`, no tools, `store=false`, `background=false`, strict response schemas and local safety validation.
- Mission 05 and Mission 08 are deterministic. All rewardable Mission paths remain completable without OpenAI.
- Programme Home and the optional Mission 08/Mission 10 discovery sections use fixed internal routes. They do not pass Programme state, call ranking or affiliate resolution, award XP or gate completion.
- The public `/10-steps` product copy now describes Mission 01 as a `40 XP` Starting Point, registration as `0 XP`, and Missions 02–10 as the approved MVP path.
- The authenticated experience is split into shared Header, Home, Mission and Review components with one scoped style module. It reuses the existing Design System tokens and Action control.
- The Founder product-quality correction adds nine reusable consumer interaction primitives: choice cards, sequence building, scenario panels, guided candidate selection, friction-stack building, decision application, offer decoding, a Programme timeline and human-readable artefact presentation. Missions still persist only the RFC-approved closed structural values.
- Mission 03 now begins with a deliberately incorrect sequence and blocks save, XP and progression until the user corrects it. Mission 05 requires a first decision check, a second scenario and application of all three confirmed checks before its pause rule can be completed.
- Mission 09’s provider-off candidates are contextual to the chosen scenario and map back to the exact closed `responseStrategy` contract. The selected candidate remains visible through the action rather than becoming an unseen payload.
- Mission 10 reads completed Mission 02–09 artefacts from the server-owned progress aggregate, projects only available structural facts into the human-labelled timeline and omits missing facts. Its final-plan context contains exactly the confirmed Starting Point, those structural facts and the already-persisted `planPriorityIds`; generation occurs after the priority action and before cadence confirmation. Provider-off generation uses the same bounded facts rather than a generic plan sentence.
- Consumer Home, Reviews, Mission results and commercial discovery rails present human labels and product language; internal field names, raw enum values, provider state, source/debug markers and zero-XP implementation metadata are not rendered as the primary interface.
- Responsive presentation rules explicitly cover 375, 390, 768, 1024 and 1440 pixel viewports, keyboard focus and reduced-motion behavior.
- Existing valid tab-scoped access authority is reused by Mission action, Mission guidance, Mission completion and generated Review requests; it is not recreated or promoted into durable state.
- Automated browser evidence covers real authentication/claim, refresh/resume, concurrent duplicate action submission, representative builder/scenario/result states across all nine later Missions, three Review unlocks, final `715 XP`, legacy collision, protected Help, reduced motion, keyboard operation and 375/390/768/1024/1440 rendering without horizontal overflow.
- Local verification passed: lint, typecheck, Prisma validation, Programme tests, PROGRAM-AI tests, production build, disposable-database migration/seed and all eight database-backed PROGRAM-AI browser tests.

## Inferred

- The existing `ProgrammeMissionProgress.draft` JSON field is sufficient for this bounded MVP because every write is namespaced, versioned and validated against a closed Mission-specific structural allow-list.
- The current `UserXpEvent_mission_source_check` makes the existing `MISSION_COMPLETION` value the only migration-free storage discriminator for Mission 02–10 action and completion ledgers. Product semantics remain recoverable from immutable action-specific award/event keys and XP values.
- The existing paper/night Programme visual language and shared interaction primitives are sufficient for the MVP without new imagery, Figma production or a global Design System revision.
- The Founder quality correction is a presentation and interaction refinement within RFC-025’s existing action grammars; it does not introduce a new product, architecture, reward or persistence decision requiring another RFC.

## Planned outside this implementation

- Founder Office review and any merge decision.
- A separately authorised Production flag change or deployment.
- Reminder transport, email cadence or notifications for Mission 10 review cadence.
- Any broader operational work for distributed rate limiting, durable age attestation, automated expiry cleanup or APM/error paging already recorded as Programme gates.

## Not detected or not authorised

- No dependency or lockfile change.
- No Prisma schema, migration, model, table, preflight or destructive database operation.
- No client-side XP, completion, prerequisite, next-Mission or Review-entitlement calculation.
- No generic workflow engine, Mission DSL, agent loop, provider memory, RAG, search tool, new ORM or state framework.
- No persisted raw narrative, transcript, voice, amount, loss value, operator preference, casino preference, bonus preference, provider payload or hidden reasoning for Missions 02–10.
- No Programme-derived ranking, targeting, affiliate destination or commercial personalisation.
- No Production deployment, Production data mutation, Production PROGRAM-AI/OpenAI/Google activation, affiliate flag change or synthetic Production data.
- No access to or mutation of the Recovery canary.

## Release-gate status at implementation head

| Gate | Evidence |
| --- | --- |
| Mission contracts and `715 XP` | Passed by unit/service and database-backed browser suites |
| Duplicate action/completion | Passed sequential and concurrent assertions |
| Prerequisite and ownership | Passed service and route-level denial assertions |
| Review entitlement and zero XP | Passed at Missions 03, 06 and 10 |
| Provider-off/failure | Passed deterministic fallback tests and browser path |
| Commercial firewall | Passed fixed-route/private-data structural assertions |
| Feature-off and Mission 01 regression | Passed existing structural/browser regression coverage |
| Responsive, keyboard and reduced motion | Passed automated representative coverage; no manual screen-reader session claimed |
| Exact-head CI | External gate; evidence belongs in the draft PR handoff |
| Preview deployment and binding identity | External gate; evidence or exact blocker belongs in the draft PR handoff |
| Live real-provider smoke/eval | Optional only when safe Preview configuration is available; no live result is inferred |

This evidence does not claim GB launch readiness, Production activation or permission to merge.

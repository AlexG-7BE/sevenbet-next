---
Title: RFC-002 — Active Control Program and Personal Control Dashboard
Status: Approved
Classification: Internal
Owner: Founder / Product
Date: 2026-08-02
Decision: Make the 10-Step Control Program an action-based progression system and make the Personal Control Dashboard its primary return surface.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../01_Product_Master_Plan/Product-Master-Plan.md
  - ./RFC-001-Jurisdiction-and-Market-Resolution.md
---

# RFC-002 — Active Control Program and Personal Control Dashboard

## Decision summary

SevenBet SHALL evolve the 10-Step Control Program from a primarily informational sequence into an **action-based decision-support programme**. Each step will ask the user to perform one bounded, useful action: learn a relevant concept, make a decision, create or revise a personal boundary, or choose a safety-oriented next action.

The programme's primary return surface SHALL be a **Personal Control Dashboard**. It will show the user's current mission, completed actions, optional saved decision plan, educational items, XP, achievements, streaks, and options to pause, seek support, revise a boundary, continue learning, or independently explore commercial discovery.

The programme is a learning-game layer within a commercial product, not a gambling loyalty system. Programme progression may require completion of the current programme action to advance to the next programme action, but a person may always pause, leave, skip a non-essential action, use support, or access public discovery independently. No gambling, deposit, referral, gambling-session, or revenue action may advance progress, award XP, advance a streak, or unlock an achievement.

This RFC supersedes the blanket MVP exclusion of "achievements or progress mechanics" in the Product Master Plan only for the constrained model defined here. All other progress or achievement mechanics remain excluded unless separately approved.

## 1. Problem and intended outcome

An informational carousel does not reliably create a useful outcome. It can be read without reflection, produces no durable user value, and gives the user no credible reason to return. The result risks making SevenBet's core product look like a decorative self-check before commercial discovery.

The intended outcome is a practical personal control tool. A user completes small actions that form a private, editable decision plan and can return to that plan when context changes. The product should be as clear and motivating as a high-quality learning product: a visible next task, constrained cognitive load, immediate feedback, and evident progress. It must not reproduce the reward loops, pressure, or commercial incentives of a gambling product.

## 2. Product rules

1. **One meaningful action per step.** A step is complete only after the user performs its stated learning, planning, or control action. Passive exposure to a screen alone is not completion.
2. **Progress means useful work, not compliance.** Progress represents completed decision-support actions and the assembled personal plan. It is never a measure of suitability to gamble, loyalty, or commercial value.
3. **Account access and programme gating are bounded.** A visitor may complete Mission 01 in an ephemeral, private session. A SevenBet account is required immediately after that first useful action to save its result and to open Mission 02 or any persistent personal programme state. Completing a mission may open the next mission within that Program. Neither account creation nor mission completion may unlock casino discovery, operator referrals, bonus access, or better commercial treatment.
4. **Agency remains intact.** Every mission has an obvious leave route. A user may pause the programme at any time; non-essential reflection inputs may be skipped; no sensitive disclosure is required to exit or use support.
5. **Safety prevails over sequence.** A pause or support route can interrupt the sequence at any point. It records a valid outcome, never a failure, and must not be adjacent to gambling or affiliate CTAs.
6. **Registration follows the first useful action, not the public entry.** A visitor may complete Mission 01 without registration. At its completion, SevenBet asks the visitor to create an account to save the selected cue and continue to Mission 02. Until registration succeeds, the cue exists only in the current session; it must not become a commercial profile or be used for promotion. Discovery, educational research and Help remain usable without registration.
7. **Evidence is not treatment.** Health, psychological, and medical-adjacent material is educational, sourced, dated, and clinically/content reviewed. SevenBet does not diagnose, treat, or claim therapeutic outcomes.
8. **No optimisation for commercial conversion.** Progress data, completed missions, personal boundaries, pause states, or safety-sensitive responses must not be used to increase promotion, ranking, referral, deposits, or play.

## 3. The 10 active missions

The following is the approved product map. Exact wording, jurisdictional variants, and content modules require content/compliance review before release.

| Step | Mission | Required programme action | User-owned result |
| --- | --- | --- | --- |
| 01 | Name the moment | Select the current decision context; optionally add a short note. | A private check-in and stated intent. |
| 02 | Set the goal | Choose the useful near-term goal: learn, pause, research, reduce impulse, or decide later. | A current goal that can steer the Dashboard. |
| 03 | Understand the urge | Complete a short evidence-based learning interaction and identify one personal early signal or use a neutral "not now" path. | A reviewed learning item and optional reflection. |
| 04 | Build one boundary | Create, select, or revise one concrete personal rule. | An editable active boundary. |
| 05 | Check before deciding | Complete a fact-check exercise using material terms, source quality, and uncertainty. | A personal decision checklist. |
| 06 | Add friction | Choose and record one pause, limit, notification, or environmental friction action that is appropriate to the user. | A practical control action or deferred plan. |
| 07 | Prepare support | Review support choices and select a contact/resource plan, or explicitly decline for now. | A private support plan or informed deferral. |
| 08 | Research responsibly | If the user elects to research operators, apply the checklist to eligible information; otherwise choose a non-commercial learning or pause action. | Research criteria, never a required referral. |
| 09 | Rehearse the decision | Complete a brief scenario or implementation-intention exercise for a likely future moment. | A "when / then" decision rule. |
| 10 | Make the plan reviewable | Confirm, edit, or reject the assembled plan and choose the next self-directed action. | A personal decision plan, pause, support, research, or no-play outcome. |

No mission may require an admission of harm, an account, payment data, a gambling history, a referral, or an operator interaction. A mission that references a local control tool must accurately describe its jurisdictional availability and route to non-commercial information where unavailable.

## 4. Progress and acknowledgement model

### 4.1 Allowed mechanics

- A private 10-step path with statuses: `not_started`, `current`, `completed`, `skipped`, and `paused`.
- A visible current mission, completed-action count, and plain-language explanation of what will happen next.
- Completion acknowledgement that names the useful artefact created, such as "Your boundary is saved".
- Optional private reminders set and controlled by the user.
- A private XP balance, visible achievement collection, and learning streak for completed Program actions.
- A clear, deterministic acknowledgement of the XP or achievement earned for a completed Program action.
- Optional reminders controlled by the user; a reminder may mention an active streak but must not use loss aversion, punishment language, or a false deadline.

### 4.2 Prohibited mechanics

- Coins, cash-equivalent rewards, operator bonuses, levels that signal gambling readiness, leaderboards, competitive scores, scarcity timers, loss aversion, or variable rewards.
- XP, achievements, streaks, rewards or progress tied to gambling, deposits, losses, time on gambling sites, referrals, operator registration, or commercial clicks.
- A completion claim that implies a person is safe to gamble, has solved a health problem, or is entitled to a commercial offer.
- Notifications designed to pressure return or completion.
- Public sharing of progress or social comparison.

### 4.3 Approved interaction direction for mission design

The ten missions SHALL not be implemented as ten visually identical forms. A mission is a short sequence of purposeful states that uses the interaction appropriate to its user outcome. The current visual direction is:

- **Choose:** Missions 01, 02, 07 and 08 use a clear choice, explain its immediate consequence, and save a user-owned result.
- **Check:** Missions 03 and 05 use evidence-led learning, source visibility, a short verification or scenario action, and an explained result.
- **Build:** Missions 04, 06, 09 and 10 use a plan-composer interaction that creates, edits, rehearses or reviews a reusable personal rule.

Every mission sequence must show: the task, why it matters, the action, an immediate plain-language result, the deterministic XP or achievement consequence where applicable, and the next safe choice. The existing Personal Control Dashboard visual shell is the standard for the authenticated Programme. Mission screens may vary in composition, density, surface and interaction, but must retain the same calm, private character.

## 5. Personal Control Dashboard

The Dashboard is the home for a returning Programme user. It combines personal progress with clearly separated commercial discovery; it is not a casino account area or a commercial performance surface.

### 5.1 Required blocks

1. **Current mission:** one clear action, time expectation where helpful, and `Continue` / `Pause` / `Leave` choices.
2. **My path:** the 10 missions with truthful status and an explanation for any unavailable next mission.
3. **My active plan:** saved boundaries, checklist, implementation intentions, and any user-selected support plan; all editable and removable.
4. **Learn with evidence:** short reviewed learning cards with source, review date, content owner, and clear safety/help route.
5. **Safe actions:** pause, Responsible Gambling Hub, self-exclusion information where applicable, professional/external support, export/delete controls where data is persisted.
6. **Commercial discovery:** persistent, plainly labelled navigation to `Casinos`, `Bonuses`, and `Best offers`; these routes remain visually and analytically separate from Program rewards and completion.

### 5.2 Dashboard states

| State | Primary experience | Commercial rule |
| --- | --- | --- |
| New / first mission | Explain the active tool and begin Mission 01. | Persistent commercial navigation may be available; Program progress does not alter it. |
| Active | Show current mission and saved artefacts. | `Casinos`, `Bonuses`, and `Best offers` remain available as separately labelled navigation, never as a mission reward. |
| Paused | Respect the pause; show return, support, and delete options. | Commercial navigation is suppressed in the dedicated Protected Help route. |
| Completed | Show editable plan and self-directed next actions. | Never automatic referral, bonus unlock, or implied readiness to gamble. |
| Support-seeking | Route to protected Help experience. | Casino, bonus, and affiliate CTA absent. |

## 6. Data, privacy, and backend contract

This RFC is a **target product contract**, not a claim that the current implementation already exposes these capabilities. A technical audit and Domain Model decision must validate or design the persistence model before implementation.

### 6.1 Account creation after Mission 01

A visitor may use Discovery, public education and Help without an account. A visitor who selects **Start my Control Program** may complete Mission 01 in the current session. On selecting **Save this moment and continue**, the account screen must explain the concrete benefit: saving the just-created cue into a private, persistent personal plan with subsequent actions, boundaries, evidence cards and return access. It must state that this is not an operator account, does not create a gambling profile, and does not require marketing consent.

**Detected baseline (2026-08-02):** `lib/auth/config.ts` enables Better Auth email-and-password authentication. The initial product UI SHALL use email and password; it must not imply magic-link, social, or identity-verification support unless a later technical decision adds it.

On successful account creation, SevenBet persists the Mission 01 cue, creates a new personal Programme state, and enters Mission 02. A failed or abandoned registration discards the ephemeral cue at session end and cannot expose or create a partial commercial user state; it should return the visitor to Mission 01, the public Program explainer, Discovery or Help. Consent record, retention, deletion/export behaviour, and cross-device conflict semantics remain Domain Model and privacy delivery gates.

The minimum conceptual record is:

```text
ControlProgrammeState
  subject: anonymous session or consented account
  mission status and timestamps
  user-selected artefacts: boundary, checklist, plan, learning acknowledgements
  consent / retention / deletion state
  content and programme version references
```

Required controls:

- Store only what is necessary for the explicit user benefit.
- Separate safety-sensitive programme data from affiliate, ranking, and promotional decision inputs.
- Do not expose personal artefacts to operators or partners.
- Support editing, deletion, and export according to the approved privacy policy.
- Use aggregated, privacy-preserving product analytics. Do not use a safety or pause status to create promotional segments.
- Record programme/content version so users and reviewers can understand what material shaped a saved plan.

## 7. Educational and health-content governance

Every evidence card used in a mission must have: a named source, source URL or controlled source reference, publication/review date, content owner, applicable market/language scope, and a next review date. Material that makes medical, psychological, or behavioural-health claims requires the defined clinical/content review route before publication.

The product may explain concepts such as urges, decision friction, self-exclusion, or support pathways. It must clearly state its limits, avoid diagnosing an individual, and make professional or emergency support discoverable where appropriate. It must not present a quiz answer or programme completion as a clinical assessment.

## 8. Measurement and safety stop signals

Primary outcomes remain the Product Vision North Star: voluntary confirmation that SevenBet helped a person make a more informed decision consistent with their personal boundaries. Programme completion is a diagnostic metric only; it is never a revenue proxy or success metric on its own.

Supporting product measures:

- voluntary mission completion and revisit rate;
- creation, review, or revision of a personal boundary/checklist;
- voluntary use of pause, support, or non-commercial learning routes;
- user-reported clarity and agency;
- task abandonment reasons, gathered without pressure.

Safety stop signals include:

- evidence that users perceive a mission as a gate to gambling or a route to an offer;
- any linkage of XP, achievements, streaks, completion, pause or safety state with personalised promotional exposure;
- completion patterns that show coercion, confusion, or accidental data capture;
- unsourced, stale, clinically unreviewed, or market-inapplicable educational content;
- inability to honour pause, deletion, or support-path rules.

Any stop signal blocks expansion and triggers Product, Compliance, and Content review.

## 9. Consequences and delivery gates

### Positive consequences

- SevenBet has a repeatable return value beyond affiliate discovery.
- Users create a practical, revisitable control plan rather than merely consume content.
- The Dashboard provides a coherent product home for optional saved progress, education, and support.

### Risks

- Progress can become coercive or be misread as gambling readiness.
- Personal reflections can introduce privacy and safety-sensitive data.
- Health content can create clinical, legal, and localisation risk.
- A visually game-like interface can undermine the calm, regulated-first promise.

### Gates before implementation

1. Product maps every mission to a user problem, one valid completion action, skip/pause rule, artefact, and safety route.
2. Content/clinical review defines the evidence-card standard, approval workflow, sources, and review cadence.
3. Compliance confirms jurisdictional treatment of limit, pause, self-exclusion, age, and support information.
4. Architecture and Domain Model define consent, anonymous/session handling, persistence, deletion/export, access control, and analytics segregation.
5. UX validates that discovery is independently available and that no screen frames completion as permission or encouragement to gamble.
6. The launch plan includes testable analytics and stop-signal monitoring that do not treat conversion as success.

## 10. Documentation changes

- Product Master Plan §12.3 is narrowed by this approved RFC: the defined private action-based progression and Dashboard are in MVP scope subject to the gates above.
- The Product Vision permits a learning-game layer. Program XP, achievements and streaks are earned only by defined Program actions; discovery is not unlocked by completion, and commercial eligibility, ranking and promotional exposure are not affected by Program state.
- Figma and implementation work must use this RFC as the source of truth for the Programme and Dashboard until superseded.

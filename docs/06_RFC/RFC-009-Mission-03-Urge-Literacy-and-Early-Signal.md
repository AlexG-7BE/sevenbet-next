---
Title: RFC-009 — Mission 03 Urge Literacy and Early Signal
Status: Approved
Classification: Internal
Owner: Founder / Product / Clinical-content review / Design / Engineering
Date: 2026-08-04
Decision: Define Mission 03 as a sourced learn-by-doing sequence that helps an adult recognise one early urge signal without diagnosis, coercion or compulsory sensitive disclosure.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ./RFC-002-Active-Control-Program-and-Dashboard.md
  - ./RFC-007-Tilt-Locked-Human-Product-Theatre.md
  - ./RFC-008-Programme-Persistence-Rewards-and-Privacy.md
---

# RFC-009 — Mission 03 Urge Literacy and Early Signal

> **Persistence supersession — 2026-08-09:** [RFC-017](RFC-017-GB-Legal-Privacy-and-Launch-Remediation.md) supersedes this RFC only for early-signal narrative/category persistence. Personal signal content is browser-session local; the server records the bounded `local`/`not_now` choice and approved learning/completion facts. Mission content, order and `+90 XP` remain unchanged.

## Status and decision boundary

Founder/product approval was recorded on 2026-08-04. This RFC authorises backend and frontend implementation of the defined Mission 03 flow, the deterministic `+90 XP` reward, the private `UrgeLearningRecord` aggregate and the post-mission Dashboard state.

Clinical-content and compliance review remain release gates for publishing Mission 03 to users. Approval of this RFC does not represent clinical validation of the SevenBet Programme.

Mission 03 SHALL teach a small, evidence-bounded model of cue, urge experience and action. The learner SHALL apply the model to a neutral scenario, identify one personal early signal or choose a neutral `not now` route, and review the saved result before completion.

Mission 03 is an educational self-management tool. It is not a diagnostic, treatment, clinical assessment or prediction of what any individual will experience.

## Intended outcome

At the end of Mission 03 the learner can distinguish:

1. a cue or situation;
2. an urge experience, which may include thoughts, attention shifts, body sensations or an impulse to act; and
3. the later gambling action.

The useful output is one private early-signal card that can be recognised before the action. A learner who does not want to record a personal signal can complete the evidence review and save `not now` without inventing or disclosing sensitive information.

## Evidence boundary

The learning content MAY state that gambling-related cues can be associated with increased subjective urge in research participants and that NICE guidance recommends understanding triggers and cravings as part of assessment and relapse-prevention work.

It SHALL NOT state that:

- every urge follows a fixed curve or duration;
- noticing a signal will prevent gambling;
- a selected signal proves addiction or gambling disorder;
- SevenBet delivers CBT or clinical treatment;
- the complete SevenBet Programme has been clinically evaluated.

The visual `urge wave` is an educational interaction showing that intensity can change from moment to moment. It is not a timer, forecast or promise that an urge will pass within a specified period.

### Initial evidence register

| Source | Product claim supported | Limitation shown in-product |
| --- | --- | --- |
| [NICE NG248 recommendations](https://www.nice.org.uk/guidance/ng248/chapter/recommendations), published 28 January 2025 | Factors contributing to continued gambling can include triggers, cravings, thoughts and emotions; understanding causes and triggers can be helpful in relapse prevention. | NICE recommendations concern support and treatment services; SevenBet is not delivering clinician-led CBT. |
| [NHS help for problems with gambling](https://www.nhs.uk/live-well/addiction-support/gambling-addiction/) | Gambling-related harms can affect mental health, finances and relationships, and specialist help is available. | The NHS page does not validate SevenBet or this mission. |
| [Craving in gambling disorder: a systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10260221/) | Gambling-relevant cues and craving are studied across subjective, physiological and neural measures. | Evidence is heterogeneous and does not establish a universal personal urge pattern. |
| [Neural substrates of cue reactivity and craving in gambling disorder](https://pmc.ncbi.nlm.nih.gov/articles/PMC5545724/) | In a small treatment-seeking sample, personally tailored gambling cues increased craving ratings relative to control conditions. | Small laboratory study; it does not predict an individual user's response or demonstrate SevenBet effectiveness. |

Every published learning item SHALL carry a content version, source list, publication or review date, content owner, reviewer and next-review date. Clinical-content review remains a release gate.

## Mission sequence

The target active-participation range is 18–24 minutes. Completion is based on required work, never elapsed time.

| Screen | Stage | Required learner action | Immediate product response |
| --- | --- | --- | --- |
| 01 | Orient | Review the outcome, privacy note and evidence limitation. | Shows the eight-part mission path and estimated participation range. |
| 02 | Learn the model | Reveal and order `cue → urge experience → action`. | Explains each layer with one concise example and source access. |
| 03 | Explore change | Move through four moments on the educational urge-wave visual and compare intensity. | Shows that intensity and signals can differ across moments; repeats that the visual is not a forecast. |
| 04 | Apply to a scenario | Identify the earliest available signal in a short neutral gambling scenario. | Gives immediate explained feedback; an incorrect answer can be retried without penalty. |
| 05 | Scan signal types | Review body, thought, attention and action-tendency examples, then choose one category, `not sure yet`, or `not now`. | Narrows the next screen without assigning a diagnosis. |
| 06 | Build the signal | Select a neutral example or optionally write one short personal signal. | Produces a private early-signal card linked to the learner's existing Moment Map when available. |
| 07 | Check meaning | Confirm that a signal is information to pause and notice, not proof of failure or a command to act. | Gives explained feedback and records the evidence item as reviewed. |
| 08 | Review and complete | Review the card, privacy controls, evidence note and next safe choice. | Atomically saves the learning record, completes Mission 03, awards the deterministic reward and makes Mission 04 current. |

Exiting after any completed task SHALL preserve a resumable draft. The mission SHALL show progress as task completion, not time spent.

## Interaction and visual contract

- One principal decision or learning action per screen.
- Persistent mission progress, exit, private-state indication and protected Help access.
- Existing Tilt-Locked foundations, navigation shell, tokens and core components SHALL be reused.
- The primary visual device is the `urge wave`: a bold, editorial, interactive learning graphic rather than a clinical chart.
- White or warm-light learning canvas, black type, dark shell and restrained CTA-only yellow remain the primary hierarchy.
- Success feedback is isolated from the learning task and explains what was saved.
- Commercial navigation may remain in global chrome, but no casino, bonus, offer or affiliate CTA may appear inside the mission body, feedback, saved-result or reward surfaces.
- No countdown pressure, streak-loss threat, leaderboard or penalty for an incorrect answer or delayed return.

## Completion, persistence and reward proposal

Mission 03 completion requires all of the following:

1. the current learning item and evidence limitation were reviewed;
2. the scenario check was answered correctly after any number of retries;
3. the meaning check was answered correctly after any number of retries; and
4. either an early signal was saved or the explicit `not now` path was saved.

The deterministic reward is `+90 XP` with no new achievement. The Dashboard after Mission 03 SHALL show `230 XP` total, `3 of 10 complete`, Mission 04 as current, the reviewed learning record, and the private early-signal card only when one was intentionally saved.

XP, active-day and idempotency semantics SHALL reuse RFC-008. No commercial action is eligible for XP or mission completion.

## Private data contract

The canonical persisted aggregate is `UrgeLearningRecord` owned through `ProgramEnrollment`:

- `missionVersion`
- `learningItemId`
- `evidenceVersion`
- `reviewedAt`
- `scenarioCheckCompletedAt`
- `meaningCheckCompletedAt`
- optional `earlySignalCategory`
- optional `earlySignalText`
- `notNow`
- timestamps and deletion marker

Free text is optional and SHALL remain inside the private Programme aggregate. It SHALL NOT be copied to analytics, rewards, logs, errors, commercial profiles, recommendation logic, advertising targeting or affiliate events.

## Help and safety

Protected Help remains available from every mission screen without casino, bonus, offer or affiliate calls to action. Urgent-risk and specialist-support copy SHALL use the existing reviewed Help content rather than being improvised inside the mission.

Mission 03 SHALL allow exit, resume, edit and deletion without loss framing. `Not now` completes the personal-disclosure branch but does not bypass the evidence and understanding checks.

## Acceptance gates

Approval and implementation require:

- founder/product approval of the mission and `+90 XP` schedule;
- clinical-content review of every educational claim and example;
- compliance review of product classification and Help-route placement;
- desktop and mobile Figma approval including answer, feedback, resume, `not now`, Help and completion states;
- accessible keyboard order, visible focus, reduced-motion alternative and non-colour-only feedback;
- server-authoritative, idempotent completion and reward tests;
- proof that Programme content does not enter commercial analytics or targeting.

## Consequences

Mission 03 becomes the first `Check`-style mission in the ten-step path and establishes the reusable product grammar for evidence-led learning missions. The approved implementation target is Mission 03 → `+90 XP` → Dashboard `3 of 10` → Mission 04 current.

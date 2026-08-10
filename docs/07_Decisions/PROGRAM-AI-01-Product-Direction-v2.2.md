---
Title: PROGRAM-AI-01 Product Direction v2.2
Status: FOUNDER-APPROVED PRODUCT DIRECTION — IMPLEMENTATION NOT AUTHORISED
Classification: Internal
Owner: Founder Office
Date: 2026-08-10
Document Type: Product direction record; not an implementation RFC
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../06_RFC/RFC-002-Active-Control-Program-and-Dashboard.md
  - ../06_RFC/RFC-017-GB-Legal-Privacy-and-Launch-Remediation.md
  - ../06_RFC/RFC-021-Programme-Access-Continuation-and-Authenticated-Home.md
---

# PROGRAM-AI-01 Product Direction v2.2

## 1. Authority and boundary

Founder Office approves the product direction in this record for further Product, Legal/Compliance, Design and Architecture work.

**IMPLEMENTATION IS NOT AUTHORISED.** This record is not an implementation RFC and does not approve runtime AI, a provider, data persistence, schema work, design production or Programme code changes.

The deployed/current implementation remains in place:

- Missions 01–04 remain the current code and runtime;
- current authentication and anonymous-to-authenticated subject transition remain;
- local-first narrative controls remain;
- deterministic server-owned progression and exactly-once reward infrastructure remain; and
- RFC-021 remains authority for the merged current access, authentication-continuation and authenticated-home runtime.

The current hard-coded Programme is frozen for further product/content expansion under its previous static model. Do not invest further in polishing its old Mission content, XP copy, Dashboard gamification or Missions 05–10 under that model. Reusable infrastructure may survive into PROGRAM-AI-01. This record does not delete or disable the current implementation.

PROGRAM-AI-01 is the active next Programme product workstream. No runtime AI is authorised yet.

## 2. Overall Programme model

B4GAMBLE will evolve the 10-Step Programme toward:

```text
deterministic Programme structure and outcomes
+ bounded AI-guided personalised interaction
+ server-owned progression and rewards
+ regulated safety and compliance boundaries
```

The product rejects:

- a generic chatbot added to the current lessons;
- an autonomous AI Programme agent; and
- AI-controlled safety, compliance or progression decisions.

The public 10-Step concept remains unless a later approved Product decision changes it. Existing public Steps are not renamed by this record.

## 3. Mission 01 — activation and registration direction

Mission 01 becomes a very short AI Situation Intake.

Target journey:

```text
Access Gate
→ voice-first or typed situation description
→ 0–2 AI clarification questions, only when useful
→ concise personalised understanding
→ initial XP already earned
→ registration CTA
→ Continue with Google or email
→ authenticated Programme continuation
```

Product targets:

- time to first personalised value: less than 90 seconds;
- time to registration CTA: less than two minutes.

Mission 01 must not become:

- a long questionnaire;
- a diagnostic assessment;
- therapy;
- clinical intake; or
- another static educational lesson.

These targets supersede the old Mission 01 duration only as future product direction. They do not rewrite RFC-021's historical/current implementation context or change the deployed Mission 01 in this documentation package.

## 4. Voice-first input and retention

The primary input direction is **voice**. **Type instead** is the secondary path.

Preferred processing direction:

```text
voice → transcription → Programme processing
```

Audio must not be durably retained by default. Durable audio storage requires separate justification and approval.

Durable raw transcript or narrative retention is not authorised by this record. It remains subject to Legal/DPIA, provider and data-architecture review.

## 5. First value before registration

Google registration must not be required before the first AI interaction. The user should first experience credible personalisation through a concise “Here is what I understood” moment.

The personalised summary may reflect:

- situation or context;
- a pattern stated by the user;
- what appears to trigger continuation; and
- what the user explicitly wants to change.

It must not invent:

- a diagnosis;
- an addiction label;
- a clinical risk score; or
- a treatment recommendation.

Registration follows this first-value moment.

## 6. Registration as value continuation

Registration is a value-continuation step, not merely an account wall. The approved concept is to save progress, save the starting point and continue the personalised Programme. Exact UX copy is not approved by this record.

Google remains identity-only. It does not perform age verification or KYC.

The anonymous-to-authenticated Programme transition must preserve:

- subject isolation;
- exactly-once state migration; and
- exactly-once rewards.

## 7. XP product direction

### 7.1 User-visible purpose

Founder Office rejects replacing XP with simple Programme completion percentages. XP remains a user-visible retention currency intended to:

- reinforce meaningful actions;
- create near-term completion pull;
- increase Mission completion;
- increase return and resume rate; and
- build anticipation toward meaningful Programme unlocks.

XP must never represent:

- a risk score;
- clinical improvement;
- responsible-gambling mastery;
- a percentage “more in control”;
- a psychological-health score; or
- gambling eligibility.

### 7.2 Earning and integrity

The target pattern is:

```text
meaningful completed Mission action → deterministic XP
Mission completion → larger deterministic completion bonus
```

Exact XP values are not approved. Example values or thresholds such as 120, 300 or 600 must not be presented as final.

Reward events remain deterministic, server-authoritative and exactly-once. AI does not decide XP amounts.

XP farming through refresh, editing, duplicate submission, back/forward navigation or repeated API calls is prohibited.

### 7.3 Anonymous XP before signup

Mission 01 may award XP before registration so that the registration moment reflects already invested progress and a personalised starting point ready to save or continue through Google or email.

Anonymous XP must transition to the authenticated user exactly once. This direction is not implemented or authorised for implementation by this record.

### 7.4 Incomplete Mission and resume contract

If a user exits a Mission before completion:

- XP from already completed meaningful actions remains earned;
- incomplete actions award nothing;
- the Mission remains `IN PROGRESS`;
- the completion bonus remains locked;
- draft and progress resume from the correct point; and
- earned XP is not removed.

Return UX should expose a near-term completion pull: Mission in progress, XP already earned, actions remaining, completion bonus available and distance to the next meaningful unlock. Exact copy and values remain Design/Product work. There is no punitive XP loss.

### 7.5 Meaningful unlocks

XP must not be only a meaningless accumulating number. Founder-approved direction is for XP thresholds to unlock meaningful Programme value, with **Personal AI Reviews** as the preferred concept.

Potential categories are:

- first Personal Review;
- mid-Programme Personal Review; and
- final or full Programme Review.

These reviews may synthesise work already completed and help frame patterns or the next Programme focus. They are not diagnosis, clinical assessment, treatment assessment, gambling recommendation or casino recommendation.

The number, thresholds, placement and contents of reviews remain open PROGRAM-AI-01 Product decisions.

### 7.6 Retention boundaries

The XP system should improve Mission completion, next-Mission start, return after interruption, Programme completion and registration after the Mission 01 first-value moment.

Allowed direction includes:

- visible XP;
- deterministic action rewards;
- deterministic completion bonuses;
- distance to the next unlock;
- unfinished-Mission resume;
- progress preservation; and
- useful content or AI-review unlocks.

Separate approval is required before introducing:

- XP expiry;
- loss of earned XP;
- random rewards;
- loot or mystery rewards;
- chance-based mechanics; or
- punitive streak loss.

### 7.7 Existing streak and achievements

Existing streak and achievement functionality is not removed by this documentation package. Its future user-facing role remains open. PROGRAM-AI-01 must later decide whether it materially improves retention or creates unnecessary complexity. Do not expand the old gamification system now.

## 8. Minimum commercial data boundary

Founder Office does not approve heavyweight standalone firewall infrastructure at this stage. Minimum technical separation is nevertheless required as product direction:

- raw Programme narrative;
- AI-generated Programme summaries; and
- vulnerability-derived Programme information

must not be directly exposed as commercial recommendation inputs.

This record does not authorise a new firewall service. Ordinary non-sensitive account/product analytics may remain available subject to existing privacy and compliance authority.

Nothing in this record authorises:

- vulnerability-based casino ranking;
- vulnerability-based bonus ranking;
- affiliate destination selection from Programme narrative; or
- commercial AI targeting from sensitive Programme content.

## 9. AI and safety authority boundary

AI may eventually assist with:

- conversation;
- clarification;
- personalisation;
- explanation;
- bounded reflection; and
- approved Programme synthesis.

AI must not independently control:

- age or eligibility;
- legal gates;
- safety policy;
- commercial routing;
- casino or bonus recommendation based on vulnerability;
- deterministic progression; or
- XP and reward integrity.

## 10. Explicit non-authorisations

This decision does not authorise:

- an AI SDK or provider integration;
- runtime LLM calls;
- a speech-provider integration;
- schema changes or migrations;
- durable raw narrative storage;
- durable voice storage;
- retrieval-augmented generation;
- AI memory;
- Production AI;
- new Figma work; or
- new Programme implementation.

## 11. Active workstream and governance gates

Current governance state:

- **PROGRAM-AI-01 Product Direction v2.2:** FOUNDER APPROVED;
- **detailed Product/Compliance handoff:** IN PROGRESS in workstream 40 and not represented as an approved main-branch deliverable.

Expected sequence after the Product handoff:

1. Workstream 45 — Legal & Compliance reviews AI, voice, privacy, data, DPIA, provider and safety boundaries.
2. Founder Office reviews the Legal envelope.
3. Only after that review, workstream 20 — Product Design and workstream 30 — Backend/CMS may proceed in parallel on bounded design and technical architecture.
4. Founder Office reconciles those handoffs and issues a new bounded implementation authority/RFC before implementation.

This record is not that implementation RFC.

## 12. Open decisions

The following remain open and must not be inferred as approved:

- AI, speech and transcription providers;
- raw transcript and narrative retention;
- exact XP values;
- Personal AI Review thresholds, number, placement and content;
- final Mission interaction and resume UX;
- the future user-facing role of streaks and achievements;
- detailed safety escalation and provider controls;
- data architecture, DPIA and retention controls; and
- any production rollout plan.

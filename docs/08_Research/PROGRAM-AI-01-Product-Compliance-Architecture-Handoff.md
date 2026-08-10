# PROGRAM-AI-01 — PRODUCT DIRECTION v2.2 HANDOFF

**Scope:** Product / Compliance specification only
**Code:** NO
**PR:** NO
**Figma:** NO
**Schema:** NO
**AI provider selection:** NO
**Founder Office main authority:** `324a5b51e2e37f456c2386413a6d6c4831607914`
**Compliance research checked:** 10 August 2026

## EXECUTIVE PRODUCT DECISION

**Recommendation: MODIFY — APPROVE DIRECTION, WITH BOUNDED CHANGES BEFORE IMPLEMENTATION.**

The central direction is approved:

**fast personalisation → earned value → registration → continuation → deterministic XP → useful AI Reviews.**

The changes I recommend are material:

1. **No XP for AI clarification questions.** Otherwise AI indirectly controls reward opportunity and B4GAMBLE incentivises users to reveal more private information.
2. **No XP for registration.** Registration preserves value; it should not itself be a rewarded behavioural action.
3. **Personal Reviews should be anchored to Mission completion, not arbitrary XP thresholds.** XP can display distance to the unlock, but the milestone must represent actual Programme work.
4. **Three AI Reviews are optimal: after Missions 3, 6 and 10.** More creates cost and repetition; fewer weakens the retention utility of XP.
5. **Existing streak mechanics should be de-emphasised, not expanded.**
6. **Voice means voice input, not necessarily an AI voice companion.** Spoken AI output is unnecessary v1 complexity.
7. **Raw voice, transcript and vulnerability-derived data remain outside growth/commercial targeting.**
8. A crisis/support-first path is an explicit exception to the registration and engagement optimisation funnel.

The current implementation already separates local/private M1–M4 wording from bounded server-side progress/XP/achievement state, and current commercial logic is not supposed to consume Programme reflection data. v2.2 should extend this model rather than introduce heavyweight infrastructure.

---

# 1. FINAL MISSION 01 FUNNEL

Mission 01 becomes:

**Access → Describe → Understand → Earn → Save → Continue**

Recommended funnel:

**A. Existing consolidated access gate**

* 18+ confirmation;
* Terms agreement + Privacy acknowledgement;
* no marketing consent;
* do not repeat this at Google registration during the same valid journey.

Current Founder Office authority already defines this consolidated access approach and requires Programme state to remain subject-scoped.

**B. One primary prompt**

> Tell me what's been happening

Primary action: **voice**.
Secondary action: **type instead**.

No cards asking five questions.
No sliders.
No pseudo-clinical assessment.

**C. User submits situation**

Immediately award the first deterministic reward:

**+20 XP — Starting situation submitted**

This reward is for completing a meaningful Programme action, not for the content or severity of what the user disclosed.

**D. 0–2 clarifications, only if required**

Most users should receive **zero**.

**E. Personalised Starting Point**

AI returns a compact, grounded understanding.

**F. Mission 01 completion**

When the required summary contract has been successfully produced:

**+20 XP — Starting Point completed**

Recommended anonymous M1 total:

**40 XP**

**G. Registration continuation**

User now sees:

* Starting Point ready;
* 40 XP earned;
* value of saving continuity;
* Google as primary authentication route;
* email as secondary route.

**Registration itself awards 0 XP.**

**H. Successful subject transition**

Anonymous state → authenticated state → Programme home/current state → Mission 02.

Mission 01 is therefore not a registration wall. It is a **value-before-registration funnel**.

---

# 2. VOICE-FIRST INTERACTION

Recommended v1 contract:

* explicit tap to begin recording;
* microphone never starts automatically;
* `Type instead` always visible;
* suggested spoken answer approximately **20–60 seconds**;
* hard product ceiling approximately **90 seconds**, rather than encouraging long monologues;
* clear stop control;
* transcript can be corrected before submission without resetting progress;
* microphone denial/failure immediately falls back to text;
* no forced re-recording for minor transcription errors.

Preferred lifecycle:

**voice → transcription → Programme processing → audio deletion**

Audio should not become a user voice archive.

For v1, explicitly reject:

* speaker identification;
* voiceprints;
* emotion detection from vocal characteristics;
* inferred stress/addiction classification from acoustics;
* long-term raw audio retention;
* automatic playback archive.

An ordinary recording is personal information, but does **not automatically become special-category biometric data** merely because it contains a voice; that stronger classification arises when technical processing is used for unique identification.

**Do not build spoken AI responses into v1.** The commercial/product upside is weak relative to latency, accessibility, privacy and operational complexity. Voice-first input provides the main friction reduction.

---

# 3. CLARIFICATION STRATEGY

Default:

**0 questions.**

One clarification is justified only when the AI cannot reliably produce the core Starting Point from the submitted narrative.

Two questions is an absolute normal-flow maximum.

Valid clarification reasons:

* the user's desired change is genuinely unclear;
* the narrative lacks enough context to distinguish what typically starts/continues the pattern;
* a contradiction prevents a truthful summary.

Invalid reasons:

* collecting more data because it might be useful later;
* building a richer behavioural profile;
* curiosity;
* risk scoring;
* gathering operator/casino preferences;
* financial qualification;
* diagnosis;
* asking clinical screening questions.

Questions must be **narrow and contextual**, not assessment-like.

If uncertainty remains after two questions:

**do not ask more.**

Produce a smaller summary and explicitly omit what is not supported.

### Important XP decision

**Clarification answers award 0 XP.**

Reason:

If clarifications give XP, users who need more questions can earn more than users whose situations were understood immediately. Worse, the AI indirectly determines reward availability.

That is bad product logic and unnecessary privacy pressure.

---

# 4. PERSONALISED-SUMMARY CONTRACT

Mission 01 output should be short enough to understand in approximately **10–20 seconds**.

Recommended structure:

### HERE'S WHAT I UNDERSTOOD

Maximum 3–4 grounded points:

1. **Context** — when/where gambling commonly happens, if stated.
2. **Continuation cue** — what tends to make the user continue, if supported.
3. **Pattern** — one neutral behavioural pattern clearly supported by the user's own description.
4. **Desired change** — what the user explicitly wants to do differently.

Then a continuation proposition equivalent in meaning to:

**Your Programme can use this as its starting point.**

### AI may

* paraphrase;
* compress;
* connect directly stated facts;
* use tentative language;
* identify a non-clinical behavioural pattern;
* acknowledge uncertainty.

### AI may not invent

* addiction status;
* disorder;
* diagnosis;
* clinical risk;
* severity score;
* treatment recommendation;
* gambling eligibility;
* a "safe" amount to gamble;
* a claim that the user is now safer/more responsible/more in control.

If an element is unsupported:

**omit it.**

Do not fill all four bullets merely to make the UI symmetrical.

Provide a low-friction **correct/edit** route. Editing must never re-award XP.

Intentional inference of health status or health risk can itself constitute special-category data under ICO guidance, regardless of confidence in the inference.

---

# 5. GOOGLE REGISTRATION MOMENT

Registration appears **only after**:

* substantive situation submitted;
* personalisation delivered;
* user has seen the Starting Point;
* XP has already been earned.

Recommended information hierarchy:

**Starting Point ready**
**40 XP earned**
continuation benefit
**Google CTA**
email alternative

Not:

**Create an account to see your result.**

The result has already been delivered.

Do not repeat:

* 18+ attestation;
* Terms;
* Privacy acknowledgement;

where current valid access authority already exists.

The current Founder Office UX contract explicitly separates consolidated Programme access from later authentication and requires protected Programme content not to flow into Google OAuth.

### Registration is not a reward event

Do **not** award:

`+20 XP for signing up`

That would transform XP from Programme progress into conversion currency.

The value proposition should be:

**preserve what you already earned and continue what you already started.**

---

# 6. ANONYMOUS XP → AUTHENTICATED XP TRANSITION

Product invariants:

### Before authentication

One anonymous Programme subject owns:

* meaningful completed actions;
* XP earned;
* M1 state;
* claimable progression.

### On successful authentication

Exactly one transition occurs:

**anonymous subject → authenticated user**

Transferred:

* eligible action completion;
* earned XP;
* Mission state;
* authorised non-sensitive continuity information.

Not sent through Google:

* narrative;
* transcript;
* audio;
* vulnerability data;
* private reflection;
* Programme-derived commercial preferences.

### Existing-account login case

If the Google identity resolves to an existing B4GAMBLE account:

* duplicate reward identities must collapse;
* completed actions already present must not award again;
* existing higher progression must not be destructively overwritten;
* anonymous work that is genuinely new can be attached once.

### Authentication failure/cancellation

The anonymous user must not lose:

* earned XP;
* completed action;
* current allowed progression.

Retrying Google cannot generate new XP.

Current project authority already uses subject-isolated anonymous/authenticated Programme scopes rather than browser-global user authority.

---

# 7. XP EARNING MODEL

## Mission 01

Recommended:

| Action                                             |        XP |
| -------------------------------------------------- | --------: |
| First valid situation submission                   |       +20 |
| Clarification                                      |         0 |
| Personalised Starting Point successfully completed |       +20 |
| Registration                                       |         0 |
| **M1 total**                                       | **40 XP** |

This produces the requested pre-registration value:

**40 XP earned before account creation.**

## Missions 02–10

Use only **2–4 rewardable actions per Mission**.

Recommended default classes:

* meaningful short action: **+10 XP**;
* substantive reflection/exercise/action: **+15–20 XP**;
* Mission completion: fixed completion bonus described below.

Do not award XP for:

* opening Mission;
* scrolling;
* page views;
* expanding a card;
* clicking Next;
* returning to the dashboard;
* editing an answer;
* replaying content;
* signing in;
* receiving an AI message.

AI may determine **content**, but it never determines XP amount.

All reward values exist before execution as deterministic Product rules.

---

# 8. INCOMPLETE-MISSION / RESUME MODEL

Every Mission has three user states:

**NOT STARTED → IN PROGRESS → COMPLETE**

On exit:

### Preserve

* completed meaningful actions;
* XP already earned;
* current Mission;
* next incomplete action;
* eligible non-sensitive progress state.

### Do not award

* unfinished action XP;
* Mission completion bonus.

### On return

Show immediately:

**Mission 04 · In progress**
**35 XP earned**
**2 actions left**
**Finish Mission → +25 XP**

Then next milestone information.

Never say:

* "Don't lose your XP";
* "Your progress expires tonight";
* "Your streak is at risk";

unless literally necessary for a technical/legal retention rule—and even then it should not be used as behavioural pressure.

Private narrative resume remains constrained by the Legal retention architecture. Current B4GAMBLE work already distinguishes local/private narrative from durable progress/XP continuity.

---

# 9. COMPLETION BONUS MODEL

A completion bonus is useful because it creates a visible near-term finish line.

Recommendation:

**Mission 01:** +20 XP completion portion, producing 40 XP total.

**Missions 02–10:** default **+25 XP completion bonus**.

Product constraint:

The completion bonus should generally remain around **20–35% of the total XP available in a Mission**.

If an existing Mission's action structure makes +25 badly disproportionate, adjust during Mission-content mapping rather than inventing dynamic rewards.

Completion bonus is awarded only after deterministic Mission completion criteria are satisfied.

AI cannot decide:

> "This answer was especially insightful, award 35 XP."

That is rejected.

---

# 10. ANTI-FARMING / EXACTLY-ONCE PRINCIPLES

Every rewardable logical action has one reward identity.

The same user + same Mission + same meaningful action:

**can produce XP once.**

No additional reward from:

* refresh;
* browser back/forward;
* duplicate request;
* resubmit;
* edit;
* delete-and-retype;
* OAuth retry;
* AI retry;
* duplicate callback;
* multiple tabs;
* repeated Mission completion request.

Mission completion bonus has its own exactly-once identity.

### Content updates

A later copy/content revision does not automatically make an old action rewardable again.

### AI boundary

AI can return:

* summary;
* personalisation;
* approved content selection.

AI does not return:

* XP amount;
* reward eligibility;
* Mission completion;
* milestone entitlement.

Those remain deterministic Programme authority.

---

# 11. XP MILESTONE / UNLOCK MODEL

Do **not** create standalone arbitrary thresholds such as:

120 / 300 / 600 XP

and then design the Programme around them.

Reverse the logic:

**Programme work determines the milestone → deterministic XP map determines the displayed threshold.**

Recommended v1 milestone architecture:

### Starting Point

Mission 01

Not an additional Review. The M1 personalised summary already fulfils this role.

### First Personal Review

Unlocked after **Mission 03**

### Mid-Programme Personal Review

Unlocked after **Mission 06**

### Full Programme Personal Review

Unlocked after **Mission 10**

This means the integer XP threshold is derived from the final approved core-action XP budget through M3/M6/M10.

So the UX may truthfully say:

**20 XP to your First Personal Review**

but XP alone cannot be farmed to bypass the required Programme work.

### Why M3 / M6 / M10

M2 is too early: M1 has already just produced an AI synthesis.

After M3 there is enough new work for the first review to feel materially different.

After M6 the user has completed five of the nine continuation Missions, making it a meaningful midpoint.

After M10 a complete Programme synthesis is justified.

**Three Reviews is the recommended maximum for v1.**

Adding Reviews after every Mission adds AI cost and makes the "reward" routine instead of valuable.

---

# 12. RECOMMENDED MILESTONE REWARDS

The main reward is **useful personalised information**, not another currency.

## First Personal Review — after M3

Purpose:

* reflect back what has emerged since the Starting Point;
* connect the user's goal with early patterns;
* identify the next Programme focus.

Reward:

**the Review itself.**

If it includes one meaningful user action such as selecting the most useful next focus, that action may earn **+10 XP once**.

Opening the Review earns nothing.

## Mid-Programme Review — after M6

Purpose:

* compare starting assumptions with completed work;
* surface what appears consistent or changed;
* make Missions 7–10 feel purposeful rather than simply remaining lessons.

Again:

No diagnosis.
No risk grade.
No "you have improved 43%."

## Full Programme Review — after M10

Purpose:

* synthesise completed Programme work;
* show patterns and decisions the user has recorded;
* summarise personal rules/focus areas;
* identify useful next actions outside the Programme where appropriate.

It is a **Programme synthesis**, not an assessment outcome.

### What not to build now

No additional:

* coins;
* levels;
* loot;
* XP shop;
* cosmetic inventory;
* redeemable rewards;
* paid unlocks;
* "legendary" achievements.

They add operational and design complexity without strengthening B4GAMBLE's core value.

---

# 13. RETENTION LOOP

Recommended loop:

**Meaningful action → visible XP → Mission finish line → completion bonus → useful milestone distance → next Mission**

For interruption:

**Saved progress → exact resume point → remaining actions → locked completion bonus → next useful review**

For Mission completion:

**Completed → XP confirmed → next unlock distance → Start next Mission**

For milestone:

**Review unlocked → synthesis → next focus → next Mission**

The retention engine should therefore be based on:

1. unfinished useful work;
2. preserved progress;
3. visible near-term completion;
4. anticipation of a useful Review.

Not on punishment.

### Optional reminders later

If notifications/email reminders are introduced:

* user-controlled;
* easy to stop;
* no XP-loss language;
* no gambling-trigger targeting;
* no "we know you usually gamble tonight, complete your Programme first";
* marketing consent remains separate.

Do not make outbound retention messaging part of PROGRAM-AI-01 v1 unless evidence shows on-product retention is insufficient.

---

# 14. PROHIBITED DARK-PATTERN MECHANICS

Reject for GB v1:

* XP expiry;
* XP reduction;
* streak punishment;
* streak repair purchases;
* random XP;
* variable reward schedules;
* loot/mystery rewards;
* spin/wheel mechanics;
* near-miss visuals;
* reward multipliers;
* surprise jackpots;
* countdown pressure;
* fake scarcity;
* repeated interruption prompts;
* signup required to reveal a result already generated;
* implying account creation is needed to avoid losing already-earned XP where that is not true;
* opt-out-by-default marketing;
* casino offers unlocked by Programme progression;
* affiliate rewards tied to XP;
* using vulnerability information to time engagement/commercial prompts.

This is especially important because gambling marketing must be socially responsible and protect vulnerable persons, and CAP explicitly applies gambling advertising rules to affiliate marketers acting for operators.

---

# 15. EXISTING STREAK / ACHIEVEMENT MECHANICS

## Streak

**KEEP INFRASTRUCTURE, DE-EMPHASISE PRODUCT ROLE.**

Do not expand streak into a primary retention system.

Recommended treatment:

* no XP multiplier;
* no milestone dependency;
* no unlock dependency;
* no punitive zero-reset messaging;
* no "save your streak";
* no loss aversion;
* no daily-login reward.

If retaining the visible concept, frame it closer to:

**active days / continuity**

rather than a high-pressure streak mechanic.

If current streak implementation requires significant redesign to achieve that, leave the underlying state untouched and simply make it secondary for v1.

## Achievements

Keep only deterministic achievements representing **substantive Programme milestones**.

Examples:

* Starting Point complete;
* First Personal Review reached;
* Mid-Programme Review reached;
* Programme complete.

Do not create dozens of micro-badges.

Achievements should not become a second progression economy competing with XP.

**Product priority order:**

XP → Mission completion → Personal Reviews.

Streaks and badges are secondary.

---

# 16. MISSIONS 02–10 IMPLICATIONS

No wholesale renaming.

No second Programme architecture.

No AI chat bolted onto every existing screen.

Current implementation evidence identifies:

* **Mission 02:** goal wording;
* **Mission 03:** urge/signal wording;
* **Mission 04:** boundary wording.

Private wording is currently treated local-first, while progress/XP/achievement continuity is separated.

That creates a useful continuation:

### M1

Understand starting situation.

### M2

Use the user's stated desired change to contextualise the existing goal work.

### M3

Use the M1 continuation pattern as context for existing urge/signal work.

### M4

Use prior goal/pattern work to make existing boundary work more personally relevant.

The AI can:

* select relevant approved examples;
* order approved sub-content where Product permits;
* preface a Mission using existing bounded context;
* synthesise completed work.

The AI cannot:

* change Mission completion rules;
* create new clinical tasks;
* skip mandatory protection content;
* decide XP;
* redefine the purpose of a Mission;
* insert casino/bonus recommendations.

For **Missions 05–10**, I am deliberately not inventing names or new intents: available project evidence does not establish them strongly enough, and previous work explicitly treated M5–M10 as not implemented within that workstream. Their approved names/intents should be preserved when PROGRAM-AI-01 is mapped to the definitive Programme authority.

---

# 17. ANALYTICS FUNNEL

Minimum product funnel:

**Programme opened**
→ access gate completed
→ voice/type started
→ situation submitted
→ clarification asked, if any
→ AI response delivered
→ personalised summary viewed
→ XP earned
→ registration CTA shown
→ Google clicked
→ registration completed
→ Mission 02 started

Programme retention instrumentation:

→ Mission started
→ meaningful action completed
→ Mission interrupted
→ Mission resumed
→ Mission completed
→ completion XP awarded
→ Review unlocked
→ Review opened
→ Review meaningful action completed
→ next Mission started
→ Programme completed

### Analytics data prohibition

Growth/product analytics must not receive:

* audio;
* transcript;
* raw narrative;
* summary text;
* urge text;
* medical/diagnostic language;
* vulnerability category;
* casino recommendation derived from Programme;
* private boundaries.

Permitted analytics should be bounded metadata such as:

* event type;
* Mission number;
* input mode;
* timestamps/latency;
* clarification count;
* completion state;
* deterministic XP event;
* technical error category.

Even pseudonymous Programme analytics remain personal data where they can relate back to a person; minimise and retain them only for justified purposes. ICO requires personal data to be limited to what is necessary and not held longer than required.

---

# 18. TARGET KPIs

These are **internal launch hypotheses**, not industry benchmarks. Recalibrate after real cohort data.

| KPI                                                 |                    Initial target |
| --------------------------------------------------- | --------------------------------: |
| Time to first personalised value                    |                  **P75 < 90 sec** |
| Time to registration CTA                            |                 **P75 < 120 sec** |
| P90 time to personalised value                      |                     **< 120 sec** |
| Input started → situation submitted                 |                         **≥ 80%** |
| Valid submission → AI response delivered            |       **≥ 97%** technical success |
| Sessions requiring any clarification                |                         **≤ 35%** |
| Sessions requiring 2 clarifications                 |                         **≤ 10%** |
| Personalised summary → registration completed       |     **≥ 35% target; 45% stretch** |
| Google click → successful registration              |                         **≥ 75%** |
| Registration → Mission 02 start                     |                         **≥ 65%** |
| Started Mission → Mission completed                 |                         **≥ 65%** |
| Mid-Mission abandonment                             |                         **≤ 25%** |
| Interrupted Mission → resume within 7 days          |                         **≥ 35%** |
| Mission complete → next Mission start within 7 days |                         **≥ 60%** |
| First Review reach, after M3                        | **≥ 45% of registered M1 cohort** |
| Review unlocked → Review used                       |                         **≥ 70%** |
| Mid Review reach, after M6                          |                         **≥ 25%** |
| Full 10-Mission Programme completion                |          **≥ 20% initial target** |

### Do not optimise the wrong metric

`voice usage %` should be measured, not forced.

A user choosing text is **not** a failed activation.

Similarly, XP earned is not itself success.

Primary outcomes remain:

**personalised value → registration → Mission completion → next Mission → return → Programme completion.**

### Safety exclusions

Sessions entering an explicit crisis/support-first branch should be excluded from registration-conversion optimisation.

Conversion must not override safety behavior.

---

# 19. COMPLIANCE RISKS INTRODUCED BY VOICE + AI + RETENTION

## A. Raw narrative may contain special-category information

Users may voluntarily disclose:

* addiction;
* mental-health information;
* treatment;
* other health-related information.

AI may also create special-category data if B4GAMBLE intentionally infers health status or health risk. Article 9 then requires an appropriate condition in addition to an Article 6 basis.

**Product response:** do not require diagnostic information and do not intentionally create health/risk profiles for normal personalisation.

---

## B. Voice adds another personal-data layer

Audio is personal information even when short-lived.

Short-lived processing is still processing; deletion immediately after use reduces exposure but does not make data-protection obligations disappear.

**Product response:**

* explicit microphone action;
* transcription purpose only;
* no voice recognition/identity;
* no acoustic vulnerability inference;
* no durable audio by default.

---

## C. Raw audio/transcript retention

Permanent storage adds little Mission 01 product value and materially increases breach, access, deletion and operational burden.

ICO's storage-limitation principle requires retention to be justified by the processing purpose.

**Decision:** audio ephemeral by default; raw narrative remains subject to the Legal gate rather than being automatically cloud-saved.

---

## D. AI DPIA

PROGRAM-AI-01 combines:

* novel AI processing;
* highly personal narrative;
* potential special-category data;
* profiling/personalisation;
* potentially vulnerable users.

ICO identifies innovative technology, highly personal/sensitive data and vulnerable individuals among high-risk indicators and requires a DPIA where processing is likely to result in high risk.

**Decision: AI DPIA remains a pre-implementation/production gate.**

This handoff is not the DPIA.

---

## E. Profiling

Mission/content personalisation likely constitutes profiling in the broad data-protection sense.

The current intended use does **not** decide whether the user may gamble, whether they receive a financial service, or another equivalent legal/significant entitlement.

Do not extend it into:

* gambling eligibility;
* operator suitability;
* casino recommendation;
* bonus eligibility;
* commercial risk scoring.

ICO's automated-decision guidance is currently being updated following UK data-law changes, so the final implementation review must use the then-current guidance.

---

## F. Commercial contamination

Programme narrative, AI summary and vulnerability-derived information must remain unavailable as direct inputs to:

* operator ranking;
* bonus selection;
* affiliate targeting;
* commercial recommendation;
* retargeting;
* paid acquisition audiences.

This does **not** require a new expensive standalone infrastructure platform today.

It does require a firm product/data boundary.

UKGC LCCP 1.1.2 makes licensed operators responsible for contracted third parties and requires contractual compliance/oversight, including affiliate advertising-code breaches.

---

## G. Crisis / extreme-vulnerability input

Normal activation optimisation must have an exception.

If explicit user text indicates immediate severe crisis/self-harm type content:

* interrupt normal persuasive continuation;
* provide bounded support-first guidance;
* do not diagnose;
* do not conduct an extended clinical assessment;
* do not show casino/bonus recommendation;
* do not optimise that screen for signup;
* preserve already-earned XP but suppress celebratory/pressure mechanics.

No punishment for leaving.

Existing B4GAMBLE legal architecture already requires crisis signals not to become commercial data and treats AI Programme implementation as requiring a separate DPIA/legal gate.

---

## H. Gamification / vulnerable consumers

There is no need to pretend that deterministic XP itself is prohibited.

The risk comes from **how it is used**.

CAP requires gambling advertising to be socially responsible and protect vulnerable people, and its gambling provisions also apply to third-party affiliate marketing acting for an advertiser.

Therefore B4GAMBLE should deliberately avoid gambling-like behavioural mechanics inside a Programme addressing gambling behaviour:

* chance;
* loss;
* scarcity;
* near-miss;
* variable reward;
* monetised progression.

---

# 20. GO / MODIFY / STOP RECOMMENDATION

# MODIFY

## GO — PRODUCT DIRECTION

Approve:

* Mission 01 as activation mission;
* <90 sec personalised-value target;
* <2 min registration-CTA target;
* voice-first input;
* text fallback;
* 0–2 clarifications;
* value-before-registration;
* anonymous XP;
* visible XP;
* exactly-once rewards;
* preserved progress;
* completion bonuses;
* milestone Reviews;
* M2–M10 continuation without novelty renaming;
* minimum commercial-data separation.

## MODIFY BEFORE IMPLEMENTATION AUTHORITY

Adopt the following changes as v2.2 Product rules:

1. **M1 = 20 XP submission + 20 XP Starting Point completion.**
2. **Clarifications = 0 XP.**
3. **Registration = 0 XP.**
4. **M2–M10 completion bonus default = +25 XP**, subject to final mission-action budget.
5. **Personal Reviews after M3 / M6 / M10.**
6. Review unlocks are anchored to substantive Mission completion; XP threshold is derived from that work.
7. Voice output/TTS is out of v1 scope.
8. No permanent audio archive.
9. No voice biometrics/emotion analysis.
10. No new XP economy, coins, shops or random rewards.
11. Existing streak is secondary/non-punitive.
12. Achievements are limited to major deterministic Programme milestones.
13. Crisis/support-first sessions override registration optimisation.
14. Programme private/sensitive data does not feed commercial recommendation or targeting.

## STOP — IMPLEMENTATION GATES

PROGRAM-AI-01 implementation must not be represented as launch-ready until the separate Legal/Privacy gates close for:

* AI DPIA;
* final Article 6/Article 9 treatment for actual data flows;
* exact raw narrative / derived-profile retention rules;
* transparency wording;
* crisis handling;
* processor/DPA/subprocessor/transfer/training requirements once provider work begins;
* evidence that voice/audio deletion behavior matches the public claim;
* anonymous → authenticated claim/merge exactly-once contract.

These are bounded gates.

They **do not justify**:

* a new data platform;
* a separate enterprise firewall service;
* a redesign of Missions 02–10;
* new currencies;
* a large achievement system;
* a permanent voice store;
* complex AI agent architecture.

---

# HANDOFF TO FOUNDER OFFICE

**PROGRAM-AI-01 v2.2 product direction:** **APPROVE WITH MODIFICATIONS**

**Strongest product decision:** Mission 01 becomes a sub-two-minute demonstration of personalised value before registration.

**Recommended M1 reward:** **40 XP anonymous before signup.**

**Recommended review architecture:**
**M3 → First Personal Review**
**M6 → Mid-Programme Personal Review**
**M10 → Full Programme Personal Review**

**Rejected:** XP for clarification, XP for signup, arbitrary milestone numbers, punitive streaks, random rewards, excessive achievements, permanent voice archive, voice biometrics, AI-determined XP, vulnerability-driven commercial targeting.

**Primary conversion objective:** personalised summary → registration.

**Primary retention objective:** Mission completion → next Mission → return after interruption.

**Primary long-term Programme objective:** completion driven by useful personalised synthesis, not gambling-style reward mechanics.

**Implementation readiness:** **STOP pending bounded AI Legal/Privacy gates.**

**Product architecture readiness:** **GO after Founder Office accepts the modifications above.**

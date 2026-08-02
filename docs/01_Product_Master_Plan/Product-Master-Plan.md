---
Title: SevenBet Product Master Plan
Version: 1.0
Status: Draft
Classification: Internal
Owner: Founder
Last Updated: 2026-07-28
Governing Document: ../Product-Vision-and-Principles.md
---

# SevenBet Product Master Plan

## Purpose of this document

This document defines the complete product scope of SevenBet: what the product is, how its product modules behave, how user-facing and internal product surfaces fit together, and how the product evolves from MVP.

It is governed by the approved [Product Vision & Principles](../Product-Vision-and-Principles.md). Where this plan and the Product Vision appear to conflict, the Product Vision takes precedence.

This is a product document. It intentionally does not prescribe data models, APIs, application frameworks, infrastructure, implementation sequencing, or engineering tasks.

## Reading order

1. Product Overview
2. Product Principles in Practice
3. Users and their goals
4. Product modules
5. User journeys and navigation
6. Product rules, states, permissions, and boundaries
7. MVP, evolution, risks, and open questions

# 1. Product Overview

## 1.1 Purpose

SevenBet is a decision-support product for adults who are considering participation in regulated gambling.

Its primary job is not to create a gambling intent, maximise a referral, or make a catalogue feel more persuasive. Its job is to improve the quality of a user's decision. A decision may be to play with clear boundaries, delay a decision, choose no available option, or not play.

The product provides a coherent path from uncertainty to informed action:

1. establish the relevant market and safety context;
2. make knowledge and control tools available before promotion;
3. help the user evaluate regulated options when evaluation is appropriate;
4. disclose commercial relationships clearly;
5. preserve the user's ability to stop at every point.

## 1.2 Scope

The initial product focus is casino discovery in regulated markets. The product scope includes:

- the SevenBet 10-Step Control Program for adults aged 18+;
- educational decision support;
- market-aware discovery of eligible licensed operators;
- operator profiles, reviews, comparisons, and bonus explanations;
- responsible gambling information and pathways to external support;
- transparent affiliate referrals to eligible licensed operators;
- registered-user tools that preserve personal boundaries and decision history;
- internal editorial, compliance, commercial, moderation, and reporting surfaces.

SevenBet may later support additional regulated gambling verticals. Such expansion is not implied by the initial scope and must not weaken the current casino-specific standard of evidence, control, or local compliance.

## 1.3 Non-goals

SevenBet is not:

- a gambling operator;
- a place to place bets, deposit money, hold funds, withdraw funds, or manage a gambling account;
- a game, casino lobby, odds product, or wagering interface;
- a promise of profit, winning, recovery of losses, or better gambling outcomes;
- a diagnostic, therapeutic, legal, financial, or clinical service;
- a generic affiliate catalogue optimised primarily for conversion;
- a mechanism for bypassing market restrictions, self-exclusion, limits, or other safeguards;
- a substitute for an operator's own account controls or for professional support.

## 1.4 Product positioning

SevenBet occupies the space before an operator relationship.

It is an independent decision-support layer between gambling marketing and a user's action. It translates fragmented facts - licensing, eligibility, operator practices, offer conditions, withdrawal information, control tools, and local availability - into a comprehensible decision context.

The product must remain useful when no referral is made. A user who leaves better informed, decides to pause, or finds a relevant support pathway is a successful user outcome.

## 1.5 Program-led commercial growth

SevenBet markets the 10-Step Control Program as its differentiated acquisition story while operating casino discovery, reviews, comparisons, bonuses and eligible affiliate referrals as persistent commercial product routes. The approved campaign, navigation, growth-loop and measurement model is defined by [RFC-003 — Program-Led Commercial Growth](../06_RFC/RFC-003-Program-Led-Commercial-Growth.md). Where this commercial model meets a protected Help or market-restricted context, the applicable safety and jurisdiction rules take precedence.

## 1.5 Relationship with Product Vision

The Product Vision is the constitution. This plan operationalises it without altering it.

| Product Vision commitment | Product Master Plan implication |
| --- | --- |
| User welfare over short-term revenue | Revenue is not a ranking criterion or primary success measure. |
| Education before promotion | Learning, conditions, and control are available before affiliate actions. |
| Regulated First | Market eligibility governs discovery, profiles, comparisons, and referrals. |
| The right answer may be “do not play” | Every major journey includes a non-commercial exit or pause. |
| Facts over persuasion | Claims show source, scope, date, limitation, and uncertainty where relevant. |
| No hidden incentives | Sponsored and affiliate relationships are visible and understandable. |
| Control is a product capability | Control Program and responsible gambling paths are primary navigation, not footer-only content. |
| Personalization must protect agency | Personalisation may improve relevance but cannot increase promotional pressure based on vulnerability. |

## 1.6 Product success

The product's North Star remains the one defined in Product Vision: the proportion of users who voluntarily confirm that SevenBet helped them reach a more informed decision that fits their personal boundaries.

The Master Plan does not replace this measure with referral volume, registration rate, first deposit, repeat deposit, gambling frequency, losses, or session length. Those are not product success measures.

Supporting product evidence includes:

- whether users understand why an option is or is not available;
- whether users can identify material terms before following a referral;
- whether users can find control and support routes without friction;
- whether users distinguish editorial assessment from paid placement;
- whether users can return to, revise, or pause their decision;
- whether content, regulatory status, and commercial disclosures remain current.

# 2. Product Principles in Practice

## 2.1 Product behaviour, not slogans

Product principles are acceptance constraints for all surfaces. A module is incomplete if it provides a commercial path but lacks the relevant transparency, control, or market context.

## 2.2 User welfare over short-term revenue

Product behaviour:

- A higher-paying partner does not receive a better editorial score because it pays more.
- A user may see a clearly explained reason that no suitable operator is available.
- The product may suppress commercial promotion when the user's context calls for a pause or support route.
- A commercially valuable feature is not launched when its likely harm or conflict cannot be mitigated.

## 2.3 Education before promotion

Product behaviour:

- Material conditions accompany offers rather than appearing only after a click.
- Decision support is not gated by account creation, newsletter consent, or a referral action.
- Educational pages do not become disguised landing pages for a single operator.
- A bonus is explained as a conditional commercial offer, not as free money or a product recommendation by itself.

## 2.4 Regulated First

Product behaviour:

- Market context is established before operator availability is asserted.
- A profile can exist for research and editorial purposes while its referral action remains unavailable in a market.
- An operator with unclear, expired, or inapplicable licensing is not presented as eligible.
- Product copy avoids implying that a licence in one jurisdiction authorises the operator in another.

## 2.5 Facts over persuasion

Product behaviour:

- Reviews separate verified facts, editorial judgement, user-reported experience, and partner-provided information.
- Unknown information is marked unknown rather than inferred.
- Rankings expose their factors in a human-readable methodology.
- Time-sensitive claims show when they were checked and when they require review.

## 2.6 User agency and control

Product behaviour:

- The Control Program is accessible from key entry points and does not behave as a mandatory funnel.
- A user can decline an offer, stop a comparison, leave a programme, or seek help without losing access to basic information.
- Saving personal boundaries is optional and does not require disclosure beyond what is necessary.
- Notifications are supportive, reversible, and never framed to induce gambling activity.

## 2.7 Commercial integrity

Product behaviour:

- Affiliate links and sponsored placements are labelled before activation.
- Commercial managers cannot silently alter editorial facts, scores, or material caveats.
- A partner's request for removal of material negative information is treated as a governance issue, not routine content editing.
- Referral attribution does not determine what information a user sees first.

## 2.8 Local reality and respectful uncertainty

Product behaviour:

- The product distinguishes supported, restricted, and unknown market contexts.
- Local legal and regulatory information is presented as product context, not personalised legal advice.
- When confidence is insufficient, the product limits recommendation rather than manufacturing certainty.
- Language, currency, payment examples, operator availability, support resources, and control paths are market-aware where information is reliable.

# 3. User Types

## 3.1 User type model

User types describe product relationships, not personal worth or clinical categories. A single person may move between several user states over time. Gambling-risk indicators are product safety contexts, not diagnoses.

## 3.2 External users

### Visitor

A visitor is an unauthenticated adult-facing user exploring SevenBet for the first time or without an active account.

The visitor may arrive through a direct link, search, an educational article, a review, a comparison, or a market-specific discovery page. The product must not assume gambling intent merely because a visitor landed on a commercial page.

### Returning Visitor

A returning visitor has previously used SevenBet without necessarily creating an account.

They may revisit a saved context held locally, repeat a research journey, check updated conditions, or return after a decision to pause. The product should recognise continuity only where the visitor has consented to it or where the information is necessary for the current session.

### Registered User

A registered user has deliberately created an account to retain personal product settings, saved items, control-program progress, boundaries, notifications, or feedback.

Registration must extend agency. It must not be required for reading core information, accessing support resources, or completing basic decision-support steps.

### User in Control Program

A user in the Control Program is engaging with one or more of its decision-support steps. They may be a visitor or registered user.

This is not a conversion status. The user's outcome may be to continue researching, configure a personal boundary, take a break, access help, or leave the product.

### Returning Control Program User

A returning Control Program user resumes, reviews, or changes prior decisions. This state reflects that decisions can change and that the product should support reflection rather than pressure for completion.

### User seeking support or a pause

This user is looking for responsible gambling information, a break, self-exclusion information, external support, or a route away from promotion.

The product should make support paths direct, neutral, private by default, and free from adjacent commercial prompts.

### Unsupported or restricted-market visitor

This visitor is in a market where SevenBet cannot responsibly recommend operators, cannot verify sufficient market information, or does not currently provide a supported experience.

They retain access to relevant non-commercial education where appropriate. They do not receive workarounds or referral alternatives.

## 3.3 Internal users

### Affiliate Manager

The Affiliate Manager manages partner relationships and commercial placement proposals within Product Vision constraints.

They do not own editorial truth, operator suitability, safety policy, or final publication of regulated eligibility.

### Content Editor

The Content Editor creates and maintains educational, review, comparison, guide, and explanatory content.

They are responsible for clarity, source integrity, material caveats, and editorial updates. They cannot publish unverified eligibility claims or conceal a commercial relationship.

### Compliance Manager

The Compliance Manager establishes and reviews market, licensing, disclosure, content, and safety requirements for product use.

They can restrict, suspend, or require review of content, operators, market experiences, referrals, and commercial placements when compliance confidence is insufficient.

### Moderator

The Moderator reviews user-generated submissions, reports, and community-facing content if and when such surfaces exist.

Moderation is not a clinical service. It is responsible for enforcing published participation rules, preventing harmful, deceptive, illegal, or promotional misuse, and escalating safety concerns through established procedures.

### Analyst

The Analyst studies aggregate product behaviour, feedback, decision quality signals, content quality, and integrity indicators.

The Analyst does not use risk or vulnerability signals to improve referral conversion or promotional targeting.

### Administrator

An Administrator manages approved operational content, user support workflows, internal configuration, and role-scoped access.

Administrators act within documented ownership and cannot override non-negotiable principles.

### Super Admin

A Super Admin has limited emergency and governance authority across internal product operations.

This role is tightly controlled. It exists to maintain product continuity and integrity, not to bypass compliance review, editorial evidence, or Product Vision.

# 4. User Goals

## 4.1 Visitor

| Dimension | Description |
| --- | --- |
| Goals | Understand what SevenBet is; learn whether a decision needs more thought; find relevant, lawful information. |
| Needs | Clear market context, plain language, visible disclosure, fast access to control and support. |
| Pain points | Promotional clutter, unclear eligibility, hidden conditions, pressure to register or click. |
| Success criteria | Leaves with clearer next action; can identify the difference between information and promotion; can stop without friction. |

## 4.2 Returning Visitor

| Dimension | Description |
| --- | --- |
| Goals | Continue research, revisit a prior decision, check whether facts changed. |
| Needs | Stable navigation, visible update dates, consistent market context, respectful continuity. |
| Pain points | Repeating basic work, stale content, losing a pause decision to renewed promotion. |
| Success criteria | Can resume safely, see what changed, and retain control over remembered preferences. |

## 4.3 Registered User

| Dimension | Description |
| --- | --- |
| Goals | Save boundaries, research items, comparisons, notifications, and personal decision progress. |
| Needs | Clear privacy choices, useful account value, simple editing and deletion controls. |
| Pain points | Data collection without benefit, inability to change preferences, commercial reminders. |
| Success criteria | Account makes reflection and organisation easier without increasing pressure to gamble. |

## 4.4 User in Control Program

| Dimension | Description |
| --- | --- |
| Goals | Slow down, understand the decision, define boundaries, find a safe next action. |
| Needs | Neutral language, non-linear access, private reflection, support routes, ability to leave. |
| Pain points | Feeling judged, forced completion, quizzes that feel like gates, promotion during reflection. |
| Success criteria | Understands the relevant facts and personal boundaries; can select, defer, or decline an action freely. |

## 4.5 User seeking support or a pause

| Dimension | Description |
| --- | --- |
| Goals | Find immediate, relevant, non-promotional control or support information. |
| Needs | Direct pathways, local context where reliable, dignity, low-friction exit. |
| Pain points | Being redirected to offers, unclear external resources, feeling tracked or categorised. |
| Success criteria | Reaches a relevant control or support resource without encountering unnecessary gambling promotion. |

## 4.6 Unsupported or restricted-market visitor

| Dimension | Description |
| --- | --- |
| Goals | Understand why a product option is unavailable and what safe information remains available. |
| Needs | Honest explanation, non-commercial education, no location-bypass suggestions. |
| Pain points | Dead ends, misleading global claims, being shown irrelevant operators. |
| Success criteria | Understands the limitation and can use non-commercial information without being pushed elsewhere. |

## 4.7 Affiliate Manager

| Dimension | Description |
| --- | --- |
| Goals | Manage sustainable commercial relationships that fit SevenBet's principles. |
| Needs | Clear eligibility, placement, disclosure, and escalation rules. |
| Pain points | Ambiguous ownership, requests that compromise editorial integrity, unclear market status. |
| Success criteria | Commercial activity is traceable, disclosed, and does not alter user-first decisions. |

## 4.8 Content Editor

| Dimension | Description |
| --- | --- |
| Goals | Publish accurate, understandable, useful content and keep it current. |
| Needs | Sources, review workflows, market context, clear taxonomy, and change history. |
| Pain points | Missing evidence, late policy updates, partner influence, unclear review ownership. |
| Success criteria | Content remains factually grounded, clear about uncertainty, and useful without conversion. |

## 4.9 Compliance Manager

| Dimension | Description |
| --- | --- |
| Goals | Prevent unsupported, misleading, non-compliant, or unsafe product behaviour. |
| Needs | Review queues, evidence visibility, restriction controls, auditability, escalation routes. |
| Pain points | Late involvement, commercial urgency, ambiguous ownership, incomplete market data. |
| Success criteria | Risks are detected before exposure; constraints are understood and followed across product surfaces. |

## 4.10 Moderator

| Dimension | Description |
| --- | --- |
| Goals | Maintain a respectful, truthful, safe participation environment. |
| Needs | Clear standards, report context, reversible moderation actions, escalation support. |
| Pain points | Ambiguous reports, hidden commercial influence, unclear response expectations. |
| Success criteria | Harmful or deceptive content is handled consistently and responsibly. |

## 4.11 Analyst

| Dimension | Description |
| --- | --- |
| Goals | Understand whether the product improves informed decisions and maintains integrity. |
| Needs | Aggregated data, defined metrics, disclosure of limitations, feedback access. |
| Pain points | Optimising proxies that reward pressure, missing qualitative evidence, unclear definitions. |
| Success criteria | Findings lead to safer, clearer, more useful product decisions. |

## 4.12 Administrator and Super Admin

| Dimension | Description |
| --- | --- |
| Goals | Sustain reliable, governed product operations. |
| Needs | Role boundaries, audit visibility, approval rules, emergency procedures. |
| Pain points | Over-broad access, undocumented overrides, unclear accountability. |
| Success criteria | Necessary operations occur without bypassing policy, evidence, or separation of duties. |

# 5. Product Modules

## 5.1 Module map

The modules below are product capabilities, not implementation components. They are organised around user value and governance.

| Product layer | Modules |
| --- | --- |
| Trust and safety foundation | Jurisdiction Engine, Responsible Gambling Hub, Compliance, moderation, disclosures |
| Control and decision support | 10-Step Control Program, User Profile, achievements, notifications |
| Knowledge and education | Guides, educational content, Review Engine, content taxonomy |
| Discovery and evaluation | Discovery, Casino Directory, Operator Profile, Comparison Engine, Bonus Engine, Search |
| Commercial enablement | Affiliate, reporting |
| Internal product operations | CMS, Admin Panel, Analytics |

## 5.2 10-Step Control Program

### Purpose

Provide a structured but optional path that helps an adult user pause, understand context, set personal boundaries, evaluate information, and choose a next action without pressure.

### Responsibilities

- Explain the purpose and optional nature of the programme; allow Mission 01 in a private ephemeral session, then require a SevenBet account to save its result and continue the personal, persistent programme while preserving public discovery and Help without registration.
- Support reflection before a commercial decision.
- Present decision-relevant knowledge and control actions.
- Allow a user to complete, skip, revisit, or leave steps.
- Surface a non-commercial pause or support path whenever appropriate.
- Make outcomes useful whether the user plays, delays, or does not play.

### Inputs

- User-selected market or contextual information.
- User-selected goals and boundaries, where provided.
- Relevant educational content and support resources.
- Market-aware control information.

### Outputs

- A clearer decision context.
- Optional saved boundaries or plan.
- Relevant discovery criteria, if the user elects to evaluate operators.
- A pause, support, research, or referral next action.

### Dependencies

- Responsible Gambling Hub.
- Jurisdiction Engine.
- Educational content.
- User Profile for optional persistence.
- Notifications for optional, user-controlled reminders.

### Future expansion

- Jurisdiction-specific programme variations.
- Accessibility and language variants.
- Evidence-informed adaptations after user research.
- Additional regulated verticals only after separate product and compliance approval.

## 5.3 Discovery

### Purpose

Help a user find relevant, eligible, explainable operator options after the product has established enough context for discovery to be responsible.

### Responsibilities

- Present eligible options for a supported market.
- Explain filters, exclusions, ordering, and commercial labels.
- Keep control and education reachable from discovery.
- Avoid presenting a long catalogue as a recommendation by default.

### Inputs

- Market eligibility.
- User-selected preferences and decision criteria.
- Operator status, editorial information, and disclosure status.

### Outputs

- A limited, contextual list of options.
- Reasons an operator appears, does not appear, or cannot be referred to.
- Links to profiles, comparisons, and educational explanations.

### Dependencies

- Jurisdiction Engine.
- Casino Directory.
- Operator Profile.
- Review Engine.
- Affiliate and disclosure data.

### Future expansion

- More nuanced preference-based discovery.
- Additional supported verticals.
- Market-specific discovery modes.

## 5.4 Casino Directory

### Purpose

Provide a structured, browseable inventory of operators that SevenBet can describe within its editorial and regulatory rules.

### Responsibilities

- Organise operators by market-aware availability and editorial status.
- Make difference between directory inclusion and recommendation clear.
- Support filters based on transparent, user-relevant criteria.
- Never convert a directory result into an implied endorsement.

### Inputs

- Operator identity and market status.
- Review and compliance status.
- Content taxonomy.

### Outputs

- Directory listings.
- Filtered discovery entry points.
- Profile links and unavailable-state explanations.

### Dependencies

- Jurisdiction Engine.
- Operator Profile.
- Review Engine.
- Compliance review.

### Future expansion

- Curated collections with documented criteria.
- Market-specific category views.
- Historical availability context where editorially useful.

## 5.5 Operator Profile

### Purpose

Give a user a complete, plain-language view of one operator so they can assess it rather than merely follow a referral.

### Responsibilities

- Present licence and market applicability information with source and review date.
- Present material product facts, conditions, controls, strengths, limitations, and uncertainty.
- Show editorial assessment separately from commercial status.
- Explain referral availability and any restriction.
- Link to relevant control information and comparisons.

### Inputs

- Verified operator facts.
- Market-specific availability.
- Editorial review.
- Affiliate and sponsorship disclosure.
- Bonus and offer information where relevant.

### Outputs

- A complete profile.
- Comparable criteria.
- A clearly labelled referral action when permitted.
- A decision-support alternative when referral is not permitted.

### Dependencies

- Jurisdiction Engine.
- Review Engine.
- Bonus Engine.
- Compliance review.
- Affiliate module.

### Future expansion

- Profile change summaries.
- User-facing explanation of material updates.
- Structured operator quality histories once evidence standards are defined.

## 5.6 Review Engine

### Purpose

Create consistent editorial evaluations that help users understand operator quality and suitability factors without converting subjective judgement into false certainty.

### Responsibilities

- Apply a documented methodology consistently.
- Separate verified facts from editorial assessment.
- Include material disadvantages and limitations.
- Record source confidence, review date, and status.
- Support correction, challenge, and re-review processes.

### Inputs

- Operator information.
- Regulatory evidence.
- Published terms and conditions.
- Editorial research.
- Approved user-reported evidence, if future policy allows.

### Outputs

- Review narrative.
- Transparent assessment criteria.
- Review status and update history.
- Inputs for comparison and discovery.

### Dependencies

- Content and CMS.
- Compliance review.
- Jurisdiction Engine.
- Editorial governance.

### Future expansion

- More market-specific methodologies.
- Independent external review participation.
- Public correction and methodology-change logs.

## 5.7 Comparison Engine

### Purpose

Help users compare a small number of relevant options using consistent, material, understandable criteria.

### Responsibilities

- Compare like with like within a relevant market context.
- Show important differences, not only a winning rank.
- Explain unavailable, unknown, and non-comparable fields.
- Preserve access to control and pause pathways.

### Inputs

- Eligible operator set.
- Verified profile fields.
- Review methodology.
- User-selected comparison criteria.

### Outputs

- A comparison view.
- Plain-language explanation of distinctions.
- Links to detailed evidence and profiles.

### Dependencies

- Operator Profile.
- Review Engine.
- Jurisdiction Engine.
- Discovery.

### Future expansion

- Saved comparisons for registered users.
- Comparison explanations tailored to a user's stated criteria.
- Historical change awareness.

## 5.8 Bonus Engine

### Purpose

Explain bonus and promotional offers as conditional information, not as a primary measure of value or a reason to gamble.

### Responsibilities

- Display material conditions alongside any offer.
- Clarify eligibility, wagering or comparable requirements, expiry, limits, exclusions, and uncertainty where relevant.
- Prevent bonus-first ordering from obscuring suitability and safety information.
- Mark commercial relationships.

### Inputs

- Offer terms.
- Market eligibility.
- Operator status.
- Editorial and compliance review.

### Outputs

- Offer explanation.
- Eligibility and limitation context.
- Links to operator profile and relevant education.

### Dependencies

- Operator Profile.
- Jurisdiction Engine.
- Compliance review.
- Affiliate module.

### Future expansion

- Standardised offer comparison language.
- Change alerts for saved offers where appropriate and user-requested.

## 5.9 Jurisdiction Engine

### Purpose

Provide the product's market-awareness layer so that what users see reflects applicable location, regulatory, availability, age, and disclosure context.

### Responsibilities

- Classify product support by market confidence and policy.
- Govern whether an operator, offer, referral, or claim may be shown.
- Select relevant local information and support routes where available.
- Present uncertainty or limitations when context cannot be established.

### Inputs

- User-declared or otherwise responsibly determined market context.
- Approved jurisdiction rules and evidence.
- Operator market eligibility.
- Product support policy.

### Outputs

- Supported, restricted, unsupported, or unknown product context.
- Market-appropriate discovery availability.
- Contextual disclosures and support information.

### Dependencies

- Compliance operations.
- Operator and offer information.
- Content taxonomy.

### Future expansion

- More granular market scenarios.
- User-controlled market correction.
- Clearer market confidence explanations.

## 5.10 Responsible Gambling Hub

### Purpose

Provide a dedicated, non-commercial home for education, pause, limit, self-exclusion information, and external support pathways.

### Responsibilities

- Make control and support routes easy to find.
- Explain what SevenBet can and cannot help with.
- Keep support information distinct from commercial content.
- Offer market-aware resources where reliable.

### Inputs

- Approved responsible gambling information.
- Jurisdiction context.
- External resource information.

### Outputs

- Educational guides.
- Pause and self-exclusion information.
- Support-resource pathways.
- Links back to the Control Program when desired by the user.

### Dependencies

- Jurisdiction Engine.
- Content and compliance review.
- Control Program.

### Future expansion

- Additional accessibility formats.
- More localised external-resource directories.
- User research-led pathways for different help-seeking contexts.

## 5.11 Search

### Purpose

Help users locate relevant, approved product information without making promotional results appear more authoritative than educational or support content.

### Responsibilities

- Find guides, profiles, comparisons, controls, and support information.
- Apply market restrictions to results.
- Label paid placements and prevent them from displacing safety-critical results.
- Explain when no eligible result is available.

### Inputs

- User query.
- Content index.
- Jurisdiction context.
- Publication and compliance status.

### Outputs

- Ordered, labelled search results.
- Relevant no-result or unsupported-market guidance.

### Dependencies

- All published content modules.
- Jurisdiction Engine.
- CMS and compliance status.

### Future expansion

- Intent-aware educational prompts.
- Synonyms and multilingual discovery.
- Improved support-first handling for high-risk queries subject to policy.

## 5.12 User Profile

### Purpose

Give registered users optional, transparent control over their saved decisions, preferences, boundaries, and communication settings.

### Responsibilities

- Manage account identity and privacy choices.
- Save optional Control Program progress and boundaries.
- Save operators, comparisons, and educational items.
- Manage notification preferences.
- Provide deletion and export pathways according to applicable policy.

### Inputs

- User-provided profile choices.
- Explicitly saved product activity.
- User notification preferences.

### Outputs

- A personal dashboard.
- Saved decision-support material.
- User-controlled reminders and settings.

### Dependencies

- Control Program.
- Notifications.
- Saved discovery and comparison items.
- Privacy and compliance policy.

### Future expansion

- Reflection summaries chosen by the user.
- More granular retention controls.
- Optional private notes only if a clear user benefit and privacy model exist.

## 5.13 Achievements

### Purpose

Recognise constructive decision-support actions without gamifying gambling, risk-taking, or programme completion.

### Responsibilities

- If used, recognise learning, reflection, updating a boundary, or using control tools.
- Never reward deposits, referrals, gambling frequency, loss recovery, or session duration.
- Remain optional and easy to hide.

### Inputs

- Explicit user actions within learning and control journeys.

### Outputs

- Private, non-competitive progress acknowledgement.

### Dependencies

- Control Program.
- User Profile.
- Product integrity review.

### Future expansion

- May remain outside MVP if research cannot show that it supports agency without creating pressure.

## 5.14 Notifications

### Purpose

Provide user-requested, reversible reminders that support reflection, saved information, content updates, or control choices.

### Responsibilities

- Operate only with clear user preference and easy opt-out.
- Avoid urgency, loss-recovery, bonus pressure, and gambling activation language.
- Distinguish product service notices from optional educational updates.
- Suppress promotional content in safety-sensitive contexts.

### Inputs

- User preferences.
- Relevant saved items or programme choices.
- Verified material change events.

### Outputs

- In-product, email, or other approved user-requested messages.

### Dependencies

- User Profile.
- Control Program.
- Content and compliance status.

### Future expansion

- User-selected cadence and quiet periods.
- Market-specific notification controls.

## 5.15 CMS

### Purpose

Enable governed creation, review, scheduling, revision, and retirement of product content.

### Responsibilities

- Maintain content lifecycle states.
- Preserve sources, disclosures, review ownership, and update dates.
- Support separation between editorial content and commercial placement metadata.
- Make stale, restricted, or unreviewed content unavailable for publication.

### Inputs

- Draft content.
- Sources and evidence.
- Editorial, compliance, and commercial metadata.

### Outputs

- Published, scheduled, restricted, archived, or pending-review content.

### Dependencies

- Editorial workflows.
- Compliance review.
- Jurisdiction Engine.

### Future expansion

- Structured content quality checks.
- Public update summaries.
- More granular ownership and review service levels.

## 5.16 Admin Panel

### Purpose

Provide internal operational surfaces for permitted management of content, users, market status, operators, disclosures, reports, and workflows.

### Responsibilities

- Enforce role-specific access.
- Present approval and restriction states.
- Make material changes attributable and reviewable.
- Separate urgent suspension from ordinary publishing.

### Inputs

- Internal user actions.
- Workflow states.
- Approved operational data and evidence.

### Outputs

- Governed internal changes.
- Queues, alerts, and audit-ready records.

### Dependencies

- CMS.
- Compliance workflows.
- Affiliate management.
- Reporting.

### Future expansion

- Cross-market review views.
- Exception and escalation dashboards.

## 5.17 Analytics

### Purpose

Measure whether the product is useful, understandable, trusted, and operated with integrity.

### Responsibilities

- Measure the North Star and supporting decision-quality evidence.
- Identify comprehension failures, dead ends, stale content, and access barriers.
- Measure integrity indicators, not only traffic.
- Respect privacy, purpose limitation, and anti-goal constraints.

### Inputs

- Aggregated product interaction information.
- Voluntary feedback.
- Content quality and operational status.

### Outputs

- Product learning.
- Integrity and safety indicators.
- Inputs to prioritisation and review.

### Dependencies

- All user-facing modules.
- User feedback policy.
- Compliance governance.

### Future expansion

- Decision-quality research programme.
- Cohort learning that excludes promotional exploitation of risk signals.

## 5.18 Affiliate

### Purpose

Operate transparent referrals to eligible partners without allowing commercial terms to override user welfare, facts, or regulatory eligibility.

### Responsibilities

- Maintain partner and placement disclosure.
- Enforce referral availability by market and operator status.
- Support clear redirection context.
- Provide commercial reporting without redefining product success.
- Enable suspension of referrals when integrity or compliance confidence changes.

### Inputs

- Approved partner relationship.
- Eligible operator and market status.
- Disclosure requirements.
- Placement approval.

### Outputs

- Clearly labelled referral actions.
- Referral status explanations.
- Commercial performance records.

### Dependencies

- Jurisdiction Engine.
- Operator Profile.
- Compliance review.
- Reporting.

### Future expansion

- Partner quality governance.
- Market-specific disclosure formats.
- Stronger partner suspension and remediation workflows.

## 5.19 Reporting

### Purpose

Give internal stakeholders visibility into product health, content quality, compliance readiness, affiliate integrity, and user decision-support outcomes.

### Responsibilities

- Report on product and integrity indicators separately from commercial performance.
- Surface review backlogs, stale information, restricted markets, and referral suspensions.
- Support accountable governance without exposing unnecessary personal information.

### Inputs

- Analytics.
- CMS and compliance statuses.
- Affiliate status.
- Operational workflows.

### Outputs

- Product health reports.
- Governance and compliance reports.
- Commercial reports with contextual integrity indicators.

### Dependencies

- Analytics.
- CMS.
- Admin Panel.
- Affiliate module.

### Future expansion

- Board-level trust and integrity reporting.
- Public transparency summaries if later approved.

# 6. Complete User Journeys

## 6.1 Journey design rules

Every journey must maintain five conditions:

1. the user can understand where they are and why content is shown;
2. market and age context are handled before availability is claimed;
3. material conditions precede a referral action;
4. control and support remain reachable;
5. leaving, pausing, or not choosing an operator is a valid completion.

## 6.2 Landing journey

1. A visitor arrives on a SevenBet entry page.
2. The page establishes that SevenBet is a decision-support platform, not an operator.
3. The visitor can choose to learn, start Control Program, explore a topic, or identify their market context.
4. If a commercial surface is encountered, it includes disclosure and a route to material information.
5. The visitor may leave after learning without a registration or referral prompt.

Desired outcome: the visitor understands the product's role and has a non-pressured next action.

## 6.3 Discovery journey

1. The user enters Discovery from a direct page, search, Control Program, or navigation.
2. SevenBet determines or asks for the context required to present appropriate options.
3. The user sees only options eligible for that context, or a clear limitation state.
4. Filters describe user-relevant criteria rather than commercial categories.
5. The user opens a profile or comparison, returns to learning, saves an item, or exits.

Desired outcome: discovery narrows informed choices; it does not create false urgency or a belief that every listing is suitable.

## 6.4 Learning journey

1. The user enters a guide, Responsible Gambling Hub page, bonus explainer, or programme step.
2. The content explains the subject in plain language with relevant limitations.
3. The user is offered related factual resources, not a forced referral.
4. If the topic concerns risk, control or help is prominent and commercial content is appropriately limited.
5. The user can continue learning, take a pause action, return to their decision context, or leave.

Desired outcome: the user understands enough to make a more informed next choice.

## 6.5 Comparison journey

1. The user selects a limited set of operators or arrives at a curated comparison.
2. SevenBet validates that the comparison is meaningful in the user's market context.
3. The comparison presents consistent criteria, unknown values, material differences, and methodology.
4. The user can open source profiles, change criteria, save the comparison, or decide that no option fits.
5. Any referral is secondary to the comparison and clearly labelled.

Desired outcome: the user understands trade-offs rather than simply being directed to a winner.

## 6.6 Decision journey

1. The user has gathered enough information to consider an action.
2. SevenBet presents a concise decision checkpoint: relevant context, material caveats, chosen boundaries, and available alternatives.
3. The user can choose to research further, save a decision, pause, access support, or follow an eligible labelled referral.
4. The product does not imply that following a referral is the expected completion.

Desired outcome: the decision is deliberate, informed, and consistent with the user's stated boundaries where any exist.

## 6.7 Affiliate redirect journey

1. The user intentionally selects a referral action from an eligible operator profile, comparison, or disclosed placement.
2. Before departure, the product makes the commercial relationship and material contextual limitations clear.
3. The user leaves SevenBet for the partner's environment.
4. SevenBet does not represent the partner experience as its own product, control the user's operator account, or imply responsibility for operator decisions.
5. On return, SevenBet offers access to saved information, control resources, and updated facts rather than escalating promotional pressure.

Desired outcome: a transparent referral, not a concealed handoff.

## 6.8 Returning user journey

1. The user returns through a saved link, notification, direct visit, or search.
2. SevenBet restores only the continuity the user expects and has permitted.
3. It identifies material changes to saved operators, offers, comparisons, or market context.
4. The user can revisit boundaries, change preferences, remove saved items, or continue research.
5. The product does not use return status as a reason to intensify commercial messaging.

Desired outcome: returning makes prior research easier and safer.

## 6.9 Registered user journey

1. A visitor chooses registration because they want durable control or organisation.
2. SevenBet explains what is saved and why.
3. The user manages profile, decision-support history, saved items, boundaries, and notification preferences.
4. The user can update, export, or delete eligible account information through appropriate product paths.
5. The account remains a personal decision-support space, not a loyalty mechanism.

Desired outcome: registration adds user-controlled utility without becoming a gambling engagement programme.

## 6.10 Support or pause journey

1. A user enters from the Hub, Control Program, search, navigation, or a safety-sensitive context.
2. SevenBet removes unnecessary commercial distraction from the immediate path.
3. The user can access explanatory information, local options where reliable, and external support routes.
4. The product makes clear its limitations and does not diagnose or promise outcomes.
5. The user may leave without registration, feedback, or further contact.

Desired outcome: the user reaches a supportive, dignified next step.

## 6.11 Unsupported jurisdiction journey

1. SevenBet cannot establish a supported market context or determines that referrals are unavailable.
2. The product explains the limitation in plain language.
3. It offers non-commercial educational content and relevant general control information where appropriate.
4. It does not suggest alternative routes to operators or ways to circumvent the limitation.

Desired outcome: honest limitation without abandonment or commercial workaround.

## 6.12 Content editor workflow

1. An editor creates or updates educational, profile, review, comparison, or offer content.
2. The editor attaches sources, market scope, material conditions, disclosures, and update context.
3. Required editorial and compliance review occurs before publication.
4. A commercial relationship, if any, remains separately recorded and visibly disclosed at publication.
5. The content is published, scheduled, restricted, archived, or returned for revision.

Desired outcome: useful content with evidence and accountable ownership.

## 6.13 Compliance workflow

1. Compliance reviews a market, operator, offer, content item, or placement according to required scope.
2. The item is marked approved, restricted, pending evidence, suspended, or rejected.
3. Product surfaces reflect the status immediately at the product level: unavailable, informational only, or eligible.
4. Any urgent restriction is visible to affected owners and enters a documented review path.

Desired outcome: uncertainty and restrictions are reflected in user experience rather than hidden behind operational delays.

## 6.14 Affiliate workflow

1. An Affiliate Manager proposes or maintains a partner relationship.
2. Eligibility, disclosure, market applicability, and integrity requirements are reviewed.
3. A permitted relationship may enable a labelled placement or referral; it does not change the editorial score.
4. Compliance or editorial concerns can restrict or suspend the relationship's product visibility.
5. Reporting separates commercial performance from product integrity indicators.

Desired outcome: affiliate operations remain subordinate to user trust and eligibility.

## 6.15 Administrative workflow

1. An Administrator enters an internal operational request or review queue.
2. The product shows role-specific actions and required approvals.
3. The Administrator makes an allowed change or escalates it.
4. Material changes are attributable, reviewable, and reflected in appropriate user-facing states.
5. Super Admin intervention is reserved for governance or emergency needs and does not remove normal accountability.

Desired outcome: internal speed without uncontrolled overrides.

# 7. Product Navigation

## 7.1 Navigation principle

Navigation should reflect the product pyramid. Control, knowledge, and trust must be discoverable without first entering a commercial catalogue.

## 7.2 Primary navigation

| Section | Why it exists | Primary audience |
| --- | --- | --- |
| Start / Home | Establishes SevenBet's decision-support role and offers safe first choices. | All visitors |
| 10-Step Control Program | Provides the product's core decision-support path. | All adults |
| Learn | Houses guides, concepts, conditions, and educational resources. | All visitors |
| Explore | Enables contextual discovery of eligible operators and categories. | Users ready to research options |
| Compare | Makes trade-offs explicit through consistent criteria. | Users evaluating options |
| Responsible Gambling | Provides non-commercial control, pause, and support information. | All visitors, especially users seeking help |
| Search | Provides direct access to approved information. | All visitors |

## 7.3 Secondary navigation

| Section | Why it exists |
| --- | --- |
| Operator directory | Supports structured exploration without treating every listing as a recommendation. |
| Reviews | Offers detailed editorial assessment and evidence context. |
| Bonuses explained | Explains conditional offers without bonus-first promotion. |
| Methodology | Explains reviews, rankings, disclosures, and update principles. |
| Market information | Explains what SevenBet can show in a jurisdiction. |
| About SevenBet | Explains product role, independence, and limitations. |

## 7.4 Account navigation

Registered users can access:

- My decision support: saved Control Program progress and optional boundaries.
- Saved research: operators, comparisons, and guides.
- Notifications: preferences, cadence, and opt-out.
- Profile and privacy: account information and relevant controls.

Account navigation must not contain loyalty levels, gambling activity goals, or commercial progress indicators.

## 7.5 Contextual navigation

Relevant pages expose context-specific links:

- a profile links to methodology, comparisons, support information, and relevant guides;
- a bonus explanation links to material terms and an operator profile;
- a high-risk or pause-oriented page links to the Responsible Gambling Hub and Control Program, not adjacent offers;
- an unsupported-market page links to explanation and non-commercial education;
- a referral context links to the disclosure and profile facts.

## 7.6 Internal navigation

Internal users see only role-appropriate areas, such as content workflows, compliance queues, operator status, partner disclosures, reports, and administrative settings.

# 8. Product Rules

## 8.1 Age and adult-facing rule

SevenBet is for adults aged 18+. The product must not intentionally market, personalise gambling content, or provide affiliate pathways to underage users.

Age messaging is a product safeguard. It is not a substitute for operator-level age verification.

## 8.2 Market-context rule

Market context governs what SevenBet may present. Where the context is supported and sufficiently reliable, the product adapts eligibility, information, disclosure, and support paths. Where it is not, the product limits commercial actions rather than guessing.

## 8.3 Operator visibility rule

An operator may have distinct product visibility states:

- research-visible: eligible to be described editorially;
- market-visible: eligible to appear in local discovery;
- referral-eligible: eligible for a labelled affiliate action;
- restricted: may appear only with a limitation or not at all;
- suspended: removed from discovery and referral pending review;
- archived: retained only where historical information is appropriate and clearly marked.

These states are independent from partner payment level.

## 8.4 Content appearance rule

Content appears only when it has an appropriate publication status, market scope, review status, and disclosure treatment.

Content that is stale, materially uncertain, market-inapplicable, or pending review must not continue to appear as current guidance.

## 8.5 Referral rule

A referral action is available only when:

- the operator is eligible for the user's market context;
- the content and relationship are approved;
- the commercial relationship is disclosed;
- material user-relevant information remains accessible before the action;
- no safety or compliance restriction blocks it.

## 8.6 Ranking rule

Editorial ranking uses documented user-relevant criteria. Commercial compensation cannot be a hidden ranking input.

Sponsored placement, if permitted, must be separately labelled and must not impersonate an editorial result.

## 8.7 Authentication rule

Authentication is not required for:

- reading core educational information;
- accessing responsible gambling information;
- understanding jurisdiction limitations;
- reading operator profiles and reviews where otherwise available;
- using basic Control Program content.

Authentication may be required for:

- saving personal settings, boundaries, research, or programme progress;
- managing notifications;
- submitting content or feedback where identity or moderation requires it;
- accessing internal tools.

## 8.8 Moderation rule

Any future user-generated content must be subject to published participation standards, applicable moderation, and an escalation path. Reviews, comments, or reports must not become channels for affiliate manipulation, deceptive promotion, evasion guidance, harassment, or unsupported claims.

## 8.9 Safety-sensitive context rule

When a user explicitly seeks a pause, support, self-exclusion information, or expresses a product-level safety-sensitive context, the immediate experience prioritises non-commercial support and avoids promotional escalation.

This is a product design rule, not a medical classification or diagnostic assertion.

## 8.10 Notification rule

Notifications require a clear user preference, an evident purpose, and a simple opt-out. They cannot use urgency, loss recovery, personalised gambling activation, or bonus pressure.

## 8.11 Data and privacy rule

Only data needed for a clear user benefit, safety requirement, or legitimate operational purpose should be requested. Personal information must not be sold or transferred to operators without clear, separate, informed consent.

## 8.12 Correction rule

Users, operators, editors, and compliance staff need a defined route to flag inaccurate or outdated information. Corrections must preserve material context; they must not silently remove substantive issues merely because a partner objects.

# 9. Product States

## 9.1 User states

| State | Meaning | Product implications |
| --- | --- | --- |
| Guest | Unauthenticated user. | Core learning, support, Control Program, discovery, and comparisons remain available subject to market rules. |
| Returning guest | Prior visitor with permitted continuity. | Surface continuity carefully; do not infer gambling intent. |
| Registered | Account created by choice. | May save settings and research; no enhanced promotional treatment. |
| Control Program active | Engaged with one or more steps. | Preserve progress if requested; show pause, learning, and exit routes. |
| Control Program paused | User has paused or deferred. | Respect pause; avoid completion pressure. |
| Control Program completed | User reached a meaningful self-defined or programme-defined stopping point. | Offer reflection, saved plan, research, pause, or support - not an automatic referral. |
| Support-seeking | User entered a support or pause route. | Prioritise non-commercial support; limit promotional adjacency. |
| Safety-sensitive context | Product has a permitted reason to reduce promotional pressure. | Increase visibility of control and support; never use for conversion. |
| Unsupported market | No supported recommendation context. | No referral; provide honest limitation and non-commercial material where appropriate. |
| Restricted market | Some information or actions are limited. | Apply clear content and referral restrictions. |

## 9.2 Operator states

| State | Meaning | Product implications |
| --- | --- | --- |
| Draft | Internal work is incomplete. | Not visible publicly. |
| Pending review | Evidence or approval is incomplete. | Not presented as current or eligible. |
| Editorially published | Profile or review is approved for information. | May be research-visible depending on market rules. |
| Market eligible | Approved for local discovery. | May appear in relevant discovery and comparison. |
| Referral eligible | Approved commercial relationship and market referral status. | Labelled referral action may appear. |
| Restricted | A policy, market, evidence, or compliance limitation applies. | Visibility is limited or explanatory. |
| Suspended | Urgent concern or reassessment. | Referral and ordinary discovery removed pending review. |
| Archived | No longer current. | Historical material only if useful and clearly marked. |

## 9.3 Content states

| State | Meaning | Product implications |
| --- | --- | --- |
| Draft | Authoring in progress. | Internal only. |
| Editorial review | Content quality and clarity being checked. | Internal only. |
| Compliance review | Market, claim, disclosure, or safety review pending. | Internal only. |
| Approved | Ready for permitted publication. | May be published in its approved scope. |
| Published | Live and current. | User-visible within scope. |
| Scheduled review | Published but approaching required review. | Visible until status changes, with operational monitoring. |
| Restricted | Not permitted in certain contexts. | Hidden or limited according to restriction. |
| Archived | Superseded or no longer current. | Not used as active guidance. |

## 9.4 Referral states

| State | Meaning | Product implications |
| --- | --- | --- |
| Not applicable | No partnership or referral pathway. | Editorial information may remain subject to rules. |
| Proposed | Commercial proposal under review. | No public placement. |
| Approved | Relationship approved but placement may not yet be active. | Disclosure data prepared; no implied promotion. |
| Active | Eligible, disclosed referral is live. | Referral action allowed only in approved contexts. |
| Paused | Temporarily stopped. | Referral action removed; reason handled internally and user experience adjusted. |
| Suspended | Integrity or compliance concern. | No referral; related content reviewed. |
| Ended | Relationship no longer active. | Referral removed; editorial content independently reviewed. |

# 10. Permissions Matrix

## 10.1 Permission principles

Permissions follow least privilege, separation of duties, and accountable ownership. A role's ability to act does not allow it to override Product Vision.

Legend: **View** = read; **Create** = prepare; **Edit** = modify within scope; **Approve** = final workflow approval; **Restrict** = remove or limit visibility; **Manage** = operational administration.

| Capability | Visitor | Registered User | Affiliate Manager | Content Editor | Compliance Manager | Moderator | Analyst | Administrator | Super Admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Read public content | View | View | View | View | View | View | View | View | View |
| Save personal research | — | Manage | — | — | — | — | — | — | — |
| Manage own profile and notifications | — | Manage | — | — | — | — | — | — | — |
| Submit feedback or report | Create | Create | — | — | — | — | — | — | — |
| Create editorial content | — | — | — | Create/Edit | — | — | — | — | — |
| Approve editorial content | — | — | — | — | Approve within policy | — | — | — | Emergency governance only |
| Manage sources and review dates | — | — | — | Create/Edit | View/Restrict | — | — | Manage | Manage |
| Manage operator commercial relationship | — | — | Create/Edit | View | View/Restrict | — | View | Manage | Manage |
| Alter editorial score or material caveat | — | — | — | Create/Edit with review | Approve/Restrict | — | — | — | Emergency governance only |
| Approve market or referral eligibility | — | — | Propose | View | Approve/Restrict | — | — | Manage approved changes | Emergency governance only |
| Moderate user-generated material | — | — | — | — | Escalate | Manage | View aggregate | Manage workflow | Manage |
| View aggregate product reporting | — | — | Relevant commercial reporting | Relevant content reporting | Relevant compliance reporting | Relevant moderation reporting | Manage | View | Manage |
| Manage roles and access | — | — | — | — | — | — | — | Manage within policy | Manage |
| Emergency suspension | — | — | Request | Request | Restrict | Request | Flag | Restrict within authority | Manage |

## 10.2 Separation-of-duties rules

- Affiliate Managers cannot approve their own commercial placements for public visibility.
- Commercial terms cannot change editorial facts, review scores, or material caveats.
- Content Editors cannot publish market-sensitive claims without required review.
- Compliance Managers can restrict or suspend a user-facing item when confidence is insufficient.
- Super Admin access is logged, limited, and cannot convert an exception into a permanent policy.
- User account actions are limited to the user's own information and choices.

# 11. Functional Boundaries

## 11.1 What SevenBet does

SevenBet:

- informs adults about regulated gambling decisions;
- provides optional control and decision-support experiences;
- explains market context, eligibility, material terms, and uncertainty;
- researches and evaluates operators using a documented methodology;
- compares eligible options with consistent criteria;
- provides non-commercial responsible gambling information and support pathways;
- makes transparent referrals to approved eligible partners;
- helps users organise saved decision-support information if they choose to register;
- gives internal teams governed workflows to maintain quality, compliance, and transparency.

## 11.2 What SevenBet never does

SevenBet never:

- accepts a bet, deposit, wager, payment, or withdrawal;
- holds, transfers, safeguards, or manages user funds;
- operates casino games or gambling accounts;
- sets gambling odds, results, limits, bonuses, or operator account conditions;
- promises winnings, income, loss recovery, or safety from harm;
- encourages bypassing regulation, location restrictions, self-exclusion, or limits;
- hides an affiliate relationship or paid placement;
- presents partner payment as editorial quality;
- uses known vulnerability signals to increase promotion;
- diagnoses gambling disorder or replaces professional support;
- requires a referral, registration, or programme completion to access basic decision support;
- sells personal user data to operators.

## 11.3 Boundary with operators

Operators own gambling account eligibility, age verification, deposits, betting, game delivery, account controls, withdrawals, complaints about their service, and their own regulatory duties.

SevenBet may explain publicly available or verified operator information and link a user to an eligible operator. It does not control the operator experience and must not imply that it does.

## 11.4 Boundary with external support organisations

SevenBet can provide a pathway to external support information. It does not represent itself as the external organisation, make treatment claims, or collect sensitive help-seeking information beyond a clear and justified product purpose.

# 12. MVP

## 12.1 MVP objective

The first production version proves that SevenBet can deliver a coherent, trustworthy decision-support experience for a defined supported market without relying on the patterns of a conventional affiliate catalogue.

The MVP should be deliberately narrow: one primary market context, a limited approved operator set, a clear editorial methodology, and a complete control-to-decision journey.

## 12.2 MVP inclusion

### Foundation

- Clear adult-facing positioning and Product Vision-aligned disclosures.
- Supported-market determination and restricted/unsupported states.
- Basic product methodology and commercial disclosure pages.
- Responsible Gambling Hub with approved support and control information.

### Core user experience

- Version 1 of the 10-Step Control Program.
- Public educational content needed to support the programme and evaluations.
- Contextual Discovery for eligible operators.
- Casino Directory limited to approved market scope.
- Operator Profiles with facts, limitations, review date, and referral disclosure.
- Review Engine methodology applied consistently to the initial operator set.
- Basic Comparison experience for eligible operators.
- Bonus explanations with material conditions where offers are shown.
- Search across the approved public information set.
- Clear unsupported, restricted, unavailable, and no-result states.

### Commercial integrity

- Affiliate referrals only for approved, disclosed, eligible operators.
- Separation of editorial assessment from sponsored placement.
- Ability to pause or remove referrals based on compliance or integrity status.

### Internal operation

- Governed content creation, review, publication, restriction, and archival workflow.
- Role-scoped access for Content Editor, Compliance Manager, Affiliate Manager, and Administrator.
- Initial reporting for content freshness, operator/referral status, core journey usage, and voluntary user feedback.

### Registered-user scope

- Mission 01 may be completed in a private ephemeral session; registration is required to save that result and continue the personal Control Program. Public research, discovery and Help remain available without registration.
- Minimum useful account value: a persistent personal Control Program, saved boundaries and actions, saved research, and notification preferences.
- No loyalty, deposit, gambling frequency, or conversion mechanics.

## 12.3 MVP exclusions

The following are outside the first production version unless separately approved through product and compliance review:

- multi-market expansion beyond the defined initial supported market;
- other gambling verticals;
- user-generated reviews, comments, or social/community functionality;
- achievements or progress mechanics, except the private action-based Control Program progression and Personal Control Dashboard approved by RFC-002; all other achievement or progress mechanics remain excluded;
- broad personalisation beyond user-selected market and preferences;
- complex recommendation systems;
- extensive automated notification programmes;
- public ranking histories or large-scale historical operator tracking;
- partner self-service portals;
- public transparency reporting;
- advanced research dashboards;
- any feature that uses safety-sensitive contexts for promotional optimisation.

## 12.4 MVP acceptance conditions

The MVP is product-ready only when:

- a user can complete a useful public research, education, Help or Mission 01 journey without referral or registration; persistent Control Program progress after Mission 01 requires the account and privacy controls defined by RFC-002;
- every affiliate action is market-eligible, disclosed, and preceded by material information;
- a user can reach the Responsible Gambling Hub from major commercial surfaces;
- unsupported and restricted states are clear and non-commercial;
- editorial, commercial, and compliance roles have defined review boundaries;
- the initial content and operator set have visible source, review, and update ownership;
- the product can measure voluntary decision-quality feedback without treating conversion as the North Star.

# 13. Post-MVP Roadmap

## 13.1 Evolution principle

Expansion is earned by maintaining quality in the initial market. New scope is not added simply because it can increase traffic or affiliate revenue.

## 13.2 Stage A: Validate the core decision-support loop

Focus:

- Test comprehension and usefulness of the 10-Step Control Program.
- Validate that users understand disclosures, eligibility, and material conditions.
- Improve content freshness, review discipline, and referral integrity.
- Establish baseline trust, decision-quality, and safety indicators.

Exit condition: evidence that the core journey improves understanding and can be operated without material integrity failures.

## 13.3 Stage B: Deepen decision support

Focus:

- Improve comparison criteria and explanations.
- Add optional saved comparisons and decision reflections.
- Expand market-specific educational resources.
- Improve user-controlled notification and update awareness.
- Introduce achievement-like recognition only if it demonstrably supports reflection without gamification risk.

Exit condition: users can evaluate choices more clearly without increased pressure or dependence on opaque rankings.

## 13.4 Stage C: Expand market coverage carefully

Focus:

- Add markets only through approved market-readiness criteria.
- Localise discovery, disclosures, support information, and content.
- Expand the operator set only when evidence and review capacity support it.

Exit condition: new market experiences meet the same Regulated First, transparency, and support standard as the initial market.

## 13.5 Stage D: Strengthen trust infrastructure

Focus:

- Publish richer methodology and update transparency where appropriate.
- Introduce correction and review histories.
- Strengthen partner quality and suspension workflows.
- Develop governance reporting and independent review mechanisms.

Exit condition: trust is supported by observable product evidence, not branding claims.

## 13.6 Stage E: Consider additional regulated verticals

Focus:

- Evaluate whether the SevenBet decision-support model transfers responsibly.
- Define vertical-specific control, evidence, jurisdiction, and user-journey needs.
- Avoid treating a new vertical as a simple category extension.

Exit condition: a separate approved product case demonstrates that expansion preserves the Product Vision.

# 14. Risks

## 14.1 Product risks

### Control Program becomes a disguised funnel

Risk: the programme is optimised for completion or referral rather than reflection and agency.

Response: treat pause, exit, support, and no-play outcomes as valid; measure voluntary decision-quality feedback; review all commercial adjacency.

### Information overload

Risk: users see too many conditions, comparisons, or choices to make a clearer decision.

Response: use progressive education, plain language, limited comparisons, and explicit explanations of what matters now.

### False confidence from ratings

Risk: a score appears definitive even when suitability depends on context.

Response: explain criteria and limitations; show material differences; avoid treating ranking as a guarantee.

### Responsible gambling content becomes isolated

Risk: the Hub exists but product journeys still privilege promotion.

Response: require access to control routes from discovery, profiles, comparisons, offers, and key navigation.

## 14.2 Business risks

### Affiliate revenue conflicts with independence

Risk: commercial relationships pressure product ordering, content, or restriction decisions.

Response: role separation, disclosure, documented methodology, suspension rights, and non-negotiable principles.

### Short-term growth incentives distort the North Star

Risk: acquisition and conversion metrics displace decision quality.

Response: governance reporting separates commercial performance from user and integrity outcomes.

### Insufficient operator coverage

Risk: a narrow eligible set appears less competitive than broad affiliate catalogues.

Response: accept narrower coverage when evidence or local eligibility is insufficient; explain limitations honestly.

## 14.3 Compliance risks

### Incorrect market eligibility

Risk: users receive inapplicable operator or referral information.

Response: Regulated First rules, supported-market states, verification ownership, restricted fallbacks, and suspension capability.

### Stale conditions or offers

Risk: content becomes misleading after an operator, market, or offer change.

Response: review dates, freshness ownership, visibility restrictions, and correction workflows.

### Inadequate disclosure

Risk: users cannot distinguish editorial information from paid placement.

Response: standard disclosure patterns, review gates, and separation of commercial metadata from editorial assessment.

## 14.4 Operational risks

### Review backlog

Risk: content or operators await review while commercial or publishing pressure rises.

Response: no publication or referral eligibility before required approval; report backlog and ageing.

### Unclear ownership

Risk: editors, compliance, product, and commercial teams assume someone else owns a decision.

Response: explicit workflow states, permissions, escalation paths, and decision records.

### Over-broad administrative access

Risk: an internal role can alter public product behaviour without appropriate scrutiny.

Response: least privilege, separation of duties, attributable actions, and constrained Super Admin use.

## 14.5 Trust risks

### Language creates pressure

Risk: seemingly normal affiliate copy creates urgency, fear of missing out, or loss-recovery framing.

Response: content standards, review, and an explicit prohibition on pressure-based language.

### Personalisation becomes exploitation

Risk: user context is used to increase conversion rather than relevance and safety.

Response: constrain personalisation to user-selected preferences and decision support; prohibit promotional use of safety-sensitive signals.

### The product overclaims independence

Risk: brand claims exceed what users can verify.

Response: show methodology, sources, update dates, disclosures, and limitations rather than relying on assertions.

# 15. Open Questions

The following questions are intentionally unresolved. They require research, compliance input, product validation, an RFC, or a later decision record before becoming product commitments.

## 15.1 Control Program

1. What are the exact ten steps, and which are universal versus market-specific?
2. What language makes the programme supportive without sounding clinical, paternalistic, or promotional?
3. Which user actions evidence understanding without turning the programme into a test?
4. When, if ever, should a user be invited to save a boundary or return for reflection?

## 15.2 Market and compliance scope

5. What is the first supported market, and what evidence defines its readiness?
6. Which market signals may the product use, how are they corrected by users, and when must it fall back to an unknown state?
7. What minimum evidence is required for an operator to be research-visible, market-visible, or referral-eligible?
8. What review frequency is necessary for licence, offer, and condition information?

## 15.3 Reviews and comparisons

9. What exact methodology and weighting model will the Review Engine use?
10. Which criteria are sufficiently consistent to compare across all initial operators?
11. How will SevenBet collect, assess, correct, and, if appropriate, publish user-reported experience?
12. How will the product distinguish editorial quality from personal suitability without creating opaque personal recommendations?

## 15.4 Affiliate integrity

13. Which compensation models are permitted, restricted, or prohibited, including revenue-share arrangements?
14. Which partner practices trigger automatic review, pause, or termination?
15. What form of sponsored placement, if any, can remain compatible with the Product Vision?
16. How will commercial performance be reported without becoming the practical decision-maker?

## 15.5 Accounts, privacy, and notifications

17. What minimum account value justifies collecting personal information?
18. Which personal decision-support data can be saved, for how long, and with what user controls?
19. Which notification categories are valuable enough to offer, and which should be prohibited outright?
20. Are achievements helpful, neutral, or harmful in a decision-support context?

## 15.6 Governance and measurement

21. What exact survey, research, and qualitative methods will measure the North Star without response bias?
22. Which safety metrics trigger a review, a launch hold, or a feature rollback?
23. What external expertise and user research are required before MVP approval?
24. Which decisions require an RFC versus an operational decision record?

## 15.7 Product expansion

25. Under what conditions can a second market be introduced?
26. Under what conditions can SevenBet support a second regulated gambling vertical?
27. What must be proven before user-generated content or community features are considered?

# Appendix A. Product Decision Test

Before a module, journey, content pattern, commercial placement, or major change is approved, the owner must be able to answer:

1. What user decision does this help improve?
2. Does it preserve a valid choice to pause, leave, or not play?
3. Is the market and eligibility context sufficient?
4. Are material conditions and commercial incentives clear before the user acts?
5. Could this create pressure, false confidence, or exploitation of vulnerability?
6. Would it remain useful with no affiliate referral?
7. What evidence will show user benefit and what signal would require reconsideration?

If the answer conflicts with Product Vision or a Non-Negotiable Principle, the work must not proceed as proposed.

# Appendix B. Glossary

| Term | Product meaning |
| --- | --- |
| Affiliate referral | A disclosed link or handoff from SevenBet to an eligible partner for which SevenBet may receive commercial compensation. |
| Control Program | SevenBet's optional 10-Step decision-support programme for adults. |
| Decision support | Product information and interactions that help a user understand options, conditions, risks, and personal boundaries. |
| Editorial assessment | A documented SevenBet evaluation based on published methodology and evidence, separate from commercial terms. |
| Eligible operator | An operator that meets the product's applicable market, compliance, and publication requirements for a stated context. |
| Market context | The jurisdictional and product-support context that affects what SevenBet can responsibly show. |
| Material condition | Information likely to affect a reasonable user's decision, including significant eligibility limits, conditions, costs, restrictions, or uncertainty. |
| Product integrity | The degree to which product behaviour matches Product Vision, including transparency, control, regulation, and commercial independence. |
| Safety-sensitive context | A product context in which promotional pressure must be reduced and control or support information prioritised; not a clinical diagnosis. |
| Supported market | A market in which SevenBet has approved enough product, compliance, content, and operational readiness to offer a defined experience. |

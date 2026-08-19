# B4GAMBLE Decision & Documentation Governance

## Purpose

This document defines how 7BE Inc. makes internal decisions, uses RFCs and
records current state. It governs internal authority only. It does not change
law, platform behaviour, contractual facts or technical reality.

## Founder authority

The Founder is the final internal decision authority for B4GAMBLE / 7BE Inc.
A clear current Founder instruction is sufficient authority for the action it
actually covers. It does not need a prior RFC edit, a special phrase, a second
ticket or repetition in another system.

For internal decision and authorisation questions, use this order:

1. current explicit Founder decision;
2. current Founder-approved project state;
3. relevant `ACTIVE` RFC;
4. other current internal documentation; and
5. historical decisions, old PR limitations and old chat context.

A newer explicit Founder decision may supersede any older internal RFC,
roadmap item, architecture note, project-state note, PR limitation or previous
Founder decision. An older internal document is not a permanent veto.

## Decision authority is not evidence authority

Founder authority can order or approve a change. It cannot establish that the
change already happened or turn an unsupported external claim into fact.

For factual claims about what exists or happened, use this order:

1. live authoritative system, Production, repository or provider evidence;
2. direct primary or internal records;
3. current project-state documentation;
4. historical documentation; and
5. inference.

Use the evidence vocabulary `DETECTED`, `INFERRED`, `PROPOSED`, `UNKNOWN` and
`CONTRADICTION`. Authorisation never converts `UNKNOWN` into `DETECTED`.
A stale [Current State](CURRENT_STATE.md) entry must not override newer live
authoritative evidence; reconcile the document after verification.

## External constraints

No internal decision changes external reality. State the exact blocker when an
action is technically impossible, blocked by a platform, dependent on missing
credentials or real-world evidence, or unlawful under an applicable external
requirement. Do not describe an external blocker as an RFC prohibition.

## RFC purpose

An RFC is a durable architecture, policy or major-decision record. It preserves
reasoning that future teams need for important system ownership, security,
privacy, legal/compliance, Production, commercial, product-invariant or
external-integration decisions.

An RFC is required when a change materially alters one or more of:

1. durable system architecture;
2. domain ownership or a major data model;
3. a security authority boundary;
4. a privacy or sensitive-data boundary;
5. legal/compliance architecture;
6. the Production authority model;
7. commercial authority or activation architecture;
8. a major product invariant;
9. major external-provider or integration architecture; or
10. a durable engineering standard affecting future work.

RFCs are not routine execution permissions. An RFC is not required merely
because a workstream has a name, nor for an ordinary PR, merge, Preview,
deployment, UI change, small feature, bug fix, CI fix, test update or normal
refactor. Use the PR description, tests, relevant operational documentation and
`docs/CURRENT_STATE.md` when current state materially changes.

## RFC lifecycle

Every RFC registry entry uses exactly one lifecycle classification:

- `ACTIVE` — still part of current durable authority or architecture;
- `HISTORICAL` — records a past decision or delivery history but is not a
  current execution constraint;
- `SUPERSEDED` — explicitly replaced by a newer decision, RFC or
  Founder-approved state; or
- `PROPOSED` — not approved and not current authority.

The [RFC Registry](06_RFC/README.md) is the lifecycle index. Read only RFCs
classified `ACTIVE` and relevant to the work. Use historical records only when
their context is needed.

An `ACTIVE` RFC guides implementation when no newer conflicting Founder
decision exists. If a Founder instruction intentionally changes its
architecture, execute the authorised scope within safe technical boundaries,
then update or supersede the durable documentation. Do not block solely because
the older RFC has not yet been edited.

## Historical scope statements

Statements such as `does not authorise merge`, `Preview only`, `no Production`
or `Founder review required before merge` describe the scope of the decision at
that time. They remain historically accurate, but they are not perpetual
restrictions after a later explicit Founder instruction covers the action.

PR merge, Preview, implementation, activation and deployment authority comes
from current Founder/project execution authority plus the repository and
platform permissions that actually exist. Do not require a second Founder
decision for an action the Founder has already explicitly approved.

## Conflict handling and challenge duty

When a current Founder instruction conflicts with an older internal record:

1. identify the previous boundary precisely;
2. state that the current Founder instruction supersedes it for the approved
   scope;
3. identify material security, privacy, legal, technical and irreversible
   consequences;
4. describe rollback or recovery where applicable;
5. execute only the authorised scope; and
6. update the durable record after verification.

Agents must challenge weak assumptions, disclose material downside and
recommend `STOP` when warranted. After an informed explicit Founder decision,
do not reopen the same internal-governance objection unless new evidence
appears, scope materially changes or an external constraint prevents execution.

## Operating loop

Use this sequence:

```text
FOUNDER DECISION
→ CONTROLLED EXECUTION
→ VERIFICATION
→ DOCUMENTED CURRENT STATE
```

Once agreed acceptance criteria are satisfied, complete the work. Do not add
repeated review loops because an old RFC used conservative scope language, and
do not create an RFC solely to supersede another RFC unless the new durable
architecture genuinely warrants one.

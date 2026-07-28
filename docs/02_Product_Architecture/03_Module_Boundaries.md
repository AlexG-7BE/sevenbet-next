# Module Boundaries

## Ownership map

Product modules in the Master Plan are capability boundaries. The following target ownership map prevents a catalogue, CMS, affiliate adapter, or UI from becoming the accidental source of truth.

| Module | Owns | May decide | Must not own or override |
| --- | --- | --- | --- |
| Jurisdiction and compliance | Market support, eligibility evidence, restrictions, disclosure requirements, review confidence. | Whether content, operator visibility, offer, or referral is permitted for a scope. | Editorial score, partner payment, user gambling intent. |
| Operator catalogue | Operator identity, factual profile, research visibility, market associations, source-backed factual attributes. | Whether a fact is complete enough for its owned lifecycle. | Referral eligibility or commercial ranking. |
| Reviews and comparisons | Methodology, editorial assessment, comparable criteria, caveats, correction history. | Editorial representation within approved scope. | Compliance approval or partner commercial terms. |
| Offers / bonus explanation | Material offer terms, expiry/review context, explanatory content. | Whether an offer can be accurately described. | Operator suitability or referral availability. |
| Control Program and responsible gambling | Educational/control content, optional progress, user-selected boundaries, support pathways. | Its own learning/progress states. | Diagnosis, operator account controls, promotional targeting. |
| User profile | Account preferences, explicitly saved research, notification preferences, user-controlled retention choices. | Access to the user's own stored preferences. | Market truth, compliance status, or inferred gambling intent. |
| CMS and publication | Drafts, revisions, sources, review workflow, publication lifecycle. | Whether a content item is structurally ready for its workflow. | Jurisdiction eligibility, referral activation, or commercial ranking. |
| Affiliate | Partner relationships, tracking configuration, disclosed placement metadata, referral handoff records. | Technical handoff only after a governing eligibility decision. | Editorial facts, review scores, safety state, market eligibility. |
| Identity and access | Authentication, roles, session/actor context, permission grants. | Whether an actor may invoke a protected capability. | Business approval or compliance decision itself. |
| Analytics and reporting | Aggregated integrity/product measures and auditable operational views. | Metric computation and access to reports. | User-facing eligibility, ranking, or promotional targeting. |

## Boundary rules

1. No module writes another module's persistence model. It requests a command from the owner or consumes a published read contract.
2. No module silently derives an authoritative eligibility, disclosure, publication, or restriction state from partial fields it happens to hold.
3. Cross-module workflows have a named orchestrator and explicit state handoff. For example, publication, market visibility, and referral activation remain separate transitions even when initiated in one admin experience.
4. Commercial modules may propose and record commercial facts; they cannot approve their own public visibility or alter editorial/compliance facts.
5. A restriction or suspension decision has precedence over ordinary publication and activation. Every consuming module must be able to remove governed commercial exposure promptly.
6. Shared code is limited to technical utilities and stable cross-cutting contracts. A generic `shared` domain model is not a substitute for ownership.

## CMS boundary

CMS is a governed authoring and workflow capability, not a universal back door to production behaviour. It stores content and workflow metadata; it must preserve sources, review ownership, dates, disclosures, and revision history. Publication is conditional on the relevant editorial and compliance contracts. CMS users cannot change policy logic, credentials, role grants, or affiliate redirection behaviour by editing content.

## Affiliate anti-corruption boundary

Affiliate networks and operators provide external commercial data, not SevenBet truth. An adapter must translate provider identifiers, statuses, terms, and tracking data into a quarantined integration model; validation, matching, evidence review, and approval occur before it becomes an owned partner or offer fact. Outbound redirects use only an approved, scope-specific referral decision. Provider outages or ambiguous data remove or pause the referral rather than creating an unlabelled fallback.

## Boundary with external parties

Operators own their service and legal obligations; support organisations own support delivery; regulators own legal interpretation and enforcement. SevenBet may link, explain, and maintain evidence but does not impersonate, control, or make guarantees on their behalf.

## Open Decisions

### ARCH-OD-08 — Referral security and reconciliation

Before a governed MVP referral is implemented or retained, an RFC must define destination allowlisting, scope-bound redirect-token design, parameter ownership and anti-tampering controls, tracking-data classification, attribution retention, reconciliation ownership, discrepancy workflow, partner-reporting boundaries, and provider offboarding. Until then, no integration data, URL parameter, or partner configuration can independently activate or redirect a referral.

### ARCH-OD-06 — Suspension propagation and emergency verification

Before governed MVP implementation, an RFC must define the suspension propagation objective, invalidation and bypass behaviour for caches/indexes/client state, monitoring, emergency verification, and accountable escalation. Referral-time authoritative re-evaluation remains mandatory; a prior page render, derived view, or token cannot extend a suspended approval.

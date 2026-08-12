# Extensibility Principles

## Extend by evidence, not by category

New markets, casino capabilities, integrations, content types, and regulated verticals must be added because SevenBet can preserve the Product Vision in that scope—not because a data model, provider, or navigation pattern can be reused. Reuse is permitted only after the new context has passed its own evidence, policy, safety, and operational readiness review.

## New market rule

A market is independently scoped. Before it can expose discovery or referral, an RFC must define: support status, legal/compliance evidence standard, licence applicability, age/disclosure requirements, local support and control routes, language/currency/payment claim policy, review cadence, responsible context determination, correction path, owners, suspension procedure, and metrics. Unsupported, restricted, and unknown states are first-class outcomes from day one.

Jurisdictional and market scope isolation means that scope-specific rules are configurable/expressible as data and policy, but no generic configuration surface may grant an unreviewed market commercial access. Market additions require tests for both permitted and denied exposure.

## New regulated vertical rule

A new gambling vertical is not a new category under casino discovery. It needs a separate product case, user journey, evidence and review methodology, control/support assessment, jurisdiction model, disclosure model, commercial integrity review, and RFC approval. It must demonstrate that the existing decision-support model remains useful without applying casino assumptions where they do not fit.

## CMS evolution rule

CMS may add content structures and workflows only when they preserve source provenance, lifecycle ownership, version/revision history, applicable market scope, disclosure, review requirements, restriction, archival, and correction. Generic authoring convenience must not turn content editing into authority over eligibility, permissions, configuration, or integrations. New content types define their owner and publication policy before their UI is built.

## Affiliate integration rule

Each network/operator integration is replaceable behind an adapter. Its onboarding defines credential ownership, approved data fields, mapping and reconciliation, inbound verification, rate/failure behaviour, manual-review path, tracking/disclosure treatment, destination validation, audit retention, pause/removal behaviour, and termination. No integration may auto-publish, auto-approve, or auto-reactivate referrals from provider data alone.

## Scalability and resilience rule

Scale first through clear ownership, idempotent operations, derived read models, bounded cache scope, and observable work—not premature distributed complexity. The canonical record and policy decision remain authoritative; caches/search/reporting are rebuildable and fail safely. Reliability planning must include stale-data control, suspension propagation, backup/recovery, deployment/migration compatibility, and incident response before a production claim is made.

## Testability rule

Policy, domain rules, and application workflows must be independently testable from UI and providers. Each governed capability defines positive, negative, unknown, stale, restricted, suspended, and cross-market cases. Contract tests protect adapters; end-to-end tests prove that a user can access support, pause, research, and leave without referral or registration, and that a referral cannot occur when policy denies it.

## Open questions before implementation alignment

The architecture cannot supply missing product or compliance authority. The following need RFCs or approved decisions before related implementation begins:

- First supported market and its readiness/evidence standard.
- Jurisdiction determination, correction, confidence, and review/expiry policy.
- Licence, operator, offer, content, and referral eligibility data/decision model.
- Review methodology, ranking factors, sponsored-placement policy, and permitted compensation models.
- Safety-sensitive context definition, suppression behaviour, and governance safeguards.
- Privacy/retention/export/deletion/consent model for accounts, boundaries, analytics, and referrals.
- Role model, approval workflow, audit-retention, and emergency-suspension procedure.
- Content freshness SLAs and correction/dispute process.
- Production deployment, migration, secrets, monitoring, incident response, backups, and CI/CD architecture.
- Measurement design for the North Star and safety/integrity thresholds that hold, roll back, or suspend a feature.

## Open Decisions

### ARCH-OD-11 — Production release and operations architecture

Before governed MVP implementation, an RFC must define environment topology, deployment gates, migration compatibility and rollback, secret management, release approval, emergency changes, CI/CD, and the operational ownership required to run policy changes safely.

### ARCH-OD-12 — Integrity observability architecture

Before governed MVP implementation, an RFC must define telemetry and logging ownership; policy-denial, stale-evidence, referral-decision, integration-failure, audit-event, and suspension-propagation signals; privacy controls; alert thresholds; SLOs; retention; audit access; and on-call responsibility. Observability must not collect or expose safety-sensitive data for promotional optimisation.

### ARCH-OD-13 — Recovery and incident architecture

Before governed MVP implementation, an RFC must define data-class-specific backup and restoration requirements, RPO/RTO objectives, restore validation, incident command and communications, and preservation of compliance evidence and audit records.

**Decision:** RFC-024 defines the bounded database recovery architecture, internal RPO/RTO objectives, identity proof, isolated restore validation and incident procedure. Its logical Preview restore is detected evidence; managed Production recovery remains an open release gate.

### ARCH-OD-14 — Existing implementation conformance plan

Before new governed capability work proceeds beside the detected implementation, an RFC must inventory non-conforming paths, define interim controls and accountable owners, sequence incremental alignment, identify acceptance tests, and define criteria for retiring transitional behaviour. This architecture does not approve a rewrite or imply that detected patterns already conform.

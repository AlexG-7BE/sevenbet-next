# Data Flow

## Information classes

| Class | Examples | Rules |
| --- | --- | --- |
| Public editorial facts | Operator descriptions, methodology, guides, material conditions. | Require source, scope, review context, and correction path where material. |
| Governance facts | Eligibility, licence evidence, restrictions, publication approvals, disclosures. | Owned by their governing modules; evaluated server-side; consumed as explicit decisions. |
| Commercial facts | Partner terms, placement metadata, tracking configuration, referral outcomes. | Segregated from editorial assessment; disclosed before action; never used as a hidden ranking input. |
| User decision-support data | Saved progress, boundaries, preferences, saved research. | Optional, minimised, purpose-limited, user-controlled; isolated from commercial optimisation. |
| Safety-sensitive context | Pause/support intent and permitted safety signals. | Used only to reduce promotional pressure and improve control/support access; never shared for promotion or used to increase it. |
| Identity and security data | Credentials, sessions, roles, audit records. | Server-only, least-privilege access, retention and incident controls. |
| Operational data | Health signals, queues, cache/index state, aggregated metrics. | Minimise identifiers; use for reliability, integrity, and product learning. |

## Authoritative flow

```text
Evidence / approved staff input
  → owning domain lifecycle
  → policy decision with scope and reasons
  → approved read model
  → public/admin experience or controlled referral
```

No reverse flow is assumed. A page view, cache, analytics event, provider payload, or client submission cannot overwrite owned facts or become an approval. Derived systems may be rebuilt from authoritative data and must retain enough version/scope information to detect staleness.

## Provenance and freshness

Material facts must support: source/reference, collector or reviewer, applicable scope, observed/reviewed time, confidence/status, and correction/review path. The implementation mechanism is intentionally undecided. A field without required provenance is not suitable evidence for an eligibility or material claim.

Freshness rules are policy-owned. When evidence reaches its review deadline or becomes disputed, affected claims transition to the appropriate pending, restricted, suspended, or archived state. Cached/search/reporting views must not outlive an authoritative restriction.

## Governed decision records

Eligibility, licence applicability, restriction, disclosure, publication dependency, and referral decisions are durable governed records, not transient booleans or inferred field combinations. Each record must be queryable by subject and time and include: decision type and outcome; subject and jurisdictional/market scope; applicable evidence references and their observed/reviewed context; effective-from and review/expiry context; reviewer or authorised system actor; rationale/reason classification; and supersession, dispute, restriction, or override linkage where applicable.

Evidence references and decision history must remain attributable even when a current decision is replaced. A new decision may supersede a previous one but must not silently rewrite the explanation of prior exposure. The storage mechanism, evidence immutability approach, retention duration, override authority, dispute workflow, and audit-query service are intentionally not selected by this architecture.

## Jurisdictional and market scope isolation

Governed information carries explicit jurisdictional and market scope identifiers plus applicability state through every handoff. The following are prohibited without an approved policy decision: global fallback from a local licence, copying an offer or disclosure across scopes, using one scope's support route as another's, or treating an inferred location as verified legal eligibility. Users must have a safe correction path where jurisdictional or market context is used.

## Personal-data boundary

Personal decision-support data is separated from editorial, commercial, and operator data. Access is limited to the user or role-scoped operations needed for the stated purpose. Reporting defaults to aggregated/de-identified information. Any new collection, retention, export, deletion, consent, or third-party transfer path requires compliance/privacy design before implementation.

## Analytics boundary

Analytics receives the minimum events needed to assess decision quality, comprehension, access barriers, integrity, and operation. It must not create a feedback loop that rewards referrals, deposits, gambling frequency, losses, or use of safety-sensitive states. Commercial reporting may exist, but it remains separate from product-health and safety reporting.

## External exchange

Outbound transfers are explicit contracts with a documented purpose and data-minimisation rule. A referral normally transfers the user to an external destination; it does not authorise transfer of SevenBet personal profile, boundaries, or safety context. Inbound affiliate data is quarantined until matched, reviewed, and approved.

## Open Decisions

### ARCH-OD-04 — Compliance decision and evidence lifecycle

Before governed MVP implementation, an RFC must approve the decision-record state model, evidence immutability and retention, effective-date and expiry handling, reviewer and override authority, dispute handling, and audit-query requirements described above. No implementation may substitute a mutable content field, provider status, or UI state for this lifecycle.

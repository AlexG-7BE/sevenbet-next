# Layered Architecture

## Target layers

Layers define responsibilities, not folders, processes, or deployment units. A module may have code in several layers, but a layer must not take responsibility assigned to another.

| Layer | Responsibility | Must not do |
| --- | --- | --- |
| Experience | Render accessible public and internal experiences; collect explicit input; explain states and next actions. | Decide eligibility, authorise an action, expose secrets, or infer policy from presentation state. |
| Delivery | Adapt HTTP, jobs, CLI, or other transports to application commands/queries; authenticate, parse, and map errors. | Contain business policy or access persistence/provider internals directly. |
| Application | Orchestrate a use case, apply permissions and policy decisions, define transactions, and return purpose-specific results. | Render UI, own an external protocol, or allow one domain to mutate another's internals. |
| Domain | Own business concepts, invariants, state transitions, and decisions that are independent of delivery technology. | Depend on framework, database, browser, or vendor SDK detail. |
| Policy and governance | Evaluate jurisdiction, compliance, disclosure, publication, safety, retention, and access rules from approved inputs. | Be bypassed by a commercial, editorial, or administrative caller. |
| Infrastructure | Implement repositories, storage, caches, identity providers, messaging, telemetry, and integration adapters. | Invent business meaning or return provider payloads as domain truth. |

Policy and governance is cross-cutting but not optional: it is invoked by the application layer before exposure or mutation of governed facts. It cannot be reduced to a UI component, a CMS field, or an affiliate adapter.

## Policy authorities and precedence

Policy and governance is a layer, not a single decision owner. The following authorities own their respective decisions; a caller may consume a decision but may not replace it with a local interpretation.

| Authority | Owns the final decision about | Precedence rule |
| --- | --- | --- |
| Jurisdiction and licensing | Whether a market scope, operator, offer, or referral is legally/compliance eligible. | A deny, restriction, expiry, dispute, or unknown outcome prevents the governed exposure. |
| Publication | Whether a revision is structurally and editorially ready to be public. CMS owns the workflow state, not compliance eligibility. | Publication alone never permits a governed claim or commercial action. |
| Disclosure | Which disclosures must accompany a permitted claim, placement, or referral. | Missing or inapplicable disclosure prevents the affected exposure or action. |
| Safety suppression | Whether promotional exposure must be reduced or suppressed for a permitted safety context. | Safety suppression overrides ordinary publication, placement, and referral availability. |
| Privacy and retention | Whether personal, safety-sensitive, audit, or commercial data may be collected, used, retained, exported, or transferred. | A denied purpose or expired basis prevents the associated processing. |
| Identity and access | Whether an actor may invoke an internal or user-specific capability. | Access permission does not grant business, publication, or compliance approval. |

For a public item, the effective state is the most restrictive applicable outcome. CMS may publish a revision only as a workflow state; a jurisdiction/licensing restriction, required-disclosure failure, safety suppression, or privacy/access restriction continues to govern its exposure. Compliance restrictions always take precedence over publication, and a suspension takes precedence over every ordinary approval. Detailed state models and operational execution remain subject to the Open Decisions in the owning documents.

## Direction of dependency

Dependencies point inward:

```text
Experience → Delivery → Application → Domain
                       ↓
                 Policy contracts
                       ↓
                 Infrastructure adapters
```

Infrastructure implements ports defined by the application/domain boundary. It may be selected by composition/configuration, but the core does not import an ORM, SDK, framework, or provider-specific type. Policy consumes owned facts through explicit read contracts and returns an explainable decision; it does not reach into presentation or provider implementation.

## Repository and service responsibilities

- A **repository** persists and retrieves aggregates or read models owned by one domain. It has no HTTP, UI, affiliate, ranking, or policy decision responsibility.
- An **application service/use case** coordinates an intent such as publish content, assess operator visibility, save a boundary, or initiate a referral. It checks actor authority and required policy before committing a state transition.
- A **domain service** contains domain logic that does not naturally belong to one entity/value object. It remains independent of delivery and infrastructure.
- A **policy service** returns an outcome, reasons, evidence status, and effective scope. It must be usable from public, admin, integration, and scheduled execution paths alike.
- An **adapter** translates an external protocol or provider model. It is an anti-corruption boundary, not an alternate source of business policy.

## Read and write separation

Queries may assemble approved read models from multiple domains but must respect the same exposure policies as writes. Commands change one owned lifecycle through its owning application service. A command that needs another domain's decision uses that domain's contract; it does not write its tables or duplicate its rules.

Read optimisation, caching, search indexing, and reporting copies are derived views. They cannot become the authority for eligibility, disclosure, permissions, or current publication status.

## Baseline alignment

**Detected:** the repository has route handlers, services, repositories, Prisma persistence, and client/server React components. **Target:** preserve the useful separation while making policy invocation, contracts, and ownership explicit. Direct route-to-repository access, client-side eligibility enforcement, or cross-domain persistence access are not acceptable target patterns.

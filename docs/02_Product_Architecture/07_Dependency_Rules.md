# Dependency Rules

## Mandatory rules

1. Dependencies point from delivery and infrastructure toward application/domain contracts, never from domain logic toward framework, ORM, browser, or provider SDKs.
2. A module may depend on another module's published command, query, event, or policy-decision contract—not its tables, internal types, private implementation, or provider payload.
3. Circular module dependencies are prohibited. If two modules need each other, extract a narrower contract, introduce an application workflow, or record an RFC decision.
4. Cross-domain writes are prohibited. A workflow invokes the owner of each transition and records a recoverable, observable handoff.
5. UI components do not import repositories, ORM clients, privileged policy evaluators, or integration clients. Route/transport handlers do not bypass application services for business mutation.
6. Repositories are domain-scoped. A generic database utility cannot become a shared path around ownership and policy.
7. External providers are accessed through adapters and ports. Provider-specific types stop at the adapter boundary.
8. Shared libraries contain only stable technical utilities, primitives, and deliberately versioned contracts. They cannot become an unowned business domain.
9. Feature flags/configuration select approved behaviour; they cannot bypass a non-negotiable policy, disclosure, review, or authorisation check.
10. Tests follow the boundary: domain/policy tests do not require transport or database; contract tests prove adapters; integration tests prove policy enforcement at delivery points; end-to-end tests cover governed user journeys.

## Contract requirements

Every cross-boundary contract names its owner, purpose, caller, data classification, market scope, versioning/change rule, failure semantics, and observability expectation. Contracts that deliver eligibility, publication, restriction, or referral decisions return an explicit outcome and reasons; booleans without scope/explanation are insufficient for user-facing governance.

## Events and asynchronous work

Future events, queues, schedulers, webhooks, caches, and indexes are implementation choices, not new authorities. They carry an event identity, owner, scope, version, and idempotency semantics. Consumers must tolerate duplicate, delayed, and failed delivery. An asynchronous projection cannot extend an expired approval or defeat an urgent suspension.

## Dependency review

A proposed dependency needs an RFC when it crosses a domain boundary materially, introduces an external provider, shares personal/safety/commercial data, changes policy authority, or creates a new background workflow. Small internal implementation dependencies still follow the direction rules and should be visible in code review.

## Baseline alignment

**Detected:** Prisma repositories/services and provider adapters exist, while queues, schedulers, webhook receivers, CI/CD, and observability infrastructure are not detected. **Target:** no future provider, job, cache, or deployment mechanism is allowed to circumvent the governing contracts above.

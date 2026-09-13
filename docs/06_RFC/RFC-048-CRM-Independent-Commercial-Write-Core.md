# RFC-048 — CRM-Independent Commercial Write Core

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 13 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE
Commercial Core Simplification — PR2`.

## Decision

The Founder is the sole internal commercial authority. Commercial CRM remains
an operational system for research, contacts, applications, negotiations,
terms, evidence, tasks, follow-ups and history. CRM opportunity existence,
identity and workflow stage have no Partner, relationship, tracking, market,
route or public-action authority.

The minimum canonical write model is:

```text
AffiliateNetwork exposed as Partner identity
        +
PartnerCasinoRelationship(partnerId, casinoId, confirmedAt, endedAt?)
        +
trusted Founder commercial-authority context + tracking command
        ↓
PartnerTrackingRegistrationService
        ↓
transitional Affiliate records + MarketActivation
```

`AffiliateNetwork` is reused as the persisted Partner identity. PR2 does not
create a duplicate Partner table. Its legacy `active` and `archivedAt` fields
are compatibility projections and are not identity or write-permission gates.
An explicitly authorised canonical registration command may restore the
selected AffiliateNetwork, AffiliateProgram, AffiliateOffer and
AffiliateTrackingLink
projections from `archivedAt`; RFC-042 still owns their technical convergence
and route health. That bounded repair never creates or terminates a Partner ×
Casino relationship by itself.
Static current-partner names and aliases may assist deterministic identity
normalisation only after a persisted Partner record exists.

`PartnerCasinoRelationship` is the one canonical Partner × Casino business
fact. It is unique by `partnerId, casinoId`; a current relationship has
`endedAt = null`. Confirmation is idempotent. Re-confirming an explicitly
ended relationship requires a new explicit command and reopens that same
durable row. CRM changes never create, end or disable it.

Relationship existence does not activate a market, create a public CTA or
establish legal eligibility. Those remain separate facts and controls.

## Explicit write intent and application owner

Calling the authenticated registration operation is execution intent, not
commercial authority. Every registration command, including an idempotent
re-verification for a current relationship, requires a trusted
`FOUNDER_DIRECT` or `FOUNDER_DELEGATED` authority context with the opaque
reference of the real decision. A current relationship does not by itself
authorise a new or replacement destination, new market support, route
verification or MarketActivation convergence.

`affiliate.manage`, `commercial:safe_write`, a staff role, OAuth consent and a
valid MCP token are technical execution permissions only. The Partner, Casino,
URL and market fields are untrusted command data. Approval is not inferred from
those values, CRM, public programme pages, static inventories, market-support
evidence, media, Affiliate lifecycle state, another Casino or another market.

The trusted context is created only by a reviewed internal application
boundary after it has obtained the real Founder decision reference. PR2
represents that context as a process-local, non-serializable capability; a
plain object with matching fields is rejected. The canonical application
service validates it as its first operation, before identity resolution, URL
safety work, relationship confirmation, runtime support, tracking persistence,
route verification, audit or activation. A public transport cannot mint the
capability by accepting a request field.

`lib/commercial/partner-tracking-registration-service.ts` is the canonical,
transport-independent application service. It owns orchestration of persisted
identity resolution, relationship confirmation, market validation, central
legal and regulatory controls, destination normalisation and safety,
idempotent transitional tracking persistence, bounded route verification,
MarketActivation convergence, rollback and structured results.

The Commercial MCP retains authentication, OAuth scope enforcement, rate
limiting, input parsing, result mapping and operational metrics. Its tracking
tool delegates to the application service but supplies no trusted commercial
authority, so the PR2 adapter fails closed before canonical commercial
relationship, support, tracking, audit or MarketActivation writes. The public
schema has no authority, approval or decision-reference field. MCP does not
own Partner resolution, relationship authority, CRM gates, route verification
exceptions, legal decisions or activation orchestration. MCP's independent
rate-limit and request-metric controls remain transport operations. A later
transport may invoke the service only if a separately reviewed internal
boundary supplies the trusted context from real Founder provenance.

With trusted authority, a missing canonical relationship is created, an ended
relationship is reopened in the same row, and a current relationship is left
unchanged. All three dispositions still require authority for the registration
command. Creation and reopening persist the actual decision reference on the
relationship. Registration metadata, exact-market evidence, MarketActivation
source references and bounded audit record the actual decision reference plus
a technical link hash where useful; neither a URL hash nor an invented label is
Founder provenance. An unchanged relationship retains its original
confirmation evidence while the new command authority is recorded in its own
registration and audit evidence.

The existing GoldenPlay Founder-confirmed verification record is preserved in
`founder-route-verification-evidence.ts` at the application boundary. Its
exact Partner, Casino and link-hash match is not broadened. It is bounded route
verification evidence, not Partner, relationship, legal, market or CTA
authority. Its retirement awaits the later route-health simplification.

## CRM and market-support direction

Canonical registration performs no CommercialOpportunity, CommercialTask or
CommercialActivity read or write. CRM may later reference canonical Partner or
PartnerCasinoRelationship identity, but such references are optional and the
dependency direction is always CRM to canonical commercial identity.

`PartnerCasinoMarketSupport` is retained for historical and operational
evidence. New evidence rows bind to `PartnerCasinoRelationship`; its
`opportunityId` becomes nullable and historical CRM linkage uses `ON DELETE SET
NULL`. The table cannot independently create or veto a route. Explicit market
input remains effective when static or support evidence is absent; canonical
legal hard blocks still prevail.

Static partner and market matrices remain only for aliases, normalisation,
bootstrap/import convenience and bounded evidence. They are not persisted
Partner identity, cannot establish a Partner × Casino relationship, and cannot
deny an explicit command for a persisted unlisted Partner or Casino.

## Safety and public authority

RFC-014, RFC-015, RFC-017 and RFC-036 legal and GB safeguards remain hard
constraints. Trusted GEO and exact subdivision controls remain independent.
Tracking destinations remain credential-free HTTPS, private-network targets
fail closed, sensitive URLs are represented in audit only by hash, route
verification remains bounded, and `/r/{slug}` remains server controlled.

RFC-042 MarketActivation remains the transitional persisted route-intent and
route-safety source. Exact/parent/`ZZ` precedence and transitional
AffiliateProgram, AffiliateOffer, AffiliateTrackingLink and AffiliateRedirect
persistence are unchanged by this decision. No parallel CommercialRoute,
approval, eligibility or readiness state is introduced.

RFC-047 remains the sole final public action seam. Its resolver and public DTO
contract gain no CRM, MCP, Partner, relationship, market-support or Media
dependency.

## Migration and existing data

Migration `0039_commercial_core_partner_relationship` is additive. It creates
the relationship table and its unique and foreign-key constraints, adds a
nullable relationship binding to PartnerCasinoMarketSupport, makes the old CRM
opportunity binding nullable, and changes that historical foreign key to
`ON DELETE SET NULL`.

The migration creates no relationship or support rows and performs no CRM
backfill. Historical opportunities and market-support rows are not treated as
proof of Founder authority. Production migration, backfill, deployment and
activation require separate release authority.

## Supersession and compatibility

This RFC supersedes RFC-015 and RFC-027 where older wording makes CRM
opportunity state, a static current-partner inventory, Affiliate lifecycle
state, possession of a tracking URL, an authenticated invocation, MCP scope or
staff permission a prerequisite or grant for commercial writes. Their
evidence, operational-agent containment, legal and GB safeguards remain
active.

It amends RFC-038 so PartnerCasinoMarketSupport is non-authoritative evidence
bound to the canonical relationship for new writes; CasinoCountry remains a
factual market profile and MarketActivation remains transitional route intent.
RFC-042 and RFC-047 retain their stated route and public-action ownership.

## Deferred simplification

Separate Founder-authorized PRs must decide and migrate:

- exact/parent/`ZZ` route simplification and any smaller exact-route model;
- collapse of legacy AffiliateProgram, AffiliateOffer and Tracking lifecycle
  authority and fields;
- retirement of Commercial MCP after replacement transports exist;
- retirement of the GoldenPlay verification exception;
- obsolete static partner/support evidence and legacy analytics dimensions;
- explicit relationship termination plus any separate route shutdown action;
  and
- destructive schema cleanup or a verified Production backfill.

None of those changes is authorised by PR2.

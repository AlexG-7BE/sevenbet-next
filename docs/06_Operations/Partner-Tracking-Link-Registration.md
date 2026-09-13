# Partner Tracking Link Registration

**Authority:** RFC-048, RFC-027 section 21 and RFC-042
**Scope:** canonical registration for already-persisted Partner and Casino identities

## Commercial authority

An authenticated call is execution intent, not approval. Every canonical
registration requires a trusted `FOUNDER_DIRECT` or `FOUNDER_DELEGATED`
application context containing the opaque reference of the real Founder
decision. This includes an unchanged current relationship, a missing
relationship and an explicitly ended relationship.

The process-local capability can be established only inside a reviewed
application boundary. It cannot be supplied as JSON or reconstructed from a
plain object. `affiliate.manage`, `commercial:safe_write`, a staff role, CRM
state, static inventory, runtime support, possession of the URL and the URL
hash do not supply commercial authority.

The PR2 Commercial MCP adapter deliberately supplies no trusted authority and
therefore fails closed before identity resolution or any canonical commercial
relationship, support, tracking, audit or MarketActivation mutation. Its
strict public schema has no approval, authority or decision-reference field.
Independent MCP rate limiting and request metrics remain transport controls. A
future transport must obtain real Founder provenance at a trusted internal
boundary; it must not turn a public field into a capability.

## Input

Provide only:

- Partner;
- Casino;
- exact partner-provided tracking URL; and
- optional `geo` when the partner supplied an exact-GEO link; or
- optional `supportedGeos` (up to 100 exact market codes) when one generic link
  is supplied with multiple supported markets.

`geo` and `supportedGeos` are mutually exclusive. Values are uppercased,
underscores become hyphens, duplicates are removed, and newly asserted `ZZ` or
malformed/non-assigned country codes are rejected before mutation.

The retained MCP action is `commercial_register_partner_tracking_link`. It
resolves internal IDs and does not create Partner or Casino identities. In the
PR2 repository candidate it cannot mutate because MCP has no trusted authority
source.

## Behaviour

- No GEO creates or replaces the Casino default tracking route. It may serve
  all already-known seeded and runtime-supported, legally allowed exact GEO
  MarketActivations.
- A GEO persists absent support and creates or replaces only that exact market
  route. Exact-GEO tracking takes precedence over the default.
- `supportedGeos` persists each absent exact support record and registers the
  supplied generic link once. The external redirect chain is checked once;
  its bounded result is reused by RFC-042 for each eligible exact market.
- Runtime support is stored in `PartnerCasinoMarketSupport`, backed by
  `CasinoCountry.availability=AVAILABLE` and truthful
  `CasinoCountryEvidence` containing the actual Founder decision reference.
  It is not legal, regulatory or activation authority.
- Trusted registration creates a missing canonical
  `PartnerCasinoRelationship`, reopens the same row when it was explicitly
  ended, or leaves a current row unchanged. All three dispositions require the
  authority context. Creation and reopening store the actual decision
  reference; a current row retains its original confirmation evidence.
- The URL is staged inactive and checked through bounded HTTPS redirects with
  every-hop public-network validation, expected-operator-host validation and
  deterministic attribution checks.
- Existing validated affiliate records are reused without changing terms. A
  missing internal network/program normalization is created only for the
  resolved canonical relationship; a missing offer becomes a neutral
  evergreen `Visit Casino` offer with no bonus claim.
- `/r` remains the public handoff. RFC-042 remains the only controller that can
  converge an exact MarketActivation to `ACTIVE + HEALTHY`.
- `BLOCKED_BY_LAW` and `ACTION_REQUIRED_REGULATORY` remain non-active even when
  tracking is healthy.
- Identical scope registration is idempotent and may reverify. A replacement is
  promoted before the former same-scope route is retired; controller failure
  restores the prior healthy binding.
- Raw tracking values remain only in executable canonical route fields. MCP
  output, logs, metrics, CRM and audit use hashes and bounded diagnostics.
- Registration metadata, market evidence, activation source references and
  audit retain the actual decision reference. Technical link hashes remain
  technical identifiers and are never labelled as Founder provenance.

Temporary DNS, timeout or verifier-egress failures return a retriable result and
do not become `BROKEN_ROUTE`. Persistent HTTP, redirect, destination or
deterministic attribution failures do not promote the candidate.

## Trusted invocation workflow

After a reviewed internal boundary has obtained the real Founder decision,
establish the trusted context and invoke the application service with
`Partner + Casino + URL`, plus either one optional exact GEO or an optional
list of supported GEOs. A later generic replacement automatically includes
database-backed markets even when they do not exist in
`CURRENT_PARTNER_INVENTORY`. The current public MCP is not that boundary.

## Runtime extension release order

Migration `0036_partner_casino_runtime_market_support` precedes additive PR2
migration `0039_commercial_core_partner_relationship`. Verify both migration
states and 0039's no-relationship/no-support-backfill baseline, then deploy the
compatible application, verify authenticated MCP discovery, and run a
deterministic authority-denial smoke proving zero canonical commercial
mutation. Application rollback is compatible with the additive tables;
migrations are not destructively reversed. This sequence is documentation only
and does not authorise a Production migration or deployment.

## Pending review candidate — not Production

**PROPOSED, 13 September 2026:** the PR2 review candidate adds the canonical
relationship and trusted Founder-provenance boundary while retaining the fifth
MCP tool and its `supportedGeos`, durable runtime support, one-check batch
verification, per-market legal outcomes and database-backed reuse. MCP remains
discoverable but is not an authority source and must deny registration before
canonical commercial mutation. Clean PostgreSQL replay and
migration-preservation tests are required release evidence. Until merged and
released under separate authority, the Production contract and Production
schema remain the 10 September baseline below.

## Production release evidence

Released 10 September 2026 through
[PR #234](https://github.com/AlexG-7BE/sevenbet-next/pull/234), merge
`95b47beb8721900b3803163b13b66beba0ab2828`, Ready deployment
`dpl_FwaFucGtxGmrw3yocNLxQg6825t9`. No migration or backfill was required.

Live authenticated MCP discovery verified five tools and the then-live strict
three-required-plus-optional-`geo` contract. The idempotent Production
service smoke used the existing Betsson Group Affiliates × Rizk × RS exact
route and hash
`1288d3b46c980a4fccad33c57cde77ac19ec02553502def3296bd37221f085c5`.
It returned `NO_CHANGE / ALREADY_REGISTERED`, retained `rizk.rs`, the same
`ACTIVE + HEALTHY` MarketActivation and identical before/after Program, Offer,
TrackingLink, redirect and activation counts. Response, audit and deployment
log scans found no raw URL or token leakage. The previous Ready deployment
`dpl_HTY6fLMQgW6VWfgxm2enroUMXvTV` is retained as the rollback target.

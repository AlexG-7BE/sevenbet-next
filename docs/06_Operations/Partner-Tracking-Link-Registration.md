# Partner Tracking Link Registration

**Authority:** RFC-027 section 21 and RFC-042
**Scope:** current established Partner × Casino relationships only

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

The Production action is
`commercial_register_partner_tracking_link`. It resolves internal IDs and does
not create partners or casinos.

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
  `CasinoCountryEvidence` internal-workflow provenance. It is not legal,
  regulatory or activation authority.
- The URL is staged inactive and checked through bounded HTTPS redirects with
  every-hop public-network validation, expected-operator-host validation and
  deterministic attribution checks.
- Existing validated affiliate records are reused without changing terms. A
  missing internal network/program normalization is created only for the
  resolved established relationship; a missing offer becomes a neutral
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

Temporary DNS, timeout or verifier-egress failures return a retriable result and
do not become `BROKEN_ROUTE`. Persistent HTTP, redirect, destination or
deterministic attribution failures do not promote the candidate.

## Future Founder workflow

Provide `Partner + Casino + URL`, plus either one optional exact GEO or an
optional list of supported GEOs. A normal registration is a runtime data
operation and requires no repository edit, PR or deployment. A later generic
replacement automatically includes database-backed markets even when they do
not exist in `CURRENT_PARTNER_INVENTORY`.

## Runtime extension release order

Migration `0036_partner_casino_runtime_market_support` must be applied first.
Verify migration completion and the empty/no-backfill support-table baseline,
then deploy the compatible application, verify authenticated MCP discovery,
and run a deterministic non-secret registration smoke. Application rollback is
compatible with the additive table; the migration is not destructively
reversed. This sequence is documentation only and does not authorise a
Production migration or deployment.

## Pending review candidate — not Production

**PROPOSED, 11 September 2026:** the review candidate extends the existing
fifth MCP tool with `supportedGeos`, durable runtime support, one-check batch
verification, per-market legal outcomes and database-backed reuse. Clean
PostgreSQL replay and staged 0035→0036 preservation tests are required release
evidence. Until merged and released under separate authority, the Production
contract and Production schema remain the 10 September baseline below.

## Production release evidence

Released 10 September 2026 through
[PR #234](https://github.com/AlexG-7BE/sevenbet-next/pull/234), merge
`95b47beb8721900b3803163b13b66beba0ab2828`, Ready deployment
`dpl_FwaFucGtxGmrw3yocNLxQg6825t9`. No migration or backfill was required.

Live authenticated MCP discovery verified five tools and the exact strict
three-required-plus-one-optional contract above. The idempotent Production
service smoke used the existing Betsson Group Affiliates × Rizk × RS exact
route and hash
`1288d3b46c980a4fccad33c57cde77ac19ec02553502def3296bd37221f085c5`.
It returned `NO_CHANGE / ALREADY_REGISTERED`, retained `rizk.rs`, the same
`ACTIVE + HEALTHY` MarketActivation and identical before/after Program, Offer,
TrackingLink, redirect and activation counts. Response, audit and deployment
log scans found no raw URL or token leakage. The previous Ready deployment
`dpl_HTY6fLMQgW6VWfgxm2enroUMXvTV` is retained as the rollback target.

# Partner Tracking Link Registration

**Authority:** RFC-051, RFC-049, RFC-048 and RFC-042
**Scope:** internal canonical registration for persisted Partner and Casino
identities
**Transport:** none exposed after PR5

## Commercial authority

Authentication or possession of a tracking URL is execution intent, not
approval. Every registration requires a trusted `FOUNDER_DIRECT` or
`FOUNDER_DELEGATED` application context with the opaque reference of the real
Founder decision. This applies to creating, replacing or reverifying a route
and to creating, reopening or reusing a Partner relationship.

The capability is process-local and stored in a `WeakSet`. JSON, a plain
object, staff permission, CRM state, static inventory, runtime market support,
URL possession and URL hashes cannot mint it. Validation occurs before target
resolution, external checking or mutation.

PR5 exposes no HTTP, MCP or other external caller and deliberately creates no
new authority-minting boundary. `PartnerTrackingRegistrationService` remains
an internal capability until a separately reviewed caller is required.

## Input and behavior

The neutral contract accepts:

- Partner;
- Casino;
- exact partner-provided HTTPS tracking URL; and
- either optional exact `geo` or optional `supportedGeos`, never both.

Values normalize to canonical market codes; duplicates and newly asserted
`ZZ` or malformed/unassigned countries fail before mutation. Argentina and
Canada keep recognized subdivisions where canonical authority requires them.

- Omitted GEO registers a reusable Partner × Casino route for already-known
  eligible markets.
- Exact GEO changes only that canonical market.
- `supportedGeos` records non-authoritative support evidence and reuses one
  bounded external check.
- Partner/Casino resolution must be unambiguous and persisted; the service
  never invents either identity.
- A missing `PartnerCasinoRelationship` is created, an explicitly ended row is
  reopened and a current row remains unchanged. Every disposition requires
  trusted authority and records its evidence reference.
- A candidate URL is staged, checked through public-network-safe HTTPS
  redirects, expected-host and attribution controls, then converged through
  RFC-042.
- `BLOCKED_BY_LAW` and `ACTION_REQUIRED_REGULATORY` remain non-active.
- Replacements retain/restore the prior healthy binding on failure.
- No OfferCountry/TrackingCountry permission or `productionEligible` authority
  is created.
- Raw URLs remain only in executable route storage. Audit and diagnostics use
  hashes and bounded metadata.

Temporary DNS/timeout/egress failures are retriable and do not become a false
business rejection. Persistent HTTP, redirect, host or attribution failure
does not promote the candidate.

## Trusted invocation workflow

1. Obtain and record the real Founder decision in a reviewed internal
   boundary.
2. Establish the trusted capability using
   `establishTrustedCommercialWriteAuthority`.
3. Invoke `partnerTrackingRegistrationService.register` with the neutral
   contract and `auditOrigin` `INTERNAL_APPLICATION` or `INTERNAL_COMMAND`.
4. Review per-market legal/verification results and the canonical audit.
5. Verify exact MarketActivation and controlled `/r` behavior.

Do not add a central workflow DSL, generic engine or public authority field.
Any future caller needs its own threat model, permission boundary, tests and
durable decision.

## Current release state

PR #278 and migration 0039 previously made this service CRM-independent and
authority-gated in Production. PR5 does not execute it, mutate Production or
change MarketActivation semantics. Read-only PR5 evidence found 81 canonical
routes and 39 active/healthy routes with the same public runtime files as
`origin/main`.

The former Commercial MCP tool and Production smoke script are retired by
RFC-051. Historical 10 September 2026 MCP release evidence remains in the
original release records and RFC-027; it is not a current invocation
instruction.

## Verification

Run:

- `npm run commercial-core:pr5:test` for authority, URL, legal, idempotency,
  rollback, audit, public action, redirect, GB and media independence;
- `npm run commercial-research:postgres-test` against disposable CI PostgreSQL
  for neutral CRM and tracking persistence; and
- `npm run commercial-core:pr5:projection` for read-only Production state.

Never run a Production registration as a PR5 smoke. PR5 has no Production
mutation authority.

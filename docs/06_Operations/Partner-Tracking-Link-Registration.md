# Partner Tracking Link Registration

**Authority:** RFC-027 section 21 and RFC-042
**Scope:** current established Partner × Casino relationships only

## Input

Provide only:

- Partner;
- Casino;
- exact partner-provided tracking URL; and
- optional GEO only when the partner supplied an exact-GEO link.

The Production action is
`commercial_register_partner_tracking_link`. It resolves internal IDs and does
not create partners or casinos.

## Behaviour

- No GEO creates or replaces the Casino default tracking route. It may serve
  only supported, legally allowed exact GEO MarketActivations.
- A GEO creates or replaces only that exact supported market route. Exact-GEO
  tracking takes precedence over the default.
- The URL is staged inactive and checked through bounded HTTPS redirects with
  every-hop public-network validation, expected-operator-host validation and
  deterministic attribution checks.
- Existing validated AffiliateOffers are reused without changing terms. A
  missing normalization object becomes a neutral evergreen `Visit Casino`
  offer with no bonus claim.
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

Provide `Partner + Casino + URL (+ optional GEO)`. A normal registration is a
runtime data operation and requires no repository edit, PR or deployment.

# Founder global 14-casino market authority

## Status

ACCEPTED — explicit Founder decision effective 2026-09-10.

This decision is authoritative now. Implementation and Production activation
remain independently release-gated.

## Exact scope

The decision applies only to:

- Betsson Group Affiliates: Betsafe, Betsson, Inkabet, NordicBet, Rizk,
  StarCasino and SuperCasino;
- NetoPartners / Anakatech: GoldenPlay; and
- Superfly Partners / White Hat Gaming: 21 Privé, Diamond7, G'day Casino,
  Hello Casino, Skol Casino and Slotnite.

Super Partners and all other prospects are excluded.

## Authority

For every current operator-supported market in the exact scope:

- `founderCommercialAuthority = APPROVED`;
- `partnerAccountAuthority = FOUNDER_CONFIRMED_APPROVED`;
- `kycAml = FOUNDER_CONFIRMED_CLEARED`;
- `marketCommercialAuthority = APPROVED`;
- `authoritySource = FOUNDER_DIRECT_GLOBAL_MARKET_ORDER`; and
- `authorityEffectiveDate = 2026-09-10`.

An absent row in the historical 25-GEO rollout is not a denial. Current
operator support is discovered worldwide and classified as `SUPPORTED`,
`RESTRICTED` or `UNKNOWN`. Canadian and other province-specific authority must
remain subdivision-exact.

Only direct law can produce `BLOCKED_BY_LAW`. A proven mandatory licence,
registration or equivalent legal prerequisite can produce
`ACTION_REQUIRED_REGULATORY`. Uncertainty and technical limitations are not
regulatory blockers. Missing and failed partner routes are respectively
`MISSING_TRACKING_ROUTE` and `BROKEN_ROUTE`.

Generic partner tracking links may be reused across eligible supported markets;
an exact market binding wins. Unknown bonus terms use a neutral `Visit Casino`
offer and never an invented claim.

## Architecture and release boundary

[RFC-042](../06_RFC/RFC-042-Canonical-Market-Activation-Authority.md) remains
the sole Production CTA authority. The permanent partner-tracking registration
service merged through PR #234 and is the one canonical route-registration
path consumed by this rollout. [RFC-045](../06_RFC/RFC-045-Exact-Subdivision-Market-Activation.md)
adds exact subdivision identity without creating another writer. This decision
does not authorize a competing path.

No merge, deployment or Production data mutation is recorded by this decision.
Exact subnational runtime authority requires a durable additive design before
province/state activation. Technical inability to represent a subdivision must
fail closed without being relabelled as regulatory.

## Supersession

For these 14 casinos only, this decision supersedes the 2026-09-09 decision's
25-GEO universe, the use of Super Partners inside this rollout, and its
description of the repository's generic GB policy switch as an independent
regulatory approval.
The exact UKGC/MGA, operator, route and canonical activation evidence gates
remain intact; the stale internal GB deny is not law.

It does not revoke older authority that applies to Super Partners outside this
exact rollout. Historical Production evidence is preserved in the prior release
record and is not rewritten as if the worldwide rollout were already live.

# B4GAMBLE global current-partner commercial authority

## Status

ACCEPTED — Founder decision effective 2026-09-09.

## Decision

For the exact set of current established B4GAMBLE partners, the Founder records the following internal commercial authority:

- every current established partner relationship is approved;
- the current partner accounts are approved;
- KYC/AML is Founder-confirmed cleared;
- every actual partner/operator-supported market is commercially approved;
- neither a missing historical GEO row nor a missing internal commercial object is a denial;
- no new per-GEO Founder approval, partner approval, country approval, or written reconfirmation is required;
- old approval, KYC/AML, GEO, media, and contract-review workflow state is superseded as current operational authority while its historical evidence is preserved;
- there is no contract-review workstream for this rollout;
- an actual partner-provided tracking URL is sufficient tracking authority;
- one generic partner URL may serve several supported exact-GEO MarketActivations without fake duplicated partner links;
- an existing exact-GEO partner link takes precedence over a generic link for that GEO;
- AffiliateProgram, AffiliateOffer, TrackingLink, internal redirect, and MarketActivation are internal normalization objects, not additional approval gates;
- if exact bonus terms are not known, the internal offer must remain neutral and must not invent a bonus claim;
- direct law/regulation remains an independent activation gate;
- a genuinely absent or demonstrably broken underlying partner route remains an independent activation gate;
- RFC-042 MarketActivation remains the sole final Production CTA authority; and
- MEDIA-GEO3 remains retired under RFC-044 and does not participate in commercial readiness.

The canonical metadata representation is the closest existing schema equivalent of:

- `founderCommercialAuthority = APPROVED`
- `partnerAccountAuthority = FOUNDER_CONFIRMED_APPROVED`
- `kycAml = FOUNDER_CONFIRMED_CLEARED`
- `authorityDate = 2026-09-09`
- `authoritySource = FOUNDER_REPORTED_DIRECT_PARTNER_CONFIRMATION`

## Current partner scope

This authority applies only to:

1. Superfly Partners / White Hat Gaming;
2. Betsson Group Affiliates;
3. NetoPartners / Anakatech / GoldenPlay; and
4. Super Partners.

It must not mass-promote unrelated CRM prospects.

## Independent fail-closed boundaries

Every supported Partner × Casino × GEO row must resolve to exactly one of:

- `ACTIVE_HEALTHY`;
- `BLOCKED_BY_LAW`;
- `ACTION_REQUIRED_REGULATORY`;
- `BROKEN_ROUTE`; or
- `MISSING_TRACKING_ROUTE`.

Only an exact MarketActivation that the RFC-042 controller has converged to `desiredState=ACTIVE`, `status=ACTIVE`, and `routeVerificationStatus=HEALTHY` may expose a Production CTA. Exact legal and regulatory blocks remain disabled. Province-specific authority must not be replaced by a country-wide Canada activation. Locale selection never grants market authority.

## Implementation record

The deterministic machine-readable rollout matrix is `data/current-partner-global-rollout/matrix.v1.json`. The operational release record is `docs/06_Operations/Global-Current-Partner-Commercial-Rollout-2026-09-10.md`.

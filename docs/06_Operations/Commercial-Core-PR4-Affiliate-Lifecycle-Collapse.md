# Commercial Core PR4 — Affiliate Lifecycle Collapse

**Authority:** RFC-050, RFC-049, RFC-048, RFC-047 and RFC-013

**Risk:** High — public commercial routing and GB evidence evaluation

**State:** Review-only implementation; no Production mutation, merge or
deployment performed

## Before

The public route was already canonical under PR1–PR3, but two hidden seams
remained:

- `MarketActivationRuntime` independently required
  `AffiliateTrackingLink.active` and a non-archived link; and
- GB constructed a lifecycle-derived `commercialContract` from Network active,
  Program status/workflow/connection, Offer status and TrackingLink active.

The same lifecycle vocabulary also remained in an old candidate resolver,
route projection and historical writers. This allowed duplicated Affiliate
state to appear capable of vetoing or manufacturing route readiness even when
the exact canonical route expressed the Founder decision.

## After

The one runtime authority chain is:

```text
published Casino
  + exact canonical ACTIVE MarketActivation
  + coherent technical bindings
  + safe/effective destination
  + HEALTHY current route verification
  + legal/jurisdiction permission
  + factual GB evidence when applicable
  + redirect kill switch
  = one internal /r action or null
```

Affiliate entities remain useful as Partner/provider identities, terms,
destination records, evidence and history. Their generic lifecycle fields no
longer authorize or veto CTA or `/r`.

## GB factual replacement

GB does not become permissive when lifecycle state is removed. The exact
canonical route now supplies only factual Program, Offer and TrackingLink
evidence. The evaluator still requires:

- an allowed GB jurisdiction decision;
- exact Program/Casino and operator identity;
- current Partner agreement evidence explicitly covering `GB` and
  `DIRECT_LINK`;
- structured operator/brand and current official licence evidence;
- exact current UK Gambling Commission domain evidence;
- exact Offer/Casino and TrackingLink/Offer binding;
- effective Offer and TrackingLink windows;
- safe HTTPS URLs plus fresh tracking verification/health evidence;
- complete Bonus facts when a Bonus is bound; and
- a valid server-owned controlled redirect contract.

Every missing, stale, unsafe or mismatched fact remains fail-closed. The
removed Network/Program/Offer/Tracking lifecycle values can neither satisfy
nor defeat this evidence chain. Repository evidence was sufficient; there is
no `GB_LIFECYCLE_COLLAPSE_EVIDENCE_GAP` and no additive evidence field or new
status machine was introduced.

## Deprecated fields

These fields remain physically present for rollback, provider/Admin facts or
historical inspection, but are non-authoritative:

| Surface | PR4 meaning |
| --- | --- |
| `AffiliateNetwork.active`, Affiliate archive marker | Admin/history only |
| `AffiliateProgram.status`, `workflowStatus`, `domainLifecycleStatus`, archive marker | Provider/Admin/workflow facts only |
| `AffiliateProgram.connectionStatus`, account/credential metadata, `trustedAutoActivation` | Provider operations only; never route permission |
| `AffiliateOffer.status`, `domainLifecycleStatus`, archive marker | Provider/Admin facts only |
| `AffiliateTrackingLink.active`, archive marker | Provider/Admin facts only; endpoint safety is established separately |
| Offer/Tracking `geoMode`, country modes and `productionEligibility*` | RFC-049 compatibility/provider metadata only |

`AffiliateRedirectSlug.active` is not included: it remains a technical
controlled-redirect validity check. Offer/Tracking effective dates,
destination safety, exact ownership and verification timestamps also remain
authoritative technical/business evidence.

## Write-path controls

- Canonical Partner registration no longer restores or toggles Affiliate
  lifecycle/archive values on reopening, creation, promotion, supersession or
  rejection.
- The old commercial-activation bundle repository/service writer is deleted.
  `commercial:activation:apply` fails closed with
  `COMMERCIAL_ACTIVATION_LEGACY_WRITE_RETIRED_BY_PR4`; its other modes are
  read-only.
- The historical Casino Commercial Visibility seed mode fails closed with
  `CASINO_COMMERCIAL_VISIBILITY_SEED_RETIRED_BY_PR4`.
- The bounded Superfly destination repair may correct URL/evidence facts but no
  longer writes TrackingLink lifecycle state.
- Affiliate Admin/provider import may retain external or administrative values,
  but those paths have no `MarketActivation` or public action authority.

## Production read-only evidence

The projector verifies its target by a secret-safe database fingerprint and
then starts a repeatable-read transaction with database-enforced read-only
mode. It never offers an apply mode. Raw destinations are not emitted; only a
SHA-256 and already-stored final host may appear for a changed route.

Final committed-code capture:

| Evidence | Result |
| --- | --- |
| Captured at | `2026-09-13T21:06:13.286Z` |
| Code revision | `72bdff959d5ae9e2fe59d18cdc32ae61e6689b94` |
| Total MarketActivation rows | 87 |
| Canonical routes checked | 81 |
| Inactive legacy `ZZ` rows excluded | 6 |
| Active legacy `ZZ` rows | 0 |
| Unchanged current vs PR4 | 81 |
| Intended simplifications | 0 |
| Unintended regressions | 0 |
| Legal changes | 0 |
| Technical changes | 0 |
| Difference list | empty |

Detected Production distributions were:

- Network: 3 active/not archived;
- Program: 14 `ACTIVE/PUBLISHED` and not archived; six have compatibility
  lifecycle `ACTIVE`, eight have `null`;
- Offer: 14 `ACTIVE`, `geoMode=ALLOW` and not archived; six have compatibility
  lifecycle `ACTIVE`, eight have `null`;
- TrackingLink: 119 active/not archived; 111 `ALLOW`, eight `GLOBAL`;
- OfferCountry: 64 `ALLOW`, 36 `BLOCK`; and
- TrackingLinkCountry: 116 `ALLOW/productionEligible=false`, 39
  `ALLOW/true`, 36 `BLOCK/false`.

The data is converged, so PR4 changes no current route outcome. No currently
blocked legitimate route is silently activated.

## Review verification

Run under the repository-required Node 24 runtime:

```text
npm ci
npx prisma generate
npm run typecheck
npx prisma validate
npm run commercial-core:pr4:test
npm run affiliate:test
npm run comm-01:test
npm run market-activation:test
npm run ci:quality
npm run build
git diff --check
```

For an independently authorised Production read-only comparison:

```text
npm run commercial-core:pr4:projection
```

Require all counts to be present, `productionMutationPerformed=false`, every
canonical route classified `UNCHANGED` or separately reviewed
`INTENDED_SIMPLIFICATION`, and zero unintended, legal or unexplained technical
differences.

## Merge/deployment gate

PR4 remains review-only until independent review confirms:

1. no public/runtime lifecycle predicate survives;
2. GB factual evidence remains fail-closed;
3. controlled `/r`, exact GEO and CRM independence are unchanged;
4. CI and Preview are green at the reviewed head; and
5. a fresh read-only projection has no unexplained differences.

This runbook does not authorize merge, deployment or any Production write.

## Rollback

PR4 has no migration or data change. Application rollback is the previous
binary. Retained columns allow that rollback, although it would temporarily
restore the former duplicate lifecycle veto until a forward fix. The redirect
kill switch, jurisdiction denial and canonical route disable controls remain
independent containment.

## PR6 follow-up

After the rollback window, prove zero remaining legitimate consumers before
removing:

- Network/Program/Offer/Tracking lifecycle and archive columns plus their
  indexes;
- Offer/Tracking GEO compatibility tables and `productionEligibility*`;
- the legacy partner-route projection/repository/service;
- activation-bundle lifecycle planning and retired historical seed/release
  bodies; and
- Admin/DTO/test surfaces that exist only for those compatibility fields.

PR5 Commercial MCP retirement and PR6 schema/code contraction are not part of
this release.

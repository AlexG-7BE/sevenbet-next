# RFC-050 — Affiliate Lifecycle Authority Collapse

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 14 September 2026

**Implementation authority:** explicit Founder instruction `Commercial Core
PR4 — Affiliate Lifecycle Collapse`.

## Decision

The canonical exact `MarketActivation` is the sole persisted business decision
to route traffic for a Casino and commercial market. Generic lifecycle fields
on `AffiliateNetwork`, `AffiliateProgram`, `AffiliateOffer` and
`AffiliateTrackingLink` cannot grant or veto a public action or controlled
redirect.

The runtime rule is:

```text
published Casino
  + one exact canonical MarketActivation with desiredState/status ACTIVE
  + coherent Offer, TrackingLink, RedirectSlug and optional Bonus bindings
  + effective factual offer/tracking windows
  + credential-free HTTPS destinations and safe controlled slug
  + current HEALTHY route verification
  + legal/jurisdiction permission
  + factual GB evidence when countryCode = GB
  + redirect-engine kill switch
  = GovernedCommercialAction | null
```

`AffiliateNetwork.active`, `AffiliateProgram.status`,
`AffiliateProgram.workflowStatus`, `AffiliateProgram.domainLifecycleStatus`,
`AffiliateOffer.status`, `AffiliateOffer.domainLifecycleStatus`,
`AffiliateTrackingLink.active` and the corresponding Affiliate archive fields
are not members of that conjunction. Their values may remain as provider,
administrative or historical facts until PR6, but they are not commercial
permission.

`AffiliateRedirectSlug.active` is intentionally different. It is the technical
validity of the server-owned controlled `/r/...` binding, not a generic
Affiliate business lifecycle. It remains fail-closed.

## Evidence classification

The repository-wide audit used these classes:

- **A — Runtime authority:** can grant or block CTA, route, redirect or public
  commercial action;
- **B — Business fact:** external/provider information that may be retained but
  cannot decide routing;
- **C — Technical validity:** required for the selected destination to function
  safely;
- **D — Legal/regulatory evidence:** required by a jurisdiction-specific
  safeguard;
- **E — Admin/display only:** backoffice, reporting, diagnostics or an
  authenticated preview; and
- **F — Dead/legacy:** historical compatibility or retired release code.

## Complete lifecycle-authority inventory

**DETECTED:** the active repository was scanned from its confirmed root,
excluding dependencies, generated output, build artefacts and caches. The
actual consumers and PR4 dispositions are:

| Field or aggregate | Pre-PR4 consumers | Pre-PR4 class/authority | PR4 treatment |
| --- | --- | --- | --- |
| `AffiliateNetwork.active` / `archivedAt` | `MarketActivationRuntime` GB `commercialContract`; GB `/r` candidate path; `affiliate-routing/candidate-resolver`; `partner-route-projection`; Affiliate Admin repositories/UI; historical release/audit scripts | A in GB runtime and legacy candidate projection; E in Admin; F in historical scripts | Removed from canonical runtime and GB evidence. Legacy candidate projection renamed and confined to authenticated Admin preview. Admin values retained as E; schema fields deprecated and PR6 candidates. |
| `AffiliateProgram.status` | Same runtime GB aggregate; legacy candidate and partner-route projections; Affiliate Admin CRUD; provider import; media/admin inspection; historical activation scripts | A in GB runtime/legacy projection; B/E in provider/Admin; F in historical scripts | Removed from CTA, `/r`, exact route reconciliation and GB readiness. Retained only as provider/Admin fact. Hierarchical transition predicates removed. |
| `AffiliateProgram.workflowStatus` | Runtime GB aggregate; legacy candidate/partner-route projection; Admin validation/UI; historical scripts | A in GB runtime/legacy projection; E elsewhere | Removed from runtime and reconciliation. Retained for Admin workflow display and factual GB write validation only; deprecated as commercial authority. |
| `AffiliateProgram.domainLifecycleStatus` / `archivedAt` | Runtime GB aggregate; partner-route projection; Admin mapping and old writers | A in GB runtime/legacy projection; E/F elsewhere | Removed from runtime and canonical registration restore logic. Retained physically for Admin/history pending PR6. |
| `AffiliateProgram.connectionStatus`, provider account/credential presence and `trustedAutoActivation` | Old GB `commercialContract`; provider import and Admin validation | A in old GB runtime; B/E in provider/Admin | Removed from runtime. Provider connection remains operational metadata. GB automatic activation remains prohibited on writes but cannot authorize or veto an exact route. |
| `AffiliateOffer.status` | Runtime GB aggregate; legacy candidate/partner-route projection; Affiliate Admin CRUD/listing; provider import; media workflows; historical scripts | A in GB runtime/legacy projection; B/E in provider/Admin; F in historical scripts | Removed from public action, `/r`, route reconciliation and Casino-domain commercial eligibility. Retained as provider/Admin fact; transition-state machine removed. |
| `AffiliateOffer.domainLifecycleStatus` / `archivedAt` | Runtime GB aggregate; legacy projection; Admin/history | A in GB runtime/legacy projection; E/F elsewhere | Removed from runtime and canonical registration restore logic. Retained physically and deprecated pending PR6. |
| `AffiliateTrackingLink.active` / `archivedAt` | `MarketActivationRuntime`; old GB aggregate and GB `/r` candidate lookup; legacy candidate/partner-route projection; route repair; Admin CRUD; provider import; media/Admin inspection | A in CTA, `/r` and old GB runtime; B/E in Admin/provider; F in historical projection | Removed from canonical route validity, GB readiness, reconciliation fingerprint and canonical registration/promotion/supersession/rejection writes. URL safety, ownership, dates, evidence and health remain C. Admin/provider values remain informational. |
| Offer/Tracking `geoMode`, country modes and `productionEligible` | Legacy partner-route projection; provider/Admin display/import; historical materialization/audit | A before RFC-049; B/E/F after RFC-049 | PR4 preserves RFC-049: absent from canonical runtime and writes. Retained as non-authoritative compatibility/provider data pending PR6. |
| Offer `startAt` / `expiresAt` | GB readiness, legacy projection and provider/Admin facts | B/D and C at selection time | Kept as a genuine effective business window. It can block the selected exact route independently of generic `status`. |
| Tracking URL, Offer ownership, `validFrom` / `expiresAt`, `verifiedAt` / `lastCheckedAt` | Canonical runtime, GB readiness, route verifier and controlled redirect | C, plus D evidence in GB | Kept fail-closed. These facts establish endpoint safety, binding, freshness and effective time; they are not a replacement lifecycle. |
| `AffiliateRedirectSlug.active` / `archivedAt`, ownership and slug | Canonical runtime and controlled `/r` | C | Kept fail-closed as the technical server-owned redirect contract. |
| `gbCommercialAuthority` agreement metadata | GB readiness and Admin validation | D/B | Kept. Exact `GB`, `DIRECT_LINK`, identity, effective/expiry and review-freshness evidence remains required. |
| Structured operator/brand/licence and exact official domain evidence | GB operator and commercial readiness | D | Kept fail-closed with exact identity/relationship and freshness checks. |
| `CasinoBonus` publication/effectivity/terms evidence | GB readiness only when the exact route binds a Bonus | D/C | Kept. This is editorial/legal promotion evidence, not Affiliate lifecycle. |
| CRM opportunity/stage and Commercial MCP | CRM/Admin workflow and transport | B/E | No runtime consumer. Remain non-authoritative under RFC-048; MCP retirement stays PR5. |
| `partner-route-projection`, activation-bundle planner, old catalog/release writers | migration shadowing, authenticated preview, tests and release history | F, with E for authenticated preview | Not public authority. Mutation entry points are retired; physical deletion is deferred to PR6 after the rollback window. |

No surviving A-class consumer reads generic Affiliate lifecycle state.

## Minimal field semantics

| Field | Durable disposition |
| --- | --- |
| `AffiliateNetwork.active` | **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DEPRECATE**, **DELETE LATER IN PR6**. Partner identity/relationship survives separately. |
| `AffiliateProgram.status` | **KEEP AS PROVIDER/ADMIN FACT**, **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DELETE OR NARROW IN PR6**. |
| `AffiliateProgram.workflowStatus` | **KEEP AS ADMIN DISPLAY**, **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DELETE OR NARROW IN PR6**. |
| Program/Offer lifecycle and archive compatibility fields | **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DEPRECATE**, **DELETE LATER IN PR6**. |
| `AffiliateOffer.status` | **KEEP AS PROVIDER/ADMIN FACT**, **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DELETE OR NARROW IN PR6**. |
| `AffiliateTrackingLink.active` | **DE-AUTHORIZE**, **REMOVE FROM RUNTIME**, **DEPRECATE**, **DELETE LATER IN PR6**. Technical endpoint evidence survives. |
| Offer/Tracking GEO compatibility columns | Continue RFC-049 **DE-AUTHORIZE** and **DELETE LATER IN PR6**. |
| Offer/Tracking effective dates and verification timestamps | **KEEP AS FACT** and **KEEP AS TECHNICAL/GB EVIDENCE**. |
| controlled RedirectSlug state | **KEEP AS TECHNICAL VALIDITY**. |

## GB safeguard

The old runtime formed a `commercialContract` approximation from Network,
Program, Offer and Tracking lifecycle fields. That aggregate could deny a GB
route, but its positive result did not prove a real agreement, operator,
licence, exact domain or safe current destination.

PR4 deletes the aggregate and evaluates the exact route through one factual
`GbCommercialRouteEvidence` contract. GB remains a strict conjunction of:

1. GB jurisdiction commercial/referral permission, including only the existing
   per-Casino Founder scope defined by its governing authority;
2. exact Program-to-Casino and Program-operator-to-structured-operator
   identity;
3. current `gbCommercialAuthority` agreement evidence for `GB` and
   `DIRECT_LINK`, including effective/expiry and 90-day review controls;
4. structured Operator/Brand/Casino relationships;
5. current official UK Gambling Commission licence evidence and exact
   regulator-domain evidence;
6. exact Offer-to-Casino and TrackingLink-to-Offer bindings;
7. current Offer/Tracking effective dates;
8. credential-free HTTPS destination and tracking URLs, fresh `verifiedAt` and
   `lastCheckedAt`, and route health;
9. complete current Bonus terms evidence when a Bonus is bound; and
10. the active, safe, server-owned controlled redirect contract.

Missing or failed evidence remains fail-closed. Tests vary every removed
lifecycle value while holding this evidence constant and prove the GB decision
does not change; they separately prove that missing agreement, operator,
licence/domain, tracking freshness, unsafe URL, bonus evidence or redirect
contract still denies. There is no `GB_LIFECYCLE_COLLAPSE_EVIDENCE_GAP`.

## Write-path decision

The canonical `PartnerTrackingRegistrationRepository` no longer restores or
toggles Affiliate lifecycle/archive fields during relationship reopening,
candidate creation, promotion, supersession or rejection. New unavoidable
Program/Offer schema values therefore remain neutral Prisma defaults; route
permission is written only through the canonical activation controller.

The legacy commercial-activation bundle writer was deleted from its service
and repository. Its `apply` CLI now fails with
`COMMERCIAL_ACTIVATION_LEGACY_WRITE_RETIRED_BY_PR4`; validate, preview and
verify remain read-only historical inspection. The old Casino Commercial
Visibility seed entry point is also retired. The bounded Superfly destination
repair can update URL/evidence facts but no longer changes
`AffiliateTrackingLink.active` or `archivedAt`.

Affiliate Admin and provider-import paths may still store lifecycle-looking
values as external or backoffice facts. They cannot write or infer
`MarketActivation` and cannot influence public action resolution. Automatic
hierarchical state-transition predicates—active Offer requiring active Program
and active Program requiring active Network—were removed.

## Schema and migration

PR4 has no migration and performs no data backfill. Prisma comments mark the
legacy fields non-authoritative. Physical columns remain to preserve rollback
compatibility and avoid a destructive schema contraction in the authority
collapse PR.

## Production semantic projection

**DETECTED, READ ONLY:** at `2026-09-13T21:14:41.645Z`, committed code
`0f9578305d801d1e7dd4f63ac8ec1f26290ed450` ran against the trusted Production
target inside a repeatable-read transaction after `SET TRANSACTION READ ONLY`.
It found 87 `MarketActivation` rows: 81 canonical non-`ZZ` routes and six
inactive legacy `ZZ` rows. Every canonical route had identical current/PR4
public action, redirect destination hash/final host, legal outcome, GB outcome
and health outcome.

| Projection result | Count |
| --- | ---: |
| canonical routes checked | 81 |
| unchanged | 81 |
| intended simplifications | 0 |
| unintended regressions | 0 |
| legal changes | 0 |
| technical changes | 0 |
| explicit differences | 0 |

Current data is converged—every Network, Program, Offer and TrackingLink uses
its former active value—so de-authorizing those values changes no current
route. This is parity evidence, not permission to mutate or deploy.

## Supersession and compatibility

RFC-050 supersedes RFC-015 sections 1, 6, 7 and 9 only where they treat
generic Affiliate lifecycle, connection or country-projection values as GB
runtime authority. RFC-015's factual agreement, operator, licence, domain,
tracking-evidence, Bonus, privacy and fail-closed obligations remain active.

RFC-050 completes the lifecycle scope deferred by RFC-049. It does not change
RFC-047's single public action seam, RFC-048's CRM-independent write boundary,
RFC-049's exact-GEO semantics, controlled `/r`, CRM, editorial Casino
publication or Commercial MCP transport.

## PR6 deletion candidates

After the rollback window and a fresh consumer proof, PR6 may remove or narrow:

- `AffiliateNetwork.active` and redundant Affiliate archive fields;
- `AffiliateProgram.status`, `workflowStatus`, `domainLifecycleStatus` and
  obsolete lifecycle indexes;
- `AffiliateOffer.status`, `domainLifecycleStatus` and obsolete lifecycle
  indexes;
- `AffiliateTrackingLink.active` and active-based indexes;
- `AffiliateOffer.geoMode`, `AffiliateTrackingLink.geoMode`,
  `AffiliateOfferCountry`, `AffiliateTrackingLinkCountry` and all
  `productionEligibility*` columns, subject to preserving any proven provider
  facts in a narrower representation;
- `affiliate-routing/partner-route-projection.ts` and its repository/service;
- the activation-bundle desired-lifecycle planner and historical release
  writers now blocked from mutation; and
- compatibility DTO fields, Admin badges and tests that exist only for those
  columns.

PR5 MCP retirement and PR6 physical cleanup are explicitly outside PR4.

# RFC-042 — Canonical Market Activation Authority

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 7 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE
CANONICAL MARKET ACTIVATION MIGRATION — FOUNDER EXECUTION AUTHORIZATION`,
SHA-256 `9601a2a66f0a566a1a08758fff303fe63133a9ab3e192df9a4d33f85cc9f25b8`.

## Decision

`MarketActivation` is the only B4GAMBLE-owned Production commercial authority
for one exact `Casino × GEO × Product`. Facts remain distributed in their
proper domains, but public runtime no longer reconstructs final authority from
CRM stage, activation packets, workflow state, offer state, Media Operations,
or an independently writable `productionEligible` value.

The initial product is `CASINO`. The database admits exactly one canonical row
for `(casinoId, countryCode, product)`. Exact-market activation never implies a
global or neighbouring-market activation.

One narrow migration-compatibility scope preserves six pre-existing routes
whose Founder evidence explicitly established `CASINO-COMMERCIAL-VISIBILITY-03`
global-default authority. Such a row uses the ISO private-use sentinel `ZZ`,
has no factual `CasinoCountry`, and stores its normalized denied-country scope
on `MarketActivation`. It may be established only by Founder, backfill or
reconciler origin after validating the complete programme/link evidence and
global GEO shape. It is not a response to a country-specific activation intent
and is not a general global-activation API.

For every real request GEO, any exact row for the Casino takes precedence over
the `ZZ` fallback, including an exact `PREPARING`, `BLOCKED_EXTERNAL` or
`DISABLED` row. The fallback is considered only where no exact row exists and
never applies to a country in its canonical deny scope. `ZZ` itself is not a
request GEO.

This decision changes internal commercial authority only. Trusted request-GEO
resolution, explicit jurisdiction prohibition, GB operator/legal controls,
safe-URL and network protections, Programme/commercial data separation, and
protected Help behaviour remain independent external or safety constraints.

## Canonical state

Intent and result are separate:

- `desiredState`: `ACTIVE | DISABLED`;
- `status`: `DRAFT | PREPARING | ACTIVE | BLOCKED_EXTERNAL | DISABLED`.

`PREPARING` means internal convergence is incomplete. It is resumable and is
not a final external denial. `BLOCKED_EXTERNAL` is reserved for a concrete
fact outside B4GAMBLE's ability to manufacture: contradicted or prohibited
runtime-critical market evidence, absent evidenced destination, expired
upstream offer/link, unsafe external URL, explicit partner-country block, or
failed current route verification with no usable alternative. Contradictions
limited to editorial enrichment such as licence transcription or incomplete
bonus mechanics remain visible evidence; they do not disable an otherwise
working Casino path.

Internal workflow, CRM, publication, projection and compatibility state does
not become `BLOCKED_EXTERNAL`. Evidence-backed market ingestion and public
publication remain their existing controlled operations; an activation waits
in `PREPARING` rather than inventing unknown licences, offer terms, URLs or
media.

An exact `ACTIVE` row binds the exact market profile, affiliate offer, primary
tracking link and internal redirect route. A compatibility `ZZ` row binds the
same commercial objects, keeps `marketProfileId` null, and carries the
controller-normalized denied-country scope. Both record a deterministic
reconciliation fingerprint, current healthy route verification, version,
actor, source references, timestamps and structured diagnostics. An immutable
intent/event history records accepted intent, preparation, reconciliation,
activation, disabling, external blocking and same-state no-ops.

## Controller and route verification

`MarketActivationController` is the only application service that establishes
canonical activation. Its high-level `launchCasinoMarket` /
`activateCasinoInGeo` operation accepts Casino identity, GEO, optional exact
offer/route/link references, desired state, actor/origin, evidence references
and an idempotency key.

The controller runs deterministic reconciliation in a Serializable database
transaction. It repairs safe internal compatibility state, retains revisions
before material offer/link/redirect changes, and persists `PREPARING` before
network work. It then performs bounded route verification outside the
transaction. Only a healthy, expected final route can finalize `ACTIVE` and
project legacy eligibility. A completed check that establishes external route
failure persists its normalized status, reason, final host when present, check
time and an external blocker. A verifier execution/infrastructure failure does
not fabricate external evidence: it leaves new work `PREPARING` or preserves
an already canonical `ACTIVE` state for retry. Raw destinations are not placed
in diagnostics or events.

When more than one evidenced link exists, the controller deterministically
prefers an exact-country Direct-Link record whose observed destination belongs
to the bound market profile, then the market's default-language record. A
higher-priority record explicitly sourced for another country is ineligible;
historical compatibility rows cannot create cross-GEO selection. Verification
derives its expected terminal host from explicit route-health evidence or the
bound market profile and classifies an unexpected destination before any CDN
challenge classification can obscure it.

Reconciliation preserves the governed Casino, GEO, product, redirect and offer
identity but re-evaluates the primary tracking candidate. A previously selected
link is historical state, not an explicit Founder pin, and cannot prevent a
newer exact-market candidate from replacing it.

For a `ZZ` compatibility backfill, the controller accepts only an existing
global-default route with an empty programme country allow-list, `GLOBAL` or
deny-list offer/link GEO modes, complete Founder authority/evidence hashes and
the required historic deny set. It normalizes that policy into
`MarketActivation.globalFallbackBlockedCountries`; runtime does not reread the
legacy metadata as an independent authority.

Duplicate keys replay the original intent. A reused key with a different
payload is rejected. Optimistic versions, exact unique constraints,
Serializable transactions and bounded conflict retries prevent duplicate
canonical rows and lost updates. A new same-state intent records audit history
but does not rewrite canonical state. A stale fingerprint or compatibility
drift causes only the required reconciliation and re-verification.

## Runtime readers

Public Casino pages, directory CTAs, public offer action projections,
commercial media action bindings and `/r/{slug}` resolve an exact active
`MarketActivation` plus its bound objects, or the explicit `ZZ` compatibility
row only when no exact row exists and the real request country is outside its
canonical deny scope. Runtime validates relational shape and credential-free
HTTPS safety, but does not rerun legacy commercial governance or reread the
global-evidence metadata.

The redirect resolver still applies trusted GEO and jurisdiction controls. GB
also retains the cumulative operator/legal safety chain required by RFC-014,
RFC-015, RFC-017 and RFC-036. These are not CRM or workflow vetoes and are not
weakened by this RFC.

No activation cache is introduced in the initial cutover. Reads go to the
canonical row so disable/block transitions cannot be hidden by a second stale
authority. Any future cache must use exact Casino/GEO/Product keys and explicit
transition invalidation.

## Compatibility and legacy ownership

Legacy data is preserved. Its post-cutover role is one-way:

| Mechanism | Durable role |
| --- | --- |
| Commercial CRM stage | source fact and audit history |
| activation packets / readiness | source fact and audit history |
| programme / offer workflow | controller-maintained compatibility projection |
| `AffiliateTrackingLinkCountry.productionEligible` | deprecated stored compatibility projection |
| PartnerRoute projection | migration/shadow/health input; bound route dependency |
| Founder global-default metadata | one-time/reconciliation input for the bounded `ZZ` compatibility rows; never a direct runtime gate |
| public Casino/offer projections | editorial/read-model input, never final authority |
| Media Operations | creative provenance and assignment input, never commercial authority |

The allowed synchronization direction is `MarketActivation → compatibility`.
Legacy state may be inspected by backfill, diagnostics and shadow comparison,
but cannot directly turn canonical `ACTIVE` off or create canonical `ACTIVE`.

## Migration and cutover

Migration `0031_market_activation_v2` is additive. It creates the canonical,
intent and event tables plus enums, checks, foreign keys and exact unique
indexes. It drops or rewrites no legacy data.

Migration `0032_market_activation_global_fallback` adds the canonical fallback
deny scope and adjusts only the active-binding check so an active `ZZ` row may
omit a market profile. Database checks require exact rows to keep the fallback
scope empty, require `ZZ` rows to omit a factual market profile, and require
every active fallback to contain the full historic `DK/ES/FI/NO/CL/SE/GB`
deny set. The migration performs no data rewrite and drops no table or column.

The guarded release executor:

1. proves environment, Vercel project/team, database fingerprint/resource and
   repository SHA;
2. applies the exact migration once;
3. snapshots currently working legacy exact-market routes and the exact six
   reviewed global-default routes, then backfills them;
4. applies the Founder golden desired states;
5. runs legacy/canonical shadow comparison for every persisted exact profile
   plus the six global fallbacks under KZ, and refuses mismatches;
6. reconciles every canonical row idempotently; and
7. verifies bindings, healthy route checks, exact-market media and the Betsson
   Chile negative invariant.

The Founder golden states are Inkabet PE, Betsson PE, Betsafe EE and Betsafe LV
`ACTIVE`; Betsson CL is `DISABLED`.

## Rollback and recovery

The database migration is additive and remains useful after application
rollback. Application rollback returns public readers to the prior legacy
projection; therefore the controller maintains compatible programme, offer,
route and `productionEligible` state. Canonical rows, intents, events and route
verification evidence are retained and are not deleted during rollback.

If release verification fails before runtime cutover, do not deploy the new
reader. If it fails after cutover, roll the application back to the last Ready
deployment, preserve all canonical evidence, set affected desired states to
`DISABLED` when external safety requires immediate containment, correct the
cause through the controller, re-run shadow/reconciliation, and cut over only
after all exact-market checks pass. No destructive migration rollback or
`prisma migrate reset` is authorized.

## Privacy and Programme boundary

Activation data contains commercial entity state and aggregate operational
diagnostics only. It does not consume visitor identity, Programme progress,
pause, reflection, voice, sensitive-input or Help data. Activation and Media
data cannot be used for Programme targeting or commercial personalization.

## Supersession

This RFC supersedes older internal language only where it gave final
Production commercial authority to a distributed CRM/workflow/readiness/
`productionEligible` aggregation. RFC-038 remains authoritative for factual
Casino-market grain and provenance. RFC-039 remains authoritative for trusted
request market and editorial/commercial separation. RFC-040 and RFC-041 remain
authoritative for Media ownership and rendering. External safety decisions in
RFC-014, RFC-015, RFC-017 and RFC-036 remain active.

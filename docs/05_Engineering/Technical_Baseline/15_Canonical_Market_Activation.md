# Canonical Market Activation Technical Baseline

**Evidence date:** 8 September 2026
**Scope:** active repository rooted at
`/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` and release candidate
`codex/market-activation-bootstrap-authority-repair-20260907`
**Authority:** RFC-042 and the explicit Founder execution authorization

This baseline was produced after scanning the active repository while
excluding dependencies, generated build output, caches and
`tsconfig.tsbuildinfo`. It contains no secret value or raw affiliate
destination.

## Before the cutover

**DETECTED:** public commercial authority was distributed. The logical
`PartnerRoute` projection aggregated programme status/workflow, offer state,
tracking-link state and age, country `productionEligible`, redirect state and
global evidence. Public Casino, offer and redirect services consumed variants
of that decision.

**DETECTED:** CRM opportunities, activation packets, factual
`CasinoCountry`, offers, tracking links, public Casino versions, typed media
assignments and hosted-media assignments were separate durable stores. They
remain valuable evidence or execution dependencies.

**CONTRADICTION:** Inkabet PE, Betsson PE and Betsafe EE/LV had evidenced
routes and deployed media but draft legacy workflow/offer state and false
country eligibility. The distributed aggregation therefore kept the desired
commercial paths unavailable.

## Authority inventory and migration destination

| Model / mechanism | Relevant field or result | Current writer(s) | Reader(s) before cutover | Former runtime authority | Post-cutover destination |
| --- | --- | --- | --- | --- | --- |
| `Casino` / `CasinoVersion` | editorial status and immutable snapshot | Casino Admin/publication services | public Casino repositories | duplicated with commercial visibility | editorial/public projection input only |
| `CasinoCountry` | availability and sourced local facts | evidence ingestion and Admin | public market projection, old PartnerRoute | factual prohibition could affect route | bound factual input; explicit external facts remain valid |
| `CommercialOpportunity` | CRM stage | Commercial Ops / bounded MCP | Admin and operational reports | indirect readiness input | CRM input and audit-only for public runtime |
| `CommercialActivationPacket` | packet status/readiness JSON | Commercial Ops / agent operations | Admin and release tooling | indirect readiness input | preserved audit/source input |
| `AffiliateProgram` / `AffiliateOffer` | status and workflow | affiliate Admin/import and activation bundle | candidate resolver and PartnerRoute | yes, duplicated | controller-maintained compatibility plus offer facts |
| `AffiliateTrackingLinkCountry` | `productionEligible` and evidence | legacy activation/release writers | PartnerRoute, offer and redirect paths | yes, independently persisted | deprecated one-way compatibility projection |
| PartnerRoute projection | computed `productionEligible` and selected route | pure projection over affiliate graph | public Casino/offer/redirect and health | primary aggregate authority | bound route dependency; backfill/shadow/diagnostic adapter |
| `CasinoVersion` public route projection | CTA/media route | publication snapshot builder | public Casino and offer mappers | duplicated visibility | editorial read model populated from canonical active routes |
| Media Operations assignments | creative/placement eligibility | Media Admin/MCP and publication | public media resolver | media could indirectly suppress actions | media provenance/selection input only |
| `MarketActivation` | desired state, canonical status, exact bindings and bounded fallback scope | activation controller only | canonical public runtime and diagnostics | no predecessor row | sole B4GAMBLE Production commercial authority |

**DETECTED:** direct repository searches found no public runtime reader of CRM
stage or activation-packet state after the candidate cutover. Legacy
`productionEligible` and the full PartnerRoute calculation remain referenced
by migration, compatibility, Admin and health code, not by the canonical
public Casino or redirect decision.

## Release-candidate implementation

**DETECTED:** migration `0031_market_activation_v2` adds
`MarketActivation`, `MarketActivationIntent` and `MarketActivationEvent`.
Exact `(casinoId, countryCode, product)`, route/GEO and primary-link/GEO
uniqueness plus state, binding, blocker, fingerprint and event-sequence checks
are database-enforced.

**DETECTED on the correction candidate:** migration
`0032_market_activation_global_fallback` adds the canonical
`globalFallbackBlockedCountries` scope and permits an active `ZZ` private-use
fallback row to omit a factual market profile. Database checks require exact
rows to keep that scope empty and every active fallback to contain the full
historical `DK/ES/FI/NO/CL/SE/GB` deny set. The migration replaces one check
constraint, adds one check constraint and one column, and performs no data DML
or table/column deletion.

**DETECTED:** `MarketActivationController` and
`MarketActivationRepository` implement explicit desired state, deterministic
fingerprints, Serializable transactions, optimistic versions, bounded
write-conflict retry, idempotency-key collision protection, same-state no-op
handling, structured diagnostics and immutable events.

**DETECTED:** bounded HTTP route verification is separated from the database
transaction. Its normalized status, check time, final host and reason persist
on the activation; only `HEALTHY` finalizes `ACTIVE`. Internal verifier
execution failure is retried once and is not converted into an external
blocker.

**DETECTED on the route-verification repair candidate:** a `ZZ` compatibility
route derives its expected operator host from the canonical Casino website or
domain when no explicit route-health expectation exists. It does not treat the
affiliate tracker host as the expected terminal operator. A completed HTTP
response or redirect-chain failure remains external evidence; a transport-only
`NETWORK_ERROR` or `TIMEOUT` with no response is inconclusive, is retried and
leaves reconciliation resumable in `PREPARING` rather than manufacturing a
`BLOCKED_EXTERNAL` result.

**DETECTED on the correction candidate:** the controller can preserve only an
existing route with complete `CASINO-COMMERCIAL-VISIBILITY-03` global-default
evidence, an empty programme country allow-list and `GLOBAL`/deny-list offer
and tracking GEO shape. It normalizes the full deny scope onto the canonical
row. Only Founder, backfill and reconciler origins can address `ZZ`; normal
country-specific activation remains exact.

**DETECTED:** exact-country Direct-Link selection rejects a source record
explicitly classified for another country even when an older compatibility
row gives it higher priority. Among exact-country candidates it prefers a
market-matching observed destination and the default-language record.
Verification derives the expected host from explicit health evidence or the
bound `CasinoCountry` domain and classifies unexpected destinations before
CDN challenges. Market-profile contradictions block activation only when they
concern runtime-critical identity/GEO/domain fields; licence and incomplete
bonus-term contradictions remain preserved enrichment evidence. Public
presentation uses the same boundary to explain informational state only when
no canonical route exists; a governed canonical route is the final CTA result.

**DETECTED:** the release reconciler does not replay the stored tracking-link
binding as an explicit intent. Each reconciliation re-runs exact-market
candidate selection while retaining the governed redirect and offer identity.

**DETECTED on the bootstrap-authority repair candidate:** reconciliation uses
a one-time V3 payload epoch for compatibility-state repair. The new epoch is
required because canonical versions can remain unchanged when only a legacy
compatibility projection drifts, while the earlier V2 idempotency key may
already have been consumed. Route, offer and GEO selection semantics remain
canonical and unchanged.

**DETECTED:** public Casino/offer route projection and `/r` use
`MarketActivationRuntime`. Exact active bindings are revalidated for entity
shape and credential-free HTTPS safety. No legacy CRM, activation packet,
workflow or `productionEligible` read can independently disable canonical
`ACTIVE`; after resolving canonical state, `/r` does not call the legacy
PartnerRoute eligibility service.

**DETECTED on the correction candidate:** runtime checks an exact row first;
the existence of any exact row, including `PREPARING`, `BLOCKED_EXTERNAL` or
`DISABLED`, shadows a fallback. Only when no exact row exists may it read an
active/healthy `ZZ` row and its canonical deny scope. `ZZ` is rejected as a
request GEO. Runtime does not reread Founder global metadata, programme
country scope, offer GEO or tracking GEO as a second authority.

**DETECTED:** `PartnerRouteService.isProductionEligible` is a compatibility
adapter to canonical state. The old full `resolve` calculation remains for
bounded backfill, shadow comparison and route-health diagnostics. The old
commercial bundle prepares its legacy graph and then invokes the canonical
controller.

**DETECTED:** Media Operations inventory and publication snapshots remain
unchanged. Creative-specific hosted routes bind through the published creative
fingerprint after canonical Casino/GEO activation rather than requiring the
creative tracking link to equal the activation's primary tracking link.

**DETECTED:** no activation-result cache was added. Exact database reads own
the initial runtime cutover.

**DETECTED on the bootstrap-authority repair candidate:** the historical
media-first Production build bootstrap is create-only for every existing
network, Casino, SEO, market, programme, offer, offer-country, tracking,
tracking-country and redirect row. It may create missing historical substrate,
but no longer overwrites facts or compatibility state owned by
`MarketActivation` reconciliation. A release regression test requires every
upsert in that bootstrap boundary to retain an empty update arm.

## Production correction execution and recovery

**DETECTED:** PR #189 merged as
`bd0e61e6ffa7d704ec187f0d0555c4ebddb5eb83`. Exact Production deployment
`dpl_7ToMqX8P5eax1vA5gKqGQWB4ZS3L` reached `READY`. Additive migration
`0032_market_activation_global_fallback` was applied exactly once to the
fingerprinted Production database with checksum
`a00e3c05b48acf642134492308c8163f5345e40cb7ddf259e8b6ac520cf1940d`.

**DETECTED:** the guarded backfill created the exact six `ZZ` rows and brought
the canonical inventory to 11 rows with no duplicate identity. The external
verification step then classified five rows `BROKEN / NETWORK_ERROR` and one
row `CROSS_GEO`. The latter used the Superfly tracking host as its expected
terminal host even though the observed Diamond7 host matched the governed
canonical Casino host. The five transport failures had no HTTP response and
could not distinguish verifier egress from upstream failure. Treating either
outcome as final external evidence was an internal implementation defect.

**DETECTED:** the first rollback target,
`dpl_7eQSawYJXWBAZt95ULsbp8QjoZ9L`, was Ready but still contained the
exact-only canonical reader. A B4-only, non-following smoke exposed that the
six routes remained internally unavailable, so it was not accepted as the
recovery target. Production aliases were then rolled back to the exact Ready
pre-cutover deployment `dpl_B2ZEbKsgGELnGKWJy6JYvK7VKGkM`, source commit
`7c8e62ad0163e61cd011ac350ed77ac445b06353`. All six public Casino pages
returned 200 with their CTA present, and all six non-following `/r` responses
returned 302 with Location checksums matching the governed campaigns. No
partner destination was contacted during that smoke. The additive schema, 11
canonical rows, intents, events and route-check evidence were preserved; no
destructive database rollback or evidence deletion occurred.

**DETECTED:** after explicit Founder authorization for exactly the six stored
campaigns, a bounded direct diagnostic first confirmed that all six Superfly
tracker responses redirected to the intended governed operator host. The
Diamond7 terminal returned HTTP 200 from the local Kazakhstan egress path; the
other five terminal TLS handshakes timed out after public DNS resolution and
were therefore retained as transport-inconclusive evidence rather than
misclassified as upstream failures.

**DETECTED:** an isolated, non-aliased Production-environment deployment of the
repair candidate then repeated exactly one direct chain for each of the same
six governed campaigns from the Vercel IAD runtime. The diagnostic verified the
fingerprinted Production database, exact `ZZ` row, intended redirect slug,
canonical operator host and stored campaign checksum before each request. All
six checks returned one Superfly redirect to the intended operator and an HTTP
200 terminal response on that operator; no route crossed into another governed
market. The nonce-protected diagnostic returned only redacted host/status data,
was never committed, and its temporary deployment was removed. Production
aliases remained on the restored safe deployment throughout. No registration,
deposit, wager, purchase, conversion or other downstream action was performed.

**DETECTED:** PR #190 merged as
`54059d27a67f6a92247f5e883d63d8f5b9a32b7f`. Exact deployment
`dpl_33s4di3cCkqAYctbEnJMc6RDFpUq` reached `READY`, its source revision was
verified, and it was promoted to Production. All six migrated Casino pages
returned HTTP 200 with their canonical CTA. Each public `/r` response returned
HTTP 302 and its redacted destination checksum matched the governed campaign.
A final IAD verification beginning at each live B4GAMBLE route confirmed six
of six complete chains: one B4GAMBLE redirect, one Superfly redirect to the
intended operator, and an HTTP 200 terminal response, with no cross-market
destination.

**DETECTED:** post-cutover projection checks matched the governed active sets:
the six explicit global fallbacks in KZ, Betsson in PE in addition to those
fallbacks, Betsafe in EE and LV in addition to those fallbacks, and no canonical
commercial action in CL or GB. Inkabet PE remained correctly unavailable under
its external challenge. Bonus actions did not leak inactive markets, GB policy
remained closed, and the exact disabled Betsson CL row shadowed global fallback.

**DETECTED:** a later Production build exposed a second legacy writer in
`bga-media-first-casino-bootstrap-01.ts`. Its existing-row upsert arms reset the
shared Betsafe programme and offer to `DRAFT`, producing two legacy-shadow
mismatches (`41/43`) while the canonical runtime and public routes remained
correct. The same writer had reset Inkabet compatibility state. This was an
internal build-time authority defect, not a canonical data loss or partner
failure.

**DETECTED on PR #191:** the build bootstrap is now create-only and the V3
reconciliation epoch is covered by regression tests. Agent Core, Quality,
Database / Migration Verification, Build / Browser, Vercel Preview and Preview
Comments all passed. The disposable PostgreSQL job includes migration and
concurrency coverage; the browser job completed the full release suite.

**DETECTED in the bounded Production proof:** multiple non-aliased
Production-environment builds of the correction left the pre-repair database
snapshot unchanged, proving the fixed bootstrap does not mutate existing rows.
A nonce-protected, three-row allow-listed endpoint then reconciled Betsafe EE,
Betsafe LV and Inkabet PE through the canonical controller. Betsafe EE/LV are
`ACTIVE / HEALTHY` with active/published compatibility state. Inkabet PE has
active/published internal programme and offer state but remains
`BLOCKED_EXTERNAL / EXTERNAL_CHALLENGE`; its legacy eligibility is correctly
false. The resulting shadow is `43/43` (37 exact plus six fallback), with zero
mismatches. The endpoint and all of its non-aliased deployments were removed,
and Production aliases remained on the verified PR #190 deployment during the
proof.

## Classified release state

**DETECTED:** local unit/type/regression checks and the full 31-migration
staged harness pass. A disposable PostgreSQL integration proves concurrent
commands converge to one activation, duplicate intent is idempotent, same-state
reconciliation does not bump canonical version, compatibility drift is
repaired, internal preparation stays `PREPARING`, and the exact CL negative
state does not leak into PE.

**DETECTED after the initial Production cutover:** the exact-profile shadow
was `37/37` matched, but a separate KZ audit found six previously working
Founder-evidenced global-default routes with no canonical row: 21 Prive, Skol
Casino, Slotnite, GDay Casino, Hello Casino and Diamond7. Certification was
held because this was an internal migration regression, not an external
blocker.

**DETECTED on the correction candidate:** unit and disposable PostgreSQL
coverage proves canonical policy derivation, exact-row precedence, `ZZ`
request rejection, KZ fallback resolution, CL/GB denial, legacy metadata
non-authority and exact timestamp parity for the one-way
`productionEligible` projection. Migration `0032` applies successfully on the
existing disposable 0031 database, and the repository's full staged harness
applies all 32 migrations to an empty disposable database with replay
idempotency.

**DETECTED:** the final canonical inventory before the bootstrap-authority
merge contains 11 unique Casino × GEO × Product rows with no duplicate
identity: nine `ACTIVE / HEALTHY`, one Inkabet PE
`BLOCKED_EXTERNAL / EXTERNAL_CHALLENGE`, and one Betsson CL `DISABLED`.
Migrations `0031_market_activation_v2` and
`0032_market_activation_global_fallback` are each complete exactly once with
their repository checksums. The canonical application read path is already
live; PR #191 is the bounded repair preventing future Production builds from
rewriting its compatibility projection.

**DETECTED:** current external terminal behavior for all six affiliate-bearing
campaigns is healthy from the intended Production runtime. Full tracking URLs,
query strings and identifiers were neither emitted nor retained in diagnostic
output.

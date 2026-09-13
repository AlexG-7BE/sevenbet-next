# Demo Casino Retirement

**Status:** REVIEW ONLY — PRODUCTION DELETE NOT AUTHORISED

**Evidence date:** 13 September 2026

**Base:** `73c1c2b52d12dd32f1b8ba7d7e3df0b962334766`

**Plan SHA-256:** `97dd77552657709bba4e80cbb86a13e8a69bc684f51293926e1ccd5d59948696`

## Detected current state

**DETECTED:** RFC-012, PR #20 and the repository manifest are deterministic
evidence for exactly 25 synthetic Casino IDs. No name, slug prefix, age,
visibility, score or missing-commercial-data heuristic is deletion authority.

**DETECTED BY READ-ONLY PRODUCTION INSPECTION:** all 25 exact identities exist
and are `ARCHIVED`. The exact internal affiliate network and five affiliate
graphs exist. The discovered Production foreign-key graph and application
ownership checks found no real Partner relationship, active `MarketActivation`,
real tracking authority, CRM ownership, media ownership, identity collision,
shared dependency or other real-data blocker.

**PROPOSED:** remove the historical classifier, demo-specific public and
commercial behavior, recreation commands, enablement flag and unused generated
assets. Retain generic visual-QA fixtures under their existing Local/Preview-only
guard. Do not create a replacement demo authority.

## Exact demo manifest

The source for every row is the literal RFC-012/PR #20 manifest evidence now
copied into the one-time retirement allowlist. `Exists`, state and version are
current read-only Production observations.

| Immutable Casino ID | Slug | Display name | Exists | State | Published version |
| --- | --- | --- | --- | --- | ---: |
| `00000001-0000-4000-8000-000000000001` | `demo-northstar` | Demo Northstar Casino | yes | ARCHIVED | 5 |
| `00000002-0000-4000-8000-000000000001` | `demo-harbour` | Demo Harbour Casino | yes | ARCHIVED | 5 |
| `00000003-0000-4000-8000-000000000001` | `demo-atlas` | Demo Atlas Casino | yes | ARCHIVED | 5 |
| `00000004-0000-4000-8000-000000000001` | `demo-meadow` | Demo Meadow Casino | yes | ARCHIVED | 4 |
| `00000005-0000-4000-8000-000000000001` | `demo-lantern` | Demo Lantern Casino | yes | ARCHIVED | 4 |
| `00000006-0000-4000-8000-000000000001` | `demo-summit` | Demo Summit Casino | yes | ARCHIVED | 1 |
| `00000007-0000-4000-8000-000000000001` | `demo-ember` | Demo Ember Casino | yes | ARCHIVED | 1 |
| `00000008-0000-4000-8000-000000000001` | `demo-tide` | Demo Tide Casino | yes | ARCHIVED | 1 |
| `00000109-0000-4000-8000-000000000001` | `demo-juniper` | Demo Juniper Casino | yes | ARCHIVED | 2 |
| `00000110-0000-4000-8000-000000000001` | `demo-orbit` | Demo Orbit Casino | yes | ARCHIVED | 1 |
| `00000111-0000-4000-8000-000000000001` | `demo-quartz` | Demo Quartz Casino | yes | ARCHIVED | 1 |
| `00000112-0000-4000-8000-000000000001` | `demo-willow` | Demo Willow Casino | yes | ARCHIVED | 1 |
| `00000113-0000-4000-8000-000000000001` | `demo-beacon` | Demo Beacon Casino | yes | ARCHIVED | 1 |
| `00000114-0000-4000-8000-000000000001` | `demo-forge` | Demo Forge Casino | yes | ARCHIVED | 1 |
| `00000115-0000-4000-8000-000000000001` | `demo-aurora` | Demo Aurora Casino | yes | ARCHIVED | 1 |
| `00000116-0000-4000-8000-000000000001` | `demo-cedar` | Demo Cedar Casino | yes | ARCHIVED | 1 |
| `00000117-0000-4000-8000-000000000001` | `demo-vale` | Demo Vale Casino | yes | ARCHIVED | 1 |
| `00000118-0000-4000-8000-000000000001` | `demo-cobalt` | Demo Cobalt Casino | yes | ARCHIVED | 1 |
| `00000119-0000-4000-8000-000000000001` | `demo-drift` | Demo Drift Casino | yes | ARCHIVED | 1 |
| `00000120-0000-4000-8000-000000000001` | `demo-solstice` | Demo Solstice Casino | yes | ARCHIVED | 1 |
| `00000121-0000-4000-8000-000000000001` | `demo-meridian` | Demo Meridian Casino | yes | ARCHIVED | 1 |
| `00000122-0000-4000-8000-000000000001` | `demo-mosaic` | Demo Mosaic Casino | yes | ARCHIVED | 1 |
| `00000123-0000-4000-8000-000000000001` | `demo-plume` | Demo Plume Casino | yes | ARCHIVED | 1 |
| `00000124-0000-4000-8000-000000000001` | `demo-prism` | Demo Prism Casino | yes | ARCHIVED | 1 |
| `00000125-0000-4000-8000-000000000001` | `demo-canopy` | Demo Canopy Casino | yes | ARCHIVED | 1 |

No manifest Casino has an Operator/Brand binding, legitimate Partner
relationship or active commercial route. The safe delete set is these literal
25 IDs only; pattern or prefix expansion is prohibited.

## Production read-only dependency plan

The plan ran against trusted Production access inside `REPEATABLE READ` with
`SET TRANSACTION READ ONLY`. It discovers the current `public`-schema foreign
keys from `pg_catalog`, follows every path to `Casino`, inspects direct
references to the exact affiliate graph, and reports per-ID counts. Secret
values and destinations are not printed.

| Table | Total | Per-Casino rows | Disposition |
| --- | ---: | --- | --- |
| AffiliateNetwork | 1 | exact synthetic network | exact delete |
| AffiliateProgram | 5 | Northstar, Harbour, Atlas, Lantern, Summit: 1 each | exact delete |
| AffiliateOffer | 5 | same five: 1 each | exact delete |
| AffiliateOfferRevision | 5 | same five: 1 each | exact/cascade delete |
| AffiliateTrackingLink | 5 | same five: 1 each | exact/cascade delete |
| AffiliateTrackingLinkRevision | 5 | same five: 1 each | cascade delete |
| AffiliateRedirectSlug | 5 | same five: 1 each | exact delete |
| AffiliateRedirectRevision | 5 | same five: 1 each | cascade delete |
| Casino | 25 | every manifest ID: 1 | exact root delete |
| CasinoBonus | 25 | every manifest ID: 1 | cascade delete |
| CasinoCountry | 25 | every manifest ID: 1 | cascade delete |
| CasinoGameCategory | 50 | every manifest ID: 2 | cascade delete |
| CasinoGameProvider | 50 | every manifest ID: 2 | cascade delete |
| CasinoImage | 75 | every manifest ID: 3 | cascade delete |
| CasinoLicense | 25 | every manifest ID: 1 | cascade delete |
| CasinoPaymentMethod | 56 | exact variable counts below | cascade delete |
| CasinoRevision | 266 | exact variable counts below | cascade delete |
| CasinoSeo | 25 | every manifest ID: 1 | cascade delete |
| CasinoVersion | 44 | exact variable counts below | cascade delete |
| EditorialReview | 25 | every manifest ID: 1 | cascade delete |
| EditorialReviewRevision | 45 | exact variable counts below | cascade delete |
| AuditLog | 291 | exact variable counts below | retain immutable history |

The five affiliate-owning Casino IDs are
`00000001-0000-4000-8000-000000000001`,
`00000002-0000-4000-8000-000000000001`,
`00000003-0000-4000-8000-000000000001`,
`00000005-0000-4000-8000-000000000001` and
`00000006-0000-4000-8000-000000000001`.

The table below completes the per-ID matrix for non-uniform dependencies.
`Pay`, `Rev`, `Ver`, `EdRev` and `Audit` mean `CasinoPaymentMethod`,
`CasinoRevision`, `CasinoVersion`, `EditorialReviewRevision` and `AuditLog`.

| Casino ID | Pay | Rev | Ver | EdRev | Audit |
| --- | ---: | ---: | ---: | ---: | ---: |
| `00000001-0000-4000-8000-000000000001` | 2 | 32 | 5 | 6 | 33 |
| `00000002-0000-4000-8000-000000000001` | 2 | 30 | 5 | 5 | 31 |
| `00000003-0000-4000-8000-000000000001` | 2 | 30 | 5 | 5 | 31 |
| `00000004-0000-4000-8000-000000000001` | 2 | 24 | 4 | 4 | 25 |
| `00000005-0000-4000-8000-000000000001` | 3 | 24 | 4 | 4 | 25 |
| `00000006-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000007-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000008-0000-4000-8000-000000000001` | 3 | 6 | 1 | 1 | 7 |
| `00000109-0000-4000-8000-000000000001` | 2 | 12 | 2 | 2 | 13 |
| `00000110-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000111-0000-4000-8000-000000000001` | 3 | 6 | 1 | 1 | 7 |
| `00000112-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000113-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000114-0000-4000-8000-000000000001` | 3 | 6 | 1 | 1 | 7 |
| `00000115-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000116-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000117-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000118-0000-4000-8000-000000000001` | 3 | 6 | 1 | 1 | 7 |
| `00000119-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000120-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000121-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000122-0000-4000-8000-000000000001` | 3 | 6 | 1 | 1 | 7 |
| `00000123-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000124-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |
| `00000125-0000-4000-8000-000000000001` | 2 | 6 | 1 | 1 | 7 |

Zero-row paths include all discovered alias, publication-preview, offer
country/currency, media-assignment, evidence, localisation, analytics,
outbound-click, CRM, `MarketActivation`, Partner relationship/support,
Partner-hosted creative and media authority tables. The plan will block if a
future run finds an unknown relation, non-cascade ownership, exact-affiliate
manifest drift or a protected real-data table.

## Conflicts

No conflicts were returned. `readyToApply` is `true` for the observed snapshot.
This is evidence for review, not execution authority. Any changed plan will
produce a different SHA-256 and requires renewed review.

## Code removed

The repository contour was classified before removal:

- **PRODUCTION DEMO AUTHORITY:** exact-ID classifier/registry, demo-specific
  public discovery/offer/comparison/profile and commercial-action branches,
  Production enablement flag, seed/audit/verify/cleanup and asset-generation
  paths. Removed.
- **DEAD CODE:** 69 generated Casino hero/logo/screenshot assets used only by
  the retired Production dataset. Removed.
- **TEST FIXTURE ONLY:** Local/Preview visual-QA data, 15 referenced SVGs,
  browser routes and the explicit `DEMO_FIXTURE` presentation label. Retained,
  separated from Production IDs and guarded against Production execution.
- **PRODUCT DEMO / SAMPLE UX:** no synthetic-Casino authority found.
- **UNKNOWN:** none after tracing consumers and the Production dependency
  graph.

Historical RFC and delivery/QA evidence remain historical facts. They are not
live authority and must not be used to recreate Production data.

## Data retained

The 291 `AuditLog` rows are truthful immutable history keyed by polymorphic
`entityId`, with no Casino foreign key. They are deliberately unchanged. The
reviewed Production snapshot contains no nonzero `SET NULL` historical
dependencies and no `ContentRevision` rows for these IDs.

## Eventual Production delete procedure

Do not run these steps under this review task. After merge/deploy readiness,
fresh independent review and separate Founder execution authority:

1. Pull trusted Production database authority into a private, mode-`0600`
   temporary environment file; never print values.
2. Run `npm run demo-retirement:plan -- --summary-only`. Confirm exact identity,
   per-table/per-ID counts, zero conflicts and a newly reviewed plan SHA-256.
3. Set the one-time environment acknowledgement to the exact phrase documented
   by the CLI, then run `npm run demo-retirement:apply --
   --confirm=RETIRE_EXACT_RFC_012_DEMO_CASINOS --plan-sha256=<reviewed-sha>`.
4. APPLY acquires a transaction advisory lock, re-runs the complete inspection
   under `SERIALIZABLE`, and fails before writes on conflicts or SHA drift.
5. The transaction deletes only the five exact redirect IDs, five exact offer
   IDs, five exact program IDs, exact synthetic network ID
   `00000009-0000-4000-8000-000000000001`, and the 25 literal Casino IDs.
   Existing foreign keys remove the reviewed owned child rows. No slug, prefix,
   wildcard or broad classifier is used.
6. APPLY verifies zero exact Casino/affiliate rows before commit. A repeated
   authorised APPLY after successful retirement is a zero-write success.
7. Run `npm run demo-retirement:verify` read-only and confirm live demo Casinos
   = 0 and demo-specific runtime authority = 0. Remove the private environment
   file.

Production delete NOT executed.

## Risks and unknowns

- The evidence is a point-in-time Production snapshot; a later write can
  invalidate it. SHA binding and an in-transaction reinspection address this.
- The branch and one-time execution path are not merged or deployed.
- Production APPLY remains deliberately unexercised. Its SQL is bounded and
  covered structurally; execution must be observed only under separately
  authorised Production change control.

## Founder authority required

Independent review is the only requested next step. Do not merge, deploy or
run APPLY from this document. A later explicit Founder instruction must
authorise the exact reviewed Production delete.

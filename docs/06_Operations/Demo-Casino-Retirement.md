# Demo Casino Retirement

**Status:** REVIEW ONLY — PRODUCTION DELETE NOT AUTHORISED

**Evidence date:** 13 September 2026

**Base:** `73c1c2b52d12dd32f1b8ba7d7e3df0b962334766`

**Plan SHA-256:** `97dd77552657709bba4e80cbb86a13e8a69bc684f51293926e1ccd5d59948696` is **OBSOLETE**. It was produced by the superseded single-path planner and is not execution authority. A fresh corrected-plan hash must be reviewed and explicitly authorised.

## Independent review correction

The original review found two release-blocking gaps. They are corrected without
changing the immutable retirement manifest or broadening deletion authority:

- the planner now starts from the exact 25 Casino rows and every exact affiliate
  graph row, discovers actual affected child rows through every PostgreSQL
  foreign-key relation, and continues only from rows that will themselves be
  deleted;
- concrete rows are deduplicated by their declared primary key, including
  composite keys; a table with affected rows but no stable primary key blocks
  the plan instead of producing an approximation;
- each dependency reports unique affected-row count, per-Casino attribution,
  disposition counts and every relevant relation path with constraint name and
  PostgreSQL delete action;
- any affected protected Partner, commercial, activation or media row blocks,
  regardless of whether the schema would cascade-delete it or retain it with
  `SET NULL`; and
- `npm run demo-retirement:postgres-test` destructively exercises the real
  planner, APPLY and verification transaction on a disposable migrated
  PostgreSQL database. It covers successful deletion and idempotency,
  multi-path protected-media discovery and deduplication, a persisted Partner
  conflict, stale-hash refusal, post-delete rollback, immutable `AuditLog`
  retention, and preservation of a similar but non-manifest Casino. The command
  is a required step in `Database / Migration Verification` CI.

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

The corrected plan runs against trusted Production access inside
`REPEATABLE READ` with `SET TRANSACTION READ ONLY`. It discovers the current
`public`-schema foreign keys and primary keys from `pg_catalog`, computes the
complete affected-row closure from exact Casino and affiliate roots, and
reports unique counts, per-ID attribution, all relation paths and their delete
semantics. Secret values and destinations are not printed.

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

The planner does not treat schema reachability as row reachability. It queries
the actual children of affected rows along every relation and records all paths
that reach each unique row. It blocks on an unreviewed affected table,
non-cascade ownership requiring review, exact-affiliate manifest drift, an
affected protected real-data table, or an affected table without a stable
primary key.

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

Deletion must occur while the current Production binary still serves the
archived synthetic rows. Merge and deploy are permitted only after the delete,
verification and current-version Production smoke checks are healthy. The
release order is:

1. Take and verify the required Production backup.
2. From the exact proposed PR head, pull trusted Production database authority
   into a private mode-`0600` temporary environment file and run a fresh
   `npm run demo-retirement:plan -- --summary-only`.
3. Independently review the exact manifest, complete affected-row closure,
   unique and per-Casino counts, all relation paths and delete semantics,
   conflicts, and new plan SHA-256. Any protected or unkeyed affected row is a
   HOLD.
4. Obtain explicit Founder authorisation for that exact reviewed plan SHA-256.
5. While the current old Production binary is still serving, set the one-time
   environment acknowledgement and run `npm run demo-retirement:apply --
   --confirm=RETIRE_EXACT_RFC_012_DEMO_CASINOS --plan-sha256=<reviewed-sha>`.
   APPLY takes the transaction advisory lock, recomputes the closure under
   `SERIALIZABLE`, and fails before writes on conflicts or hash drift.
6. Run `npm run demo-retirement:verify` read-only and confirm zero exact
   Casino/affiliate roots and zero demo-specific runtime authority.
7. Run current-version Production smoke checks while the old binary is still
   serving. If delete verification or smoke checks fail, HOLD; do not merge.
8. Only if steps 5–7 are healthy, merge the exact reviewed PR head.
9. Deploy the merged retirement code.
10. Run post-deploy Production smoke checks.
11. Record the reviewed hash, Founder authority, APPLY result, verification,
    both smoke results, merged commit and deployed release; securely remove the
    private environment file.

Production delete NOT executed.

## Risks and unknowns

- The old `97dd…` hash is invalid. Production evidence is point-in-time; any
  write can change the corrected closure. Hash binding and in-transaction
  reinspection address this only for a newly reviewed hash.
- The branch and one-time execution path are not merged or deployed.
- Production APPLY remains deliberately unexercised. Its SQL is bounded and
  covered structurally; execution must be observed only under separately
  authorised Production change control.

## Founder authority required

Do not merge, deploy or run APPLY from this document. A later explicit Founder
instruction must authorise the exact newly reviewed Production plan hash.

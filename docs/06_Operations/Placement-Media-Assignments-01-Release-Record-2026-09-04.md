# PLACEMENT-MEDIA-ASSIGNMENTS-01 Release Record — 4 September 2026

**Status:** COMPLETE — ACTIVE IN PRODUCTION

**Founder authority:** `B4GAMBLE — PLACEMENT-MEDIA-ASSIGNMENTS-01 / RFC-040
OPTION C IMPLEMENTATION`

**Starting `origin/main`:**
`d7ac84e1214f37e912c05beeb0233032b3f3703f`

**Branch:** `codex/placement-media-assignments-01`

**Pull request:** [#148](https://github.com/AlexG-7BE/sevenbet-next/pull/148)

**Accepted head:** `2d468bb960704f2d62ecfcf73f89cd24498d6ace`

**Merge/runtime baseline:** `aaebff1eccdf0f9694791b52fb88d1d011d74a17`

**Production activation deployment:** `dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2`

**Production origin:** `https://b4gamble.com`

This record contains no credential, private partner data, raw tracking
destination or visitor/Programme data. Classification is **DETECTED**,
**INFERRED**, **PROPOSED**, **UNKNOWN** or **CONTRADICTION** under the repository
technical-evidence rule.

## Executive result

**DETECTED:** Production contains RFC-040 Option C as three
typed assignment tables over reusable `MediaAsset`, one deterministic resolver,
semantic Casino/Bonus/Affiliate Offer Admin slots, immutable Casino publication
projection, assignment-first public mapping behind an exact opt-in switch and a
checksum-bound, target-specific Preview/Production migration/backfill executor.

**DETECTED:** the active repository was scanned from its confirmed root,
`/private/tmp/sevenbet-placement-media-assignments-01`, with dependencies,
generated/build output, caches and `tsconfig.tsbuildinfo` excluded. The factual
implementation claims below derive from that scan, the isolated PostgreSQL 16
harness and bounded read-only Production queries.

**DETECTED:** PR #148 merged after exact-head Preview acceptance and all CI
gates. Additive migration `0027_placement_media_assignments`, the governed
46-assignment backfill and eight immutable publication projections were applied
to the independently fingerprinted Production database. The immediate repeated
backfill created zero assignments and zero projections. Assignment-first reads
are enabled on Ready deployment `dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2`; final
responsive browser, route, auth/Programme and read-only database acceptance
passed.

## RFC-040 decision

RFC-040 was `PROPOSED` and carried no schema authority. The Founder explicitly
approved Option C on 4 September 2026. The RFC now records `ACTIVE`, preserves
the original Options A/B analysis and identifies the Founder instruction as the
implementation authority.

## Exact schema

Migration `0027_placement_media_assignments` adds:

- `MediaPlacement`: `CASINO_LOGO`, `CASINO_DIRECTORY_CARD`,
  `CASINO_DETAIL_HERO`, `CASINO_COMPARE`, `BONUS_LISTING_CARD`,
  `BEST_OFFER_FEATURED`, `BEST_OFFER_SECONDARY`, `CASINO_OFFER_BLOCK`,
  `OFFER_DETAIL`;
- `MediaPlacementVariant`: `DEFAULT`, `DESKTOP`, `MOBILE`;
- `MediaRenderingMode`: `AUTO`, `COVER`, `CONTAIN`, `COMPOSED`;
- `CasinoMediaAssignment`, `CasinoBonusMediaAssignment` and
  `AffiliateOfferMediaAssignment`.

Each table has a typed non-null subject FK, non-null `MediaAsset` FK,
placement/variant/mode, stable sort, active state, crop-safe flag, alt override,
paired normalized focal points, validity window, reference and timestamps.
Subject deletion cascades only its relationships. Every asset FK is `ON DELETE
RESTRICT`. Table checks enforce subject-domain placements, non-negative order,
paired `0…1` focal coordinates, coherent dates and explicit crop-safe approval
for `COVER`. Resolver and asset indexes cover subject/placement/variant/active/
sort/id and `mediaAssetId`.

The migration is additive: it has no `DROP`, `TRUNCATE`, destructive update or
legacy column rename. Existing `MediaAsset` owner fields, HERO/LOGO selection,
`CasinoImage` and legacy public reads remain.

Migration SHA-256:
`415f7295e92cd7b3992e7065bbfab3eccd1a5609c5dc584f3035d31756b1d348`.

## Resolver and public mapping

For each requested placement the resolver evaluates partner-specific
AffiliateOffer assignments where a partner context genuinely exists, then the
editorial CasinoBonus assignment, or the Casino assignment for Casino slots.
It selects exact variant, then `DEFAULT`, then the RFC-040 placement fallback,
then controlled logo composition, then a code-rendered B4GAMBLE fallback.
Candidates must be active, within their immutable validity window and reference
an active non-archived asset; selection is lowest `sortOrder`, then stable ID.

`AUTO` classifies controlled dimensions; current ordinary art resolves
`CONTAIN`, ultra-wide/tall incompatible material resolves `COMPOSED`. Explicit
`COVER` requires crop-safe review and honors paired focal coordinates.
Responsive `<picture>` sources select optional `MOBILE` at 767px and below and
`DESKTOP` from 768px, with `DEFAULT` as the normal path.

The exact public mapping is:

| Surface | Placement |
| --- | --- |
| `/casinos` curated directory stage | `CASINO_DIRECTORY_CARD` |
| Casino review hero | `CASINO_DETAIL_HERO` |
| Comparison identity/media | `CASINO_COMPARE` |
| `/bonuses` card | `BONUS_LISTING_CARD` |
| `/best-offers` rank one | `BEST_OFFER_FEATURED` |
| `/best-offers` secondary | `BEST_OFFER_SECONDARY` |
| Casino review offer block | `CASINO_OFFER_BLOCK` |
| Future standalone offer detail | `OFFER_DETAIL` only when such UI exists |

Media selection accepts no score, commission, compensation, GEO, CTA,
Programme or user input. Editorial Bonus publication and media remain available
without an AffiliateOffer or tracking route. CTA and GEO authority remain
separate existing gates.

`PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=true` enables assignment-first public
projection. Absent, false or malformed values retain the legacy logo/HERO
projection. Turning the switch off is the primary rollback and does not delete
assignment data.

## Publication semantics

**DETECTED:** Casino and CasinoBonus relationship changes require the current
Casino draft lifecycle. Authenticated draft preview reads the live draft
assignments and shows explicit/fallback source and requested variant. Publish
copies the assignments and the referenced asset facts into
`CasinoVersion.snapshot`. Public repositories continue to read only immutable
published snapshots, so later draft relationship or asset-record edits do not
change that version. Validity transitions encoded in a snapshot remain
deterministic and reproducible at an explicit resolver time.

**DETECTED:** an AffiliateOffer assignment follows the offer's own revisioned
lifecycle: active/draft offers may manage optional partner creative; archived
offers are refused until restored. Current public editorial surfaces do not
select a partner offer context, so no AffiliateOffer assignment is required for
Bonus visibility. Partner-context public selection is a bounded future
integration if a real surface requires it.

## Admin capability

The existing Casino Builder Media section exposes Logo, Casino directory,
Casino detail hero and Compare. Each Bonus editor exposes Bonus listing, Best
Offer featured, Best Offer secondary, Casino offer block and Offer detail. The
existing AffiliateOffer media section receives the same optional offer slots
for partner-specific creative.

Every slot shows explicit/inactive/ineligible/fallback state, effective source,
resolved slot, filename/reference, dimensions, derived aspect ratio, MIME,
provenance, mode, variant, active state and assignment usage. Founder/Admin can
upload or choose one existing active asset, replace only that relationship,
unassign without deleting the asset, activate/deactivate, set mode/crop review/
focal coordinates and preview `DEFAULT`, optional `DESKTOP` or optional
`MOBILE`. Existing media library, archive and separately guarded permanent
delete remain visible; deletion is refused while any typed assignment exists.

The six-asset independence fixture maps distinct assets A–F to Casino directory,
Casino detail, Compare, Bonus listing, Best Offer featured and Casino offer
block. It also maps a seventh `MOBILE` directory asset while desktop falls back
to the directory default. The public projection test verifies all seven exact
IDs. The PostgreSQL service integration independently replaces directory A
with C without changing detail B, unassigns C without deleting either asset,
keeps the mobile override separate from default, and changes Bonus listing
without changing Best Offer featured.

Hosted anonymous Preview and Production correctly deny Admin access. A manual
authenticated hosted Preview walkthrough was not possible because the isolated
Preview fixture's sole `SUPER_ADMIN` is deliberately unlinked (`userId=null`).
No auth row was changed. Admin release evidence therefore comes from the exact
real PostgreSQL assignment workflow plus structural browser/UI contract tests,
which is the Founder-approved browser/integration-test path.

## Governed backfill manifest

The committed manifest is derived from the exact eight Production Casinos and
six current global published Bonuses. It is bound to:

- Production database resource `store_1I4F54ETrwSKS42o` and target fingerprint:
  `ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e`;
- isolated Preview database resource `store_hLPkkgamL7rJNmCe` and target
  fingerprint:
  `cebafba022854f716ee4a92a71b5dc9e7d14600fbf144be1598cd90583a775da`;
- legacy source-state checksum:
  `c4b1c6f169d4551ed15f39704508272a1abd97f7dab23ffc49df11c5409d220e`;
- manifest SHA-256:
  `958d2b15f96d4871105d605de413020814b26de9183684a7620b8694afcb0d1d`.

Verified exact Preview and Production relationship counts:

| Table / placement | Count |
| --- | ---: |
| `CasinoMediaAssignment` / `CASINO_LOGO` | 8 |
| `CasinoMediaAssignment` / `CASINO_DIRECTORY_CARD` | 5 |
| `CasinoMediaAssignment` / `CASINO_DETAIL_HERO` | 5 |
| `CasinoMediaAssignment` / `CASINO_COMPARE` | 8 |
| **CasinoMediaAssignment total** | **26** |
| `CasinoBonusMediaAssignment` / `BONUS_LISTING_CARD` | 5 |
| `CasinoBonusMediaAssignment` / `BEST_OFFER_FEATURED` | 5 |
| `CasinoBonusMediaAssignment` / `BEST_OFFER_SECONDARY` | 5 |
| `CasinoBonusMediaAssignment` / `CASINO_OFFER_BLOCK` | 5 |
| `CasinoBonusMediaAssignment` / `OFFER_DETAIL` | 0 |
| **CasinoBonusMediaAssignment total** | **20** |
| **AffiliateOfferMediaAssignment total** | **0** |
| **All assignments** | **46** |

The manifest records 62 subject/placement comparisons: every Casino placement
for eight Casinos and every offer placement for six Bonuses. Five Casinos with
controlled HERO media receive explicit directory/detail assignments and their
five Bonuses receive four explicit offer assignments. Betsson and DragonBet
have no current Bonus/HERO and retain logo composition for directory/detail.
Hello has no current HERO and retains logo composition for directory/detail and
all offer slots. `OFFER_DETAIL` remains unassigned and deterministically falls
through the approved chain. Slotnite's 320×50 source remains `COMPOSED`; the
four 300×250 current creatives remain `CONTAIN`. Compare stays on each current
controlled logo.

The executor refuses writes unless target, Vercel project/org, exact
environment-specific database resource and fingerprint, exact
deployed/repository SHA, manifest checksum, source checksum, current eight/six
identities and bounded confirmation flags all agree. Preview and Production
therefore cannot authorize each other's writes. It
requires assignment-first reads off, verifies migration 0027, runs assignments,
resolver comparison and immutable republishing in a serializable transaction,
and refuses unexpected pre-existing Admin assignment state.

## Exact release and verification

**DETECTED:** local `CI=true npm run ci:quality`, build and all 27 fresh/replay
migrations passed. Placement unit/contract tests were 26/26, MCP bridge tests
31/31 and MCP PostgreSQL tests 13/13. A real isolated PostgreSQL 16 run preserved
representative Programme, auth, commercial, Casino and `MediaAsset` state and
passed typed FK/check/delete/unassign/Admin-service integration, including
active-vs-archived AffiliateOffer lifecycle behavior.

**DETECTED:** a bounded read-only Production query found zero active
country-scoped `MediaAsset` rows, so the global assignment projection cannot
displace accepted market-specific media in this release. Manifest regeneration
against live governed source state matches the committed artifact byte for
byte.

**DETECTED — exact PR/merge gates:** final PR workflow
[`33861058833`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33861058833)
passed on accepted head `2d468bb960704f2d62ecfcf73f89cd24498d6ace`.
PR #148 merged as `aaebff1eccdf0f9694791b52fb88d1d011d74a17` at
10:19:40 UTC. Exact-merge workflow
[`33862693235`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33862693235)
then passed Agent Core (19s), Quality (6m17s), Database/Migration Verification
(6m46s) and Build/Browser (19m55s), including the complete browser,
Permissions-Policy and typography suites.

**DETECTED — Preview:** final deployment
`dpl_EhBShAyxiAf6D1f66ao1var2RrkK` was Ready on the accepted head against the
isolated Preview database fingerprint
`cebafba022854f716ee4a92a71b5dc9e7d14600fbf144be1598cd90583a775da`.
Migration 0027 applied once. The first backfill created 46 assignments and eight
immutable projections; the immediate second run created 0/0. The final verifier
reported 26 Casino, 20 Bonus, zero AffiliateOffer assignments and 62
legacy/new comparisons. Actual browser acceptance covered 390, 430, 768, 1024,
1280 and 1440px; all eight reviews; `/casinos`, `/bonuses`, `/best-offers`;
Slotnite/Hello edge cases; selectors; terms; comparison; CTA/GEO containment;
and anonymous Admin denial. The branch-only Preview flag was removed after
Production acceptance.

**DETECTED — Production migration/backfill:** compatible staged deployment
`dpl_68wSn8JHXfdkiT4vCEBQqSuy2yrV` served legacy reads while 0027 was pending.
After exact-merge CI passed, the executor proved resource
`store_1I4F54ETrwSKS42o`, fingerprint
`ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e`,
project/org, merge SHA, manifest/source checksums and exact eight/six identity
set. It applied 0027 once with one successful attempt and no other pending
migration. The first serializable backfill necessarily created the verified 46
relationships and eight projections from an empty typed-assignment baseline.
The captured immediate no-op run reported `createdAssignments=0` and
`createdProjections=0`; its verifier again reported 26/20/0, 46 total, eight
immutable projections and 62 comparisons.

**DETECTED — Production activation/acceptance:** assignment-first reads were
enabled only after the post-backfill verifier passed. Ready deployment
`dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2` cloned exact merge `aaebff1`; its build
preflight verified matching pooled/direct database identity, applied checksum-
valid 0027, assignment-first `true`, all typed enums/tables and exact placement
counts. Canonical aliases include `b4gamble.com` and `www.b4gamble.com`.
Production browser acceptance at 1440 and 390px found all eight exact review
identities/scores, unchanged media modes across widths, zero overflow, zero
broken images, zero page errors and zero raw external links. `/bonuses` retained
Top-3 ranks 01–03 and selector counts 3/1/3/0/3; `/best-offers` retained six
real offers, ranks 01–06 and three placement-aware media stages. Slotnite was
`EXPLICIT/COMPOSED`; Hello was current `LOGO_COMPOSITION/COMPOSED` with no stale
creative. Comparison rendered three real 50×50 `CONTAIN` images without dialog
overflow. Programme, public login and anonymous Admin-auth boundary smoke
passed; repository Production smoke returned 200 for all nine routes. The final
read-only verifier repeated the exact 8/6, 26/20/0, 46, 8 and 62 state.

## Release and rollback

The completed controlled order was branch Preview with assignment-first off → prove the
isolated Preview identity and matching source checksum → exact guarded Preview
migration → guarded Preview backfill → immediate second no-op backfill → enable
exact `true` only for the branch → redeploy and complete responsive Preview
acceptance → merge/Production deploy with assignment-first off → exact guarded
Production migration → guarded Production backfill → immediate second no-op
backfill → enable exact `true` → deploy the exact enabled main SHA → Production
smoke/read-only verification. No rollback was required.

Primary rollback is to remove or set
`PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=false` and redeploy. The old application
and legacy read path remain compatible with migration 0027 and the backfilled
rows. Application rollback may promote the last known-good deployment. The
additive tables remain; dropping tables or deleting assignment data is not an
incident response.

## Remaining legacy debt

- Legacy `MediaAsset` owner/featured selection and public fallback reads remain
  intentionally for rollback and require a later, separately governed
  retirement after Production operation proves stable.
- `CasinoImage` remains historical schema debt.
- Existing root-relative catalog assets remain deployment-coupled; current
  Production object-storage readiness is not established by this release.
- A real public partner-specific creative surface is not currently present;
  AffiliateOffer assignments are implemented in schema/service/Admin but are
  not forced into editorial Bonus projection.
- No fake standalone offer-detail UI was created.

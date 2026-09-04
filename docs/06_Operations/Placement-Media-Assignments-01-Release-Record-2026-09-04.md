# PLACEMENT-MEDIA-ASSIGNMENTS-01 Release Record — 4 September 2026

**Status:** APPROVED IMPLEMENTATION — PRODUCTION ACTIVATION PENDING

**Founder authority:** `B4GAMBLE — PLACEMENT-MEDIA-ASSIGNMENTS-01 / RFC-040
OPTION C IMPLEMENTATION`

**Starting `origin/main`:**
`d7ac84e1214f37e912c05beeb0233032b3f3703f`

**Branch:** `codex/placement-media-assignments-01`

**Production origin:** `https://b4gamble.com`

This record contains no credential, private partner data, raw tracking
destination or visitor/Programme data. Classification is **DETECTED**,
**INFERRED**, **PROPOSED**, **UNKNOWN** or **CONTRADICTION** under the repository
technical-evidence rule.

## Executive result

**DETECTED:** the implementation branch contains RFC-040 Option C as three
typed assignment tables over reusable `MediaAsset`, one deterministic resolver,
semantic Casino/Bonus/Affiliate Offer Admin slots, immutable Casino publication
projection, assignment-first public mapping behind an exact opt-in switch and a
checksum-bound Production migration/backfill executor.

**DETECTED:** the active repository was scanned from its confirmed root,
`/private/tmp/sevenbet-placement-media-assignments-01`, with dependencies,
generated/build output, caches and `tsconfig.tsbuildinfo` excluded. The factual
implementation claims below derive from that scan, the isolated PostgreSQL 16
harness and bounded read-only Production queries.

**PROPOSED RELEASE STATE:** merge, Preview acceptance, Production migration,
backfill, enablement and final smoke remain gates. This record must not be read
as Production completion until its status and exact release evidence are
updated after those gates pass.

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

## Governed backfill manifest

The committed manifest is derived from the exact eight Production Casinos and
six current global published Bonuses. It is bound to:

- database target fingerprint:
  `ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e`;
- legacy source-state checksum:
  `c4b1c6f169d4551ed15f39704508272a1abd97f7dab23ffc49df11c5409d220e`;
- manifest SHA-256:
  `958d2b15f96d4871105d605de413020814b26de9183684a7620b8694afcb0d1d`.

Planned exact relationship counts:

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

The executor refuses writes unless target, Vercel project/org, database
fingerprint, exact deployed/repository SHA, manifest checksum, source checksum,
current eight/six identities and bounded confirmation flags all agree. It
requires assignment-first reads off, verifies migration 0027, runs assignments,
resolver comparison and immutable republishing in a serializable transaction,
and refuses unexpected pre-existing Admin assignment state.

## Verification before PR

**DETECTED:** local typecheck, placement tests and affected public/commercial
regressions pass. A real isolated PostgreSQL 16 run applied all 27 migrations,
replayed them, preserved representative Programme, auth, commercial, Casino and
MediaAsset state and passed typed FK/check/delete/unassign/Admin-service
integration, including active-vs-archived AffiliateOffer lifecycle behavior.

**DETECTED:** a bounded read-only Production query found zero active
country-scoped `MediaAsset` rows, so the global assignment projection cannot
displace accepted market-specific media in this release. Manifest regeneration
against live governed source state matches the committed artifact byte for
byte.

Final full quality/build, CI, Preview, Production mutation and browser evidence
will be recorded here before `COMPLETE`.

## Release and rollback

The controlled order is compatible application with assignment-first off →
merge/Production deploy → exact guarded migration → guarded backfill → immediate
second no-op backfill → enable exact `true` → deploy the exact enabled main SHA →
Production smoke/read-only verification.

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

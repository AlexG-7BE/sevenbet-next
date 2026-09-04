# RFC-040 — Placement-Based Media Assignments

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Proposal date:** 4 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE —
PLACEMENT-MEDIA-ASSIGNMENTS-01 / RFC-040 OPTION C IMPLEMENTATION`, issued 4
September 2026.

## Decision and history

RFC-040 was originally recorded as `PROPOSED`, recommended Option C and carried
no implementation authority. On 4 September 2026 the Founder explicitly chose
**GO — APPROVE RFC-040 OPTION C** and authorised its additive migration,
Production backfill, resolver, Admin slots, publication integration and
controlled release. This lifecycle change records that later decision; it does
not rewrite Options A or B or imply that the RFC had always been approved.

The active architecture keeps reusable `MediaAsset` records and uses separate
placement-assignment tables for Casino, CasinoBonus and AffiliateOffer subjects,
exposed through one resolver contract.

This proposal follows the MEDIA-PRESENTATION-AND-ADMIN-01 Founder instruction.
The visible Slotnite, Bonuses and review-layout hotfix does not depend on this
proposal and is delivered through the current architecture.

## Evidence classification

- **DETECTED:** `MediaAsset` is the current physical/content record and has
  nullable owner relations to Casino, CasinoCountry, CasinoBonus and
  AffiliateOffer.
- **DETECTED:** current public offer renderers project one Casino `hero` and
  reuse it for Bonuses, Best Offers and Casino detail presentation.
- **DETECTED:** current Bonus and Affiliate Offer media selectors do not create
  normalized public placement assignments.
- **DETECTED:** no current public resolver selects media by placement or device
  variant.
- **DETECTED:** the Founder approved Option C through the explicit instruction
  identified above.
- **DETECTED:** migration `0027_placement_media_assignments`, the typed models,
  resolver, immutable publication projection, Admin slots and guarded backfill
  implement the approved design in the release branch.

## Goals

1. Keep one reusable file/content record in `MediaAsset`.
2. Assign an asset to zero, one or many explicit placements.
3. Let each Casino or offer choose a different asset per placement.
4. Keep commercial-route authority, editorial ordering and media presentation
   independent.
5. Preserve relational integrity and deterministic fallbacks.
6. Allow non-destructive reassignment and gradual migration.

## Non-goals

- No removal of legacy owner fields or compatibility reads in this release.
- No change to Editor Scores, offer terms, ranking, routes or GEO authority.
- No arbitrary device matrix beyond `DEFAULT`, `DESKTOP` and `MOBILE`.
- No random asset choice and no implicit use of an ultra-wide banner in a card.

## Subject-relation options

### Option A — generic `subjectType` / `subjectId`

One table is compact and extensible, but the database cannot enforce that the
subject exists or cascades correctly. Application-only referential integrity is
not appropriate for published commercial presentation.

### Option B — one table with nullable foreign keys

One `MediaPlacementAssignment` table could contain `casinoId?`,
`casinoBonusId?`, `affiliateOfferId?` and future subject columns, with a SQL
constraint requiring exactly one. This preserves foreign keys but creates a
wide table, placement/subject combinations need further constraints, and each
new domain changes a shared table.

### Option C — typed tables by domain — approved

Use `CasinoMediaAssignment`, `CasinoBonusMediaAssignment` and, only where a
partner-specific asset is genuinely needed, `AffiliateOfferMediaAssignment`.
All reference the same `MediaAsset` and implement one application resolver
interface. Each table has a non-null subject foreign key, a non-null asset
foreign key, domain-valid placement constraints and predictable cascades.

**Decision:** Option C. B4GAMBLE has only three real media-owning domains,
and strong database integrity is more valuable than a theoretically elegant
polymorphic table. `CasinoBonus` remains the public editorial-offer subject;
`AffiliateOffer` remains separate commercial-partner evidence and must not
become necessary for editorial media visibility.

## Approved data model

The following preserves the original conceptual shape. The exact implemented
schema is migration `0027_placement_media_assignments`; its SQL constraints and
indexes are authoritative for the released database shape.

```prisma
enum MediaPlacement {
  CASINO_LOGO
  CASINO_DIRECTORY_CARD
  CASINO_DETAIL_HERO
  CASINO_COMPARE
  BONUS_LISTING_CARD
  BEST_OFFER_FEATURED
  BEST_OFFER_SECONDARY
  CASINO_OFFER_BLOCK
  OFFER_DETAIL
}

enum MediaPlacementVariant {
  DEFAULT
  DESKTOP
  MOBILE
}

enum MediaRenderingMode {
  AUTO
  COVER
  CONTAIN
  COMPOSED
}

model CasinoMediaAssignment {
  id              String                @id @default(uuid()) @db.Uuid
  casinoId        String                @db.Uuid
  mediaAssetId    String                @db.Uuid
  placement       MediaPlacement
  variant         MediaPlacementVariant @default(DEFAULT)
  renderingMode   MediaRenderingMode    @default(AUTO)
  sortOrder       Int                   @default(0)
  active          Boolean               @default(true)
  cropSafe        Boolean               @default(false)
  altTextOverride String?
  focalPointX     Decimal?               @db.Decimal(5, 4)
  focalPointY     Decimal?               @db.Decimal(5, 4)
  validFrom       DateTime?
  validUntil      DateTime?
  reference       String?
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt
  casino          Casino                @relation(fields: [casinoId], references: [id], onDelete: Cascade)
  mediaAsset      MediaAsset             @relation(fields: [mediaAssetId], references: [id], onDelete: Restrict)

  @@index([casinoId, placement, variant, active, sortOrder, id])
  @@index([mediaAssetId])
}
```

`CasinoBonusMediaAssignment` and `AffiliateOfferMediaAssignment` use the same
assignment fields with a non-null typed subject relation. Database check
constraints restrict each table to its allowed placement values and focal
points to `0…1`. Admin-created relationships default to `sortOrder=0`; the
compatibility backfill deliberately uses `1000`, so a later explicit Founder
choice can win without deleting its provenance row. The service deactivates the
previous active relationship for the same subject/placement/variant, while the
database keeps deterministic multiple-candidate support for history and
controlled reconciliation.

`MOBILE_CARD` is not recommended as a placement: `MOBILE` is a variant of the
semantic placement. Keeping both would create two ways to represent the same
choice. `DESKTOP` is an exceptional override; `DEFAULT` remains sufficient for
most assets.

## Placement ownership

| Placement | Subject table | Meaning |
| --- | --- | --- |
| `CASINO_LOGO` | Casino | Operator identity mark |
| `CASINO_DIRECTORY_CARD` | Casino | `/casinos` card media |
| `CASINO_DETAIL_HERO` | Casino | Casino review hero |
| `CASINO_COMPARE` | Casino | Comparison identity/media |
| `BONUS_LISTING_CARD` | CasinoBonus | `/bonuses` offer media |
| `BEST_OFFER_FEATURED` | CasinoBonus | Rank-one Best Offers stage |
| `BEST_OFFER_SECONDARY` | CasinoBonus | Rank-two/three or compact Best Offers media |
| `CASINO_OFFER_BLOCK` | CasinoBonus | Offer media inside Casino review |
| `OFFER_DETAIL` | CasinoBonus | Future standalone offer detail |

An `AffiliateOfferMediaAssignment` may use offer placements only when the asset
is contractually specific to that partner offer. The public resolver must still
permit editorial media without an active commercial route.

## Rendering contract

- `AUTO`: classify the assigned asset against the placement contract. Compatible
  art uses `CONTAIN` or an explicitly crop-safe `COVER`; unsuitable art uses
  `COMPOSED`.
- `COVER`: allowed only when the assignment is marked crop-safe and a focal
  point is present or the entire safe area has been reviewed.
- `CONTAIN`: preserves the whole creative, especially mandatory offer copy and
  terms.
- `COMPOSED`: uses controlled operator identity, current sourced offer copy and
  B4GAMBLE UI. The assigned source may appear as a secondary element.

The resolver returns the effective asset, assignment, mode, source step and
alt text so the UI and acceptance tests can explain the decision.

## Deterministic fallback resolution

For any requested placement:

1. active, in-validity assignment for the exact subject, placement and requested
   variant, lowest `sortOrder`, then stable assignment `id`;
2. exact subject and placement with `DEFAULT` variant;
3. the placement-specific chain below;
4. controlled Casino logo composition;
5. code-rendered B4GAMBLE text fallback.

Placement-specific chains:

| Requested placement | Fallback chain before logo composition |
| --- | --- |
| `CASINO_DIRECTORY_CARD` | legacy active Casino `HERO` during compatibility only |
| `CASINO_DETAIL_HERO` | `CASINO_DIRECTORY_CARD` → legacy active Casino `HERO` |
| `CASINO_COMPARE` | `CASINO_DIRECTORY_CARD` → legacy active Casino `HERO` |
| `BONUS_LISTING_CARD` | `CASINO_DIRECTORY_CARD` → legacy active Casino `HERO` |
| `BEST_OFFER_FEATURED` | `BEST_OFFER_SECONDARY` → `BONUS_LISTING_CARD` → `CASINO_DIRECTORY_CARD` → legacy Casino `HERO` |
| `BEST_OFFER_SECONDARY` | `BONUS_LISTING_CARD` → `CASINO_DIRECTORY_CARD` → legacy Casino `HERO` |
| `CASINO_OFFER_BLOCK` | `BONUS_LISTING_CARD` → `CASINO_DETAIL_HERO` → legacy Casino `HERO` |
| `OFFER_DETAIL` | `CASINO_OFFER_BLOCK` → `BONUS_LISTING_CARD` → `CASINO_DETAIL_HERO` |

Each candidate is reclassified for the requested placement. An incompatible
ultra-wide candidate resolves to `COMPOSED`, never accidental raw card media.
Archived/inactive assets, inactive assignments and out-of-validity assignments
are skipped. No score, action availability, compensation or user/Programme data
participates in resolution.

## Future Admin UX

Casino and offer editors receive a `Media` section made from semantic slots.
Each slot shows current and effective fallback previews, dimensions, aspect
ratio, MIME type, source/provenance, status, rendering mode, recommended target
ratio and every other assignment using the asset.

Slot actions:

- Upload new asset
- Choose existing asset
- Replace assignment
- Remove assignment
- Preview at desktop/mobile stage sizes
- Change `AUTO` / `COVER` / `CONTAIN` / `COMPOSED`
- Set a focal point only for crop-safe `COVER`
- Activate/deactivate and reorder where the placement is ordered

Removing or replacing an assignment never deletes `MediaAsset`. Permanent asset
deletion remains a separate, confirmed operation and is refused while any
assignment exists.

## Placement aspect-ratio matrix

The values reflect the current B4GAMBLE stages and preserve mandatory promo
copy rather than requiring edge-to-edge crops.

| Placement | Recommended ratio | Minimum practical resolution | Cover safe? | Notes |
| --- | --- | ---: | --- | --- |
| Casino logo | 1:1 transparent-safe canvas | 256×256 | No | Always contain; SVG preferred when controlled |
| Casino directory card | 4:3 | 800×600 | Conditional | Focal point and crop-safe review required |
| Casino detail hero | 16:10 or 16:9 | 1600×1000 | Conditional | Full-width desktop, shallow mobile stage |
| Casino compare | 4:3 | 640×480 | Conditional | Identity and score remain outside media |
| Bonus listing card | 6:5 or 4:3 | 600×500 | Usually no | Current 300×250 partner terms sit at edges; contain or compose |
| Best Offer featured | 4:3 | 1200×900 | Usually no | Large stage; compose banners and preserve terms |
| Best Offer secondary | 4:3 | 800×600 | Usually no | Same source may be reused intentionally |
| Casino offer block | 6:5 or 4:3 | 800×667 | Usually no | Current offer headline may be rendered by UI |
| Offer detail | 16:10 | 1200×750 | Conditional | Only reviewed text-free art may cover |
| Mobile variant | 4:3 | 720×540 | Conditional | Variant of the semantic placement, not `MOBILE_CARD` |

## Non-destructive migration and compatibility contract

1. Finalize enums, typed tables, SQL constraints and resolver contract under the
   4 September 2026 Founder approval.
2. Add the models and additive migration; do not remove current owner fields.
3. Backfill active Casino `LOGO` and `HERO` assets deterministically. Create
   Casino logo/directory/detail/compare assignments and CasinoBonus placement
   assignments that reproduce the current shared-hero output.
4. Record a backfill manifest and compare pre/post effective media for every
   published Casino and offer.
5. Add Admin semantic slots and asset-usage views while retaining current media
   controls during compatibility.
6. Change public projections to the typed resolver behind a kill switch; dual
   read and compare results before enabling assignment-first reads.
7. Run a compatibility period through Preview and Production read-only audits.
8. Stop writing legacy owner selection only after all Admin/public writers use
   assignments. Remove old selection semantics in a later migration, never in
   the initial release.
9. Roll back by disabling assignment-first reads; additive tables and current
   owner fields preserve the previous rendering path.
10. Test FK/check constraints, deterministic ordering, variant fallback,
    archive/unassign behavior, no dangling deletion, all placements and devices,
    action/GEO independence, publication snapshots and rollback.

## Risks and trade-offs

- Typed tables duplicate assignment columns; a shared application schema and
  resolver interface contain that maintenance cost.
- Too many overrides can make Admin state opaque; effective-fallback previews
  and source-step labels are required.
- `COVER` can hide mandatory text; it defaults off for current offer art.
- Variants increase content workload; use `DEFAULT` unless a reviewed mobile or
  desktop override materially improves presentation.
- Publication snapshots contain the assignment and referenced-asset projection;
  live draft assignments must not silently alter a published Casino.

## Founder decision

**APPROVED / ACTIVE — Option C.** The implementation authority is the explicit
4 September 2026 Founder instruction. Options A and B remain above as preserved
alternatives analysis, not current architecture.

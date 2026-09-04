# MEDIA-PRESENTATION-AND-ADMIN-01 Work Record

**Status:** COMPLETE — PRODUCTION VERIFIED

**Evidence date:** 4 September 2026

**Founder authority:** `B4GAMBLE — MEDIA-PRESENTATION-AND-ADMIN-01`

**Branch:** `codex/media-presentation-and-admin-01`

**Base:** `e4c52c984b84ec5d5acbd65413b2ac349ead1345`

## Scope and repository evidence

The active repository was scanned from
`/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. Dependencies,
generated build output, browser artefacts, caches and `tsconfig.tsbuildinfo` were
excluded from source claims. The hotfix uses the current `MediaAsset`, public
DTO and shared commercial-media renderer; it does not add a second media system
or change the database.

Classification in this record uses **DETECTED**, **INFERRED**, **PROPOSED**,
**UNKNOWN** and **CONTRADICTION** as required by the technical evidence rule.

## Original defects

- **DETECTED:** Slotnite's only active controlled HERO is a 320×50 GIF. The
  shared renderer contained it raw inside 210–635px media stages, producing a
  thin floating strip.
- **DETECTED:** four current offer creatives are 300×250 and contain important
  offer/18+ copy at their edges. They are not safe for unconditional crop or
  `object-fit: fill`.
- **DETECTED:** Hello Casino has no active HERO; its active logo is 16×16.
- **DETECTED:** Casino review offer terms used `grid-template-columns: 1fr auto`.
  Long right-column values could reserve intrinsic width and collide with or
  starve the label.
- **DETECTED:** the profile payout mapper joined two distinct Slotnite timing
  strings after whole-string deduplication, repeating the identical “Pending
  review 24–48 hours” clause.
- **CONTRADICTION — corrected by `BONUSES-TOP3-REGRESSION-01`:** PR #142
  treated the existing three-card curated shortlist as incomplete and expanded
  it to all six records. Six is the real published inventory count; the curated
  selector contract is intentionally a maximum of three records at a time.

## Hotfix implementation

- `CommercialOfferMedia` now resolves `CONTAIN` or `COMPOSED` from source
  dimensions. Square/landscape/card creatives show one complete, undistorted
  foreground over a subtle blurred duplicate of the same controlled asset.
- Missing, portrait/tall and ultra-wide assets use a B4GAMBLE code composition
  with the controlled Casino logo/identity and current sourced offer headline.
  An available ultra-wide source remains visible as a secondary element at its
  original ratio.
- Slotnite therefore retains its official 320×50 banner without stretching,
  but the stage obtains comparable visual weight through controlled identity,
  offer copy and layout.
- The media treatment applies to whichever maximum-three records each curated
  selector returns. All six governed records remain in the underlying public
  offer inventory and full directory; none is deleted or unpublished.
- Review term rows use two bounded `minmax(0, …)` columns, start alignment,
  `min-width: 0` and wrapping; existing narrow breakpoints stack the fields.
- Withdrawal timing now splits semicolon-delimited sourced clauses and removes
  duplicate clauses while retaining each distinct factual processing statement.

No asset, score, route, GEO rule, offer amount, CTA authority, public inventory,
raw destination handling, Programme behavior or authentication behavior changes.

## Controlled asset resolution

The read-only database audit detected all eight real Casinos as `PUBLISHED` and
found each latest published snapshot version equal to `Casino.publishedVersion`.

| Casino | Active controlled offer media | Dimensions | Hotfix treatment |
| --- | --- | ---: | --- |
| 21 Privé | `/casino-brands/21-prive/partner-offer.jpg` | 300×250 | `CONTAIN` |
| Skol Casino | `/casino-brands/skol-casino/partner-offer.jpg` | 300×250 | `CONTAIN` |
| Slotnite | `/casino-brands/slotnite/partner-brand.gif` | 320×50 | `COMPOSED`; source retained as secondary strip |
| Hello Casino | no HERO; `/casino-brands/hello-casino/logo.png` | logo 16×16 | `COMPOSED`; no invented art |
| G'day Casino | `/casino-brands/gday-casino/partner-offer.jpg` | 300×250 | `CONTAIN` |
| Diamond7 | `/casino-brands/diamond7/partner-offer.jpg` | 300×250 | `CONTAIN` |

**DETECTED:** no larger controlled Slotnite creative exists in the repository,
current catalog importer, commercial asset manifest or live active `MediaAsset`
rows. The code-rendered composition therefore follows the Founder-approved
fallback order.

## Current Admin media audit

### A — upload a new Casino image

**DETECTED:** yes. An authenticated Admin with `media.manage` can upload JPEG,
PNG, WebP or AVIF through the Casino Builder Media section. The route validates
actual bytes, dimensions, MIME/extension, size, owner and checksum. Production
upload requires the S3-compatible provider; local storage is disabled in
Production.

### B — replace an existing Casino image

**DETECTED:** yes as an additive replacement workflow: upload or select another
asset, make it featured, unlink/archive the old record. Immutable storage keys
prevent overwriting bytes in place. Permanent deletion is separate and guarded.

### C — manageable concepts

- **DETECTED:** logo, favicon, HERO/general Casino image, screenshot, gallery,
  social image and other Casino media are exposed by the Casino Media Manager.
- **DETECTED:** a `BONUS_CREATIVE` selector is exposed in the CasinoBonus editor.
- **DETECTED:** primary `CREATIVE` and `LANDING` `AFFILIATE_CREATIVE` selectors
  are exposed in the AffiliateOffer editor.
- **DETECTED:** there is no Admin slot labelled Best Offer, Casino directory,
  Casino review/detail, compare or mobile placement.
- **DETECTED:** the current public Bonus/Best Offer/detail renderers do not read
  the Bonus/Affiliate selector as a placement. They reuse the projected Casino
  HERO.

### D — separate assignments or reused asset

**DETECTED:** current public surfaces reuse one Casino HERO DTO. Bonus and
Affiliate creative records may have their own nullable owner foreign keys, but
there is no normalized many-placement assignment. `MediaAsset` itself combines
the stored asset record with optional Casino, CasinoCountry, CasinoBonus and
AffiliateOffer ownership.

### E — independent choice by public placement

**DETECTED:** no. Admin cannot independently select media for `/casinos`,
`/bonuses`, `/best-offers`, Casino review, compare and mobile. Public projection
selects the ordered active Casino logo/HERO and the shared offer renderer uses
that HERO.

### F — Admin asset operations

- **DETECTED:** preview, dimensions, file size, storage provider, type, status
  and featured state are shown in the main Media Manager.
- **DETECTED:** archive/restore, drag or button reorder, feature/unfeature,
  selector link/unlink and confirmed deletion of an archived unused asset exist.
- **DETECTED:** unlinking/removing selection does not require deleting the asset.
- **DETECTED:** aspect ratio is not presented as a named/derived Admin field.
- **DETECTED:** the data model supports title, caption, credit, metadata and
  variants; the main metadata editor exposes alt text and caption, not a complete
  provenance editor. Selectors expose less metadata than the main manager.
- **UNKNOWN:** whether every current controlled Casino file has complete rights
  or source documentation outside the repository.

### G — current Production asset source

**DETECTED:** mixed record/delivery architecture for the eight current Casinos:
active `MediaAsset` rows and published snapshots point to versioned root-relative
files under `public/casino-brands`, served from the deployed B4GAMBLE/Vercel
origin. All detected rows use `storageProvider=LOCAL`. The application also
implements an S3-compatible Admin-upload provider.

**UNKNOWN:** live Production S3 environment readiness/configuration. No secret
or provider setting was exposed or inferred from source.

### H — change path

**DETECTED:** changing the currently reconciled root-relative catalog assets
requires the controlled file/catalog/importer path, a commit/deploy and
republishing/reconciliation. A configured Admin object-storage upload can be a
storage + DB + publication operation without a code deploy, but current
Production S3 readiness is **UNKNOWN**. Editing a draft Casino asset alone does
not bypass the immutable published snapshot.

### I — placement-specific Admin UI

**DETECTED:** no. Existing selectors are owner/type selectors, not semantic
public-placement slots.

## Admin capability matrix

| Capability | Current state | Admin UI available | Separate by placement | Requires deploy | Notes |
| --- | --- | --- | --- | --- | --- |
| Casino logo | Active Casino `LOGO` `MediaAsset` | DETECTED — Media Manager | No | Current reconciled file: yes; configured Admin upload: no, but republish required | One projected logo is reused wherever logo is requested |
| Casino directory image | Shared active Casino `HERO` | DETECTED — only as generic HERO | No | Same qualification as Casino logo | No directory-specific selector |
| Casino detail image | Shared active Casino `HERO` | DETECTED — only as generic HERO | No | Same qualification as Casino logo | Same DTO as other offer surfaces |
| Bonus listing image | Public renderer uses Casino `HERO`; separate `BONUS_CREATIVE` owner exists but is not the public placement input | DETECTED — Bonus selector | No public placement | Yes for current reconciled HERO; selector change alone does not change this renderer | Existing Admin capability is not wired as `/bonuses` placement selection |
| Best Offer image | Public renderer uses Casino `HERO`; Affiliate creative selector is not a Best Offer slot | DETECTED — Affiliate CREATIVE/LANDING only | No public placement | Yes for current reconciled HERO; selector change alone does not change this renderer | Media independent of CTA in public renderer |
| Offer detail image | No standalone current placement resolver | DETECTED — Affiliate LANDING selector only | No | Not applicable to a current public placement | No current offer-detail slot |
| Compare image | Shared Casino identity/HERO behavior; no media placement | No | No | Yes if changing the current reconciled shared asset | No compare-specific selector |
| Mobile-specific media | Responsive CSS uses the same source | No | No | Yes if changing the current reconciled shared asset | No device variant or focal point control |

## Current media data model

`MediaAsset` contains the file/storage record, dimensions, alt/title/caption/
credit, order, featured/status, checksum, metadata/variants and nullable owner
relations. A Casino publication copies active media fields into immutable
`CasinoVersion.snapshot`. Public repository projection then chooses the first
ordered logo and HERO. This is typed owner-based media, not placement-based
assignment.

The old `CasinoImage` model also remains in the schema. It is not the detected
input for the current six commercial media presentations.

## Current media flow

```text
Versioned file/importer OR Admin upload
  → MediaAsset owner/type record
  → Casino publish creates immutable CasinoVersion snapshot
  → public repository selects Casino logo + HERO
  → PublicOfferDTO reuses Casino HERO
  → Bonuses / Best Offers / Casino review renderer
```

**CONTRADICTION:** `docs/media-manager.md` preserves its original phase note
that migration `0009_media_manager` was not applied by that phase. The current
schema, routes, Admin components and live rows prove the Media Manager model is
now present. The phase-history statement is not current deployment evidence.

## Future placement-based architecture

The detailed, non-authoritative proposal is
[RFC-040 — Placement-Based Media Assignments](../06_RFC/RFC-040-Placement-Based-Media-Assignments.md).
It recommends typed assignment tables (Option C), a shared deterministic
resolver, semantic placements, `DEFAULT`/`DESKTOP`/`MOBILE` variants,
`AUTO`/`COVER`/`CONTAIN`/`COMPOSED`, Admin slots, aspect targets and a
non-destructive compatibility/backfill plan.

**PROPOSED — AWAITING FOUNDER DECISION:** no placement schema, migration,
backfill or Admin slot implementation is included in MEDIA-PRESENTATION-AND-ADMIN-01.

## Verification and release evidence

Local checks detected at implementation time:

- `npm run typecheck` — passed.
- targeted Node regression suite — 33/33 passed.
- `npm run build` — passed; missing local auth/database warnings in the first
  environment-free build did not fail compilation.
- read-only live database media audit — eight expected/eight detected published
  Casinos; current asset dimensions and snapshot versions matched.
- focused 430px browser typography regression — passed after the corrective
  mobile caption floor was raised from 11px to 12px.

Release evidence:

- Implementation PR: [#142](https://github.com/AlexG-7BE/sevenbet-next/pull/142),
  merged as `934f8b0de4bd005af3c5d1c05b4379f554d5dca1`.
- Corrective typography PR:
  [#143](https://github.com/AlexG-7BE/sevenbet-next/pull/143), manually merged
  only after all required checks were green, as
  `afb859ae5cd1efbf2d131983405f99d804f1c9b1`.
- Authoritative corrective CI run:
  [33838100888](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33838100888)
  — Agent Core, Database / Migration Verification, Quality, Build / Browser,
  Vercel and Vercel Preview Comments all passed. Build / Browser passed in
  16m14s and included the repository typography browser suite.
- Final corrective Preview deployment: GitHub deployment `6258095058`,
  `https://sevenbet-next-chx9dqv4q-alexg-7bes-projects.vercel.app`, success.
- Preview visual acceptance: `/bonuses`, `/best-offers`, Slotnite Casino review
  hero and Material Terms were accepted at 390, 430, 768, 1024, 1280 and
  1440 CSS pixels. All six governed Bonus records remained in the underlying
  inventory and all eight Casino review routes remained available; CTA, GEO and
  Programme authority checks passed.
- Primary Production deployment `6257732365` was accepted at all six required
  widths before the isolated 1px typography correction. The final corrective
  Production deployment `6258257627`, for merge
  `afb859ae5cd1efbf2d131983405f99d804f1c9b1`, completed successfully at
  `https://sevenbet-next-6jg6szeqt-alexg-7bes-projects.vercel.app`.
- Final MEDIA-PRESENTATION-AND-ADMIN-01 canonical Production smoke against
  `https://b4gamble.com` passed 4/4 browser scenarios in 1.8m. Its simultaneous
  six-card curated Bonuses assertion was subsequently classified as a
  regression by `BONUSES-TOP3-REGRESSION-01`; the media, Best Offers, review,
  CTA, GEO and Programme results remain valid.

The implementation PR was merged earlier than intended when the repository's
GitHub configuration treated the then-visible checks as mergeable after an
auto-merge request. Its later CI exposed only public type-floor failures in the
new renderer. Those failures were corrected through separate PR #143; no direct
commit to `main` or unreviewed Production edit was made.

Visual evidence (the two Bonuses captures preserve the historical six-card
regression and are not evidence of the corrected curated cardinality):

- [Bonuses desktop](../02_Product_Design/qa/media-presentation-and-admin-01/bonuses-1440.png)
- [Bonuses mobile](../02_Product_Design/qa/media-presentation-and-admin-01/bonuses-390.png)
- [Best Offers desktop](../02_Product_Design/qa/media-presentation-and-admin-01/best-offers-1440.png)
- [Slotnite composed hero desktop](../02_Product_Design/qa/media-presentation-and-admin-01/slotnite-hero-1440.png)
- [Slotnite composed hero mobile](../02_Product_Design/qa/media-presentation-and-admin-01/slotnite-hero-390.png)
- [Material Terms desktop](../02_Product_Design/qa/media-presentation-and-admin-01/slotnite-terms-1440.png)
- [Material Terms mobile](../02_Product_Design/qa/media-presentation-and-admin-01/slotnite-terms-390.png)

## Release status

- MEDIA-PRESENTATION-AND-ADMIN-01 hotfix: **COMPLETE — Production verified**
- Current Admin audit: **COMPLETE**
- Placement-based media architecture: **PROPOSED — AWAITING FOUNDER DECISION**

# RFC-043 — Production Media Pipeline

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 8 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE
FOUNDER-AUTHORIZED EXECUTION — MEDIA-GEO3 / PRODUCTION MEDIA PIPELINE
HARDENING`, SHA-256
`ac242ed0ae6a5c24549a319b21f86c00b46529e9d65b0c2d109ce9b357608067`.

## Decision

B4GAMBLE Media Operations has one deterministic Production path from validated
creative evidence to an atomic media revision. The existing ingest, analyze and
draft-apply operations retain their meanings. A separately named orchestration
operation may publish only when exact Casino and offer identities, commercial
authority, targeting, format, media validity and conflict preflight all pass.

Media never creates commercial authority. An active exact `MarketActivation`,
the selected `AffiliateOffer`/`CasinoBonus`, trusted request GEO and the existing
jurisdiction/legal controls remain prerequisites for promotional rendering.
Programme, pause, Help and sensitive data are outside this pipeline.

## Evidence and reference lock

- **DETECTED:** Production and repository `main` were both
  `8ef2afa4d027fee3d43c8330be9cf5f78bd48ae8` before this workstream.
- **DETECTED:** the Production database had migrations `0001` through `0032`
  applied, no duplicate active media slots and no duplicate live asset-checksum
  groups.
- **DETECTED:** GEO2 has six typed first-party/hosted assignment tables, safe
  first-party byte inspection, checksum-derived storage, exact hosted-provider
  adapters and serialized draft apply/rollback. It has no Production media
  revision or creative-family entity.
- **DETECTED:** the 21 Privé public review at 1440 px used a 484×600 right-media
  region; at 390 px it used 375×190. The right region suppressed a matching
  300×250 promotion and showed the logo composition. Directory cards used a
  1281×292 horizontal layout with no commercial image slot.
- **DETECTED:** the current exact 21 Privé offer, route and displayed bonus all
  bind the same active offer and `CASINO-COMMERCIAL-VISIBILITY-03` evidence
  identifies its 300×250 first-party asset as the exact current-offer creative.
- **DETECTED:** the same release evidence establishes exact current-offer art
  for Diamond7 and Gday, but classifies Skol and Slotnite art as generic. A
  bounded backfill may link only the exact-evidence records.

The visual reference lock is the current accepted public Casino profile and
directory system. MEDIA-GEO3 preserves typography, colour, disclosure, CTA and
responsive structure. It changes only media choice and the bounded directory
offer slot. Promotional art is intrinsically sized with `object-fit: contain`;
brand art may use `cover` only with explicit crop-safety evidence.

## Placement registry

One code registry is authoritative for every public placement. It defines
allowed subjects, accepted media types, observed presentation geometry,
industry-compatible formats, minimum usable dimensions, device preference,
rendering modes, animation/crop policy, safe-area rule, promotion policy,
exact-offer requirement and fallback chain. Backend validation/planning and
public presentation consume the same registry.

`CASINO_REVIEW_RIGHT_HERO` is added as an offer-scoped commercial surface.
Its observed desktop container is portrait/near-square rather than a stale
16:9 hero assumption. Its preferred promotion is a 300×250, 336×280 or 250×250
card; compatible exact-offer mobile/wide inventory may be contained. Its safe
fallback is non-promotional Casino brand art and then logo/B4 composition.

`CASINO_DIRECTORY_CARD` supports two governed subject roles: an exact-offer
promotion in the bounded commercial slot, or Casino identity/brand fallback.
It is never a generic affiliate-banner sink.

## Creative sets and variants

`MediaCreativeSet` is the durable campaign family. It binds one Casino, an
optional exact `AffiliateOffer` and `CasinoBonus`, purpose, lifecycle, stable
identity key and optional provider/campaign identifiers. Promotional sets
require an exact offer. Identity sets cannot masquerade as promotions.

`MediaCreativeVariant` binds the set to exactly one first-party `MediaAsset` or
one `PartnerHostedCreative`, one placement/device variant and independent
country/language scope. Language state is explicit: `EXPLICIT`, `NEUTRAL` or
`UNKNOWN`. It stores rendering, crop, priority, validity, availability and the
owning revision. One physical checksum may support many scoped variants.

The existing six GEO2 assignment tables remain supported compatibility inputs.
New automated Production work writes creative variants; it does not duplicate
the old typed assignment abstraction or remove old records.

## Resolver

`resolveCasinoMedia` is the sole public selection contract. It accepts the
Casino, optional exact offer, placement, trusted country, presentation language,
device, time, commercial authority and prepared candidate context. It returns
the chosen asset plus normalized evidence and one of `READY`, `FALLBACK`,
`MISSING`, `CONFLICT` or `BLOCKED`. Public components render the result and do
not implement fallback policy.

For promotional media belonging to the exact selected offer, targeting order
is exactly:

1. exact country + exact language;
2. exact country + language-neutral;
3. global + exact language;
4. global + language-neutral; and
5. no promotion.

`UNKNOWN` never occupies a neutral bucket. Wrong-country and other-language
promotions are ineligible. Within a targeting bucket, exact device wins before
`DEFAULT`; format suitability and explicit numeric priority then apply. If two
candidates remain equal on every explicit rule, the result is `CONFLICT`; row
or object order and UUIDs are not tie-breakers.

The review-right hero and directory card first resolve promotion only from the
exact `AffiliateOffer` shown and routed on that surface. A different offer from
the same Casino is ineligible. Missing/blocked/inactive/future/expired media,
an inactive/future/expired offer, absent commercial authority or informational
disposition ends promotional resolution and invokes non-promotional brand/logo
fallback. Casino brand fallback excludes assets marked or detected as offer
creative.

## Revision, preflight and rollback

`MediaRevision` is a complete intended switch for one exact Casino/offer scope.
Variants are prepared inactive. `MediaPreflightEntry` persists every requested
country/language/device/placement decision, chosen source, hashes/identifiers,
status and blocker. A revision with `CONFLICT` or `BLOCKED` entries cannot
activate automatically.

Activation revalidates referenced database state and executes in one
Serializable transaction: lock scope, preserve the active revision as
`previousRevisionId`, deactivate its variants, activate all prepared variants
and mark the new revision active. No old assignment or asset is removed before
the switch. A failure rolls the transaction back and leaves the previous
revision live.

Rollback is one serialized operation. It deactivates the current revision,
reactivates its recorded previous known-good revision and variants only after
every recorded source/hash is still available, and records the rollback
result. An incomplete predecessor aborts the whole transaction and leaves the
current revision live. Originals, hashes, preflight and audit evidence are
retained.

## Automated orchestration and identity

The explicit orchestration sequence is ingest → analyze → exact-identity check
→ set/variant preparation → deterministic preflight → atomic activation →
verification. It is idempotent by a Founder-supplied batch/idempotency key and
returns the prior result when the payload fingerprint matches. Key reuse with a
different payload fails.

Automatic activation requires explicit canonical Casino ID and exact offer ID
for promotion. Deterministic parsing/analysis may propose identities for the
existing review flow but cannot grant Production activation. Filename, visual
similarity, provider, country or language alone cannot establish an offer.

The two Production mutation tools require the separately consented
`media:production_write` OAuth scope and the Production runtime. Existing
`media:safe_write` remains draft-only; `media:read` remains read-only. All Media
scopes still require the exact Media resource, a current delegated staff
identity and `media.manage`. Preview cannot execute a Production revision
mutation.

First-party files retain server-authoritative signature/MIME, decoded dimension,
size, animation and SHA-256 validation. Checksum-derived storage reuses exact
bytes. Partner-hosted media retains RFC-041 isolation, destination binding and
no-pixel-inspection rule; only active validated/verified available records are
eligible. The review hero and directory card accept a hosted image but not an
isolated executable embed; existing embed-capable offer placements retain that
separate renderer. A hosted image has a first-party identity fallback if its
visitor-browser request fails. A new hosted failure cannot deactivate the
current revision.

## Migration and rollout

Migration `0033_media_geo3_pipeline` is additive. It adds the placement and
pipeline enums/tables, relational checks, foreign keys, resolver indexes and
active-scope uniqueness guards. It changes no existing row and drops no
column/table.

Rollout follows expand → deploy compatible reader/writer → bounded idempotent
backfill → verify. The old application can run after schema expansion because
no new enum value is inserted before the compatible application is live.
Backfill uses only the exact governed commercial-visibility catalog evidence;
generic or ambiguous art remains untouched. Application rollback leaves the
additive schema/data in place and returns traffic to the previous Ready
deployment.

## Supersession

This RFC supersedes RFC-040/RFC-041 only for public promotional targeting order,
review-right-hero policy, exact-offer directory policy, automatic Production
Media authority and `UNKNOWN` fallback. Their typed ownership, provider
isolation, safe rendering and destination controls remain active. RFC-042
remains the sole commercial authority; media presence never replaces it.

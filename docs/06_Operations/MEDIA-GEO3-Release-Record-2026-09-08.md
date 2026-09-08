# MEDIA-GEO3 Production Release Record — 8 September 2026

- **Execution date:** 8 September 2026
- **Authority:** explicit Founder instruction `B4GAMBLE FOUNDER-AUTHORIZED
  EXECUTION — MEDIA-GEO3 / PRODUCTION MEDIA PIPELINE HARDENING`, SHA-256
  `ac242ed0ae6a5c24549a319b21f86c00b46529e9d65b0c2d109ce9b357608067`
- **Authority clarification:** explicit Founder instruction `B4GAMBLE FOUNDER
  DECISION — RFC-042 AUTHORITY CLARIFICATION AND EXECUTION APPROVAL`, SHA-256
  `140d37d62098834d98d3796a183a084d40cc3d92814855ad6cc061ec5969f5f1`
- **Governing RFCs:** [RFC-042](../06_RFC/RFC-042-Canonical-Market-Activation-Authority.md)
  and [RFC-043](../06_RFC/RFC-043-Production-Media-Pipeline.md)
- **Application pull requests:**
  [#198](https://github.com/AlexG-7BE/sevenbet-next/pull/198),
  [#199](https://github.com/AlexG-7BE/sevenbet-next/pull/199),
  [#201](https://github.com/AlexG-7BE/sevenbet-next/pull/201),
  [#202](https://github.com/AlexG-7BE/sevenbet-next/pull/202) and
  [#203](https://github.com/AlexG-7BE/sevenbet-next/pull/203)
- **Verified Production runtime baseline:**
  `3f5dbb93b9008899c737a730a470152868ebe62a`
- **Verified Production deployment:** `dpl_2LcUXp7119j9RH8Q5ehyEu66cdca`
- **Canonical Production URL:** `https://b4gamble.com`
- **Release status:** **COMPLETE**

This record contains no secret value, raw affiliate destination, visitor data
or Programme data. Claims are classified as **DETECTED**, **INFERRED**,
**PROPOSED**, **UNKNOWN** or **CONTRADICTION**.

## Outcome

**DETECTED:** MEDIA-GEO3 is active in Production. It provides a single
deterministic path from validated exact-offer media to prepared variants,
persisted preflight, an atomic active revision and a retained rollback
predecessor. The public review-right hero and Casino directory offer slot both
consume the same exact-offer resolution contract.

**DETECTED:** the bounded Production backfill activated exactly three current
offer creative families: Diamond7, G'day Casino and 21 Privé. Each family has
one `CASINO_REVIEW_RIGHT_HERO` variant, one `CASINO_DIRECTORY_CARD` variant and
four persisted preflight cells. No generic Skol/Slotnite art, ambiguous media,
raw destination or destructive write entered the release.

**DETECTED:** the public directory now obtains canonical routes from the
RFC-042 `MarketActivation` runtime, including its healthy `ZZ` global fallback.
It no longer reconstructs CTA authority from legacy programme, workflow,
offer, link or redirect lifecycle fields. No replacement decision layer was
added.

## Authority boundary

**DETECTED:** RFC-042 remains the sole B4GAMBLE-owned canonical public CTA
authority. A healthy active `MarketActivation` supplies the exact Casino,
CasinoBonus, AffiliateOffer and governed redirect relationship used by the
directory, comparison and review consumers.

The following controls remain independent of that internal authority and were
preserved:

- trusted request GEO and the canonical global-fallback block list;
- external jurisdiction and legal controls, including the GB operator gate;
- safe public redirect-slug and safe-URL validation;
- relational subject/offer/bonus integrity;
- external route health and controller-recorded blockers; and
- media validity, targeting, exact-offer ownership and conflict preflight.

**DETECTED:** media does not create CTA authority. Legacy lifecycle state may
still make promotional media stale or misleading and therefore ineligible for
display under RFC-043, but it is not an independent public CTA veto. Upstream
expiry, block or route failure affects CTA availability after the canonical
controller records the corresponding `MarketActivation` state.

## Media architecture

**DETECTED:** PR #198 added the active RFC-043 architecture:

- one placement registry shared by backend planning and public presentation;
- `MediaCreativeSet`, `MediaCreativeVariant`, `MediaRevision` and
  `MediaPreflightEntry` as additive durable entities;
- exact country/language/device targeting with `UNKNOWN` excluded from neutral
  fallback;
- exact device before `DEFAULT`, deterministic suitability/priority and a
  fail-closed conflict result instead of row-order selection;
- Serializable activation and rollback with the previous revision retained;
- separately scoped Production orchestration and rollback Media MCP tools;
- first-party checksum/source validation and retained partner-hosted isolation;
  and
- brand/logo fallback that cannot recycle known offer art as identity media.

**DETECTED:** public components render the resolved contract. They do not
implement a second fallback or CTA policy. The three released promotions are
first-party 300×250 assets rendered with `object-fit: contain`; each creative
anchor uses the same canonical `/r/{slug}` as its adjacent governed CTA.

## Database migration and backfill

**DETECTED / APPLIED:** additive migration
`0033_media_geo3_pipeline` has immutable SHA-256
`39c7a672dc04dd1a4777b04db630a11d0c9403c7b07060e7db77b0a62970816e`.
It changed no existing row and dropped no table, column or constraint.

The fingerprint-guarded Production execution targeted database fingerprint
`83dd8c5faf8c989a2bec0d59f9bfd8aa93e725d0cfa48b43453887583ebcc5f8`.
Provider backup evidence showed a verified 8.15 MiB Prisma snapshot from
8 September 2026 plus seven earlier retained snapshots before the mutation.

Postflight and every later Production build verified:

- 33 completed repository migrations, zero unresolved attempts and exactly one
  effective checksum-matched 0033 attempt;
- four new creative/revision/preflight tables and eight physical uniqueness
  indexes;
- `CASINO_REVIEW_RIGHT_HERO` in the placement enum;
- zero invalid sets, variants or preflight rows; and
- zero duplicate active revisions or duplicate active placement scopes.

| Casino | Creative set | Active revision | Variants | Preflight cells |
| --- | --- | --- | ---: | ---: |
| Diamond7 | `348f598f-0229-5223-a3ed-5185a6ffc957` | `0c8ec5c3-3906-56b4-86b2-a240f948b75f` | 2 | 4 |
| G'day Casino | `1ac028e3-2891-5feb-a006-09c12890f16a` | `c6b41f70-8a93-5863-b149-c09310559c03` | 2 | 4 |
| 21 Privé | `ddda2ffd-4ffb-58e1-ad35-4fa265880693` | `5a8e0f7a-c991-51df-9414-415887501ff0` | 2 | 4 |

**DETECTED:** immediate replay returned all three existing results unchanged.
Final verification reports three active catalog sets, six active variants, 12
preflight cells, zero generic promoted creatives, zero raw destinations and
zero destructive writes.

The final read-only Production inventory retained 40 Casinos, 40 CasinoBonuses,
14 AffiliatePrograms/Offers, 97 AffiliateTrackingLinks, 14 RedirectSlugs, 11
MarketActivations, 19 first-party MediaAssets and 251 PartnerHostedCreatives.
Typed placement assignment counts were `30 / 20 / 0` for Casino, CasinoBonus
and AffiliateOffer; hosted assignment counts were `16 / 0 / 79`.

## Release path

| PR | Merge SHA | Result |
| --- | --- | --- |
| #198 | `49869bc28f4612866f8e433e40bb465ed7b77f76` | RFC-043 pipeline, migration, resolver, Production tools and first public integration |
| #199 | `7d55e4e25d1951618bf144a14ffd788608e55a71` | physical PostgreSQL truncation-safe index verification |
| #201 | `46f5ab267f832dc805aba995157d35f2a9ed86e1` | canonical RFC-042 directory/comparison route projection |
| #202 | `ad172fa56463eb69af18b42168bc9f391820ae30` | review-right responsive picture and containment correction |
| #203 | `3f5dbb93b9008899c737a730a470152868ebe62a` | directory-card mobile grid, picture box and full creative click boundary |

**DETECTED:** PR #198 exact-head CI run
[34208724909](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34208724909),
PR #199 run
[34210851500](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34210851500),
PR #201 run
[34215312940](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34215312940),
PR #202 run
[34218508312](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34218508312)
and PR #203 run
[34221543631](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34221543631)
all passed Agent Core, Quality, Database / Migration Verification, Build /
Browser and Vercel on their unchanged heads. Main runs
[34210535885](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34210535885),
[34212449065](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34212449065),
[34216884894](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34216884894),
[34220022729](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34220022729)
and [34223025760](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34223025760)
provide the corresponding post-merge evidence.

The Production deployment sequence was fail-closed:

- `dpl_MPFFVtMozupHcRrB9J9Kj74CW7XA` for #198 stopped before promotion when
  read-only postflight expected the logical name of a PostgreSQL index whose
  physical identifier had been truncated to 63 bytes. #199 corrected only the
  verifier; `dpl_AqBiLwZX1NKhdS2ZCt3yL2FWRv48` then deployed Ready.
- `dpl_CQ4jzuVPUDmbRCT8AafVfn3Ce7wt` deployed the canonical directory fix.
- `dpl_ABmMzJVYRsJMCkwZ1En9XwAce22q` for #202 stopped before promotion when
  the unrelated legacy catalog bootstrap exceeded its five-second publish
  transaction. Exact-SHA normal retry
  `dpl_GrnfwjGqRkGLHmUsNXqNciFzXv8J` completed and promoted.
- final #203 deployment `dpl_2LcUXp7119j9RH8Q5ehyEu66cdca` completed from
  exact merge SHA `3f5dbb9`, passed read-only 0033 readiness and promoted the
  canonical aliases.

At every contained failure the preceding Ready Production deployment remained
live. Neither failure rolled back or partially reapplied migration 0033.

## Production acceptance

**DETECTED:** canonical authority and database audits found all three exact
Casinos with one current published/active CasinoBonus, one exact active
AffiliateOffer and one healthy active global `MarketActivation`. Each
activation binds the expected redirect and independently retains the detected
`CL`, `DK`, `ES`, `FI`, `GB`, `NO` and `SE` global-fallback block list.

**DETECTED:** the service projection for trusted market `KZ` returned all three
cards as `PROMOTABLE`, with the canonical redirect, `EXACT_OFFER` media source,
the expected first-party asset and `CONTAIN` rendering. The review-right hero
resolved the same exact offer and route.

Browser acceptance produced the following physical evidence:

- at 390×844, every review hero, media canvas, picture and image stayed inside
  the 375×190 hero with a block picture wrapper, `contain`, no crop and no page
  overflow;
- at 1440×900, every review hero was 484.4×600 with a 445.6×552 contained
  canvas/picture/image and no page overflow;
- at 390×844, directory links were 110 px wide and 230–247 px high, owned the
  complete media box, preserved the natural 300×250 creative through
  `object-fit: contain` and produced no horizontal overflow; and
- desktop directory links were 96×176, fully contained and bound to the same
  canonical `/r/21-prive-welcome`, `/r/gday-casino-welcome` and
  `/r/diamond7-welcome` routes.

## Tests

**DETECTED:** focused local acceptance passed 16 MEDIA-GEO3 tests, 97 commercial
creative/placement tests, 149 Programme tests, 43 Agent Core checks, lint,
typecheck, build and diff checks. The real-stylesheet Playwright regressions
lock both review-right and directory-card geometry. Disposable PostgreSQL CI
also exercises staged migration, replay, uniqueness/conflict rejection,
Serializable activation, rollback and one-connection reliability.

The complete PR browser job passed at every required responsive width and the
post-merge main job reran the same matrix from the merge commit.

## Rollback

Application rollback promotes the last known-good Ready deployment; additive
0033 remains compatible and is not dropped. Media data rollback is the
RFC-043 serialized operation: revalidate and atomically reactivate the recorded
previous revision under the scope lock. If no valid predecessor exists,
deactivate only the affected active variants so the public resolver falls back
to brand/logo media. Assets, hashes, preflight rows and audit evidence remain
retained. No reverse SQL, table drop or destructive reset is part of rollback.

## Remaining issues

**DETECTED, PRE-EXISTING:** the Production `casino-real-catalog-03` build
preflight republishes or updates unrelated catalog Casinos on ordinary
deployments. It creates content-hash churn and caused the first #202 Production
attempt to exceed its publish-transaction timeout. MEDIA-GEO3 neither created
nor silently changed that bootstrap behavior; it should be made convergent in
a separately governed workstream.

**DETECTED, PRE-EXISTING:** GitHub reports four high and two moderate default-
branch dependency alerts. This release changed no dependency and did not widen
their exposure.

No remaining issue blocks the bounded MEDIA-GEO3 Production release.

## Final state

**DETECTED:** MEDIA-GEO3 is complete in Production. Migration, bounded data,
canonical CTA authority, independent safety controls, both governed visual
surfaces, CI, rollback evidence and final runtime verification all passed.

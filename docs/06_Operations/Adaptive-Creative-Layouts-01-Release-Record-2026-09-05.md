# ADAPTIVE-CREATIVE-LAYOUTS-01 Release Record — 5 September 2026

**Status:** COMPLETE — exact-head Preview, post-merge CI and Production
acceptance passed

**Founder authority:** `B4GAMBLE — ADAPTIVE-CREATIVE-LAYOUTS-01`

**Starting `origin/main`:**
`d8198dcc3bd6d4dd37e70a524d1bc4d0775828b2`

**Implementation branch:** `codex/adaptive-creative-layouts-01`

**Implementation pull request:**
[#155](https://github.com/AlexG-7BE/sevenbet-next/pull/155)

**Accepted implementation head:**
`d700b9f51766759a5e60f6e879fc0e21768b2181`

**Implementation merge:**
`f97f608eac7cdf87d1e72a0f69128bc8b15039a7`

**Accepted Preview:** GitHub deployment `6276250107`; Ready at
`https://sevenbet-next-m5rl4yzhs-alexg-7bes-projects.vercel.app`

**Accepted Production:** GitHub deployment `6276379208`; Ready at
`https://sevenbet-next-eq48v358z-alexg-7bes-projects.vercel.app`

**Production origin:** `https://b4gamble.com`

This record contains no credential, affiliate identifier, raw partner
destination, visitor data or Programme data. Claims are classified as
**DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or **CONTRADICTION** under
the repository technical-evidence rule.

## Executive result

**DETECTED:** common commercial creatives now retain their physical character
without changing RFC-040's semantic placement model. Cards stay cards; mobile
landscape assets remain compact; strips and wide assets occupy deliberate
bands; high-resolution brand art alone may fill a review hero; brand and logo
fallbacks remain compact and inert.

**DETECTED:** `COMPOSED` no longer means “hide the assigned creative.” The
creative's presentation family controls the media stage, while B4GAMBLE owns
the surrounding disclosure, score, terms and action treatment. No promotional
raster is enlarged beyond its intrinsic dimensions.

## Root design error

**DETECTED:** the former renderer conflated semantic placement with physical
geometry. A single placement-shaped stage attempted to accommodate unrelated
300×250, 320×50, brand-art and logo assets. This created very tall empty panels,
could enlarge standard promos into hero art and allowed composed treatments to
replace rather than present real assigned media.

**DETECTED:** the correction separates the concerns. Existing placement and
variant authority still answers *where* an asset belongs. A pure application
classifier answers *how* the resolved asset may be presented from its media
kind and intrinsic dimensions.

## Presentation families

| Family | Recognized inventory | Runtime treatment |
| --- | --- | --- |
| `CARD` | 300×250, 250×250, 336×280; compatible 180×150 | Native contained card visual |
| `MOBILE_LANDSCAPE` | 320×100, 300×100 | Compact landscape stage |
| `STRIP` | 320×50, 300×50, 468×60 | Deliberate bounded strip band |
| `WIDE` | 728×90, 970×90, compatible 970×250 | Deliberate wide band, never stretched into a card |
| `BRAND_ART` | Valid high-resolution brand imagery | Eligible for bounded review-hero treatment |
| `LOGO_ONLY` | Logo, missing promo or unrecognized fallback | Compact B4GAMBLE-owned, inert identity treatment |
| `PORTRAIT_INVENTORY` | 120×600, 160×600, 300×600 | Recognized but unsupported in these public surfaces |

**DETECTED:** this is presentation metadata only. It does not add size-specific
database placements or change the accepted upload inventory from the governing
commercial-format release.

## Slotnite

**DETECTED — before:** the real 320×50 animated creative was placed inside a
review-hero-shaped composition. Its raster remained small, but the surrounding
stage produced hundreds of pixels of unused vertical panel.

| Width | Former stage | Former GIF | Forced vertical remainder |
| ---: | ---: | ---: | ---: |
| 390 | 375×310 | 256×40 | 270 px |
| 430 | 415×310 | 256×40 | 270 px |
| 768 | 278×1300 | 175.8×27.5 | 1272.5 px |
| 1024 | 376.9×1137 | 236.8×37 | 1100 px |
| 1280 | 449.5×1009 | 309.5×48.4 | 960.6 px |
| 1440 | 510×964.8 | 320×50 | 914.8 px |

**DETECTED — after:** the live Bonus-family presentation is bounded at every
required width. The GIF never exceeds 320×50, the stage contains no forced
dead panel, identity/offer copy occurs once, and the media action is the same
internal governed confirmation route as the CTA.

| Width | Figure | Creative stage | Rendered GIF | Scale | Forced dead panel | Creative action |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 390 | 340×111 | 340×72 | 312×48.8 | 0.975× | 0 | `/outbound/slotnite-welcome` |
| 430 | 380×111 | 380×72 | 320×50 | 1.000× | 0 | `/outbound/slotnite-welcome` |
| 768 | 331.6×121 | 331.6×78 | 295.5×46.2 | 0.924× | 0 | `/outbound/slotnite-welcome` |
| 1024 | 289.2×136 | 289.2×78 | 253.1×39.6 | 0.791× | 0 | `/outbound/slotnite-welcome` |
| 1280 | 366×121 | 366×78 | 320×50 | 1.000× | 0 | `/outbound/slotnite-welcome` |
| 1440 | 414×121 | 414×78 | 320×50 | 1.000× | 0 | `/outbound/slotnite-welcome` |

The difference between stage and GIF dimensions is bounded component padding;
“forced dead panel” means a separate placement-sized blank region such as the
superseded review composition.

**DETECTED — review:** at 390 and 1440 px the promotional GIF is absent from
the hero. The inert identity hero is respectively 390×190 and 490.4×600 with
zero anchors. The governed `CASINO_OFFER_BLOCK` is respectively 340×86 and
618×98; its GIF renders at 312×48.8 and native 320×50. DOM acceptance found one
hero, one offer creative, one identity string and no horizontal overflow.

## Skol Casino

**INFERRED — superseded baseline scale:** the former 300×250 standard promo
filled an approximately 375×310 mobile hero and a 510 px-wide desktop hero,
equivalent to about 1.25× and 1.70× enlargement from the source width.

**DETECTED — final:** the standard promo no longer appears in the hero. In the
offer block it renders at native 300×250 on both 390 and 1440 px viewports
(1.000×), with zero overflow and the internal governed route
`/outbound/skol-casino-welcome`. The Bonus and Best Offers cards also retain
native 300×250 rendering.

## `/casinos`

**DETECTED:** curated cards use the same presentation-family contract and the
Slotnite regression fixture proves a bounded strip treatment across all six
required widths. The live KZ Production response correctly contains no
commercially eligible curated media, so no country header or authority was
spoofed merely to manufacture Production evidence. The global directory and
its eight real review routes remain available and overflow-free.

## `/bonuses`

**DETECTED:** the live three-record shortlist contains two native 300×250
`CARD` creatives and the Slotnite `STRIP`. At 390 px, loaded card images are
300×250 and the strip is 312×48.8. At 1440 px they are 300×250 and 320×50.
Ranks, scores, offer terms, disclosure and CTA behavior are unchanged.

## `/best-offers`

**DETECTED:** the live featured inventory uses two 300×250 card figures plus a
full-width strip band. At 390 px the figures are 340×283.3, 340×283.3 and
340×110 while the rasters remain 300×250, 300×250 and 312×48.8. At 1440 px the
figures are 392×328, 392×328 and 1294×120 while the rasters remain 300×250,
300×250 and 320×50. Every media href is an internal governed route; no raw
external creative href is present.

## Review hero

**DETECTED:** only high-resolution `BRAND_ART` can occupy the visual hero.
Standard promo, strip, card, portrait, tiny-logo and missing-media cases resolve
to compact B4GAMBLE identity treatment. The hero is editorial and inert at all
times. Above 1100 px it is bounded between 480 and 680 px; at 768–1099 px it
stacks at 300 px; mobile uses a 190 px compact identity treatment.

## Casino offer block

**DETECTED:** the actual resolved commercial promo appears here rather than in
the hero. Card, mobile-landscape, strip and wide families receive intentional
stages. Only the actual promo can become interactive, and only through the
existing server-authoritative action contract.

## Clickability contract

**DETECTED:** media visibility grants no action authority. Actual promo media
is wrapped only when the published offer, GEO/legal/contract state and current
governed route all authorize the matching CTA. The first href remains
`/outbound/{slug}`; partner destinations remain behind the existing confirmation
and `/r/` handoff. Logo, brand art, B4 identity, portrait fallback, missing
promo and every blocked state remain inert.

## Hello Casino contradiction

**CONTRADICTION — resolved:** Hello Casino has a valid governed offer action but
no current offer-matched promo, while its only current brand asset is 16×16.
Action authority must not turn that logo or a composed fallback into a promo.
Production now renders the 16×16 logo at intrinsic size in an inert hero and an
inert 618×112 `LOGO_ONLY` offer fallback. Both contain zero media anchors; the
separate visible CTA retains its governed action.

## Admin guidance

**DETECTED:** assignment rows now show expected public presentation alongside
format fit: native card, compact landscape, strip band, deliberate wide band,
high-resolution brand art, compact logo fallback or unsupported portrait. The
existing `DEFAULT`, `DESKTOP` and `MOBILE` controls and independent semantic
placements remain unchanged.

## Visual regression

**DETECTED:** exact-head Preview screenshots and geometry assertions passed at
390, 430, 768, 1024, 1280 and 1440 px. Acceptance covers mixed card/strip
inventory, native-size caps, GIF decoding, no distortion, no horizontal
overflow, no giant blank media panel, non-empty `COMPOSED` rendering, one
identity/offer treatment and 12 px minimum creative captions.

**DETECTED:** one deterministic same-page showcase contains 300×250 and
250×250 cards, 320×100 mobile landscape, 320×50 strip, 728×90 wide and
logo-only fallback together. Each family retains its own geometry and common
typography/spacing; the test does not force identical media-stage heights.

**DETECTED:** Production was rechecked at all six widths on `/bonuses`, at 390
and 1440 px on `/casinos`, `/best-offers`, Slotnite and Skol reviews, and at
all six widths on the 21 Privé review, plus 1440 px on Hello Casino. The 21
Privé review kept an inert `LOGO_ONLY` hero at every width and a native 300×250
governed offer creative at 390 and 1440 px. Responsive and action measurements
matched Preview.

## Product regression

**DETECTED:** the full quality, PostgreSQL migration/data, build and browser
workflow passed on the exact PR head. Targeted suites additionally passed the
presentation classifier, real `COMPOSED` creative, six-width commercial media,
review-hero, clickability, GEO, integrity and stale-expectation contracts.

**DETECTED:** post-release Production smoke returned 200 for `/`, Responsible
Gambling, Privacy, Terms, Self-check, Budget Calculator, FAQ, Casinos and
Bonuses. Read-only Production assignment verification remains 8 Casinos,
6 Bonuses and 46 total RFC-040 assignments: 26 `CasinoMediaAssignment`, 20
`CasinoBonusMediaAssignment` and 0 `AffiliateOfferMediaAssignment`. The eight
populated semantic placement counts and immutable projection all reconcile;
`OFFER_DETAIL` remains at zero assignments.

## Architecture and data boundary

**DETECTED:** there is no Prisma schema, migration, media-asset, publication
snapshot or assignment mutation. RFC-040's three assignment models, semantic
placements, assignment-first resolution, optional `DEFAULT` / `DESKTOP` /
`MOBILE` variants, immutable publication behavior and rollback switch are
unchanged. Presentation families are pure application logic.

**DETECTED:** no remote importer, iframe, partner script, impression pixel, raw
tracking destination, personalisation, Programme data use or new commercial
authority was introduced.

## Controlled release

| Gate | Result |
| --- | --- |
| Targeted format and browser regressions | PASS |
| ESLint | PASS; zero warnings |
| TypeScript | PASS |
| Production build | PASS |
| PR #155 CI | PASS; [run 33939577943](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33939577943) |
| Post-merge CI | PASS; [run 33940334927](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33940334927) |
| Exact-head Preview | PASS; deployment `6276250107` |
| Production deployment | PASS; deployment `6276379208` |
| Six-width Preview comparison | PASS |
| Six-width Production comparison | PASS |
| Read-only Production smoke | PASS; 9/9 routes |
| Read-only RFC-040 assignment verification | PASS; 46/46 assignments |

## Rollback and hold conditions

Application rollback reverts the presentation classifier and layout wrappers.
`PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=false` remains the existing assignment-read
rollback. Neither path deletes media or relationships; there is no schema
rollback.

Any regression involving raster enlargement, a standard promo in the review
hero, an empty `COMPOSED` treatment, a giant dead stage, a raw partner href, or
interactive brand/logo/blocked media returns this release to **HOLD**.

## Final state

**DETECTED:** the accepted implementation is merged and Ready in Production.
The exact-head and post-merge workflows, six-width visual comparison, live
governed-action checks, read-only Production smoke and RFC-040 reconciliation
all passed. This durable record is the final documentation-only release step.

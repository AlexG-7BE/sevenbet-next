# Commercial Creative Format Contract

**Status:** ACTIVE application and presentation contract
**Authority:** `B4GAMBLE — COMMERCIAL-CREATIVE-FORMATS-01` Founder instruction
**Evidence date:** 4 September 2026
**Architecture dependency:** [RFC-040 — Placement-Based Media Assignments](../06_RFC/RFC-040-Placement-Based-Media-Assignments.md)

This contract contains no credential, affiliate identifier, raw partner click
destination, visitor data or Programme data. Claims are classified as
**DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or **CONTRADICTION** under
the repository technical-evidence rule.

## Repository evidence boundary

**DETECTED:** the Git root was confirmed before documentation work. The complete
active worktree was scanned with dependencies, generated output, build
artefacts, caches and `tsconfig.tsbuildinfo` excluded. The pre-documentation
source inventory contained 2,148 files. Implementation claims below derive from
that scan, focused tests, the built application and browser verification.

**DETECTED:** this work does not change `prisma/schema.prisma`, any migration,
RFC-040's three assignment models, its nine semantic placements, its
`DEFAULT` / `DESKTOP` / `MOBILE` variants, publication snapshots, resolver
ordering or rollback switch. Dimensions remain application-level physical
metadata; placements remain business/UI semantics.

## Research method and source quality

**DETECTED:** public research used primary documentation from affiliate
networks, partner platforms and IAB. Authenticated partner-portal inspection was
read-only and is reported only as aggregate format evidence. No account,
tracking-link or campaign identifier is reproduced.

Public sources reviewed:

- [Awin banner sizes](https://success.awin.com/articles/en_US/Knowledge/What-are-the-different-banner-sizes-available) lists desktop and mobile dimensions and GIF/JPEG/PNG/HTML5 support.
- [impact.com image assets](https://help.impact.com/brand/what-would-you-like-to-learn-about/platform-features/ads/create-ads/create-an-image-asset) recommends 728×90, 300×250, 160×600 and 180×150; hosted PNG/JPG/GIF assets are capped there at 1 MB.
- [Rakuten Link Locator reference](https://developers.rakutenadvertising.com/guides/link_locator/reference) enumerates banner size codes and keeps `clickURL`, `imgURL`, `showURL`, width and height as separate fields.
- [Rakuten banner serving](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/10974110225677-Serving-Banners) describes banners as clickable and states that first-party hosting preserves click/sale attribution but loses Rakuten impression reporting.
- [Rakuten image resizing](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/4412186920077-Resize-Image-Links) warns against materially changing proportions.
- [IAB fixed-size specification](https://www.iab.com/wp-content/uploads/2019/04/IABNewAdPortfolio_LW_FixedSizeSpec.pdf) covers 320×50, 728×90, 970×90, 160×600, 300×250 and 970×250.
- [IAB New Ad Portfolio](https://www.iab.com/guidelines/iab-new-ad-portfolio/) supplies the wider responsive/fixed-format context.
- [Partnerize onboarding guidance](https://help.phgsupport.com/hc/en-us/articles/5274612958621-Onboarding-FAQ-s) lists common standard and mobile image sizes.
- [CJ cross-device guidance](https://junction.cj.com/article/craft-your-cross-device-strategy) lists mobile-optimised banner sizes including 250×250, 300×250, 300×50 and 320×50.
- [Income Access affiliate tooling research](https://www.incomeaccess.com/contenthub/marketing-tools-affiliate-success-part-2/) contains direct 300×250 operator-affiliate demand and a warning that heavy banners underperform operationally.
- [Scaleo offer creative overview](https://help.scaleo.io/article/512-offer-page-overview) distinguishes banner, email, HTML and impression-enabled creative types.
- [Scaleo banner documentation](https://help.scaleo.io/article/490-banners) confirms PNG/JPG/GIF static or animated image support, without establishing the cross-network format matrix.
- [Affise creative documentation](https://help-center.affise.com/en/articles/6481671-add-a-creative) distinguishes pictures, remote images and HTML ads and exposes tracking/impression macros for HTML creatives.
- [Affise affiliate creative documentation](https://help-center.affise.com/en/articles/6521567-creatives-affiliates) confirms GIF plus size/weight filtering, but publishes no canonical fixed-size list.
- [Affilka media management](https://affilka.com/features/), [NetRefer platform functionality](https://netrefer.com/system-functionality-platform-add-ons) and [MyAffiliates media management](https://myaffiliates.com/features/media-management/) confirm broad banner/media capability. No authoritative fixed-dimension inventory was detected in those public pages, so they are not counted as evidence for a particular size.

**DETECTED — current partner portals:** the Superfly Scaleo tenant exposed 29
current Diamond7 banners: four 160×600; five each at 250×250, 300×250,
320×50, 320×100 and 728×90; 26 JPG and three GIF. The current Betsson Group
Affiliates portal exposed Betsafe Baltics material at 120×600, 160×600,
300×100, 300×250, 300×600, 320×50, 320×100, 728×90 and 970×250.

## Observed format matrix

Frequency is deliberately qualitative. **Very common** means repeated across
broad-network/standards evidence and current partner inventory; **common** means
repeated across multiple independent sources; **established** means supported
by authoritative evidence but less frequently observed. It does not mean every
network supplies the format.

| Format | Networks / standards detected | Desktop/mobile | Frequency |
| --- | --- | --- | --- |
| 300×250 | Awin, impact.com, Rakuten, IAB, Partnerize, CJ, Income Access, Superfly, Betsson | both | very common |
| 250×250 | Awin, Rakuten, CJ, Superfly | both | common |
| 320×50 | Awin, IAB, Partnerize, CJ, Superfly, Betsson | mobile | very common |
| 320×100 | Awin, Superfly, Betsson | mobile | common |
| 728×90 | Awin, impact.com, Rakuten, IAB, Partnerize, Superfly, Betsson | desktop/wide | very common |
| 160×600 | Awin, impact.com, Rakuten, IAB, Partnerize, Superfly, Betsson | desktop inventory | very common |
| 300×600 | Awin, Rakuten, IAB, Partnerize, Betsson | desktop inventory | very common |
| 970×250 | Awin, IAB, Betsson | desktop/wide | common |
| 970×90 | Awin, IAB | desktop/wide | common |
| 336×280 | Awin, Rakuten | both | common |
| 468×60 | Awin, Rakuten, Partnerize | desktop/wide | common |
| 120×600 | Awin, Rakuten, Betsson | desktop inventory | common |
| 300×100 | Betsson | mobile-compatible | established |
| 300×50 | Awin, IAB, Partnerize, CJ | mobile | common |
| 180×150 | impact.com, Rakuten, IAB | both | established |

## B4GAMBLE registry

**DETECTED:** `lib/media/commercial-formats.ts` is the single deterministic
registry. Each entry stores dimensions, aspect ratio, family, device
suitability, tier and observed frequency. Placement assessment returns
`PREFERRED`, `COMPATIBLE`, `POOR_FIT` or `UNRECOGNIZED`; the last two warn but do
not block a security-valid Admin assignment.

| Tier | Registered formats | Current meaning |
| --- | --- | --- |
| Core | 300×250 | default desktop commercial card |
| Square | 250×250 | first-class square fallback |
| Mobile | 320×100, 320×50 | native mobile override formats |
| Wide | 728×90 | deliberate desktop-wide offer treatment |
| Supported inventory | 160×600, 300×600 | valid reusable library inventory; no sidebar is created |
| Compatibility | 970×250, 970×90, 336×280, 468×60, 120×600, 300×100, 300×50, 180×150 | accepted, classified and retained for deliberate/future use |

**DETECTED:** registry support is not a promise of a current public placement.
No sidebar/ad directory and no standalone `OFFER_DETAIL` page is created.

## Commercial and editorial boundary

**DETECTED:** automatic governed click treatment is limited to
`BONUS_LISTING_CARD`, `BEST_OFFER_FEATURED`, `BEST_OFFER_SECONDARY`,
`CASINO_OFFER_BLOCK`, and future `OFFER_DETAIL` only if a real surface is built.
`CASINO_LOGO`, `CASINO_DIRECTORY_CARD`, `CASINO_DETAIL_HERO` and
`CASINO_COMPARE` remain operator/editorial media and do not become affiliate
links through this contract.

**DETECTED:** Casino review hero, Casino directory, comparison, Editor Score,
rank, terms, responsible-gambling context and editorial copy remain separate
from the commercial creative. The offer block may contain a partner creative;
the review hero does not become an ad.

## Placement compatibility

| Placement | DEFAULT/DESKTOP | MOBILE | Current rendering rule |
| --- | --- | --- | --- |
| `BONUS_LISTING_CARD` | 300×250 preferred; 250×250 and 336×280 compatible | 320×100 or 320×50 preferred; DEFAULT card fallback allowed | native ratio, contain, composed fallback for unsuitable sources |
| `BEST_OFFER_FEATURED` | 300×250 preferred; 250×250 and 336×280 compatible | 320×100 or 320×50 preferred | controlled B4GAMBLE card around a natural-size creative; no stretched leaderboard |
| `BEST_OFFER_SECONDARY` | 300×250 preferred; 250×250 and 336×280 compatible | 320×100 or 320×50 preferred | same deterministic card/mobile contract |
| `CASINO_OFFER_BLOCK` | 300×250 card or deliberate 728×90 wide preferred; 250×250/336×280 and registered wide compatibility accepted | 320×100 or 320×50 preferred | card and wide family selectors reserve intentional geometry |
| `OFFER_DETAIL` | future 300×250 preferred; square/large rectangle/wide compatible | future 320×100 or 320×50 | contract only; no public route |

**DETECTED:** `DEFAULT`, optional `DESKTOP` and optional `MOBILE` remain
independent RFC-040 assignments. Missing `MOBILE` deterministically falls back
to `DEFAULT`; assigning one surface does not mutate another.

## Upload and GIF contract

**DETECTED:** commercial upload acceptance is separate from placement
compatibility. A security-valid 250×250 or 320×50 asset is no longer rejected by
the former arbitrary 300×150 minimum. Existing configured upload and 8,000 px
dimension ceilings remain unchanged. SVG remains rejected.

**DETECTED:** accepted raster MIME types are JPEG, PNG, WebP, AVIF and GIF. GIF
acceptance requires an exact `.gif` extension, declared `image/gif`, a GIF87a or
GIF89a signature, non-zero logical dimensions, bounded colour tables, valid
extension structure, in-bounds frames, legal LZW code size, a decodable bounded
LZW stream whose pixel count matches every frame, a trailer and no trailing
payload. Truncated, malformed, spoofed and oversized inputs fail before
storage.

**DETECTED:** validated GIF bytes bypass metadata re-encoding and variant
generation. This preserves every frame and its timing; an animated file is not
silently flattened. The service stores MIME, width, height, byte size,
`animated`, and frame count where detected. PNG, WebP and AVIF animation flags
are detected from their existing container metadata without broadening public
execution formats.

## Performance contract

**DETECTED:** every public commercial image has intrinsic width/height and uses
`contain` unless the existing explicit crop-safe `COVER` contract applies.
Lower commercial media remains lazy-loaded. A mobile override creates a native
320×100 or 320×50 stage rather than a thin strip inside a 300×250 box.

**DETECTED:** Admin warns above 1 MiB and escalates the wording above 3 MiB. The
configured hard upload ceiling is not lowered. The warning threshold is an
operational signal, not a claim that every network has the same cap.

**DETECTED — before/after:** this release changes no public assignment or media
file. Therefore current creative transfer bytes are unchanged: the four
controlled 300×250 JPG files are 39,462–87,574 bytes and the Slotnite animated
320×50 GIF is 44,551 bytes. Browser tests report no horizontal overflow, no
ratio distortion and no more than one pixel of reserved-stage height movement
before versus after decode across 390, 430, 768, 1024, 1280 and 1440 px.

## Governed click contract

**DETECTED:** `GovernedCommercialAction` is shared by the existing CTA and
commercial creative. It derives the first link from the same internal `/r/{slug}`
action as `/outbound/{slug}`, opens the existing confirmation dialog, and keeps
the final `/r/{slug}` continuation with `target="_blank"` and
`rel="nofollow sponsored noopener"`.

**DETECTED:** when the server-authoritative CTA action is available, the whole
commercial media stage is a semantic anchor with a verified Casino/offer
accessible name, keyboard activation, visible focus and pointer affordance.
The separately visible CTA remains. When action authority is absent because of
GEO, legal, contract, account, destination or route state, no creative anchor
is rendered. Media visibility never creates action authority.

**DETECTED:** CTA and creative events use the existing closed
`outbound_intent` taxonomy with bounded source/placement origin values and no
affiliate parameters or database migration. Public product analytics remains
off under its current governing contract; this change does not activate it.

## Partner HTML, remote media and impression tracking

**DETECTED:** a partner evidence record or HTML snippet is not a `MediaAsset`.
Public components contain no partner HTML executor, `iframe`, arbitrary script,
raw partner click target or impression-pixel field. Current creatives are
validated and served as controlled first-party assets.

**DETECTED:** Rakuten, Scaleo and Affise documentation demonstrates that image,
click and impression/HTML channels can be separate. B4GAMBLE deliberately uses
the image bytes plus its own governed action. It does not copy the supplied raw
click URL, `showURL`, impression macro, iframe or JavaScript into public HTML.
This avoids an unapproved visitor-data disclosure and third-party performance
cost.

**PROPOSED — separate future decision:** if commercial operations later need a
remote-image importer, it must use HTTPS, strict redirect/timeout/byte limits,
content-type plus signature validation, DNS rebinding/private/link-local
blocking, no credentials or executable content, first-party persistence and
recorded provenance. No importer is introduced here. Third-party impression
measurement requires separate privacy, consent and commercial authority.

## Administration and rollback

**DETECTED:** Admin file inputs accept GIF and show dimensions, MIME, byte size,
static/animated state, named format family, assignment usage, and placement/
variant compatibility. Guidance now describes 300×250, 250×250, 320×100,
320×50 and the deliberate 728×90 Casino offer mode. Poor-fit and unusual images
warn rather than create an arbitrary non-security rejection.

**DETECTED:** Founder/Admin remains the assignment authority. No current
Slotnite assignment is changed automatically. The existing
`PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=false` rollback restores legacy reads
without deleting assignments or assets; application rollback remains compatible
because there is no schema change.

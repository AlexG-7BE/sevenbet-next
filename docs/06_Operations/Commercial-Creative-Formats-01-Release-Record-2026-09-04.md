# COMMERCIAL-CREATIVE-FORMATS-01 Release Record — 4 September 2026

**Status:** COMPLETE — final runtime, presentation and governed-click
acceptance passed in Production

**Founder authority:** `B4GAMBLE — COMMERCIAL-CREATIVE-FORMATS-01`

**Starting `origin/main`:**
`8e25787ec1d00e1eaa0db74ceed605fdbf219340`

**Branches:** `codex/commercial-creative-formats-01` and
`codex/commercial-creative-formats-01-mobile-fix`

**Pull requests:** [#150](https://github.com/AlexG-7BE/sevenbet-next/pull/150)
and [#151](https://github.com/AlexG-7BE/sevenbet-next/pull/151)

**Accepted heads:**
`7fc3294518e9021871b92d65c0d64ab96fe6b35f` and corrective
`14860df7e88b7fa4da259dc1dfc580818bb98ecc`

**Implementation merge:**
`2b170a90930f443a042d5cfe2ff50c91063d82cd`

**Final merge/runtime baseline:**
`96cd546bf14a32fda0632f58382089aac4c7b905`

**Accepted Preview deployments:** implementation
`dpl_6z5h2FQ98pY4jwcepMqzgufJAX5D`; final correction
`dpl_3cWa7RrWghZasK1r823geB84JkYy`

**Final Production deployment:** Ready;
`dpl_9PzTzpLcao3jveamPS9Dq4EVKF82`

**Production origin:** `https://b4gamble.com`

This record contains no credential, private partner record, affiliate
identifier, raw tracking destination, visitor data or Programme data. Claims
are classified as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or
**CONTRADICTION** under the repository technical-evidence rule.

## Executive result

**DETECTED — Production implementation:** B4GAMBLE now treats common affiliate
image inventory as a physical-format concern within RFC-040's existing
semantic placements. One application registry classifies core, square, mobile,
wide, supported-inventory and compatibility sizes. Commercial offer media uses
native aspect ratios inside B4GAMBLE-owned cards, while Casino directory,
review-hero and comparison imagery remains editorial.

**DETECTED — Production implementation:** security-valid GIF87a/GIF89a uploads
are accepted, structurally decoded, measured and stored without re-encoding or
variant generation, preserving animated frames. Commercial media becomes a
semantic governed action only when the same server-authoritative offer action
is available to its visible CTA. The first public href remains B4GAMBLE's
internal confirmation route; partner tracking destinations remain confined to
the existing governed handoff.

**DETECTED — release state:** PR #150 established the format, validation,
presentation, Admin and governed-action contracts. Exact Production acceptance
then detected that the real Slotnite composed 320×50 creative retained a 6:5
mobile card stage. The release remained held while PR #151 added a compact
B4GAMBLE-owned mobile composition and a real-inventory regression. The final
runtime is Ready and passed both required Production conditions: native
industry-standard creative presentation and governed creative clickability.

## Architecture and data boundary

**DETECTED:** no Prisma schema or migration changes. The three RFC-040
assignment models, nine semantic placements, `DEFAULT` / `DESKTOP` / `MOBILE`
variants, assignment-first resolver, immutable publication snapshot and
rollback switch are unchanged. No current `MediaAsset` or assignment is
automatically changed.

**DETECTED:** dimensions remain application presentation metadata and do not
create one database placement per banner size. No sidebar, banner directory,
standalone offer-detail page, remote importer, iframe, HTML/JavaScript creative
executor or third-party impression tracker is introduced.

## Industry evidence and format tiers

**DETECTED:** the research used primary public documentation from Awin,
impact.com, Rakuten Advertising, IAB, Partnerize, CJ, Income Access, Scaleo,
Affise, Affilka, NetRefer and MyAffiliates, plus aggregate read-only evidence
from the current Superfly/Scaleo and Betsson Group Affiliates portals. Public
documentation that established only media capability, not dimensions, was not
counted as size evidence.

The complete source list and factual frequency matrix are maintained in the
[Commercial Creative Format Contract](../05_Engineering/Commercial-Creative-Format-Contract.md).
The resulting tiers are:

| Tier | Formats | Production behavior |
| --- | --- | --- |
| Core | 300×250 | preferred desktop commercial card |
| Square | 250×250 | first-class contained fallback |
| Mobile | 320×100, 320×50 | preferred explicit mobile overrides |
| Wide | 728×90 | deliberate Casino offer wide mode |
| Supported inventory | 160×600, 300×600 | valid library inventory; no public sidebar created |
| Compatibility | 970×250, 970×90, 336×280, 468×60, 120×600, 300×100, 300×50, 180×150 | retained and classified for deliberate/future use |

## Upload and animation result

**DETECTED:** `BONUS_CREATIVE` and `AFFILIATE_CREATIVE` no longer use an
arbitrary 300×150 minimum. Valid 300×250 JPEG, 250×250 JPEG/PNG, 300×250 GIF,
320×50 GIF, 320×100, 728×90, 160×600 and 300×600 inputs pass the security layer.
The existing configured 10 MiB default upload ceiling and 8,000 px dimension
ceiling remain; SVG and MIME/extension spoofing remain rejected.

**DETECTED:** GIF validation requires the declared MIME and `.gif` extension,
GIF87a/GIF89a signature, bounded logical/frame dimensions and colour tables,
valid extension blocks, in-bounds frames, a decodable bounded LZW stream,
complete trailer and no trailing payload. Malformed and truncated files fail
before storage. Stored metadata records detected MIME, dimensions, byte size,
animated/static state and frame count where available. Admin upload, governed
batch ingestion, storage content type and the local first-party response path
all retain `image/gif`.

## Public presentation and action result

**DETECTED:** `/bonuses` and `/best-offers` keep the current product structure,
terms, ranks, scores and visible CTA. A 300×250 creative is a native contained
visual; 250×250 remains square; mobile overrides create native 320×100 or
320×50 stages; wide media is never stretched into a card. The Casino review
hero is unchanged, while `CASINO_OFFER_BLOCK` supports a commercial card or
deliberate 728×90 wide mode.

**DETECTED:** one `GovernedCommercialAction` component now serves both CTA and
creative. Authorized commercial media is a keyboard-focusable semantic anchor
with a verified accessible name and focus-visible state. Mouse and Enter open
the existing confirmation dialog. CTA and creative derive the same first
`/outbound/{slug}` href from the same `/r/{slug}` server action; the final
continuation retains `target="_blank"` and
`rel="nofollow sponsored noopener"`.

**DETECTED:** media visibility does not grant action authority. A creative is
wrapped only for a published record whose commercial availability and current
server action are both available and whose route matches the internal `/r/`
contract. When GEO, legal, contract, account, missing-destination or route
authority withholds the CTA, the image remains non-interactive. Editorial
placements never receive automatic affiliate-link treatment.

**DETECTED:** the existing closed `outbound_intent` event can distinguish CTA
from creative and the semantic placement without a database migration or
partner parameter. Public product analytics remains disabled under its current
governance; this release does not activate it.

## Admin and real-world fixture

**DETECTED:** Admin now shows the selected asset's dimensions, MIME, byte size,
animation state, format family and `PREFERRED`, `COMPATIBLE`, `POOR_FIT` or
`UNRECOGNIZED` placement/variant assessment. Guidance reflects 300×250,
250×250, 320×100, 320×50 and deliberate 728×90 use. Performance warnings begin
above 1 MiB and strengthen above 3 MiB; unusual but security-valid assets
remain assignable. `DEFAULT`, `DESKTOP` and `MOBILE` stay optional and
independent.

**DETECTED:** the controlled Slotnite source is a valid 320×50 animated GIF,
44,551 bytes and 59 frames. It passes the same production validator, remains
byte-identical after processing and decodes at 320×50 in Chromium. No Slotnite
asset or assignment is changed by this release. The assignment tests continue
to prove that Bonus, Best Offers, Casino offer, review hero and directory media
can vary independently.

## Security and privacy

**DETECTED:** partner evidence and HTML snippets remain records rather than
executable public media. No raw Superfly, Betsson or other partner click target
is used as a creative href. No partner impression URL, pixel, script or iframe
is embedded. Current imagery remains validated and first-party controlled.

**PROPOSED — separate future authority:** a remote-image importer would require
HTTPS-only retrieval, redirect/timeout/byte bounds, content-type plus signature
validation, private/link-local/DNS-rebinding protection, no credentials or
executable content, first-party persistence and provenance. Impression
tracking remains a separate privacy/consent/commercial decision and does not
block this release.

## Verification and controlled release

**DETECTED — local and CI:** all checks below ran from confirmed worktrees and
the exact PR heads. Dependencies, generated/build output, caches and
`tsconfig.tsbuildinfo` were excluded from source-inventory claims.

| Gate | Result |
| --- | --- |
| ESLint | PASS; zero warnings |
| TypeScript | PASS |
| Commercial creative/unit/contract suite | PASS; 67/67 |
| Commercial platform suite | PASS; 28/28 |
| Full `ci:quality` | PASS |
| PostgreSQL 17 fresh/staged/replay migration suite | PASS; all 27 migrations, protected auth/Programme/market/commercial/media data checks |
| Exact final production build | PASS |
| Local production-build Chromium acceptance | PASS; canonical format, blocked-action, GIF decode and compact composed-stage cases; hosted acceptance covered real authority |
| Responsive widths | PASS at 390, 430, 768, 1024, 1280 and 1440 px |
| Layout stability | PASS; no overflow/distortion and ≤1 px reserved-stage movement |
| Deterministic composed-mobile regression | PASS; 320×50 ratio, stage below 190 px, B4GAMBLE label retained |
| PR #150 CI | PASS; [run 33879072705](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33879072705) |
| First merge CI | PASS; [run 33880427327](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33880427327) |
| PR #151 corrective CI | PASS; [run 33882040386](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33882040386) |
| Final merge CI | PASS; [run 33883548950](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33883548950) |

**DETECTED:** the Bonus selector contract remains three Best Overall records
when sufficient eligible inventory exists and at most three for every selector.
Existing regression suites cover eight Casinos, six published Bonuses, current
Best Offers inventory, Editor Scores, offer terms, GEO matrix, governed routes,
demo exclusion, Programme/auth, RFC-040 resolution and immutable publication.

**DETECTED — Preview:** both exact implementation and corrective heads reached
Ready Vercel Previews. On the corrective Preview, three real commercial
creatives remained visible while commercial authority was unavailable; there
were zero creative anchors, zero CTA anchors, zero focusable creative wrappers,
zero raw external links and one browser-decoded 320×50 Slotnite GIF. The
compiled mobile composition rules were present on the exact corrective head.

**DETECTED — Production hold and correction:** intermediate deployment
`dpl_6jRr49tBmGZKUBn2X8Kf6KEvF25r` passed authorized CTA/creative agreement,
GIF decoding and canonical format tests, but a new measurement of the actual
Slotnite mobile composition found a 283.33 px figure at 390 px. The release was
not accepted. PR #151 reduced that same real figure to 124.38 px while rendering
the 320×50 GIF at 316×49.38 px inside a 340 px card. It retained the visible
`B4GAMBLE / CONTROLLED MEDIA` label, hid duplicated identity inside the compact
stage and produced no horizontal overflow.

**DETECTED — final Production:** Ready deployment
`dpl_9PzTzpLcao3jveamPS9Dq4EVKF82` serves `b4gamble.com` and
`www.b4gamble.com` from final merge `96cd546bf14a32fda0632f58382089aac4c7b905`.
The final commercial browser gate passed six applicable cases with one
blocked-fixture-only Production skip: six-width 300×250, 250×250, 320×100 and
320×50 geometry; real 300×250 and Slotnite 320×50 inventory at 390/1440 px;
GIF decoding; Bonus, Best Offer and Casino offer CTA/creative route agreement;
keyboard Enter and mouse confirmation; final `/r/` continuation rel contract;
deliberate 728×90 mode; zero raw partner links; and zero overflow. Repository
Production smoke passed all nine read-only routes.

**DETECTED — final product regression:** Bonuses retained exactly three curated
records with rank markers 01–03, current offer terms and Editor Scores. Best
Offers retained six published records. Casino discovery retained the exact
eight real review routes and no commercial creative wrapper. Slotnite retained
one editorial review experience plus one governed `CASINO_OFFER_BLOCK` GIF/CTA
pair. Programme/auth, GEO, redirect, public integrity, migration and RFC-040
assignment-independence suites passed without a data write.

## Rollback and hold conditions

Application rollback reverts the presentation/action wrapper and restores the
previous UI. `PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=false` remains the existing
media-read rollback. Neither rollback deletes an asset or relationship; there
is no schema rollback.

Any future regression must return the release to **HOLD** if exact-head Preview
or Production fails either:

1. industry-standard creative presentation without distortion/overflow; or
2. authorized and blocked creative agreement with the governed CTA.

## Final release evidence

- **DETECTED:** exact accepted heads, both merge commits and all required PR
  checks are bound above.
- **DETECTED:** exact-head Preview proves the blocked/non-interactive state;
  local/CI contracts independently prove every denial path.
- **DETECTED:** final Production proves real standard-format presentation and
  authorized governed clickability on Bonus, Best Offer and Casino offer media.
- **DETECTED:** no schema migration, asset mutation, assignment mutation,
  commercial-authority expansion or raw partner embed was required.
- **DETECTED:** the durable format contract and this final release record are
  linked from Operations documentation.

# COMMERCIAL-CREATIVE-FORMATS-01 Release Record — 4 September 2026

**Status:** CANDIDATE — local acceptance complete; Preview and Production
acceptance pending

**Founder authority:** `B4GAMBLE — COMMERCIAL-CREATIVE-FORMATS-01`

**Starting `origin/main`:**
`8e25787ec1d00e1eaa0db74ceed605fdbf219340`

**Branch:** `codex/commercial-creative-formats-01`

**Pull request:** **UNKNOWN — branch not yet published at this checkpoint**

**Accepted head:** **UNKNOWN — exact PR head pending**

**Merge/runtime baseline:** **UNKNOWN — merge pending**

**Preview deployment:** **UNKNOWN — Preview pending**

**Production deployment:** **UNKNOWN — Production pending**

**Production origin:** `https://b4gamble.com`

This record contains no credential, private partner record, affiliate
identifier, raw tracking destination, visitor data or Programme data. Claims
are classified as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or
**CONTRADICTION** under the repository technical-evidence rule.

## Executive result

**DETECTED — candidate implementation:** B4GAMBLE now treats common affiliate
image inventory as a physical-format concern within RFC-040's existing
semantic placements. One application registry classifies core, square, mobile,
wide, supported-inventory and compatibility sizes. Commercial offer media uses
native aspect ratios inside B4GAMBLE-owned cards, while Casino directory,
review-hero and comparison imagery remains editorial.

**DETECTED — candidate implementation:** security-valid GIF87a/GIF89a uploads
are accepted, structurally decoded, measured and stored without re-encoding or
variant generation, preserving animated frames. Commercial media becomes a
semantic governed action only when the same server-authoritative offer action
is available to its visible CTA. The first public href remains B4GAMBLE's
internal confirmation route; partner tracking destinations remain confined to
the existing governed handoff.

**UNKNOWN — release state:** these claims are locally verified on the candidate
branch. They do not become Production claims until exact-head Preview
acceptance, required CI, merge, Ready Production deployment and live
presentation/click acceptance are recorded here.

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

| Tier | Formats | Candidate behavior |
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

## Candidate verification

**DETECTED — local:** all checks below ran from the confirmed candidate
worktree against the current branch. Dependencies, generated/build output,
caches and `tsconfig.tsbuildinfo` were excluded from source-inventory claims.

| Gate | Result |
| --- | --- |
| ESLint | PASS; zero warnings |
| TypeScript | PASS |
| Commercial creative/unit/contract suite | PASS; 67/67 |
| Commercial platform suite | PASS; 28/28 |
| Full `ci:quality` | PASS |
| PostgreSQL 17 fresh/staged/replay migration suite | PASS; all 27 migrations, protected auth/Programme/market/commercial/media data checks |
| Exact final production build | PASS |
| Local production-build Chromium acceptance | PASS; 3 locally provable cases, 2 real-authority cases intentionally skipped |
| Responsive widths | PASS at 390, 430, 768, 1024, 1280 and 1440 px |
| Layout stability | PASS; no overflow/distortion and ≤1 px reserved-stage movement |

**DETECTED:** the Bonus selector contract remains three Best Overall records
when sufficient eligible inventory exists and at most three for every selector.
Existing regression suites cover eight Casinos, six published Bonuses, current
Best Offers inventory, Editor Scores, offer terms, GEO matrix, governed routes,
demo exclusion, Programme/auth, RFC-040 resolution and immutable publication.

## Rollback and hold conditions

Application rollback reverts the presentation/action wrapper and restores the
previous UI. `PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED=false` remains the existing
media-read rollback. Neither rollback deletes an asset or relationship; there
is no schema rollback.

Release must remain **HOLD** if exact-head Preview or Production fails either:

1. industry-standard creative presentation without distortion/overflow; or
2. authorized and blocked creative agreement with the governed CTA.

## Pending release evidence

- **UNKNOWN:** exact PR number, accepted head and required GitHub checks.
- **UNKNOWN:** Ready exact-head Vercel Preview and responsive/interactive
  acceptance against real governed inventory.
- **UNKNOWN:** merge SHA and exact-merge CI.
- **UNKNOWN:** Ready Production deployment and final presentation/click smoke.
- **UNKNOWN:** documentation closeout commit after Production evidence.

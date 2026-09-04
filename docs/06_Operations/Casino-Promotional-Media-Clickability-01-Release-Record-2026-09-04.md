# Casino Promotional Media Clickability 01 — Release Record

**Status:** COMPLETE
**Founder authority:** `B4GAMBLE — CASINO-PROMOTIONAL-MEDIA-CLICKABILITY-01`
**Release date:** 4 September 2026
**Implementation PR:** [#153](https://github.com/AlexG-7BE/sevenbet-next/pull/153)
**Durable-record PR:** docs-only closeout (pending PR creation)

This record contains no credential, private partner record, affiliate identifier,
raw tracking destination, visitor data or Programme data. Claims use the
repository evidence classifications **DETECTED**, **INFERRED**, **PROPOSED**,
**UNKNOWN** and **CONTRADICTION**.

## Executive result

**DETECTED:** eligible promotional media on the curated `/casinos` cards and on
Casino review/detail heroes now uses the same governed action as the visible
CTA. The first link remains `/outbound/{slug}`, the confirmation continues only
to `/r/{slug}`, and no raw partner destination is present in public HTML.

**DETECTED:** missing authority removes the anchor without removing published
artwork. Logo/brand-only, media-unavailable and directory composition fallbacks
remain non-interactive. `CASINO_LOGO`, `CASINO_COMPARE`, Read review and other
navigation remain outside the creative action.

## Evidence boundary

**DETECTED:** the repository root was confirmed and the active repository was
scanned before implementation. Dependencies, generated output, build artefacts,
caches and `tsconfig.tsbuildinfo` were excluded; the pre-documentation source
inventory contained 2,150 files. Implementation statements below are based on
repository source, tests, the exact Preview build and the exact Production
deployment.

**DETECTED:** no Prisma schema, migration, publication snapshot, commercial
record, redirect, asset or assignment was changed. No data mutation or
destructive operation was run.

## Root cause and previous behavior

**DETECTED:** the earlier `COMMERCIAL-CREATIVE-FORMATS-01` contract intentionally
kept `CASINO_DIRECTORY_CARD` and `CASINO_DETAIL_HERO` non-interactive while it
introduced governed clickability for offer-specific media. The directory
renderer therefore emitted promotional artwork in a plain `div`; the review
renderer emitted its hero stage in a plain `aside`.

**DETECTED — pre-merge Production:** `/en/casinos` exposed nine visible governed
CTAs with `CTA_UNSPECIFIED` and no directory creative action. The Skol review
exposed four `CTA_CASINO_OFFER_BLOCK` actions plus its offer-block creative, but
no `CREATIVE_CASINO_DETAIL_HERO` action. The image and CTA therefore disagreed
about clickability even though they shared the same server-authoritative route.

## Final implementation

**DETECTED — directory:** `CuratedCasinoShortlist` derives one action object from
the existing disposition, non-demo classification, available visit action and
safe internal redirect slug. When compatible promotional media is actually
rendered, the existing media frame itself becomes `GovernedCommercialAction`.
The visible Visit CTA uses the same action and now records
`CTA_CASINO_DIRECTORY_CARD`.

**DETECTED — detail hero:** the existing `heroMedia` stage itself becomes
`GovernedCommercialAction` only when real hero media and a real profile action
are both available. Existing `CONTAIN`, `COVER` and offer-bearing `COMPOSED`
rendering remains unchanged. The separate offer CTA continues to use
`CASINO_OFFER_BLOCK` while agreeing on the same `/outbound/{slug}`.

**DETECTED — fail closed:** a blocked/missing action retains a plain media
element with no `href`, focus target or pointer cursor. Brand/logo composition,
code fallback and directory media-unavailable composition use the same inert
branches as before. No image is treated as commercial authority.

## Accessibility and visual contract

**DETECTED:** eligible media is a semantic anchor with an accessible name
derived from the current Casino and offer, native keyboard semantics, a 3 px
visible focus outline and pointer affordance. The action contains only its media
region and no nested anchor or button.

**DETECTED:** the Refero reference lock used the accepted B4GAMBLE card and hero
as the primary visual reference and the bundled craft rules as the secondary
reference. The implementation reuses the existing media containers instead of
adding a wrapper, overlay, fake CTA, size change or crop change. Production
reported `cursor:pointer`, a 3 px solid focused outline with `-6px` inset
offset, and no layout or media-format regression.

## Analytics contract

**DETECTED:** the bounded `outbound_intent` taxonomy adds only:

- `CTA_CASINO_DIRECTORY_CARD`
- `CREATIVE_CASINO_DIRECTORY_CARD`
- `CREATIVE_CASINO_DETAIL_HERO`

`CREATIVE_CASINO_LOGO` and `CREATIVE_CASINO_COMPARE` remain rejected. Public
product analytics remains disabled under its current governing contract; this
release does not activate it and adds no migration or affiliate parameter.

## Release identity

| Item | Exact evidence |
| --- | --- |
| Base | `547ac32759a314e5c6418fb9c6eb41f530ad8f69` |
| Implementation head | `1f52512c4867933b774d536c55d028d5ec79641a` |
| Implementation merge | `5d9b307120919f95a8f0916725313b8ee91db829` |
| PR CI | PASS — [run 33902005478](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33902005478) |
| Post-merge CI | PASS — [run 33903219829](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33903219829) |
| Preview | Ready — `dpl_CcLZ4pokqbb4K3iCTfgwB36qj2v7` |
| Preview URL | `https://sevenbet-next-m66bxi5n8-alexg-7bes-projects.vercel.app` |
| Production | Ready — `dpl_7Aw6FWMzDmAj9MadydWagDFgYpU9` |
| Production origin | `https://b4gamble.com` |

## Verification gates

**DETECTED — local/CI:** lint, typecheck, optimized build, public Casino
regression and the expanded 77-test commercial suite passed. Component tests
cover directory authorized, blocked, missing-media and composed-fallback states;
detail tests cover authorized `CONTAIN`, `COVER`, `COMPOSED`, blocked media and
brand fallback. The full PR Build/Browser job passed in 13m39s.

**DETECTED — exact Preview:** the accepted Preview was verified interactively
and with the hosted browser suite. Preview commercial authority was unavailable,
so it supplied the real fail-closed evidence: Skol `CONTAIN` artwork and the
animated Slotnite `COMPOSED` creative stayed visible as plain `aside` elements
with `cursor:auto`, no `href`, no nested control, zero creative focus targets
and zero raw external links. Four applicable hosted browser cases passed and
four authorized-only cases were correctly skipped.

**DETECTED — exact Production:** the hosted authorized browser suite passed
seven cases with one expected Preview-only blocked-fixture skip. It covered six
responsive widths, native 300×250 and animated 320×50 assets, Bonus/Best Offer/
Casino offer compatibility, directory and detail actions, mouse and Enter
confirmation, final rel values, the 728×90 mode, no overflow and no raw partner
link.

## Production acceptance

**DETECTED — Skol directory:** the full media stage is clickable at
`/outbound/skol-casino-welcome`, its accessible name includes `Skol Casino` and
`100% up to €300 + 100 free spins`, and one separately visible directory CTA
uses the same route. Mouse activation opened `You are leaving B4GAMBLE.`;
keyboard activation passed the hosted browser gate. The dialog focused Cancel
and exposed only `/r/skol-casino-welcome` with
`rel="nofollow sponsored noopener"` as its continuation.

**DETECTED — Skol review hero:** one
`CREATIVE_CASINO_DETAIL_HERO` anchor is visible and agrees with all four visible
`CTA_CASINO_OFFER_BLOCK` actions on `/outbound/skol-casino-welcome`. It contains
no nested interactive control and no raw external destination.

**DETECTED — Slotnite:** the detail hero remains the compact offer-bearing
`COMPOSED` treatment, contains the browser-decodable animated
`partner-brand.gif`, reports `cursor:pointer`, contains no nested control and
uses `/outbound/slotnite-welcome` with the current Slotnite offer in its
accessible name.

**DETECTED — blocked/fallback proof:** Production DragonBet renders a plain
`COMPOSED` `aside` with `cursor:auto`, no `href`, no outbound action and no raw
link while Offer unavailable is visible. On the directory, Hello Casino retains
an inert media fallback even though its separate governed CTA is available.

**DETECTED — exact routes:** `/en/casinos` and all eight real review routes
returned 200: Betsson, Skol Casino, Hello Casino, G'day Casino, Diamond7,
DragonBet, 21 Privé and Slotnite.

## Regression result

**DETECTED:** Bonuses retains the exact three-card shortlist — 21 Privé, Skol
Casino and Slotnite — with 01–03 markers, current terms, Editor Scores and the
previous governed creative behavior. Best Offers retains six eligible records
and its three-item shortlist. Comparison controls, Casino logos, full-directory
review links and existing Bonus/Best Offer/Casino offer clickability are
unchanged.

## Rollback

**DETECTED:** application rollback to base `547ac327...` removes the two new
promotional action wrappers and three analytics origins. It requires no data,
schema, assignment or asset rollback. The existing placement-media rollback
switch remains unaffected.

## Final state

`CASINO-PROMOTIONAL-MEDIA-CLICKABILITY-01: COMPLETE`

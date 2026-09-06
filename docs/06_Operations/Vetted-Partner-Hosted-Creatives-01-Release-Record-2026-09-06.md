# VETTED-PARTNER-HOSTED-CREATIVES-01 Release Record — 6 September 2026

**Status:** COMPLETE — exact-head Preview, real three-fixture acceptance,
protected merge, additive Production migration, exact-merge Production
deployment and Production smoke passed

**Founder authority:** `B4GAMBLE — VETTED-PARTNER-HOSTED-CREATIVES-01` and
the explicit continuation authorising PR, merge, Production release and the
release-record PR

**Starting `origin/main`:**
`7b3715c1902bb080cf67e2aa9173067068388181`

**Governing RFC:**
[RFC-041 — Vetted Partner-Hosted Creatives](../06_RFC/RFC-041-Vetted-Partner-Hosted-Creatives.md)

**Implementation branch:** `codex/vetted-partner-hosted-creatives-01`

**Implementation pull request:**
[#170](https://github.com/AlexG-7BE/sevenbet-next/pull/170)

**Accepted implementation head:**
`6c2907d7a508b339f2d3157001903afb8c1f2311`

**Implementation merge:**
`f429ba0f1f04d95a12086e7c7302d708103eec9a`

**Accepted Preview:** Ready deployment
`dpl_FnVGnYngxT7SYmoof3ZHRjtWXMbN` at
`https://sevenbet-next-gj6j2qw0k-alexg-7bes-projects.vercel.app`

**Accepted Production:** Ready deployment
`dpl_AvipjKt4zVhPaCKrq7eAAmFH22C1` at
`https://sevenbet-next-7135s4r7a-alexg-7bes-projects.vercel.app`; canonical
aliases include `https://b4gamble.com`

**Exact-merge route-health acceptance:** GitHub Actions
[run 34025199955](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34025199955),
successful on `f429ba0f1f04d95a12086e7c7302d708103eec9a`

This record contains no credential, OAuth token/code, raw affiliate
destination, visitor data or Programme data. Implementation conclusions use
**DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** and **CONTRADICTION** in
accordance with the repository technical-evidence rule.

## Executive result

**DETECTED:** the Founder can now paste either composite `Description` plus
`Embed Code`, or HTML only, into the existing Media Operations ingestion
contract. Deterministic parsing stores a typed vetted-provider record and
renders the original partner-hosted creative. It does not download, OCR,
screenshot, visually classify or force the creative into R2.

**DETECTED:** Superfly uses a direct browser-loaded image. Bannerflow uses a
B4-controlled sandbox document with a reconstructed allowlisted script URL.
Both public actions remain B4-owned and re-enter the existing `/r` route.
Creative-specific destinations remain subordinate to the current canonical
Casino route, exact offer/link association, trusted GEO, legal/account state
and immutable publication binding.

**DETECTED:** a B4 302 is not destination success. Every new destination must
also traverse its partner tracker and reach the evidence-backed operator host
without an error terminal, challenge, loop, lost attribution or unexpected
host before its record can be `VERIFIED` and publishable.

## Input, parser and authority contract

The existing `media_ingest_partner_snippet` string accepts:

- ordinary supported first-party/direct-image input;
- raw Superfly anchor/image HTML; and
- Markdown/backtick-wrapped or plain composite `Description:` and
  `Embed Code:` input for Bannerflow.

**DETECTED:** parsing is deterministic. The Betsson sample yields external
label `Studio_71344`, brand Betsson, purpose `Casino Welcome Offer`, country
`CL`, dimensions 300×100 and `UNKNOWN` language/currency. Agreeing country name
and code establish the explicit country; contradiction is review-required.
No country is inferred from language/currency and no language/currency is
inferred from country.

**DETECTED:** HTML entities are decoded only within the bounded supported
grammar. Unknown scripts, malformed provider hosts, executable `javascript:`
or `data:` input, private/internal hosts and arbitrary destinations are
rejected. Structured attributes and query fields are parsed as structured
evidence; prose punctuation cannot silently enter a destination.

## Additive schema and hosted model

Migration `0029_vetted_partner_hosted_creatives` is additive and has checksum
`feb4068b4ee88399b847bea4221ff24af139445c8644325a168fd99e1215e9a0`.
It adds:

1. `PartnerHostedCreative`;
2. `CasinoPartnerHostedCreativeAssignment`;
3. `CasinoBonusPartnerHostedCreativeAssignment`; and
4. `AffiliateOfferPartnerHostedCreativeAssignment`.

`PartnerHostedCreative` records provider/source mode, deterministic provider
identity, Casino/Bonus/Offer/route/link relationships, supplied description,
provider identifiers, dimensions, alt text, hosted image or structured embed
parameters, explicit country/language/currency/purpose, server-only destination
and checksum, expected/verified operator host, verification provenance,
validation state, source checksum and audit provenance.

The three assignment tables retain RFC-040 typed subject ownership and add an
explicit `languageState`, so `UNKNOWN` does not collapse into `NEUTRAL`.
Resolver, duplicate, route, verification and target indexes are additive.
Existing `MediaAsset` and first-party assignment rows remain valid.

**DETECTED:** Production applied 0029 once before the feature-on deployment.
Protected counts were unchanged across migration. Final read-only verification
found all four new tables present with zero rows.

## Superfly browser rendering

**DETECTED:** a vetted Superfly record projects the supplied impression URL to
an ordinary browser-loaded `<img>` with fixed aspect-ratio space and lazy
loading. It bypasses the Next.js image optimizer and no B4 server acquisition
occurs in normal presentation. A B4-owned accessible link surrounds the
winning creative only when referral authority is currently available.

The client receives the image URL and an opaque B4 creative UUID, never the
stored click destination. Failure selects the best current first-party brand
media/logo/placement fallback without a broken image or collapsed slot. A
generic fallback uses the canonical route rather than pretending the failed
creative was displayed.

## Bannerflow isolated rendering

**DETECTED:** the main page never injects pasted third-party script. A typed B4
frame route reconstructs the exact allowlisted `c.bannerflow.net` script path
and parameters from the stored record. Its `redirecturl` is replaced with a B4
first-party route; the original Betsson tracker remains server-side evidence.

The Admin/public iframe uses `sandbox="allow-scripts"` only. It has no
`allow-same-origin`, popup or top-navigation grant, no B4 authenticated context,
no parent-DOM access and no B4 storage requirement. The exact frame response
has provider-specific CSP and `frame-ancestors 'self'`; every other B4 response
retains `X-Frame-Options: DENY`. Main-page CSP adds only same-origin frame
authority and is not broadened to arbitrary HTTPS script/connect hosts.

Known dimensions reserve layout space, frame initialization is lazy, and only
the server-selected winning creative is projected. If current commercial
authority is blocked, the frame cannot navigate around the inert B4 action.

## Real Preview acceptance

The final accepted Preview used the exact three Founder fixtures without
adding GEO, language, currency or visual/OCR metadata.

| Fixture | Parsed/stored result | Real rendering | Destination result |
| --- | --- | --- | --- |
| Superfly Skol #200 | `SUPERFLY:3:16924502:46:200`; 250×250; `GLOBAL`; language/currency `UNKNOWN`; destination hash `c513a7606ef3687db9c25651be254c74cef16894c6d181beabb55c6b68e52607` | Original provider image rendered at 250×250; no B4 acquisition or R2 copy | `VALIDATED` / `VERIFIED`; bounded provider traversal reached `www.skolcasino.com` with terminal-content inspection |
| Superfly Skol #205 | `SUPERFLY:3:16924502:46:205`; 250×250; `GLOBAL`; language/currency `UNKNOWN`; destination hash `777666342b528107af3dd067f3678ba6b1887b124c102f13fbabc787813bca2b` | Original provider image rendered independently at 250×250 | `VALIDATED` / `VERIFIED`; bounded provider traversal reached `www.skolcasino.com` |
| Bannerflow Betsson CL | `BANNERFLOW:676000f73c9e68e82c637837`; `did=657fff592225a91f2b2e2296`; ad group `676000f73c9e68e82c637846`; media `209064`; campaign `1`; 300×100; `CL`; language/currency `UNKNOWN` | Original animated Bannerflow creative visibly rendered in the isolated 300×100 frame | `REVIEW_REQUIRED` / `PENDING`: Betsson has no current canonical B4 commercial route, so its supplied tracker cannot activate or publish |

**DETECTED:** #200 and #205 retained different provider identity keys, creative
IDs and destination hashes. Re-ingestion did not collide or collapse their
attribution. Visual comparison was neither performed nor required.

**DETECTED:** the Bannerflow frame rendered the original offer artwork and
copy. Its iframe had exactly the restricted sandbox above. No apply or publish
action was taken; Preview hosted-assignment counts remained zero and public
Casino snapshots were unchanged.

## Provider network and privacy evidence

**DETECTED in final Preview:** the Bannerflow frame observed 13 assets and only
the host `c.bannerflow.net`. The original Betsson tracker host was absent from
the rendered asset set because Bannerflow received the B4-owned governed
redirect target instead. No B4 `localStorage`/`sessionStorage` mutation was
observed in the isolated frame.

**DETECTED:** Superfly presentation intentionally lets the visitor browser
request `go.superflypartners.net`, preserving provider-side impression
measurement. Bannerflow likewise lets the isolated browser frame request its
provider CDN. Those requests necessarily disclose ordinary network metadata
such as IP address and user agent. The public Privacy wording now accurately
describes this bounded partner-media behavior without claiming that provider
cookies or harmlessness were proved.

**LIMITATION:** the observed fixture required no additional Bannerflow CDN or
subresource domain. Future provider infrastructure is not implicitly trusted;
any new required host needs evidence and an allowlist review.

## Destination integrity and `/r`

The creative UUID is an opaque selector, not a URL input. The server releases a
creative destination only when the current creative, Casino, offer, canonical
redirect slug, tracking link, destination checksum and latest publication
fingerprint all match. Rebinding therefore requires a new governed
publication.

The new creative selector runs only after the existing `/r` feature flag,
trusted request GEO, production eligibility, legal/contract/account, route,
safe-response and click-recording checks. Canonical CTA requests with no
creative selector retain the exact existing destination. A creative can never
broaden commercial authority or supply a client-controlled URL/country.

For each new/changed destination, the server follows at most the bounded safe
redirect chain, validates public HTTPS targets, preserves required attribution,
requires the evidence-backed final operator host and optionally inspects the
terminal body for challenge/error pages. Broken, JSON-error, wrong-host,
looped, malformed, timed-out or punctuation-corrupted results fail activation.

## Presentation selection and fallback

For trusted country `C` and presentation language `L`, the combined
first-party/partner-hosted resolver ranks:

1. exact `C` plus exact `L`;
2. exact `C` plus neutral or unknown language;
3. global plus exact `L`;
4. global English plus EUR;
5. other global English;
6. global neutral;
7. global unknown; and
8. any other usable global explicit-language creative.

Language rank precedes currency; an explicitly known local currency breaks a
tie but never grants GEO authority. A CL-specific creative never escapes CL.
When no higher candidate exists, an English/EUR global is the European default.
Tests prove that one usable global creative wins even when it is English/GBP or
`UNKNOWN`, so imperfect localization does not leave an empty slot.

Media visibility and referral eligibility remain independent. A promotion may
remain visible where policy permits while its action is inert; a blocked GEO
cannot use the frame or creative binding to refer externally.

## MCP and publication boundary

The separate tool surfaces remain:

| Resource | Exact tools | Publish tool |
| --- | ---: | --- |
| Commercial MCP | 4 | None |
| Media Operations MCP | 5 | None |

The Media tools remain `media_ingest_partner_snippet`,
`media_analyze_and_plan`, `media_apply_draft_plan`, `media_get_plan` and
`media_list_recent_ingestions`. No unified MCP or Founder Custom App
reconnection is required. Hosted ingestion can store, validate, preview and
prepare an otherwise eligible draft assignment; only the existing governed
editorial publication boundary can place its safe projection in a public
snapshot.

## Tests, CI and Preview

**DETECTED:** accepted head
`6c2907d7a508b339f2d3157001903afb8c1f2311` passed:

- 20/20 focused hosted-creative parser, provider, security, binding,
  destination, selection, fallback, frame and MCP contract tests;
- public IA and redirect regressions;
- lint, typecheck, Prisma validation, migration verification and diff checks;
- the complete local `npm run ci:quality`; and
- all required GitHub checks: Agent Core, Quality, Database / Migration
  Verification, Build / Browser and Vercel Preview.

Ready Preview `dpl_FnVGnYngxT7SYmoof3ZHRjtWXMbN` ran with the capability on,
an isolated Preview database and the exact accepted head. Protected Preview
counts remained 3 users, 3 enrollments, 6 Mission-progress rows, 8 Casinos, 8
Bonuses, 6 Offers/routes/links, 13 media assets and 22 Casino versions. The
temporary Admin link and acceptance-only environment values were removed.
Exact Preview logs contained no 5xx, `P2024` or Prisma match.

## Protected merge, Production migration and deployment

**DETECTED:** PR #170 was cleanly mergeable and merged through GitHub at
2026-09-06T09:31:51Z. No direct push to `main` occurred.

Production preflight identified the exact fingerprinted resource, only 0029
pending and no partial hosted table. The guarded migration applied checksum
`feb4068b...` once while the capability was off. Counts were unchanged before
and after: 3 users, 3 enrollments, 11 Mission-progress rows, 34 Casinos, 33
Bonuses, 11 Offers/routes/links, 15 media assets, 74 Casino versions,
26/20/0 first-party typed assignments, 60 commercial opportunities and 772
evidence rows.

The Production flag `VETTED_PARTNER_HOSTED_CREATIVES_ENABLED` is independently
configured. The exact merge artifact was redeployed after that configuration.
Ready deployment `dpl_AvipjKt4zVhPaCKrq7eAAmFH22C1` carries merge SHA
`f429ba0f1f04d95a12086e7c7302d708103eec9a` and owns the canonical aliases.
Its build log reports schema-ready 0029 and all four hosted tables at zero.

## Production smoke

**DETECTED:** the following post-deploy checks passed:

- nine standard public routes returned 200;
- `/`, `/casinos`, `/bonuses` and `/best-offers` exposed none of the raw
  Superfly/Betsn/Bannerflow destination hosts or internal destination fields;
- representative existing Skol JPEG, Slotnite animated GIF and controlled R2
  JPEG returned HTTP 206 with correct MIME types;
- all six `/r/{slug}` requests returned 302 to the exact current
  checksum-bound opaque Superfly campaign, with zero raw URL output;
- the read-only Production authority verifier found all six records `CURRENT`,
  allowed projections `KZ`, `US`, `DE`, `IE`, `MX` ON, preserved blocked
  projections `DK`, `ES`, `FI`, `NO`, `CL`, `SE`, `GB` OFF, and no issues;
- exact-SHA Affiliate Route Health run 34025199955 succeeded immediately after
  deployment; the workflow fails unless the Production endpoint reports
  `ok=true` and every current route `HEALTHY`, and that service follows the
  partner tracker to the evidence-backed final operator host;
- the six expected final hosts remained 21 Privé `21prive.com`, Skol
  `www.skolcasino.com`, Slotnite `www.slotnite.com`, Hello
  `www.hellocasino.com`, G'day `www.gdaycasino.com` and Diamond7
  `www.diamond7casino.com`;
- Commercial and Media metadata returned 200, GET returned 405/Allow POST,
  and anonymous `tools/list` returned the correct resource-specific 401
  challenge with private no-store behavior; exact-head official-client tests
  retain four Commercial and five Media tools; and
- Production hosted creatives and all three hosted assignment tables remained
  zero. None of the three acceptance fixtures was published to Production.

The exact-deployment acceptance window returned zero 5xx, error-level,
`P2024`, Prisma or unhandled-rejection log matches. Direct one-click outbound
remains B4 `/r` → partner with no confirmation surface.

## Rollback and bounded limitations

Immediate containment is to set
`VETTED_PARTNER_HOSTED_CREATIVES_ENABLED=false` (or remove it) and redeploy.
First-party R2/static media, RFC-040 assignments, canonical CTAs, Casino pages
and the six canonical `/r` routes continue unchanged. The additive schema and
stored records remain; no destructive database rollback is required.

The following limitations are intentional and bounded:

- Bannerflow is supported only through the observed vetted
  `c.bannerflow.net` contract; arbitrary scripts and future unverified CDN hosts
  are not supported.
- The Betsson CL fixture proves parsing and original rendering, but remains
  non-publishable because there is no current canonical Betsson B4 commercial
  route. Creative description alone cannot create that authority.
- Superfly and Bannerflow availability remains third-party availability. A
  display failure falls back to first-party media, and a destination failure
  stays failed rather than receiving an invented replacement.
- No OCR, image semantic analysis, generic Chromium acquisition, screenshot
  asset, production Playwright renderer, unified MCP, publish tool or new paid
  recurring service was introduced.

## Conclusion

**DETECTED:** both Founder workflows are real. Description plus Bannerflow
embed and Superfly HTML-only input deterministically produce structured vetted
records, original provider rendering, explicit `GLOBAL`/`UNKNOWN` semantics,
non-empty global fallback and B4-owned clicks. Publication and commercial
authority remain separately governed, and destination activation requires the
full tracker-to-operator proof rather than a B4 302 alone.

`VETTED-PARTNER-HOSTED-CREATIVES-01: COMPLETE`

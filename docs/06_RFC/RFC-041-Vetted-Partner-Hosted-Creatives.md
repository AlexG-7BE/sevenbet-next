# RFC-041 — Vetted Partner-Hosted Creatives

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 6 September 2026

**Implementation authority:** explicit Founder instruction `CONTINUE B4GAMBLE
FOUNDER OFFICE — VETTED-PARTNER-HOSTED-CREATIVES-01`.

## Decision

B4GAMBLE supports original partner-hosted commercial creatives from a small,
explicit provider allowlist when deterministic partner metadata is sufficient.
It does not download, OCR, screenshot or semantically inspect those creatives
as the normal path, and it does not require an R2 copy.

The initial adapters are `SUPERFLY` as `PARTNER_HOSTED_IMAGE` and `BANNERFLOW`
as `PARTNER_HOSTED_EMBED`. This is not a generic remote-script platform. Every
provider has an exact parser, stored structured shape and rendering adapter.
Existing first-party `MediaAsset`/R2 media remains supported and unchanged.

## Evidence classification

- **DETECTED:** RFC-040 typed assignments, immutable `CasinoVersion`
  publication snapshots and the assignment-first resolver are active.
- **DETECTED:** `/r/{slug}` is the sole external commercial redirect authority
  and applies trusted GEO, current route, commercial, legal/account and safe
  destination checks before redirecting.
- **DETECTED:** the Media MCP exposes five tools and the Commercial MCP exposes
  four tools. Neither exposes a Media publish action.
- **DETECTED:** the real Founder Bannerflow fixture rendered from
  `c.bannerflow.net` in an isolated `sandbox="allow-scripts"` frame. Its
  observed subresources used only `c.bannerflow.net`.
- **DETECTED:** the bounded fixture run observed no `Set-Cookie` response and no
  cookie, localStorage, sessionStorage or IndexedDB write. One provider bundle
  contained a cookie-read helper. This is bounded evidence, not a permanent
  claim about all future provider code.
- **DETECTED:** the two exact Superfly fixtures carry distinct `creative_id`
  values and distinct click URLs while sharing the same affiliate/campaign.
- **DETECTED:** current Betsson evidence recognises the supplied
  `record.betsn.info` relationship, but no current canonical Betsson
  `PartnerRoute` exists. The fixture can be parsed and previewed but cannot be
  published until that independent commercial authority exists.

## Founder input and deterministic parsing

The unchanged `media_ingest_partner_snippet` input accepts either raw supported
HTML or one composite string:

```text
Description:
<optional partner description>
Embed Code:
<supported provider HTML>
```

The Admin page may expose those as separate fields, but joins them into the
same contract. Markdown fences and bounded HTML entity encoding are removed
before strict parsing. Pasted executable code is never run during ingestion.

Description parsing is deterministic. It may record an external label, brand,
purpose, exact country, dimensions, explicitly labelled language and explicitly
labelled currency. A country name/code disagreement is review-required. No
country is inferred from language or currency; no language or currency is
inferred from country; no offer terms are inferred from pixels or a generic
purpose label.

Missing description, market, language, currency or purpose is valid. `GLOBAL`,
`UNKNOWN` language and `UNKNOWN` currency do not themselves require review.
`UNKNOWN` language is distinct from `NEUTRAL`: neutral is an affirmative claim
that the creative is language-neutral, while unknown means it was not
established.

## Provider adapters

### Superfly

The parser accepts exactly one `<a>` containing exactly one `<img>`. It rejects
event handlers, additional elements, duplicate attributes, unsupported query
keys, non-HTTPS URLs, private/internal hosts, and any host/path other than
`go.superflypartners.net/click` and
`go.superflypartners.net/impression`.

Operator/program, affiliate, campaign and creative identifiers are required;
the image and click identifiers must agree. The exact impression URL is the
render source and the exact click URL is private destination evidence.

Public rendering uses an ordinary lazy browser `<img>` with `no-referrer`. It
does not use the Next.js image optimizer or a B4 server acquisition request.
The provider image has no click authority: a B4 overlay is active only when the
canonical governed action is eligible.

### Bannerflow

The parser accepts exactly one empty `<script>` element whose source is the
allowlisted `https://c.bannerflow.net/a/{24-hex-id}` contract. It validates the
exact `did`, `deeplink`, `adgroupid`, `media`, `campaign` and `redirecturl`
parameters and rejects extra elements, handlers, schemes, hosts or parameters.
The executable raw HTML is not persisted as public authority.

The public renderer reconstructs the provider URL from stored structured
parameters. The original external `redirecturl` is replaced with
`https://b4gamble.com/r/{canonical-slug}?creative={opaque-B4-UUID}`. The raw
partner destination is absent from page HTML, hydration data, public JSON and
the frame document.

Bannerflow runs in a B4-controlled frame with only `sandbox="allow-scripts"`.
It receives no `allow-same-origin`, popup or top-navigation permission. The
frame has no authenticated B4 data or privileged API and uses a response-local
nonce plus this provider-specific CSP boundary:

```text
default-src 'none'; base-uri 'none'; form-action 'none';
script-src 'nonce-…' https://c.bannerflow.net blob: 'unsafe-eval';
style-src 'unsafe-inline'; img-src https://c.bannerflow.net data: blob:;
font-src https://c.bannerflow.net data:; connect-src https://c.bannerflow.net;
frame-src 'self' blob:; object-src 'none'
```

The broader capabilities required by the real HTML5 creative are confined to
that frame; the main application CSP is unchanged. The iframe cannot read its
parent, owns no public click surface and has pointer interaction disabled. A
B4 overlay owns allowed mouse/keyboard action. Even an internal provider
navigation can reach only B4 `/r`, where normal commercial authority runs.

## Data model and publication boundary

Migration `0029_vetted_partner_hosted_creatives` adds
`PartnerHostedCreative` and three typed relationship tables:
`CasinoPartnerHostedCreativeAssignment`,
`CasinoBonusPartnerHostedCreativeAssignment` and
`AffiliateOfferPartnerHostedCreativeAssignment`.

The creative records provider/source mode, casino and optional bonus/offer,
provider IDs, declared and optional safely measured dimensions, safe image or
structured embed data, exact evidenced country/language/currency/purpose,
checksums/provenance, validation, canonical route/tracking relations and
destination-integrity result. The raw exact destination remains only in this
server-side record.

The assignment tables retain RFC-040 Option C typed foreign-key ownership and
placement restrictions. They add explicit language state because the older
first-party tables use null language to mean neutral. Hosted and first-party
relationships participate in one resolver. An exact logical-scope conflict is
review-only; application rechecks both table families so a race cannot create
a duplicate active slot.

Media ingestion can create/reuse a structured record and apply an eligible
assignment only to an otherwise draft subject. It cannot publish. Publication
filters out inactive, archived, unvalidated, unverified, route-less or
retargeted relationships, then writes only a safe rendering projection to the
immutable Casino snapshot.

That projection contains a one-way binding fingerprint over the offer, route,
tracking-link and destination checksum. `/r` requires the current exact server
binding to match the published fingerprint. Re-ingesting or rebinding a
creative therefore cannot alter a published destination without a new governed
publication.

## Destination integrity and commercial authority

Every new or changed destination receives one bounded server-side redirect
chain verification before it can become `VERIFIED`. The expected terminal
operator host comes from the associated Casino evidence. HTTP error terminals,
challenges, loops, attribution loss, unexpected hosts and malformed paths fail
activation. A prior verification is reusable only when casino, offer, route,
tracking link, expected operator host and destination checksum all remain
exact.

The creative UUID is not a URL input. `/r` resolves it server-side only when it
belongs to the exact already-selected Casino, offer, canonical redirect slug
and tracking link, remains active/validated/verified, and appears in the latest
published snapshot with the same binding fingerprint.

Creative resolution occurs after existing route, trusted-GEO and Production
eligibility checks; GB commercial readiness remains in its existing position.
A creative can never broaden a route's GEO, contract, account or legal
authority. Canonical CTA traffic without a creative identifier continues to
use the unchanged canonical destination.

## Presentation policy

For trusted country `C` and presentation language `L`, active eligible
assignments are ranked:

1. exact `C` plus exact `L`;
2. exact `C` plus neutral or unknown language;
3. global plus exact `L`;
4. global English plus EUR;
5. other global English;
6. global neutral;
7. global unknown; and
8. any other global explicit-language creative.

Language rank precedes currency. Within the same rank, an explicitly known
local currency may break a tie. Country-scoped inventory is never eligible for
another country or unknown GEO. If only one usable global creative exists, it
wins at the appropriate global fallback rank even if its language/currency is
not ideal. English/EUR is the preferred default when no higher rank exists,
especially for European presentation.

This order supersedes the narrower four-bucket language fallback description
in RFC-040 for mixed first-party/partner-hosted inventory. It changes media
presentation only; commercial eligibility remains independent.

## Failure, blocked markets and privacy boundary

Known dimensions reserve layout space and loading is lazy. Provider failure or
timeout swaps to the best current first-party Casino hero/logo, or a controlled
B4 placeholder when none exists. The generic fallback uses the canonical
governed action, not the failed creative's attribution.

A commercially blocked visitor may still see promotional media where current
policy permits, but receives no active B4 overlay. The provider receives no raw
external click target and cannot top-navigate around B4. `/r` independently
fails closed if reached.

Displaying partner-hosted inventory intentionally lets the browser contact the
provider. The observed Superfly image path is an impression request. The
observed Bannerflow fixture required only `c.bannerflow.net`. Requests can
disclose ordinary network metadata such as IP address, user agent and provider
creative identifiers; `no-referrer` is applied. No Programme, protected Help,
account or commercial-eligibility data is used to select the creative or sent
as provider parameters.

Current fixture evidence found no non-essential storage write, so no parallel
consent system is introduced. Provider behavior must be revalidated before a
new host/adapter or materially changed script is approved. If non-essential
storage/access appears and current policy requires choice, loading must use the
existing consent boundary and show first-party fallback until allowed.

## Admin, MCP and rollback

The existing Admin Media Operations screen adds separate Description and Embed
Code fields, structured provider/binding evidence, a clear `PARTNER-HOSTED`
label and protected Preview. It is not a general HTML previewer.

The Media MCP remains exactly five tools and accepts the composite syntax in
the existing `snippet` field. The Commercial MCP remains exactly four tools.
No unified MCP and no publish tool is introduced.

`VETTED_PARTNER_HOSTED_CREATIVES_ENABLED=true` independently enables public
hosted resolution and frame delivery. Disabling it makes hosted projections
ineligible while preserving first-party assignment/R2 fallback, Casino pages,
canonical CTAs and `/r`. Records and assignments are retained; rollback needs
no deletion or reverse migration.

## Non-goals

No generic Chromium acquisition service, Playwright Production renderer,
Browserless/Browserbase integration, OCR, AI vision, GIF semantic analysis,
Production screenshots, arbitrary third-party scripts, R2 replacement,
unified MCP, Media publish action or recurring paid infrastructure is approved.

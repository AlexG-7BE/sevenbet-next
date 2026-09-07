# Media Ingestion Contract

**Status:** ACTIVE Founder-authorised application, security and operations
contract
**Authority:** `B4GAMBLE — MEDIA-INGESTION-AUTOPLACEMENT-01` and the additive
`B4GAMBLE — GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01` and
`VETTED-PARTNER-HOSTED-CREATIVES-01`, as amended by the explicit Founder
instructions `B4GAMBLE — MEDIA-OPERATIONS-BULK-01` and
`B4GAMBLE FOUNDER OFFICE — END-TO-END BGA MEDIA COMPLETION`
**Evidence date:** 7 September 2026
**Architecture dependencies:**
[RFC-027 — B4GAMBLE Operational Agent Foundation](../06_RFC/RFC-027-B4GAMBLE-Operational-Agent-Foundation.md),
[RFC-040 — Placement-Based Media Assignments](../06_RFC/RFC-040-Placement-Based-Media-Assignments.md),
[RFC-041 — Vetted Partner-Hosted Creatives](../06_RFC/RFC-041-Vetted-Partner-Hosted-Creatives.md),
and the [Commercial Creative Format Contract](Commercial-Creative-Format-Contract.md)

This contract contains no secret value, raw affiliate destination, visitor
data or Programme data. Claims are classified as **DETECTED**, **INFERRED**,
**PROPOSED**, **UNKNOWN** or **CONTRADICTION** under the repository technical
evidence rule.

## Repository evidence boundary

**DETECTED IN THE AUTHORISED RELEASE CANDIDATE:** the isolated Git root was
confirmed before documentation work. The full
active repository was scanned with dependencies, generated output, build
artefacts, caches and `tsconfig.tsbuildinfo` excluded. The final inventory
contained 2,258 tracked active files in this documentation pass.

**DETECTED:** the first-party implementation uses the existing `MediaAsset`,
`CasinoMediaAssignment`, `CasinoBonusMediaAssignment`,
`AffiliateOfferMediaAssignment`, `SiteSetting` and `AuditLog` structures. It
does not add an RFC-040 placement/variant. The 5 September extension adds only
nullable `countryCode` and `languageCode` assignment fields through migration
0028 and includes them in the existing immutable `CasinoVersion` publication
projection.

**DETECTED IN THE AUTHORISED RELEASE CANDIDATE:** migration 0029 adds the
separate structured `PartnerHostedCreative` record and three typed hosted
assignment tables. It does not force executable provider media into the
first-party `MediaAsset` invariant and does not alter existing objects or
assignments.

**DETECTED:** public media rendering, governed clicks, CTA/GEO authority,
Casino/offer terms, scores and publication remain owned by their existing
services. Media ingestion creates no public route or public action.

## Accepted input contract

`media_ingest_partner_snippet` and the Admin intake accept one bounded UTF-8
string, optional context and an optional dry-run flag. The string is limited to
128 KiB and at most 20 unique image candidates.

Supported forms are:

- an HTTPS `<a href="…"><img src="…"></a>` snippet;
- an HTTPS `<img src="…">` snippet;
- a direct HTTPS image URL;
- a block containing several of those forms;
- one- or two-layer HTML-escaped markup;
- single-quoted, double-quoted and mixed-whitespace attributes; and
- partner metadata in bounded attributes or URL keys;
- an exact Superfly anchor/image provider contract;
- an exact Bannerflow script-source provider contract; and
- a composite `Description:` plus `Embed Code:` payload using the same
  `snippet` field. Description is optional.

The generic parser recognises image, creative, banner, campaign, programme,
partner/operator and affiliate identifier keys. Affiliate and campaign values
are hashed before persistence. Provider-specific metadata can be added later,
but image validation and authority never depend on one network.

Generic `script`, `iframe` and HTML5 creative code remain unsupported execution
types. The only executable input shape accepted is one empty Bannerflow
`<script>` whose HTTPS host, path, attributes and query keys match the RFC-041
adapter exactly. Its raw element is parsed but never evaluated during
ingestion. Script bodies, event handlers, extra elements, arbitrary hosts and
arbitrary iframe documents are rejected.

`media_ingest_partner_batch` is the additive bulk contract. It accepts 1–100
independent items. Each item has its own snippet, optional subject/target
context, optional declared width/height pair, provenance
`EXPLICIT_PARTNER_METADATA | NORMALIZED_SOURCE_FIELD`, title, description and
provider reference. Work is bounded to four concurrent item preparations and
four concurrent item ingestions within a subject group. One invalid item does
not abort valid neighbours; every item returns exactly one of `INGESTED`,
`REUSED`, `REVIEW_REQUIRED` or `REJECTED` plus bounded reason codes.

Multiple snippets are never concatenated into one executable input. Each
Bannerflow element must still satisfy the exact one-script parser contract in
its own item. The 100-item ceiling and 100-total-parsed-creative ceiling are
independent safety bounds.

## Untrusted HTML and raw-URL boundary

**DETECTED:** ingestion parsing is a bounded text scanner. It does not use a browser,
DOM, `dangerouslySetInnerHTML`, `eval`, a JavaScript VM, a headless browser or
partner-provided code.

The raw pasted snippet is held only for the request and parser call. A SHA-256
snippet checksum is persisted; the raw snippet is not. The ephemeral source
image URL and anchor href are removed before the durable plan is written.
Persisted URL evidence contains a SHA-256 URL hash, origin, bounded pathname
and query-key names, never query values. Final redirect provenance is recorded
in the same evidence-safe form with the redirect count.

The partner anchor is correlation evidence only. It is compared in memory with
existing governed `AffiliateTrackingLink` destinations for the resolved draft
offer. Exact evidence produces `MATCH`; a known disagreement produces
`MISMATCH`; anything else produces
`TRACKING_DESTINATION_REVIEW_REQUIRED`. No raw partner href becomes a public
link, `AffiliateOffer`, canonical tracking link, redirect, PartnerRoute or CTA.
RFC-041 may store an exact creative destination in the separate server-only
record. Media validity and commercial-route validity are separate facts. An
exact match to the current governed tracking or destination URL is canonical
route authority; a bounded external HTTP probe is advisory telemetry and an
HTTP 400 cannot override that exact internal match. Non-exact provider-campaign
bindings still require their governed terminal-destination evidence.

## Safe remote fetch

**DETECTED FOR FIRST-PARTY ACQUISITION:** only the server fetches creative bytes. Each hop must use HTTPS,
the standard HTTPS port and no URL user information. The client performs GET
only, requests identity encoding, sends a fixed image `Accept` header and
system user agent, and sends no Founder cookie, browser session, Authorization
header or pasted request header.

Before every connection, DNS resolves the hostname. Any empty, malformed or
mixed safe/unsafe answer set fails closed. The selected vetted address is
pinned into the HTTPS connection so a second resolver result cannot redirect
the socket. The policy blocks localhost/single-label/internal names, cloud
metadata, unspecified, loopback, RFC1918, carrier-grade NAT, link-local,
benchmark, documentation, multicast/reserved IPv4, IPv4-mapped IPv6, unique
local, link-local/site-local, multicast, translation, documentation and other
non-public IPv6 ranges. The current IPv6 boundary admits ordinary global
unicast only after excluding the current
[IANA special-purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry),
including `3fff::/20` documentation and `5f00::/16` SRv6 allocations.

Redirects are limited to three and the URL/DNS/address policy runs again for
every hop. Total timeout defaults to ten seconds, connect/read inactivity is
bounded, and the response is limited to the smaller of the configured media
limit and 10 MiB. Non-identity content encoding, a non-image Content-Type,
HTML/script payloads, a declared/actual MIME disagreement, malformed image or
invalid decoded dimensions fail before storage.

RFC-041 provider-hosted inventory deliberately does not use this byte-fetch
path. A Superfly impression image loads directly in the visitor browser. A
Bannerflow script loads only inside its isolated B4 frame. Those exceptions are
provider-specific rendering adapters, not an expansion of the generic fetcher.

## Media validation, storage and deduplication

Accepted raster types remain JPEG, PNG, WebP, AVIF and GIF. Existing
signature/container decoders determine actual MIME, decoded dimensions and
animation state. Declared HTML dimensions are evidence only and never override
decoded values. SVG and executable formats remain rejected.

The bulk contract also accepts official declared dimensions outside HTML.
Dimension provenance is persisted as explicit partner metadata, normalized
source field, title pattern, Description pattern, provider metadata and, for
first-party raster acquisition, pixel validation. When both declared and
decoded dimensions exist, disagreement produces
`DECLARED_DIMENSIONS_MISMATCH`; decoded pixels remain authoritative.

Validated GIF87a/GIF89a bytes continue through the existing strict decoder.
The original validated GIF is stored without a frame-flattening transform, and
animation/frame metadata remains available.

**DETECTED:** acquired media uses the configured first-party provider. Public
renderers never hotlink the original source for that first-party path. Media Operations checks the
validated source-byte SHA-256 before metadata processing, then checks the
processed-byte SHA-256 before using a checksum-derived unique storage key.
Repeated bytes therefore reuse the earliest active same-Casino asset regardless
of changed source URL, creative ID or typed owner. A same-checksum asset owned
by another Casino is retained without creating another object/row, but the plan
becomes
`DUPLICATE_OWNER_REVIEW_REQUIRED` and cannot auto-assign it. A post-upload
lookup closes the concurrent unique-key race without deleting a shared object.
Durable plan references accept controlled HTTPS URLs and normalized
root-relative first-party media paths already used by the Media Library; they
reject protocol-relative, traversal, executable and insecure remote forms.

The durable plan adds source/provider evidence even when an existing asset is
reused. It does not rewrite shared asset ownership merely to satisfy a new
snippet.

Hosted plans instead retain only an allowlisted provider render reference,
safe URL evidence, source checksum and B4 creative identifier. The raw creative
destination is excluded from durable plan output and public DTOs. Provider
identity deduplication does not collapse Superfly `creative_id=200` and
`creative_id=205`.

## Context detection

Optional context accepts `casinoId`, `casinoSlug`, `bonusId`, `opportunityId`,
a bounded partner/network identifier, up to 20 exact `targetCountryCodes`, a
nullable primary `creativeLanguage`, and explicit language state
`EXPLICIT | NEUTRAL | UNKNOWN`. Explicit, internally consistent Founder context
outranks inference. Country codes normalize to uppercase and deduplicate;
language normalizes to lowercase. Omitted language means unknown, while an
explicit null means genuinely language-neutral. Conflicting or missing subject
records produce `CONFLICT` and no MediaAsset write.

Without explicit context, deterministic matching compares bounded source/alt/
title/identifier evidence with current Casino domain, title, aliases, brand
and operator. A unique score separated from the next candidate may resolve;
multiple plausible identities produce `AMBIGUOUS`. A Casino's only draft bonus
may resolve deterministically. Partner identifiers may resolve through current
affiliate-network/program or Commercial Opportunity evidence. Multiple draft
bonuses, offers or programmes remain review signals.

Media storage requires one resolved Casino. The system never guesses across
ambiguous Casino identities.

## Deterministic and semantic analysis

Ordinary code owns checksum, MIME, animation, decoded dimensions, provider,
identifier/clue extraction, format family, governed-destination correlation,
offer arithmetic and placement compatibility.

**DETECTED:** the existing approved OpenAI Responses runtime is used through a
separate bounded visual adapter when explicitly enabled and configured. It
uses `gpt-5.6-terra`, low reasoning, one request per static asset, at most ten
assets per plan, a 30-second request timeout, strict JSON Schema, no tools,
`store: false` and first-party HTTPS image inputs. It returns advisory brand,
purpose, language/market/currency, offer/CTA, fine-print/RG, readability,
crop-safety, concerns and confidence evidence.

Animated assets, absent first-party HTTPS URLs, an absent API key, provider
errors and invalid structured output become `NEEDS_VISUAL_REVIEW`; they never
receive invented visual confidence. Image content and metadata are explicitly
treated as untrusted evidence. OpenAI image processing remains an external
provider boundary; `store: false` is not represented as a zero-retention
guarantee. See the official [API data controls](https://developers.openai.com/api/docs/guides/your-data).

Partner-hosted creatives never enter that visual adapter. Their semantic result
is deterministic provider/Description metadata only. Missing description,
market, language, currency or purpose is valid; the image or HTML5 pixels are
not inspected, and no offer amount, wagering, spins, currency or terms are
invented. A description country contradiction, invalid provider shape,
unevidenced canonical relationship or failed terminal destination remains
review-required for commercial application without invalidating otherwise
valid media. Analysis and physical scoring still run when the commercial route
is absent.

## Placement engine

The deterministic engine generates a reasoned 0–100 score. Physical fit is the
base; exact offer evidence, semantic confidence, market state, readability,
animation and compliance concerns adjust it. Offer mismatch and compliance or
high-confidence brand conflict override visual appeal. Candidate ordering is
stable, and only the highest-ranked eligible asset for a subject + placement +
variant can remain automatic.

Current rules are:

| Evidence | Candidate treatment |
| --- | --- |
| 300×250, 250×250, 336×280 promo | `BONUS_LISTING_CARD`, `BEST_OFFER_FEATURED`, `BEST_OFFER_SECONDARY`, `CASINO_OFFER_BLOCK` / `DEFAULT`; directory review only; no detail hero |
| 265×265 or another bounded card-ratio promo | compatible card scoring; exact standard cards remain preferred |
| 320×100 or 300×100 promo | the four commercial surfaces / `MOBILE` |
| 320×50 or 300×50 promo | lower-priority `MOBILE` fallback; cannot displace a superior landscape asset |
| 468×60 strip | deliberate offer-block review |
| 596×70 or 640×100 strip | desktop strip scoring; never coerced into a directory-card default |
| 728×90 promo | `CASINO_OFFER_BLOCK` / `DESKTOP` wide candidate |
| 940×250, 970×90, 970×250 or 980×120 | compatible wide desktop offer inventory; exact 728×90 remains preferred |
| 120×600, 160×600, 300×600 | library only; no current public placement |
| visual `LOGO` | inert `CASINO_LOGO` and `CASINO_COMPARE` only |
| visual `BRAND_ART` plus explicit safe crop | `CASINO_DETAIL_HERO` candidate |

`OFFER_DETAIL` remains a future-surface review suggestion, not an automatic
assignment. Large dimensions alone never establish `BRAND_ART`. COVER cannot
be applied unless the recommendation persists `cropSafe=true`; the repository
rechecks this invariant.

Offer comparison returns `MATCH`, `LIKELY_MATCH`, `MISMATCH` or `UNKNOWN` from
visible structured evidence versus the selected current bonus. A mismatch is
`REJECT`; unknown or incomplete semantic confidence is review-only.

Existing slots are classified as `NEW_SLOT`, `BETTER_CANDIDATE`, `EQUIVALENT`,
`LOWER_PRIORITY` or `CONFLICT`. Every existing explicit assignment is protected
by default. Only a deterministic better/equivalent candidate may be replaced,
and only when the Founder sends the explicit replace flag. A lower-priority
320×50 candidate cannot replace an existing 320×100 mobile asset. If the
active assignment changes or disappears after plan creation, apply fails that
recommendation with `ASSIGNMENT_CHANGED_SINCE_PLAN` and requires a fresh plan.
Slot identity includes exact country and language scope. `GLOBAL/en`, `FI/en`
and `FI/fi` are independent slots; none is a replacement conflict for another.

Plan decisions are:

- `AUTO_ASSIGN_DRAFT`: one resolved subject, valid same-Casino asset, strong
  current format fit, semantic confidence at least 0.85, no offer/brand/market
  contradiction, no compliance concern and no unreviewed tracking evidence;
- `SUGGEST_REVIEW`: fit exists but semantics, tracking, layout, crop or an
  explicit existing assignment needs a person;
- `LIBRARY_ONLY`: the media is valid but there is no appropriate current slot;
  and
- `REJECT`: unsafe, conflicting, wrong-subject or stale/mismatched promotional
  evidence.

Every analyzed asset also retains per-placement fit/score evidence. Hosted
recommendations persist `applyEligibility` and a precise `applyBlocker`.
Absent commercial authority uses
`CANONICAL_COMMERCIAL_ROUTE_REQUIRED`; it does not become a generic media
validation failure or prevent analysis.

## Exact-country and creative-language targeting

**DETECTED IN THE AUTHORISED RELEASE CANDIDATE:** RFC-040 assignments now carry
exact nullable country/language dimensions. `DEFAULT`, `DESKTOP` and `MOBILE`
remain responsive variants and are never used as market surrogates.

Founder-supplied target context is preserved as runtime authority for the draft
recommendation. Strong semantic evidence may identify a language, country,
currency or wording contradiction; the planner then retains the supplied scope,
records a clear reason and changes the recommendation to review-only. It never
auto-retargets to a detected market or makes a legal conclusion. Offer matching
is independent: correct target scope does not hide a stale/mismatched offer.

For a partner-hosted creative, one structured record has one exact target
scope. When provider metadata is silent, one explicit target country and an
explicit language or neutral-language declaration are applied to that record
and recorded in the durable plan notes. Provider metadata that contradicts the
requested scope is rejected. A country-silent hosted creative cannot fan out to
multiple requested countries; it must be ingested separately with exact source
or operational context for each country. The raw Description remains unchanged
as source evidence.

One stored asset expands to one recommendation per supplied exact country. The
global checksum path still creates/reuses one R2 object and one `MediaAsset`;
EE/en, LV/en and LT/en therefore reuse the same physical record. Unknown
language is not treated as neutral. Only strong text-free logo/brand-art
evidence can establish neutral identity media without an explicit neutral
declaration.

For effective presentation, RFC-041 extends the target order to: exact country
and language; exact country and neutral/unknown; global matching language;
global English/EUR; other global English; global neutral; global unknown; then
any remaining usable global creative. Wrong-country media is never a fallback.
Language rank precedes currency, while local currency can break a same-rank
tie. One usable global creative is selected rather than leaving the slot empty.

## Durable plan, draft authority and rollback

Each session writes a versioned strict plan under
`SiteSetting(media-ingestion-plan:<UUID>)`. It records checksums, safe
provenance, context, assets, semantic evidence, recommendations, state and a
bounded operation history. Strict read validation fails closed on malformed
stored data.

A bulk session additionally writes
`SiteSetting(media-ingestion-batch:<UUID>)` with its checksum, item outcomes,
counts and the IDs of separate durable plans. Items group only when they resolve
to the same Casino, Bonus/Offer/Opportunity and exact country/language scope;
different Casinos never become one multi-subject plan. Bulk get, analyze,
apply and rollback fan out only through those recorded plan IDs.

Application runs in a serializable transaction. A Casino or CasinoBonus target
still requires both the subject and parent Casino to be `DRAFT`. An
`AFFILIATE_OFFER` target requires the offer itself to be `DRAFT`; its immutable
same-Casino identity checks remain mandatory, while its parent Casino may be
`DRAFT` or already `PUBLISHED`. A non-draft offer remains blocked. Media or
hosted creative must be active, validated and same-Casino, subject/placement
and exact evidenced target must match,
COVER must be crop-safe, and the recommendation must still be automatic (or an
explicit eligible replacement). Assignment reference is exact:
`MEDIA_OPERATIONS:<planId>:<recommendationId>`. Reapplying is idempotent.

No method publishes/republishes a Casino, changes a `CasinoVersion` snapshot,
creates or activates an offer/route/CTA, alters GEO, score or terms, contacts a
partner, deletes media, changes code or deploys. Public pages continue reading
their prior immutable snapshot until the existing publication workflow runs.

An asset referenced by any country- or language-targeted assignment is
target-scoped inventory. The resolver excludes it from legacy Casino
`HERO`/`LOGO` compatibility fallback, including when the targeted
assignment is inactive, expired or malformed, so legacy asset lookup cannot
bypass the targeting boundary.

Rollback deletes only the exact plan-owned assignment in the same country and
language scope. If that assignment explicitly replaced an older draft
assignment and that exact scoped slot is free, the older assignment is
restored. MediaAssets are retained, including multi-country shared assets.
Hosted records are also retained. Cross-source slot conflicts are review-only,
and apply rechecks both table families to prevent a concurrent duplicate.

## Admin workflow and design lock

The protected `/admin/media-operations` page requires `media.manage`. It uses
the existing Admin shell, Card/Badge system, Media Manager evidence patterns
and placement-preview hierarchy. No new public design language or public
navigation entry is introduced.

The page provides separate optional Description and required Embed Code fields,
optional Casino/Bonus/partner context, exact target-country input,
explicit/neutral/unknown language state, analysis controls, first-party and
protected partner-hosted previews, declared and decoded
dimensions, MIME/animation/family, source provider, semantic brand/purpose/
confidence/crop evidence, market clues, canonical binding, offer match,
assignment comparison, score/reasons, `APPLY TO DRAFT`, explicit replacement
and plan-owned rollback. There is no automatic-publish action.

Authenticated target-simulation links expose DEFAULT, MOBILE and DESKTOP
projection with requested/resolved country-language diagnostics through the
existing Casino draft preview. Separate links show the unchanged
current `/casinos`, `/bonuses`, `/best-offers` and Casino-review state.

## B4GAMBLE Media Operations bridge

The protected resource is the separate exact resource `/api/mcp/media`. Its
only scopes are `media:read`, `media:safe_write` and optional
`offline_access`. A valid delegated `AdminUser` with `media.manage` remains
required at authorization, token/refresh and resource use.

The authorised release-candidate surface contains exactly six tools:

1. `media_ingest_partner_snippet` — parse raw or composite input, retain bounded
   explicit target evidence, and either acquire validated first-party media or
   create/reuse one exact vetted hosted record when context permits;
2. `media_ingest_partner_batch` — process up to 100 independent items with
   bounded concurrency, per-item outcomes and subject-isolated durable plans;
3. `media_analyze_and_plan` — classify and generate draft recommendations for
   one plan or all plans in one recorded batch;
4. `media_apply_draft_plan` — apply eligible draft recommendations or explicit
   plan rollback;
5. `media_get_plan` — read one safe plan or recorded batch with its plans; and
6. `media_list_recent_ingestions` — read a bounded recent plan list.

The OAuth issuer may serve both the existing Commercial and Media Operations
resources, but each registered client, authorization code, access token and
refresh token remains bound to exactly one exact resource. Commercial scopes
cannot call Media tools and Media scopes cannot call Commercial tools.

Create this as a separate ChatGPT custom app named exactly `B4GAMBLE Media
Operations` with MCP server URL `https://b4gamble.com/api/mcp/media`. Let
discovery supply OAuth endpoints; do not paste an API key, shared secret,
legacy Preview token or manually invented endpoint. The tool scan must show
exactly the six tools above. A Commercial Ops client or grant must never be
reused for this resource.

The connector has no schema/tool for publish, approval, AffiliateOffer or
PartnerRoute activation, tracking-route creation, offer/GEO/score mutation,
external communication, asset deletion, SQL/Prisma access, repository changes
or Vercel deployment.

## Partner-hosted browser and privacy boundary

Superfly media uses a direct no-referrer visitor-browser image request. The
Bannerflow fixture uses an isolated same-site frame with only `allow-scripts`;
its response CSP admits `c.bannerflow.net`, data/blob resources and the minimum
frame-local `unsafe-eval` used by the observed provider runtime. The main CSP is
not widened. The provider receives ordinary network request metadata and the
non-sensitive identifiers required to render the creative, but no Programme,
protected Help, account or commercial-eligibility data.

**DETECTED IN BOUNDED PREVIEW EVIDENCE:** the exact Bannerflow fixture contacted
only `c.bannerflow.net`; no response set a cookie and no cookie/localStorage/
sessionStorage/IndexedDB write was observed. One downloaded runtime helper read
`document.cookie`. This is a fixture/time-bounded finding. A provider contract
or host change requires revalidation. If non-essential storage appears and
current policy requires a choice, third-party loading must wait on the existing
consent boundary and use first-party fallback meanwhile.

## Audit contract

Every plan, batch, asset creation and assignment mutation writes `AuditLog` metadata
with `source=MEDIA_OPERATIONS`, channel (`ADMIN` or `CHATGPT_WORK`), actor,
plan ID, subject, checksum, provider reference, operation, previous state,
result and timestamp. Assignment rollback records retained assets and any
restored assignment. Secrets, pasted HTML, full image URL, full affiliate href,
OAuth tokens/codes and raw query values are excluded.

## Release and verification contract

Because this is a remote-fetch boundary and Production mutation bridge, release
must remain:

`feature branch → parser/SSRF/media/planner/auth tests → PR → CI → Preview →`
`isolated ingestion/no-public-change proof → merge → Production → bounded`
`fixture/draft-only proof → durable release record`.

No direct push to `main`, destructive migration or `prisma migrate reset` is
permitted. Migration 0028 is the prior additive targeting extension. Migration
0029 adds only hosted records, typed assignments, constraints and indexes and
must complete before the hosted feature flag is enabled. Migration 0030 changes
only hosted validation constraints so valid media no longer depends on remote
HTTP state, while a `VERIFIED` commercial route still requires exact offer,
redirect, tracking-link and verification-time authority.

Application rollback does not require reversing 0030: the older application
remains fail-closed against `PENDING` commercial routes. A later constraint
reversal is permitted only after a read-only preflight proves that no
media-valid/non-verified rows would violate the older coupled check; otherwise
the additive schema remains and the Media Operations capability stays disabled.
Durable plans, batches and audit history are never rewritten for rollback.

Editorial publication is explicitly unavailable during the brief code-first
state where the 0027 assignment tables exist but the six 0028 target columns do
not; existing public snapshots continue to serve unchanged.

**DETECTED:** exact PR/head/merge, Preview and Production deployments, live
bounded creative result, duplicate replay, draft authority, resource isolation
and final Production acceptance are preserved in the
[MEDIA-INGESTION-AUTOPLACEMENT-01 release record](../06_Operations/Media-Ingestion-Autoplacement-01-Release-Record-2026-09-05.md).

## Known limitations

- Animated creatives deliberately require human visual review; no frame-based
  semantic model is claimed.
- An image whose Casino cannot be resolved from explicit or textual evidence
  can be fetched/validated but is not stored or sent for visual analysis.
- Real localized inventory is not installed by the architecture release; each
  actual creative still needs governed intake, review, assignment and
  publication.
- The accepted Betsson Bannerflow fixture has no current canonical Betsson
  PartnerRoute, so it remains previewable but non-publishable until independent
  commercial authority exists.
- **DETECTED IN DISPOSABLE LOCAL ACCEPTANCE:** one bulk call processed all 88
  supplied Betsson Media Store rows as 88 unique Bannerflow identities and
  produced three durable subject-isolated plans: Inkabet 29, Betsson 34 and
  Betsafe Baltics 25. All 88 media records were valid and scored; all 88 lacked
  canonical routes in the isolated fixture and remained `REVIEW_REQUIRED`.
  Draft apply created zero assignments and returned
  `CANONICAL_COMMERCIAL_ROUTE_REQUIRED` for all 17 generated recommendations.
  Replay retained 88 hosted records and marked all 88 plan assets `REUSED`.
  No raw script was persisted. This does not claim Preview deployment,
  Production migration, publication or activation.
- Semantic analysis is advisory and dependent on configured provider access;
  deterministic ingestion and review status remain usable without it.

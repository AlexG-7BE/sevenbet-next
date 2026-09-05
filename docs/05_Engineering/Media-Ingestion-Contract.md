# Media Ingestion Contract

**Status:** ACTIVE Founder-authorised application, security and operations
contract
**Authority:** `B4GAMBLE — MEDIA-INGESTION-AUTOPLACEMENT-01`
**Evidence date:** 5 September 2026
**Architecture dependencies:**
[RFC-027 — B4GAMBLE Operational Agent Foundation](../06_RFC/RFC-027-B4GAMBLE-Operational-Agent-Foundation.md),
[RFC-040 — Placement-Based Media Assignments](../06_RFC/RFC-040-Placement-Based-Media-Assignments.md),
and the [Commercial Creative Format Contract](Commercial-Creative-Format-Contract.md)

This contract contains no secret value, raw affiliate destination, visitor
data or Programme data. Claims are classified as **DETECTED**, **INFERRED**,
**PROPOSED**, **UNKNOWN** or **CONTRADICTION** under the repository technical
evidence rule.

## Repository evidence boundary

**DETECTED:** the Git root was confirmed before documentation work. The full
active repository was scanned with dependencies, generated output, build
artefacts, caches and `tsconfig.tsbuildinfo` excluded. The pre-documentation
inventory contained 2,157 active files.

**DETECTED:** the implementation uses the existing `MediaAsset`,
`CasinoMediaAssignment`, `CasinoBonusMediaAssignment`,
`AffiliateOfferMediaAssignment`, `SiteSetting` and `AuditLog` structures. It
does not change `prisma/schema.prisma`, add a migration, add an RFC-040
placement/variant, or change the immutable `CasinoVersion` publication
projection.

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
- partner metadata in bounded attributes or URL keys.

The generic parser recognises image, creative, banner, campaign, programme,
partner/operator and affiliate identifier keys. Affiliate and campaign values
are hashed before persistence. Provider-specific metadata can be added later,
but image validation and authority never depend on one network.

`script`, `iframe` and HTML5 creative code are unsupported execution types.
They are recorded as `SCRIPT`/`IFRAME` and
`UNSAFE_OR_NON_IMAGE_CREATIVE`. A candidate proceeds only when an explicit
allowlisted data-image attribute contains an independently valid HTTPS image
URL. Script bodies, event handlers and iframe documents are never evaluated.

## Untrusted HTML and raw-URL boundary

**DETECTED:** parsing is a bounded text scanner. It does not use a browser,
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
link, `AffiliateOffer`, tracking link, redirect, PartnerRoute or CTA.

## Safe remote fetch

**DETECTED:** only the server fetches creative bytes. Each hop must use HTTPS,
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

## Media validation, storage and deduplication

Accepted raster types remain JPEG, PNG, WebP, AVIF and GIF. Existing
signature/container decoders determine actual MIME, decoded dimensions and
animation state. Declared HTML dimensions are evidence only and never override
decoded values. SVG and executable formats remain rejected.

Validated GIF87a/GIF89a bytes continue through the existing strict decoder.
The original validated GIF is stored without a frame-flattening transform, and
animation/frame metadata remains available.

**DETECTED:** stored media uses the configured first-party provider. Public
renderers never hotlink the partner source. Media Operations checks the
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

## Context detection

Optional context accepts `casinoId`, `casinoSlug`, `bonusId`, `opportunityId`
and a bounded partner/network identifier. Explicit, internally consistent
Founder context outranks inference. Conflicting or missing explicit records
produce `CONFLICT` and no MediaAsset write.

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
| 320×100 or 300×100 promo | the four commercial surfaces / `MOBILE` |
| 320×50 or 300×50 promo | lower-priority `MOBILE` fallback; cannot displace a superior landscape asset |
| 468×60 strip | deliberate offer-block review |
| 728×90 promo | `CASINO_OFFER_BLOCK` / `DESKTOP` wide candidate |
| 970×90 or 970×250 | valid wide inventory requiring layout review |
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

## Market and language limitation

RFC-040 has no locale/market assignment dimension. `DEFAULT`, `DESKTOP` and
`MOBILE` remain responsive variants and are never used as a market surrogate.
Any detected language, market or currency clue makes the recommendation
`MARKET_SPECIFIC_REVIEW`; the asset may remain in the library, but it cannot be
auto-assigned globally.

**PROPOSED — future decision only:** add a governed market/language media
resolution dimension if operational evidence shows a continuing need. That is
not implemented or authorised here.

## Durable plan, draft authority and rollback

Each session writes a versioned strict plan under
`SiteSetting(media-ingestion-plan:<UUID>)`. It records checksums, safe
provenance, context, assets, semantic evidence, recommendations, state and a
bounded operation history. Strict read validation fails closed on malformed
stored data.

Application runs in a serializable transaction. Casino and subject must still
be draft, media must be active and same-Casino, subject/placement must match,
COVER must be crop-safe, and the recommendation must still be automatic (or an
explicit eligible replacement). Assignment reference is exact:
`MEDIA_OPERATIONS:<planId>:<recommendationId>`. Reapplying is idempotent.

No method publishes/republishes a Casino, changes a `CasinoVersion` snapshot,
creates or activates an offer/route/CTA, alters GEO, score or terms, contacts a
partner, deletes media, changes code or deploys. Public pages continue reading
their prior immutable snapshot until the existing publication workflow runs.

Rollback deletes only the exact plan-owned assignment. If that assignment
explicitly replaced an older draft assignment and the slot is free, the older
assignment is restored. MediaAssets are retained, including shared assets.

## Admin workflow and design lock

The protected `/admin/media-operations` page requires `media.manage`. It uses
the existing Admin shell, Card/Badge system, Media Manager evidence patterns
and placement-preview hierarchy. No new public design language or public
navigation entry is introduced.

The page provides `PASTE PARTNER CREATIVE CODE`, optional Casino/Bonus/partner
context, analysis controls, first-party previews, declared and decoded
dimensions, MIME/animation/family, source provider, semantic brand/purpose/
confidence/crop evidence, market clues, offer match, assignment comparison,
score/reasons, `APPLY TO DRAFT`, explicit replacement and plan-owned rollback.
There is no automatic-publish action.

Authenticated draft-preview links expose DEFAULT, MOBILE and DESKTOP projection
through the existing Casino draft preview. Separate links show the unchanged
current `/casinos`, `/bonuses`, `/best-offers` and Casino-review state.

## B4GAMBLE Media Operations bridge

The protected resource is the separate exact resource `/api/mcp/media`. Its
only scopes are `media:read`, `media:safe_write` and optional
`offline_access`. A valid delegated `AdminUser` with `media.manage` remains
required at authorization, token/refresh and resource use.

The surface contains exactly five tools:

1. `media_ingest_partner_snippet` — parse, fetch, validate, deduplicate and
   create/reuse first-party media when context permits;
2. `media_analyze_and_plan` — classify and generate the draft recommendation;
3. `media_apply_draft_plan` — apply eligible draft recommendations or explicit
   plan rollback;
4. `media_get_plan` — read one safe plan; and
5. `media_list_recent_ingestions` — read a bounded recent list.

The OAuth issuer may serve both the existing Commercial and Media Operations
resources, but each registered client, authorization code, access token and
refresh token remains bound to exactly one exact resource. Commercial scopes
cannot call Media tools and Media scopes cannot call Commercial tools.

Create this as a separate ChatGPT custom app named exactly `B4GAMBLE Media
Operations` with MCP server URL `https://b4gamble.com/api/mcp/media`. Let
discovery supply OAuth endpoints; do not paste an API key, shared secret,
legacy Preview token or manually invented endpoint. The tool scan must show
exactly the five tools above. A Commercial Ops client or grant must never be
reused for this resource.

The connector has no schema/tool for publish, approval, AffiliateOffer or
PartnerRoute activation, tracking-route creation, offer/GEO/score mutation,
external communication, asset deletion, SQL/Prisma access, repository changes
or Vercel deployment.

## Audit contract

Every plan, asset creation and assignment mutation writes `AuditLog` metadata
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
permitted. There is no schema migration in the detected implementation.

**UNKNOWN until release evidence is recorded:** exact PR/head/merge, Preview
deployment, Production deployment, live bounded fixture result and final
Production acceptance.

## Known limitations

- Animated creatives deliberately require human visual review; no frame-based
  semantic model is claimed.
- An image whose Casino cannot be resolved from explicit or textual evidence
  can be fetched/validated but is not stored or sent for visual analysis.
- Market/language-specific assignments need a separately approved resolver
  dimension before automatic localized placement is possible.
- Semantic analysis is advisory and dependent on configured provider access;
  deterministic ingestion and review status remain usable without it.

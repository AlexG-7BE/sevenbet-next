# B4GAMBLE Current State

**Status:** CURRENT AUTHORITATIVE CHECKPOINT  
**Evidence date:** 13 September 2026
**Owner:** 7BE Inc. / B4GAMBLE Founder Office  
**Production:** `https://b4gamble.com`  
**Current Production application SHA (live provider evidence):** `22cf696b31b6adc3e456508b1a140044a5061698`
**Verified post-release runtime baseline SHA:** `22cf696b31b6adc3e456508b1a140044a5061698`
**Verified post-release runtime deployment:** Ready; `5i5N2H2xWqMySWysU78EdinEwK2v`

Documentation-only commits may advance `main` and trigger equivalent Vercel rebuilds after this runtime baseline. Use live GitHub/Vercel evidence for the exact current head/deployment when that distinction matters.

This checkpoint supersedes older candidate/draft/current-state language where it conflicts with newer verified evidence below.

## Commercial Core Simplification PR2 — review candidate

**DETECTED IN THE REPOSITORY CANDIDATE; NOT DEPLOYED:** PR #277 / RFC-047 is
merged on `main` at `7b2d935b7de9eaa376e0febca8da9b77435d7afd` and remains
the single public `GovernedCommercialAction | null` decision seam. The PR2
candidate establishes the separate canonical write boundary recorded by
RFC-048. Existing `AffiliateNetwork` persistence is reused as Partner identity;
one additive `PartnerCasinoRelationship` records the unique Partner × Casino
business fact without a status machine; and the transport-independent
`PartnerTrackingRegistrationService` owns explicit tracking/market commands.

The canonical registration path performs no `CommercialOpportunity`,
`CommercialTask` or `CommercialActivity` read or write. CRM remains available
for workflow and evidence but opportunity existence or stage cannot grant,
block or disable Partner identity, relationships, tracking registration or
MarketActivation. Legacy AffiliateNetwork lifecycle flags and static partner
matrices are not permission gates. `PartnerCasinoMarketSupport` remains
non-authoritative evidence, with new writes bound to the canonical relationship
and its old opportunity reference made optional.

Migration `0039_commercial_core_partner_relationship` is additive and creates
no rows or backfill. Existing legal, GB, trusted-GEO, URL/network safety,
route-verification, rollback, duplicate/idempotency and controlled `/r`
protections remain in the canonical application path. Commercial MCP remains a
transitional authenticated/rate-limited transport and delegates registration;
the bounded GoldenPlay verification record now lives at the application
boundary. No Production database, application, environment, tracking URL,
activation or deployment mutation has occurred.

## Customer Data, Analytics & Lifecycle Core v1 — Resend Production activation GO

**VERIFIED IN PRODUCTION, 12 September 2026:** PR #269 merged normally as
`e4268c9031cdf92704c529225ef71edcb16d20a5`; Ready deployment
`dpl_GnfsYABERTGLeQTDzKkNfdfg41xw` owns `b4gamble.com`. Additive migration
`0037_customer_data_analytics_lifecycle_core` is applied with all 37 ordered
migrations present. Analytics is enabled and the Core's customer, consent,
Programme observation, commercial attribution, fixed-dashboard and durable
email-ledger boundaries passed their release evidence. Aggregate Production
sanity found three canonical users, zero normalized-email duplicates, five
active English templates, no campaigns/messages/provider events and no
integrity defect; no email addresses were emitted.

**RESEND ACTIVATION GO:** the explicit 12 September 2026 Founder decision
approves Resend for bounded account, transactional, welcome, consented
Programme-reminder and consented broadcast/marketing processing. This removes
the former missing-Founder-transfer-approval hold but does not prove provider
configuration, delivery or every legal requirement. Live provider inspection
shows the `b4gamble.com` domain, DKIM and SPF return-path records verified and
two existing sending-only credentials. The canonical lifecycle webhook is now
enabled for delivered, bounced, clicked, complained and suppressed events;
its signing secret plus the approved sender and reply-to are stored in Vercel
Production without disclosure. PRs #271, #273 and #274 merged normally. PR
#273 corrected the Production canonical-host cron boundary and wired the
standard password-reset entry point to the existing transactional transport;
PR #274 corrected the browser-form unsubscribe response after live acceptance
found an immutable redirect-header failure. Every exact-head gate passed
before merge.

All six controlled Production cases now pass. Welcome, consented Programme
reminder, bounded broadcast and password-reset messages were delivered only to
a marked provider-safe non-customer fixture. Signed unsubscribe persisted and
rendered a `303` confirmation; an identical second campaign had zero eligible,
one suppressed and zero queued recipients. Marketing withdrawal did not block
the separate transactional reset path. Unsigned and forged webhooks returned
`401`; authentic, duplicate and signed-unknown cases returned their governed
`200`/`202` outcomes without replay or cross-customer mutation. Aggregate
post-test sanity records five delivered Production messages, five distinct
delivered provider events, four completed campaigns, zero queued/sending/
failed messages, zero duplicate keys/events/lifecycle sends, zero post-
unsubscribe marketing and zero non-fixture messages. The two fixtures remain
marked `INTERNAL_ACCEPTANCE` as audit evidence; no real customer was contacted.
Lifecycle delivery is enabled. Ready canonical deployment
`5i5N2H2xWqMySWysU78EdinEwK2v` serves source
`22cf696b31b6adc3e456508b1a140044a5061698`; the post-release nine-route smoke
passed.
See [RFC-046](06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md),
the [technical baseline](05_Engineering/Technical_Baseline/16_Customer_Data_Analytics_Lifecycle_Core.md),
the [operations runbook](06_Operations/Customer-Data-Analytics-Lifecycle-Core.md)
and the [Resend activation record](06_Operations/Resend-Production-Activation-2026-09-12.md).

## Logo-only Product, MEDIA-GEO3 retirement and eleven-locale cutover complete in Production

**VERIFIED (repository, Production DB and live runtime):** RFC-044 records the current Founder decision for a
logo-only operator Product, retirement of MEDIA-GEO3 runtime/business authority,
media-independent commercial authority and locale/market separation. Migration
`0034_logo_only_media_retirement` is non-destructive and makes historical
assignment, hosted-creative, creative-set/variant and media-revision authority
inert while leaving `MediaAsset` rows untouched. The canonical repository
language registry contains `en-GB`, `de-DE`, `es-ES`, `el-GR`, `sv-SE`,
`da-DK`, `it-IT`, `pt-PT`, `nl-NL`, `fi-FI` and `nb-NO`.

**VERIFIED — DB-first release gate and application cutover complete:** Migration 0034 is applied in
Production. Before/after evidence preserves all 254 hosted creatives, 148
assignment rows and every `MediaAsset`, including 16 active logos, while active
assignment, hosted-creative, creative-set/variant and revision authority is
zero. Ten fail-closed retirement constraints are verified. Production runtime
`413ad041d21543f8fb421dc691b77c37bdae1c56` serves the logo-only application,
cache-proof retirement endpoints and all eleven language routes. The dated
MEDIA-GEO3 entries below are historical delivery records, not current authority
or permission to reverse the Founder decision.

## Governance and read order

For internal decision authority, read in this order:

1. the current explicit Founder instruction, when present;
2. this current Founder-approved checkpoint;
3. only the relevant `ACTIVE` RFCs in the [RFC Registry](06_RFC/README.md);
4. live implementation and repository evidence; and
5. historical documents only when their context is needed.

The [Decision & Documentation Governance](GOVERNANCE.md) defines the authority, evidence, override and RFC rules. A newer explicit Founder decision may supersede an older internal boundary for its approved scope. For factual claims, live authoritative system, Production, repository and provider evidence still outranks this document when newer evidence conflicts with it.

## Executive state

| Area | Current state | Meaning |
|---|---|---|
| Public site / product | **READY** | Accepted public design/UX baseline is in Production. |
| Public legal implementation | **READY** | Current GB public legal copy/consent/disclosure implementation is in Production for the approved scope. |
| Legal / administrative compliance | **READY WITH FOUNDER-ACCEPTED DEFERRALS** | Public legal work is closed for current scope; specified administrative items remain open. |
| Commercial CRM / Partner Operations | **READY IN PRODUCTION** | COMMERCIAL-OPS-01 code is deployed and Production migration `0020_commercial_ops_01` is applied and verified. |
| ChatGPT Work MCP / Better Auth 1.7 | **COMMERCIAL MCP ENABLED; MEDIA MCP RETIRED BY RFC-044** | Commercial retains its governed resource. Migration 0034 prevents Media authority from being recreated; the application cutover makes the Media MCP, its DCR and discovery surfaces return cache-proof 410. |
| Partner tracking registration | **LIVE BASELINE; RFC-048 WRITE-CORE REVIEW CANDIDATE** | Production retains the prior MCP registration baseline. The PR2 repository candidate removes CRM/static/lifecycle permission gates, adds one canonical Partner × Casino relationship and requires non-serializable trusted Founder provenance before every registration. OAuth scope and staff permission are execution gates only; the retained MCP has no trusted authority source and fails closed before canonical commercial mutation. Additive migration 0039 and the compatible application are not deployed. |
| Production DB / MCP reliability | **READY IN PRODUCTION** | The intentional pooled one-connection runtime remains unchanged. Public discovery no longer competes with itself or concurrent discovery work inside a warm function; transient DB availability receives narrow, secret-safe 503 behavior without an unhandled initialization rejection or process exit. |
| Commercial partner activation | **READY IN PRODUCTION — 24 ACTIVE_HEALTHY / 540 TERMINALLY CLASSIFIED ROWS** | The exhaustive current-partner matrix covers four partners, 73 Casinos and 25 GEO labels: 24 ACTIVE_HEALTHY, 24 BLOCKED_BY_LAW, 17 ACTION_REQUIRED_REGULATORY, one BROKEN_ROUTE and 474 MISSING_TRACKING_ROUTE. RFC-042 is the sole activation authority; exact GEO, law, regulatory policy, safe-route and missing-link controls remain fail closed. |
| Casino market data | **FOURTEEN REAL PUBLISHED IDENTITIES — SAFE CROSS-MARKET OFFER PRESENTATION ACTIVE** | Market-projected Casino facts remain isolated. A bounded immutable published-bonus corpus now resolves `EXACT > ROW > OTHER_MARKET > NONE`; StarCasino IT plus genuine Rizk and NordicBet ROW offers are reconciled without creating commercial or media authority. Founder-approved scores remain unchanged. |
| Placement media | **RETIRED — HISTORICAL ROWS INERT** | Migration 0034 preserves every historical assignment and asset row but forces all six assignment families inactive. Promotional placement state is no longer public, commercial or release authority. |
| Canonical public CTA authority | **RFC-047 SINGLE PUBLIC ACTION SEAM — MERGED REPOSITORY BASELINE** | PR #277 is merged at `7b2d935b7de9eaa376e0febca8da9b77435d7afd`. Public directory, offer, comparison and review consumers use one nullable governed action; RFC-042 `MarketActivation` remains the transitional persisted route source. This repository fact does not assert a newer Production deployment than the verified runtime baseline above. |
| GEO-localized creative assignments | **RETIRED — HISTORICAL TARGETING EVIDENCE ONLY** | Exact-country/language assignment rows remain for audit but are inactive and database-constrained. Trusted GEO continues to govern jurisdiction independently of language and media. |
| Vetted partner-hosted creatives | **RETIRED — 254 HISTORICAL ROWS PRESERVED AND ARCHIVED** | Hosted creatives remain inert evidence. Public frames/previews and active assignments are retired; they cannot supply Product or commercial authority. |
| Commercial creative formats | **HISTORICAL COMPATIBILITY / TEST VOCABULARY** | Format parsers and pre-retirement tests may remain inert. Active public compositions accept operator logos or explicitly B4GAMBLE-owned editorial art, never promotional creative formats. |
| Media ingestion / Media Operations | **PROMOTIONAL OPERATIONS RETIRED; LOGO AND B4GAMBLE EDITORIAL ASSETS ONLY** | Active Admin media is limited to canonical logos and authenticated `b4gambleOwned` editorial social imagery. Promotional ingestion/analyse/apply/assignment/MCP surfaces are 410 in the application cutover and retired states are rejected by Production constraints. |
| Public language / market presentation | **ELEVEN LOCALES LIVE IN PRODUCTION** | One language-only registry owns `en-GB`, `de-DE`, `es-ES`, `el-GR`, `sv-SE`, `da-DK`, `it-IT`, `pt-PT`, `nl-NL`, `fi-FI` and `nb-NO` across Home and Programme. A language route or preference changes copy only; trusted request GEO remains the independent market authority. |
| Customer data / analytics / lifecycle | **CORE VERIFIED; RESEND ACTIVE IN PRODUCTION** | PR #269 and migration 0037 remain verified. Founder processing authority, provider configuration, signed webhook controls and all six controlled acceptance checks pass; lifecycle delivery is enabled with zero non-fixture acceptance messages. |

### Recent implementation state

**PROPOSED — CRM-INDEPENDENT COMMERCIAL WRITE CORE AUTHORITY CORRECTION, 13
September 2026:** PR #278's repository candidate requires a process-local
trusted `FOUNDER_DIRECT` or `FOUNDER_DELEGATED` context with the actual opaque
decision reference before any registration work. Validation occurs before
identity resolution or data mutation. A current, missing or ended canonical
relationship all require command authority; trusted execution respectively
leaves it unchanged, creates it or reopens the same row. Actual decision
references flow to new/reopened relationship evidence, registration metadata,
exact-market evidence, MarketActivation source references and bounded audit;
URL hashes remain technical identifiers. The public MCP schema cannot mint the
capability and the adapter supplies none, so even a permitted caller fails
closed. CRM, static inventory and GoldenPlay route evidence provide no general
commercial authority. This is review-candidate state only: migration 0039 is
not applied in Production, the application is not deployed, and no Production
data was changed.

**PROPOSED — RUNTIME MARKET REGISTRATION REVIEW CANDIDATE, 11 September
2026:** repository evidence adds additive migration
`0036_partner_casino_runtime_market_support`, extends the existing fifth
Commercial MCP tool with mutually exclusive `geo` / `supportedGeos`, and makes
the code-generated worldwide matrix seed authority rather than the runtime
ceiling. Exact runtime support persists through `CasinoCountry`, truthful
internal-workflow evidence and `PartnerCasinoMarketSupport`; legal/regulatory
classification and RFC-042 activation remain independent. A generic batch
performs one external route check and RFC-042 records that bounded result for
each eligible market. This is review-candidate state only: no Production
migration, application deployment or data mutation has occurred. Required
release order is migration 0036 first, verification, then the compatible
application under separate authority.

**VERIFIED — PARTNER TRACKING REGISTRATION MECHANISM LIVE, 10 September
2026:** [PR #234](https://github.com/AlexG-7BE/sevenbet-next/pull/234)
merged normally as `95b47beb8721900b3803163b13b66beba0ab2828`; Ready
Production deployment `dpl_FwaFucGtxGmrw3yocNLxQg6825t9` owns the canonical
aliases. No schema migration or backfill was required. Authenticated Production
MCP discovery exposes five tools and the new strict
`commercial_register_partner_tracking_link` contract requires exactly
`partner`, `casino` and `trackingUrl`, with optional `geo`.

The guarded idempotent Production smoke re-registered the existing Betsson
Group Affiliates × Rizk × RS exact route using only its in-memory canonical
value. It returned `NO_CHANGE / ALREADY_REGISTERED`, link hash
`1288d3b46c980a4fccad33c57cde77ac19ec02553502def3296bd37221f085c5`,
final host `rizk.rs` after two redirects and preserved the same
`ACTIVE + HEALTHY` MarketActivation. Before/after counts were identical: one
Program, one Offer, 17 historical/canonical TrackingLinks, one `/r` mapping and
one exact MarketActivation. Response and audit leak checks passed. A 24-entry
deployment-log scan found zero raw canonical URLs, known token values or
sensitive-field markers. KZ and spoofed-RS public `/r` probes both failed
closed to the no-store internal recovery surface, confirming no cross-GEO
leakage or client-header authority. The pre-release Ready deployment
`dpl_HTY6fLMQgW6VWfgxm2enroUMXvTV` remains the rollback target. See the
[Partner Tracking Link Registration runbook](06_Operations/Partner-Tracking-Link-Registration.md).

**VERIFIED — GLOBAL CURRENT-PARTNER COMMERCIAL ROLLOUT COMPLETE, 10 September
2026:** [PR #223](https://github.com/AlexG-7BE/sevenbet-next/pull/223),
[#224](https://github.com/AlexG-7BE/sevenbet-next/pull/224),
[#225](https://github.com/AlexG-7BE/sevenbet-next/pull/225),
[#226](https://github.com/AlexG-7BE/sevenbet-next/pull/226),
[#227](https://github.com/AlexG-7BE/sevenbet-next/pull/227),
[#229](https://github.com/AlexG-7BE/sevenbet-next/pull/229),
[#230](https://github.com/AlexG-7BE/sevenbet-next/pull/230) and
[#231](https://github.com/AlexG-7BE/sevenbet-next/pull/231) merged the
Founder-authorized current-partner rollout. Runtime baseline
`dea5d22d5b0c998fd0e4ca36cec52d6e30e63b8c` is Ready as
`dpl_A64EXh8tYj8toWexhdDovMAz7EYa`. The fingerprint-guarded RFC-042
controller reconciled four current opportunities, 60 normalized BGA links and
72 exact activation records without a schema migration or destructive write.

The canonical matrix now terminally classifies all 540 Partner × Casino × GEO
rows across four current partners, 73 Casinos and 25 GEO labels: 24
ACTIVE_HEALTHY, 24 BLOCKED_BY_LAW, 17 ACTION_REQUIRED_REGULATORY, one
BROKEN_ROUTE and 474 MISSING_TRACKING_ROUTE. The 24 active rows comprise 12 BGA
routes and the six Superfly brands in IE and MT. All six technically healthy
Superfly GB routes remain canonically disabled because the independent
B4GAMBLE GB jurisdiction policy still denies commercial/referral capability;
Inkabet PE alone is BROKEN_ROUTE after persistent real HTTP 403 responses.

Bounded external verification established the expected final operator host
and retained attribution for all 25 authorized remaining underlying routes.
The final isolated Production-runtime pass proved 24 governed 302 routes, six
controlled GB-policy 303 responses and eight negative cross-GEO probes, with
zero route leakage and zero raw tokenized URL emission. Read-only postflight
closed at 540 matrix rows, four current CRM opportunities and seven legitimate
current tasks. The eleven published locales and independent `noindex, follow`
SEO gate remain unchanged; `fr-FR` was not fabricated or published. See the
[Global Current-Partner Commercial Rollout release
record](06_Operations/Global-Current-Partner-Commercial-Rollout-2026-09-10.md)
for every row and the bounded Production evidence.

**VERIFIED — LOGO-ONLY / MEDIA-GEO3 RETIREMENT / LOCALE REACTIVATION LIVE, 10
September 2026:** [PR #218](https://github.com/AlexG-7BE/sevenbet-next/pull/218)
merged as `413ad041d21543f8fb421dc691b77c37bdae1c56`. Ready Production deployment
`dpl_EKNtfHi33WWzmuheEh2MUWybiFXb` owns `b4gamble.com` and
`www.b4gamble.com`. Its immutable build log verifies pooled/direct database
identity, Migration `0034_logo_only_media_retirement`, all ten retirement
constraints, zero active assignment/hosted-creative/set/variant/revision
authority, 16 preserved active logo assets, 39 published Casinos, 14 real
operators, all 14 required direct operator logos and zero active legacy media
authority.

Live acceptance returned 200 for all eleven Home and eleven Programme routes,
and 308 for the four legacy Programme aliases. Home and Programme expose the
same registry-backed language set. German presentation rendered `de-DE` while
retaining independently trusted `KZ`; a `country=PE` query was removed and the
public API returned the same isolated projection with or without that query.
Programme exposes all eleven reciprocal locale alternates plus `x-default`;
review-gated Product translations remain self-canonical `noindex, follow` and
outside the sitemap until their independent indexing authority is approved.

Casino directory, Best Offers, Bonuses and a published Casino review rendered
only canonical operator logos or B4GAMBLE-owned composition, with no creative
iframe, hosted frame, assignment marker, broken completed image, console error
or empty promotional frame. Media MCP discovery/runtime, Media DCR, Admin
ingestion/assignment and hosted-frame probes returned cache-proof 410 while
Commercial MCP discovery remained live. Exact-head CI run
[34449281173](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34449281173)
passed Agent Core, Quality, Database/Migration Verification and Build/Browser,
including 279 public browser cases, 19 Programme cases and Programme-state
preservation across locale changes. Application recovery remains an exact
known-good Vercel rollback or a forward fix; Migration 0034 retains history and
must not be reversed into promotional authority without a new Founder decision.

**DETECTED — SAFE OFFER CORPUS COMPLETION AND CROSS-MARKET PRESENTATION LIVE, 9
September 2026:** Phase A [PR #208](https://github.com/AlexG-7BE/sevenbet-next/pull/208),
[PR #209](https://github.com/AlexG-7BE/sevenbet-next/pull/209) and
[PR #210](https://github.com/AlexG-7BE/sevenbet-next/pull/210) preserved the
trusted market projection, added an immutable published-bonus-only read path
and one deterministic `EXACT > ROW > OTHER_MARKET > NONE` resolver, and closed
UUID-query and duplicated market-licence findings from live acceptance. Final
Phase A runtime `c98ff14caea2077571b75ca61bea5642a38ae2c6` was Ready as
`dpl_2iS9gpDrYJs2AGF7N5g3kqM4UK3q` before Phase B began.

Phase B [PR #211](https://github.com/AlexG-7BE/sevenbet-next/pull/211)
reconciled exactly three sparse, deterministic editorial records:
StarCasino IT, Rizk ROW and NordicBet ROW. Its first Production build committed
and published the transaction, then failed because postflight inspected only
the top-level global snapshot container. Read-only inspection proved all three
records and scopes before any replay. [PR #212](https://github.com/AlexG-7BE/sevenbet-next/pull/212)
made verification understand both global and nested factual-market snapshot
containers; the immediate replay reported all three unchanged. Runtime
`6deca5539812a72f5eac1c09fbd2f9b107da32d3` is Ready and owns
`b4gamble.com` and `www.b4gamble.com` as
`dpl_5u5zVe8qMvbuUq2Kw2Y287v4bEkx`.

Direct Production verification passed the catalog and MEDIA-GEO3 postflights,
the internal MarketActivation invariants, trusted-KZ offer/API acceptance and
all nine required public routes with rendered logos and no console, hydration,
runtime or HTTP 5xx failure. The single Inkabet PE partner HTTP 403 remains the
same bounded external route-health challenge. Pre/post fingerprints are exact
matches for all 11 protected commercial, activation and media collections;
all six governed offers have zero transferred action, and the three new offers
have zero media bindings. No schema, migration, `vercel.json`, build-order,
score, redirect, tracking-link, MarketActivation or MEDIA-GEO3 mutation was
introduced. See the [decision record](07_Decisions/SAFE-OFFER-PRESENTATION-2026-09-08.md)
and [60-row audit](07_Decisions/SAFE-OFFER-CORPUS-DIRECT-LINK-AUDIT-2026-09-08.md).

**DETECTED — MEDIA-GEO3 PRODUCTION COMPLETE, 8 September 2026:**
[PR #198](https://github.com/AlexG-7BE/sevenbet-next/pull/198) delivered the
RFC-043 Production media pipeline and additive migration
`0033_media_geo3_pipeline`; [PR #199](https://github.com/AlexG-7BE/sevenbet-next/pull/199)
aligned postflight with PostgreSQL's physical index-name limit. The
fingerprint-guarded migration completed once with checksum
`39c7a672dc04dd1a4777b04db630a11d0c9403c7b07060e7db77b0a62970816e`.
The bounded idempotent backfill activated exactly three creative sets, six
variants and 12 READY preflight cells for Diamond7, G'day Casino and 21 Privé,
with zero generic promotions, raw destinations or destructive writes.

[PR #201](https://github.com/AlexG-7BE/sevenbet-next/pull/201) made the
RFC-042 `MarketActivation` runtime, including healthy global fallback, the
directory/comparison source of canonical CTA routes and removed retired legacy
lifecycle vetoes without adding a decision layer. [PR #202](https://github.com/AlexG-7BE/sevenbet-next/pull/202)
and [PR #203](https://github.com/AlexG-7BE/sevenbet-next/pull/203) closed real
Production containment defects in the review-right hero and directory-card
creative link box. [PR #205](https://github.com/AlexG-7BE/sevenbet-next/pull/205)
added visitor-GET verification for partner endpoints that synthesize HEAD 404;
[PR #206](https://github.com/AlexG-7BE/sevenbet-next/pull/206) made the external
health monitor select active RFC-042 `MarketActivation` claims and reuse the
existing canonical verifier instead of deprecated compatibility projection.
Production route-health run
[34232082558](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34232082558)
passed all nine active claims and closed
[issue #200](https://github.com/AlexG-7BE/sevenbet-next/issues/200); smoke run
[34232077688](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34232077688)
passed. Final runtime `2656acfbb930143feec9c9a21233c647ef558597` is Ready as
`dpl_5H9Ap4eeiCwBcrVUGaTPKGnyHRBr`. Exact-offer media, canonical routes,
independent GEO/legal/safety controls, migration/schema, rollback,
mobile/desktop geometry and full CI passed. See the
[MEDIA-GEO3 release record](06_Operations/MEDIA-GEO3-Release-Record-2026-09-08.md).

**DETECTED — BGA-MEDIA-E2E-01 MEDIA DEPLOYED; COMMERCIAL AUTHORITY ON HOLD, 7
September 2026:** [PR #178](https://github.com/AlexG-7BE/sevenbet-next/pull/178)
merged normally as `6fc8a7cf2aa79ed435b427579c15e35f3218f538` after Agent
Core, Quality, Database / Migration Verification, Build / Browser and Vercel
passed. Ready Production deployment `dpl_WPgC21HgnvTNDDXMqieY5prqpDBL`
serves the exact merge. The complete 88-row BGA source reconciled to 52
supported exact-country Bannerflow creatives: Inkabet PE 29, Betsson PE 7,
Betsafe EE 9 and Betsafe LV 7; 36 out-of-scope or country-silent rows remained
unassigned. Production has 11 exact active offer assignments, 11 exact active
profile assignments and three new immutable Casino snapshots. Independent PE,
EE and LV probes found the exact hosted component and expected responsive
creative IDs on all four live Casino surfaces, and all 11 selected provider
frames rendered. The operation created no offer, route or tracking authority,
activated no link, left all 52 exact country records
`productionEligible=false`, changed no commercial status and deleted no row.
All four governed click probes failed closed through unavailable because the
programmes/offers remain draft, tracking verification is missing or stale and
Production authority is absent. See the
[BGA-MEDIA-E2E-01 release record](06_Operations/BGA-Media-End-to-End-01-Release-Record-2026-09-07.md).

The final post-documentation-deploy verifier detected that the legacy
Production bootstrap had reactivated one previously deactivated Inkabet PE
mobile offer relationship while its profile relationship remained inactive.
The exact row was returned to inactive under audit
`6824aafb-1a48-45f8-8bd1-21ffadd0ae5d`, with no deletion or eligibility
change; repeated verification restored the stated `11/11` active counts. [PR
#180](https://github.com/AlexG-7BE/sevenbet-next/pull/180) makes published
Casino assignment state and explicitly inactive bootstrap-owned rows durable
across later Production rebuilds.

**DETECTED — VETTED-PARTNER-HOSTED-CREATIVES-01 COMPLETE, 6 September
2026:** [PR #170](https://github.com/AlexG-7BE/sevenbet-next/pull/170) merged
as `f429ba0f1f04d95a12086e7c7302d708103eec9a` after exact-head CI and real
three-fixture Preview acceptance. Superfly #200 and #205 rendered as distinct
250×250 browser-hosted Skol creatives with independent checksum-bound
destinations; the original 300×100 Bannerflow Betsson CL creative rendered in
the B4 sandbox with only `c.bannerflow.net` observed. Betsson correctly stayed
review-required because no canonical B4 commercial route exists. Additive
migration `0029_vetted_partner_hosted_creatives` was applied once to the exact
fingerprinted Production resource with protected counts unchanged, and all
four hosted tables remain at zero rows. Ready Production deployment
`dpl_AvipjKt4zVhPaCKrq7eAAmFH22C1` carries the exact merge SHA. Nine-route,
first-party-media, public-leakage, MCP-boundary and database smoke passed;
exact-SHA Affiliate Route Health run
[34025199955](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/34025199955)
proved every current route healthy through the partner tracker to its expected
operator host, while all six B4 `/r` responses retained their canonical
checksums. The accepted log window contained zero 5xx, error, `P2024`, Prisma
or unhandled-rejection matches. No acceptance fixture was published to
Production. See the [VETTED-PARTNER-HOSTED-CREATIVES-01 release
record](06_Operations/Vetted-Partner-Hosted-Creatives-01-Release-Record-2026-09-06.md).

**DETECTED — SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01 COMPLETE, 6 September
2026:** [PR #167](https://github.com/AlexG-7BE/sevenbet-next/pull/167)
and [PR #168](https://github.com/AlexG-7BE/sevenbet-next/pull/168) merged as
`b28c43a2d77bdb520a857ddbc6f53738159e03e9` and
`0fc312db5bfbf4f6064454b94bb3a1e00f61dd59` after exact-head CI and Ready
Preview smoke. Authenticated portal and Production CRM evidence found five
campaign destinations with a sentence-ending period and one already-clean Skol
route. A guarded Serializable transaction repaired only the five affected
tracking-link values and checksum provenance, created revisions/audit records
and left Skol unchanged. The first execution hit the default remote transaction
timeout and rolled back cleanly; a bounded timeout safeguard passed a second PR
before the single successful retry. Independent verification found all six
routes `CURRENT`, allowed GEO projections ON, the preserved seven-country block
set OFF and no issues. Ready Production deployment
`dpl_8GB8majgeNzx7v9wHdCVHZ16oxGb` served six checksum-matched `/r` 302s and
nine successful public smoke routes with no acceptance-window 500/error logs.
No creative fallback, schema, GEO, offer, score, media, MCP, eligibility or UX
change occurred. See the [SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01 release
record](06_Operations/Superfly-Route-Destination-Integrity-01-Release-Record-2026-09-06.md).

**DETECTED — DIRECT-GOVERNED-OUTBOUND-01 COMPLETE, 6 September 2026:**
[PR #165](https://github.com/AlexG-7BE/sevenbet-next/pull/165) merged as
`02034b520ecd2c0c6f2ebd1605baa4c4b7275cb5` after focused regression,
exact-head CI and Ready Preview acceptance. Normal authorized commercial CTA
and promotional-creative anchors now use direct `/r/{slug}` navigation in a new
tab without a confirmation popup/page or second user activation. The existing
server-owned `/r` route remains the only external redirect authority and retains
its feature flag, trusted request GEO, cumulative commercial resolution,
jurisdiction logging, safe 302 response and best-effort outbound-click
recording. `/outbound/{valid-slug}` redirects internally to `/r/{slug}` for
compatibility; invalid input and ineligible requests retain the unavailable
terminal surface. Ready Production deployment
`dpl_DcAiTyArEtqLYQZpNco1yrKymU47` passed six-width responsive acceptance,
real CTA and creative click-through, three governed 302 probes, legacy route
acceptance, nine-route smoke and exact-deployment log review with zero 5xx or
error-level entries. The backward-safe analytics `direct` outcome is active;
historical confirmation outcomes remain parseable and public product analytics
remains disabled. No destination, ID, GEO/legal gate, database, MCP or Media
authority changed. See the [DIRECT-GOVERNED-OUTBOUND-01 release
record](06_Operations/Direct-Governed-Outbound-01-Release-Record-2026-09-06.md).

**DETECTED — GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01 COMPLETE, 5 September
2026:** [PR #163](https://github.com/AlexG-7BE/sevenbet-next/pull/163)
merged as `aedfaee48cefea34ac9b1fac71315ba7c8c3df19` after exact-head
CI, isolated Preview migration and hosted acceptance passed. Additive migration
`0028_geo_localized_creative_assignments` was then applied once to the exact
fingerprinted Production resource and independently verified: protected counts
remained 34 Casinos, 33 Bonuses, 11 Offers, 11 routes, 15 assets, 74 versions
and `26/20/0` typed assignments; all 46 existing assignments remain
`NULL/NULL`, with zero targeted rows. Ready deployment
`dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu` serves the canonical aliases from the
exact merge SHA and reports schema-ready build preflight. Public/API,
eight-review, 390/1440 adaptive media, cache/privacy, separate four-tool
Commercial/five-tool Media MCP and exact-deployment log acceptance passed. The
capability is Ready; no real localized partner creative has been installed or
published. See the [GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01 release
record](06_Operations/GEO-Localized-Creative-Assignments-01-Release-Record-2026-09-05.md).

**DETECTED — MEDIA-MCP-DCR-RESOURCE-FIX-01 COMPLETE, 5 September 2026:**
[PR #161](https://github.com/AlexG-7BE/sevenbet-next/pull/161) merged as
`edf191f9c52912fb1637b1f5952bf4f0e7830dfb` after exact-head CI and Preview
acceptance. Media now advertises its own RFC 8414 path issuer and DCR endpoint;
Commercial retains its existing issuer and endpoint. Neutral standard DCR
without custom resource fields, a scope discriminator or a Media-bearing name
creates exactly one resource-bound public client. Both valid resource flows
reached login and both inverse flows failed `invalid_target` in Preview and
Production. Ready Production deployment `dpl_F5s4pBxa4jkkRg2hv3CD6grcam9g`
also passed nine public routes, ten DB-free MCP method probes and an exact-
deployment error/credential log scan. No schema, migration, tool, CRM, Media,
R2, CTA, offer, GEO or public-product change occurred. See the
[MEDIA-MCP-DCR-RESOURCE-FIX-01 release record](06_Operations/Media-MCP-DCR-Resource-Fix-01-Release-Record-2026-09-05.md).

**DETECTED — PRODUCTION-DB-MCP-RELIABILITY-01 COMPLETE, 5 September 2026:**
[PR #159](https://github.com/AlexG-7BE/sevenbet-next/pull/159) merged as
`491e1c51bc26c60ac10b2fe5bf8f15bba5cfe044` after deterministic unavailable-
database and one-connection PostgreSQL acceptance, exact-head CI and a corrected
Preview passed. The first Preview transparently exposed six `P2024` failures
among eight concurrent `/casinos` requests; merge remained paused until the
complete one-connection discovery coordinator at accepted head
`2d47933371b229267b885476c7c58ebdf9b3a62e` made the repeated test 8/8 HTTP
200. Ready Production deployment `dpl_7VZfo7P55yAwgShrYK2wx1vDtk11` then
passed both MCP method-only probes, eight concurrent Casino reads, seven public
routes and an exact-deployment log scan with no P2024, Prisma initialization,
unhandled rejection, process exit, 500 or 503. No schema, data, environment,
provider/plan, R2, media, tool or authority change occurred. A safe current
Founder Commercial credential was unavailable, so no live authenticated MCP
read or refresh lifecycle is claimed beyond deterministic valid-token CI and
current metadata. See the
[PRODUCTION-DB-MCP-RELIABILITY-01 release record](06_Operations/Production-DB-MCP-Reliability-01-Release-Record-2026-09-05.md).

**DETECTED — MEDIA-INGESTION-AUTOPLACEMENT-01 COMPLETE, 5 September 2026:**
[PR #157](https://github.com/AlexG-7BE/sevenbet-next/pull/157) merged as
`b9965d5ca2744bdc510baadaad48fde3c1d39fba` after exact-head CI and Preview,
bucket-scoped Cloudflare R2 Standard transport preflight and custom-domain
verification passed. Ready Production deployment
`dpl_AWTHUgp2fp4XsVwRe4v25NKrcQoL` then completed one controlled current
Diamond7 ingestion and immediate replay: one 250×250 JPEG became first-party
`MediaAsset` `fb0a9f46-fb70-430e-a799-fc2cbf939f07` at
`media.b4gamble.com`, while the replay reused that exact object/row. Both plans
remained `SUGGEST_REVIEW`; no assignment or publication occurred. Read-only
postflight retained 8 real Casinos, 6 published Bonuses, 30 publication
snapshots and all 46 RFC-040 assignments with exact editorial/score, terms,
CTA/routes, GEO and Programme digests. The separate Media MCP exposes exactly
five read/safe-write tools, cross-resource scope probes failed closed, and
runtime logs were error-free and secret-safe. See the
[MEDIA-INGESTION-AUTOPLACEMENT-01 release record](06_Operations/Media-Ingestion-Autoplacement-01-Release-Record-2026-09-05.md).

**DETECTED — COMMERCIAL-CREATIVE-FORMATS-01 COMPLETE, 4 September 2026:**
[PR #150](https://github.com/AlexG-7BE/sevenbet-next/pull/150) delivered the
affiliate-industry format registry, strict GIF87a/GIF89a ingestion, native
commercial geometry, Admin suitability guidance and shared governed
CTA/creative action. Real Production acceptance then found that the composed
Slotnite 320×50 mobile stage remained too tall; the release stayed held while
[PR #151](https://github.com/AlexG-7BE/sevenbet-next/pull/151) added the compact
composition and real-inventory regression. Final runtime
`96cd546bf14a32fda0632f58382089aac4c7b905` is Ready as
`dpl_9PzTzpLcao3jveamPS9Dq4EVKF82`. Exact-head Preview and final Production
acceptance passed native 300×250, 250×250, 320×100, 320×50 and deliberate
728×90 presentation, animated GIF decoding, authorized mouse/keyboard
clickability, blocked non-interactivity, CTA/creative route agreement, raw-link
exclusion and responsive no-overflow gates. Bonuses retain three curated
records, Best Offers six, and Casino discovery eight real reviews. No schema,
migration, asset, assignment or commercial-authority change occurred. See the
[COMMERCIAL-CREATIVE-FORMATS-01 release record](06_Operations/Commercial-Creative-Formats-01-Release-Record-2026-09-04.md).

**DETECTED — PLACEMENT-MEDIA-ASSIGNMENTS-01 COMPLETE, 4 September 2026:**
[PR #148](https://github.com/AlexG-7BE/sevenbet-next/pull/148) activated RFC-040
Option C and merged as `aaebff1eccdf0f9694791b52fb88d1d011d74a17` after
exact-head Preview and full PR/merge CI passed. Additive migration
`0027_placement_media_assignments` was applied once to the fingerprint-guarded
Production database. The governed backfill produced 26 Casino and 20 Bonus
assignments, zero AffiliateOffer assignments and eight immutable projections;
the immediate rerun produced zero writes and the resolver comparison reported
62/62 matches. Ready deployment `dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2` serves the
canonical aliases with assignment-first reads enabled. Final 1440/390 browser,
all-eight review, Bonus Top-3, Best Offers, comparison, terms, CTA/GEO,
Programme/auth, canonical-route and read-only database acceptance passed. See
the [PLACEMENT-MEDIA-ASSIGNMENTS-01 release record](06_Operations/Placement-Media-Assignments-01-Release-Record-2026-09-04.md).

**DETECTED — CASINO-COMMERCIAL-VISIBILITY-03 COMPLETE, 3 September 2026:**
[PR #139](https://github.com/AlexG-7BE/sevenbet-next/pull/139) merged as
`e418d894d3f7156f60b2742c2c9389e11e8d7432` after all required CI and exact
Preview acceptance passed. A fingerprint-guarded Production reconciliation
published complete global catalog facts and one welcome offer for Diamond7,
G'day Casino, 21 Privé, Skol Casino, Slotnite and Hello Casino, plus six exact
Superfly programme/offer/link/redirect graphs carrying the seven-country block
set. The repeated write was a no-op. Live acceptance then detected that older
RFC-012 demo offers were still entering the shared offer repository; release
was held, [PR #140](https://github.com/AlexG-7BE/sevenbet-next/pull/140)
excluded them at the service boundary and merged as
`2507043cb945f2b920b73522763f51f36b3c246c`. Ready Production deployment
`dpl_7RFc2zonoZ9Upp9Fw5YtAmsvR8Ax` is sourced from that exact merge and serves
the canonical aliases. Final Production browser/database acceptance reports
eight real profiles, six real offers/routes, 42 detected route blocks, zero
demo identities, zero raw tracking URLs, zero issues and zero destructive
writes. See the [CASINO-COMMERCIAL-VISIBILITY-03 release record](06_Operations/Casino-Commercial-Visibility-03-Release-Record-2026-09-03.md).

**DETECTED — CASINO-REAL-CATALOG-02 COMPLETE, 3 September 2026:**
[PR #136](https://github.com/AlexG-7BE/sevenbet-next/pull/136) merged as
`68c9a8160d642c8795b3b7206fb8e67100978773` after all required checks and
actual Preview acceptance passed. A fingerprint-guarded Production
reconciliation published complete reviews, Founder-approved Editor Scores, SEO
and controlled real brand marks for Betsson, Skol Casino, Hello Casino, G'day
Casino, Diamond7, DragonBet, 21 Privé and Slotnite. The immediate repeat was a
no-op; exact final scoped counts are eight Casinos, nine profiles, ten licences,
95 evidence rows, 22 payments, three providers, 28 categories, two factual
bonus rows, eight published reviews/scores/SEO/media assets and zero commercial
routes. [PR #137](https://github.com/AlexG-7BE/sevenbet-next/pull/137)
then merged the live-acceptance overflow correction as
`769bf26317aab408eee3a3026f64822e09317608`; Ready deployment
`dpl_3JgZXZSPvv2HHud9shXJJiqh9EaW` serves the canonical aliases. Full
desktop/mobile/browser/API/GEO/redirect/Programme acceptance and final
read-only database/route-health postflight passed. See the
[CASINO-REAL-CATALOG-02 release record](06_Operations/Casino-Real-Catalog-02-Release-Record-2026-09-03.md).

**DETECTED — GEO-LANGUAGE-GLOBAL-CATALOG-01 COMPLETE, 3 September 2026:**
[PR #134](https://github.com/AlexG-7BE/sevenbet-next/pull/134) merged as
`f7f1251558ca6be773863023f01d2a8a1a054543` after all required gates passed.
Production deployment `dpl_Guy4E9LLYKQpws5MHWjQ7GYTibKZ` is Ready and serves
the canonical aliases. Public canonical identity is now language-only (`/en`,
`/de`, `/es`, `/el`, `/sv`, `/da`); trusted request GEO is independent of
language, preference and query state; and the global real-Casino catalogue
projects exact-market `PROMOTABLE`, `INFORMATIONAL_ONLY` or `HIDDEN` state.
Production HTTP/browser acceptance, a 13-market enforced read-only database
projection and post-acceptance logs passed. The final global projection contains
eight real informational identities, zero referral actions and zero eligible
routes; the database mutation count was zero. This newer Founder-authorised
release supersedes the historical BCP-47 canonical routing described in the
older GEO-LOCALIZATION-01 entries below. See the
[GEO-LANGUAGE-GLOBAL-CATALOG-01 release record](06_Operations/GEO-LANGUAGE-GLOBAL-CATALOG-01-Release-Record-2026-09-03.md).

**DETECTED — COMMERCIAL PLATFORM CODE COMPLETION, 3 September 2026:** PR #131
merged the exact Casino × GEO activation and asset adapters, aggregate-only
outbound-click accounting/reporting, read-only route health automation and
central market publication/indexability policy. Additive migration
`0026_commercial_platform_completion` is applied and checksum-verified. PR #132
fixed the monitor's repository context; the final manual Production health run
passed with no open alert. GB is centrally indexable, while its current Casino
directory applies a stricter inventory truthfulness `noindex`; SE and PE remain
centrally `noindex` on the documented data/content/legal blockers. No route was
activated. See the [commercial-platform completion release record](06_Operations/Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

**DETECTED — PR #105 merged:** merge `f457099` delivered the typed internationalisation foundation, `HOME_READY` / `PUBLIC_CORE_READY` / `ARCHITECTURE_ONLY` presentation states and Founder-accepted DE/ES/SE/DK/GR public-core presentations. PR #106 subsequently merged the separately governed Programme internationalisation architecture at `4184c4f`. The old description of PR #105 as unmerged was stale and is corrected here from repository history.

**DETECTED — GEO-LOCALIZATION-01 PR #121 merged, 2 September 2026:** merge `c27b94d22f50fd4822e61d6ae6353b01072d4682` deployed as `dpl_2RioUxbR838XZr8wGytPqrajgQVX`. The exact release made lowercase BCP-47 locale-market paths canonical and passed the ordinary Production smoke. `/en-gb`, `/en-gb/casinos`, `/sv-se` and `/sv-se/casinos` returned 200.

**DETECTED — GEO-LOCALIZATION-01 Production correction PR #122 merged, 2 September 2026:** merge `1392829c5823354ed9e3cb7d04d29b963e96262c` deployed as `dpl_2Wey6EznxUqnnRUYd7QVRbwQJ9ud`. `/en-gb`, `/en-gb/casinos`, `/sv-se`, `/sv-se/casinos`, `/es-pe` and `/es-pe/casinos` return 200 with matching `html lang`, self-canonical URLs, reciprocal locale alternates and exact selector state. Peru and Sweden remain `noindex, follow`; PE/SE public casino facts do not cross markets; no affiliate action appears; the Programme entry remains healthy. See [GEO-LOCALIZATION-01 implementation record](internationalisation/GEO-LOCALIZATION-01.md).

**DETECTED — CASINO-DATA-POPULATION-01 complete, 2 September 2026:** seven checksum-bound GB profiles — Hello Casino, Skol Casino, Diamond7, G'day Casino, 21 Privé, Slotnite and DragonBet — merged through PR #123 and imported atomically into Production by the closed, unmerged one-shot PR #124 executor. The committed reconciliation was `121 created / 0 updated / 5 unchanged`; both in-transaction and post-commit idempotency checks were `0 / 0 / 126`. Betsson remained unchanged in PE/SE, Gentleman Jim remained blocked, no candidate leaked outside GB, and no bonus, unevidenced payment, asset or commercial route was fabricated. The scoreless-profile comparison correction merged through PR #125 as `8e4cc093f5bbd9775ad60d586101aabd07308b78` and deployed Ready as `dpl_7Y4v58gkALDRNjkprNxCRhtzRLfR`; exact Production directory, detail, comparison, fallback and filter acceptance passed. See the [CASINO-DATA-POPULATION-01 release record](06_Operations/Casino-Data-Population-01-Release-Record-2026-09-02.md).

**DETECTED — Programme internationalisation PR #106 merged:** merge `4184c4f` presents one language-neutral Programme through its separately governed localized Programme routes while keeping locale out of Programme state, identity, rewards and persistence. It introduced no Prisma migration and did not extend public-market legal, indexing or commercial authority. Its runtime evidence and historical acceptance gates remain in [Programme internationalisation](internationalisation/programme-internationalisation.md).

**DETECTED — systemic Programme access merged and deployed:** PR #109 merged as
`be5641f90174b6200892274e5fd48000988091c5`, replacing the old authenticated
one-hour browser-authority lifecycle with one purpose-specific durable
`ProgrammeAccessAcceptance` per accepted User. Migration `0024` is effective in
Production and backfilled only the narrowly provable PROGRAM-AI
claim/Starting-Point path; generic historical enrollments remain explicitly
unknown. Later 0025/0026 preservation checks left Programme acceptance,
Enrollment, progress, reward, `currentStep` and Starting-Point projections
unchanged. See [Programme Access Authorization](05_Engineering/Technical_Baseline/12_Programme_Access_Authorization.md).

## Detected release evidence

### Casino market schema and Betsson PE/SE factual release

- Migration `0025_casino_market_profile_architecture` completed on 1 September 2026 from exact release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d` with SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.
- PRs #114, #111, #117, #112 and #118 then delivered the steady-state guard, market architecture, exact-country public read fix, checksum-bound disposable importer and null-safe factual publication runtime. Their merge SHAs and Production deployment identifiers are preserved in the [2 September casino release record](06_Operations/Casino-Market-Data-Release-Record-2026-09-02.md).
- The one-time execution-only PR #119 ran from exact head `3a48739d668d5005eb2c4cdabfa2f23103549007`, imported the exact nine-file bundle once and published one Betsson identity with independent PE and SE market profiles. It was closed without merge; its Production-targeted `--skip-domain` build `dpl_Fk23XAokr33hjubGsFKRSTdEFhRo` ended `Error` intentionally after the success sentinel.
- Import reconciliation was `78 created / 0 updated / 0 unchanged`; the immediate read-only idempotency comparison was `0 created / 0 updated / 78 unchanged`. The published Casino is version 1 with `editorScore=null`; both incomplete bonus observations remain `DRAFT` and are absent from public projections.
- Live postflight found Betsson alone in PE and alongside fictional Demo Prism in SE. PE projects PEN, Yape and two MINCETUR licences; SE projects SEK, Swish and Spelinspektionen licence `23Si2176`. Both retain typed `UNKNOWN` and `CONTRADICTION` evidence, expose no affiliate action and do not leak market facts into the other or unqualified projection.
- Production commercial state stayed fail-closed: no commercial write occurred; `AffiliateTrackingLinkCountry` remained zero; `productionEligibleRoutes` remained zero; no asset was published. `b4gamble.com` remained on Ready runtime deployment `dpl_6CRSFtbV4kZwhVurucV7jtKp4QoZ` at SHA `86470b8f05a9bc10f22fd7b18a09588319bfe2e0`.

### Public product and legal baseline

- PR #77 established the accepted B4GAMBLE v1 public product/design baseline.
- PR #78 delivered the GB public legal closeout for the current scope, including Programme consent/disclosure and final public affiliate/footer wording.
- The accepted public Product Freeze remains in force absent new scope, regression or materially new evidence.
- Programme/private/Help data remains separated from commercial ranking, routing and partner operations.

### Governance simplification

- PR #80 simplified RFC governance.
- Current explicit Founder instruction is the highest internal decision authority for its covered scope.
- RFCs are durable architecture/decision records, not routine PR/merge/deploy permission gates.
- Historical RFC wording cannot permanently veto a later explicit Founder decision.
- Decision authority does not fabricate external facts or override law/platform/technical reality.

### COMMERCIAL-OPS-01

PR #81 delivered the B4GAMBLE Commercial CRM and Partner Operations Agent.

**Commercial Admin routes:**

- `/admin/commercial`
- `/admin/commercial/partners`
- `/admin/commercial/partners/[opportunityId]`
- `/admin/commercial/analytics`

**Commercial CRM aggregate includes:**

- Opportunity
- Evidence
- Contact
- Activity
- Application
- Term
- Task
- AgentRun
- AgentOperation
- ActivationPacket

**Canonical pipeline:**

`PROSPECT → QUALIFIED → APPLICATION_READY → APPLIED → DUE_DILIGENCE → NEGOTIATING → APPROVED → ACTIVE`

with `REJECTED` and `ON_HOLD` terminal/side states where appropriate.

**Partner Operations:**

- canonical specialist key: `partner-operations`;
- compatibility alias: `partner-intelligence`;
- bounded CRM snapshot → strict model output → validation → transactional Agent-safe CRM operations;
- may prepare research/evidence, drafts, next actions, evidenced responses/terms and activation packets;
- cannot send external communications, submit applications, accept terms, set `APPROVED`, set `ACTIVE`, activate tracking, deploy, or mutate Production through the Agent surface.

CRM `APPROVED` is not public commercial authority. `ACTIVE` cannot be produced through ordinary CRM/Agent mutation. RFC-015 readiness, kill switch, AffiliateProgram/Offer/TrackingLink state and public routing remain independent server-authoritative controls.

## Production migration 0020

**DETECTED — Production migration `0020_commercial_ops_01` is applied and verified.**

Execution sequence on 20 August 2026:

1. Founder explicitly authorised the Production mutation with `GO 0020`.
2. A temporary fail-closed Production-only execution guard was introduced through PR #82.
3. The guard verified Production database readiness and same database identity for pooled runtime/direct migration bindings.
4. It refused mutation unless the only pending repository migration was exactly `0020_commercial_ops_01` and no unresolved migration record existed.
5. Vercel Production deployment `dpl_BQEqk75EcFxFR7gAYmcFFzRvmhxW` emitted `production_migration_0020: applying`, then `production_migration_0020: applied_and_verified`.
6. PR #83 immediately removed the temporary migration runner; no schema rollback was performed.
7. Final cleanup application/runtime baseline SHA is `f6f520340d67e4f2aac44142437962b287794a66` and verified post-cleanup deployment `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY.

The normal Vercel preflight is readiness-only again. This event does not establish a permanent automatic Production migration policy.

## Production Commercial MCP and refresh lifecycle

**CONTRADICTION RESOLVED — CURRENT REPOSITORY/RUNTIME, 5 September 2026:** the
historical 21 August text below predates
[PR #146](https://github.com/AlexG-7BE/sevenbet-next/pull/146) and
[PR #147](https://github.com/AlexG-7BE/sevenbet-next/pull/147). Those protected
merges deployed durable delegated access and removed browser-session dependence
from refresh. Current authorization/protected-resource metadata includes
`offline_access`; refresh permits an omitted request resource only after the
stored exact-resource grant and current delegated staff authority validate.
PR #159 preserved that contract. **UNKNOWN:** this reliability workstream had
no safe current Founder Commercial credential, so it did not independently
re-run a live end-to-end refresh cycle. The following paragraphs remain the
historical incident/root-cause record, but their “proposed/not deployed” state
is superseded.

**DETECTED — PRODUCTION RUNTIME, 2026-08-21:** Production serves the bounded Commercial MCP from application SHA `9d7ba9169df43f914a1fb05f44cfc10af87118e2` with Better Auth/OAuth Provider `1.7.1`. Public read-only checks returned HTTP 200 for both OAuth discovery documents. Authorization-server metadata advertises `authorization_code`, `refresh_token`, PKCE `S256`, the exact Commercial resource and `offline_access`; protected-resource metadata advertises only `commercial:read` and `commercial:safe_write`.

**DETECTED — REPRODUCED FAILURE:** authorization and token exchange succeed, MCP calls initially return 200, and the resource starts returning 401 approximately 15 minutes after issuance. No refresh-token request reaches the token endpoint before the failed resource call. Reauthorization restores access for another equivalent interval.

**DETECTED — REPOSITORY/PROVIDER CAUSAL MECHANISM:** the wrapper forwards the authorization request scope set unchanged. Better Auth 1.7.1 always returns normal expiry metadata but issues and persists a delegated refresh token only when the authorized grant contains `offline_access`. Its refresh handler can inherit the stored resource when the refresh request omits `resource`, while the application wrapper currently requires that request parameter for both grant types.

**INFERRED — ROOT CAUSE:** ChatGPT's resource-driven authorization did not establish `offline_access` because the protected-resource discovery document omitted it, leaving only a 15-minute access credential. The wrapper's mandatory refresh `resource` is a secondary interoperability defect; it did not cause the observed cycle because Production saw no refresh request.

**PROPOSED — NOT DEPLOYED:** the bounded fix advertises `offline_access` in both discovery documents and permits `resource` to be omitted only for `refresh_token`. A supplied resource must still equal the exact Commercial resource, and an omitted value succeeds only after the stored refresh record, client metadata, live provider session and current staff permission all pass the existing exact-resource checks. Authorization-code exchange still requires the exact resource. No schema, migration, token-TTL, tool, Commercial authority or Production environment change is included.

## Production acceptance after Commercial Ops migration

**DETECTED:**

- `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY, targets Production/main and served the canonical B4GAMBLE aliases at the bounded post-migration acceptance check.
- `https://b4gamble.com/` returned HTTP 200 from that verified post-cleanup runtime deployment.
- Anonymous access to `/admin/commercial` remains protected and resolves to the B4GAMBLE CMS Login flow rather than exposing Commercial Admin content.
- No Vercel runtime errors were detected in the bounded post-migration verification window.

**LIMITATION:** an authenticated post-migration Production Admin read/write walkthrough was not executed because the available verification tooling did not have an authorised B4GAMBLE Admin application session. This does not negate the direct Production migration verification or the exact-head CI/browser coverage from COMMERCIAL-OPS-01; it only limits the claim about a live authenticated manual walkthrough.

## Commercial conclusion

**DETECTED — the internal Commercial OS is deployed and its Production schema is ready.**

This means B4GAMBLE can proceed to the first real partner acquisition/qualification workflow without another CRM/Agent construction workstream.

It does **not** mean that a partner relationship, affiliate acceptance, GB eligibility, deal terms, tracking destination, commercial offer or active outbound route exists.

The next commercial operating loop is:

`DISCOVER → QUALIFY → PREPARE APPLICATION → DRAFT OUTREACH → TRACK RESPONSE → FOLLOW-UP → EXTRACT DEAL TERMS → PREPARE ACTIVATION`

A real GB commercial route remains fail-closed and requires evidence/authority for the exact partner and action, including real acceptance/agreement, explicit GB permission, correct identity, current UKGC licence/exact-domain evidence where applicable, real offer, safe tracking destination, significant conditions, adjacent disclosure, Preview validation, Founder activation approval and a working kill switch/rollback.

Missing, stale, unknown or contradictory authority remains deny-by-default. A public affiliate page is not evidence that B4GAMBLE has been accepted.

## Public legal conclusion

**DETECTED — public legal implementation for the current GB launch scope remains ready in Production.**

Current public legal implementation includes Privacy, Terms, Affiliate Disclosure, Programme just-in-time sensitive-input disclosure/explicit consent, responsible-gambling/protected-Help boundaries and commercial disclosure wording.

**DETECTED — SIGNED LETTERS OF APPOINTMENT, 22 AUGUST 2026:** 7BE Inc. has appointed Prighter EU Rep GmbH as its representative pursuant to Article 27 of the EU GDPR and Prighter Ltd as its representative pursuant to Article 27 of the UK GDPR. The 24 August 2026 bounded Privacy Policy release publishes the signed-LOA identities and addresses, the official Prighter data-subject portal, and both official live representation certificates. This does not appoint Prighter as a DPO or establish gambling, licensing, general legal or full-GDPR-compliance authority.

Public legal copy does not create or imply operator licensing, affiliate approval, partnership, regulatory approval or jurisdiction eligibility that has not been separately evidenced.

## Open legal / administrative deferrals

The EU and UK Article 27 appointments and their approved public particulars are no longer part of the deferred list. The following remain **OPEN — DEFERRED BY FOUNDER** and must not be described as completed:

1. **ICO registration / data-protection fee** — execution/evidence is not completed.
2. **Account-specific provider evidence** — exact plan/entity, accepted DPA/CDPA/terms, processing locations and applicable transfer mechanism evidence remain to be captured where not already evidenced.
3. **OpenAI project-specific controls evidence** — do not claim ZDR, MAM or a specific region without actual B4GAMBLE account/project evidence.
4. **DPIA approval record / ongoing review evidence** — do not invent internal signatures/completion.

The Founder has chosen not to delay initial market entry solely for these bounded administrative items. That risk decision does not complete the obligations or convert unknown external facts into detected facts.

## Launch recommendation

**GO WITH CONDITIONS.**

- **Website / product:** GO — ready.
- **Public legal implementation:** GO — ready for current scope.
- **Commercial CRM / Partner Operations:** GO — deployed, Production schema applied and verified.
- **Administrative legal follow-up:** OPEN under the existing Founder-accepted deferral posture.
- **Commercial activation:** GO only after a real partner passes the activation gate and the Founder explicitly authorises the activation.

## Reopen conditions

Reopen completed product/legal/Commercial OS architecture only for new material scope or evidence, including:

- Production regression;
- material Programme/product behaviour change;
- new provider or materially changed data handling;
- new data category/purpose/commercial use;
- new jurisdiction;
- material change in gambling/privacy/consumer-law requirements;
- new advertising/analytics/tracking technology;
- material change to public claims, partner model or commercial routing;
- evidence that the Commercial CRM/Partner Operations architecture cannot support the first real partner workflow safely.

Otherwise proceed to real partner acquisition and commercial operations rather than reopening completed site/legal/CRM construction work.

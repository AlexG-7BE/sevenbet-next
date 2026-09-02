# Commercial Platform Operations

**DETECTED / RELEASE CANDIDATE — 3 September 2026:** the implementation and
disposable verification described here exist on the commercial-platform code
completion branch. Production application and migration state must be taken
from the final release record after promotion.

## Activation and assets

The canonical operator workflow is documented in `Partner-Portal-Data-Handoff.md`. The thin adapter writes the existing AffiliateNetwork, AffiliateProgram, AffiliateOffer, AffiliateTrackingLink, AffiliateTrackingLinkCountry, AffiliateRedirectSlug, revision, and audit structures in one serializable transaction. It does not create another affiliate store or eligibility engine.

Asset ingestion delegates validation, processing, storage, deduplication, ownership, and compensation to the existing MediaService and adds exact CasinoCountry and AffiliateOffer ownership.

## Outbound-click privacy contract

`AffiliateOutboundClickDaily` is first-party commercial accounting, separate from Product/Programme analytics. One UTC-day row contains Casino, country, governed redirect, offer, tracking-link identity, aggregate count, and last-click time. Atomic upsert increments the counter.

It stores no user/account/session ID, name, email, IP or hashed IP, user agent, fingerprint, cookie identity, referrer, arbitrary query string, free text, Programme state/input/Mission, responsible-gambling data, tracking URL, or destination URL.

Counting occurs only after `/r/[slug]` has passed jurisdiction, commercial readiness, exact-market PartnerRoute eligibility, and safe-destination validation and has constructed a valid external 302. Failed, denied, preview, no-CTA, wrong-GEO, expired, and unsafe resolutions do not reach the counter. A counter failure emits only safe route identifiers and never suppresses the valid 302.

Authorized staff with `affiliate.manage` can query:

`GET /api/admin/affiliate/outbound-clicks?from=YYYY-MM-DD&to=YYYY-MM-DD&casinoId=<uuid>&countryCode=PE&redirectSlugId=<uuid>`

The default range is 30 UTC days; the maximum is 366 days. Output contains totals, per-route totals, and daily aggregates without raw tracking destinations.

## SEO market publication policy

`lib/market/registry.ts` is the single source for market `routable`, `published`, and `indexable` state. Page robots metadata, sitemap market selection, canonical handling, Production hreflang, and public publication gates derive from it.

Current decision (2026-09-03):

| Locale | Routable | Published | Indexable | Current condition |
|---|---:|---:|---:|---|
| en-GB | yes | yes | yes | source baseline |
| sv-SE | yes | yes | no | local legal/privacy review plus removal of placeholder inventory |
| es-PE | yes | yes | no | local legal/privacy review plus sufficient real inventory |

SE and PE remain accessible, correctly localized, self-canonical, and `noindex, follow`; they are excluded from the sitemap and indexable hreflang graph. After the stated non-code conditions are evidenced, changing the one registry `indexable` value is sufficient; no new SEO architecture is needed.

## Migration and rollback

Migration `0026_commercial_platform_completion` only creates the aggregate click table, constraints, indexes, and four restrictive foreign keys. It performs no backfill and does not modify visitor or Programme data.

Application rollback is a normal revert/deploy. The additive table may safely remain unused during rollback. Do not drop it in an incident. If click writes cause pressure, revert/disable the application integration first while preserving valid redirects. Migration removal requires a separately reviewed destructive change and is outside this runbook.

Health monitoring rollback is described in `Affiliate-Route-Health-Runbook.md`. SEO rollback changes only the centralized registry value and redeploys.

# Commercial Platform Operations

**DETECTED / PRODUCTION — 3 September 2026:** the implementation and migration
described here are deployed and verified. See the
[commercial-platform completion release record](Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

## Activation and assets

The original operator-bundle workflow is preserved historically in
`Partner-Portal-Data-Handoff.md`; its legacy APPLY command is retired and fails
closed. Current canonical writes require the separate process-local Founder
authority boundary. CRM research, lifecycle flags, media and analytics do not
grant runtime permission.

Asset ingestion delegates validation, processing, storage, deduplication, ownership, and compensation to the existing MediaService and adds exact CasinoCountry and AffiliateOffer ownership.

## Outbound-click privacy contract

`AffiliateOutboundClickDaily` is first-party commercial accounting, separate from Product/Programme analytics. One UTC-day row contains Casino, country, governed redirect, offer, tracking-link identity, aggregate count, and last-click time. Atomic upsert increments the counter.

It stores no user/account/session ID, name, email, IP or hashed IP, user agent, fingerprint, cookie identity, referrer, arbitrary query string, free text, Programme state/input/Mission, responsible-gambling data, tracking URL, or destination URL.

One runtime attribution writer is scheduled only after `/r/[slug]` resolves its
independent exact trusted-GEO, exact `MarketActivation`, factual binding,
destination, legal and health authority. In one transaction it writes the
canonical detailed `OutboundClick`, the attempted and terminal
`AnalyticsEvent` projections and, for a successful 302 only, the daily
aggregate projection. Failed, denied, Preview, no-CTA, wrong-GEO, expired and
unsafe results never increment the successful aggregate. Observation failure
emits only a safe category and never changes the already-authoritative redirect
response.

`AffiliateOutboundClickDaily` also contains unique historical successful-click
coverage from before complete detailed storage. It must not be backfilled into
`OutboundClick`, and its total must not be added to detailed successes because
new successful traffic can overlap.

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

GB is centrally indexable. Individual GB product routes may still apply a
stricter truthfulness guard when their current inventory is filtered, empty or
not published-only; such a route remains out of the sitemap until its data
qualifies.

## Migration and rollback

Migration `0026_commercial_platform_completion` only creates the aggregate click table, constraints, indexes, and four restrictive foreign keys. It performs no backfill and does not modify visitor or Programme data.

Application rollback is a normal revert/deploy. The additive table may safely remain unused during rollback. Do not drop it in an incident. If click writes cause pressure, revert/disable the application integration first while preserving valid redirects. Migration removal requires a separately reviewed destructive change and is outside this runbook.

Health monitoring rollback is described in `Affiliate-Route-Health-Runbook.md`. SEO rollback changes only the centralized registry value and redeploys.

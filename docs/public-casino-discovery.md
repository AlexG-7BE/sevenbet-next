# Phase 4.2 — Public Casino Discovery

## Architecture audit and decisions

The canonical public catalog is `/casinos`. `/catalog` permanently redirects to it and preserves only parameters accepted by the shared query parser. `/casino/[slug]` remains the detail route, `/bonuses` remains the bonus directory, and `/r/[slug]` remains the only commercial redirect route. `/catalog` was removed from the sitemap route list so there is only one indexable catalog.

Public content comes from the latest immutable `CasinoVersion` whose version and current `Casino` are both `PUBLISHED` and whose current Casino is not archived. Draft rows, archived Casinos, unmatched import records, and legacy fixtures never enter Discovery. `PublicCasinoService` still owns projection of one detail page; `PublicCasinoDiscoveryService` owns catalog search, filters, sorting, facets, pagination, declared-market preview, bonus summary, and card DTOs.

The audit found structured published snapshot data for countries, licenses, payment methods, game providers, categories, bonuses, languages, and currencies. Editorial featured/recommended flags and extended bonus GEO fields are stored in the versioned editor metadata JSON. Mobile support has no dedicated relation; the filter is conservative and matches only an explicit published `mobileApp` or `supportsMobile` signal. Casino aliases are canonical local relations and are used only for search. Bonus GEO has no dedicated table, so the published bonus editor metadata is authoritative until a normalized bonus-country relation is introduced.

Existing PostgreSQL indexes already cover publication lookup, common country and license lookups, affiliate status/date selection, tracking-link activity/expiry, and redirect slug ownership. Phase 4.2 adds no migration: JSONB snapshot projection plus the current catalog size did not justify speculative indexes or a search engine. Query plans should be re-measured before adding a JSONB/trigram index at materially larger catalog sizes.

## Provider independence

The public flow is:

```text
Casino / Operator / Affiliate Program
  → Integration Adapter
  → Sync and Normalization
  → Local Canonical Entities
  → Publish Lifecycle
  → Public Discovery
  → Local Redirect Engine
```

Discovery imports neither adapters, the adapter registry, credentials, external mappings, nor provider payloads. Its repository selects no `providerType`, external ID, raw tracking URL, or destination URL. An equivalent local Program/Offer/TrackingLink graph therefore produces the same card and rank whether it originated from manual entry, CSV, JSON, Everflow, Affilka, or another provider.

## Query contract

Supported URL parameters are `q`, `country`, `license`, `payment`, `gameProvider`, `category`, `bonusType`, `hasBonus`, `hasAvailableVisitAction`, `supportsCrypto`, `supportsMobile`, `sort`, `page`, and `pageSize`.

- Search is NFKC-normalized, whitespace-collapsed, punctuation-tolerant, case-insensitive, and limited to 100 characters.
- Facet arrays are trimmed, deduplicated, syntax-checked, limited to 12 values, and intersected with values that exist in the public result set.
- Multiple values inside one facet are OR; different facets are AND.
- Page sizes are allowlisted to 12, 24, or 48 by the URL parser, with a hard service maximum of 48.
- Changing search, filters, sort, or page size through the server forms omits `page`, resetting it to 1. Every form preserves the other normalized controls, including `pageSize`; pagination links preserve the complete normalized query.
- Serializer ordering is deterministic so URLs are copyable and browser back/forward is native.

Search ranking is exact canonical name, exact published name, exact alias, canonical/name/alias prefix, name contains, canonical domain, structured relation, then description. Every strategy has name and ID tie-breakers.

Sorting supports `FEATURED`, `RELEVANCE`, `NEWEST`, `NAME_ASC`, and `NAME_DESC`. Featured uses published editorial featured/recommended flags, then editorial score; it never uses payout, sync date, or provider. Newest uses `publishedAt`, never `lastSyncedAt` or `sourceUpdatedAt`.

Facets are server-generated from published local records matching the current search. Counts are global within that searched public set (the documented simple first-phase semantics), rather than self-excluding against every other active facet. No full catalog payload is sent to the browser.

## GEO and visit actions

The catalog country parameter is a filter and availability preview, not proof of physical location. An unknown or invalid country is ignored. No automatic redirect occurs. Casino availability, Offer GEO, Tracking Link GEO, and bonus GEO are evaluated separately.

Country selection can filter editorial records and published bonus metadata, but it cannot create an action. Offer and Tracking Link GEO rules are evaluated only with the current trusted jurisdiction country after the server resolver permits referral. Unknown trusted location, policy deny, conflict or operator-evidence failure leaves the review and published bonus editorial visible while removing the action.

A public visit action requires:

```text
current jurisdiction referral permission
  → published, non-suspended Casino/operator/brand
  → current official GB licence and exact-domain evidence
  → published Casino
  → active, unarchived Program and Network
  → active, in-date Offer allowed for the GEO
  → active, in-date Tracking Link allowed for the GEO
  → active local AffiliateRedirectSlug
```

Cards expose only `{ available, redirectSlug, label, reasonCode }`; rendered CTAs use `/r/[slug]`. They never expose raw tracking/destination URLs, credentials, provider data, payout, or sync metadata. A Casino without an action remains visible and links to its review. The redirect engine performs no live provider call.

## Bonus projection

Only published, active, in-date bonuses from the immutable Casino snapshot are considered. Bonus GEO metadata is applied independently as declared editorial context. Commercial denial never removes an otherwise eligible published bonus summary. Selection is deterministic: published featured metadata first, then stable slug order. Cards show terms notices and never label an offer “best.”

## DTO and server/client boundary

`PublicCasinoCardDto` is plain serializable data: IDs/slugs, labels, safe media, summary, editorial rating, highlights, optional bonus summary, safe visit action, and publication dates. Prisma models, Decimal, Date objects, provider fields, notes, drafts, mappings, payloads, and commercial destinations do not cross the boundary. The page, cards and data service are Server Components/server-only modules; catalog controls use native GET forms and links, so no client fetch waterfall or Prisma client bundle exists. The only Client Component owns the mobile modal lifecycle and receives rendered form children rather than result data or eligibility authority.

## SEO, accessibility, and safeguards

The unfiltered catalog and clean pagination have their own canonical URLs. Arbitrary search/filter combinations are `noindex,follow` and canonicalize to `/casinos`; they are never emitted by the sitemap. ItemList JSON-LD contains only review URLs, not redirect URLs. Breadcrumb JSON-LD, unique metadata, Open Graph metadata, and production-safe error/empty states are included.

Search, sorting, filter groups, checkboxes, result announcements, active-filter removal, and pagination have accessible labels and focus styles. Mobile filters use a native modal dialog with Escape dismissal, trigger focus return and body scroll lock; a native GET-form fallback is present in `noscript`. Touch targets are at least 44–48px, content is not color-only, and reduced-motion preferences are respected.

Commercial areas disclose commission, 18+, terms, and gambling risk and link to the Responsible Gambling Hub. There are no countdowns, scarcity claims, guaranteed outcomes, fake activity, preselected filters, or automatic redirects.

## Cache and invalidation

The catalog currently uses dynamic SSR, so normalized URL state is the effective request key and no stale shared result cache exists. Casino publish/archive/restore/republish already revalidates `/casinos`, `/bonuses`, detail routes, and the sitemap. Program, Offer, and RedirectSlug mutations now also revalidate the public discovery surfaces. Dry-run imports do not invalidate. A future shared cache must key the complete normalized query and invalidate only when canonical public facts actually change.

## Extension guide

To add a filter, add its DTO/internal projection, parser and deterministic serializer entry, service predicate and facet (when applicable), accessible server-form control, tests for OR/AND and invalid values, then document whether its data is immutable snapshot data or current canonical operational data. Do not add a filter from provider payloads.

To add a sort, add it to the allowlist, define stable tie-breakers using editorial/public facts, expose a human label, and test that provider/payout/sync fields cannot influence it.

After an AffiliateProgram synchronization, Discovery changes only when normalization has changed local canonical Program/Offer/TrackingLink/Redirect records. Imported Casinos remain private until the existing publish lifecycle produces a published CasinoVersion.

## Rollback and acceptance

No database rollback is required because there is no Phase 4.2 migration. Application rollback is a deployment rollback to the previous commit; existing `/casino/[slug]`, `/bonuses`, and `/r/[slug]` data contracts remain intact. `/catalog` can be temporarily restored as a duplicate page only for emergency compatibility, but must remain non-indexable.

Production acceptance should create one manual published Casino and one provider-backed normalized program, verify name/alias/domain search, every populated facet, review-only behavior, safe action appearance/disappearance across Offer and Program state changes, bonus projection, archive/restore/republish, desktop/tablet/mobile keyboard behavior, and then remove all acceptance records and media.

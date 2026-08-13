# Public Offer Projection

## Evidence classification

### Current repository evidence — 2026-08-13

- **Detected on the unmerged `RUNTIME-PRODUCT-POLISH-01` review branch:** `/best-offers` retains the strict published GB/material-term shortlist as its first source. When that read succeeds but returns zero eligible records, the service projects only the exact RFC-012 source-controlled manifest through the existing public casino/offer mappers.
- **Detected:** every fallback result is classified by exact casino ID as `DEMO_FIXTURE`, has no action or raw destination, receives the existing demonstration disclosure and uses `noindex,follow` without ItemList/Offer structured data.
- **Detected:** a repository read failure remains `unavailable`; it does not invoke the demonstration. An eligible published shortlist remains `PUBLISHED_ONLY` and is not mixed with manifest records.
- **Detected:** the fallback is confined to `getBestOffersPageData`; `/bonuses`, public search, repository results and public casino inventory do not receive source-controlled manifest records.
- **Inferred:** the confirmed empty Production shortlist is consistent with the current strict completeness gate rejecting published records whose eligibility or other material terms are absent. This branch does not claim a direct Production database audit and does not edit or reseed Production.
- **Planned:** Founder review of the exact Preview rendering and its live database outcome before any merge or Production request.

- **Detected:** `CasinoService.publishCasino` persists an immutable `CasinoVersion.snapshot` after the governed draft, review and approval workflow.
- **Detected:** `PublicCasinoRepository` selects published versions only for non-archived casinos whose current workflow status is `PUBLISHED`, then keeps the highest version per casino.
- **Detected:** `mapPublishedCasino` already validates published snapshot identity, filters bonus status/date eligibility, maps public-safe media and exposes governed `/r/[slug]` actions without raw destinations.
- **Detected:** the existing schema and snapshot contain casino identity, scores, featured/recommended flags, dates, countries, licences, payments, responsible-gambling tools and all required bonus terms.
- **Detected:** no schema change or migration is required for the approved scope.
- **Detected in PR #20:** a dedicated public-offer DTO/query/result contract, repository, query parser and service built on the existing public casino snapshot store.
- **Detected in PR #20:** SSR `/best-offers` and `/bonuses` consumers plus deterministic filters, sorts, facets, pagination, metadata and no-JavaScript output.
- **Detected in PR #20:** a factory-driven exact-25 manifest, 75 media assets, five internal-only routes, exact-ID cleanup and bounded production verification.
- **Detected in production:** application commit `5c05b54` is deployed; the projection returns 25 eligible offers, 18 for the GB filter and 12 in the default shortlist. Page two of the 24-record directory contains the remaining record.
- **Detected in production:** deterministic country/type/payment/crypto/deposit/wagering/availability filters return server-rendered results, five internal-only actions resolve to the owning SevenBet profiles, and public HTML contains no external action href.
- **Detected in production:** a repeated seed leaves all 25 published snapshots unchanged; standalone verification reports `issues: []`; responsive/no-JavaScript Playwright smoke passes 10/10.

## Authority chain

```text
Casino Builder / CMS
  → CasinoService publication validation
  → latest published CasinoVersion snapshot
  → PublicCasinoRepository
  → PublicOfferRepository
  → PublicOfferService
  → server-rendered /best-offers and /bonuses
```

RFC-029 adds one presentation-only branch after a successful published read:

```text
published shortlist empty
  → exact RFC-012 source-controlled manifest
  → existing public casino mapper
  → existing public offer mapper
  → exact-ID DEMO_FIXTURE classification
  → existing /best-offers full experience with no actions
```

Page components do not import Prisma. The offer repository does not read live bonus rows as public truth and does not add a second publication model. It flattens the already public-safe latest casino snapshots into one offer projection per eligible published bonus.

## Public contract

`PublicOfferDTO` contains only:

- casino identity, logo, score, feature/recommendation flags and publication/review dates;
- public country availability, licences, payments and responsible-gambling tools;
- bonus identity, title, summary, type, percentage, maximum bonus, currency, free spins, minimum deposit, wagering, eligibility, conditions and dates;
- governed internal action availability and href.

It excludes raw tracking/destination URLs, credentials, partner IDs, internal notes, mutable draft fields and unpublished content.

## Eligibility

An offer is public only when the enclosing casino maps from its latest published, non-archived snapshot and the bonus is `PUBLISHED`, `ACTIVE`, started, unexpired and has a valid ID, slug and title. Missing or failed redirect authority removes only the action; it does not remove eligible editorial offer content.

## Query behavior

The service validates and owns:

- country, bonus-type, payment, crypto, maximum-minimum-deposit, maximum-wagering, availability, featured and recommended filters;
- editorial, newest, highest-maximum-bonus, lowest-wagering and lowest-minimum-deposit sorts;
- stable tie-breakers by score, publication time, casino name, casino slug and bonus slug;
- one-based pagination and eligible-offer facet counts.

CMS mode remains fail closed on repository failure and never expands visibility with legacy records. Legacy offers are used only when CMS mode is explicitly disabled for local or test operation. The RFC-029 Best Offers exception is not a legacy/repository fallback: it runs only after a successful read with no eligible shortlist, uses exact authorised manifest IDs, exposes no action and is isolated to the one page-data method.

## Page behavior

`/best-offers` requests the default GB shortlist and presents at most 12 offers. Eligible published records remain authoritative. If none clear the unchanged gate after a successful read, the full existing experience presents an exact no-action demonstration instead of an empty shell. `/bonuses` serializes its filter form into query parameters, uses a page size of 24 and keeps the unfiltered route canonical. Filtered pages use the same canonical plus `noindex,follow`.

Both pages render meaningful HTML without client JavaScript. Material terms and editorial review access precede action. Unavailable actions are explicit non-links.

## Bounded performance decision

For 25 synthetic casinos, loading the latest published snapshots once, mapping in memory, then filtering, faceting, sorting and paginating is sufficient. Elasticsearch, Algolia, Redis, a materialized view, a new database and a new service are explicitly out of scope.

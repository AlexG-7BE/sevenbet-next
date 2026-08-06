# Public Offer Projection

## Evidence classification

- **Detected:** `CasinoService.publishCasino` persists an immutable `CasinoVersion.snapshot` after the governed draft, review and approval workflow.
- **Detected:** `PublicCasinoRepository` selects published versions only for non-archived casinos whose current workflow status is `PUBLISHED`, then keeps the highest version per casino.
- **Detected:** `mapPublishedCasino` already validates published snapshot identity, filters bonus status/date eligibility, maps public-safe media and exposes governed `/r/[slug]` actions without raw destinations.
- **Detected:** the existing schema and snapshot contain casino identity, scores, featured/recommended flags, dates, countries, licences, payments, responsible-gambling tools and all required bonus terms.
- **Detected:** no schema change or migration is required for the approved scope.
- **Detected in PR #20:** a dedicated public-offer DTO/query/result contract, repository, query parser and service built on the existing public casino snapshot store.
- **Detected in PR #20:** SSR `/best-offers` and `/bonuses` consumers plus deterministic filters, sorts, facets, pagination, metadata and no-JavaScript output.
- **Detected in PR #20:** a factory-driven exact-25 manifest, 75 media assets, five internal-only routes, exact-ID cleanup and bounded production verification.
- **Planned:** deployment, v2 production seed and final production smoke evidence.

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

CMS mode is fail closed: repository failure returns no offer records and never expands visibility with legacy records. Legacy offers are used only when CMS mode is explicitly disabled for local or test operation.

## Page behavior

`/best-offers` requests the default GB shortlist and presents at most 12 offers, with three featured cards when available. `/bonuses` serializes its filter form into query parameters, uses a page size of 24 and keeps the unfiltered route canonical. Filtered pages use the same canonical plus `noindex,follow`.

Both pages render meaningful HTML without client JavaScript. Material terms and editorial review access precede action. Unavailable actions are explicit non-links.

## Bounded performance decision

For 25 synthetic casinos, loading the latest published snapshots once, mapping in memory, then filtering, faceting, sorting and paginating is sufficient. Elasticsearch, Algolia, Redis, a materialized view, a new database and a new service are explicitly out of scope.

# Public Casino Comparison

## Evidence classification

- **Detected on `codex/fe-mig-09-comparison`:** dynamic SSR `/compare` renders meaningful controls, selected profiles, evidence and recovery states without client JavaScript.
- **Detected:** `PublicCasinoDiscoveryRepository.listPublished` and `mapPublishedCasino` provide the existing latest-published, non-archived public snapshot chain. Draft, archived and invalid snapshots do not enter the comparison.
- **Detected:** the existing snapshot DTO contains identity, editorial score and dates, declared country availability, licences, payments, current published bonuses and responsible-gambling tools required by the approved comparison.
- **Detected:** the existing discovery context and `resolvePublicVisitAction` provide current governed action availability. Public comparison output exposes only safe internal `/r/[slug]` hrefs.
- **Detected on the branch:** `PublicComparisonService` owns selection, market-state handling, evidence grouping, differences and fail-closed repository behavior. Page and React components do not import Prisma.
- **Not detected:** trusted physical-location detection or legal-eligibility authority. The `country` value is a declared comparison preference only.
- **Not detected:** raw destination or tracking URLs, provider payloads, Programme data, pause data or protected Help data in the comparison contract.
- **Planned delivery gate:** merge, protected Vercel Preview and Founder Office approval.

## Authority chain

```text
Casino Builder / CMS publication
  → latest published CasinoVersion snapshot
  → PublicCasinoDiscoveryRepository
  → mapPublishedCasino
  → PublicComparisonService
  → server-rendered /compare

Current local commercial graph
  → resolvePublicVisitAction
  → safe internal /r/[slug] or unavailable state
```

The comparison adds no publication lifecycle, API, Prisma model, migration, CMS field, database or search service.

## URL contract

Supported query parameters are repeated `casino`, `country`, `differences` and the internal explicit-empty marker `empty`.

- `casino` accepts normalized lowercase slugs, removes duplicates, preserves first-seen order and keeps at most three.
- Explicit one-, two- or three-profile selections are never filled automatically.
- A clean `/compare` request selects up to three GB-declared-available profiles with sufficient comparison completeness. Stable ordering is featured, recommended, editorial score, completeness, name and slug; no Demo slug or winner is hard-coded.
- `country` accepts a two-letter declared preference and defaults to `GB`. It is not a location or eligibility claim.
- `differences=true` keeps rows whose text or evidence status differs and reports how many equal rows were hidden.
- Invalid values are ignored safely and reported without reflecting unsafe input.

## Public evidence contract

Rows are grouped into identity/editorial context, licensing/declared market context, current published offer terms, payments/withdrawal evidence, and safety/commercial boundary. Each cell carries one of: `Published`, `Editorial`, `Operator-published`, `Unknown`, `Unavailable`, `Not comparable` or `Policy-gated`.

Missing data remains explicit and cannot improve a result. The page provides no universal winner, automatic redirect, live-GEO assertion or commercial ranking input. Editorial review remains available when a governed action is unavailable.

## Rendering, metadata and accessibility

Desktop uses an accessible comparison table model; mobile uses criterion-first vertical cards with criterion/casino headings. Native GET controls, links and disclosure content work without JavaScript. The clean successful route is indexable with canonical `/compare`; query variants are `noindex,follow`. Breadcrumb and editorial `ItemList` JSON-LD contain review URLs only and omit Offer, AggregateRating and redirect destinations.

Controls retain visible focus, minimum 44px targets, reduced-motion handling and status text beyond colour. The existing outbound dialog provides disclosure-before-action, Escape dismissal and focus return.

## Operational boundary

The current 25 records are explicitly labelled fictional pre-launch demonstration data. FE-MIG-09 performs no seed, reseed, cleanup or production mutation. At this catalog size, one published-snapshot load plus deterministic in-memory projection is sufficient; a cache, search engine or materialized comparison table is out of scope.

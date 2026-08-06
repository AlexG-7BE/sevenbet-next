# RFC-012 — Temporary Production Synthetic Casino Dataset and Public Offer Projection

## Status

Approved by Founder Office on 2026-08-06. Scope expanded on 2026-08-06 for PR #20.

## Decision

SevenBet may temporarily publish exactly 25 explicitly fictional casino aggregates in the current production database and present their published offers on the current production site for product validation and partner presentations.

The canonical public chain is:

`Casino Builder / CMS → latest published CasinoVersion snapshot → public repository → public services → server-rendered pages`.

`/casinos`, `/casino/[slug]`, `/best-offers` and `/bonuses` consume that governed chain. Page components must not import Prisma, read mutable draft relations as public truth, maintain a Demo-only frontend branch or filter by `demo-*` slugs.

This remains a bounded exception to the normal requirement for real, reviewed operator data. It does not approve a separate Demo environment, Demo PostgreSQL, fingerprint separation or the RFC-011 fixture adapter. RFC-011 remains a deferred proposal.

## Dataset scope

- Exactly 25 deterministic `demo-*` casino aggregates, each with at least one eligible active published bonus in its latest published snapshot.
- At least 18 casinos available for the illustrative `GB` market and at least 12 eligible for the default Best Offers shortlist.
- Existing casino, editorial, image/media, bonus, SEO and affiliate-routing entities only.
- Varied bonus types, amounts, currencies, free spins, minimum deposits, wagering terms, payments, crypto states, scores, country availability, media and commercial availability.
- At least three and no more than five governed available actions. Every available action resolves only to the casino's own SevenBet profile. All other actions are unavailable.
- Production presentation on `/casinos`, `/casino/[slug]`, `/best-offers` and `/bonuses` across desktop and mobile.

The manifest must be factory-driven with explicit scenario overrides. Copy-pasted aggregate definitions are not an approved implementation path.

## Public offer contract

The public offer projection is assembled only from the latest published snapshot of a public, non-archived casino. An offer is eligible only when all of the following are true:

- the enclosing snapshot and casino are published and non-archived;
- the bonus has a valid ID, safe slug and non-empty title;
- bonus editorial status is `PUBLISHED`;
- bonus offer status is `ACTIVE`;
- `startsAt` is absent or not in the future;
- `expiresAt` is absent or not in the past.

The public DTO may expose casino identity, media, scores, recommendation flags, publication/review dates, countries, licence, payments and responsible-gambling tools together with the governed bonus terms and internal action state. It must not expose raw destinations, credentials, partner identifiers, internal notes, mutable drafts or unpublished records.

The offer service owns validation, deterministic filtering, sorting, pagination and facets. Supported filters are country, bonus type, payment method, crypto support, maximum minimum deposit, maximum wagering, commercial availability, featured and recommended. Supported sorts are editorial, newest, highest maximum bonus, lowest wagering and lowest minimum deposit. Stable tie-breakers are editor score, publication date, casino name, casino slug and bonus slug.

Facet counts are computed from eligible public offers only. In CMS mode `/best-offers` and `/bonuses` must not mix in legacy fixtures. Legacy data is permitted only when CMS mode is explicitly disabled for local or test operation.

## Page decisions

### `/best-offers`

The page is server rendered from the public offer service. Its default shortlist prefers `GB`-available offers, complete material terms, featured then recommended records, higher editorial score, lower wagering, lower minimum deposit and deterministic slug tie-breakers. It displays up to 12 offers, with at least three featured cards followed by a comparison list when sufficient eligible data exists.

Material terms, licence, payment and responsible-gambling context appear before action. The editorial review remains visible when an action is unavailable. The page includes a truthful empty state, metadata and `ItemList` structured data.

### `/bonuses`

The page is server rendered from the same service with URL-authoritative filters: `country`, `type`, `payment`, `crypto`, `maxDeposit`, `maxWagering`, `availability`, `sort` and `page`. Page size is 24. The response includes total count, pagination, active-filter summary, a clear action, three featured records when available, the full filtered result set and a truthful empty state.

The unfiltered route is canonical and indexable. Filtered states use the base canonical and `noindex,follow`. Filtering and pagination must remain usable without client JavaScript.

## Safety and truthfulness controls

- Every profile and bonus identifies itself as a synthetic product demonstration, not a real operator or live offer.
- No real operator claim, licence number, affiliate destination, partner identifier or credential is stored.
- The licence block uses `Demo Regulatory Sandbox — not a real regulator`, no verification URL and no licence number.
- Available actions use only controlled `/r/[slug]` routes and fail closed. No public DTO or page exposes a raw destination.
- Editorial offer content is not hidden solely because a commercial action is unavailable.
- Programme, pause, Help and vulnerability data remain outside commercial personalisation and this dataset.

## Data lifecycle

The source-controlled manifest owns deterministic casino and dependent-record identifiers. Cleanup first verifies every fixed casino ID against its expected slug/domain and every affiliate ID against its expected ownership, then deletes only those exact IDs. Casino-owned versions, revisions, editorial records and relations may be removed only through existing foreign-key cascades from exact casino IDs.

Unknown records, real records, broad prefix deletion and `delete where slug startsWith demo-` are prohibited. Re-running the seed must converge to the same 25 records without duplicates. Synthetic records must be removed or replaced with approved real operator data when real operators become available.

## Schema and architecture

No Prisma schema change or migration is approved or required. The existing snapshot contains every field needed for the public offer contract. In-memory mapping, filtering, sorting, faceting and pagination over the latest published snapshots is adequate for this bounded dataset.

The implementation must not add a search engine, cache service, materialized view, database, microservice, alternate Demo repository or generic fixture adapter. The seed is an operational data command and publication continues through the existing draft, validation, review, approval and immutable-version workflow.

## Rollback

Run the dedicated exact-ID cleanup command, confirm every manifest casino and affiliate ID is absent, then verify that the four public routes no longer return manifest records. Cleanup is intentionally incapable of deleting records outside the manifest.

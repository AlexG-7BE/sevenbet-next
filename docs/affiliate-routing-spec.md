# Affiliate Routing Specification

## Scope

This document defines candidate selection for the future affiliate redirect engine. Phase 3.5 does not change `/go/[slug]`, execute redirects, record clicks, or expose new tracking URLs publicly.

## Candidate eligibility

A candidate is considered only when all of the following are true:

1. The network is active and not archived.
2. The program and offer have `ACTIVE` status and are not archived.
3. `startAt` is empty or in the past.
4. `expiresAt` is empty or in the future.
5. The tracking link is active, not archived, and not expired.
6. The requested country is permitted by both offer and tracking-link GEO rules.
7. The requested currency is included by the offer when offer currencies are configured, and matches the tracking link when it has a specific currency.

Casino publication status does not activate an affiliate offer. Affiliate lifecycle is independent.

## GEO rules

`GLOBAL` has no country rows. `ALLOW` permits only listed ISO 3166-1 alpha-2 countries. `BLOCK` permits every country except listed countries. A unique `(parent, countryCode)` constraint and service validation prevent the same country from being both allowed and blocked.

A tracking link may narrow an offer rule but may never broaden it. For example, a GB-only link can exist below a GLOBAL offer, while a GLOBAL link must not bypass a GB-only offer.

## Specificity order

Eligible candidates are ranked in this order:

1. Casino bonus + country + currency
2. Casino bonus + country
3. Casino + country + currency
4. Casino + country
5. Casino bonus global fallback
6. Casino global fallback

Within the same tier, higher `priority` wins. Remaining ties use the most recent `verifiedAt`, then `updatedAt`, then stable UUID ordering. The engine must never select randomly.

## Fallback and failure

The engine must not fall back across a blocked GEO, unsupported currency, paused ancestor, or expired link. If no eligible candidate remains, it returns a controlled unavailable result and does not redirect to a casino homepage implicitly.

## URL handling

Only stored HTTPS URLs may be selected. Redirect responses treat the URL as data, never executable code. Logs must record internal entity IDs and rule outcomes, not raw query strings, cookies, tracking tokens, or destination URLs.

## Deferred engine

Redirect execution is deferred until the new records have been populated and compared against legacy production redirects. This separation allows routing tests, shadow selection, monitoring, rollback, and a dedicated data migration before `/go/[slug]` changes source of truth.

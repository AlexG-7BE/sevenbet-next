# Affiliate Routing Specification

## Scope

This document defines candidate selection for the Phase 3.7 affiliate redirect engine. The new `/r/[slug]` route uses the PostgreSQL affiliate platform behind an explicit rollout flag. Legacy `/go/[slug]` remains unchanged.

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

Only stored HTTP/HTTPS URLs may be considered and production requires HTTPS. Both destination and tracking URLs are parsed again immediately before redirect. Credentials, CRLF, backslashes, and `javascript:`, `data:`, `file:`, or `ftp:` URLs are rejected. Logs record only internal entity IDs, normalized routing hints, and rule outcomes, never raw query strings, cookies, tracking tokens, IP addresses, user agents, or destination URLs.

## Redirect execution

`/r/[slug]` issues a `302` only after a stable `AffiliateRedirectSlug` resolves to an eligible candidate. Responses use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow, noarchive`. Unknown, archived, ineligible, or unsafe mappings return a generic 404. `AFFILIATE_REDIRECT_ENGINE_ENABLED` controls public rollout.

Country comes from supported platform GEO headers. A public `country` query parameter is ignored. Local test overrides require a non-production runtime plus `AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE=true` and the dedicated `testCountry` parameter. Currency and language are validated preference hints and never establish GEO.

## Admin candidate preview

Phase 3.6 implements a read-only preview under the protected Affiliate Builder. It accepts casino, optional bonus, country, and currency, then applies active/date/GEO/currency filters and the specificity order above. The result includes ordered candidates, priority, verification and expiry context, and one deterministic winner. It does not redirect, record clicks, mutate links, or change `/go/[slug]`.

Phase 3.7 adds slug-based preview using the same candidate resolver as `/r/[slug]`. Protected responses omit destination and tracking URLs and expose a controlled failure reason when no winner exists.

# Affiliate Redirect Engine

## Scope

Phase 3.7 introduces a production-safe redirect foundation for the PostgreSQL affiliate platform. It adds `/r/[slug]`, protected redirect-slug management, and a shared candidate resolver. It does not add click attribution, conversion tracking, postbacks, network synchronization, revenue reporting, or a bulk migration of public links.

## Architecture

`GET /r/[slug]` → `AffiliateRedirectService` → `AffiliateRedirectRepository` and `AffiliateOfferService` → candidate resolver → final URL validation → controlled HTTP response.

The public route never accepts a destination URL. A stored `AffiliateRedirectSlug` identifies one casino, an optional casino bonus, and an optional affiliate offer. The slug is lowercase, human-readable, unique, immutable after creation, and cannot contain reserved security terms or the mapped offer/program external IDs.

## Slug lifecycle

Slugs are never deleted or reused. Archive and restore preserve the unique key. Casino ownership is immutable; changing bonus or offer mapping within the same casino creates an `AffiliateRedirectRevision` before mutation and an AuditLog entry with the authenticated AdminUser UUID. Stale writes return 409 through `expectedUpdatedAt`.

Migration `0008_affiliate_redirect_foundation` adds only `AffiliateRedirectSlug` and `AffiliateRedirectRevision`. It is additive and must be applied separately with `prisma migrate deploy` after review.

## Candidate resolution

The engine requires active, non-archived network/program/offer/link records, valid date windows, bonus ownership, compatible offer and link GEO rules, currency compatibility, and an optional language match. Unknown country permits only global GEO candidates.

Specificity is deterministic:

1. Casino bonus + country + currency
2. Casino bonus + country
3. Casino + country + currency
4. Casino + country
5. Casino bonus global
6. Casino global

Ties use link priority, offer priority, verification date, update date, and stable tracking-link UUID.

## Request hints and GEO

Country is read only from supported platform headers (`x-vercel-ip-country`, `cf-ipcountry`, or `cloudfront-viewer-country`). The ordinary `country` query parameter is ignored. A local `testCountry` override works only outside production when `AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE=true`.

`currency` and `language` are validated preference hints. They can narrow candidates but cannot establish user location. No raw IP or full user agent is read or stored.

## URL and response safety

Stored destination and tracking URLs are parsed again before every redirect. Production requires HTTPS. Credentials, control characters, encoded CRLF, backslashes, and unsupported schemes are rejected.

Successful requests return `302` because this is a GET-only navigational affiliate redirect and method preservation is not required. Personalized responses are never cached and include:

- `Cache-Control: no-store, private, max-age=0`
- `Referrer-Policy: no-referrer`
- `X-Robots-Tag: noindex, nofollow, noarchive`

Failures return a generic text 404 without internal IDs or tracking URLs. Diagnostics contain only controlled reason codes, internal IDs for known mappings, and normalized country/currency/language values.

## Rollout and legacy coexistence

Public execution requires `AFFILIATE_REDIRECT_ENGINE_ENABLED=true`. The default is disabled. `/go/[slug]`, `AffiliateLink`, and `CasinoAffiliateLink` remain unchanged. There is no automatic fallback from `/r` to `/go`; any future legacy mapping must be explicit and audited.

## Event logging decision

No redirect-event table is created in Phase 3.7. Redirect execution does not require persistence, so adding request fingerprints or attribution data would create privacy and retention obligations without a current product need. Click attribution belongs in a later migration with a documented lawful purpose, minimization policy, retention period, and deletion process.

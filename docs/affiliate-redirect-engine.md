# Affiliate Redirect Engine

## Scope

Phase 3.7 introduces a production-safe redirect foundation for the PostgreSQL affiliate platform. It adds `/r/[slug]`, protected redirect-slug management, and a shared candidate resolver. It does not add click attribution, conversion tracking, postbacks, network synchronization, revenue reporting, or a bulk migration of public links.

## Architecture

`GET /r/[slug]` → trusted Vercel request-country adapter → `JurisdictionResolver` → `AffiliateRedirectService` → GB operator evidence authority → `AffiliateRedirectRepository` and `AffiliateOfferService` → candidate resolver → final URL validation → controlled HTTP response.

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

Country is read only from `x-vercel-ip-country` when Vercel system configuration positively identifies a Preview or Production runtime. Local, CI and non-Vercel requests are unknown. Cloudflare/CloudFront headers, ordinary `country` parameters and local test-country overrides are not authority. Tests inject typed signals directly rather than creating a runtime bypass.

`currency` and `language` are validated preference hints. They can narrow candidates but cannot establish user location. No raw IP or full user agent is read or stored.

## URL and response safety

Stored destination and tracking URLs are parsed again before every redirect. Production requires HTTPS. Credentials, control characters, encoded CRLF, backslashes, and unsupported schemes are rejected.

Successful requests return `302` because this is a GET-only navigational affiliate redirect and method preservation is not required. Personalized responses are never cached and include:

- `Cache-Control: no-store, private, max-age=0`
- `Referrer-Policy: no-referrer`
- `X-Robots-Tag: noindex, nofollow, noarchive`

Public-route failures issue a `303` to `/outbound/unavailable` without internal IDs or tracking URLs. Diagnostics contain only controlled reason codes, safe internal IDs, policy identity and normalized country/currency/language values. The lower-level response helper retains a generic no-store unavailable response for bounded internal tests.

## Rollout and legacy coexistence

Public execution requires `AFFILIATE_REDIRECT_ENGINE_ENABLED=true`. The default is disabled, and the current GB policy independently denies commercial/referral capability. `/go/[slug]` no longer reads legacy affiliate records and always returns the neutral unavailable flow; it can never act as fallback or rollback authority. Existing `AffiliateLink` and `CasinoAffiliateLink` data may remain for compatibility, but cannot produce an external `/go` response.

The final referral decision is a strict AND of current jurisdiction policy, operator/licence/domain evidence, partner/offer/link eligibility, active slug and safe server-owned destination. The current schema cannot prove licensed-domain coverage, so the default operator authority fails closed. See [Great Britain Market Authority](05_Engineering/Great-Britain-Market-Authority.md).

## Event logging decision

No redirect-event table is created in Phase 3.7. Redirect execution does not require persistence, so adding request fingerprints or attribution data would create privacy and retention obligations without a current product need. Click attribution belongs in a later migration with a documented lawful purpose, minimization policy, retention period, and deletion process.

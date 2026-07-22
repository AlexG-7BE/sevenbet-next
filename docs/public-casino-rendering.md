# Public Casino Rendering

## Source policy

Public casino rendering is controlled by `PUBLIC_CASINO_CMS_ENABLED`. The production-safe default is `false`. When disabled, the established static catalog remains active. When enabled, SevenBet selects the latest immutable `PUBLISHED` `CasinoVersion` per casino and then appends legacy records whose slug is not present in the CMS result.

Draft, review, approved, scheduled, malformed and archived snapshots are never mapped into a public DTO. A missing or invalid published snapshot may fall back to an existing legacy record with the same slug, but draft fields are never used to enrich that fallback.

While CMS mode is enabled, legacy fallback records remain visible but their offer CTA is disabled. This avoids exposing an unversioned external affiliate URL. With the feature flag disabled, the legacy page behavior is preserved for rollback.

## Published boundary

Casino copy, SEO, licenses, countries, payments, providers, categories and bonuses are read only from `CasinoVersion.snapshot`. New publications include a sanitized MediaAsset projection containing only public URL, type, alt text, dimensions, caption, credit, ordering and status. Older versions use the immutable `CasinoImage` data already present in their snapshot.

Affiliate route availability is a deliberately narrow runtime overlay. The snapshot determines the casino and bonus content; the current active `AffiliateRedirectSlug` only determines whether a `/r/<slug>` CTA can be displayed. Disabling or archiving a redirect can remove a CTA, but cannot change published editorial content. The DTO never contains destination URLs, tracking URLs or external affiliate identifiers.

## Rendering and build safety

`/casino/[slug]`, `/casinos`, `/catalog`, `/bonuses` and the sitemap use `PublicCasinoService`. Public pages are dynamic so enabling CMS rendering does not require a database connection during compilation. Casino detail intentionally has no `generateStaticParams`; the hybrid sitemap provides discoverability while `dynamicParams` allows every valid CMS or legacy slug at runtime. Repository errors fall back to legacy data without exposing database details.

## SEO and media

CMS metadata supplies title, description, same-origin canonical, robots, Open Graph and Twitter fields. Editor structured data is allowlisted and reduced to safe fields; the page generates its own BreadcrumbList, Review and FAQPage schemas and never invents user review counts. Media output contains no storage keys, checksums or internal metadata. Gallery media is lazy-loaded; hero media receives high fetch priority.

R2/S3 media uses validated public HTTPS URLs and native responsive images, so arbitrary tenant media hosts do not need to be added to `next.config`. Legacy bonus identity is scoped to its casino slug during the hybrid period: once a CMS casino owns a slug, its published bonus set replaces that casino's legacy offer instead of mixing mutable legacy terms into the snapshot.

## Cache invalidation

Publishing or archiving a casino invalidates its detail path plus `/casinos`, `/catalog`, `/bonuses` and `/sitemap.xml`. Cache invalidation lives in `lib/public-casino/cache.ts`, outside repositories and services.

## Public API

`/api/public/casinos` and `/api/public/bonuses` return normalized public DTOs. Other legacy public CMS resources keep their existing behavior. Casino DTOs omit internal notes, mutable drafts, raw affiliate destinations and storage internals.

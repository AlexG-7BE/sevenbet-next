# Public Casino Rendering

**Status — DETECTED IN UNMERGED DRAFT PR #72 WORKTREE, NOT LIVE PRODUCTION:** this document describes the corrected source contract on `codex/full-site-integrity-audit-01`. Current main/Production remains at `c52595405f0800c8c2b51d5951c4a8d45c133034`, where FULL-SITE-QA-01 observed legacy public data and demo truthfulness failures. Nothing here claims an authorised Production merge, deployment, configuration or data change. The exact demo-detail exception is governed by RFC-032.

## Source policy

Draft #72 public casino rendering selects the latest immutable `PUBLISHED` `CasinoVersion` per casino. Its source contract forces Vercel Production and Preview to use this CMS publication authority and fail closed when it is unavailable. `PUBLIC_CASINO_CMS_ENABLED=true` enables the same path for local verification; the static catalog is retained only as an explicit local/test compatibility fixture.

Draft, review, approved, scheduled, malformed and archived snapshots are never mapped into a public DTO. A missing or invalid published snapshot returns no public record. The sole non-repository detail exception is an exact RFC-012 manifest slug: in the explicitly CMS-disabled local/test path it may resolve directly, while the governed CMS path permits it only after a successful repository lookup proves the slug is absent from the managed namespace. It uses the same conspicuously disclosed, no-action source projection as RFC-029 Best Offers so the internal review link is not a dead end. A managed unpublished/archived slug, an unknown managed state, or a repository error always fails closed.

Legacy records are not rendered by deployed public detail routes or returned from the public casino/bonus APIs. Repository failures never expand visibility to the static catalog or source demo projection. The exact demo detail exception is not mixed into `/casinos`, `/bonuses`, search, sitemap or repository results and never enables a commercial action. This aligns the implementation with RFC-012, RFC-029, RFC-032 and Product Vision's verifiable-facts boundary.

## Published boundary

Published casino copy, SEO, licenses, countries, payments, providers, categories and bonuses are read only from `CasinoVersion.snapshot`. The exact source-controlled demo-detail exception uses its fixed fictional, review-only projection and never claims a CMS publication. New publications include a sanitized MediaAsset projection containing only public URL, type, alt text, dimensions, caption, credit, ordering and status. Older versions use the immutable `CasinoImage` data already present in their snapshot.

Affiliate route availability is a deliberately narrow runtime overlay. The snapshot determines the casino and bonus content; the current active `AffiliateRedirectSlug` only determines whether a `/r/<slug>` CTA can be displayed. Disabling or archiving a redirect can remove a CTA, but cannot change published editorial content. The DTO never contains destination URLs, tracking URLs or external affiliate identifiers.

## Rendering and build safety

`/casino/[slug]`, `/casinos`, `/catalog`, `/bonuses` and the sitemap use governed public services over immutable published snapshots. Public pages are dynamic so CMS rendering does not require a database connection during compilation. Casino detail intentionally has no `generateStaticParams`; `dynamicParams` allows every valid published slug and the bounded exact-manifest review-only fallback at runtime. Repository errors fail closed without exposing database details.

## SEO and media

Published CMS metadata supplies title, description, same-origin canonical, robots, Open Graph and Twitter fields. Editor structured data is allowlisted and reduced to safe fields; published pages generate their own BreadcrumbList, Review and FAQPage schemas and never invent user review counts. The exact demo-detail exception is `noindex` and suppresses Review/FAQ/commercial schema. Media output contains no storage keys, checksums or internal metadata. Gallery media is lazy-loaded; hero media receives high fetch priority.

R2/S3 media uses validated public HTTPS URLs and native responsive images, so arbitrary tenant media hosts do not need to be added to `next.config`. Legacy fixture data is excluded from deployed public metadata and structured data. As defense in depth, any explicitly local legacy projection is `noindex` and cannot emit Review or FAQ schema.

## Cache invalidation

Publishing or archiving a casino invalidates its detail path plus `/casinos`, `/catalog`, `/bonuses` and `/sitemap.xml`. Cache invalidation lives in `lib/public-casino/cache.ts`, outside repositories and services.

## Public API

Under the Draft #72 contract, `/api/public/casinos` and `/api/public/bonuses` return normalized governed public DTOs and do not expose the detail-only source demo exception. Other legacy public CMS resources keep their existing behavior. Casino DTOs omit internal notes, mutable drafts, raw affiliate destinations and storage internals.

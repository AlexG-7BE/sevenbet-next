# RFC-032: Exact Demo Detail Continuity

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `FULL-SITE-QA-01` overnight Production-readiness brief
- **Approved:** 2026-08-14
- **Scope:** Keep an RFC-029 Best Offers demonstration review link useful without broadening public inventory or commercial authority
- **Base:** `c52595405f0800c8c2b51d5951c4a8d45c133034`
- **Depends on:** Product Vision & Principles v2.0, RFC-012, RFC-014 and RFC-029
- **Supersedes:** RFC-029 section 5 only for the exact internal review-detail continuity defined below

## 1. Decision

`FULL-SITE-QA-01` explicitly requires every Best Offers call to action to be checked and states that **View full terms** may legitimately open an internal demo casino detail page, but must never become a commercial operator redirect. The deployed experience instead sent every exact demo review link to a 404.

The exact source-controlled RFC-012 manifest may therefore supply a review-only `/casino/<exact-manifest-slug>` projection when, and only when:

1. the slug is one of the exact manifest identities;
2. a deployed CMS lookup succeeds and returns no published record;
3. a second successful CMS lookup proves the slug is outside the managed casino namespace; or
4. CMS projection is explicitly disabled in local/test compatibility mode.

A published CMS snapshot always wins. A managed draft, review, approved, archived or malformed record returns unavailable. A repository error or unknown managed state returns unavailable and never falls through to source data.

## 2. Public and commercial boundary

The exception is detail-only. It is not added to `/casinos`, `/bonuses`, public search, public casino/bonus APIs, `llms.txt`, sitemap discovery or repository results. It does not change Best Offers ranking.

Every source-controlled detail projection must:

- identify itself as fictional demonstration data adjacent to the record;
- use the trusted B4GAMBLE canonical origin and `noindex,follow`;
- suppress Review, Rating, FAQ, Product, Offer and commercial ItemList schema;
- expose no `/r` link, operator destination, affiliate destination, current licence claim, current market claim or claimable offer;
- preserve protected Help and neutral internal navigation; and
- fail closed for every unknown or non-manifest slug.

The source manifest is code-owned demonstration authority, not Production CMS data. Cleaning up CMS demo rows does not silently retire this bounded detail continuity; retiring it requires removing the source projection or this authority in a reviewed source change.

## 3. Data and architecture impact

No schema, migration, seed, Production data mutation, provider, environment variable, secret, commercial relationship or new external dependency is authorised. The existing public DTO and brand/demo sanitisation boundary is reused. Exact manifest identity is the only classifier; slug prefixes and arbitrary fallback data are forbidden.

## 4. Required verification

Automated and browser evidence must prove:

- exact demo detail succeeds in explicit local/test compatibility mode;
- exact demo detail succeeds only after both deployed CMS checks establish an unmanaged slug;
- published CMS wins over source data;
- managed unpublished/archived and repository-error states return unavailable;
- unknown and unsafe slugs return unavailable without repository expansion;
- demo metadata is noindex and commercial/Review/FAQ schema is absent;
- demo detail has no external or `/r` action and remains useful without JavaScript; and
- representative Best Offers demo links resolve to the disclosed detail state.

## 5. Release boundary and rollback

This RFC authorises only the bounded source projection, tests, documentation and Draft-PR Preview verification. It does not authorise merge, Production deployment, CMS reseeding, Production data changes or commercial activation.

Rollback removes the source-controlled detail fallback and its review links or restores an explicitly non-linking Best Offers demo presentation. CMS-published detail behaviour remains independent.

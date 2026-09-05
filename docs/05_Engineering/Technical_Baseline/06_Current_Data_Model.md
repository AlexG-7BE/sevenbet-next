# Current Data Model

## Persistence foundation

**DETECTED in a full active-repository scan for
`GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01`, starting from authoritative main
`4c7e6814247556dd61beeff8b33fcba9c4551c57` and reconciled after Production
release `aedfaee48cefea34ac9b1fac71315ba7c8c3df19`:** PostgreSQL with Prisma
(`prisma/schema.prisma`) and 28 ordered SQL migrations (`0001_cms_foundation`
through `0028_geo_localized_creative_assignments`). The schema
declares 93 Prisma models and 64 enums. Dependencies, generated output, build
artefacts, caches and `tsconfig.tsbuildinfo` were excluded from source analysis.
Application repositories/services directly use this persistence layer.

## Model groups (high level)

| Group | Detected models |
| --- | --- |
| Identity/admin | `User`, `Session`, `Account`, `Verification`, `AdminUser`, `AuditLog` |
| Program/progress/rewards | `Program`, `ProgramStep`, `Lesson`, `LessonBlock`, `ProgramVersion`, `ProgramEnrollment`, `ProgramReflection`, `ProgramProgressEvent`, `XpRule`, `UserXpEvent`, `Achievement`, `UserAchievement` |
| Active-control private flow | `AnonymousProgrammeSession`, `PendingProgrammeClaim`, `ProgrammeMissionProgress`, `MomentMap`, `CurrentGoal`, `ProgrammeActiveDay`, `ProgrammeSensitiveInputAuthority`, `ProgrammeStartingPoint`, transient `ProgrammeRuntimeRateLimitBucket` |
| Editorial/CMS | `Article`, `ContentRevision`, `SiteSetting` |
| Casino | `Casino`, `EditorialReview`, `EditorialReviewRevision`, `EditorialPreviewToken`, `CasinoOperator`, `CasinoBrand`, `CasinoAlias`, `CasinoVersion`, `CasinoRevision`, `CasinoImage`, `CasinoCountry`, `CasinoCountryEvidence`, `CasinoCountryLicense`, `CasinoLicense`, `CasinoLicenseEvidence`, `CasinoPaymentMethod`, `CasinoGameProvider`, `CasinoGameCategory`, `CasinoBonus`, `CasinoAffiliateLink`, `CasinoSeo`, legacy `Bonus` and `AffiliateLink` |
| Affiliate | `AffiliateNetwork`, `AffiliateProgram`, `AffiliateOffer`, `AffiliateOfferCountry`, `AffiliateOfferCurrency`, `AffiliateTrackingLink`, `AffiliateTrackingLinkCountry`, `AffiliateOfferRevision`, `AffiliateTrackingLinkRevision`, `AffiliateRedirectSlug`, `AffiliateRedirectRevision`, `AffiliateExternalMapping`, `AffiliateImportJob`, `AffiliateImportItem` |
| Commercial operations | `CommercialOpportunity` aggregate and its evidence, contact, activity, application, term, task, agent-run, agent-operation, activation-packet and related workflow records |
| Media | `MediaAsset`, `CasinoMediaAssignment`, `CasinoBonusMediaAssignment`, `AffiliateOfferMediaAssignment` |

Major relationships are explicit: users own sessions/accounts and progress/reward records; programs own steps, lessons, blocks, versions and enrollments; casinos own rich catalog/compliance/editorial records; `CasinoCountry` is the canonical exact-market factual grain; affiliate offers connect a network/program to a casino/bonus and tracking links; physical media can attach to casino, market profile, bonus, or affiliate offer. Typed placement assignments reuse `MediaAsset` and attach presentation to a Casino, CasinoBonus or AffiliateOffer. Migration 0028 adds nullable exact country and primary-language scope to each assignment; it does not move GEO authority into `MediaAsset`. Program/casino/affiliate version and revision records support snapshots/history.

## Enums

**Detected:** Editorial and offer lifecycle, CMS block, role, XP, casino attributes/availability/link/bonus, media, and affiliate network/status/payout/GEO/connection/sync/import/matching/source-policy enums. The precise enum definitions are retained in the schema and intentionally not duplicated here.

## Migration inventory

1. CMS foundation
2. Program Builder and progress/rewards
3. Better Auth foundation
4. Progress foreign keys
5. XP/achievement idempotency
6. Casino foundation
7. Affiliate platform foundation
8. Affiliate redirect foundation
9. Media manager
10. Affiliate integration foundation
11. Casino domain foundation
12. Casino domain suspension states
13. Responsible-gambling private reflections
14. Casino editorial platform
15. Active Control Program Mission 01/02 persistence, rewards, privacy and active days
16. Mission 03 urge-learning vertical slice
17. Mission 04 active-boundary vertical slice
18. PROGRAM-AI M1 narrow authority and confirmed Starting Point
19. Programme runtime hardening shared fixed-window rate-limit buckets
20. Commercial CRM and operations foundation
21. Partner Operations work bridge
22. Better Auth 1.7 schema upgrade
23. MCP dynamic-client-registration runtime compatibility fix
24. Durable Programme access acceptance
25. Casino market-profile architecture
26. Commercial platform completion and aggregate-only outbound click counts
27. RFC-040 typed placement-media assignments
28. Additive GEO/localized creative assignment dimensions

**DETECTED:** all 28 migration directories contain `migration.sql`.
Disposable verification replays the complete history, including a staged
0027→0028 upgrade with pre-existing assignments. **DETECTED RELEASE STATE:**
Production migration history through 0028 is recorded as applied in current
operational evidence. The guarded 0028 postflight verified its immutable
checksum and six nullable columns, preserved assignment counts `26 / 20 / 0`,
all 46 pre-existing rows global-neutral and zero targeted rows. `Article`,
legacy `Bonus`/`AffiliateLink`, `ContentRevision`, and
`SiteSetting` are schema-present; their active application use is less evident
than the program/casino/affiliate/media models and must not be assumed.

**DETECTED:** placement resolution treats every asset referenced by any
country- or language-targeted assignment as target-scoped inventory and
excludes it from legacy Casino `HERO`/`LOGO` compatibility fallback. The
exclusion includes inactive, expired and malformed targeted assignments so
legacy asset lookup cannot bypass the eligibility boundary.

# Current Data Model

## Persistence foundation

**Detected:** PostgreSQL with Prisma (`prisma/schema.prisma`) and 15 ordered SQL migrations (`0001_cms_foundation` through `0015_active_control_program_flow`). The schema currently declares 63 Prisma models and 35 enums. Application repositories/services directly use this persistence layer.

## Model groups (high level)

| Group | Detected models |
| --- | --- |
| Identity/admin | `User`, `Session`, `Account`, `Verification`, `AdminUser`, `AuditLog` |
| Program/progress/rewards | `Program`, `ProgramStep`, `Lesson`, `LessonBlock`, `ProgramVersion`, `ProgramEnrollment`, `ProgramReflection`, `ProgramProgressEvent`, `XpRule`, `UserXpEvent`, `Achievement`, `UserAchievement` |
| Active-control private flow | `AnonymousProgrammeSession`, `PendingProgrammeClaim`, `ProgrammeMissionProgress`, `MomentMap`, `CurrentGoal`, `ProgrammeActiveDay` |
| Editorial/CMS | `Article`, `ContentRevision`, `SiteSetting` |
| Casino | `Casino`, `EditorialReview`, `EditorialReviewRevision`, `EditorialPreviewToken`, `CasinoOperator`, `CasinoBrand`, `CasinoAlias`, `CasinoVersion`, `CasinoRevision`, `CasinoImage`, `CasinoCountry`, `CasinoLicense`, `CasinoLicenseEvidence`, `CasinoPaymentMethod`, `CasinoGameProvider`, `CasinoGameCategory`, `CasinoBonus`, `CasinoAffiliateLink`, `CasinoSeo`, legacy `Bonus` and `AffiliateLink` |
| Affiliate | `AffiliateNetwork`, `AffiliateProgram`, `AffiliateOffer`, `AffiliateOfferCountry`, `AffiliateOfferCurrency`, `AffiliateTrackingLink`, `AffiliateTrackingLinkCountry`, `AffiliateOfferRevision`, `AffiliateTrackingLinkRevision`, `AffiliateRedirectSlug`, `AffiliateRedirectRevision`, `AffiliateExternalMapping`, `AffiliateImportJob`, `AffiliateImportItem` |
| Media | `MediaAsset` |

Major relationships are explicit: users own sessions/accounts and progress/reward records; programs own steps, lessons, blocks, versions and enrollments; casinos own rich catalog/compliance/editorial records; affiliate offers connect a network/program to a casino/bonus and tracking links; media can attach to casino, bonus, or affiliate offer. Program/casino/affiliate version and revision records support snapshots/history.

## Enums

**Detected:** Editorial and offer lifecycle, CMS block, role, XP, casino attributes/availability/link/bonsus, media, and affiliate network/status/payout/GEO/connection/sync/import/matching/source-policy enums. The precise enum definitions are retained in the schema and intentionally not duplicated here.

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

**Detected:** all migration directories contain `migration.sql`. Whether they have been applied to any particular deployed database is **not detected** from the repository. `Article`, legacy `Bonus`/`AffiliateLink`, `ContentRevision`, and `SiteSetting` are schema-present; their active application use is less evident than the program/casino/affiliate/media models and must not be assumed.

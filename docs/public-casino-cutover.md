# Public Casino CMS Cutover

## Rollout

1. Keep `PUBLIC_CASINO_CMS_ENABLED=false` in Production.
2. Keep `AFFILIATE_REDIRECT_ENGINE_ENABLED=false` unless a separately approved non-production exercise requires it; policy still governs every request.
3. Publish a test casino after Phase 3.9 so its immutable version contains the sanitized MediaAsset projection.
4. Verify detail metadata, canonical, JSON-LD, media, bonuses, responsible gambling notices and review-only commercial state.
5. Verify `/casinos`, `/catalog`, `/bonuses`, `/sitemap.xml` and `/api/public/casinos` contain no draft or private fields.
6. Test an absent redirect mapping and confirm the offer CTA is disabled.
7. Do not enable Production referral from this cutover plan. RFC-015 authority machinery exists, but a real partner/evidence package, LEGAL-02 and a separate policy/redirect decision must approve activation.

## Rollback

Historical. Vercel Preview and Production now always read casinos from the database; `PUBLIC_CASINO_CMS_ENABLED=false` only affects local and database-less test runtimes, where it now yields no casinos. Roll back a bad casino publication in the CMS, not with this flag.

## Legacy removal

**Done, 21 September 2026 (Founder instruction).** The `data/casinos.json` placeholder catalogue (220 records) and the service fallback that mapped it were removed. Production had not rendered it since the CMS path was forced for deployed runtimes, and `/casino/[slug]` already rendered only CMS-sourced profiles. `/go/[slug]` is unaffected. The casino inventory is listed in `data/casino-registry.json`.

## Known temporary policy

Affiliate route availability is checked against current jurisdiction policy, operator evidence and the mutable redirect registry at request time. This is intentional fail-closed behavior: any deny removes the CTA. Editorial text and offer terms remain frozen in `CasinoVersion`. Published media is frozen for versions created after this phase; older versions should be republished before relying on Media Manager assets publicly.

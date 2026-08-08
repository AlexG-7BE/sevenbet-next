# Public Casino CMS Cutover

## Rollout

1. Keep `PUBLIC_CASINO_CMS_ENABLED=false` in Production.
2. Keep `AFFILIATE_REDIRECT_ENGINE_ENABLED=false` unless a separately approved non-production exercise requires it; policy still governs every request.
3. Publish a test casino after Phase 3.9 so its immutable version contains the sanitized MediaAsset projection.
4. Verify detail metadata, canonical, JSON-LD, media, bonuses, responsible gambling notices and review-only commercial state.
5. Verify `/casinos`, `/catalog`, `/bonuses`, `/sitemap.xml` and `/api/public/casinos` contain no draft or private fields.
6. Test an absent redirect mapping and confirm the offer CTA is disabled.
7. Do not enable Production referral from this cutover plan. COMM-01, LEGAL-02 and current market/operator evidence must separately approve it.

## Rollback

Set `PUBLIC_CASINO_CMS_ENABLED=false` and redeploy. This restores review-only legacy rendering without deleting CMS records, versions, media, affiliate mappings or the non-commercial `/go` route. No database rollback is required, and rollback must not restore an external `/go` handoff.

## Legacy removal criteria

Legacy data can be retired only after every indexed legacy slug has a validated published CMS version, redirects have been verified by GEO, sitemap parity has been measured, and a production rollback window has passed. Removing legacy files or `/go/[slug]` is explicitly outside Phase 3.9.

## Known temporary policy

Affiliate route availability is checked against current jurisdiction policy, operator evidence and the mutable redirect registry at request time. This is intentional fail-closed behavior: any deny removes the CTA. Editorial text and offer terms remain frozen in `CasinoVersion`. Published media is frozen for versions created after this phase; older versions should be republished before relying on Media Manager assets publicly.

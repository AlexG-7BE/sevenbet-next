# Public Casino CMS Cutover

## Rollout

1. Keep `PUBLIC_CASINO_CMS_ENABLED=false` in Production.
2. Enable it in Preview with `AFFILIATE_REDIRECT_ENGINE_ENABLED=true`.
3. Publish a test casino after Phase 3.9 so its immutable version contains the sanitized MediaAsset projection.
4. Verify detail metadata, canonical, JSON-LD, media, bonuses, responsible gambling notices and `/r` CTAs.
5. Verify `/casinos`, `/catalog`, `/bonuses`, `/sitemap.xml` and `/api/public/casinos` contain no draft or private fields.
6. Test an absent redirect mapping and confirm the offer CTA is disabled.
7. Enable the flag in Production and monitor 404s, page errors and redirect-unavailable diagnostics.

## Rollback

Set `PUBLIC_CASINO_CMS_ENABLED=false` and redeploy. This restores legacy rendering without deleting CMS records, versions, media, affiliate mappings or `/go` routes. No database rollback is required.

## Legacy removal criteria

Legacy data can be retired only after every indexed legacy slug has a validated published CMS version, redirects have been verified by GEO, sitemap parity has been measured, and a production rollback window has passed. Removing legacy files or `/go/[slug]` is explicitly outside Phase 3.9.

## Known temporary policy

Affiliate route availability is checked against the mutable redirect registry at request time. This is intentional fail-closed behavior: a missing or disabled route removes the CTA. Editorial text and offer terms remain frozen in `CasinoVersion`. Published media is frozen for versions created after this phase; older versions should be republished before relying on Media Manager assets publicly.

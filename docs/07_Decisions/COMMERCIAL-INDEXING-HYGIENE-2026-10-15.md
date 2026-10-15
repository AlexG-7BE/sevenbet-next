# Commercial indexing hygiene: review dates, IndexNow on deploy, prefixed links, reviews with no button

**Status:** ACCEPTED — built on 16 October 2026 in branch `fix/commercial-indexing-hygiene`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged, deployed and
observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026 — the Founder's choice in the
affiliate traffic audit («выбор Фаундера в аудите партнёрского трафика»): the PR package, items
"review dates", "language-less links" and item 7 (take the reviews with no button out of the index).

Ordinary SEO work: no RFC, no database change, no migration, no new column, no change to any
offer, partner route, the Programme, pause or Help pages.

## What changes

1. **Review modification date (DETECTED gap, fixed).** The 20 Swedish and Danish reviews grew by
   450–650 words on 15 October 2026 (`lib/casino-profile/in-depth/{sv,da}.ts`, `checked:
   "2026-10-15"`), while the sitemap `lastmod` and the `dateModified` of the WebPage and Review
   markup still read the September database date. Both now take the latest of the database date
   and the check date of that language's long review (`reviewModifiedAt(casino, language)`,
   `inDepthCheckedAt`). English and German reviews have no long review and keep the database date.
2. **IndexNow after a Production deploy.** `.github/workflows/indexnow-resubmit.yml` also runs on
   `deployment_status`; after a successful Production deployment it compares the in-depth review
   files with the previous successful Production deployment and announces only the reviews that
   changed (`scripts/indexnow-changed-reviews.mjs`), and only those the live sitemap lists. The
   manual full resubmit is unchanged. Database edits are still announced by the admin publish
   (`lib/seo/indexnow.ts`).
3. **No 307 hops from the English bonus guide and affiliate disclosure.** Their bare links to
   `/bonuses`, `/best-offers`, `/learn`, `/methodology` and `/contact` (all answer 307 to `/en/…`)
   now point at the `/en/` pages (`localizeEnglishHandoffHrefs`, `AffiliateDisclosureDocument`).
   Programme and Help links keep their own rules.
4. **Reviews whose market has no button leave the index.** `reviewIndexable` also reads
   `BLOCKED_TARGETS` (moved to `lib/market-access/blocked-targets.ts`, re-exported by the release
   module): Betsafe SE, Regency SE, PlayUZU SE and DragonBet GB become `noindex, follow`, leave the
   sitemap, llms.txt, IndexNow and hreflang. A review returns to the index when its target leaves
   that list (e.g. when Betsson Group sends a Swedish Betsafe link).

## Release gates

- Merged and deployed: UNKNOWN at writing.
- The first `deployment_status` run is observed in GitHub Actions after the deploy.

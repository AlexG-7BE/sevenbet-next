# German, Swedish and Danish open to search

**Status:** ACCEPTED

**Decision authority:** explicit Founder instructions, 27 September 2026 (the day before the GB/SE/DK/DE launch): "Открыть индекс de/sv/da", confirmed in chat ("открывай что надо").

## Decision

- **German, Swedish and Danish are indexable.** `lib/market/registry.ts`:
  - `LANGUAGE_ROUTE_PROFILES` for `de`, `sv` and `da` is `indexable: true` with no publication blocker. This drives page robots (`productIndexingApproved`) and hreflang (`productLanguageAlternates`).
  - `MARKET_PUBLICATION_POLICY` for DE, SE and DK is `indexable: true` with no blocker, reviewed 27 September 2026. This drives the localized sitemap (`marketIndexingApproved`).
- **Every indexable page carries reciprocal hreflang** for `en`, `de`, `sv`, `da` and `x-default`. Since 2 October 2026 (Semrush Site Audit) `x-default` names the English page, not the unprefixed path that redirects, and noindex pages and query variants carry no hreflang.
- **The sitemap lists each indexable market's core pages.** It lists the same core pages as the English sitemap wherever the market has a localized route: home, 10 Steps, Learn, Responsible Gambling, Help, Methodology, About, Contact and FAQ. The market's published product pages and casino reviews are listed too, as before.
- **Spanish, Greek, Italian, Portuguese, Dutch, Finnish and Norwegian stay noindex** and outside the sitemap until the Founder opens them.

## Supersedes

- The `LOCAL_LEGAL_REVIEW_REQUIRED` indexing blocker on de/sv/da, and the DE/SE/DK market indexability blockers of 3 September 2026. The Founder opened these without a separate local legal review of the translations. The translations remain machine translated, with AI language QA passed (`lib/i18n/review-state.ts`).
- The rule in `docs/CURRENT_STATE.md` that review-gated Product translations stay self-canonical noindex outside the sitemap. That rule now applies only to the languages listed above as staying noindex.

## Evidence

- `tests/seo-market-indexability.test.ts` pins the DE/SE/DK policy, `INDEXABLE_MARKET_PROFILES` (GB, DE, SE, DK), noindex Spanish and Greek without hreflang, and the English hreflang set.
- `tests/internationalisation-market.test.ts` checks that German carries hreflang and Spanish stays outside it, and pins which locales are indexed.
- `tests/first-wave-market-evidence.test.tsx` checks that the first-wave safety metadata is indexed for DE, SE and DK only.
- `tests/current-partner-global-rollout.test.ts` pins the language blockers.
- The browser specs `tests/geo-localization-browser.spec.ts` and `tests/internationalisation-browser.spec.ts` assert noindex only for the languages that stay closed.

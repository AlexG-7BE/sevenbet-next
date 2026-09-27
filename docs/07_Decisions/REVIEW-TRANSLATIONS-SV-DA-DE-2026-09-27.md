# Swedish, Danish and German casino review text

**Status:** ACCEPTED — implementation **PROPOSED — NOT YET LIVE** until merged and deployed.

**Decision authority:** explicit Founder approval of "Package D — Swedish, Danish and German casino review text", 27 September 2026, after the pre-launch audit (launch in GB/SE/DK/DE on 28 September 2026). The Founder rule for this package: no database writes and no schema change.

## Problem (DETECTED on Production `952d0e0b`, 27 September 2026)

Casino editorial text exists only in English, in the published casino snapshots and editorial reviews. `presentationLanguage` reached `lib/services/public-casino.service.ts` but was never used, so on `sv`, `da` and `de` pages the section headings were translated while the content stayed English: `/sv/casinos` showed 28 English highlight lines, every Swedish, Danish and German review had English verdicts, "why we rate" reasons, best-for / keep-in-mind values and FAQ answers, and the meta description was a localized prefix plus the English `casino.summary`. `projectCasinoProfileSchemas` also dropped `FAQPage` for every locale other than `en-GB`. The 81 localized review URLs opened to search on the same day were mostly English.

## Decision

- **An exact-source catalog in code.** `lib/i18n/casino-editorial-translations/` holds one entry per published English source string with its Swedish, Danish and German text. Lookup compares the English source trimmed and with whitespace collapsed — nothing looser. A string the catalog does not know (including any later edit to the English) is shown exactly as published, so a stale translation can never stand in for newer English copy; the page simply falls back to English for that string.
- **Applied once, at the public presentation boundary**, per request and after the editorial cache: `PublicCasinoService.getCasino` / `listCasinos` / `listBonuses`, the casino directory cards of `PublicCasinoDiscoveryService`, and the offer records of `PublicOfferService`. `lib/i18n/casino-editorial-translations/localize.ts` does the work; nothing is written to the database and no schema changes.
- **Translated fields:** summary (verdict, "why we rate" line and meta description), review paragraph (Review structured data), pros ("who it suits", directory highlights), cons ("keep in mind"), control-tool labels, game-category labels, generic payment method names ("Bank transfer"), offer titles, summaries, wagering text, eligibility and conditions written in English, market-profile KYC / withdrawal / support sentences, the editorial FAQ questions and answers, and the profile's own FAQ questions (`profile-faq-copy.ts`).
- **Kept as published:** numbers and amounts (the tests require every translation to carry the same numbers), brand, operator, company, game, studio, regulator and licence names, payment brands, domains, slugs and keys. Payout timings stay in their source wording inside the records, because the payout badge and the fast-payout order parse them; they are translated only where the profile FAQ writes them out. Offer text already written in Danish or German for those markets is recognised as such (`native.ts`) and never "translated".
- **Ranking does not change with the page language.** An offer record translated for a page carries `sourceSevereRestrictionCount`, the severe-restriction signal read from its English terms, so Best Offers (ranked in the browser) orders the same offers the same way in every language. The catalog is imported only by server code and never reaches the browser bundle.
- **Structured data follows the visible text.** The meta description, `WebPage` description and `Review` body read the translated DTO. A translated profile emits `FAQPage` — marked with `inLanguage` — only when every question and answer reads in the page language, and then with exactly the text the reader sees; otherwise there is no `FAQPage`, as before. The `WebPage` name on sv/da/de pages is "{casino} {review}" in the page language instead of the English editorial title.
- **German follows the terminology guard** (`lib/i18n/german-terminology.ts`): no generic Casino wording, jackpots, live or table games in German catalog text; where the English names such a category, the German text generalises it. Category labels that only name a category hidden in Germany (`GERMAN_HIDDEN_CATEGORY_LABELS`) stay untranslated.
- **The public API follows the negotiated language.** `/api/public/casinos` and `/api/public/bonuses` already resolved a presentation language (Accept-Language, then the market's default); they now return translated text for `sv`, `da` and `de`. Send `Accept-Language: en` to read the English source.

## Keeping the catalog current

When English editorial text changes, the affected string reads in English on sv/da/de pages until an entry is added. To refresh: read the English source with `Accept-Language: en` from `https://b4gamble.com/api/public/casinos?limit=100`, `https://b4gamble.com/api/public/bonuses?limit=100` and the English review pages (`/en/casino/{slug}`, FAQ in the `FAQPage` JSON-LD), add or replace entries, and run `npm run internationalisation:test`. `tests/casino-editorial-translations.test.ts` fails on a missing or empty translation, a changed number, a duplicate source or German text that breaks the terminology guard.

## Known gaps (INFERRED from the source used)

- The source was Production's **global projection** (read from Kazakhstan) plus the English review pages. Market-profile sentences (withdrawal, support and KYC summaries), market-only offers and market-specific payout timings that the global projection does not show are **not catalogued** and stay English where they are English. They can be added from a market-exit read of the same API.
- Spanish, Portuguese and Italian offer text is left as published; pages in languages other than sv/da/de are unchanged.
- Licence authority fields are names and are not translated, even where one carries English detail.

## Supersedes

- RFC-037's line "exact offer terms are not machine-translated as facts" for this scope: the published English offer terms and casino editorial text may be shown translated on sv/da/de pages through the exact-source catalog. Numbers, amounts and names stay as published, and the operator's own terms (linked from the offer) remain authoritative.
- The rule in `projectCasinoProfileSchemas` that no localized profile emits `FAQPage`.

## Evidence

- `tests/casino-editorial-translations.test.ts` (in `npm run internationalisation:test`, part of `ci:quality`): catalog completeness and number preservation; German terminology guard over the catalog and the profile FAQ copy; exact-source lookup and English fallback; the service boundary returning sv/da/de text and untouched English for `en`; ranking parity; `FAQPage` only when every pair is translated, identical to the visible FAQ.

# Ukrainian language and the Ukraine market

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 7 October 2026: "Мне нужно добавить украинский язык на сайт, чтобы в Украине сайт открывался с украинским поддоменом." Two answers through the question tool the same day: the address is `b4gamble.com/uk`, and the release goes "сразу в прод и в Google".

## Decision

- **Ukrainian is the twelfth published language.** `lib/market/registry.ts`: language `uk`, locale `uk-UA`, public slug `/uk`, label "Українська", `published: true`, `indexable: true`. It is a language section of the one site, like `/sv`, `/de` and `/da`. A separate `ua.b4gamble.com` host was offered and declined: Production keeps one canonical host.
- **Ukraine is a market profile.** `UA`: display name "Україна", currency hint `UAH`, default locale `uk-UA`, `routable`, `published` and `indexable` in `MARKET_PUBLICATION_POLICY`, reviewed 7 October 2026. The legacy market-shaped addresses `/ua`, `/ua/…` and `/uk-ua/…` answer one 308 to `/uk…`; `/ua/program` answers one 308 to `/uk/program`.
- **In Ukraine the site opens in Ukrainian.** For a visitor whose trusted country is `UA`, the country decides the language before the browser's `Accept-Language` does (`GEO_LANGUAGE_FIRST_MARKETS` in `lib/market/presentation-resolver.ts`). Many browsers in Ukraine are set to Russian or English, and the general order (browser language before country) would have opened English for them. Two things still outrank the country: an explicit language address (`/en/casinos`) and a language the visitor picked in the language menu. No other market changes its order.
- **The whole public site and the Programme are translated.** Every typed catalog has a `uk-UA` entry: header, footer, Home, product pages, Learn hub, static pages, the wagering calculator, cookie choice, errors and the full Programme catalogue with its ten Missions. Legal pages stay unprefixed and English, as for every language.
- **Casino review text and offer terms are translated too,** through the same exact-English-source catalog that serves Swedish, Danish and German (`lib/i18n/casino-editorial-translations`). This extends [REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27](REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27.md) and [OFFER-TERMS-TRANSLATIONS-SV-DA-DE-2026-09-27](OFFER-TERMS-TRANSLATIONS-SV-DA-DE-2026-09-27.md) to `uk`: numbers, amounts, brands and regulators stay as published, a source the catalog does not know is shown in English, and the operator's linked terms remain the authoritative source.
- **Help and Responsible Gambling have a Ukrainian page with Ukrainian resources.** `UA` joins the governed safety markets (`FIRST_WAVE_EVIDENCE_MARKET_CODES`) with an evidence profile read on 7 October 2026 from the State Agency of Ukraine PlayCity's own pages: the online restriction application (`pc.gov.ua`), the agency's free hotline and its gambling-addiction-prevention phone, the directory of medical, social and public help, the self-assessment test and the responsible-gambling page. The agency's phone lines are presented as regulator contacts, not as counselling. No resource is listed that was not read on an official page.
- **Voice.** The reader is addressed informally ("ти"), as in German and Swedish; buttons use the infinitive ("Зберегти", "Порівняти").

## What does not change

- **Commercial authority.** The language and the market profile grant no partner route. On 7 October 2026 a visitor from Ukraine reads the published offers without a partner button (`/api/public/bonuses` from a Ukrainian exit: 26 offers, every `action` null). Opening partner routes for Ukraine is a separate Founder decision through the market access register.
- **The editorial fallback.** Ukrainian has no entry in `LANGUAGE_EDITORIAL_MARKET`, like German, Spanish and the other languages outside en/sv/da. A reader of `/uk` pages from a country without its own market sees the worldwide view. Because Ukraine is now a registered market, a visitor from Ukraine keeps the Ukraine view on English, Swedish and Danish pages as well, instead of the borrowed UK, Swedish or Danish one.
- **Learn guides** are written in English and localized as data. Until Ukrainian versions are published, `/uk/learn` shows the Ukrainian hub and opens guides in English, as every language without localized guides does.
- **Programme state.** Locale stays out of Programme identity, progress, rewards and persistence ([Programme internationalisation](../internationalisation/programme-internationalisation.md)). No Prisma migration.

## Translation state

Machine translated with the bounded automated language QA passed for both catalogs (`docs/internationalisation/ai-language-qa-report.json`, `docs/internationalisation/programme-ai-language-qa-report.json`). This is not native-speaker, legal or regulatory review; `lib/i18n/review-state.ts` records `uk-UA` like the other Founder-accepted languages.

## Evidence

- `tests/geo-localization-routing.test.ts` pins the Ukraine language order and the `/ua` and `/uk-ua` redirects.
- `tests/first-wave-market-evidence.test.tsx` pins the Ukraine safety profile, its review date and the Ukrainian Help and Responsible Gambling routes.
- `tests/seo-market-indexability.test.ts` and `tests/internationalisation-market.test.ts` pin the indexable set (`en`, `de`, `sv`, `da`, `uk`) and its hreflang.
- `tests/programme-internationalisation.test.ts` covers the twelve Programme routes and the Ukrainian provider-output backstop.

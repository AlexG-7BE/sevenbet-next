# Russian language

**Status:** PUBLICATION WITHDRAWN on 9 October 2026 by [LANGUAGES-HIDDEN-2026-10-09](LANGUAGES-HIDDEN-2026-10-09.md). The language is hidden from the public site; the translations described here remain in the repository.

**Decision authority:** explicit Founder instruction, 7 October 2026, given while Ukrainian was being added: "как переведешь на украинский, переведи еще и на русский." The release follows the answer the Founder gave for Ukrainian the same day ("сразу в прод и в Google").

## Decision

- **Russian is the thirteenth published language.** `lib/market/registry.ts`: language `ru`, locale `ru-RU`, public slug `/ru`, label "Русский", `published: true`, `indexable: true`, with reciprocal hreflang and its core pages, reviews and `/ru/program` in the sitemap. `/ru-ru/…` answers one 308 to `/ru/…`.
- **It is a language for Russian-speaking readers anywhere, not a market.** The registry needs every language's locale to belong to a market profile (the middleware binds a language route to one), so `RU` exists as the profile that anchors `ru-RU`: display name "Россия", `routable`, `published`, `indexable`. The profile grants nothing commercial.
- **Russian follows the browser, like every language except Ukrainian in Ukraine.** A visitor whose browser asks for Russian opens `/ru…` from any country. In Ukraine the country still decides first ([UKRAINIAN-LANGUAGE-2026-10-07](UKRAINIAN-LANGUAGE-2026-10-07.md)), so a Russian-language browser there opens Ukrainian; a visitor who picks Russian in the language menu keeps it.
- **The whole public site and the Programme are translated,** and casino review text and offer terms join the exact-English-source catalog (`lib/i18n/casino-editorial-translations`) as its fifth language. The copy is country-neutral: informal "ты", buttons in the infinitive, the wagering calculator's examples in euros.
- **Help and Responsible Gambling stay without a Russian page.** No Russian-language safety resource was read on an official page, so `RU` does not join the governed safety markets. A Russian page links Help to the English address, where the visitor's own country still decides which verified resources are shown. This relies on the Help fallback fixed on 7 October 2026 for `it`, `pt`, `nl`, `fi` and `nb` (a language without its own Help page opens the English one instead of a 404).

## What does not change

- **Offers in Russia stay withheld.** `RU` remains in `OFFER_PRESENTATION_PROHIBITED_MARKETS` (`lib/public-offer/offer-visibility.ts`): a visitor from Russia reads reviews, Learn and the Programme without offers or partner buttons, in Russian as before in English. Kazakhstan stays geo-blocked.
- **Commercial authority.** No partner route is granted or changed for any country. Russian has no entry in `LANGUAGE_EDITORIAL_MARKET`: a reader of `/ru` pages sees the view of the country they are in.
- **Learn guides** stay English until Russian versions are published as data.
- **Programme state.** Locale stays out of Programme identity, progress, rewards and persistence. No Prisma migration.

## Translation state

Machine translated with the bounded automated language QA passed for both catalogs. This is not native-speaker, legal or regulatory review; `lib/i18n/review-state.ts` records `ru-RU` as Founder-accepted with market evidence still required.

## Evidence

- `tests/geo-localization-routing.test.ts` pins the `/ru` routes, the browser-language order and Ukraine's Ukrainian-first rule next to Russian.
- `tests/seo-market-indexability.test.ts`, `tests/internationalisation-market.test.ts` and `tests/crawler-ready-metadata.test.ts` pin the indexable set (`en`, `de`, `sv`, `da`, `uk`, `ru`).
- `tests/programme-internationalisation.test.ts` covers the thirteen Programme routes and the Russian provider-output backstop.
- `tests/first-wave-market-evidence.test.tsx` checks that `/ru/help` and `/ru/responsible-gambling` do not exist.

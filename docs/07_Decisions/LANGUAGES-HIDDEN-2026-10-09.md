# Ukrainian and Russian are hidden from the public site

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 9 October 2026: "скрой с сайта украинский и русский языки. не удаляй из базы, но скрой для всех пользователей, и так что бы его нельзя было выбрать ну и так далее, короче как будто-то бы его нет." The same day the Founder decided not to enter the Ukrainian market.

This record withdraws the publication granted by [UKRAINIAN-LANGUAGE-2026-10-07](UKRAINIAN-LANGUAGE-2026-10-07.md) and [RUSSIAN-LANGUAGE-2026-10-07](RUSSIAN-LANGUAGE-2026-10-07.md). Everything those records say about how the translations were made still describes the catalogs that remain in the repository.

## Decision

- **Neither language is published.** `lib/market/registry.ts`: `uk` and `ru` carry `published: false`, `indexable: false`, `publicationBlocker: "WITHDRAWN_BY_FOUNDER"`. The `UA` and `RU` market profiles carry `published: false`, `indexable: false`, `indexabilityBlocker: "LANGUAGE_WITHDRAWN_BY_FOUNDER"`, reviewed 9 October 2026, and leave the European runtime tranche (`INITIAL_EUROPEAN_MARKET_CODES`). Eleven languages are published again.
- **Nothing is deleted.** Every `uk-UA` and `ru-RU` catalog, the casino review and offer-term translations, the Ukraine safety evidence profile and the two market profiles stay. No database row is touched and there is no migration.
- **Production serves no address of a hidden language.** `/uk…`, `/ru…` and the country-shaped addresses that used to redirect to them (`/ua…`, `/uk-ua…`, `/ru-ru…`) answer as unknown paths (HTTP 404), with no redirect. `/uk/program` and `/ru/program` are no longer Programme routes in any environment.
- **Nobody is sent to a hidden language.** `resolvePresentationContext` (`lib/market/presentation-resolver.ts`) never chooses an unpublished language from a saved choice, the visitor's country or the browser's `Accept-Language`; the visitor gets the next language they asked for, then the market's language, then English. A visitor from Ukraine or with a Russian browser opens the English site. The Ukraine-first rule (`GEO_LANGUAGE_FIRST_MARKETS`) stays in the code and is inert while Ukrainian is unpublished. The same rule now keeps French, which was never published, out of negotiation.
- **Nobody can pick one.** The header and Programme language menus list published languages only, and `/api/presentation` rejects an unpublished choice.
- **Search engines are told nothing about them.** The pages leave the sitemap, hreflang, the Programme's language alternates and IndexNow announcements. The addresses Google already knows answer 404 and drop out.
- **A market whose own language is hidden is named in the page language.** A visitor from Ukraine reads "Ukraine" on an English page, not "Україна".
- **Programme.** A request that names `uk-UA` or `ru-RU` is refused as an unsupported Programme locale; Programme pages fall back to English. Programme identity, progress and rewards never depended on locale.
- **Production smoke** no longer expects `/uk` and `/ru` homes.

## What does not change

- **Outside Production** (previews, local development, CI) the explicit addresses `/uk…` and `/ru…` still render, as every unpublished language with ready translations does, so the translations can be reviewed. Nothing links or redirects to them.
- **Commercial authority, Help resources by country and the Kazakhstan geo-block** are untouched. A visitor from Ukraine still reads the worldwide offers without a partner button; offers stay withheld in Russia.
- **`docs/internationalisation/ai-language-qa-report.json`** still covers both catalogs. The Programme report follows the published Programme locales and no longer lists them.

## Restoring a language

Set `published` and `indexable` back to `true` and `publicationBlocker` to `null` on the language profile, restore the market profile's publication policy, return the market to `INITIAL_EUROPEAN_MARKET_CODES`, add `/uk/program` or `/ru/program` to `PROGRAMME_MICROPHONE_ROUTES` in `next.config.mjs`, regenerate the Programme language QA report, and restore the pinned language lists in the tests named below. Add the home to the Production smoke only after the release is live.

## Evidence

- `tests/geo-localization-routing.test.ts` pins that no country, browser language or saved choice resolves to a hidden language, that Production neither serves nor redirects to their addresses, and that the explicit address still renders outside Production.
- `tests/seo-market-indexability.test.ts`, `tests/internationalisation-market.test.ts`, `tests/first-wave-market-evidence.test.tsx` and `tests/crawler-ready-metadata.test.ts` pin the indexable set (`en`, `de`, `sv`, `da`), its hreflang, the sitemap's Programme routes and the IndexNow URLs.
- `tests/programme-internationalisation.test.ts` and `tests/logo-only-media-retirement.test.ts` pin the eleven published Programme routes.

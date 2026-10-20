# Uzbek language on both sites

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 20 October 2026: "я хочу перевести сайты на узбекский, оба сайта, сделай это." The release follows the answer the Founder gave for the previous language releases ("сразу в прод и в Google", 7 October 2026).

## Decision

- **Uzbek is the twelfth published language.** `lib/market/registry.ts`: language `uz`, locale `uz-UZ`, public slug `/uz`, label "Oʻzbekcha", `published: true`, `indexable: true`, with reciprocal hreflang and its core pages, reviews and `/uz/program` in the sitemap. `/uz-uz/…` answers one 308 to `/uz/…`.
- **Latin script, the official Uzbek alphabet.** oʻ and gʻ are written with U+02BB (ʻ) and the tutuq belgisi with U+02BC (ʼ), never with an ASCII apostrophe. No Cyrillic Uzbek.
- **The `UZ` market profile** ("Oʻzbekiston", `routable`, `published`, `indexable`, currency hint UZS) anchors the locale, as every language's locale must belong to a market profile. It grants nothing commercial.
- **In Uzbekistan the country decides the language before the browser**, the rule Ukraine already has (`GEO_LANGUAGE_FIRST_MARKETS` in `lib/market/presentation-resolver.ts`): most browsers there ask for Russian, which is not published, so a visitor in Uzbekistan opens `/uz…`. Elsewhere Uzbek follows the browser. An explicit language address and a language the visitor picked in the menu still come first.
- **Both sites.** The same code serves `b4gamble.com` and the help site, so the public site, the Programme, the 10 Steps page, the wagering calculator, casino review text and offer terms (`lib/i18n/casino-editorial-translations`, its sixth language) are Uzbek on the main host, and the help site's own words (`lib/site/help-copy.ts`: shell, home, owner and organisations pages, the control FAQ answer, the guides hub) are Uzbek on the help host, where `/uz` is its Uzbek prefix.
- **Voice:** polite "siz", buttons as verbal nouns ("Boshlash", "Davom etish"), country-neutral copy; the wagering calculator's examples stay in euros, as Russian did.

## What does not change

- **Commercial authority.** No partner route is granted or changed for any country. `UZ` has no licence entry in the market access register, so a visitor in Uzbekistan reads reviews, offers and the Programme in Uzbek, and offers carry no partner button, exactly as any market without authority. Kazakhstan stays geo-blocked.
- **Help and Responsible Gambling in Uzbek (added the same day, Founder's pick «Узбекская помощь»).** `UZ` joins the governed safety markets (`FIRST_WAVE_EVIDENCE_MARKET_CODES`) with a profile read on official pages on 20 October 2026 (`lib/market/first-wave-evidence.ts`): self-exclusion through the Unified State Register of Bets and Players (Regulation 3639 of 7 July 2025, clauses 1, 10, 51, 53, 54), the list of persons dependent on risk-based games (own application, 6 months to 5 years; Cabinet resolution 814 of 6 December 2024), the regulator NAPP (appeals to info@napp.uz, chancellery (71) 231-79-09, presented as a regulator contact, not counselling), the call centre of the Republican Mental Health Centre (+998 55 515 45 65, with the plain statement that its pages do not name gambling) and the emergency numbers 103 and 102 (my.gov.uz). `/uz/help` and `/uz/responsible-gambling` exist, the Programme's Help link opens them, and `/help` hreflang lists `uz`. The application channel for the dependent-persons list is not stated in the clauses read, so the page sends the reader to the agency rather than to a form.
- **Market-specific help pages stay in their languages.** The pause plans (`/pause-plan`: GAMSTOP, Spelpaus, ROFUS), `/innan`, `/beside`, `/pause-statistics`, `/forum-study` and the control answer pages (`/gambling-control`, `/control-without-quitting`, `/gambling-control-tools`) describe British, Swedish and Danish services and are written in English, Swedish and Danish only; an Uzbek reader opens the English version, as readers of every other language do. An Uzbek version needs Uzbekistan's own services, read on official pages, first.
- **Casino reviews follow the licence rule of 15 October 2026** (`lib/seo/review-indexing.ts`, `REVIEW_INDEX_MARKETS.uz = "UZ"`): a review is indexed in a language only where that language's market licenses the casino. No casino holds a licence for Uzbekistan in the register, so every Uzbek review is published, translated and `follow`, and stays out of the index, the sitemap, `llms.txt`, IndexNow and the reviews' hreflang. The Uzbek home, catalogue directories, Programme, 10 Steps and static pages are indexed. Indexing Uzbek reviews anyway is a one-line change and a Founder decision.
- **Help pages name only the languages they exist in.** `firstWaveSafetyLanguageAlternates` leaves an indexable language without its own Help page out of the hreflang of `/help` and `/responsible-gambling`, because a redirecting hreflang target is a crawler error. Uzbek has its Help page, so it is listed.
- **Learn guides** stay English until Uzbek versions are published as data.
- **Programme state.** Locale stays out of Programme identity, progress, rewards and persistence. No Prisma migration.

## Translation state

Machine translated with the bounded automated language QA passed for both catalogs (`docs/internationalisation/ai-language-qa-report.json`, `docs/internationalisation/programme-ai-language-qa-report.json`). This is not native-speaker, legal or regulatory review; `lib/i18n/review-state.ts` records `uz-UZ` as Founder-accepted with market evidence still required.

## Evidence

- `tests/geo-localization-routing.test.ts` pins the `/uz` routes, the browser-language order and Uzbekistan's Uzbek-first rule.
- `tests/seo-market-indexability.test.ts`, `tests/internationalisation-market.test.ts` and `tests/crawler-ready-metadata.test.ts` pin the indexable set (`en`, `de`, `sv`, `da`, `uz`).
- `tests/programme-internationalisation.test.ts` covers the twelve Programme routes and the Uzbek provider-output backstop.
- `tests/first-wave-market-evidence.test.tsx` checks the Uzbekistan profile (dated DETECTED evidence, the named resources), that `/uz/help` and `/uz/responsible-gambling` are canonical routes, and that the Help hreflang lists `uz`.

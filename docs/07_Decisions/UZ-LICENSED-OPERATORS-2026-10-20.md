# Uzbek reference page: licensed operators and how to recognise them

**Status:** ACCEPTED

**Decision authority:** Founder pick «Страница о лицензиатах», 20 October 2026, as an organic search play: search demand for the licensed brand Olimpbet grew about 13 times in September 2026, and store apps named "Olimpbet" from unrelated developers capture that demand (Founder's research; not re-measured here).

## Decision

- **One neutral reference page on b4gamble.com:** `/uz/uzbekistan-licensed-operators` (Uzbek, the target) and `/en/uzbekistan-licensed-operators` (English, canonical fallback and `x-default`). It says which companies hold an Uzbek licence, what the law requires of them, how a player recognises the licensed site and app against mirrors, copies and APK files, which protections the law gives players, and where Help is.
- **No commercial action.** No offer, bonus, ranking, partner button, `/r/` route or persuasive wording; the operators' domains are plain text, never links. Outbound links go only to the NAPP register and to lex.uz; internal links go to `/help` and `/responsible-gambling`. The page states the revenue model and that B4GAMBLE has no partner link for Uzbekistan. Reason: Uzbekistan bans gambling advertising (Law "On Advertising", art. 46, as given in the Founder brief; **not re-read** for this record) and RFC-054 allows commercial action only through governed `/r/` routes.
- **English and Uzbek only, by route policy.** A new public-route policy, `MARKET_SCOPED_PUBLIC` (`lib/market/routing.ts`, with `MARKET_SCOPED_PUBLIC_ROUTES`), makes a route localizable only under English (GB) and the markets it names, the way `FIRST_WAVE_SAFETY` scopes Help. The sitemap, hreflang (`existingLanguageAlternates` in `lib/market/product-context.ts`), the language menu and the middleware all read the same function, so `/de/…`, `/sv/…` and `/da/…` do not exist (404), an unprefixed visit redirects to `/uz/…` or `/en/…`, and hreflang lists `en`, `uz` and `x-default` only.
- **Main site only.** `COMMERCIAL` in `lib/site/host-routes.ts`: the help site names no operator and answers 404.
- **Indexable**, in `coreRoutes` (sitemap: `/en/…` and `/uz/…`), and listed in `llms.txt` with its Uzbek version.
- **Internal links:** none added. No Uzbek catalogue or market note exists that would carry one naturally.
- No database change, no migration, no change to the desktop home page, no change to commercial authority.

## Facts on the page (all DETECTED on 20 October 2026, Firecrawl from a US exit)

| Fact | Source |
| --- | --- |
| Register: “Olimpbet” MChJ, STIR 308547784, www.olimpbet.uz, ITO # 001 (online risk-based games) and BF # 001 (bookmaking); “Aurum Vale” MChJ, STIR 312278399, www.oltinbet.uz, ITO # 002 and BF # 002; all issued 31.07.2026 by orders 62–65 of 27.07.2026; no other entry | https://napp.uz/oz/pages/rbglr, https://napp.uz/en/pages/rbglr |
| All four licences valid to 30.07.2031 | The licence PDFs the register links (ITO001, BF001, ITO002, BF002) |
| Online risk-based games and bookmaking allowed from 1 January 2025 under NAPP licences; participants 18+; 4 % turnover tax on income minus winnings paid and stakes returned, players' winnings exempt from personal income tax, as an experiment for three years from 1 July 2026 (clause 3 as amended by PF-95 of 19 May 2026) | Decree PF-68 (UP-68) of 19 April 2024: https://lex.uz/docs/-6899273, https://lex.uz/ru/docs/6899275 |
| Licence only for resident legal entities, five years (cl. 3); platform on servers in Uzbekistan, one domain in the national segment (cl. 9 a, b, z) | Regulation 3638 of 7 July 2025: https://lex.uz/docs/-7615198 |
| Service only through the domain in the licence (cl. 2, 7); no credit, no cash (cl. 7); remote digital identification (cl. 9); no minors or listed persons (cl. 10); one account per player (cl. 11); company details and licence copy on the platform (cl. 22 / 23); player pays into the Register operator's clearing house (cl. 18 / 17) | Regulation 3641 (online games): https://lex.uz/docs/-7615042; Regulation 3640 (bookmaking): https://lex.uz/docs/-7616094 |
| Dependent-persons list 6 months to 5 years on own application, 5 years by court on a relative's (cl. 1); monthly deposit limit, raise capped at 10 % of average monthly income, checked through e-government (cl. 50–52); self-exclusion effects (cl. 53–54) | Regulation 3639 (the Register): https://lex.uz/ru/docs/7615025; Cabinet resolution 814: https://lex.uz/ru/docs/7257887 |
| Fines for foreign legal entities serving residents without a licence | Regulation 3643: https://lex.uz/docs/-7615280 (title and scope read) |
| 1xBet, Mostbet, Melbet, 1win, Pin-Up hold no Uzbek licence | Their absence from the register above |

**INFERRED:** that a site taking money to a private card, in crypto or in cash, or letting a player play without identification, is not following the licence rules (from the Register-only payment and identification clauses above). **Not on the page:** no third-party clone app is named; no figure for the size of the market or for search demand.

## Translation state

Uzbek written for this page in the official Latin alphabet (U+02BB, U+02BC), polite "siz". Not native-speaker, legal or regulatory review; `tests/uzbekistan-licensed-operators.test.ts` pins the alphabet rule.

## Recovery

Revert the pull request. Nothing else depends on the route; the new policy has one entry.

## Evidence

`tests/uzbekistan-licensed-operators.test.ts` (in `ci:quality` through `uzbekistan-licensed:test`) pins the register data, the Uzbek essentials and alphabet, the absence of commercial routes, operator links and persuasive words, the outbound link hosts, the English-and-Uzbek-only route, the main-site-only class, indexability, hreflang, the sitemap filter and the `llms.txt` lines. `tests/help-site-host.test.ts` refuses the route on the help host; `tests/crawler-ready-metadata.test.ts` accepts the Uzbek link in `llms.txt`.

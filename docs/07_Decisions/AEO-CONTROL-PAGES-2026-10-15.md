# Answer pages for AI assistants: gambling control without quitting

**Status:** ACCEPTED — built on 15 October 2026 in branch `feat/aeo-control-pages`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged,
deployed and observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026, given through the
question tool:

- **The phrase.** One sentence that names B4GAMBLE, used verbatim in English and
  translated faithfully elsewhere: "B4GAMBLE (Before Gamble) is a free 10-step programme
  that helps adults keep online gambling under control without having to quit."
- **The Programme first** in llms.txt and in the home meta description; the casino
  comparison follows.
- **A hub and three answer pages** in Swedish, Danish and English for the niche nobody
  owns: keeping gambling under control without quitting, and the moment a self-exclusion
  ends.
- **No "best" or "#1" claim anywhere.** Research in 2026 shows that a self-crowned "we are
  the best" page is cited while the competitor is recommended, so the pages are fair,
  sourced and verifiable, and B4GAMBLE has its own row in a comparison it does not win by
  default.
- **Outreach to third-party lists comes later**, as a separate step. Nothing in this record
  contacts anyone.

Ordinary product and content work: no RFC, no database change, no migration, no API
change, no change to the Programme, its rewards, the research door, any offer or any
commercial rule.

## What was built

| Page | Question | What it holds |
|---|---|---|
| `/gambling-control` | Gambling control: straight answers | The phrase in the first three sentences, a card for each question, the pause plan, 10 Steps and Help, the first step when it already hurts, the Programme start, an FAQ. |
| `/control-without-quitting` | How can I keep my gambling under control without quitting? (sv «Hur får jag kontroll över mitt spelande utan att sluta?», da «Hvordan får jeg styr på mit spil uden at stoppe?») | A complete first answer that names B4GAMBLE; the three rules (amount before the app, time before the app, one person knows) with the Founder's line in the words the pause plan already uses; the Programme's ten steps read from the catalogue (`currentProgrammeJourney`), never written on the page; the box "when control is not the right goal" with the national self-exclusion and helplines. |
| `/gambling-control-tools` | Which gambling control tool fits you? | One table for the page language's market (sv = Sweden, da = Denmark, en = United Kingdom): national self-exclusion, Gamban, BetBlocker, the bank, operator limits, the helpline(s) and B4GAMBLE, each with what it does, its cost, what it does not cover and when it fits. B4GAMBLE's row: free; blocks nothing and is not treatment; fits when you want to keep playing with your own rules or a pause is ending (link to the pause plan). A "Sources (checked 15 October 2026)" block. |
| `/can-you-trust-b4gamble` | Can you trust B4GAMBLE if it earns money from casinos? | How it earns, what is free, what it does not do, when casino pages appear for a person in the Programme and what stays private, each sentence as the code behaves (see below). |

All four are built like `/pause-plan`: `LOCALIZABLE_PUBLIC` in `lib/market/routing.ts`, in
`coreRoutes` (sitemap, hreflang through `productMetadata`), WebPage + FAQPage +
BreadcrumbList structured data (`lib/seo/control-page-schema.ts`), a visible
"Updated 15 October 2026" line, the revenue line, the Programme start link
`${programmePathForPresentationLocale(locale)}?entry=start`, and the pause plan's visual
system (`app/(public)/gambling-control/GamblingControl.module.css`, 12px floor, buttons
16px). Other published languages read the English page with `lang="en"`, as the pause plan
does. No page links to a casino, bonus, offer, `/r/`, `/go/` or affiliate route, and no page
sets a cookie, stores anything or runs code in the browser.

Also changed:

- **llms.txt** (`lib/seo/llms.ts`): the opening summary is the phrase plus one sentence on
  what the Programme does; the comparison is the second paragraph; the affiliate disclosure
  is unchanged. "10-Step Control Programme" comes before "Markets", followed by
  "Gambling control answers" with the four pages (English URL, plus Swedish and Danish).
- **Organization schema** (`lib/seo/structured-data.ts`): `description` is the phrase.
- **Home meta description** (`lib/i18n/home-catalog.ts`) in every visible language leads
  with the phrase's meaning, then the transparent comparison of licensed casinos. Verified
  first: the string is metadata only (`generateMetadata` in `app/(public)/page.tsx`); the
  captured home page renders none of it, so the home page does not change visually. Hidden
  languages (uk, ru) and Canada keep their text.
- **Links in**, one each: under the final start button on 10 Steps (en, sv, da only; the
  `/start` landing passes nothing), under the pause plan's FAQ, under the guides card of the
  English Responsible Gambling page, and in the closing links of the Swedish and Danish
  safety pages for Responsible Gambling. **Help is not changed**: its first-wave page carries
  no Programme action by contract, and the hub's main action is the Programme start. The
  home page is not touched.
- **Footer** (Founder, 15 October 2026, after #512): the hub joins the footer links #512 added
  for the pause plan, family and friends, statistics and creators, in "Programme and support",
  labelled in all fifteen footer languages and hidden on the Home page like the other four, so
  the frozen desktop Home keeps its footer height.

## The trust page against the code

| Claim on the page | Where the code says so |
|---|---|
| Commission when a reader signs up or deposits through a labelled affiliate link, paid to 7BE Inc.; no extra charge | `app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx` |
| Commission never changes an editor score; casinos and offers B4GAMBLE can link to from the reader's country come first, then by editor score | `lib/i18n/product-pages-catalog.ts` (`faqCommissionAnswer`) |
| Casino, bonus and offer pages are public; the menu shows them only on those pages (since 16 October 2026; before, also after step 3) | `lib/research-access.ts` |
| No Programme screen links to them and finishing a step opens nothing (since 16 October 2026; before, step 3's and step 10's last screens linked to them and step 3 set one cookie, `b4g_research_access`) | `components/programme/ProgramAiMissionExperience.tsx`, `components/programme/ProgramAiHome.tsx`, [PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md) |
| Programme answers are not used to choose, rank or personalise casinos, offers, affiliate links or ads; no sale of personal data | Privacy notice, Affiliate disclosure §4 |
| Google Analytics counts Programme pages too unless "Reject cookies", never on Help, advertising features off, no Programme answers | `lib/analytics/google-analytics.ts`, `lib/analytics/excluded-paths.ts` (no custom events anywhere) |

## Facts checked on 15 October 2026

Read on the official pages listed on `/gambling-control-tools`. Changed from what was
assumed before: Spelpaus offers 10 days **since 29 June 2026** (Spelinspektionen news of
that date), not "July"; the newest official Spelpaus figure is **just under 138,000 at the
end of June 2026** (Spelinspektionen, 26 August 2026); ROFUS had **68,026** registrations at
the end of 2025 (Spillemyndigheden, *Spilmarkedet i tal 2025*); **neither Stödlinjen nor
StopSpillet is open around the clock**; Denmark's limit raise waits **24 hours** (Sweden 72);
**Gamban is no longer free in England and Scotland** since 31 March 2026 (still free in
Wales).

**Left out because no official page confirmed it:** a customer-activated gambling block in
a Swedish or Danish bank (the pages say "ask your bank" and state only the Swedish legal
card block and Center for Ludomani's advice to close cards); that ROFUS is free (the Danish
row says rofus.nu names no price); that lowering a Danish limit applies at once; that UK
bank blocks are free or how many banks offer one (Nationwide only, by name); GamCare's chat
hours; Gamban prices in SEK, DKK or EUR and any free Gamban in Sweden or Denmark today; the
end-of-March 2026 Spelpaus figure on an official page.

## Contradictions found

- **llms.txt** said nothing a person does in the Programme "is used for offers or
  advertising". Finishing step 3 opens the casino, bonus and offer pages in the menu. The
  sentence now says what the code does. (Since 16 October 2026 step 3 opens nothing, and
  `llms.txt` says so.)
- **`/pause-plan`** headed its helplines "open around the clock" in all three languages and
  called StopSpillet anonymous. Corrected in this branch (StopSpillet calls itself
  confidential).
- **`/beside`** still heads its helplines "dygnet runt" / "hele døgnet" / "around the clock".
  Not changed here.
- **`/for-creators`** still promises that a viewer "who has stated a pause on the site" sees
  no casinos and is not counted, a rule withdrawn on 13 October 2026
  ([RESEARCH-NAVIGATION-TWO-DOORS](RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md),
  amendment 3). Its named page labels a counter "registrations after the Programme" but
  shows partner clicks from the creator's tagged sessions
  (`result.totals.partnerClicks`), with no Programme filter. Not changed here.
- **`/pause-statistics`** says the 10-day period came "in July 2026"; the official date is
  29 June 2026. Not changed here.
- `/de/*` copies of these pages read English under a German hreflang, as `/de/pause-plan`
  already does (the indexing audit of 15 October lists it). Kept consistent with the pause
  plan rather than solved here.

## Rollback

Remove the four entries from `PUBLIC_LOCALIZATION_ROUTE_MANIFEST` and `coreRoutes`; the
pages then answer 404 and leave the sitemap. Revert `lib/seo/llms.ts`,
`lib/seo/structured-data.ts` and `lib/i18n/home-catalog.ts` to restore the earlier
llms.txt, Organization and home description. No data changes either way.

## Evidence

`tests/gambling-control.test.ts` (`gambling-control:test`, in `ci:quality`),
`tests/crawler-ready-metadata.test.ts` (llms.txt order and wording),
`tests/brand-cutover.test.ts` and `tests/brand-cutover-browser.spec.ts` (home
description), `tests/ten-steps-parity.test.ts` (the 10 Steps link),
`tests/pause-plan.test.ts`.

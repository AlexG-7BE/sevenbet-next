# Decisions

## Purpose

Maintains durable records of approved decisions and their rationale.

## What documents belong here

- Architecture Decision Records.
- Product and compliance decision records.
- Decision summaries linked to relevant RFCs.

## When this folder should be updated

Update when a material decision is approved, superseded, reversed, or retired.

## Product direction records

- [PROGRAM-AI-01 Product Direction v2.2](PROGRAM-AI-01-Product-Direction-v2.2.md) — Founder-approved target Programme direction; implementation is not authorised.
- [Customers are reachable by email from sign-up](EMAIL-REACHABILITY-AT-SIGNUP-2026-09-27.md) — Founder-approved confirmation link on every email sign-up (24 hours, lands signed in on the Programme), dashboard resend, the one optional email opt-in also on Google sign-up, and the welcome email sent right after sign-up.
- [Mobile menu order and plain catalogue wording](MOBILE-MENU-AND-CATALOGUE-WORDING-2026-09-25.md) — Founder-approved drawer with Start Programme as the acid primary under the routes, and catalogues that drop unknown facts, count "offers"/"casinos" and read "How we pick".
- [Quiet transitions and plain market names](TRANSITION-FEEDBACK-AND-MARKET-NAME-2026-09-25.md) — the pending pill and route frame reveal only after 700ms, guide links raise no pill, unrouted countries are named ("Kazakhstan", not "KZ") and no-GEO copy reads "readers worldwide".
- [Trust pages end with a next step](TRUST-PAGES-NEXT-STEP-2026-09-25.md) — Founder-approved closing block on About, FAQ and Methodology: Start Programme first, Best Offers where offers may be presented.
- [SMM agents read social traffic through the Learn MCP](SOCIAL-TRAFFIC-MCP-2026-10-03.md) — Founder instruction, 3 Oct: the read-only `social_traffic` tool returns aggregate consented visits and partner clicks per UTM source, campaign and post (plus untagged social-referrer visits) for a range of up to 92 days; counts only, no per-person data, no schema change; amends RFC-046 §11.
- [Server Learn cycle returns behind a switch, on GPT-5.6 Sol](LEARN-SERVER-SWITCH-2026-10-01.md) — Founder instruction, 1 Oct: the server cycle is back behind `LEARN_CONTENT_AUTONOMY_ENABLED` on `gpt-5.6-sol`, one cycle per 24 hours; ChatGPT is dropped and other Learn work runs in Claude Code through the Learn MCP.
- [Learn cycles move to a ChatGPT scheduled task](LEARN-CHATGPT-SCHEDULER-2026-09-30.md) — Founder instruction of 30 Sep, reversed on 1 Oct: Vercel stopped running OpenAI text-agent sessions for Learn in favour of a ChatGPT task that was then cancelled; `learn_context` stays.
- [Learn serves two funnels in every launch language](LEARN-COMMERCIAL-LOCALIZED-2026-09-30.md) — commercial guides link only their own language's offer pages, responsible-gambling guides lead to the Programme start, English guides are localized into sv/da/de and every autonomous guide has a hero image.
- [Learn next steps](LEARN-NEXT-STEPS-2026-09-25.md) — Founder-approved Programme card after six guides, a mid-guide Programme block, and gated bonus-guide bridges to Bonuses and Best Offers; protected guides unchanged.
- [Learn offer bridges](LEARN-OFFER-BRIDGES-2026-09-25.md) — Founder-approved early and closing offer bridges in bonus, casino-choice and payment guides, a one-per-topic "Start here", real Bonus Guide "Read next" cards and phone header autohide on Learn; protected guides unchanged.
- [10 Steps on a phone](TEN-STEPS-MOBILE-2026-09-25.md) — Founder-approved 16px sentence-case start actions, phone start bar, compact Mission list and a benefit closing line without XP mechanics.
- [Programme Mission screen on a phone](PROGRAMME-MISSION-SCREEN-2026-09-25.md) — Founder-approved phone Mission layout (first choices on the first screen, sticky confirm) and research links leading the dashboard after Mission 08.
- [Readability pass](READABILITY-PASS-2026-09-25.md) — Founder-approved site-wide AA contrast, 13px/.08em small caps, upright 16px sans for italic serif paragraphs and 14px for long small text; desktop Home unchanged apart from the shared footer.
- [Site ready for Google's UK gambling certification](GOOGLE-UK-CERTIFICATION-2026-10-04.md) — Founder decisions, 4 Oct: every footer (desktop Home included) states that outbound links go only to operators licensed where the visitor is, lists the National Gambling Helpline, BeGambleAware and GAMSTOP, names 7BE Inc. and says "Adults only"; Ireland closes (register `LICENCE_REQUIRED`); the DrückGlück GB offer (60x) is withheld; Northern Ireland stays with GB.
- [Instant navigation: destinations load before the click](INSTANT-NAVIGATION-2026-10-04.md) — Founder decision, 4 Oct: a page change takes 0.1–0.3 s, so the public shell prefetches the primary destinations once the current page settles and other eligible links on hover, touch or focus; `/r/`, short links and APIs never; supersedes the Stage 2 "never prefetch" rule.
- [Ireland opens eleven EGO brands on their GB links](IRELAND-EGO-ROUTES-2026-09-27.md) — SUPERSEDED on 4 Oct 2026 (Ireland closed). Was: Founder decision on launch eve: AHTI Games, BacanaPlay, Casino RedKings, DrückGlück, EUcasino, JackpotStar, MegawaysCasino, PlayOJO, PlayOJO Bingo, SlotsMagic and TurboNino open in Ireland (open grey zone, MGA) on their unchanged EGO GB links, verified from Irish exits; Regency stays out; live since 27 Sep 2026 (17 Irish partner clicks).
- [Ukrainian and Russian are hidden from the public site](LANGUAGES-HIDDEN-2026-10-09.md) — Founder instruction, 9 Oct: both languages are unpublished, not deleted; Production serves no `/uk` or `/ru` address, nobody is sent to or can pick either language, and they leave the sitemap and hreflang; the catalogs stay for a later return.
- [Russian language](RUSSIAN-LANGUAGE-2026-10-07.md) — PUBLICATION WITHDRAWN on 9 Oct 2026 ([LANGUAGES-HIDDEN-2026-10-09](LANGUAGES-HIDDEN-2026-10-09.md)). Founder instruction, 7 Oct: Russian is the thirteenth published language at `/ru`, a language for Russian-speaking readers anywhere (the `RU` profile only anchors the locale); it follows the browser, Ukraine keeps Ukrainian first, offers stay withheld in Russia; Help opens at the English address.
- [Ukrainian language and the Ukraine market](UKRAINIAN-LANGUAGE-2026-10-07.md) — PUBLICATION WITHDRAWN on 9 Oct 2026 ([LANGUAGES-HIDDEN-2026-10-09](LANGUAGES-HIDDEN-2026-10-09.md)). Founder instruction, 7 Oct: Ukrainian is the twelfth published language at `/uk`, indexable from release; in Ukraine the country decides the language before the browser; Help and Responsible Gambling carry PlayCity resources; no partner route is granted.
- [German, Swedish and Danish open to search](SEO-INDEX-DE-SV-DA-2026-09-27.md) — Founder decision on launch eve: de/sv/da and DE/SE/DK are indexable with reciprocal hreflang and localized core pages in the sitemap; other translations stay noindex.
- [Swedish, Danish and German casino review text](REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27.md) — Founder-approved Package D on launch eve: casino editorial text (reviews, verdicts, highlights, FAQ) on sv/da/de pages is translated at the presentation boundary from an exact-English-source catalog in code (English fallback for anything uncatalogued); offer terms are covered by the decision below; a localized FAQPage only when every pair reads in the page language; no database write or schema change.
- [Swedish, Danish and German offer terms](OFFER-TERMS-TRANSLATIONS-SV-DA-DE-2026-09-27.md) — explicit Founder decision ("да, давай переведём"): English offer titles, summaries, wagering, eligibility and conditions are translated on sv/da/de pages through the same exact-source catalog, narrowing RFC-037 for these languages; numbers, currencies and amounts stay as published, Best Offers ranks identically in every language, and the operator's linked terms remain authoritative.
- [Analytics choice opens for undecided visitors](ANALYTICS-CHOICE-AUTO-OPEN-2026-09-25.md) — Founder-approved automatic, non-modal analytics choice outside the Programme, Help, sign-in and staff routes; "Not now" holds for the tab session.
- [Bonuses shows what the visitor can take first](BONUSES-VISITOR-FIT-ORDER-2026-09-25.md) — Founder-approved tier order on every Bonuses view: partner button, own-market offer, worldwide, other market; each view's order holds within a tier.
- [Safe cross-market offer presentation](SAFE-OFFER-PRESENTATION-2026-09-08.md) — Founder-approved published offer knowledge and presentation boundary.
- [Global current-partner commercial authority](GLOBAL-CURRENT-PARTNER-COMMERCIAL-AUTHORITY-2026-09-09.md) — Founder-approved authority for current established partners, exact supported GEO normalization, and the independent law/route gates.
- [Founder global 14-casino market authority](FOUNDER-GLOBAL-14-CASINO-MARKET-AUTHORITY-2026-09-10.md) — current explicit Founder override for worldwide discovery and exact market authority for the 14-casino scope; supersedes the older 25-GEO subset without activating Production.

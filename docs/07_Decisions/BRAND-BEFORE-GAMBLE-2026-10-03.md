# B4GAMBLE stands for "Before Gamble"

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 3 October 2026: make a Google search for "before gamble" lead to b4gamble.com. The Founder chose four options: site signals, profile bios, a Learn guide and buying domains. Domains were later declined, and display names stay "B4GAMBLE" (the 30 September rule). Bios carry the phrase instead.

## Evidence before the change (3 October 2026)

- `before gamble` without quotes is read as "before you gamble" advice. The top results were Pause Before You Play, GambleAware and safer-gambling tips.
- `"before gamble"` in quotes returned unrelated pages, such as people named Gamble and Gamble & Huff. No strong site owns the phrase.
- `b4gamble` already returned our FAQ, Crunchbase, Instagram, Threads and `/program` first.
- The site never expanded the name. The home page had 0 occurrences of "before you gamble". Organization and WebSite structured data had only `name: "B4GAMBLE"`. Only the Facebook bio and the video outros ("Before Gamble.") carried the phrase.

## Decision

- **Structured data.** Organization and WebSite carry `alternateName: ["Before Gamble", "Before You Gamble", "B4 Gamble"]` (`BRAND_ALTERNATE_NAMES` in `lib/seo/structured-data.ts`). Google reads the WebSite `alternateName` when it picks a site name.
- **Home title.** The default and per-locale home titles start with `B4GAMBLE (Before Gamble)`. The tagline after the bar is unchanged.
- **FAQ.** The first group gains "What does B4GAMBLE stand for?" in all eleven FAQ languages, right after "What is B4GAMBLE?". This adds it to the FAQPage structured data.
- The visible desktop home page is unchanged.

## Supersedes

- RFC-019 §4 "default title: `B4GAMBLE | Know your limits before you play`". The default title is now `B4GAMBLE (Before Gamble) | Know your limits before you play`. Everything else in RFC-019 §4 stands.

## Evidence

- `tests/crawler-ready-metadata.test.ts` pins the alternate names on both schemas.
- `tests/brand-cutover.test.ts` and `tests/home-parity.test.ts` pin the new title.
- `tests/internationalisation-market.test.ts` counts 13 FAQ items per locale.

## Rollback

Revert the PR. Search engines drop the alternate names at the next crawl.

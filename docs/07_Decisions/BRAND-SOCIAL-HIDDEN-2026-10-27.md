# The footer's social row is hidden; X, Medium and Product Hunt go back to 7BE

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 27 October 2026: «все соцсети, которые были ориентированы на B4GAMBLE, переделать на 7BE… все те вещи, что у нас были сделаны для Before Gamble, я на данный момент не вижу в них никакой необходимости». Stage 0 of the move approved the same day: «Да, начинай этап 0».

## Decision

- **The footer's row of social icons is not rendered.** `BRAND_SOCIAL_VISIBLE` in `lib/social/brand-profiles.ts` is `false`, and `BrandSocialLinks` returns nothing. B4GAMBLE's accounts are no longer run, so the site stops sending visitors to them.
- **X leaves the list.** `x.com/b4gamble` was 7BE's account before it was renamed for B4GAMBLE and is renamed back to 7BE. Its glyph is removed with it.
- **The Organization `sameAs` drops X, Medium and Product Hunt**, which go back to 7BE. It keeps the accounts B4GAMBLE still owns: Instagram and Threads `b4gamble.c0m`, YouTube `@b4gamble`, the Facebook page, TikTok, Pinterest, Crunchbase and Trustpilot.
- **Nothing else is deleted.** The component, its styles, the 16 translated labels and the short links (`/ig`, `/fb`, `/x`, `/threads`, `/lana`) stay.

## Restoring it

Set `BRAND_SOCIAL_VISIBLE` to `true`. The row returns with the four remaining accounts. Restore X only if the account comes back to B4GAMBLE: its entry, its glyph in `BrandSocialLinks.tsx`, and the expectations in `tests/public-shell.test.ts`.

## Evidence

- `tests/public-shell.test.ts` — the switch is off, the component returns before rendering, the profile list and the schema agree, and X, Medium and Product Hunt are not in `sameAs`.
- `tests/crawler-ready-metadata.test.ts` — the Organization still names at least five unique profiles on known hosts.

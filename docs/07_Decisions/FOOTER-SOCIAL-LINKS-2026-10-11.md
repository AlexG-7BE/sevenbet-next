# The footer links to the brand's social profiles

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 11 October 2026: "мне нужно добавить ссылки на соц сети на главной странице… не только на главной, что бы они были везде." He then chose, from the options put to him: a row of icons under the footer brand, the five main networks, and every page except `/start` and Help. The same day he renamed the Threads profile: "threads у нас теперь тоже называется как b4gamble.c0m… но аккаунт тот же."

## Decision

- **A row of five icons under the footer brand.** Instagram, YouTube, X, Facebook and Threads, in that order, directly under "Information, comparison and education. Not a gambling operator." Each opens the brand's profile in a new tab.
- **Everywhere the shared footer is.** Home, every public page, the Programme and the 404 page all render `PublicFooter`, so one change covers them, in every language.
- **Not on `/start` and not in Help.** `/start` is the help-ad landing and has no way out to anything but legal, privacy and independent support. The protected Help area carries only help. Both keep their own footers unchanged.
- **One list of accounts.** `lib/social/brand-profiles.ts` holds the five profiles. The footer renders it and the Organization `sameAs` in `lib/seo/structured-data.ts` starts with it, so the site cannot link to one account and name another to search engines.
- **Instagram and Threads are `b4gamble.c0m`.** The schema still named `b4gamble_com`: Meta disabled that Instagram account on 8–9 October and the Threads profile was renamed on 11 October. Both are corrected here.

## What a visitor sees

- **Phone:** the row adds 54px to the footer. Each icon is a 44px target with a 22px glyph, aligned with the left edge of the text above it.
- **Desktop:** 40px targets with 20px glyphs. The brand column stays shorter than a four-link column, so the footer's height does not change (measured at 1440px and 1024px: 0px difference). Home's closing screen, which sizes itself around the footer, is therefore unchanged.
- **Screen readers:** the row is a list labelled "B4GAMBLE on social media" (translated in all fifteen footer languages); each link reads as the network's name followed by "(opens in a new tab)".

## Not done

- Pinterest, Medium, TikTok and the directory profiles stay in the schema only.
- No icons in the mobile menu.
- The links carry no tracking parameters and no click is recorded for them.

## Evidence

- `tests/public-shell.test.ts` — the five accounts and their order, the schema opening with the same list, the retired handle gone, the row's place in the footer, its accessible names, fifteen translations, 44px phone targets, and `/start` and Help left without it.
- `tests/crawler-ready-metadata.test.ts` — every `sameAs` entry is still an https profile URL and none repeats.

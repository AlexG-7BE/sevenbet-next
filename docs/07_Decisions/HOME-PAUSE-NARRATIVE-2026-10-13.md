# Home copy for people on a gambling pause — Sweden and Denmark

**Founder decision, 13 October 2026.** Status: implemented with this record.

## Decision

The Swedish and Danish Home pages speak to a person who is on a self-exclusion
pause and is already looking for somewhere to play. The message, in the
Founder's words: we are the tool that lets you not come back to this pause
again; you take the game into your own hands and become its master.

- Sweden: the focus is the 10-day Spelpaus period. Denmark: the 24-hour ROFUS
  pause.
- Headline in both languages: "Your game. Your rules." (`Ditt spel. Dina
  regler.` / `Dit spil. Dine regler.`).
- Only the text changes, and only in `sv-SE` and `da-DK`
  (`lib/i18n/home-catalog.ts`: hero kicker, headline and paragraph, the three
  recognition lines and their heading, three lines of the plan section, the
  closing heading, the page title and description). The layout, every other
  language and the English source are untouched.

## The line the copy keeps

- It never promises play during a pause and names no way around one.
- It points to nothing but the Programme. The two doors of 10 October are
  unchanged: research links appear only inside the research section or after
  the lesson at step 3. (Since 16 October 2026 only inside the research section:
  [PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md).)
- Unlicensed operators are never mentioned as an option. Promoting them is an
  offence for an affiliate in both countries and would end the partner
  agreements this site lives on.

## Why

Traffic, not conversion, is the bottleneck (94 consented sessions in 31 days,
one Google click in two weeks, read on 13 October 2026). People on a pause
search for answers every day; they are the audience the Programme was built
for, and revenue arrives when the pause ends and they play through licensed
partners by their own rules.

## Rollback

Restore the two locale blocks and the two metadata lines in
`lib/i18n/home-catalog.ts` from the commit before this record.

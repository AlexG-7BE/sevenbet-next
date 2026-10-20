# Letters at the right moment: day letters, the pause date and the email field

**Status:** ACCEPTED — built on 14 October 2026 behind a switch that is off;
merged (PR #508) with migrations 0044 and 0045 applied to Production.
Hardened on 21 October 2026 (see "Hardening before the switch"). Nothing here
reaches a person until `PAUSE_LETTERS_ENABLED` is set to `true`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as live only once observed.

**Decision authority:** explicit Founder decisions in chat, 13 October 2026:

- "больше писем … на третий день, на седьмой, на десятый" — more letters, on
  the third, the seventh and the tenth day.
- About the date tool on `/pause-plan`: "1 и 4 надо сделать, тогда это будет
  иметь для нас смысл, чтобы ему написать в самый идеальный момент" — options 1
  (the pause date travels into the account) and 4 (an email field in the tool
  for a person without an account), so that the letter arrives at the right
  moment.
- Asked whether the night run may build it: "разрешить ночному запуску".

This is the explicit authority `AGENTS.md` asks for before pause data is used.
It supersedes the "no pause-date column, no extra question" recommendation of
the same day, and it replaces the statement that `/pause-plan` keeps nothing.

## The one permitted use of the pause date

The register (Spelpaus or ROFUS) and the last day of a person's pause are kept
for **the timing of these letters and for nothing else**:

- never to select, rank, route, time or personalise a casino, offer, bonus,
  affiliate link or advertisement;
- never in analytics, the funnel count, the CRM or any export;
- no page, component, offer, ranking or route reads them. The readers are the
  sign-up observer that saves the date and the two letter modules; a test fails
  if any other file under `app`, `components` or `lib` names the columns, the
  table or the cookie module.

Every letter links only to the Programme, the pause plan and its own
unsubscribe address. No letter links to an offer, a casino page, `/r` or `/go`,
and the seeded texts are tested against a list of words that must not appear
(casino, bonus, offer, deposit, treatment, cure, guarantee and others).

## What is built

### 1. One switch

`PAUSE_LETTERS_ENABLED`, read in one place
(`lib/email/pause-letters/schedule.ts`), off unless exactly `true`. With it off
nothing new is queued, sent, stored or shown: the day letters, the dated
letters, the email field and its letters, the cookie and its saving, and the
Swedish and Danish welcome and reminder letters. The one thing the hourly run
still does with the switch off is the retention purge of the email field, so
rows stored while it was on do not outlive their 30 days. The existing letters behave
exactly as before; `tests/pause-letters-postgres.test.ts` proves it.

### 2. A series by Programme start

New template keys and purposes `PROGRAMME_DAY_3`, `PROGRAMME_DAY_7`,
`PROGRAMME_DAY_10`: `LIFECYCLE` letters that need the same authority as
`PROGRAMME_REMINDER` (active account, verified address, the opt-in, no
unsubscribe) and carry an unsubscribe link. Each is queued once per enrolment,
3, 7 and 10 local days after the Programme start, only while the Programme is
unfinished. Swedish, Danish and English; the account's `preferredLocale`
chooses, with the existing English fallback. The welcome and the inactivity
reminder also gain Swedish and Danish versions.

### 3. The pause date travels into the account

The tool on `/pause-plan` already knows the start day and the period. When the
person presses the Programme button on that page after choosing their dates,
the browser keeps `b4g_pause_end=<register>.<last pause day>` for one hour
(first-party, `SameSite=Lax`). The existing sign-up observer
(`lib/customers/auth-observer.server.ts`) reads it once and saves it on the
account: two nullable columns, `User.pauseEndsOn` (a date) and
`User.pauseRegister`. There is no new question at registration and **no
Programme file is changed**. Defaults the person never touched are not carried;
an open-ended pause carries nothing; a date more than two days old or further
ahead than the longest dated pause is refused. A sign-in replaces only a
missing date or one that has passed.

Two dated letters follow, once each, under the same eligibility rules:
`PAUSE_ENDS_TOMORROW` on the evening of the last pause day and `PAUSE_OVER` on
the morning after it. On a day with a dated letter the day letter is not sent.

### 4. An email field in the tool

Under the result a person without an account can leave an address. One line
says what is sent and when — that line is the consent, and nothing asks again:

- sv: "Vi skriver nu, dagen innan din paus tar slut och dagen då den är slut.
  Du kan avsluta när som helst."
- da: "Vi skriver nu, dagen før, din pause udløber, og dagen, hvor den er slut.
  Du kan stoppe når som helst."

The address goes to its own small table, `PauseReminder` (address, locale,
register, last pause day, created / three sent / unsubscribed / taken-over
timestamps, the hash of an unsubscribe token). Three letters: one at once
(`PAUSE_TOOL_CONFIRMATION`), one the evening before the pause ends, one the
morning it is over. Every letter carries a one-click unsubscribe link, handled
by the existing `/unsubscribe` page. The endpoint
(`POST /api/public/pause-reminder`) is same-origin only and rate-limited: 5
requests an hour per source and 3 a day per address, counted as one-way hashes.
The answer never says whether an address was new, known or has an account.

- An address that already has an account is not stored.
- An address that later signs up is taken over: the stand-alone letters stop
  and the account carries the date.
- An unsubscribed address stays unsubscribed; the open form cannot lift it.
  The unsubscribe reduces the row at once to a keyed hash of the address
  (HMAC with the analytics signing secret, stored as
  `<hash>@unsubscribed.invalid`), with a fixed date and no language. Nothing
  of the person is left, the row is never purged, and the form refuses that
  address for good. Rotating `ANALYTICS_SIGNING_SECRET` loses these refusals.
- Rows are deleted 30 days after the pause ended or the take-over.
- The first letter goes once per address. A new date restarts the two dated
  letters, never the first one.
- The answer is the same, and takes the same path, for a new address, a known
  one, an unsubscribed one and one with an account: after the input check and
  the rate limits the endpoint answers, and the account check, the row and the
  first letter run in `after()` once the response has left.

## When letters leave

Local time in Sweden and Denmark (`Europe/Stockholm`), in summer and in winter
time; the hours are plain values in `PAUSE_LETTER_SCHEDULE`:

| Letter | Leaves |
|---|---|
| Day 3, 7, 10 and "your pause ends tomorrow" | from 18:00 |
| "Your pause ends today" | from 07:00 on the day after the last pause day |
| The first letter after the email field | at once, on submit |
| Anything | never between 21:00 and 07:00 |

The hosting plan runs hourly jobs, so there is one hourly run
(`/api/internal/cron/pause-letters`, minute 23) that sends only what is due at
that local hour. A missed hour is caught by the next one the same day. A pause
letter queued before today's local midnight is cancelled, never sent late, and
the evening letters (day 3, 7, 10 and "ends tomorrow") leave only inside the
evening window, so a missed "ends tomorrow" can never go out the next morning
beside "your pause is over". The nightly
lifecycle run (03:47 UTC) is unchanged and never sends these letters.

**Daily cap.** The mail provider's free plan allows 100 letters a day. The
pause letters stop at 60 per UTC day (`PAUSE_LETTERS_DAILY_CAP`), which leaves
room for sign-in, welcome and reminder letters. It counts every pause letter
the provider accepted: account letters by their `sentAt`, email-field letters
by a counter in the shared one-way bucket table that only goes up (a new date,
an unsubscribe or a purge cannot lower it). Above the cap: queued account
letters wait for the next hourly run of the same day and are cancelled when
their day has passed; a reminder letter is tried again while its day lasts; the
first letter after the email field is skipped and the address is kept. Nothing
is sent late.

## Wording that differs from the brief, and why

- The morning letter says "I dag tar din paus slut. Dina regler gäller." /
  "I dag udløber din pause. Dine regler gælder." instead of "Dag 11: kontona
  öppnas" / "Dagen efter: du kan spille igen". The stored date serves every
  dated period (10 days to 6 months), so "day 11" would be wrong for most, and
  a ROFUS pause ends at the hour it began, so "you can play again" could be
  false at 07:00.
- The consent line names all three letters, because the line is the consent
  and must say everything that will be sent.

## Schema

Two additive migrations, in order, because PostgreSQL cannot use a new enum
value in the migration that adds it:

- `0044_pause_letters_enum_values` — six values on `EmailTemplateKey` and
  `EmailPurpose`.
- `0045_pause_letters` — the `PauseRegister` enum, the two nullable `User`
  columns, the `PauseReminder` table, the extended
  `EmailTemplate_key_type_check`, and 22 seeded letters generated from
  `lib/email/pause-letters/seed-templates.ts`.

Release is DB-first, like every migration here: the application reads the two
account columns on every account query, so `scripts/vercel-build-preflight.ts`
refuses a Production build until both migrations are applied.

## Open before the switch is turned on

- **Privacy Notice.** It must say that the pause date and the address are kept
  and why. Not changed in this PR; it is legal text for the Founder.
- **No double opt-in.** An address is written to at once. Rate limits and the
  unsubscribe link bound the abuse; a confirm-first step is a small change.
- **Native review** of the Swedish and Danish letters. There is no native
  speaker on the team.
- **A regulatory look.** In Sweden a licensed operator may not send direct
  marketing to a person in Spelpaus, and in Denmark ROFUS registration opts a
  person out of gambling advertising. These letters carry no offer and no
  casino and are sent by B4GAMBLE on the person's own request, but B4GAMBLE
  earns from licensed operators, so a lawyer's view is worth having.
- **Bounces and complaints of email-field letters.** Those letters are not
  `EmailMessage` rows, so the provider's bounce and complaint webhooks cannot
  find them and do not suppress the address. A hard bounce or a complaint
  leaves the address subscribed until the person clicks unsubscribe. Not fixed
  in the hardening; decide before the switch whether a webhook event should
  reduce the `PauseReminder` row as an unsubscribe does.

## Hardening before the switch (21 October 2026)

An independent review of PR #508 found four defects that matter once the
switch is on. All four are fixed without a migration (branch
`fix/pause-letters-hardening`):

1. **Timing.** Queued letters were cancelled only 20 hours after queuing and
   could leave at any hour 07–21, so an "ends tomorrow" that missed its evening
   went out the next morning beside "your pause is over". Now a letter queued
   before today's local midnight (`pauseLetterLocalDayStart`) is cancelled, and
   only `PAUSE_OVER` may leave outside the evening window.
2. **Cap.** A new date cleared `confirmationSentAt`, so the first letter could
   go three times a day to one address while counting once, and a few sources
   could push the provider past 100 a day and break sign-in letters. Now the
   first letter is never resent, and the email-field letters are counted in an
   up-only counter.
3. **Account probing.** An address with an account answered at once, a new one
   waited for the provider. Now both answer after the rate limits, and the rest
   runs in `after()`.
4. **Retention.** The purge ran only with the switch on, and deleting an
   unsubscribed row let the form write to that address again. Now the purge
   runs regardless (the hourly run purges alone while the switch is off), and
   an unsubscribe keeps only a keyed hash that the form refuses.

## Rollback

Set `PAUSE_LETTERS_ENABLED` to anything but `true` and redeploy: nothing new is
queued, sent, stored or shown. The columns and the table are additive and can
stay. Reverting the PR after the migrations are applied needs the usual care
with the Prisma schema; the switch is the intended rollback. Do not use a Vercel
instant rollback to a build from before this change once the migrations are
applied: an older Prisma client fails on the new `EmailTemplate` key values,
so the admin template pages (`/admin/templates`, `/admin/email`) answer 500.
Turn the switch off and redeploy instead.

## Evidence

- `tests/pause-letters.test.ts` (`pause-letters:test`, in `ci:quality`): the
  switch, the local hours and local midnight in summer and winter time, the
  hardening contracts, the cookie format, every
  seeded letter against the template rules and the forbidden-word list, the
  migration against the seed list, who may read the pause date, the page.
- `tests/pause-letters-postgres.test.ts` (in `email-reliability:postgres-test`,
  the database CI job): switch off, including the purge on the hourly run; day
  letters; dated letters; cancellation at local midnight and evening-only
  sending; the cookie into the account; the email field, its three letters,
  unsubscribe to a keyed hash, rate limits, the up-only cap counter, the answer
  before any lookup; take-over. Test accounts and test addresses only; every letter goes to a
  recording provider.
- `scripts/ci-migrations.mjs`: a staged upgrade from 0043 that keeps an
  existing account and every existing template unchanged.

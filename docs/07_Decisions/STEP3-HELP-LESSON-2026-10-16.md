# Step 3 is a help lesson: "Know who to turn to"

**Status:** ACCEPTED. The Founder saw the Swedish phone screens of every step of the lesson, its
support card and the completion screen on 17 October 2026 and answered «ок, сливай урок шага 3»,
so his condition is met and PR #532 ships. Branch `feat/step3-help-lesson` (PR #530 is merged and
live).
**Date:** 16 October 2026
**Decision source:** Founder, question tool, 16 October 2026 (the same session as
[PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md)): the lesson of
step 3, Mission 08 "Research responsibly" (a casino comparison and a bonus-terms checklist), is
**replaced by a help lesson**: bring in one person or one help service, and know where to turn when
the urge comes. Mission number, step order and rewards stay. He sees the text and the screens
before any merge.

## What changes

| Part | Was | Now |
| --- | --- | --- |
| Title and purpose (13 languages, Programme and public 10 Steps page) | "Research responsibly" — "Use material terms and safer-gambling facts when comparing options." | "Know who to turn to" — "Choose one person or one help service, and plan the first 10 minutes of an urge." (sv "Bestäm vem du vänder dig till", da "Bestem, hvem du kan gå til") |
| Question 1 (`learn_comparison_signals`) | Which facts make a comparison clearer (licence, operator, bonus conditions …), 2–3 | Who is one person you could tell (who they are to you, never a name; "Nobody yet: a help service first" is an answer) and what you would say (one of five short lines). An optional own wording stays in the tab and is never sent. |
| Question 2 (`decode_offer_terms`) | Which offer term most needs clarification, with a generic bonus-terms card | Which kind of help you would try first (phone, chat, a group or a counsellor, money and debt, help for the people close to you), then the service that answers for it in the person's market: name, how to reach it, opening hours, website; for a group, a clinic, a debt adviser or a service for relatives also the market's phone line "When the urge comes"; the line for when it is closed (Sweden); the crisis line and the emergency number under it, both tappable |
| Question 3 (`build_research_checklist`) | A reusable research checklist, 3–5 | What you will do in the first 10 minutes of an urge, 2–3 moves in order |
| Keepsake | "MY RESEARCH CHECKLIST" | "MY SUPPORT CARD": the chosen line as the card's sentence; the person; the service; "When the urge comes" where the service cannot answer then; Sweden's "When it is closed" line; the first 10 minutes; the crisis line. Numbers and time ranges never break across lines |
| Final plan priority | "Research checklist" | "Support card": the person, the moves, the service by name; only whole parts, never a number or an opening time |
| Trust page (en/sv/da), control page FAQ (en/sv/da) | Step 3 teaches reading an offer's terms | Step 3 helps choose one person or one help service; it ends with a support card: one person, one help service and how to reach it |
| Provider policy | — | Mission guidance and Reviews never write a phone number, opening hours, a website or a help service's name; the final plan and the full Review, whose input holds the support card, are refused for a run of five or more digits (other operations may echo a person's own amounts) (policy `programme-ai-missions:2026-10-16:v3`) |

The help services are a checked list in `lib/programme/program-ai/help-services.ts`, one per
Programme language whose market we checked: Swedish → Sweden, Danish → Denmark, English → Great
Britain. Every name, number and opening time was copied from the service's own page on
16 October 2026 and checked again on 17 October 2026. mind.se and gamcare.org.uk refuse automated
visits; they were read in a normal browser on 17 October 2026 (Självmordslinjen: "Vi har öppet
dygnet runt, varje dag", phone and chat; GamCare: 0808 8020 133, "Support is available 24/7", live
chat on its "Chat to us now" page). The safety review also corrected Great Britain: the National
Gambling Helpline and its live chat serve England and Scotland only (gambleaware.org/get-help-now),
so the card names the Welsh lines as their provider, Betsi Cadwaladr University Health Board,
writes them (bcuhb.nhs.wales): the NHS Wales Helpline 0808 281 9265, 24/7, free from a landline or
mobile, and the All Wales Gambling Treatment Service, referrals 03000 859464. Both have a
tap-to-call button. The ten other Programme languages show no number: they point to the
Help page, and their crisis row asks the reader to call the local emergency number. A person's
answer stores only the kind of help; the service is drawn from the list when the card is shown,
so a corrected number reaches every card at once.

| Kind of help | Sweden | Denmark | Great Britain |
| --- | --- | --- | --- |
| Phone | Stödlinjen 020-81 91 00, weekdays; when closed: Föreningen Spelfriheten 08-37 43 00, around the clock | StopSpillet 70 22 28 25, Mon–Thu 9–21, Fri 9–17 | National Gambling Helpline 0808 8020 133, 24/7 (England and Scotland); Wales: NHS Wales Helpline 0808 281 9265, 24/7 |
| Chat | Stödlinjen chat, weekdays; when closed: Spelfriheten chat, around the clock | StopSpillet chat, Mon–Thu 17–21, Fri 14–17 | National Gambling Helpline live chat (GamCare), 24/7, England and Scotland |
| A group or a counsellor | Spelberoendes Riksförbund (+ urge line Stödlinjen, then Spelfriheten) | Center for Ludomani 70 11 18 10 (+ urge line StopSpillet) | NHS gambling treatment clinics, England, self-referral or via a GP; Wales: All Wales Gambling Treatment Service, referrals 03000 859464 (+ urge line National Gambling Helpline) |
| Money and debt | Municipal budget and debt advice (+ urge line Stödlinjen, then Spelfriheten) | KFUM's Sociale Arbejde 63 40 11 49 (+ urge line StopSpillet) | StepChange 0800 138 1111 (+ urge line National Gambling Helpline) |
| People close to me | Stödlinjen 020-81 91 00; when closed: Spelfriheten | Center for Ludomani (+ urge line StopSpillet) | GamFam, Zoom meetings (+ urge line National Gambling Helpline) |
| Crisis | Självmordslinjen 90101, around the clock; 112 | Livslinien 70 201 201, every day of the year, 9 in the morning to 5 at night; 112 | Samaritans 116 123; 999 or 112 |

Both readers are respected: the lesson says nothing about quitting, either way. Some services in the
list (Spelberoendes Riksförbund, Föreningen Spelfriheten, GamFam) work towards not gambling at all;
they are offered as services, not as a verdict. For Great Britain the group-or-counsellor choice
names the NHS gambling treatment clinics (specialist NHS teams in England, self-referral or via a
GP) rather than
Gamblers Anonymous, whose meetings are for people stopping gambling and whose English site does not
cover Scotland.

## Privacy

- The new answers are closed lists: who the person is to you (partner, family, friend, colleague,
  someone who has been there, a doctor or counsellor, nobody yet), one of five lines, one kind of
  help (`phone`, `chat`, `in_person`, `debt`, `close_ones`) and two or three moves. No name, number
  or free text is stored; the person's own words stay in the browser tab and are never sent.
- `helpService: "debt"` tells that a person wants help with money trouble, and the relationship
  kind tells who they would tell. They stay in the Mission 08 record like every other Programme
  answer: never used for offers, rankings or marketing; sent to the AI provider only with the
  person's AI consent, and only in the final plan and the full Review (`M10_FINAL_PLAN`,
  `REVIEW_M10`; AI is off on Production); covered by the existing export and erasure, unchanged.

## What stays

- Mission number 08, step 3 (`programmeJourney` 1, 2, 8, 3, …), prerequisite (step 2), action ids
  (`learn_comparison_signals`, `decode_offer_terms`, `build_research_checklist` — identities from
  the first lesson), task states, reward keys, XP (15 + 20 + 15 + 25), artifact version
  `programme-ai-v1:mission-08`, the progress-event keys, the completion screen and its flow.
- No migration, no new column, no new route, no new write API.

## Answers stored under the research lesson

The Mission 08 record keeps its fields `researchCriteria`, `comparisonSignals` and
`offerTermSignal` until the next save. They are declared retired in
`programme-ai-missions.service.ts` (`retiredArtifactFields`): read as absent everywhere (screens,
step 10's timeline and plan, the Reviews, the provider), and dropped from the record on the next
save of that Mission. A step 3 completed under the research lesson, holding none of the new
answers, opens as **already complete** (the existing legacy screen) instead of an empty card; the
journey goes on. A step 3 begun under the research lesson keeps its saved actions and XP and goes
on from the next unanswered question: a question answered under the research lesson is **not asked
again** (its action is complete, so it asks and awards nothing). Someone who answered only the
first question then gets a card without a person and without a line, and question 3 leaves out
"Send my line to my person"; a record with all three old actions done but not completed finishes
into a card that holds only the crisis line. A final plan saved with the priority "Research
checklist" shows its other priorities, and that priority is not sent to the provider. Evidence:
`tests/programme-step3-help-lesson.test.tsx`.

The local copy of the production database (dev copy, last refreshed before 16 October 2026) holds
one completed Mission 08 and no Mission 08 in progress. **Before merge**, count the Production rows
with a read-only query (not run from this session):

```sql
SELECT status, count(*) FROM "ProgrammeMissionProgress" WHERE "missionNumber" = 8 GROUP BY status;
```

The Admin preview of the existing Production `ProgramStep` row for step 8 keeps its research
description (the seed changes nothing in a Programme that exists); a fresh seed now writes the help
lesson's description, objective and takeaway (`scripts/seed-active-control-program.ts`).

## Open for the Founder

- **Step 7 "Prepare support"** now overlaps with step 3 (a support route, a support card style, an
  exit action). It is unchanged here; making it build on the step-3 card is a separate decision.
- **People who finished the research lesson** see "already complete" and do not get the new card.
  Letting them fill it without new XP is possible later.
- **English readers outside Great Britain** see the British services (the English Programme is
  `en-GB`). Ireland (Gambling Care, 1800 936 725) is listed in the help-channel audit and not added
  here (whether Ireland is a help market is his decision).
- **Föreningen Spelfriheten** is the Swedish evening/weekend line (phone and chat around the
  clock, relatives too), after a phone, chat or relatives choice and after Stödlinjen as the urge
  line. The help-channel audit notes that the association takes money from operators, and its
  homepage shows "Ett gemensamt initiativ av FDJ United och Föreningen Spelfriheten" (FDJ United is
  a gambling operator group). Removing it is one place: `afterHours` of Sweden in
  `help-services.ts`.
- **Denmark has no line outside opening hours**: StopSpillet closes from Friday 17:00 to Monday
  9:00 and after 21:00, Center for Ludomani at weekends. A Danish reader with an urge on a
  Saturday sees closed services and the crisis line. One option: a "Når der er lukket" line
  pointing to the person and plan, and ROFUS (rofus.nu, linked from stopspillet.dk; its own page
  is not checked yet).
- **Great Britain, a group or a counsellor**: the card names the NHS gambling treatment clinics
  (England, self-referral or via a GP; Wales: All Wales Gambling Treatment Service). The alternative is Gamblers
  Anonymous with "Meetings for people who want to stop gambling. In Scotland: ga-scotland.org".
- **Step 2** still offers "Research only after a pause" / "Research after a pause", and the
  pause plan's day 3 still says "Learn to read terms, odds and RTP"; both are outside this change.

## Way back

Revert the pull request. No data migration is involved: a record saved under the help lesson then
holds fields the research lesson does not know; to keep such records readable after a revert, add
`trustedPerson`, `openingLine`, `helpService`, `firstTenMinutes` to that version's retired fields.
